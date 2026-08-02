"""
Dynamic Dataset Upload Engine.
Parses CSV/XLSX files, performs auto-column mapping, schema validation,
and saves dataset files scoped per user.
"""

import os
import uuid
import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Standard schema definition
REQUIRED_COLUMNS = {
    "order_date": ["order_date", "date", "transaction_date", "time", "created_at", "order date"],
    "product": ["product", "item", "item_name", "product_name", "menu_item", "item name"],
    "category": ["category", "item_category", "product_category", "department", "category name"],
    "quantity": ["quantity", "qty", "units", "items_sold", "unit_count", "qty_sold"],
    "total_sales": ["total_sales", "revenue", "gross_sales", "net_sales", "sales", "amount", "total"],
}

OPTIONAL_COLUMNS = {
    "unit_price": ["unit_price", "price", "item_price", "rate", "cost"],
    "channel": ["channel", "sales_channel", "source", "order_type", "fulfillment_type"],
    "payment_mode": ["payment_mode", "payment_method", "payment_type", "tender_type"],
    "event_type": ["event_type", "transaction_type", "type"],
    "store": ["store", "location", "branch"],
    "city": ["city", "location_city"],
}


def parse_upload_file(file_bytes: bytes, filename: str) -> Tuple[pd.DataFrame, str]:
    """Parse raw bytes into pandas DataFrame."""
    ext = os.path.splitext(filename)[1].lower()
    if ext == ".csv":
        # Try UTF-8 first, fallback to latin-1
        try:
            df = pd.read_csv(pd.io.common.BytesIO(file_bytes), encoding="utf-8")
        except UnicodeDecodeError:
            df = pd.read_csv(pd.io.common.BytesIO(file_bytes), encoding="latin-1")
    elif ext in [".xlsx", ".xls"]:
        df = pd.read_excel(pd.io.common.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file format. Please upload a .csv or .xlsx file.")

    if df.empty:
        raise ValueError("Uploaded file contains no rows.")

    return df, ext


def auto_detect_mapping(columns: List[str]) -> Dict[str, str]:
    """
    Fuzzy match dataset columns against expected standard schema.
    Returns dict: {standard_name: uploaded_column_name}
    """
    column_map = {}
    col_lower = {c.strip().lower(): c for c in columns}

    all_expected = {**REQUIRED_COLUMNS, **OPTIONAL_COLUMNS}

    for std_name, aliases in all_expected.items():
        matched = None
        for alias in aliases:
            if alias in col_lower:
                matched = col_lower[alias]
                break

        if matched:
            column_map[std_name] = matched

    return column_map


def validate_dataset(df: pd.DataFrame, mapping: Dict[str, str]) -> Tuple[List[str], Dict[str, Any]]:
    """
    Validate DataFrame against column mapping.
    Returns (warnings_list, summary_stats).
    """
    warnings = []
    
    # Check required mapped columns
    missing_required = []
    for req in REQUIRED_COLUMNS.keys():
        if req not in mapping or not mapping[req] or mapping[req] not in df.columns:
            missing_required.append(req)

    if missing_required:
        warnings.append(f"Missing mapping for required column(s): {', '.join(missing_required)}")

    # Check date column
    if "order_date" in mapping and mapping["order_date"] in df.columns:
        col = mapping["order_date"]
        parsed_dates = pd.to_datetime(df[col], errors="coerce")
        bad_dates = parsed_dates.isna().sum()
        if bad_dates > 0:
            warnings.append(f"{bad_dates} rows have unparseable dates and will be dropped.")

    # Check numeric columns
    for num_col in ["quantity", "total_sales"]:
        if num_col in mapping and mapping[num_col] in df.columns:
            col = mapping[num_col]
            parsed_num = pd.to_numeric(df[col].astype(str).str.replace(r"[^\d.-]", "", regex=True), errors="coerce")
            bad_num = parsed_num.isna().sum()
            if bad_num > 0:
                warnings.append(f"{bad_num} rows have invalid numbers in '{mapping[num_col]}' column.")

    summary = {
        "total_rows": len(df),
        "total_columns": len(df.columns),
        "columns_mapped": len(mapping),
        "missing_required": missing_required,
    }

    return warnings, summary


def clean_and_process_dataset(df: pd.DataFrame, mapping: Dict[str, str]) -> pd.DataFrame:
    """
    Clean mapped dataset and standardize column names and types.
    """
    clean_df = pd.DataFrame()

    # Apply mapping
    for std_name, orig_col in mapping.items():
        if orig_col and orig_col in df.columns:
            clean_df[std_name] = df[orig_col]

    # Defaults for missing optional columns
    if "order_date" in clean_df:
        clean_df["order_date"] = pd.to_datetime(clean_df["order_date"], errors="coerce")
        clean_df = clean_df.dropna(subset=["order_date"])

    if "quantity" in clean_df:
        clean_df["quantity"] = pd.to_numeric(
            clean_df["quantity"].astype(str).str.replace(r"[^\d.-]", "", regex=True),
            errors="coerce"
        ).fillna(1)
    else:
        clean_df["quantity"] = 1

    if "total_sales" in clean_df:
        clean_df["total_sales"] = pd.to_numeric(
            clean_df["total_sales"].astype(str).str.replace(r"[^\d.-]", "", regex=True),
            errors="coerce"
        ).fillna(0.0)

    if "unit_price" not in clean_df:
        clean_df["unit_price"] = np.where(
            clean_df["quantity"] > 0,
            clean_df["total_sales"] / clean_df["quantity"],
            0.0
        )

    if "product" not in clean_df:
        clean_df["product"] = "Unspecified Item"
    else:
        clean_df["product"] = clean_df["product"].astype(str).str.strip()

    if "category" not in clean_df:
        clean_df["category"] = "General"
    else:
        clean_df["category"] = clean_df["category"].astype(str).str.strip()

    if "channel" not in clean_df:
        clean_df["channel"] = "Register"
    else:
        # Standardize channel names per user request
        c_map = {
            "uber eats": "Swiggy",
            "ubereats": "Swiggy",
            "doordash": "Zomato",
            "square online": "Personal Delivery",
            "online": "Personal Delivery",
        }
        clean_df["channel"] = clean_df["channel"].astype(str).str.strip()
        clean_df["channel"] = clean_df["channel"].replace(c_map)

    if "payment_mode" not in clean_df:
        clean_df["payment_mode"] = "Card"

    if "event_type" not in clean_df:
        clean_df["event_type"] = "Payment"

    if "store" not in clean_df:
        clean_df["store"] = "Main Store"

    if "city" not in clean_df:
        clean_df["city"] = "Mumbai"

    # Sort chronologically
    if "order_date" in clean_df:
        clean_df = clean_df.sort_values("order_date").reset_index(drop=True)

    return clean_df


def save_user_dataset(df: pd.DataFrame, user_id: str, filename: str, replace_old: bool = True) -> Tuple[str, str]:
    """Save cleaned DataFrame to user's storage folder, deleting old CSV datasets if replace_old is True."""
    user_dir = os.path.join(UPLOAD_DIR, user_id)
    os.makedirs(user_dir, exist_ok=True)

    if replace_old:
        for f in os.listdir(user_dir):
            if f.endswith(".csv"):
                try:
                    os.remove(os.path.join(user_dir, f))
                except Exception as e:
                    print(f"Error removing old dataset file {f}: {e}")

    dataset_id = str(uuid.uuid4())
    save_path = os.path.join(user_dir, f"{dataset_id}.csv")
    df.to_csv(save_path, index=False)
    return dataset_id, save_path
