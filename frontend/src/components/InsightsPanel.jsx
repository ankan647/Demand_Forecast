import { useState, useEffect } from 'react'
import { HiTrendingUp, HiTrendingDown, HiLightningBolt, HiStar, HiGlobe, HiCalendar, HiTag, HiRefresh, HiChartBar, HiCash } from 'react-icons/hi'

const ICON_MAP = {
  trending_up: HiTrendingUp,
  trending_down: HiTrendingDown,
  rocket: HiLightningBolt,
  alert: HiTrendingDown,
  star: HiStar,
  moon: HiCalendar,
  globe: HiGlobe,
  store: HiCash,
  tag: HiTag,
  undo: HiRefresh,
  chart: HiChartBar,
  calendar: HiCalendar,
  trophy: HiStar,
  receipt: HiCash,
}

const CATEGORY_LABELS = {
  Revenue: '💰 Revenue Insights',
  Products: '📦 Product Insights',
  Operations: '⚙️ Operations Insights',
  Trends: '📈 Trend Insights',
}

export default function InsightsPanel({ apiBase, buildQuery, token }) {
  const [insights, setInsights] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${apiBase}/insights${buildQuery()}`, { headers })
      .then(r => r.json())
      .then(data => setInsights(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  const categories = ['all', ...new Set(insights.map(i => i.category))]
  const filtered = activeTab === 'all' ? insights : insights.filter(i => i.category === activeTab)

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Generating insights...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="glass-card">
        <div className="card-header">
          <h3 className="card-title">💡 Auto-Generated Insights</h3>
          <span className="badge badge-amber">{insights.length} insights</span>
        </div>

        <div className="tabs">
          {categories.map(cat => (
            <button
              key={cat}
              className={`tab ${activeTab === cat ? 'active' : ''}`}
              onClick={() => setActiveTab(cat)}
            >
              {cat === 'all' ? '🔍 All' : CATEGORY_LABELS[cat] || cat}
            </button>
          ))}
        </div>

        <div className="insights-list">
          {filtered.map((insight, i) => {
            const IconComp = ICON_MAP[insight.icon] || HiLightningBolt
            return (
              <div
                key={i}
                className="insight-card"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`insight-icon ${insight.severity}`}>
                  <IconComp />
                </div>
                <div>
                  <div className="insight-text">{insight.text}</div>
                  <div className="insight-category">{insight.category}</div>
                </div>
              </div>
            )
          })}
        </div>

        {filtered.length === 0 && (
          <div className="empty-state">No insights found for the selected filters.</div>
        )}
      </div>
    </div>
  )
}
