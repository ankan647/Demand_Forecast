"""
Per-item demand forecasting using statsmodels Exponential Smoothing.
Fits a model per item on weekly aggregated data, produces point forecasts
with confidence intervals that widen with horizon.
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.holtwinters import ExponentialSmoothing
import warnings

warnings.filterwarnings("ignore", category=FutureWarning)
warnings.filterwarnings("ignore", category=UserWarning)


def _aggregate_weekly(df: pd.DataFrame, item: str, metric: str = "quantity") -> pd.Series:
    """Aggregate item-level data to weekly frequency."""
    if df.empty:
        return pd.Series(dtype=float)

    item_data = df[
        (df["product"] == item) &
        (df["event_type"] == "Payment") &
        (df["category"] != "Custom Amount")
    ].copy()

    if item_data.empty:
        return pd.Series(dtype=float)

    item_data["order_date"] = pd.to_datetime(item_data["order_date"])
    item_data["week"] = item_data["order_date"].dt.to_period("W").apply(
        lambda x: x.start_time
    )

    if metric == "quantity":
        weekly = item_data.groupby("week")["quantity"].sum()
    else:
        weekly = item_data.groupby("week")["total_sales"].sum()

    # Ensure continuous weekly index (fill missing weeks with 0)
    if len(weekly) > 1:
        full_range = pd.date_range(
            start=weekly.index.min(),
            end=weekly.index.max(),
            freq="W-MON"
        )
        weekly = weekly.reindex(full_range, fill_value=0)

    weekly.index.name = "week"
    return weekly



def forecast_item(
    df: pd.DataFrame,
    item: str,
    weeks: int = 4,
    metric: str = "quantity"
) -> dict:
    """
    Generate forecast for a single item.

    Returns:
        {
            "item": str,
            "metric": str,
            "historical": [{"week": str, "actual": float}],
            "forecast": [{"week": str, "predicted": float, "lower": float, "upper": float}],
            "model_type": str,
            "error_msg": str or None,
        }
    """
    weekly = _aggregate_weekly(df, item, metric)

    result = {
        "item": item,
        "metric": metric,
        "historical": [],
        "forecast": [],
        "model_type": "none",
        "error_msg": None,
    }

    if weekly.empty:
        result["error_msg"] = f"No data found for item: {item}"
        return result

    # Build historical series
    for dt, val in weekly.items():
        result["historical"].append({
            "week": str(dt.date()) if hasattr(dt, "date") else str(dt),
            "actual": round(float(val), 2),
        })

    n = len(weekly)
    values = weekly.values.astype(float)

    # Strategy based on data length
    if n < 4:
        # Too little data — flat forecast at last known value
        last_val = float(values[-1])
        std = max(float(np.std(values)), 1.0)
        last_date = weekly.index[-1]

        for i in range(1, weeks + 1):
            future_date = last_date + pd.Timedelta(weeks=i)
            ci = 1.96 * std * np.sqrt(i)
            result["forecast"].append({
                "week": str(future_date.date()),
                "predicted": round(last_val, 2),
                "lower": round(max(0, last_val - ci), 2),
                "upper": round(last_val + ci, 2),
            })
        result["model_type"] = "flat (insufficient data)"
        return result

    if n < 8:
        # Moving average forecast
        window = min(4, n)
        ma = float(np.mean(values[-window:]))
        std = max(float(np.std(values[-window:])), 1.0)
        last_date = weekly.index[-1]

        for i in range(1, weeks + 1):
            future_date = last_date + pd.Timedelta(weeks=i)
            ci = 1.96 * std * np.sqrt(i)
            result["forecast"].append({
                "week": str(future_date.date()),
                "predicted": round(ma, 2),
                "lower": round(max(0, ma - ci), 2),
                "upper": round(ma + ci, 2),
            })
        result["model_type"] = "moving_average"
        return result

    # Exponential Smoothing (Holt-Winters)
    try:
        # Determine if seasonal component is appropriate
        # Need at least 2 full seasonal cycles; with weekly data, that's ~14 weeks
        use_seasonal = n >= 14
        seasonal_periods = 7 if use_seasonal else None  # ~7 weeks per seasonal cycle (approximate)

        if use_seasonal and n >= 14:
            # Try with seasonality
            try:
                model = ExponentialSmoothing(
                    values,
                    trend="add",
                    seasonal="add",
                    seasonal_periods=seasonal_periods,
                    initialization_method="estimated",
                )
                fitted = model.fit(optimized=True, use_brute=False)
            except Exception:
                # Fall back to trend-only
                model = ExponentialSmoothing(
                    values,
                    trend="add",
                    seasonal=None,
                    initialization_method="estimated",
                )
                fitted = model.fit(optimized=True, use_brute=False)
                use_seasonal = False
        else:
            model = ExponentialSmoothing(
                values,
                trend="add",
                seasonal=None,
                initialization_method="estimated",
            )
            fitted = model.fit(optimized=True, use_brute=False)

        # Generate forecast
        fc = fitted.forecast(weeks)

        # Compute confidence intervals from residual standard deviation
        residuals = fitted.resid
        resid_std = max(float(np.std(residuals)), 1.0)

        last_date = weekly.index[-1]
        for i in range(weeks):
            future_date = last_date + pd.Timedelta(weeks=i + 1)
            predicted = float(fc[i])
            ci = 1.96 * resid_std * np.sqrt(i + 1)

            result["forecast"].append({
                "week": str(future_date.date()),
                "predicted": round(max(0, predicted), 2),
                "lower": round(max(0, predicted - ci), 2),
                "upper": round(predicted + ci, 2),
            })

        result["model_type"] = f"ets_{'seasonal' if use_seasonal else 'trend'}"

    except Exception as e:
        # Final fallback: moving average
        window = 4
        ma = float(np.mean(values[-window:]))
        std = max(float(np.std(values[-window:])), 1.0)
        last_date = weekly.index[-1]

        for i in range(1, weeks + 1):
            future_date = last_date + pd.Timedelta(weeks=i)
            ci = 1.96 * std * np.sqrt(i)
            result["forecast"].append({
                "week": str(future_date.date()),
                "predicted": round(ma, 2),
                "lower": round(max(0, ma - ci), 2),
                "upper": round(ma + ci, 2),
            })
        result["model_type"] = "moving_average_fallback"
        result["error_msg"] = f"ETS failed, used moving average: {str(e)[:100]}"

    return result


def get_forecastable_items(df: pd.DataFrame, min_weeks: int = 4) -> list:
    """Return list of items that have enough data for forecasting."""
    if df.empty:
        return []

    payments = df[
        (df["event_type"] == "Payment") &
        (df["category"] != "Custom Amount")
    ].copy()
    if payments.empty:
        return []

    payments["order_date"] = pd.to_datetime(payments["order_date"])
    payments["week"] = payments["order_date"].dt.to_period("W")

    item_weeks = payments.groupby("product")["week"].nunique()
    valid = item_weeks[item_weeks >= min_weeks].sort_values(ascending=False)

    return [
        {"product": name, "weeks_of_data": int(count)}
        for name, count in valid.items()
    ]

