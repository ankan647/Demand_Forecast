import { HiCurrencyRupee, HiShoppingCart, HiChartBar, HiStar, HiCube } from 'react-icons/hi'

export default function KpiCards({ data }) {
  if (!data) return null

  const kpis = [
    {
      label: 'Total Revenue',
      value: `₹${data.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${data.date_range?.start} — ${data.date_range?.end}`,
      valueClass: 'revenue',
      icon: <HiCurrencyRupee />,
    },
    {
      label: 'Active Days',
      value: data.total_orders?.toLocaleString('en-IN'),
      sub: `${data.products_sold} products sold`,
      valueClass: 'orders',
      icon: <HiShoppingCart />,
    },
    {
      label: 'Avg Daily Revenue',
      value: `₹${data.avg_order_value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${data.total_units?.toLocaleString('en-IN')} total units`,
      valueClass: 'aov',
      icon: <HiChartBar />,
    },
    {
      label: 'Top Product',
      value: data.top_item,
      sub: `₹${data.top_item_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })} revenue`,
      valueClass: 'product',
      icon: <HiStar />,
    },
    {
      label: 'Categories',
      value: data.categories,
      sub: `${data.refund_count} refunds (₹${data.refund_amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`,
      valueClass: 'orders',
      icon: <HiCube />,
    },
  ]

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, i) => (
        <div key={kpi.label} className={`kpi-card animate-fade-in stagger-${i + 1}`}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-label">{kpi.label}</div>
          <div className={`kpi-value ${kpi.valueClass}`}>{kpi.value}</div>
          <div className="kpi-sub">{kpi.sub}</div>
        </div>
      ))}
    </div>
  )
}
