import { useState, useEffect } from 'react'
import { HiDatabase, HiCheck, HiPlus } from 'react-icons/hi'
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

  const activeItem = datasets.find((d) => d.id === activeDataset) || { filename: 'Sample POS Dataset' }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        className="filter-select"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          fontSize: 13,
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.05)',
          borderColor: 'var(--border-accent)',
        }}
      >
        <HiDatabase style={{ color: 'var(--accent-primary)' }} />
        <span>{activeItem.filename}</span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            zIndex: 100,
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 240,
            padding: '6px 0',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ padding: '6px 14px', fontSize: 11, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
            Active Dataset
          </div>

          {datasets.map((ds) => (
            <button
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
              {ds.id === activeDataset && <HiCheck size={16} style={{ color: 'var(--accent-primary)' }} />}
            </button>
          ))}

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
