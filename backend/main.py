"""
FastAPI application for the Retail Store Sales Forecast Dashboard.
Loads cleaned CSV at startup and exposes all analytics endpoints.
"""

import os
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from aggregations import get_kpis, get_trends, get_items, get_channel_breakdown, get_category_breakdown
from forecasting import forecast_item, get_forecastable_items
from insights import generate_insights
from alerts import generate_alerts
from menu_matrix import get_menu_matrix
from basket_analysis import get_basket_affinity

# ── App Setup ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Retail Store Sales Forecast Dashboard API",
    description="Analytics & forecasting API for restaurant POS data",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data Loading ──────────────────────────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CSV_PATH = os.path.join(DATA_DIR, "sales_data_clean.csv")

df = pd.DataFrame()


@app.on_event("startup")
async def load_data():
    global df
    df = pd.read_csv(CSV_PATH, parse_dates=["order_date"])
    df["order_date"] = df["order_date"].dt.date
    print(f"Loaded {len(df)} rows from {CSV_PATH}")


def _parse_filters(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> dict:
    """Parse query parameters into a filter dict."""
    return {
        "store": store,
        "city": city,
        "category": category,
        "channel": channel,
        "start": start,
        "end": end,
    }


# ── Endpoints ─────────────────────────────────────────────────────────


@app.get("/api/kpis")
async def api_kpis(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get headline KPI metrics."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_kpis(df, filters)


@app.get("/api/trends")
async def api_trends(
    granularity: str = Query("daily", regex="^(daily|weekly)$"),
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get time-series trend data."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_trends(df, granularity, filters)


@app.get("/api/items")
async def api_items(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get item-level breakdown with top sellers and slow movers."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_items(df, filters)


@app.get("/api/forecast")
async def api_forecast(
    item: str = Query(..., description="Product name to forecast"),
    weeks: int = Query(4, ge=1, le=12, description="Forecast horizon in weeks"),
    metric: str = Query("quantity", regex="^(quantity|revenue)$"),
):
    """Get per-item forecast with confidence intervals."""
    return forecast_item(df, item, weeks, metric)


@app.get("/api/forecast/items")
async def api_forecast_items():
    """Get list of items available for forecasting."""
    return get_forecastable_items(df)


@app.get("/api/insights")
async def api_insights(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get auto-generated insights."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return generate_insights(df, filters)


@app.get("/api/alerts")
async def api_alerts(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get restock-risk and discount-candidate alerts."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return generate_alerts(df, filters)


@app.get("/api/menu-matrix")
async def api_menu_matrix(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get menu engineering matrix classification."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_menu_matrix(df, filters)


@app.get("/api/channel-breakdown")
async def api_channel_breakdown(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get revenue/orders breakdown by channel."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_channel_breakdown(df, filters)


@app.get("/api/category-breakdown")
async def api_category_breakdown(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get revenue/orders breakdown by category."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_category_breakdown(df, filters)


@app.get("/api/basket-affinity")
async def api_basket_affinity(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
):
    """Get frequently co-purchased item pairs."""
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_basket_affinity(df, filters)


@app.get("/api/filters")
async def api_filters():
    """Get available filter options from the dataset."""
    return {
        "categories": sorted(df["category"].unique().tolist()),
        "channels": sorted(df["channel"].unique().tolist()),
        "stores": sorted(df["store"].unique().tolist()),
        "cities": sorted(df["city"].unique().tolist()),
        "payment_modes": sorted(df["payment_mode"].unique().tolist()),
        "date_range": {
            "min": str(df["order_date"].min()),
            "max": str(df["order_date"].max()),
        },
    }


# ── Run ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
