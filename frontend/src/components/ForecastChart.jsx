import { useState, useEffect, useRef } from 'react'
import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Legend
} from 'recharts'
import ExportButton from './ExportButton'

export default function ForecastChart({ apiBase, token }) {
  const [items, setItems] = useState([])
  const [selectedItem, setSelectedItem] = useState('')
  const [weeks, setWeeks] = useState(4)
  const [metric, setMetric] = useState('quantity')
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(false)
  const chartRef = useRef(null)

  // Load available items
  useEffect(() => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    fetch(`${apiBase}/forecast/items`, { headers })
      .then(r => r.json())
      .then(data => {
        setItems(data)
        if (data.length > 0) setSelectedItem(data[0].product)
      })
      .catch(console.error)
  }, [apiBase, token])

  // Load forecast when item/weeks/metric changes
  useEffect(() => {
    if (!selectedItem) return
    setLoading(true)
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    const params = new URLSearchParams({
      item: selectedItem,
      weeks: weeks.toString(),
      metric,
    })
    fetch(`${apiBase}/forecast?${params}`, { headers })
      .then(r => r.json())
      .then(data => setForecast(data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, selectedItem, weeks, metric, token])

  // Build chart data
  const chartData = []
  if (forecast) {
    forecast.historical?.forEach(h => {
      chartData.push({
        week: formatWeek(h.week),
        weekRaw: h.week,
        actual: h.actual,
        predicted: null,
        lower: null,
        upper: null,
        range: null,
      })
    })

    // Connect: add last historical point as first forecast point too
    if (forecast.historical?.length > 0 && forecast.forecast?.length > 0) {
      const lastHist = forecast.historical[forecast.historical.length - 1]
      chartData[chartData.length - 1] = {
        ...chartData[chartData.length - 1],
        predicted: lastHist.actual,
        lower: lastHist.actual,
        upper: lastHist.actual,
        range: [lastHist.actual, lastHist.actual],
      }
    }

    forecast.forecast?.forEach(f => {
      chartData.push({
        week: formatWeek(f.week),
        weekRaw: f.week,
        actual: null,
        predicted: f.predicted,
        lower: f.lower,
        upper: f.upper,
        range: [f.lower, f.upper],
      })
    })
  }

  // Find the boundary index
  const boundaryIdx = forecast?.historical?.length ? forecast.historical.length - 1 : 0
  const boundaryWeek = chartData[boundaryIdx]?.week

  return (
    <div>
      <div className="card-header">
        <h3 className="card-title">📈 Per-Item Demand Forecast</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {forecast && (
            <span className="badge badge-purple" style={{ fontSize: 11 }}>
              Model: {forecast.model_type}
            </span>
          )}
          <ExportButton
            endpoint={`/export/forecast?item=${encodeURIComponent(selectedItem)}&weeks=${weeks}`}
            targetRef={chartRef}
            filename={`forecast_${selectedItem}`}
            token={token}
            apiBase={apiBase}
          />
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 20 }}>
        <div className="item-selector">
          <label style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
            Select Product:
          </label>
          <select
            value={selectedItem}
            onChange={e => setSelectedItem(e.target.value)}
          >
            {items.map(item => (
              <option key={item.product} value={item.product}>
                {item.product} ({item.weeks_of_data}w data)
              </option>
            ))}
          </select>
        </div>

        <div className="range-slider">
          <label>Horizon:</label>
          <input
            type="range"
            min="1"
            max="12"
            value={weeks}
            onChange={e => setWeeks(parseInt(e.target.value))}
          />
          <span className="range-value">{weeks} weeks</span>
        </div>

        <div className="tabs" style={{ marginBottom: 0 }}>
          <button className={`tab ${metric === 'quantity' ? 'active' : ''}`} onClick={() => setMetric('quantity')}>
            Units
          </button>
          <button className={`tab ${metric === 'revenue' ? 'active' : ''}`} onClick={() => setMetric('revenue')}>
            Revenue
          </button>
        </div>
      </div>

      {/* Chart */}
      {loading ? (
        <div className="loading-container" style={{ height: 400 }}>
          <div className="loading-spinner" />
          <p className="loading-text">Computing forecast...</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => metric === 'revenue' ? `₹${(v / 1000).toFixed(0)}k` : v}
            />
            <Tooltip content={<ForecastTooltip metric={metric} />} />

            {/* Confidence interval band */}
            <Area
              type="monotone"
              dataKey="range"
              fill="url(#forecastBand)"
              stroke="none"
              name="Confidence Interval"
              legendType="none"
            />

            {/* Actual historical line */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#f59e0b"
              strokeWidth={2.5}
              dot={{ fill: '#f59e0b', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#f59e0b', stroke: '#0c0f14', strokeWidth: 2 }}
              name="Actual"
              connectNulls={false}
            />

            {/* Forecast line */}
            <Line
              type="monotone"
              dataKey="predicted"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              strokeDasharray="6 4"
              dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#8b5cf6', stroke: '#0c0f14', strokeWidth: 2 }}
              name="Forecast"
              connectNulls={false}
            />

            {/* Boundary line */}
            {boundaryWeek && (
              <ReferenceLine
                x={boundaryWeek}
                stroke="rgba(255,255,255,0.15)"
                strokeDasharray="4 4"
                label={{
                  value: 'Forecast →',
                  position: 'top',
                  fill: '#64748b',
                  fontSize: 11,
                }}
              />
            )}

            <Legend
              wrapperStyle={{ paddingTop: 10, fontSize: 12 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}

      {/* Error message if any */}
      {forecast?.error_msg && (
        <p style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 8, fontStyle: 'italic' }}>
          ℹ️ {forecast.error_msg}
        </p>
      )}
    </div>
  )
}

function ForecastTooltip({ active, payload, label, metric }) {
  if (!active || !payload?.length) return null

  return (
    <div style={{
      background: 'rgba(12, 15, 20, 0.95)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10,
      padding: '12px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
        Week of {label}
      </p>
      {payload.map((p, i) => {
        if (p.dataKey === 'range' || p.value === null) return null
        const fmt = v => metric === 'revenue'
          ? `₹${Number(v).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`
          : Number(v).toLocaleString('en-IN')
        return (
          <p key={i} style={{ color: p.color, fontSize: 12, margin: '2px 0' }}>
            {p.name}: {fmt(p.value)}
          </p>
        )
      })}
      {/* Show confidence range */}
      {payload.find(p => p.dataKey === 'range' && p.value) && (
        <p style={{ color: '#a78bfa', fontSize: 11, marginTop: 4 }}>
          Range: {metric === 'revenue' ? '₹' : ''}
          {payload.find(p => p.dataKey === 'range').value[0].toLocaleString('en-IN')}
          {' — '}
          {metric === 'revenue' ? '₹' : ''}
          {payload.find(p => p.dataKey === 'range').value[1].toLocaleString('en-IN')}
        </p>
      )}
    </div>
  )
}

function formatWeek(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}
