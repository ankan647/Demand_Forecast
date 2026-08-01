import { useState } from 'react'
import { HiCloudUpload, HiCheckCircle, HiExclamation, HiQuestionMarkCircle, HiX, HiCheck } from 'react-icons/hi'
import { useAuth } from './AuthGuard'

const STANDARD_FIELDS = [
  { key: 'order_date', label: 'Order Date', required: true, desc: 'Date of order (YYYY-MM-DD or MM/DD/YYYY)' },
  { key: 'product', label: 'Product Name', required: true, desc: 'Name of dish/item sold' },
  { key: 'category', label: 'Category', required: true, desc: 'Food category (Mains, Starters, Drinks)' },
  { key: 'quantity', label: 'Quantity / Units', required: true, desc: 'Number of units sold (default: 1)' },
  { key: 'total_sales', label: 'Total Revenue', required: true, desc: 'Gross revenue or total item sales' },
  { key: 'unit_price', label: 'Unit Price', required: false, desc: 'Price per single unit (optional)' },
  { key: 'channel', label: 'Sales Channel', required: false, desc: 'Register, Swiggy, Zomato, Personal Delivery' },
  { key: 'payment_mode', label: 'Payment Method', required: false, desc: 'Card, Cash, Online' },
]

export default function UploadWizard({ isOpen, onClose, onUploadComplete, apiBase = 'http://localhost:8000/api' }) {
  const { token } = useAuth()
  const [step, setStep] = useState(1) // 1: Select, 2: Map, 3: Preview, 4: Complete
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Server upload response
  const [tempId, setTempId] = useState(null)
  const [uploadedCols, setUploadedCols] = useState([])
  const [mapping, setMapping] = useState({})
  const [warnings, setWarnings] = useState([])
  const [previewRows, setPreviewRows] = useState([])
  const [totalRows, setTotalRows] = useState(0)

  if (!isOpen) return null

  const handleFileSelect = async (selectedFile) => {
    if (!selectedFile) return
    setFile(selectedFile)
    setLoading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', selectedFile)

    try {
      const resp = await fetch(`${apiBase}/datasets/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })

      if (!resp.ok) {
        const errData = await resp.json()
        throw new Error(errData.detail || 'Upload parsing failed')
      }

      const data = await resp.json()
      setTempId(data.temp_id)
      setUploadedCols(data.columns || [])
      setMapping(data.auto_mapping || {})
      setWarnings(data.warnings || [])
      setPreviewRows(data.preview_rows || [])
      setTotalRows(data.total_rows || 0)
      setStep(2)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmMapping = async () => {
    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${apiBase}/datasets/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          temp_id: tempId,
          mapping,
        }),
      })

      if (!resp.ok) {
        const errData = await resp.json()
        throw new Error(errData.detail || 'Dataset confirmation failed')
      }

      const result = await resp.json()
      setStep(4)
      if (onUploadComplete) onUploadComplete(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      padding: 20,
    }}>
      <div className="glass-card animate-fade-in" style={{
        width: '100%',
        maxWidth: 720,
        maxHeight: '90vh',
        overflowY: 'auto',
        position: 'relative',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--text-tertiary)',
            cursor: 'pointer',
            fontSize: 20,
          }}
        >
          <HiX />
        </button>

        {/* Wizard Header */}
        <div className="card-header" style={{ marginBottom: 16 }}>
          <h3 className="card-title" style={{ fontSize: 18, color: 'var(--text-primary)' }}>
            📁 Upload Custom Sales Dataset
          </h3>
          <span className="badge badge-amber">Step {step} of 4</span>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            fontSize: 13,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <HiExclamation size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Step 1: File Selection */}
        {step === 1 && (
          <div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (e.dataTransfer.files?.length) handleFileSelect(e.dataTransfer.files[0])
              }}
              style={{
                border: '2px dashed var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => document.getElementById('file-upload-input').click()}
            >
              <HiCloudUpload size={48} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
              <h4 style={{ fontSize: 16, color: 'var(--text-primary)', marginBottom: 4 }}>
                Drag & Drop your dataset file here
              </h4>
              <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                Supports <strong>.CSV</strong> and <strong>.XLSX</strong> POS exports (Square, Toast, Petpooja, etc.)
              </p>
              <input
                id="file-upload-input"
                type="file"
                accept=".csv,.xlsx,.xls"
                style={{ display: 'none' }}
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>

            {/* Dataset requirements note for maximum forecasting accuracy */}
            <div style={{
              marginTop: 20,
              padding: 14,
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
            }}>
              <h5 style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-primary-light)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <HiQuestionMarkCircle size={16} /> Dataset Requirements for Accurate Forecasts:
              </h5>
              <ul style={{ fontSize: 12, color: 'var(--text-secondary)', paddingLeft: 20, lineHeight: 1.6 }}>
                <li><strong>Order Date:</strong> At least 4–8 weeks of continuous historical transactions.</li>
                <li><strong>Product Name & Category:</strong> Clear menu item labels.</li>
                <li><strong>Sales Revenue / Quantity:</strong> Positive sales figures per line item.</li>
                <li><strong>Channels (optional):</strong> Register, Swiggy, Zomato, Personal Delivery.</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step 2: Column Mapping */}
        {step === 2 && (
          <div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Map your uploaded columns to standard dashboard fields. Auto-matched columns are pre-filled below:
            </p>

            <div className="data-table-wrapper" style={{ maxHeight: 320, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Standard Field</th>
                    <th>Status</th>
                    <th>Your Uploaded Column</th>
                  </tr>
                </thead>
                <tbody>
                  {STANDARD_FIELDS.map((field) => {
                    const isMapped = Boolean(mapping[field.key])
                    return (
                      <tr key={field.key}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                          {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                          <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 400 }}>{field.desc}</div>
                        </td>
                        <td>
                          <span className={`badge ${isMapped ? 'badge-green' : field.required ? 'badge-red' : 'badge-amber'}`}>
                            {isMapped ? 'Mapped' : field.required ? 'Required' : 'Optional'}
                          </span>
                        </td>
                        <td>
                          <select
                            className="filter-select"
                            value={mapping[field.key] || ''}
                            onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                            style={{ width: '100%', minWidth: 180 }}
                          >
                            <option value="">-- Do Not Map --</option>
                            {uploadedCols.map((col) => (
                              <option key={col} value={col}>
                                {col}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button
                className="pagination-btn"
                onClick={() => setStep(1)}
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                style={{
                  padding: '8px 20px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gradient-warm)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Next: Review Data ({totalRows} rows) →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review Preview & Validation */}
        {step === 3 && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <h4 style={{ fontSize: 14, color: 'var(--text-primary)', marginBottom: 8 }}>
                Preview Parsed Sample Rows ({previewRows.length} shown of {totalRows})
              </h4>
            </div>

            {warnings.length > 0 && (
              <div style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                color: '#fbbf24',
                fontSize: 12,
                marginBottom: 16,
              }}>
                <strong>Warnings / Cleaning Notes:</strong>
                <ul style={{ paddingLeft: 18, marginTop: 4 }}>
                  {warnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="data-table-wrapper" style={{ maxHeight: 220, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {Object.keys(previewRows[0] || {}).slice(0, 6).map((k) => (
                      <th key={k}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, idx) => (
                    <tr key={idx}>
                      {Object.values(row).slice(0, 6).map((v, i) => (
                        <td key={i}>{String(v)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
              <button
                className="pagination-btn"
                onClick={() => setStep(2)}
              >
                Back to Mapping
              </button>
              <button
                onClick={handleConfirmMapping}
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--gradient-success)',
                  border: 'none',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <HiCheck size={18} />
                {loading ? 'Processing & Cleaning...' : 'Confirm & Process Dataset'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '30px 20px' }}>
            <HiCheckCircle size={56} style={{ color: 'var(--accent-success)', marginBottom: 12 }} />
            <h3 style={{ fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>
              Dataset Processed & Applied!
            </h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>
              All KPI metrics, trend charts, forecast models, and insights have been dynamically recalculated from your uploaded dataset.
            </p>
            <button
              onClick={onClose}
              style={{
                padding: '12px 32px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gradient-warm)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
