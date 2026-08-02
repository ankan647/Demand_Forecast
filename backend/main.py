"""
FastAPI application for the Retail Store Sales Forecast Dashboard.
Loads default cleaned CSV at startup and supports dynamic user dataset uploads,
authentication via Supabase, and dataset exports.
"""

import os
import io
import json
import pandas as pd
from fastapi import FastAPI, Query, File, UploadFile, Depends, HTTPException, Response, status
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, Dict, List, Tuple, Any

from aggregations import get_kpis, get_trends, get_items, get_channel_breakdown, get_category_breakdown
from forecasting import forecast_item, get_forecastable_items
from insights import generate_insights
from alerts import generate_alerts
from menu_matrix import get_menu_matrix
from basket_analysis import get_basket_affinity

from auth import get_current_user_optional, get_current_user_required
from upload import (
    parse_upload_file, auto_detect_mapping, validate_dataset,
    clean_and_process_dataset, save_user_dataset, UPLOAD_DIR
)
from export import (
    export_items_table, export_trends_table, export_forecast_table, export_alerts_table
)

# ── App Setup ─────────────────────────────────────────────────────────

app = FastAPI(
    title="Retail Store Sales Forecast Dashboard API",
    description="Analytics & forecasting API for restaurant POS data with user upload, export & auth",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Data Loading & State Management ───────────────────────────────────

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
CSV_PATH = os.path.join(DATA_DIR, "sales_data_clean.csv")

default_df = pd.DataFrame()

# Active dataset tracking per user_id: {user_id: dataset_id}
user_active_dataset: Dict[str, str] = {}
# Temporary upload stash for column confirmation: {temp_id: (df, filename, user_id)}
upload_stash: Dict[str, Tuple[pd.DataFrame, str, str]] = {}


@app.on_event("startup")
async def load_data():
    global default_df
    if os.path.exists(CSV_PATH):
        default_df = pd.read_csv(CSV_PATH, parse_dates=["order_date"])
        default_df["order_date"] = default_df["order_date"].dt.date
        print(f"Loaded default sample data ({len(default_df)} rows) from {CSV_PATH}")


def save_active_dataset_id(user_id: str, dataset_id: str):
    user_active_dataset[user_id] = dataset_id
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    meta_path = os.path.join(user_dir, "active_dataset.json")
    try:
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"active_dataset_id": dataset_id}, f)
    except Exception as e:
        print(f"Error saving active dataset metadata: {e}")


def get_active_dataset_id(user_id: str) -> Optional[str]:
    if user_id in user_active_dataset:
        return user_active_dataset[user_id]

    user_dir = os.path.join(UPLOAD_DIR, user_id)
    meta_path = os.path.join(user_dir, "active_dataset.json")
    if os.path.exists(meta_path):
        try:
            with open(meta_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                active_id = data.get("active_dataset_id")
                if active_id:
                    user_active_dataset[user_id] = active_id
                    return active_id
        except Exception:
            pass

    if os.path.exists(user_dir):
        csv_files = [f for f in os.listdir(user_dir) if f.endswith(".csv")]
        if csv_files:
            csv_files.sort(key=lambda f: os.path.getmtime(os.path.join(user_dir, f)), reverse=True)
            newest_id = csv_files[0][:-4]
            user_active_dataset[user_id] = newest_id
            return newest_id

    return None


def get_user_dataframe(user: Optional[dict] = None) -> pd.DataFrame:
    """
    Get active DataFrame for user.
    If authenticated user has no uploaded dataset, return empty DataFrame (strict isolation).
    If unauthenticated guest, return default sample dataset.
    """
    if not user or not user.get("id"):
        return default_df

    user_id = user["id"]
    dataset_id = get_active_dataset_id(user_id)

    if not dataset_id or dataset_id == "default":
        return pd.DataFrame()

    dataset_path = os.path.join(UPLOAD_DIR, user_id, f"{dataset_id}.csv")
    if os.path.exists(dataset_path):
        try:
            df = pd.read_csv(dataset_path, parse_dates=["order_date"])
            df["order_date"] = df["order_date"].dt.date
            return df
        except Exception as e:
            print(f"Error loading user dataset {dataset_id}: {e}")
            return pd.DataFrame()

    return pd.DataFrame()


def get_user_profile(user_id: str) -> dict:
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    profile_path = os.path.join(user_dir, "profile.json")
    if os.path.exists(profile_path):
        try:
            with open(profile_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "restaurant_name": "",
        "city": "",
        "cuisine": "",
        "currency": "₹",
        "has_completed_onboarding": False,
    }


def save_user_profile(user_id: str, profile_data: dict) -> dict:
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)
    profile_path = os.path.join(user_dir, "profile.json")
    existing = get_user_profile(user_id)
    existing.update(profile_data)
    existing["has_completed_onboarding"] = True
    with open(profile_path, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2)
    return existing


def _parse_filters(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
) -> dict:
    return {
        "store": store,
        "city": city,
        "category": category,
        "channel": channel,
        "start": start,
        "end": end,
    }


# ── Analytics Endpoints ───────────────────────────────────────────────


@app.get("/api/kpis")
async def api_kpis(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_items(df, filters)


@app.get("/api/forecast")
async def api_forecast(
    item: str = Query(..., description="Product name to forecast"),
    weeks: int = Query(4, ge=1, le=12, description="Forecast horizon in weeks"),
    metric: str = Query("quantity", regex="^(quantity|revenue)$"),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    return forecast_item(df, item, weeks, metric)


@app.get("/api/forecast/items")
async def api_forecast_items(
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    return get_forecastable_items(df)


@app.get("/api/insights")
async def api_insights(
    store: Optional[str] = None,
    city: Optional[str] = None,
    category: Optional[str] = None,
    channel: Optional[str] = None,
    start: Optional[str] = None,
    end: Optional[str] = None,
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
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
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    filters = _parse_filters(store, city, category, channel, start, end)
    return get_basket_affinity(df, filters)


@app.get("/api/filters")
async def api_filters(
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    if df.empty:
        return {
            "categories": [],
            "channels": [],
            "stores": [],
            "cities": [],
            "payment_modes": [],
            "date_range": {"min": "", "max": ""},
        }

    return {
        "categories": sorted(df["category"].dropna().unique().tolist()),
        "channels": sorted(df["channel"].dropna().unique().tolist()),
        "stores": sorted(df["store"].dropna().unique().tolist()) if "store" in df else [],
        "cities": sorted(df["city"].dropna().unique().tolist()) if "city" in df else [],
        "payment_modes": sorted(df["payment_mode"].dropna().unique().tolist()) if "payment_mode" in df else [],
        "date_range": {
            "min": str(df["order_date"].min()) if "order_date" in df else "",
            "max": str(df["order_date"].max()) if "order_date" in df else "",
        },
    }


# ── Dataset Upload & Management Endpoints ─────────────────────────────


@app.post("/api/datasets/upload")
async def upload_dataset_preview(
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user_required),
):
    """
    Step 1: Upload file, auto-detect column mapping, return preview & warnings.
    """
    contents = await file.read()
    try:
        raw_df, ext = parse_upload_file(contents, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))

    # Auto-detect mapping
    auto_mapping = auto_detect_mapping(raw_df.columns.tolist())
    warnings, summary = validate_dataset(raw_df, auto_mapping)

    # Store in temporary stash
    temp_id = str(len(upload_stash) + 1) + "_" + user["id"][:8]
    upload_stash[temp_id] = (raw_df, file.filename, user["id"])

    # Prepare preview rows
    preview_df = raw_df.head(5).copy()
    preview_df = preview_df.fillna("").astype(str)
    preview_rows = preview_df.to_dict(orient="records")

    return {
        "temp_id": temp_id,
        "filename": file.filename,
        "total_rows": len(raw_df),
        "columns": raw_df.columns.tolist(),
        "auto_mapping": auto_mapping,
        "warnings": warnings,
        "summary": summary,
        "preview_rows": preview_rows,
    }


@app.post("/api/datasets/confirm")
async def confirm_dataset_upload(
    payload: Dict[str, Any],
    user: dict = Depends(get_current_user_required),
):
    """
    Step 2: Confirm column mapping, clean dataset, save to disk, set as active.
    Optionally removes previous dataset files if replace_old is True.
    """
    temp_id = payload.get("temp_id")
    mapping = payload.get("mapping", {})
    replace_old = payload.get("replace_old", True)

    if not temp_id or temp_id not in upload_stash:
        raise HTTPException(status_code=404, detail="Upload session expired. Please upload file again.")

    raw_df, filename, owner_id = upload_stash[temp_id]
    if owner_id != user["id"]:
        raise HTTPException(status_code=403, detail="Unauthorized upload confirmation.")

    # Clean & process
    clean_df = clean_and_process_dataset(raw_df, mapping)
    dataset_id, save_path = save_user_dataset(clean_df, user["id"], filename, replace_old=replace_old)

    # Set as active & persist selection
    save_active_dataset_id(user["id"], dataset_id)

    # Clean stash
    del upload_stash[temp_id]

    min_date = str(clean_df["order_date"].min()) if not clean_df.empty and "order_date" in clean_df else ""
    max_date = str(clean_df["order_date"].max()) if not clean_df.empty and "order_date" in clean_df else ""

    return {
        "success": True,
        "dataset_id": dataset_id,
        "filename": filename,
        "processed_rows": len(clean_df),
        "date_range": {
            "min": min_date,
            "max": max_date,
        },
        "is_active": True,
        "old_data_removed": replace_old,
    }


@app.get("/api/datasets")
async def list_user_datasets(
    user: dict = Depends(get_current_user_required),
):
    """List datasets belonging to current user (excluding sample dataset for authenticated users)."""
    user_id = user["id"]
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    active_id = get_active_dataset_id(user_id)

    datasets = []

    if os.path.exists(user_dir):
        for f in os.listdir(user_dir):
            if f.endswith(".csv"):
                ds_id = f[:-4]
                path = os.path.join(user_dir, f)
                try:
                    df = pd.read_csv(path)
                    datasets.append({
                        "id": ds_id,
                        "filename": f"Custom Dataset ({len(df)} rows)",
                        "rows": len(df),
                        "is_active": active_id == ds_id,
                    })
                except Exception:
                    pass

    return datasets


@app.post("/api/datasets/{dataset_id}/activate")
async def activate_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user_required),
):
    """Set active dataset for current user."""
    user_id = user["id"]
    if dataset_id == "default":
        raise HTTPException(status_code=403, detail="Authenticated users cannot switch to the sample dataset.")

    path = os.path.join(UPLOAD_DIR, user_id, f"{dataset_id}.csv")
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="Dataset not found.")

    save_active_dataset_id(user_id, dataset_id)
    return {"success": True, "active_dataset_id": dataset_id}


@app.delete("/api/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    user: dict = Depends(get_current_user_required),
):
    """Delete a specific user dataset."""
    user_id = user["id"]
    path = os.path.join(UPLOAD_DIR, user_id, f"{dataset_id}.csv")
    if os.path.exists(path):
        try:
            os.remove(path)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to delete dataset: {e}")

    active_id = get_active_dataset_id(user_id)
    if active_id == dataset_id:
        user_active_dataset.pop(user_id, None)
        meta_path = os.path.join(UPLOAD_DIR, user_id, "active_dataset.json")
        if os.path.exists(meta_path):
            try:
                os.remove(meta_path)
            except Exception:
                pass

    return {"success": True, "message": "Dataset deleted successfully."}


# ── User Profile & Onboarding Endpoints ────────────────────────────────


@app.get("/api/profile")
async def api_get_profile(
    user: Optional[dict] = Depends(get_current_user_optional),
):
    """Get restaurant profile for authenticated user or demo default."""
    if not user or not user.get("id"):
        return {
            "restaurant_name": "TK Korean Restaurant",
            "city": "Mumbai",
            "cuisine": "Korean Casual",
            "currency": "₹",
            "has_completed_onboarding": True,
        }
    return get_user_profile(user["id"])


@app.post("/api/profile")
async def api_save_profile(
    payload: Dict[str, Any],
    user: dict = Depends(get_current_user_required),
):
    """Save/update restaurant profile for user."""
    profile = save_user_profile(user["id"], payload)
    return {"success": True, "profile": profile}


# ── Export Endpoints ──────────────────────────────────────────────────


@app.get("/api/export/items")
async def export_items(
    export_format: str = Query("csv", regex="^(csv|xlsx)$"),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    items_data = get_items(df, {})
    file_bytes, media_type, filename = export_items_table(items_data, export_format)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/export/trends")
async def export_trends(
    granularity: str = Query("weekly", regex="^(daily|weekly)$"),
    export_format: str = Query("csv", regex="^(csv|xlsx)$"),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    trends_data = get_trends(df, granularity, {})
    file_bytes, media_type, filename = export_trends_table(trends_data, export_format)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/export/forecast")
async def export_forecast(
    item: str = Query(...),
    weeks: int = Query(4),
    export_format: str = Query("csv", regex="^(csv|xlsx)$"),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    forecast_data = forecast_item(df, item, weeks, "quantity")
    file_bytes, media_type, filename = export_forecast_table(forecast_data, export_format)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/api/export/alerts")
async def export_alerts(
    export_format: str = Query("csv", regex="^(csv|xlsx)$"),
    user: Optional[dict] = Depends(get_current_user_optional),
):
    df = get_user_dataframe(user)
    alerts_data = generate_alerts(df, {})
    file_bytes, media_type, filename = export_alerts_table(alerts_data, export_format)
    return StreamingResponse(
        io.BytesIO(file_bytes),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

