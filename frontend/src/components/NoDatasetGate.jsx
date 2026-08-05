import { HiUpload } from 'react-icons/hi'

export default function NoDatasetGate({
  hasDataset,
  onUpload,
  title = "No Dataset Uploaded Yet",
  icon = "📊",
  description = "Upload your restaurant's POS sales dataset (CSV or Excel) to see analytics.",
  children
}) {
  if (hasDataset) {
    return children
  }

  return (
    <div
      className="glass-card animate-fade-in"
      style={{
        textAlign: 'center',
        padding: '48px 24px',
        maxWidth: 600,
        margin: '40px auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(245, 158, 11, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 32,
        }}
      >
        {icon}
      </div>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 450 }}>
        {description}
      </p>
      <button
        onClick={onUpload}
        style={{
          padding: '12px 24px',
          borderRadius: 'var(--radius-sm)',
          background: 'var(--gradient-warm)',
          color: '#fff',
          fontWeight: 700,
          fontSize: 14,
          border: 'none',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          boxShadow: 'var(--shadow-glow)',
          marginTop: 8,
        }}
      >
        <HiUpload size={18} />
        <span>Upload POS Dataset</span>
      </button>
    </div>
  )
}
