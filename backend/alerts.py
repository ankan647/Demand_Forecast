"""
Forecast-driven alerts for restock risk, slow-movers / discount candidates,
and high-refund anomaly items.
"""

import pandas as pd
import numpy as np
from aggregations import apply_filters
from forecasting import _aggregate_weekly


def generate_alerts(df: pd.DataFrame, filters: dict) -> dict:
    """Generate restock-risk and discount-candidate alerts."""
    filtered = apply_filters(df, filters)
    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ].copy()

    if payments.empty:
        return {"restock_risk": [], "discount_candidates": [], "high_refund": []}

    payments["order_date"] = pd.to_datetime(payments["order_date"])

    # Get unique products with enough data
    products = payments["product"].unique()

    restock_risk = []
    discount_candidates = []

    for product in products:
        weekly = _aggregate_weekly(filtered, product, metric="quantity")
        if len(weekly) < 4:
            continue

        values = weekly.values.astype(float)
        n = len(values)

        # Compute trend: slope of last 4 weeks vs prior 4 weeks
        recent_4 = values[-4:] if n >= 4 else values
        prior_4 = values[-8:-4] if n >= 8 else values[:max(1, n - 4)]

        recent_avg = float(np.mean(recent_4))
        prior_avg = float(np.mean(prior_4)) if len(prior_4) > 0 else recent_avg
        overall_avg = float(np.mean(values))

        if prior_avg > 0:
            trend_pct = ((recent_avg - prior_avg) / prior_avg) * 100
        else:
            trend_pct = 0

        # Get item metadata
        item_data = payments[payments["product"] == product]
        category = item_data["category"].mode().iloc[0] if len(item_data) > 0 else "Unknown"
        total_revenue = float(item_data["total_sales"].sum())
        total_qty = int(item_data["quantity"].sum())

        # Restock risk: demand trending up significantly (>15% increase)
        if trend_pct > 15 and recent_avg > 3:  # Minimum 3 units/week
            restock_risk.append({
                "product": product,
                "category": category,
                "trend_pct": round(trend_pct, 1),
                "recent_weekly_avg": round(recent_avg, 1),
                "prior_weekly_avg": round(prior_avg, 1),
                "total_revenue": round(total_revenue, 2),
                "message": f"Demand trending up {trend_pct:.0f}% — avg {recent_avg:.0f} units/week (was {prior_avg:.0f}). Consider stocking up.",
                "severity": "high" if trend_pct > 30 else "medium",
            })

        # Discount candidate: demand declining AND below historical average
        if trend_pct < -15 and recent_avg < overall_avg * 0.8:
            discount_candidates.append({
                "product": product,
                "category": category,
                "trend_pct": round(trend_pct, 1),
                "recent_weekly_avg": round(recent_avg, 1),
                "overall_avg": round(overall_avg, 1),
                "total_revenue": round(total_revenue, 2),
                "message": f"Sales declining {abs(trend_pct):.0f}% — now {recent_avg:.0f} units/week (avg was {overall_avg:.0f}). Consider a promotion.",
                "severity": "high" if trend_pct < -30 else "medium",
            })

    # Sort by severity of trend
    restock_risk.sort(key=lambda x: x["trend_pct"], reverse=True)
    discount_candidates.sort(key=lambda x: x["trend_pct"])

    # ------------------------------------------------------------------
    # High refund items
    # ------------------------------------------------------------------
    high_refund = []
    all_events = filtered[filtered["category"] != "Custom Amount"]
    refunds = all_events[all_events["event_type"] == "Refund"]

    if len(refunds) > 0:
        total_payments = len(all_events[all_events["event_type"] == "Payment"])
        overall_refund_rate = len(refunds) / max(total_payments, 1)

        refund_by_item = refunds.groupby("product").agg(
            refund_qty=("quantity", lambda x: x.abs().sum()),
            refund_amount=("total_sales", lambda x: x.abs().sum()),
        )

        payment_by_item = payments.groupby("product")["quantity"].sum()

        for product in refund_by_item.index:
            if product in payment_by_item.index:
                sold = payment_by_item[product]
                refunded = refund_by_item.loc[product, "refund_qty"]
                if sold > 0:
                    item_refund_rate = refunded / sold
                    if item_refund_rate > overall_refund_rate * 2 and refunded >= 2:
                        category = payments[payments["product"] == product]["category"].mode()
                        cat = category.iloc[0] if len(category) > 0 else "Unknown"
                        high_refund.append({
                            "product": product,
                            "category": cat,
                            "refund_qty": int(refunded),
                            "sold_qty": int(sold),
                            "refund_rate": round(float(item_refund_rate) * 100, 1),
                            "refund_amount": round(float(refund_by_item.loc[product, "refund_amount"]), 2),
                            "message": f"Refund rate {item_refund_rate*100:.1f}% ({refunded} of {sold} units) — {item_refund_rate/overall_refund_rate:.1f}× the average. Investigate quality.",
                            "severity": "high" if item_refund_rate > overall_refund_rate * 3 else "medium",
                        })

        high_refund.sort(key=lambda x: x["refund_rate"], reverse=True)

    return {
        "restock_risk": restock_risk[:15],
        "discount_candidates": discount_candidates[:15],
        "high_refund": high_refund[:10],
    }
