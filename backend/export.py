"""
Export module for generating CSV and Excel files from filtered datasets.
"""

import io
import pandas as pd
from typing import Tuple


def export_items_table(items_data: dict, export_format: str = "csv") -> Tuple[bytes, str, str]:
    """Export item performance table."""
    all_items = items_data.get("all_items", [])
    df = pd.DataFrame(all_items)

    filename = f"item_performance.{export_format}"
    
    if export_format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue().encode("utf-8"), "text/csv", filename
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Items Performance", index=False)
        return output.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename


def export_trends_table(trends_data: list, export_format: str = "csv") -> Tuple[bytes, str, str]:
    """Export time-series trend data."""
    df = pd.DataFrame(trends_data)

    filename = f"revenue_trends.{export_format}"
    
    if export_format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue().encode("utf-8"), "text/csv", filename
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Revenue Trends", index=False)
        return output.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename


def export_forecast_table(forecast_data: dict, export_format: str = "csv") -> Tuple[bytes, str, str]:
    """Export item forecast data."""
    hist = forecast_data.get("historical", [])
    fcst = forecast_data.get("forecast", [])

    rows = []
    for h in hist:
        rows.append({"type": "Historical", "week": h["week"], "value": h["actual"], "lower_ci": None, "upper_ci": None})
    for f in fcst:
        rows.append({"type": "Forecast", "week": f["week"], "value": f["predicted"], "lower_ci": f["lower"], "upper_ci": f["upper"]})

    df = pd.DataFrame(rows)
    product_slug = forecast_data.get("item", "item").replace(" ", "_")
    filename = f"forecast_{product_slug}.{export_format}"

    if export_format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue().encode("utf-8"), "text/csv", filename
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Forecast", index=False)
        return output.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename


def export_alerts_table(alerts_data: dict, export_format: str = "csv") -> Tuple[bytes, str, str]:
    """Export smart alerts (restock, discount, refunds)."""
    rows = []
    for a in alerts_data.get("restock_risk", []):
        rows.append({"alert_type": "Restock Risk", "product": a["product"], "category": a["category"], "message": a["message"], "severity": a["severity"]})
    for a in alerts_data.get("discount_candidates", []):
        rows.append({"alert_type": "Discount Candidate", "product": a["product"], "category": a["category"], "message": a["message"], "severity": a["severity"]})
    for a in alerts_data.get("high_refund", []):
        rows.append({"alert_type": "High Refund Rate", "product": a["product"], "category": a["category"], "message": a["message"], "severity": a["severity"]})

    df = pd.DataFrame(rows)
    filename = f"smart_alerts.{export_format}"

    if export_format == "csv":
        output = io.StringIO()
        df.to_csv(output, index=False)
        return output.getvalue().encode("utf-8"), "text/csv", filename
    else:
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine="openpyxl") as writer:
            df.to_excel(writer, sheet_name="Smart Alerts", index=False)
        return output.getvalue(), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", filename
