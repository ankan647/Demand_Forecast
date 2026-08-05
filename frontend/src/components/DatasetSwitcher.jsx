import { useState, useEffect } from 'react'
import { HiDatabase, HiCheck, HiPlus, HiTrash } from 'react-icons/hi'
import { useAuth } from './AuthGuard'

export default function DatasetSwitcher({ onOpenUpload, apiBase = 'http://localhost:8000/api', onDatasetChanged }) {
  const { user, token } = useAuth()
  const [datasets, setDatasets] = useState([])
  const [open, setOpen] = useState(false)
  const [activeDataset, setActiveDataset] = useState('default')

  const fetchDatasets = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const resp = await fetch(`${apiBase}/datasets`, { headers })
      if (resp.ok) {
        const list = await resp.json()
        setDatasets(list)
        const active = list.find((d) => d.is_active)
        if (active) setActiveDataset(active.id)
      }
    } catch (err) {
      console.error('Error fetching datasets:', err)
    }
  }

  useEffect(() => {
    fetchDatasets()
  }, [token])

  const handleActivate = async (id) => {
    setOpen(false)
    if (!token) {
      onOpenUpload()
      return
    }

    try {
      const resp = await fetch(`${apiBase}/datasets/${id}/activate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        setActiveDataset(id)
        if (onDatasetChanged) onDatasetChanged(id)
      }
    } catch (err) {
      console.error('Error activating dataset:', err)
    }
  }

  const handleDelete = async (e, id) => {
    e.stopPropagation()
    if (!token) return

    try {
      const resp = await fetch(`${apiBase}/datasets/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (resp.ok) {
        await fetchDatasets()
        if (onDatasetChanged) onDatasetChanged(id)
      }
    } catch (err) {
      console.error('Error deleting dataset:', err)
    }
  }

  const activeItem = datasets.find((d) => d.id === activeDataset) || (user ? { filename: 'No Dataset Selected' } : { filename: 'Sample POS Dataset' })

  return (
    <div style={{ position: 'relative', display: 'inline-block', zIndex: 1000 }}>
      <button
        onClick={() => setOpen(!open)}
        className="filter-select"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.4)',
          borderRadius: 9999,
          color: '#ffffff',
          boxShadow: '0 0 12px rgba(245, 158, 11, 0.15)',
        }}
      >
        <HiDatabase style={{ color: 'var(--accent-primary)' }} />
        <span>{activeItem.filename}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: '115%',
            zIndex: 9999,
            background: 'rgba(18, 22, 30, 0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            minWidth: 240,
            padding: '6px 0',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Active Dataset
          </div>

          {datasets.length === 0 ? (
            <div style={{ padding: '8px 14px', fontSize: 12, color: 'var(--text-tertiary)' }}>
              No custom datasets uploaded
            </div>
          ) : (
            datasets.map((ds) => (
              <div
                key={ds.id}
                onClick={() => handleActivate(ds.id)}
                style={{
                  width: '100%',
                  padding: '8px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: ds.id === activeDataset ? 'rgba(245, 158, 11, 0.1)' : 'none',
                  border: 'none',
                  color: ds.id === activeDataset ? 'var(--accent-primary-light)' : 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div>
                  <div>{ds.filename}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{ds.rows} rows</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {ds.id === activeDataset && <HiCheck size={16} style={{ color: 'var(--accent-primary)' }} />}
                  <button
                    onClick={(e) => handleDelete(e, ds.id)}
                    title="Remove dataset"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-tertiary)',
                      cursor: 'pointer',
                      padding: 2,
                    }}
                  >
                    <HiTrash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}

          <hr className="section-divider" style={{ margin: '6px 0' }} />

          <button
            onClick={() => { setOpen(false); onOpenUpload(); }}
            style={{
              width: '100%',
              padding: '8px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <HiPlus size={16} />
            <span>Upload New Dataset...</span>
          </button>
        </div>
      )}
    </div>
  )
}
