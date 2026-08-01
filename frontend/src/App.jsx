import { useState, useEffect, useCallback } from 'react'
import {
  HiChartBar, HiCube, HiTrendingUp, HiLightBulb, HiExclamation,
  HiViewGrid, HiGlobe, HiLink, HiMenuAlt2, HiChevronLeft,
  HiUser, HiLogout, HiLogin, HiUpload
} from 'react-icons/hi'
import KpiCards from './components/KpiCards'
import RevenueTrendChart from './components/RevenueTrendChart'
import ItemTable from './components/ItemTable'
import ForecastChart from './components/ForecastChart'
import InsightsPanel from './components/InsightsPanel'
import AlertsPanel from './components/AlertsPanel'
import MenuMatrix from './components/MenuMatrix'
import ChannelBreakdown from './components/ChannelBreakdown'
import BasketAffinity from './components/BasketAffinity'

import { AuthProvider, useAuth } from './components/AuthGuard'
import AuthModal from './components/AuthModal'
import UploadWizard from './components/UploadWizard'
import DatasetSwitcher from './components/DatasetSwitcher'

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

// Channel mapping for Indian perspective
const CHANNEL_LABEL_MAP = {
  'Uber Eats': 'Swiggy',
  'DoorDash': 'Zomato',
  'Square Online': 'Personal Delivery',
  'Register': 'Register',
}

function MainDashboard() {
  const { user, token, signOut } = useAuth()
  const [activePage, setActivePage] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [uploadWizardOpen, setUploadWizardOpen] = useState(false)
  const [activeDatasetId, setActiveDatasetId] = useState('default')

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

  // Load filter options on mount / token change / dataset change
  const loadFilters = useCallback(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${API_BASE}/filters`, { headers })
      .then(r => r.json())
      .then(data => setFilterOptions(data))
      .catch(console.error)
  }, [token])

  useEffect(() => {
    loadFilters()
  }, [loadFilters, activeDatasetId])

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

        {/* User Account / Auth Section in Sidebar */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {!sidebarCollapsed && (
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {user.email}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--accent-primary-light)' }}>
                    ● Authenticated
                  </div>
                </div>
              )}
              <button
                onClick={signOut}
                title="Sign Out"
                className="sidebar-toggle"
                style={{ margin: 0, padding: 6 }}
              >
                <HiLogout size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="sidebar-nav-item"
              style={{ color: 'var(--accent-primary-light)', background: 'rgba(245, 158, 11, 0.08)' }}
            >
              <HiLogin className="nav-icon" />
              {!sidebarCollapsed && <span>Sign In / Register</span>}
            </button>
          )}
        </div>

        <button
          className="sidebar-toggle"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          style={{ marginTop: 8 }}
        >
          {sidebarCollapsed ? <HiMenuAlt2 size={18} /> : <HiChevronLeft size={18} />}
        </button>
      </aside>

      {/* Main Content */}
      <main className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        {/* Page Header with Filters & Dataset Controls */}
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
            {/* Dataset Switcher Dropdown */}
            <DatasetSwitcher
              apiBase={API_BASE}
              onOpenUpload={() => {
                if (!user) setAuthModalOpen(true)
                else setUploadWizardOpen(true)
              }}
              onDatasetChanged={(id) => setActiveDatasetId(id)}
            />

            {/* Quick Upload Button */}
            <button
              onClick={() => {
                if (!user) setAuthModalOpen(true)
                else setUploadWizardOpen(true)
              }}
              className="filter-select"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: 'var(--gradient-warm)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
              }}
            >
              <HiUpload size={14} />
              <span>Upload CSV</span>
            </button>

            {/* Category Filter */}
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

            {/* Channel Filter (mapped to Swiggy/Zomato) */}
            <select
              className="filter-select"
              value={filters.channel}
              onChange={e => setFilters(f => ({ ...f, channel: e.target.value }))}
            >
              <option value="">All Channels</option>
              {filterOptions.channels.map(c => (
                <option key={c} value={c}>
                  {CHANNEL_LABEL_MAP[c] || c}
                </option>
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
          <DashboardPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'items' && (
          <ItemsPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'forecast' && (
          <ForecastPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'insights' && (
          <InsightsPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'alerts' && (
          <AlertsPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'menu-matrix' && (
          <MenuMatrixPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'channels' && (
          <ChannelsPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
        {activePage === 'basket' && (
          <BasketPage apiBase={API_BASE} buildQuery={buildQuery} token={token} />
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => setAuthModalOpen(false)}
      />

      {/* Upload Wizard */}
      <UploadWizard
        isOpen={uploadWizardOpen}
        onClose={() => setUploadWizardOpen(false)}
        apiBase={API_BASE}
        onUploadComplete={() => {
          loadFilters()
          setActiveDatasetId('custom_' + Date.now())
        }}
      />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <MainDashboard />
    </AuthProvider>
  )
}

/* ── Page Components ─────────────────────────────────────────────── */

function DashboardPage({ apiBase, buildQuery, token }) {
  const [kpis, setKpis] = useState(null)
  const [items, setItems] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = buildQuery()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      fetch(`${apiBase}/kpis${q}`, { headers }).then(r => r.json()),
      fetch(`${apiBase}/items${q}`, { headers }).then(r => r.json()),
    ])
      .then(([k, i]) => {
        setKpis(k)
        setItems(i)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  if (loading) return <LoadingState />

  return (
    <div className="animate-fade-in">
      <KpiCards data={kpis} />

      <div className="section-grid two-col">
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">📊 Revenue Trends</h3>
          </div>
          <RevenueTrendChart apiBase={apiBase} buildQuery={buildQuery} token={token} />
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

function ItemsPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <div className="glass-card">
        <ItemTable apiBase={apiBase} buildQuery={buildQuery} token={token} />
      </div>
    </div>
  )
}

function ForecastPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <div className="glass-card">
        <ForecastChart apiBase={apiBase} buildQuery={buildQuery} token={token} />
      </div>
    </div>
  )
}

function InsightsPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <InsightsPanel apiBase={apiBase} buildQuery={buildQuery} token={token} />
    </div>
  )
}

function AlertsPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <AlertsPanel apiBase={apiBase} buildQuery={buildQuery} token={token} />
    </div>
  )
}

function MenuMatrixPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <MenuMatrix apiBase={apiBase} buildQuery={buildQuery} token={token} />
    </div>
  )
}

function ChannelsPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <ChannelBreakdown apiBase={apiBase} buildQuery={buildQuery} token={token} />
    </div>
  )
}

function BasketPage({ apiBase, buildQuery, token }) {
  return (
    <div className="animate-fade-in">
      <BasketAffinity apiBase={apiBase} buildQuery={buildQuery} token={token} />
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
