import { useState, useEffect } from 'react'
import { HiTrendingUp, HiTrendingDown, HiExclamation } from 'react-icons/hi'
import ExportButton from './ExportButton'

export default function AlertsPanel({ apiBase, buildQuery, token }) {
  const [alerts, setAlerts] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${apiBase}/alerts${buildQuery()}`, { headers })
      .then(r => r.json())
      .then(data => setAlerts(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Analyzing demand trends...</p>
      </div>
    )
  }

  if (!alerts) return null

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <ExportButton endpoint="/export/alerts" filename="smart_alerts" token={token} apiBase={apiBase} />
      </div>
      <div className="section-grid three-col">
        {/* Restock Risk */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#ef4444' }}>
              <HiTrendingUp style={{ color: '#ef4444' }} /> Restock Risk
            </h3>
            <span className="badge badge-red">{alerts.restock_risk?.length || 0}</span>
          </div>
          <div className="alert-column">
            {alerts.restock_risk?.length > 0 ? (
              alerts.restock_risk.map((alert, i) => (
                <div key={i} className="alert-card restock">
                  <div className="alert-product">{alert.product}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span className="badge badge-amber">{alert.category}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <span className={`alert-badge ${alert.severity}`}>{alert.severity} priority</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No restock risks detected</div>
            )}
          </div>
        </div>

        {/* Discount Candidates */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#f59e0b' }}>
              <HiTrendingDown style={{ color: '#f59e0b' }} /> Discount Candidates
            </h3>
            <span className="badge badge-amber">{alerts.discount_candidates?.length || 0}</span>
          </div>
          <div className="alert-column">
            {alerts.discount_candidates?.length > 0 ? (
              alerts.discount_candidates.map((alert, i) => (
                <div key={i} className="alert-card discount">
                  <div className="alert-product">{alert.product}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span className="badge badge-amber">{alert.category}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <span className={`alert-badge ${alert.severity}`}>{alert.severity} priority</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No discount candidates detected</div>
            )}
          </div>
        </div>

        {/* High Refund Items */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: '#8b5cf6' }}>
              <HiExclamation style={{ color: '#8b5cf6' }} /> High Refund Rate
            </h3>
            <span className="badge badge-purple">{alerts.high_refund?.length || 0}</span>
          </div>
          <div className="alert-column">
            {alerts.high_refund?.length > 0 ? (
              alerts.high_refund.map((alert, i) => (
                <div key={i} className="alert-card refund">
                  <div className="alert-product">{alert.product}</div>
                  <div style={{ marginBottom: 4 }}>
                    <span className="badge badge-purple">{alert.category}</span>
                  </div>
                  <div className="alert-message">{alert.message}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-tertiary)' }}>
                    <span className="mono">{alert.refund_qty}</span> of <span className="mono">{alert.sold_qty}</span> units refunded
                    • ₹{alert.refund_amount.toLocaleString('en-IN')}
                  </div>
                  <span className={`alert-badge ${alert.severity}`}>{alert.severity} priority</span>
                </div>
              ))
            ) : (
              <div className="empty-state">No high-refund anomalies</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
