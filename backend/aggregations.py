"""
Aggregation functions for KPIs, trends, and item-level analytics.
All functions take a filtered DataFrame and return JSON-serializable structures.
"""

import pandas as pd
import numpy as np


def apply_filters(df: pd.DataFrame, filters: dict) -> pd.DataFrame:
    """Apply common query filters to a DataFrame."""
    if df.empty:
        return df

    result = df.copy()

    if filters.get("store") and "store" in result:
        result = result[result["store"] == filters["store"]]
    if filters.get("city") and "city" in result:
        result = result[result["city"] == filters["city"]]
    if filters.get("category") and "category" in result:
        result = result[result["category"] == filters["category"]]
    if filters.get("channel") and "channel" in result:
        result = result[result["channel"] == filters["channel"]]
    if filters.get("start") and "order_date" in result:
        result = result[result["order_date"] >= pd.to_datetime(filters["start"]).date()]
    if filters.get("end") and "order_date" in result:
        result = result[result["order_date"] <= pd.to_datetime(filters["end"]).date()]

    return result


def get_kpis(df: pd.DataFrame, filters: dict) -> dict:
    """Compute headline KPI metrics."""
    if df.empty:
        return {
            "total_revenue": 0,
            "total_orders": 0,
            "total_units": 0,
            "avg_order_value": 0,
            "refund_count": 0,
            "refund_amount": 0,
            "top_item": "N/A",
            "top_item_revenue": 0,
            "categories": 0,
            "products_sold": 0,
            "date_range": {"start": "", "end": ""},
        }

    filtered = apply_filters(df, filters)
    if filtered.empty:
        return {
            "total_revenue": 0,
            "total_orders": 0,
            "total_units": 0,
            "avg_order_value": 0,
            "refund_count": 0,
            "refund_amount": 0,
            "top_item": "N/A",
            "top_item_revenue": 0,
            "categories": 0,
            "products_sold": 0,
            "date_range": {"start": "", "end": ""},
        }

    payments = filtered[filtered["event_type"] == "Payment"]
    refunds = filtered[filtered["event_type"] == "Refund"]

    total_revenue = float(payments["total_sales"].sum())
    total_orders = int(payments.groupby(["order_date"]).ngroups)
    total_units = int(payments["quantity"].sum())
    avg_order_value = round(total_revenue / max(total_orders, 1), 2)
    refund_count = int(len(refunds))
    refund_amount = float(refunds["total_sales"].abs().sum())

    # Top item by revenue
    top_item_df = (
        payments[payments["category"] != "Custom Amount"]
        .groupby("product")["total_sales"]
        .sum()
        .sort_values(ascending=False)
    )
    top_item = top_item_df.index[0] if len(top_item_df) > 0 else "N/A"
    top_item_revenue = float(top_item_df.iloc[0]) if len(top_item_df) > 0 else 0

    # Category count
    categories = int(payments["category"].nunique())

    # Unique products sold
    products_sold = int(payments["product"].nunique())

    # Date range info
    date_min = str(filtered["order_date"].min()) if len(filtered) > 0 else ""
    date_max = str(filtered["order_date"].max()) if len(filtered) > 0 else ""

    return {
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "total_units": total_units,
        "avg_order_value": avg_order_value,
        "refund_count": refund_count,
        "refund_amount": round(refund_amount, 2),
        "top_item": top_item,
        "top_item_revenue": round(top_item_revenue, 2),
        "categories": categories,
        "products_sold": products_sold,
        "date_range": {"start": date_min, "end": date_max},
    }


def get_trends(df: pd.DataFrame, granularity: str, filters: dict) -> list:
    """Get time-series revenue/orders/units data."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return []

    payments = filtered[filtered["event_type"] == "Payment"]

    if payments.empty:
        return []

    payments = payments.copy()
    payments["order_date"] = pd.to_datetime(payments["order_date"])

    if granularity == "weekly":
        payments["period"] = payments["order_date"].dt.to_period("W").apply(
            lambda x: x.start_time
        )
    else:
        payments["period"] = payments["order_date"]

    grouped = (
        payments.groupby("period")
        .agg(
            revenue=("total_sales", "sum"),
            units=("quantity", "sum"),
            orders=("order_date", "count"),
            avg_price=("unit_price", "mean"),
        )
        .reset_index()
        .sort_values("period")
    )

    result = []
    for _, row in grouped.iterrows():
        result.append({
            "date": str(row["period"].date()) if hasattr(row["period"], "date") else str(row["period"]),
            "revenue": round(float(row["revenue"]), 2),
            "units": int(row["units"]),
            "orders": int(row["orders"]),
            "avg_price": round(float(row["avg_price"]), 2),
        })

    return result


def get_items(df: pd.DataFrame, filters: dict) -> dict:
    """Get item-level breakdown: top sellers, slow movers, and full table."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return {"top_sellers": [], "slow_movers": [], "all_items": []}

    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ]

    if payments.empty:
        return {"top_sellers": [], "slow_movers": [], "all_items": []}

    item_stats = (
        payments.groupby(["product", "category"])
        .agg(
            total_quantity=("quantity", "sum"),
            total_revenue=("total_sales", "sum"),
            total_discount=("discount", "sum"),
            avg_price=("unit_price", "mean"),
            order_count=("order_date", "nunique"),
            first_sale=("order_date", "min"),
            last_sale=("order_date", "max"),
        )
        .reset_index()
        .sort_values("total_revenue", ascending=False)
    )

    all_items = []
    for i, row in item_stats.iterrows():
        all_items.append({
            "product": row["product"],
            "category": row["category"],
            "total_quantity": int(row["total_quantity"]),
            "total_revenue": round(float(row["total_revenue"]), 2),
            "total_discount": round(float(row["total_discount"]), 2),
            "avg_price": round(float(row["avg_price"]), 2),
            "order_count": int(row["order_count"]),
            "first_sale": str(row["first_sale"]),
            "last_sale": str(row["last_sale"]),
        })

    top_sellers = all_items[:10]
    slow_movers = sorted(all_items, key=lambda x: x["total_quantity"])[:10]

    return {
        "top_sellers": top_sellers,
        "slow_movers": slow_movers,
        "all_items": all_items,
    }


def get_channel_breakdown(df: pd.DataFrame, filters: dict) -> list:
    """Get revenue/orders split by channel."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return []

    payments = filtered[filtered["event_type"] == "Payment"]

    if payments.empty:
        return []

    channel_stats = (
        payments.groupby("channel")
        .agg(
            revenue=("total_sales", "sum"),
            orders=("order_date", "count"),
            units=("quantity", "sum"),
            avg_price=("unit_price", "mean"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    total_revenue = float(channel_stats["revenue"].sum())

    result = []
    for _, row in channel_stats.iterrows():
        pct = round(float(row["revenue"]) / max(total_revenue, 1) * 100, 1)
        result.append({
            "channel": row["channel"],
            "revenue": round(float(row["revenue"]), 2),
            "orders": int(row["orders"]),
            "units": int(row["units"]),
            "avg_price": round(float(row["avg_price"]), 2),
            "revenue_pct": pct,
            "aov": round(float(row["revenue"]) / max(int(row["orders"]), 1), 2),
        })

    return result


def get_category_breakdown(df: pd.DataFrame, filters: dict) -> list:
    """Get revenue/orders split by category."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return []

    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ]

    if payments.empty:
        return []

    cat_stats = (
        payments.groupby("category")
        .agg(
            revenue=("total_sales", "sum"),
            orders=("order_date", "count"),
            units=("quantity", "sum"),
        )
        .reset_index()
        .sort_values("revenue", ascending=False)
    )

    total_revenue = float(cat_stats["revenue"].sum())

    result = []
    for _, row in cat_stats.iterrows():
        pct = round(float(row["revenue"]) / max(total_revenue, 1) * 100, 1)
        result.append({
            "category": row["category"],
            "revenue": round(float(row["revenue"]), 2),
            "orders": int(row["orders"]),
            "units": int(row["units"]),
            "revenue_pct": pct,
        })

    return result
