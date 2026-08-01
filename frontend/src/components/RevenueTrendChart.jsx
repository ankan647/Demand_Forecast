import { useState, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts'

export default function RevenueTrendChart({ apiBase, buildQuery }) {
  const [data, setData] = useState([])
  const [granularity, setGranularity] = useState('weekly')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = buildQuery({ granularity })
    fetch(`${apiBase}/trends${q}`)
      .then(r => r.json())
      .then(d => {
        setData(d.map(item => ({
          ...item,
          date: formatDate(item.date, granularity),
          dateRaw: item.date,
        })))
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery, granularity])

  if (loading) {
    return (
      <div className="loading-container" style={{ height: 320 }}>
        <div className="loading-spinner" />
      </div>
    )
  }

  return (
    <div>
      <div className="tabs">
        <button
          className={`tab ${granularity === 'daily' ? 'active' : ''}`}
          onClick={() => setGranularity('daily')}
        >
          Daily
        </button>
        <button
          className={`tab ${granularity === 'weekly' ? 'active' : ''}`}
          onClick={() => setGranularity('weekly')}
        >
          Weekly
        </button>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ordersGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis
            dataKey="date"
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
            tickLine={false}
            interval={granularity === 'daily' ? Math.floor(data.length / 8) : 'preserveStartEnd'}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="url(#revenueGrad)"
            name="Revenue"
            dot={false}
            activeDot={{ r: 5, fill: '#f59e0b', stroke: '#0c0f14', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(12, 15, 20, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
          {p.name}: ₹{Number(p.value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      ))}
    </div>
  )
}

function formatDate(dateStr, granularity) {
  const d = new Date(dateStr)
  if (granularity === 'weekly') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
