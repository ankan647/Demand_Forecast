import { useState, useEffect, useCallback } from 'react'
import { HiChartBar, HiCube, HiTrendingUp, HiLightBulb, HiExclamation, HiViewGrid, HiGlobe, HiLink, HiMenuAlt2, HiChevronLeft } from 'react-icons/hi'
import KpiCards from './components/KpiCards'
import RevenueTrendChart from './components/RevenueTrendChart'
import ItemTable from './components/ItemTable'
import ForecastChart from './components/ForecastChart'
import InsightsPanel from './components/InsightsPanel'
import AlertsPanel from './components/AlertsPanel'
import MenuMatrix from './components/MenuMatrix'
import ChannelBreakdown from './components/ChannelBreakdown'
import BasketAffinity from './components/BasketAffinity'

const API_BASE = 'http://localhost:8000/api'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: HiChartBar },
  { id: 'items', label: 'Item Analytics', icon: HiCube },
  { id: 'forecast', label: 'Forecast', icon: HiTrendingUp },
  { id: 'insights', label: 'Insights', icon: HiLightBulb },
  { id: 'alerts', label: 'Alerts', icon: HiExclamation },
  { id: 'menu-matrix', label: 'Menu Matrix', icon: HiViewGrid },
  { id: 'channels', label: 'Channels', icon: HiGlobe },
  { id: 'basket', label: 'Basket Affinity', icon: HiLink },
]

function App() {
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    channel: '',
    start: '',
    end: '',
  })
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    channels: [],
    date_range: { min: '', max: '' },
  })

  // Load filter options on mount
  useEffect(() => {
    fetch(`${API_BASE}/filters`)
      .then(r => r.json())
      .then(data => setFilterOptions(data))
      .catch(console.error)
  }, [])

  const buildQuery = useCallback((extra = {}) => {
    const params = new URLSearchParams()
    if (filters.category) params.set('category', filters.category)
    if (filters.channel) params.set('channel', filters.channel)
    if (filters.start) params.set('start', filters.start)
    if (filters.end) params.set('end', filters.end)
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, v)
    })
    const qs = params.toString()
    return qs ? `?${qs}` : ''
  }, [filters])

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍗</div>
          {!sidebarCollapsed && (
            <div>
              <h1>SalesPulse</h1>
              <div className="subtitle">Analytics Dashboard</div>
            </div>
          )}
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => setActivePage(item.id)}
            >
              <item.icon className="nav-icon" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        >
          {sidebarCollapsed ? <HiMenuAlt2 size={18} /> : <HiChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Page Header with Filters */}
        <header className="page-header">
          <div>
            <h1 className="page-title">
              {activePage === 'dashboard' && <><span className="highlight">Sales</span> Dashboard</>}
              {activePage === 'items' && <><span className="highlight">Item</span> Analytics</>}
              {activePage === 'forecast' && <><span className="highlight">Demand</span> Forecast</>}
              {activePage === 'insights' && <><span className="highlight">Auto</span> Insights</>}
              {activePage === 'alerts' && <><span className="highlight">Smart</span> Alerts</>}
              {activePage === 'menu-matrix' && <><span className="highlight">Menu</span> Engineering</>}
              {activePage === 'channels' && <><span className="highlight">Channel</span> Performance</>}
              {activePage === 'basket' && <><span className="highlight">Basket</span> Affinity</>}
            </h1>
            <p className="page-subtitle">
              TK Korean Restaurant • Mumbai, India • Jun–Dec 2023
            </p>
          </div>

          <div className="filter-bar">
            <select
              className="filter-select"
              value={filters.category}
              onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}
            >
              <option value="">All Categories</option>
              {filterOptions.categories
                .filter(c => c !== 'Custom Amount')
                .map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
            </select>

            <select
              className="filter-select"
              value={filters.channel}
              onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
            >
              <option value="">All Channels</option>
              {filterOptions.channels.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <input
              className="filter-input"
              type="date"
              value={filters.start}
              min={filterOptions.date_range.min}
              max={filterOptions.date_range.max}
              onChange={e => setFilters(f => ({ ...f, start: e.target.value }))}
              placeholder="Start Date"
            />
            <input
              className="filter-input"
              type="date"
              value={filters.end}
              min={filterOptions.date_range.min}
              max={filterOptions.date_range.max}
              onChange={e => setFilters(f => ({ ...f, end: e.target.value }))}
              placeholder="End Date"
            />
          </div>
        </header>

        {/* Page Content */}
        {activePage === 'dashboard' && (
          <DashboardPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'items' && (
          <ItemsPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'forecast' && (
          <ForecastPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'insights' && (
          <InsightsPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'alerts' && (
          <AlertsPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'menu-matrix' && (
          <MenuMatrixPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'channels' && (
          <ChannelsPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
        {activePage === 'basket' && (
          <BasketPage apiBase={API_BASE} buildQuery={buildQuery} />
        )}
      </main>
    </div>
  )
}

/* ── Page Components ─────────────────────────────────────────────── */

function DashboardPage({ apiBase, buildQuery }) {
  const [kpis, setKpis] = useState(null)
  const [trends, setTrends] = useState([])
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = buildQuery()
    Promise.all([
      fetch(`${apiBase}/kpis${q}`).then(r => r.json()),
      fetch(`${apiBase}/trends${q}&granularity=weekly`).then(r => r.json()),
      fetch(`${apiBase}/items${q}`).then(r => r.json()),
    ])
      .then(([k, t, i]) => {
        setKpis(k)
        setTrends(t)
        setItems(i)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery])

  if (loading) return <LoadingState />

  return (
    <div className="animate-fade-in">
      <KpiCards data={kpis} />

      <div className="section-grid two-col">
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">📊 Revenue Trends</h3>
          </div>
          <RevenueTrendChart apiBase={apiBase} buildQuery={buildQuery} />
        </div>
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">🏆 Top 10 Products</h3>
          </div>
          {items && (
            <div className="data-table-wrapper" style={{ maxHeight: 380, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Revenue</th>
                    <th>Units</th>
                  </tr>
                </thead>
                <tbody>
                  {items.top_sellers?.map((item, i) => (
                    <tr key={item.product}>
                      <td>
                        <span className={`rank-badge ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'default'}`}>
                          {i + 1}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.product}</td>
                      <td className="mono">₹{item.total_revenue.toLocaleString('en-IN')}</td>
                      <td className="mono">{item.total_quantity.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ItemsPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <div className="glass-card">
        <ItemTable apiBase={apiBase} buildQuery={buildQuery} />
      </div>
    </div>
  )
}

function ForecastPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <div className="glass-card">
        <ForecastChart apiBase={apiBase} buildQuery={buildQuery} />
      </div>
    </div>
  )
}

function InsightsPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <InsightsPanel apiBase={apiBase} buildQuery={buildQuery} />
    </div>
  )
}

function AlertsPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <AlertsPanel apiBase={apiBase} buildQuery={buildQuery} />
    </div>
  )
}

function MenuMatrixPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <MenuMatrix apiBase={apiBase} buildQuery={buildQuery} />
    </div>
  )
}

function ChannelsPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <ChannelBreakdown apiBase={apiBase} buildQuery={buildQuery} />
    </div>
  )
}

function BasketPage({ apiBase, buildQuery }) {
  return (
    <div className="animate-fade-in">
      <BasketAffinity apiBase={apiBase} buildQuery={buildQuery} />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
      <p className="loading-text">Loading data...</p>
    </div>
  )
}

export default App
