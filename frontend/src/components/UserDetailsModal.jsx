import { useState, useEffect } from 'react'
import { HiX, HiOfficeBuilding, HiUser, HiCalendar, HiCheck, HiPencilAlt } from 'react-icons/hi'

export default function UserDetailsModal({ isOpen, onClose, userDetails, onSave }) {
  const [restaurantName, setRestaurantName] = useState('')
  const [userName, setUserName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    if (userDetails) {
      setRestaurantName(userDetails.restaurantName || '')
      setUserName(userDetails.userName || '')
      setStartDate(userDetails.startDate || '')
      setEndDate(userDetails.endDate || '')
    }
  }, [userDetails, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      restaurantName,
      userName,
      startDate,
      endDate,
    })
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 1200)
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="glass-card animate-fade-in"
        style={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
          padding: '24px 28px',
          background: 'rgba(18, 22, 30, 0.95)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 18,
            right: 18,
            background: 'rgba(255, 255, 255, 0.08)',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            fontSize: 18,
            width: 32,
            height: 32,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          <HiX />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: 'var(--gradient-warm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              marginBottom: 10,
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            <HiPencilAlt color="#fff" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            User & Restaurant Details
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
            View and update your stored account details, restaurant profile, and date range.
          </p>
        </div>

        {savedSuccess && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              fontSize: 13,
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <HiCheck size={18} />
            <span>Details updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Restaurant Name */}
          <div>
            <label style={labelStyle}>
              <HiOfficeBuilding style={{ color: 'var(--accent-primary)' }} />
              Restaurant Name
            </label>
            <input
              type="text"
              required
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              placeholder="e.g. TK Korean Restaurant"
              className="filter-input"
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          {/* User Name / Email */}
          <div>
            <label style={labelStyle}>
              <HiUser style={{ color: 'var(--accent-info)' }} />
              User Name / Email
            </label>
            <input
              type="text"
              required
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="e.g. manager@restaurant.com"
              className="filter-input"
              style={{ width: '100%', padding: '10px 12px' }}
            />
          </div>

          {/* Starting Date & Ending Date */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>
                <HiCalendar style={{ color: 'var(--accent-tertiary)' }} />
                Starting Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-input"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>

            <div>
              <label style={labelStyle}>
                <HiCalendar style={{ color: 'var(--accent-success)' }} />
                Ending Date
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-input"
                style={{ width: '100%', padding: '10px 12px' }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1.5,
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--gradient-warm)',
                border: 'none',
                color: '#fff',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <HiCheck size={18} />
              <span>Save & Update</span>
            </button>
          </div>
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
