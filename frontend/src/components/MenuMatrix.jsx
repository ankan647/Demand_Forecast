import { useState, useEffect } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ZAxis, Cell
} from 'recharts'

const QUADRANT_COLORS = {
  'Star': '#fbbf24',
  'Plow Horse': '#10b981',
  'Puzzle': '#8b5cf6',
  'Dog': '#ef4444',
}

const QUADRANT_EMOJI = {
  'Star': '⭐',
  'Plow Horse': '🐴',
  'Puzzle': '🧩',
  'Dog': '🐕',
}

const QUADRANT_DESC = {
  'Star': 'High popularity, high profit — promote heavily',
  'Plow Horse': 'High popularity, low profit — optimize pricing',
  'Puzzle': 'Low popularity, high profit — increase visibility',
  'Dog': 'Low popularity, low profit — consider removing',
}

export default function MenuMatrix({ apiBase, buildQuery, token }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${apiBase}/menu-matrix${buildQuery()}`, { headers })
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Analyzing menu performance...</p>
      </div>
    )
  }

  if (!data || !data.items?.length) {
    return <div className="empty-state">No menu data available</div>
  }

  const scatterData = data.items.map(item => ({
    x: item.total_quantity,
    y: item.revenue_per_unit,
    product: item.product,
    category: item.category,
    quadrant: item.quadrant,
    total_revenue: item.total_revenue,
    z: Math.sqrt(item.total_revenue) * 2,
  }))

  return (
    <div>
      <div className="section-grid wide-narrow">
        {/* Scatter Chart */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">📊 Menu Engineering Matrix</h3>
          </div>
          <ResponsiveContainer width="100%" height={480}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey="x"
                type="number"
                name="Units Sold"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
                label={{ value: 'Popularity (Units Sold)', position: 'bottom', fill: '#64748b', fontSize: 12 }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name="Revenue / Unit"
                tick={{ fill: '#64748b', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                label={{ value: 'Profitability (₹/Unit)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 12 }}
                tickFormatter={v => `₹${v.toFixed(0)}`}
              />
              <ZAxis dataKey="z" range={[40, 300]} />
              <Tooltip content={<MatrixTooltip />} />

              {/* Median reference lines */}
              <ReferenceLine
                x={data.medians.quantity}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="6 4"
              />
              <ReferenceLine
                y={data.medians.revenue_per_unit}
                stroke="rgba(255,255,255,0.12)"
                strokeDasharray="6 4"
              />

              <Scatter name="Items" data={scatterData}>
                {scatterData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={QUADRANT_COLORS[entry.quadrant] || '#64748b'}
                    fillOpacity={0.8}
                    stroke={QUADRANT_COLORS[entry.quadrant] || '#64748b'}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="matrix-legend">
            {Object.entries(QUADRANT_COLORS).map(([name, color]) => (
              <div key={name} className="matrix-legend-item">
                <div className="matrix-legend-dot" style={{ background: color }} />
                <span>{QUADRANT_EMOJI[name]} {name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quadrant Counts & Details */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">📋 Quadrant Summary</h3>
          </div>

          <div className="quadrant-counts">
            {Object.entries(data.quadrant_counts || {}).map(([name, count]) => (
              <div key={name} className="quadrant-count-card">
                <div className="count" style={{ color: QUADRANT_COLORS[name] }}>
                  {QUADRANT_EMOJI[name]} {count}
                </div>
                <div className="label">{name}</div>
              </div>
            ))}
          </div>

          <hr className="section-divider" />

          <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 12 }}>
            Median thresholds: {data.medians.quantity} units / ₹{data.medians.revenue_per_unit} per unit
          </div>

          {Object.entries(QUADRANT_DESC).map(([name, desc]) => (
            <div key={name} style={{
              padding: '8px 12px',
              marginBottom: 6,
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              borderLeft: `3px solid ${QUADRANT_COLORS[name]}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: QUADRANT_COLORS[name] }}>
                {QUADRANT_EMOJI[name]} {name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{desc}</div>
            </div>
          ))}

          <hr className="section-divider" />

          {/* Top items per quadrant */}
          {['Star', 'Puzzle'].map(q => {
            const qItems = data.items.filter(i => i.quadrant === q).slice(0, 5)
            if (!qItems.length) return null
            return (
              <div key={q} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: QUADRANT_COLORS[q], marginBottom: 6 }}>
                  {QUADRANT_EMOJI[q]} Top {q}s
                </div>
                {qItems.map(item => (
                  <div key={item.product} style={{
                    fontSize: 12, color: 'var(--text-secondary)', padding: '3px 0',
                    display: 'flex', justifyContent: 'space-between'
                  }}>
                    <span>{item.product}</span>
                    <span className="mono" style={{ color: 'var(--text-tertiary)' }}>
                      ₹{item.total_revenue.toLocaleString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function MatrixTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'rgba(12, 15, 20, 0.95)',
      border: `1px solid ${QUADRANT_COLORS[d.quadrant] || 'rgba(255,255,255,0.1)'}`,
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      maxWidth: 260,
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13 }}>{d.product}</p>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 11, marginBottom: 6 }}>{d.category}</p>
      <p style={{ color: QUADRANT_COLORS[d.quadrant], fontSize: 12, fontWeight: 600 }}>
        {QUADRANT_EMOJI[d.quadrant]} {d.quadrant}
      </p>
      <p style={{ color: '#94a3b8', fontSize: 12 }}>
        Units: {d.x.toLocaleString('en-IN')} • ₹{d.y.toFixed(2)}/unit
      </p>
      <p style={{ color: '#94a3b8', fontSize: 12 }}>
        Total Revenue: ₹{d.total_revenue.toLocaleString('en-IN')}
      </p>
    </div>
  )
}
