import { useState, useEffect } from 'react'
import { HiLink } from 'react-icons/hi'

export default function BasketAffinity({ apiBase, buildQuery, token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${apiBase}/basket-affinity${buildQuery()}`, { headers })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Analyzing purchase patterns...</p>
      </div>
    )
  }

  if (!data || !data.pairs?.length) {
    return (
      <div className="glass-card">
        <div className="empty-state">No basket affinity data available</div>
      </div>
    )
  }

  return (
    <div>
      <div className="glass-card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <h3 className="card-title">🔗 Frequently Bought Together</h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="badge badge-blue">{data.pairs.length} pairs</span>
            <span className="badge badge-amber">{data.total_baskets} baskets analyzed</span>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-tertiary)', marginBottom: 20 }}>
          Items frequently ordered on the same day. Higher confidence means stronger association.
        </p>

        <div className="pair-cards">
          {data.pairs.map((pair, i) => (
            <div key={i} className="pair-card" style={{ animationDelay: `${i * 40}ms` }}>
              <div className="pair-items">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pair-item-name" title={pair.item_a}>{pair.item_a}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pair.category_a}</div>
                </div>
                <div className="pair-connector">
                  <HiLink />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="pair-item-name" title={pair.item_b}>{pair.item_b}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pair.category_b}</div>
                </div>
              </div>
              <div className="pair-metrics">
                <div className="pair-metric">
                  Co-occurs: <span>{pair.co_occurrence}×</span>
                </div>
                <div className="pair-metric">
                  Confidence: <span>{(pair.confidence * 100).toFixed(0)}%</span>
                </div>
                <div className="pair-metric">
                  Lift: <span>{pair.lift}×</span>
                </div>
              </div>

              {/* Visual confidence bar */}
              <div style={{ marginTop: 8 }}>
                <div style={{
                  height: 3,
                  background: 'var(--border-subtle)',
                  borderRadius: 2,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min(pair.confidence * 100, 100)}%`,
                    background: `linear-gradient(90deg, #f59e0b, ${pair.lift > 1.5 ? '#10b981' : '#3b82f6'})`,
                    borderRadius: 2,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
