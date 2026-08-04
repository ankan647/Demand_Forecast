import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Component as SignInCard } from './ui/sign-in-card-2'

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [mode, setMode] = useState('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  if (!isOpen) return null

  const handleSignIn = async (email, password) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (err) throw err
      if (onSuccess) onSuccess(data.session)
      onClose()
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (email, password) => {
    setLoading(true)
    setError(null)
    setMessage(null)
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
      })
      if (err) throw err
      if (data?.user && !data.session) {
        setMessage('Account created! Check your email for confirmation.')
      } else {
        setMessage('Account created and signed in!')
        if (onSuccess) onSuccess(data.session)
        onClose()
      }
    } catch (err) {
      setError(err.message || 'Registration failed.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      })
      if (err) throw err
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, overflowY: 'auto' }}>
      <SignInCard
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        onGoogleSignIn={handleGoogleLogin}
        error={error}
        message={message}
        mode={mode}
        setMode={setMode}
        isLoading={loading}
        onClose={onClose}
      />
    </div>
  )
}
