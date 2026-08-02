"""
Rule-based insight generator.
Scans the dataset and emits natural-language insight strings
with severity levels and categories.
"""

import pandas as pd
import numpy as np
from aggregations import apply_filters


def generate_insights(df: pd.DataFrame, filters: dict) -> list:
    """Generate a list of data-driven insights."""
    filtered = apply_filters(df, filters)
    if filtered.empty:
        return []

    payments = filtered[
        (filtered["event_type"] == "Payment") &
        (filtered["category"] != "Custom Amount")
    ].copy()

    if payments.empty:
        return []

    payments["order_date"] = pd.to_datetime(payments["order_date"])
    insights = []

    # ------------------------------------------------------------------
    # 1. Week-over-week revenue change
    # ------------------------------------------------------------------
    try:
        payments["week"] = payments["order_date"].dt.to_period("W").apply(
            lambda x: x.start_time
        )
        weekly_rev = payments.groupby("week")["total_sales"].sum().sort_index()

        if len(weekly_rev) >= 2:
            last_week = float(weekly_rev.iloc[-1])
            prev_week = float(weekly_rev.iloc[-2])
            if prev_week > 0:
                wow_change = ((last_week - prev_week) / prev_week) * 100
                direction = "increased" if wow_change > 0 else "decreased"
                icon = "trending_up" if wow_change > 0 else "trending_down"
                severity = "positive" if wow_change > 0 else "warning"
                insights.append({
                    "text": f"Revenue {direction} {abs(wow_change):.1f}% in the last week compared to the previous week (₹{last_week:,.0f} vs ₹{prev_week:,.0f})",
                    "category": "Revenue",
                    "severity": severity,
                    "icon": icon,
                })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 2. Weekend vs weekday ratio
    # ------------------------------------------------------------------
    try:
        payments["dow"] = payments["order_date"].dt.dayofweek
        weekend = payments[payments["dow"].isin([4, 5])]  # Friday, Saturday
        weekday = payments[~payments["dow"].isin([4, 5, 6])]  # Mon-Thu (Sun often closed)

        weekend_avg = weekend.groupby("order_date")["total_sales"].sum().mean()
        weekday_avg = weekday.groupby("order_date")["total_sales"].sum().mean()

        if weekday_avg > 0:
            ratio = weekend_avg / weekday_avg
            insights.append({
                "text": f"Weekend sales (Fri-Sat) average ₹{weekend_avg:,.0f}/day — {ratio:.1f}× higher than weekday average (₹{weekday_avg:,.0f}/day)",
                "category": "Trends",
                "severity": "info",
                "icon": "calendar",
            })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 3. Fastest-growing category (last 4 weeks vs prior 4 weeks)
    # ------------------------------------------------------------------
    try:
        if len(weekly_rev) >= 8:
            recent_4w = payments[payments["week"] >= weekly_rev.index[-4]]
            prior_4w = payments[
                (payments["week"] < weekly_rev.index[-4]) &
                (payments["week"] >= weekly_rev.index[-8])
            ]

            recent_cat = recent_4w.groupby("category")["total_sales"].sum()
            prior_cat = prior_4w.groupby("category")["total_sales"].sum()

            growth = {}
            for cat in recent_cat.index:
                if cat in prior_cat.index and prior_cat[cat] > 0:
                    g = ((recent_cat[cat] - prior_cat[cat]) / prior_cat[cat]) * 100
                    growth[cat] = g

            if growth:
                fastest = max(growth, key=growth.get)
                slowest = min(growth, key=growth.get)

                if growth[fastest] > 5:
                    insights.append({
                        "text": f"{fastest} is the fastest-growing category, up {growth[fastest]:.1f}% over the last 4 weeks",
                        "category": "Products",
                        "severity": "positive",
                        "icon": "rocket",
                    })
                if growth[slowest] < -5:
                    insights.append({
                        "text": f"{slowest} category declined {abs(growth[slowest]):.1f}% over the last 4 weeks — consider promotions",
                        "category": "Products",
                        "severity": "warning",
                        "icon": "alert",
                    })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 4. Peak day of week
    # ------------------------------------------------------------------
    try:
        day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
        daily_rev = payments.groupby(payments["order_date"].dt.dayofweek)["total_sales"].sum()
        total_rev = daily_rev.sum()
        peak_day = daily_rev.idxmax()
        peak_pct = (daily_rev[peak_day] / total_rev) * 100

        insights.append({
            "text": f"{day_names[peak_day]} is your best day, contributing {peak_pct:.1f}% of total revenue",
            "category": "Operations",
            "severity": "info",
            "icon": "star",
        })

        # Worst day
        worst_day = daily_rev.idxmin()
        worst_pct = (daily_rev[worst_day] / total_rev) * 100
        if worst_pct < 8:
            insights.append({
                "text": f"{day_names[worst_day]} is the slowest day with only {worst_pct:.1f}% of revenue — consider special offers or adjusted hours",
                "category": "Operations",
                "severity": "warning",
                "icon": "moon",
            })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 5. Channel concentration
    # ------------------------------------------------------------------
    try:
        channel_rev = payments.groupby("channel")["total_sales"].sum().sort_values(ascending=False)
        total_rev = channel_rev.sum()
        top_channel = channel_rev.index[0]
        top_pct = (channel_rev.iloc[0] / total_rev) * 100

        insights.append({
            "text": f"{top_pct:.0f}% of revenue comes through {top_channel} — your dominant sales channel",
            "category": "Revenue",
            "severity": "info",
            "icon": "store",
        })

        # Online vs in-store
        online_channels = ["Square Online", "Uber Eats", "DoorDash", "Uber Eats Pickup", "DoorDash Pickup"]
        online_rev = channel_rev[channel_rev.index.isin(online_channels)].sum()
        online_pct = (online_rev / total_rev) * 100
        insights.append({
            "text": f"Online/delivery channels contribute {online_pct:.0f}% of revenue — {'strong' if online_pct > 40 else 'growing'} digital presence",
            "category": "Revenue",
            "severity": "positive" if online_pct > 40 else "info",
            "icon": "globe",
        })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 6. Discount impact
    # ------------------------------------------------------------------
    try:
        has_discount = payments[payments["discount"] > 0]
        no_discount = payments[payments["discount"] == 0]

        if len(has_discount) > 10 and len(no_discount) > 10:
            disc_avg_qty = has_discount.groupby("product")["quantity"].mean().mean()
            nodisc_avg_qty = no_discount.groupby("product")["quantity"].mean().mean()

            total_discount = has_discount["discount"].sum()
            disc_pct = (len(has_discount) / len(payments)) * 100

            insights.append({
                "text": f"{disc_pct:.0f}% of transactions have discounts applied, totalling ₹{total_discount:,.0f} in discounts given",
                "category": "Revenue",
                "severity": "info",
                "icon": "tag",
            })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 7. Refund rate
    # ------------------------------------------------------------------
    try:
        all_events = filtered[filtered["category"] != "Custom Amount"]
        refunds = all_events[all_events["event_type"] == "Refund"]
        refund_rate = (len(refunds) / max(len(all_events), 1)) * 100

        if refund_rate > 0:
            # Highest refund item
            refund_items = refunds.groupby("product")["quantity"].sum().abs().sort_values(ascending=False)
            top_refund_item = refund_items.index[0] if len(refund_items) > 0 else "N/A"
            top_refund_qty = int(refund_items.iloc[0]) if len(refund_items) > 0 else 0

            severity = "warning" if refund_rate > 1 else "info"
            insights.append({
                "text": f"Overall refund rate is {refund_rate:.2f}%. Highest refunded item: {top_refund_item} ({top_refund_qty} units returned)",
                "category": "Operations",
                "severity": severity,
                "icon": "undo",
            })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 8. Top item dominance
    # ------------------------------------------------------------------
    try:
        item_rev = payments.groupby("product")["total_sales"].sum().sort_values(ascending=False)
        total_rev = item_rev.sum()

        top3 = item_rev.head(3)
        top3_pct = (top3.sum() / total_rev) * 100
        top3_names = ", ".join(top3.index.tolist())

        insights.append({
            "text": f"Top 3 items ({top3_names}) account for {top3_pct:.0f}% of total revenue",
            "category": "Products",
            "severity": "info",
            "icon": "trophy",
        })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 9. Monthly trend
    # ------------------------------------------------------------------
    try:
        payments["month"] = payments["order_date"].dt.to_period("M").apply(
            lambda x: x.start_time
        )
        monthly_rev = payments.groupby("month")["total_sales"].sum().sort_index()

        if len(monthly_rev) >= 3:
            best_month = monthly_rev.idxmax()
            best_month_name = best_month.strftime("%B %Y")
            best_month_rev = float(monthly_rev.max())

            insights.append({
                "text": f"{best_month_name} was your best month with ₹{best_month_rev:,.0f} in revenue",
                "category": "Trends",
                "severity": "info",
                "icon": "chart",
            })
    except Exception:
        pass

    # ------------------------------------------------------------------
    # 10. Average order value trend
    # ------------------------------------------------------------------
    try:
        daily_stats = payments.groupby("order_date").agg(
            revenue=("total_sales", "sum"),
            orders=("order_date", "count"),
        )
        daily_stats["aov"] = daily_stats["revenue"] / daily_stats["orders"]
        avg_aov = daily_stats["aov"].mean()

        insights.append({
            "text": f"Average transaction value is ₹{avg_aov:.0f} — consider upselling combos to increase this",
            "category": "Revenue",
            "severity": "info",
            "icon": "receipt",
        })
    except Exception:
        pass

    return insights
