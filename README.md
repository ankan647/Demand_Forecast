# 📊 SalesPulse — Retail Store Sales Forecast Dashboard

A full-stack sales forecasting & analytics dashboard for a Korean restaurant (Mumbai, India), built with **Python (FastAPI)** and **React (Vite + Recharts)**.

Uses 6 months of real Square POS transaction data (~12,600 cleaned line-item records) to deliver item-level demand forecasting, auto-generated insights, and actionable restock/discount alerts.

![Dashboard Preview](https://img.shields.io/badge/Status-Complete-brightgreen) ![Python](https://img.shields.io/badge/Python-3.11+-blue) ![React](https://img.shields.io/badge/React-18-61dafb) ![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **KPI Dashboard** | Total revenue, orders, AOV, top product, category count |
| **Revenue Trends** | Interactive daily/weekly area charts with filters |
| **Item Analytics** | Sortable, searchable table with rank badges and pagination |
| **Demand Forecast** | Per-item ETS (Holt-Winters) forecasting with confidence intervals (1–12 weeks) |
| **Auto Insights** | 10 rule-based insight types: WoW growth, weekend ratios, peak days, channel concentration |
| **Smart Alerts** | Forecast-driven restock-risk, discount-candidate, and high-refund anomaly detection |
| **Menu Matrix** | Scatter plot classifying items into Star / Plow Horse / Puzzle / Dog quadrants |
| **Channel Performance** | Donut chart + bar breakdown across Register, Uber Eats, DoorDash, Square Online |
| **Basket Affinity** | Co-purchase pair analysis with support, confidence, and lift metrics |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.13, FastAPI, Uvicorn |
| Data | pandas, openpyxl, numpy |
| Forecasting | statsmodels (Exponential Smoothing / Holt-Winters) |
| ML | scikit-learn (KMeans, IsolationForest) |
| Frontend | React 18 (Vite), Recharts, React Icons |
| Styling | Custom CSS — dark glassmorphism with warm amber palette |
| Fonts | Inter (Google Fonts) |

---

## 📁 Project Structure

```
├── backend/
│   ├── main.py                  # FastAPI app (11 endpoints)
│   ├── data_cleaning.py         # Excel → CSV pipeline
│   ├── aggregations.py          # KPI, trend, item aggregation
│   ├── forecasting.py           # ETS per-item forecasting
│   ├── insights.py              # Rule-based insight generator
│   ├── alerts.py                # Restock/discount/refund alerts
│   ├── menu_matrix.py           # Menu engineering quadrants
│   ├── basket_analysis.py       # Co-purchase analysis
│   ├── requirements.txt
│   └── data/
│       └── sales_data_clean.csv
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── components/
│   │       ├── KpiCards.jsx
│   │       ├── RevenueTrendChart.jsx
│   │       ├── ItemTable.jsx
│   │       ├── ForecastChart.jsx
│   │       ├── InsightsPanel.jsx
│   │       ├── AlertsPanel.jsx
│   │       ├── MenuMatrix.jsx
│   │       ├── ChannelBreakdown.jsx
│   │       └── BasketAffinity.jsx
│   └── package.json
├── raw_data.xlsx
├── finished_project.xlsx
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python data_cleaning.py          # Generate sales_data_clean.csv
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 📡 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/kpis` | Headline KPI metrics |
| `GET /api/trends?granularity=weekly` | Time-series revenue data |
| `GET /api/items` | Item performance table |
| `GET /api/forecast?item=...&weeks=4` | Per-item forecast + confidence intervals |
| `GET /api/forecast/items` | List of forecastable items |
| `GET /api/insights` | Auto-generated insights |
| `GET /api/alerts` | Restock & discount alerts |
| `GET /api/menu-matrix` | Menu engineering quadrants |
| `GET /api/channel-breakdown` | Channel revenue split |
| `GET /api/category-breakdown` | Category revenue split |
| `GET /api/basket-affinity` | Co-purchase pairs |
| `GET /api/filters` | Available filter options |

All endpoints support query filters: `?category=&channel=&start=&end=`

---

## 📊 Dataset

6-month Square POS export from a single restaurant location:
- **12,669** cleaned line-item transactions
- **111** unique menu items across **11** categories
- **6** sales channels (Register, Uber Eats, DoorDash, Square Online, etc.)
- Date range: June 26 – December 30, 2023

---

## 📄 License

This project is for educational and portfolio purposes.
