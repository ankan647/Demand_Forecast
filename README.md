# 📊 SalesPulse — AI-Powered Restaurant & Retail Sales Forecasting Dashboard

[![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen.svg?style=flat-square)](#)
[![Python](https://img.shields.io/badge/Python-3.11%20|%203.12%20|%203.13-blue.svg?style=flat-square&logo=python)](#)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?style=flat-square&logo=fastapi)](#)
[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](#)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF.svg?style=flat-square&logo=vite)](#)
[![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E.svg?style=flat-square&logo=supabase)](#)
[![License](https://img.shields.io/badge/License-MIT-orange.svg?style=flat-square)](#)

**SalesPulse** is a modern, full-stack predictive analytics and sales forecasting platform tailored for restaurants, cafes, and retail stores. It combines statistical time-series forecasting (ETS / Holt-Winters), menu engineering analytics (BCG Matrix), market basket affinity mining, automated heuristic business insights, and smart inventory alert systems into an ultra-responsive, glassmorphic dashboard.

Featuring **dynamic multi-tenant CSV/Excel dataset uploads**, **Supabase JWT authentication**, **multi-format reporting exports (CSV/XLSX/PNG)**, and an **interactive Light/Dark adaptive UI**, SalesPulse empowers operators to turn raw POS transaction logs into actionable operational decisions.

---

## 🌟 Key Highlights & Capabilities

### 📈 Predictive Demand Forecasting
- **Per-Item Holt-Winters / ETS Modeling**: Fits exponential smoothing time-series models on weekly sales velocity with trend and level estimation.
- **Configurable Horizons & Metrics**: Project 1 to 12 weeks into the future for both **Quantity Demanded** and **Gross Revenue**.
- **Confidence Intervals**: Calculates widening prediction uncertainty bands (upper/lower bounds) to guide safe inventory stocking.

### 🍱 Menu Engineering & BCG Matrix
- **Automated Menu Classification**: Categorizes products into **Stars** (High Volume, High Revenue), **Plow Horses** (High Volume, Low Revenue), **Puzzles** (Low Volume, High Revenue), and **Dogs** (Low Volume, Low Revenue).
- **Interactive 2D Scatter Matrix**: Visual breakdown with item tooltips and strategic recommendations for pricing adjustments and menu redesign.

### 🛒 Market Basket Affinity Analysis
- **Association Rule Discovery**: Identifies co-purchased item pairs from multi-item orders.
- **Support, Confidence & Lift Metrics**: Data-backed combo pairings and cross-selling recommendations.

### 💡 Automated Heuristic Insights & Smart Alerts
- **Rule-Based Business Insights**: Automatically detects Week-over-Week (WoW) revenue trends, weekend-vs-weekday velocity spikes, channel concentration, top product revenue shares, and refund anomalies.
- **Operational Restock & Discount Alerts**: Generates low-stock risk alerts from upcoming demand spikes, flags slow-moving stock for discount promotions, and detects elevated refund rates with severity levels.

### 📤 Dynamic Dataset Upload & Management Engine
- **Universal CSV & Excel Support**: Drag-and-drop `.csv`, `.xlsx`, or `.xls` transaction files.
- **Auto Column-Mapping & Validation**: Fuzzy-matches POS column headers, validates date ranges/formats, cleans numeric fields, and presents a live 5-row preview.
- **Isolated User Storage**: Per-user dataset persistence with seamless dataset switching, activation, and deletion.

### 🔐 Multi-Tenant Authentication & Custom Onboarding
- **Supabase JWT Authentication**: Secure signup, login, password reset, and guest demo mode.
- **Personalized Restaurant Profile**: Onboarding wizard to configure restaurant name, cuisine type, location/city, and regional currency symbol (₹, $, €, £, ¥, etc.).

### 🎨 State-of-the-Art Visual Experience
- **Adaptive Day/Night Theme System**: Fluid toggle between a clean daylight theme and a glowing glassmorphism dark theme with animated sky toggle.
- **Interactive Tubelight Navigation**: Floating navigation bar with smooth Framer Motion glow animations.
- **Antigravity Particle Physics**: Interactive dynamic particle backgrounds.
- **1-Click Data Export**: Download raw & processed analytics, forecasts, and alerts in **CSV** or **Excel (.xlsx)** format.

---

## 🏗️ Architecture & Tech Stack

```
                     ┌─────────────────────────────────────────┐
                     │          React 19 + Vite Frontend       │
                     │  (Recharts, TailwindCSS, Framer Motion) │
                     └────────────────────┬────────────────────┘
                                          │ HTTP / REST & JWT
                                          ▼
                     ┌─────────────────────────────────────────┐
                     │            FastAPI Backend              │
                     │ (Python 3.13, Uvicorn, Pandas, Numpy)   │
                     └───────┬────────────────────┬────────────┘
                             │                    │
              ┌──────────────┴───────┐   ┌────────┴──────────────┐
              │  Analytics & ML Core │   │   Storage & Auth      │
              │  - Statsmodels (ETS) │   │   - Supabase Auth API │
              │  - Scikit-Learn      │   │   - User Upload Store │
              │  - Association Rules │   │   - Default POS CSV   │
              └──────────────────────┘   └───────────────────────┘
```

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, Vite 8.2, TypeScript / JSX |
| **Styling & Effects** | TailwindCSS v4, Custom Glassmorphism CSS, Framer Motion, Three.js, Lucide Icons, React Icons |
| **Data Visualization** | Recharts (Area, Bar, Donut, Scatter, Composed Charts) |
| **Backend Framework** | Python 3.11+, FastAPI, Uvicorn, Pydantic |
| **Data Processing & ML**| pandas, numpy, openpyxl, statsmodels (Holt-Winters ETS), scikit-learn, scipy |
| **Auth & Multi-Tenancy**| Supabase Auth (JWT Bearer tokens), user-isolated directory storage |
| **Export Engines** | Python `openpyxl` (Excel), `io.StringIO` (CSV), HTML5 Canvas (Chart Snapshots) |

---

## 📁 Project Directory Structure

```
restaurant_predictor/
├── backend/
│   ├── main.py                  # FastAPI application & REST endpoint router
│   ├── auth.py                  # Supabase JWT token verification middleware
│   ├── upload.py                # Dataset parsing, fuzzy mapping & cleaning engine
│   ├── export.py                # Multi-format CSV & Excel export generator
│   ├── forecasting.py           # Holt-Winters / ETS time-series forecasting
│   ├── aggregations.py          # KPI metrics, revenue trends, item aggregations
│   ├── insights.py              # Statistical & heuristic business insights
│   ├── alerts.py                # Restock risk & discount candidate alert rules
│   ├── menu_matrix.py           # BCG menu engineering quadrant classification
│   ├── basket_analysis.py       # Market basket co-purchase & lift analysis
│   ├── data_cleaning.py         # Batch ETL pipeline for raw POS datasets
│   ├── requirements.txt         # Python dependencies
│   └── data/
│       ├── sales_data_clean.csv # Default sample dataset (12,600+ records)
│       └── uploads/             # User-uploaded dataset storage (per-user isolation)
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Main dashboard application & layout
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Custom CSS tokens, glassmorphism & themes
│   │   ├── components/
│   │   │   ├── KpiCards.jsx          # Headline KPI cards with trend comparisons
│   │   │   ├── RevenueTrendChart.jsx # Time-series daily/weekly revenue area chart
│   │   │   ├── ItemTable.jsx         # Searchable, sortable item performance table
│   │   │   ├── ForecastChart.jsx     # Demand forecast chart with confidence bands
│   │   │   ├── InsightsPanel.jsx     # Automated actionable insight cards
│   │   │   ├── AlertsPanel.jsx       # Inventory restock & refund rate alerts
│   │   │   ├── MenuMatrix.jsx        # BCG menu engineering scatter matrix
│   │   │   ├── ChannelBreakdown.jsx  # Channel & category share charts
│   │   │   ├── BasketAffinity.jsx    # Market basket co-purchase pair cards
│   │   │   ├── UploadWizard.jsx      # Multi-step dataset upload modal
│   │   │   ├── DatasetSwitcher.jsx   # Dataset selector & management dropdown
│   │   │   ├── AuthGuard.jsx         # Supabase Auth provider & hook
│   │   │   ├── AuthModal.jsx         # Login, registration & reset modal
│   │   │   ├── OnboardingModal.jsx   # Restaurant metadata setup wizard
│   │   │   ├── UserDetailsModal.jsx  # User profile & preferences modal
│   │   │   ├── ExportButton.jsx      # CSV/XLSX/PNG export trigger button
│   │   │   ├── NoDatasetGate.jsx     # Zero-state placeholder with upload callout
│   │   │   ├── Antigravity.jsx       # Physics-based background animation
│   │   │   └── ui/
│   │   │       ├── tubelight-navbar.tsx # Animated floating navbar
│   │   │       ├── sky-toggle.tsx       # Day/Night theme switch
│   │   │       └── sign-in-card-2.tsx   # Glassmorphic auth card
│   │   └── lib/
│   │       └── utils.ts         # Utility helpers (cn class merger)
│   ├── package.json
│   └── vite.config.js
├── raw_data.xlsx                # Source raw Square POS transaction workbook
├── finished_project.xlsx        # Processed multi-sheet transaction workbook
├── .env                         # Supabase & backend configuration
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- **Python**: Version 3.11, 3.12, or 3.13
- **Node.js**: Version 18.x or higher (along with `npm`)
- **Git**: Installed and configured

---

### 1. Clone the Repository
```bash
git clone https://github.com/ankan647/Demand_Forecast.git
cd Demand_Forecast
```

---

### 2. Environment Configuration
Create a `.env` file in the root directory (or use the existing template):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

*(Note: If Supabase credentials are not provided, the application runs seamlessly in standalone demo/guest mode using the pre-loaded default dataset).*

---

### 3. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Run the data cleaning ETL pipeline to regenerate the sample CSV:
python data_cleaning.py

# Launch the FastAPI backend server
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be live at: **`http://localhost:8000`**  
Interactive Swagger API documentation: **`http://localhost:8000/docs`**

---

### 4. Frontend Setup

```bash
# Navigate to frontend directory in a new terminal
cd frontend

# Install Node dependencies
npm install

# Start the Vite development server
npm run dev
```

Open your browser and navigate to: **`http://localhost:5173`**

---

## 📡 REST API Reference

All data endpoints automatically inherit active filters passed via query parameters:  
`?category=&channel=&start=&end=&store=&city=`

### 📊 Analytics Endpoints
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/kpis` | Summary metrics (Revenue, Orders, AOV, Top Item, Breadth) |
| `GET` | `/api/trends?granularity=daily\|weekly` | Time-series revenue history for area charts |
| `GET` | `/api/items` | Full item performance ranking and aggregations |
| `GET` | `/api/forecast?item={name}&weeks={1-12}&metric=quantity\|revenue` | ETS forecast points and confidence bounds |
| `GET` | `/api/forecast/items` | List of items eligible for time-series forecasting |
| `GET` | `/api/insights` | Auto-generated statistical & heuristic business insights |
| `GET` | `/api/alerts` | Restock risk, discount suggestions, and refund warnings |
| `GET` | `/api/menu-matrix` | BCG menu engineering quadrant coordinates & stats |
| `GET` | `/api/channel-breakdown` | Sales channel revenue and transaction share |
| `GET` | `/api/category-breakdown` | Category-level sales distribution |
| `GET` | `/api/basket-affinity` | Market basket co-purchase pairs with support & lift |
| `GET` | `/api/filters` | Dynamic available filter values (categories, channels, dates) |

### 📤 Dataset Upload & Management
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/datasets/upload` | Required | Upload CSV/XLSX, auto-detect columns, return preview |
| `POST` | `/api/datasets/confirm` | Required | Confirm column mappings, process & activate dataset |
| `GET` | `/api/datasets` | Required | List all custom datasets uploaded by current user |
| `POST` | `/api/datasets/{id}/activate` | Required | Switch active dataset for current session |
| `DELETE` | `/api/datasets/{id}` | Required | Permanently delete a custom uploaded dataset |

### 👤 Profile & Onboarding
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/profile` | Optional | Retrieve restaurant metadata and onboarding status |
| `POST` | `/api/profile` | Required | Update restaurant name, city, cuisine, and currency |

### 📥 Data Export
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/export/items?export_format=csv\|xlsx` | Export item performance table |
| `GET` | `/api/export/trends?granularity=weekly&export_format=csv\|xlsx` | Export revenue trend data |
| `GET` | `/api/export/forecast?item={name}&weeks=4&export_format=csv\|xlsx` | Export item forecast and confidence bounds |
| `GET` | `/api/export/alerts?export_format=csv\|xlsx` | Export inventory and refund alerts |

---

## 📋 Dataset Schema & Custom Upload Guide

SalesPulse can process any restaurant, cafe, or retail POS dataset. The intelligent upload wizard automatically fuzzy-matches your column names to the standard schema:

### Expected Schema Fields
| Standard Field | Type | Required | Sample Header Aliases |
|---|---|---|---|
| `order_date` | Date / DateTime | **Yes** | `Date`, `Transaction Date`, `Time`, `Created At`, `Order Date` |
| `product` | String | **Yes** | `Item`, `Item Name`, `Product Name`, `Menu Item` |
| `category` | String | **Yes** | `Category`, `Item Category`, `Department` |
| `quantity` | Numeric | **Yes** | `Qty`, `Quantity`, `Units`, `Items Sold`, `Unit Count` |
| `total_sales` | Numeric | **Yes** | `Gross Sales`, `Net Sales`, `Revenue`, `Amount`, `Total` |
| `unit_price` | Numeric | Optional | `Unit Price`, `Price`, `Item Price`, `Rate` |
| `channel` | String | Optional | `Source`, `Channel`, `Sales Channel`, `Order Type` |
| `payment_mode` | String | Optional | `Payment Method`, `Payment Type`, `Tender Type` |
| `event_type` | String | Optional | `Event Type`, `Transaction Type` (`Payment` vs `Refund`) |

---

## 📊 Default Benchmark Dataset

The bundled demonstration dataset is based on real Square POS transaction logs from a high-volume Korean restaurant:
- **12,669** cleaned line-item records
- **111** distinct menu items across **11** categories
- **6** fulfillment channels (Register POS, Swiggy / Uber Eats, Zomato / DoorDash, Personal Delivery)
- Date range: **June 2023 – December 2023**

---

## 🤝 Contributing

Contributions, feature suggestions, and pull requests are welcome!
1. Fork the project repository.
2. Create your feature branch (`git checkout -b feature/NewFeature`).
3. Commit your modifications (`git commit -m 'Add NewFeature'`).
4. Push to the branch (`git push origin feature/NewFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.
