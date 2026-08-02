"""
Menu Engineering Matrix — classifies items into quadrants:
  Star (high popularity, high profitability)
  Plow Horse (high popularity, low profitability)
  Puzzle (low popularity, high profitability)
  Dog (low popularity, low profitability)
Uses median-split thresholds for classification.
"""

import pandas as pd
import numpy as np
from aggregations import apply_filters


def get_menu_matrix(df: pd.DataFrame, filters: dict) -> dict:
    """Classify items into menu engineering quadrants."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return {"items": [], "medians": {"quantity": 0, "revenue_per_unit": 0}}

    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ].copy()

    if payments.empty:
        return {"items": [], "medians": {"quantity": 0, "revenue_per_unit": 0}}

    # Aggregate per item
    item_stats = (
        payments.groupby(["product", "category"])
        .agg(
            total_quantity=("quantity", "sum"),
            total_revenue=("total_sales", "sum"),
            avg_price=("unit_price", "mean"),
        )
        .reset_index()
    )

    # Revenue per unit (profitability proxy)
    item_stats["revenue_per_unit"] = np.where(
        item_stats["total_quantity"] > 0,
        item_stats["total_revenue"] / item_stats["total_quantity"],
        0
    )

    # Filter out items with very low sales (noise)
    item_stats = item_stats[item_stats["total_quantity"] >= 5]

    if item_stats.empty:
        return {"items": [], "medians": {"quantity": 0, "revenue_per_unit": 0}}

    # Median thresholds
    qty_median = float(item_stats["total_quantity"].median())
    rpu_median = float(item_stats["revenue_per_unit"].median())

    # Classify
    def classify(row):
        high_pop = row["total_quantity"] >= qty_median
        high_prof = row["revenue_per_unit"] >= rpu_median
        if high_pop and high_prof:
            return "Star"
        elif high_pop and not high_prof:
            return "Plow Horse"
        elif not high_pop and high_prof:
            return "Puzzle"
        else:
            return "Dog"

    item_stats["quadrant"] = item_stats.apply(classify, axis=1)

    items = []
    for _, row in item_stats.iterrows():
        items.append({
            "product": row["product"],
            "category": row["category"],
            "total_quantity": int(row["total_quantity"]),
            "total_revenue": round(float(row["total_revenue"]), 2),
            "revenue_per_unit": round(float(row["revenue_per_unit"]), 2),
            "avg_price": round(float(row["avg_price"]), 2),
            "quadrant": row["quadrant"],
        })

    # Summary counts
    quadrant_counts = item_stats["quadrant"].value_counts().to_dict()

    return {
        "items": items,
        "medians": {
            "quantity": round(qty_median, 1),
            "revenue_per_unit": round(rpu_median, 2),
        },
        "quadrant_counts": {
            "Star": quadrant_counts.get("Star", 0),
            "Plow Horse": quadrant_counts.get("Plow Horse", 0),
            "Puzzle": quadrant_counts.get("Puzzle", 0),
            "Dog": quadrant_counts.get("Dog", 0),
        },
    }
