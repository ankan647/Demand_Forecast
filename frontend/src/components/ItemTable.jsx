import { useState, useEffect, useMemo } from 'react'
import { HiSearch, HiChevronUp, HiChevronDown } from 'react-icons/hi'

export default function ItemTable({ apiBase, buildQuery }) {
  const [data, setData] = useState(null)
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('total_revenue')
  const [sortDir, setSortDir] = useState('desc')
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const perPage = 20

  useEffect(() => {
    setLoading(true)
    fetch(`${apiBase}/items${buildQuery()}`)
      .then(r => r.json())
      .then(d => setData(d))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [apiBase, buildQuery])

  const filteredItems = useMemo(() => {
    if (!data?.all_items) return []
    let items = data.all_items

    if (search) {
      const s = search.toLowerCase()
      items = items.filter(i =>
        i.product.toLowerCase().includes(s) ||
        i.category.toLowerCase().includes(s)
      )
    }

    items.sort((a, b) => {
      const va = a[sortField]
      const vb = b[sortField]
      if (typeof va === 'string') return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
      return sortDir === 'asc' ? va - vb : vb - va
    })

    return items
  }, [data, search, sortField, sortDir])

  const totalPages = Math.ceil(filteredItems.length / perPage)
  const pageItems = filteredItems.slice(page * perPage, (page + 1) * perPage)

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
    setPage(0)
  }

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null
    return sortDir === 'asc' ? <HiChevronUp className="sort-icon" /> : <HiChevronDown className="sort-icon" />
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner" />
        <p className="loading-text">Loading item data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="card-header">
        <h3 className="card-title">📦 All Items Performance</h3>
        <div className="table-search-wrapper">
          <HiSearch className="search-icon" />
          <input
            className="table-search"
            placeholder="Search products or categories..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th onClick={() => handleSort('product')} className={sortField === 'product' ? 'sorted' : ''}>
                Product <SortIcon field="product" />
              </th>
              <th onClick={() => handleSort('category')} className={sortField === 'category' ? 'sorted' : ''}>
                Category <SortIcon field="category" />
              </th>
              <th onClick={() => handleSort('total_revenue')} className={sortField === 'total_revenue' ? 'sorted' : ''}>
                Revenue <SortIcon field="total_revenue" />
              </th>
              <th onClick={() => handleSort('total_quantity')} className={sortField === 'total_quantity' ? 'sorted' : ''}>
                Units <SortIcon field="total_quantity" />
              </th>
              <th onClick={() => handleSort('avg_price')} className={sortField === 'avg_price' ? 'sorted' : ''}>
                Avg Price <SortIcon field="avg_price" />
              </th>
              <th onClick={() => handleSort('total_discount')} className={sortField === 'total_discount' ? 'sorted' : ''}>
                Discount <SortIcon field="total_discount" />
              </th>
              <th onClick={() => handleSort('order_count')} className={sortField === 'order_count' ? 'sorted' : ''}>
                Days Active <SortIcon field="order_count" />
              </th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item, i) => {
              const rank = page * perPage + i + 1
              return (
                <tr key={item.product}>
                  <td>
                    <span className={`rank-badge ${rank === 1 ? 'gold' : rank === 2 ? 'silver' : rank === 3 ? 'bronze' : 'default'}`}>
                      {rank}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.product}</td>
                  <td><span className="badge badge-amber">{item.category}</span></td>
                  <td className="mono" style={{ color: 'var(--accent-success)' }}>
                    ₹{item.total_revenue.toLocaleString('en-IN')}
                  </td>
                  <td className="mono">{item.total_quantity.toLocaleString('en-IN')}</td>
                  <td className="mono">₹{item.avg_price.toFixed(2)}</td>
                  <td className="mono" style={{ color: item.total_discount > 0 ? 'var(--accent-primary)' : 'var(--text-tertiary)' }}>
                    ₹{item.total_discount.toLocaleString('en-IN')}
                  </td>
                  <td className="mono">{item.order_count}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="table-pagination">
        <span className="pagination-info">
          Showing {page * perPage + 1}–{Math.min((page + 1) * perPage, filteredItems.length)} of {filteredItems.length} items
        </span>
        <div className="pagination-buttons">
          <button
            className="pagination-btn"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <button
            className="pagination-btn"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
