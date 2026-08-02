"""
Basket Affinity Analysis — finds frequently-bought-together item pairs
using co-occurrence counting on timestamp-grouped baskets.
No mlxtend dependency required.
"""

import pandas as pd
import numpy as np
from itertools import combinations
from aggregations import apply_filters


def get_basket_affinity(df: pd.DataFrame, filters: dict, min_basket_count: int = 2, top_n: int = 20) -> dict:
    """
    Find frequently co-purchased item pairs.

    Groups items into baskets by (order_date, time-proxy) and counts
    pair co-occurrences. Returns support and confidence metrics.
    """
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return {"pairs": [], "total_baskets": 0}

    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ].copy()

    if payments.empty:
        return {"pairs": [], "total_baskets": 0}

    # Create basket key from order_date + product combination
    # Since we don't have exact time in cleaned data, group by order_date
    # and use the fact that multiple items on the same date from same transaction
    # are co-purchased. In practice, this is an approximation.
    # We'll use a more granular approach: group by order_date and look for
    # items that appear together frequently across days.

    # Group items by order_date to form daily "baskets"
    baskets = payments.groupby("order_date")["product"].apply(
        lambda x: list(set(x))
    ).reset_index()

    baskets = baskets[baskets["product"].apply(len) >= 2]  # Need at least 2 items
    total_baskets = len(baskets)

    if total_baskets < 5:
        return {"pairs": [], "total_baskets": total_baskets}

    # Count individual item frequencies
    item_freq = {}
    for _, row in baskets.iterrows():
        for item in row["product"]:
            item_freq[item] = item_freq.get(item, 0) + 1

    # Count pair co-occurrences
    pair_counts = {}
    for _, row in baskets.iterrows():
        items = sorted(row["product"])
        for a, b in combinations(items, 2):
            key = (a, b)
            pair_counts[key] = pair_counts.get(key, 0) + 1

    # Filter pairs with minimum occurrence
    filtered_pairs = {
        k: v for k, v in pair_counts.items()
        if v >= min_basket_count
    }

    if not filtered_pairs:
        # Lower threshold if no pairs found
        min_threshold = max(2, total_baskets // 20)
        filtered_pairs = {
            k: v for k, v in pair_counts.items()
            if v >= min_threshold
        }

    # Compute metrics
    pairs = []
    for (item_a, item_b), count in filtered_pairs.items():
        support = count / total_baskets
        confidence_a = count / max(item_freq.get(item_a, 1), 1)  # P(B|A)
        confidence_b = count / max(item_freq.get(item_b, 1), 1)  # P(A|B)

        # Lift
        prob_a = item_freq.get(item_a, 1) / total_baskets
        prob_b = item_freq.get(item_b, 1) / total_baskets
        lift = support / max(prob_a * prob_b, 0.001)

        # Get categories
        cat_a = payments[payments["product"] == item_a]["category"].mode()
        cat_b = payments[payments["product"] == item_b]["category"].mode()

        pairs.append({
            "item_a": item_a,
            "item_b": item_b,
            "category_a": cat_a.iloc[0] if len(cat_a) > 0 else "Unknown",
            "category_b": cat_b.iloc[0] if len(cat_b) > 0 else "Unknown",
            "co_occurrence": int(count),
            "support": round(float(support), 4),
            "confidence": round(float(max(confidence_a, confidence_b)), 4),
            "lift": round(float(lift), 2),
        })

    # Sort by confidence (strongest associations first)
    pairs.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "pairs": pairs[:top_n],
        "total_baskets": total_baskets,
    }
