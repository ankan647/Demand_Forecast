import { useState } from 'react'
import { HiDownload, HiDocumentReport, HiPhotograph } from 'react-icons/hi'

export default function ExportButton({
  endpoint,
  targetRef,
  filename = 'export',
  token,
  apiBase = 'http://localhost:8000/api',
}) {
  const [open, setOpen] = useState(false)
  const [exporting, setExporting] = useState(false)

  const handleDownload = async (format) => {
    setOpen(false)
    setExporting(true)

    try {
      if (format === 'png' && targetRef?.current) {
        // SVG / Canvas / DOM PNG Export
        const element = targetRef.current
        const svgElement = element.querySelector('svg')
        
        if (svgElement) {
          const svgData = new XMLSerializer().serializeToString(svgElement)
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const img = new Image()
          
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
          const url = URL.createObjectURL(svgBlob)

          img.onload = () => {
            canvas.width = img.width * 2 || 800
            canvas.height = img.height * 2 || 400
            ctx.fillStyle = '#0c0f14'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

            const pngUrl = canvas.toDataURL('image/png')
            const downloadLink = document.createElement('a')
            downloadLink.href = pngUrl
            downloadLink.download = `${filename}.png`
            document.body.appendChild(downloadLink)
            downloadLink.click()
            document.body.removeChild(downloadLink)
            URL.revokeObjectURL(url)
            setExporting(false)
          }
          img.src = url
          return
        }
      }

      // Backend API Export (CSV / XLSX)
      if (endpoint) {
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const sep = endpoint.includes('?') ? '&' : '?'
        const url = `${apiBase}${endpoint}${sep}export_format=${format}`

        const resp = await fetch(url, { headers })
        if (!resp.ok) throw new Error('Export failed')

        const blob = await resp.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `${filename}.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      }
    } catch (err) {
      console.error('Export error:', err)
      alert('Failed to export. Please try again.')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="filter-select"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          fontSize: 12,
          fontWeight: 600,
          background: 'rgba(255, 255, 255, 0.04)',
          borderColor: 'var(--border-medium)',
        }}
      >
        <HiDownload size={14} style={{ color: 'var(--accent-primary)' }} />
        <span>{exporting ? 'Exporting...' : 'Export'}</span>
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
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            minWidth: 150,
            padding: '4px 0',
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          {endpoint && (
            <>
              <button
                onClick={() => handleDownload('csv')}
                style={dropdownItemStyle}
              >
                <HiDocumentReport size={14} style={{ color: 'var(--accent-info)' }} />
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => handleDownload('xlsx')}
                style={dropdownItemStyle}
              >
                <HiDocumentReport size={14} style={{ color: 'var(--accent-success)' }} />
                <span>Export Excel</span>
              </button>
            </>
          )}

          {targetRef && (
            <button
              onClick={() => handleDownload('png')}
              style={dropdownItemStyle}
            >
              <HiPhotograph size={14} style={{ color: 'var(--accent-tertiary)' }} />
              <span>Export PNG</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

const dropdownItemStyle = {
  width: '100%',
  padding: '8px 14px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  background: 'none',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background 0.15s ease',
}
