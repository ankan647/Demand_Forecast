"""
Data Cleaning Pipeline
Reads the cleaned Square POS export (finished_project.xlsx),
joins item-level and transaction-level data, derives computed fields,
and outputs a flat CSV matching the target schema.
"""

import pandas as pd
import numpy as np
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)
INPUT_FILE = os.path.join(PROJECT_DIR, "finished_project.xlsx")
OUTPUT_DIR = os.path.join(BASE_DIR, "data")
OUTPUT_CSV = os.path.join(OUTPUT_DIR, "sales_data_clean.csv")
TRAFFIC_CSV = os.path.join(OUTPUT_DIR, "traffic_data.csv")


def load_items_data(filepath: str) -> pd.DataFrame:
    """Load the Items Data sheet."""
    df = pd.read_excel(filepath, sheet_name="Items Data", engine="openpyxl")
    print(f"  Items Data loaded: {df.shape[0]} rows x {df.shape[1]} cols")
    return df


def load_transaction_data(filepath: str) -> pd.DataFrame:
    """Load the Transaction Data sheet."""
    df = pd.read_excel(filepath, sheet_name="Transaction Data", engine="openpyxl")
    print(f"  Transaction Data loaded: {df.shape[0]} rows x {df.shape[1]} cols")
    return df


def load_traffic_data(filepath: str) -> pd.DataFrame:
    """Load and parse the Traffic Summary Data sheet."""
    df = pd.read_excel(filepath, sheet_name="Traffic Summary Data", engine="openpyxl")
    # The traffic data has a header section; actual data starts after row 5
    # Columns at row 5 are: Date, Total Net Sales, Uniques, Visits, Visits per unique
    # Find the row with actual date data
    traffic_rows = []
    for _, row in df.iterrows():
        val = row.iloc[3]  # Check column index 3 for "Date" header
        if isinstance(val, str) and val == "Date":
            continue
        if pd.notna(row.iloc[3]) and isinstance(row.iloc[3], pd.Timestamp):
            traffic_rows.append({
                "date": row.iloc[3],
                "total_net_sales": row.iloc[4],
                "uniques": row.iloc[5],
                "visits": row.iloc[6],
            })
    traffic_df = pd.DataFrame(traffic_rows)
    if not traffic_df.empty:
        traffic_df["date"] = pd.to_datetime(traffic_df["date"]).dt.date
        for col in ["total_net_sales", "uniques", "visits"]:
            traffic_df[col] = pd.to_numeric(traffic_df[col], errors="coerce").fillna(0)
    print(f"  Traffic Data loaded: {traffic_df.shape[0]} rows")
    return traffic_df


def clean_payment_method(pm: str) -> str:
    """Map raw payment method values to clean labels."""
    if pd.isna(pm):
        return "Unknown"
    pm = str(pm).strip()
    mapping = {
        "Card": "Card",
        "Cash": "Cash",
        "Online": "Online",
        "Gift Card": "Gift Card",
        "Custom": "Other",
    }
    return mapping.get(pm, "Other")


def clean_channel(source: str) -> str:
    """Map raw Source values to clean channel labels."""
    if pd.isna(source):
        return "Unknown"
    source = str(source).strip()
    mapping = {
        "Register": "Register",
        "Square Online": "Square Online",
        "Uber Eats": "Uber Eats",
        "DoorDash": "DoorDash",
        "Uber Eats Pickup": "Uber Eats Pickup",
        "DoorDash Pickup": "DoorDash Pickup",
        "Point of Sale": "Register",
        "eCommerce Integrations": "Square Online",
    }
    return mapping.get(source, "Other")


def run_cleaning():
    """Main cleaning pipeline."""
    print("=" * 60)
    print("Data Cleaning Pipeline")
    print("=" * 60)

    # 1. Load data
    print("\n[1/7] Loading data...")
    items_df = load_items_data(INPUT_FILE)
    txn_df = load_transaction_data(INPUT_FILE)

    # 2. Prepare transaction lookup for join
    print("\n[2/7] Preparing transaction join key...")
    txn_df["join_key"] = (
        txn_df["Date"].astype(str) + "_" + txn_df["Time"].astype(str)
    )
    # Keep only needed columns from transactions, deduplicate on join_key
    txn_lookup = txn_df[["join_key", "Source", "Payment Method"]].copy()
    txn_lookup = txn_lookup.drop_duplicates(subset=["join_key"], keep="first")
    print(f"  Transaction lookup: {txn_lookup.shape[0]} unique keys")

    # 3. Join items with transactions
    print("\n[3/7] Joining items with transactions...")
    items_df["join_key"] = (
        items_df["Date"].astype(str) + "_" + items_df["Time"].astype(str)
    )
    merged = items_df.merge(txn_lookup, on="join_key", how="left")
    print(f"  Merged: {merged.shape[0]} rows")
    print(f"  Source filled: {merged['Source'].notna().sum()} / {len(merged)}")
    print(f"  Payment Method filled: {merged['Payment Method'].notna().sum()} / {len(merged)}")

    # 4. Derive computed fields
    print("\n[4/7] Deriving computed fields...")

    # Unit price: Product Sales / Qty (handle zero qty)
    merged["unit_price"] = np.where(
        merged["Qty"] != 0,
        (merged["Product Sales"] / merged["Qty"]).round(2),
        merged["Product Sales"].round(2)  # For zero-qty rows, use product sales as-is
    )
    # Make unit_price absolute (refunds have negative values)
    merged["unit_price"] = merged["unit_price"].abs()

    # Clean channel and payment method
    merged["channel"] = merged["Source"].apply(clean_channel)
    merged["payment_mode"] = merged["Payment Method"].apply(clean_payment_method)

    # Customer type - set to "Guest" (no customer ID available in cleaned data)
    merged["customer_type"] = "Guest"

    # Store and city - single location, Indian context
    merged["store"] = "TK Korean Restaurant"
    merged["city"] = "Mumbai"

    # 5. Build output schema
    print("\n[5/7] Building output schema...")
    output = pd.DataFrame({
        "order_date": pd.to_datetime(merged["Date"]).dt.date,
        "store": merged["store"],
        "city": merged["city"],
        "product": merged["Item"].str.strip(),
        "category": merged["Category"].str.strip(),
        "quantity": merged["Qty"],
        "unit_price": merged["unit_price"],
        "discount": merged["Discounts"].abs().round(2),  # Store as positive discount amount
        "tax": merged["Tax"].round(2),
        "total_sales": merged["Gross Sales"].round(2),
        "customer_type": merged["customer_type"],
        "payment_mode": merged["payment_mode"],
        "channel": merged["channel"],
        "event_type": merged["Event Type"].str.strip(),
    })

    # 6. Remove duplicates
    print("\n[6/7] Removing duplicates...")
    before = len(output)
    output = output.drop_duplicates()
    after = len(output)
    print(f"  Removed {before - after} exact duplicate rows")
    print(f"  Final dataset: {after} rows x {output.shape[1]} cols")

    # Filter out "Custom Amount" category from product-level analysis
    # (keep in dataset but flag — these are ad-hoc charges, not menu items)
    custom_count = (output["category"] == "Custom Amount").sum()
    print(f"  'Custom Amount' rows: {custom_count} (kept but noted)")

    # 7. Save output
    print("\n[7/7] Saving output...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output.to_csv(OUTPUT_CSV, index=False)
    print(f"  Saved: {OUTPUT_CSV}")

    # Summary stats
    print("\n" + "=" * 60)
    print("Dataset Summary")
    print("=" * 60)
    print(f"  Date range: {output['order_date'].min()} to {output['order_date'].max()}")
    print(f"  Total rows: {len(output)}")
    print(f"  Unique products: {output['product'].nunique()}")
    print(f"  Categories: {sorted(output['category'].unique())}")
    print(f"  Channels: {sorted(output['channel'].unique())}")
    print(f"  Payment modes: {sorted(output['payment_mode'].unique())}")
    print(f"  Event types: {sorted(output['event_type'].unique())}")
    rev = output[output['event_type'] == 'Payment']['total_sales'].sum()
    ref = output[output['event_type'] == 'Refund']['total_sales'].abs().sum()
    print(f"  Total revenue (payments only): INR {rev:,.2f}")
    print(f"  Total refunds: INR {ref:,.2f}")

    # Traffic data
    print("\n[Bonus] Processing traffic data...")
    try:
        traffic_df = load_traffic_data(INPUT_FILE)
        if not traffic_df.empty:
            traffic_df.to_csv(TRAFFIC_CSV, index=False)
            print(f"  Saved: {TRAFFIC_CSV}")
    except Exception as e:
        print(f"  Traffic data skipped: {e}")

    return output


if __name__ == "__main__":
    run_cleaning()
