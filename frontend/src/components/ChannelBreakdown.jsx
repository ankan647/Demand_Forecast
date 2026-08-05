import { useState, useEffect } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import ExportButton from './ExportButton'

const CHANNEL_COLORS = {
  'Register': '#f59e0b',
  'Swiggy': '#fc8019',
  'Zomato': '#cb202d',
  'Personal Delivery': '#3b82f6',
  'Swiggy Takeaway': '#06b6d4',
  'Zomato Takeaway': '#8b5cf6',
  'Other': '#64748b',
}

const CHANNEL_RENAME = {
  'Uber Eats': 'Swiggy',
  'DoorDash': 'Zomato',
  'Square Online': 'Personal Delivery',
  'Uber Eats Pickup': 'Swiggy Takeaway',
  'DoorDash Pickup': 'Zomato Takeaway',
}

export default function ChannelBreakdown({ apiBase, buildQuery, token }) {
  const [data, setData] = useState([])
  const [catData, setCatData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    Promise.all([
      fetch(`${apiBase}/channel-breakdown${buildQuery()}`, { headers }).then(r => r.json()),
      fetch(`${apiBase}/category-breakdown${buildQuery()}`, { headers }).then(r => r.json()),
    ])
      .then(([channels, categories]) => {
        const renamedChannels = channels.map(c => ({
          ...c,
          channel: CHANNEL_RENAME[c.channel] || c.channel,
        }))
        setData(renamedChannels)
        setCatData(categories)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, token])

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading channel data...</p>
      </div>
    )
  }

  const totalRevenue = data.reduce((sum, c) => sum + c.revenue, 0)

  return (
    <div>
      <div className="section-grid two-col">
        {/* Pie Chart — Channel Revenue */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">🍩 Revenue by Channel</h3>
            <ExportButton endpoint="/channel-breakdown" filename="channel_breakdown" token={token} apiBase={apiBase} />
          </div>
          <ResponsiveContainer width="100%" height={360}>
            <PieChart>
              <Pie
                data={data}
                dataKey="revenue"
                nameKey="channel"
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={140}
                paddingAngle={2}
                stroke="rgba(12, 15, 20, 0.8)"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={CHANNEL_COLORS[entry.channel] || '#64748b'}
                  />
                ))}
              </Pie>
              <Tooltip content={<ChannelTooltip total={totalRevenue} />} />
              <Legend
                formatter={(value) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar breakdown */}
        <div className="glass-card">
          <div className="card-header">
            <h3 className="card-title">📊 Channel Metrics</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.map((ch, i) => (
              <div key={ch.channel} className="channel-bar">
                <div className="channel-name">{ch.channel}</div>
                <div className="channel-bar-fill">
                  <div
                    className="channel-bar-fill-inner"
                    style={{
                      width: `${ch.revenue_pct}%`,
                      background: CHANNEL_COLORS[ch.channel] || '#64748b',
                    }}
                  />
                </div>
                <div className="channel-pct">{ch.revenue_pct}%</div>
              </div>
            ))}
          </div>

          <hr className="section-divider" />

          {/* Channel detail table */}
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Channel</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                  <th>AOV</th>
                </tr>
              </thead>
              <tbody>
                {data.map(ch => (
                  <tr key={ch.channel}>
                    <td style={{ color: CHANNEL_COLORS[ch.channel], fontWeight: 600 }}>
                      {ch.channel}
                    </td>
                    <td className="mono">₹{ch.revenue.toLocaleString('en-IN')}</td>
                    <td className="mono">{ch.orders.toLocaleString('en-IN')}</td>
                    <td className="mono">₹{ch.aov.toFixed(0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <h3 className="card-title">🏷️ Revenue by Category</h3>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={catData} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
            />
            <YAxis
              dataKey="category"
              type="category"
              tick={{ fill: '#94a3b8', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={80}
            />
            <Tooltip content={<CategoryTooltip />} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={24}>
              {catData.map((_, i) => (
                <Cell key={i} fill={Object.values(CHANNEL_COLORS)[i % Object.values(CHANNEL_COLORS).length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ChannelTooltip({ active, payload, total }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${CHANNEL_COLORS[d.channel] || 'var(--border-medium)'}`,
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: CHANNEL_COLORS[d.channel], fontWeight: 600, fontSize: 14 }}>{d.channel}</p>
      <p style={{ color: 'var(--text-primary)', fontSize: 12 }}>Revenue: ₹{d.revenue.toLocaleString('en-IN')}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Share: {d.revenue_pct}%</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>Orders: {d.orders.toLocaleString('en-IN')}</p>
    </div>
  )
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-medium)',
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: 'var(--shadow-md)',
    }}>
      <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14 }}>{d.category}</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        Revenue: ₹{d.revenue.toLocaleString('en-IN')} ({d.revenue_pct}%)
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
        Units: {d.units.toLocaleString('en-IN')}
      </p>
    </div>
  )
}
