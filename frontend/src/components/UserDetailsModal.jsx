import { useState, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { HiX, HiOfficeBuilding, HiUser, HiCalendar, HiCheck, HiPencilAlt } from 'react-icons/hi'

export default function UserDetailsModal({ isOpen, onClose, userDetails, onSave }) {
  const [restaurantName, setRestaurantName] = useState('')
  const [userName, setUserName] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [focusedInput, setFocusedInput] = useState(null)

  // 3D Card tilt effect
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useTransform(mouseY, [-300, 300], [8, -8])
  const rotateY = useTransform(mouseX, [-300, 300], [-8, 8])

  useEffect(() => {
    if (userDetails) {
      setRestaurantName(userDetails.restaurantName || '')
      setUserName(userDetails.userName || '')
      setStartDate(userDetails.startDate || '')
      setEndDate(userDetails.endDate || '')
    }
  }, [userDetails, isOpen])

  if (!isOpen) return null

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set(e.clientX - rect.left - rect.width / 2)
    mouseY.set(e.clientY - rect.top - rect.height / 2)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

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
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: 16,
      }}
      onClick={onClose}
    >
      {/* Background radial glow - #F66524 theme */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '120vh',
          height: '60vh',
          borderBottomLeftRadius: '50%',
          borderBottomRightRadius: '50%',
          background: 'radial-gradient(ellipse at top, rgba(246, 101, 36, 0.3) 0%, rgba(246, 101, 36, 0.08) 60%, transparent 80%)',
          filter: 'blur(80px)',
          pointerEvents: 'none',
        }}
      />
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vh',
          height: '50vh',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246, 101, 36, 0.2) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [0.95, 1.05, 0.95],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          repeatType: 'mirror',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          width: '100%',
          maxWidth: 480,
          position: 'relative',
          zIndex: 10,
          perspective: 1500,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <motion.div
          style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          whileHover={{ z: 10 }}
        >
          <div style={{ position: 'relative' }}>
            {/* Card glow effect */}
            <motion.div
              style={{
                position: 'absolute',
                inset: -1,
                borderRadius: 24,
                opacity: 0,
                pointerEvents: 'none',
              }}
              animate={{
                boxShadow: [
                  '0 0 15px 2px rgba(246, 101, 36, 0.15)',
                  '0 0 25px 6px rgba(246, 101, 36, 0.3)',
                  '0 0 15px 2px rgba(246, 101, 36, 0.15)',
                ],
                opacity: [0.3, 0.7, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
                repeatType: 'mirror',
              }}
            />

            {/* Traveling light beam effect */}
            <div style={{ position: 'absolute', inset: -1, borderRadius: 24, overflow: 'hidden', pointerEvents: 'none' }}>
              {/* Top light beam */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: 2,
                  width: '50%',
                  background: 'linear-gradient(90deg, transparent, #F66524, #ffffff, transparent)',
                }}
                animate={{
                  left: ['-50%', '100%'],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  left: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror' },
                }}
              />
              {/* Right light beam */}
              <motion.div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 2,
                  height: '50%',
                  background: 'linear-gradient(180deg, transparent, #F66524, #ffffff, transparent)',
                }}
                animate={{
                  top: ['-50%', '100%'],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  top: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 0.6 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 0.6 },
                }}
              />
              {/* Bottom light beam */}
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  height: 2,
                  width: '50%',
                  background: 'linear-gradient(270deg, transparent, #F66524, #ffffff, transparent)',
                }}
                animate={{
                  right: ['-50%', '100%'],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  right: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.2 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.2 },
                }}
              />
              {/* Left light beam */}
              <motion.div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  width: 2,
                  height: '50%',
                  background: 'linear-gradient(0deg, transparent, #F66524, #ffffff, transparent)',
                }}
                animate={{
                  bottom: ['-50%', '100%'],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{
                  bottom: { duration: 2.5, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1, delay: 1.8 },
                  opacity: { duration: 1.2, repeat: Infinity, repeatType: 'mirror', delay: 1.8 },
                }}
              />
            </div>

            {/* Glass card container */}
            <div
              style={{
                position: 'relative',
                backgroundColor: 'rgba(20, 24, 33, 0.85)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderRadius: 24,
                padding: '32px 28px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
              }}
            >
              {/* Subtle inner grid pattern */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0.03,
                  backgroundImage: 'linear-gradient(135deg, white 0.5px, transparent 0.5px), linear-gradient(45deg, white 0.5px, transparent 0.5px)',
                  backgroundSize: '30px 30px',
                  pointerEvents: 'none',
                }}
              />

              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  cursor: 'pointer',
                  fontSize: 16,
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  zIndex: 20,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ffffff'
                  e.currentTarget.style.background = 'rgba(246, 101, 36, 0.6)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
                }}
              >
                <HiX />
              </button>

              {/* Modal Header */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  style={{
                    margin: '0 auto 12px auto',
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #F66524 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                    boxShadow: '0 4px 15px rgba(246, 101, 36, 0.4)',
                  }}
                >
                  <HiPencilAlt color="#ffffff" size={22} />
                </motion.div>
                <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                  User & Restaurant Details
                </h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
                  View and update your stored account details, restaurant profile, and date range.
                </p>
              </div>

              {savedSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 10,
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
                </motion.div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    onFocus={() => setFocusedInput('restaurant')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="e.g. TK Korean Restaurant"
                    style={{
                      width: '100%',
                      height: 44,
                      backgroundColor: 'var(--bg-input)',
                      border: focusedInput === 'restaurant' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      paddingLeft: 14,
                      paddingRight: 14,
                      outline: 'none',
                      boxShadow: focusedInput === 'restaurant' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>

                {/* User Name / Email */}
                <div>
                  <label style={labelStyle}>
                    <HiUser style={{ color: '#3b82f6' }} />
                    User Name / Email
                  </label>
                  <input
                    type="text"
                    required
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    onFocus={() => setFocusedInput('user')}
                    onBlur={() => setFocusedInput(null)}
                    placeholder="e.g. manager@restaurant.com"
                    style={{
                      width: '100%',
                      height: 44,
                      backgroundColor: 'var(--bg-input)',
                      border: focusedInput === 'user' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                      borderRadius: 10,
                      color: 'var(--text-primary)',
                      fontSize: 14,
                      paddingLeft: 14,
                      paddingRight: 14,
                      outline: 'none',
                      boxShadow: focusedInput === 'user' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>

                {/* Starting Date & Ending Date */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>
                      <HiCalendar style={{ color: '#8b5cf6' }} />
                      Starting Date
                    </label>
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      onFocus={() => setFocusedInput('start')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%',
                        height: 44,
                        backgroundColor: 'var(--bg-input)',
                        border: focusedInput === 'start' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        paddingLeft: 12,
                        paddingRight: 12,
                        outline: 'none',
                        boxShadow: focusedInput === 'start' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>

                  <div>
                    <label style={labelStyle}>
                      <HiCalendar style={{ color: '#10b981' }} />
                      Ending Date
                    </label>
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      onFocus={() => setFocusedInput('end')}
                      onBlur={() => setFocusedInput(null)}
                      style={{
                        width: '100%',
                        height: 44,
                        backgroundColor: 'var(--bg-input)',
                        border: focusedInput === 'end' ? '1px solid var(--accent-primary)' : '1px solid var(--border-medium)',
                        borderRadius: 10,
                        color: 'var(--text-primary)',
                        fontSize: 13,
                        paddingLeft: 12,
                        paddingRight: 12,
                        outline: 'none',
                        boxShadow: focusedInput === 'end' ? '0 0 12px rgba(245, 158, 11, 0.3)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={onClose}
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      backgroundColor: 'transparent',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-medium)',
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    style={{
                      flex: 1,
                      height: 44,
                      borderRadius: 10,
                      background: 'var(--gradient-warm)',
                      color: '#ffffff',
                      border: 'none',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: 'var(--shadow-glow)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <HiCheck size={18} />
                    <span>Save & Update</span>
                  </motion.button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
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
