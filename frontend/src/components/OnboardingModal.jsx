import { useState } from 'react'
import { HiOfficeBuilding, HiLocationMarker, HiTag, HiCurrencyRupee, HiCheck } from 'react-icons/hi'
import { useAuth } from './AuthGuard'

export default function OnboardingModal({ isOpen, onClose, onComplete, apiBase = 'http://localhost:8000/api' }) {
  const { token } = useAuth()
  const [form, setForm] = useState({
    restaurant_name: '',
    city: '',
    cuisine: 'Restaurant / QSR',
    currency: '₹',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.restaurant_name || !form.city) {
      setError('Please fill in both Restaurant Name and City.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const resp = await fetch(`${apiBase}/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(form),
      })

      if (!resp.ok) {
        throw new Error('Failed to save restaurant profile.')
      }

      const data = await resp.json()
      if (onComplete) onComplete(data.profile)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1000 }}>
      <div className="modal-content glass-card" style={{ maxWidth: 480, width: '90%', padding: '28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'var(--gradient-warm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 26,
              marginBottom: 12,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            🏪
          </div>
          <h2 className="modal-title" style={{ fontSize: 22, fontWeight: 800 }}>
            Welcome to <span className="highlight">SalesPulse</span>
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            Set up your restaurant profile to get personalized demand forecasts and analytics.
          </p>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#fca5a5',
              fontSize: 13,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>
              <HiOfficeBuilding style={{ color: 'var(--accent-primary)' }} />
              Restaurant / Store Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Spice Route Bistro"
              value={form.restaurant_name}
              onChange={(e) => setForm({ ...form, restaurant_name: e.target.value })}
              className="filter-input"
              style={{ width: '100%', padding: '10px 14px' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>
                <HiLocationMarker style={{ color: 'var(--accent-info)' }} />
                City / Location *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mumbai"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="filter-input"
                style={{ width: '100%', padding: '10px 14px' }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <HiTag style={{ color: 'var(--accent-tertiary)' }} />
                Business Type
              </label>
              <select
                value={form.cuisine}
                onChange={(e) => setForm({ ...form, cuisine: e.target.value })}
                className="filter-select"
                style={{ width: '100%', padding: '10px 14px' }}
              >
                <option value="Restaurant / QSR">Restaurant / QSR</option>
                <option value="Café & Bakery">Café & Bakery</option>
                <option value="Fine Dining">Fine Dining</option>
                <option value="Cloud Kitchen">Cloud Kitchen</option>
                <option value="Retail Store">Retail Store</option>
              </select>
            </div>
          </div>

          <div>
            <label style={labelStyle}>
              <HiCurrencyRupee style={{ color: 'var(--accent-success)' }} />
              Dashboard Currency
            </label>
            <select
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              className="filter-select"
              style={{ width: '100%', padding: '10px 14px' }}
            >
              <option value="₹">₹ (INR - Indian Rupee)</option>
              <option value="$">$ (USD - US Dollar)</option>
              <option value="€">€ (EUR - Euro)</option>
              <option value="£">£ (GBP - British Pound)</option>
              <option value="AED">AED (Emirati Dirham)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 10,
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--gradient-warm)',
              color: '#fff',
              border: 'none',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {loading ? (
              <span>Saving Profile...</span>
            ) : (
              <>
                <HiCheck size={18} />
                <span>Save Profile & Continue</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

const labelStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-secondary)',
  marginBottom: 6,
}
