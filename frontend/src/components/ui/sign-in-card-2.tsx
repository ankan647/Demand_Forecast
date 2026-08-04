'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { Mail, Lock, Eye, EyeClosed, ArrowRight } from 'lucide-react';

export interface SignInCardProps {
  onSignIn?: (email: string, pass: string) => void;
  onSignUp?: (email: string, pass: string) => void;
  onGoogleSignIn?: () => void;
  error?: string | null;
  message?: string | null;
  mode?: 'login' | 'signup';
  setMode?: (mode: 'login' | 'signup') => void;
  isLoading?: boolean;
  onClose?: () => void;
}

export function Component({
  onSignIn,
  onSignUp,
  onGoogleSignIn,
  error: propError,
  message: propMessage,
  mode: propMode,
  setMode: propSetMode,
  isLoading: propIsLoading,
  onClose
}: SignInCardProps = {}) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [internalLoading, setInternalLoading] = useState(false);
  const [internalMode, setInternalMode] = useState<'login' | 'signup'>('login');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const currentMode = propMode ?? internalMode;
  const setCurrentMode = propSetMode ?? setInternalMode;
  const isLoading = propIsLoading ?? internalLoading;

  // 3D Card tilt effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useTransform(mouseY, [-300, 300], [10, -10]);
  const rotateY = useTransform(mouseX, [-300, 300], [-10, 10]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (currentMode === 'signup' && onSignUp) {
      onSignUp(email, password);
    } else if (onSignIn) {
      onSignIn(email, password);
    } else {
      setInternalLoading(true);
      setTimeout(() => setInternalLoading(false), 2000);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px 16px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      {/* Autofill override styles */}
      <style>{`
        .signin-card-input:-webkit-autofill,
        .signin-card-input:-webkit-autofill:hover, 
        .signin-card-input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(25, 30, 40, 0.95) inset !important;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

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
          background: 'radial-gradient(ellipse at top, rgba(246, 101, 36, 0.35) 0%, rgba(246, 101, 36, 0.1) 60%, transparent 80%)',
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
          background: 'radial-gradient(circle, rgba(246, 101, 36, 0.25) 0%, transparent 70%)',
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
        style={{
          position: 'absolute',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '80vh',
          height: '50vh',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(246, 101, 36, 0.2) 0%, transparent 70%)',
          filter: 'blur(70px)',
          pointerEvents: 'none',
        }}
        animate={{
          opacity: [0.2, 0.5, 0.2],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          repeatType: 'mirror',
          delay: 1,
        }}
      />

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 24,
            right: 24,
            color: 'rgba(255, 255, 255, 0.7)',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 50,
            fontSize: 18,
            fontWeight: 'bold',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.background = 'rgba(246, 101, 36, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          ✕
        </button>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          width: '100%',
          maxWidth: 410,
          position: 'relative',
          zIndex: 10,
          perspective: 1500,
        }}
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
                backgroundColor: 'rgba(20, 24, 33, 0.75)',
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

              {/* Logo Badge & Header */}
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', duration: 0.8 }}
                  style={{
                    margin: '0 auto 12px auto',
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    background: 'rgba(255, 255, 255, 0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
                  }}
                >
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#ffffff' }}>S</span>
                </motion.div>

                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#ffffff', margin: '0 0 4px 0', letterSpacing: '-0.01em' }}>
                  {currentMode === 'login' ? 'Welcome Back' : 'Create Account'}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.6)', margin: 0 }}>
                  {currentMode === 'login' ? 'Sign in to continue to SalePulse' : 'Register to get started with SalesPulse'}
                </p>
              </div>

              {/* Alerts */}
              {propError && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#f87171',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {propError}
                </div>
              )}
              {propMessage && (
                <div
                  style={{
                    marginBottom: 16,
                    padding: '10px 14px',
                    borderRadius: 10,
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: '#34d399',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  {propMessage}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Email Field */}
                <div style={{ position: 'relative' }}>
                  <Mail
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 18,
                      height: 18,
                      color: focusedInput === 'email' ? '#F66524' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'color 0.2s ease',
                      zIndex: 2,
                    }}
                  />
                  <input
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedInput('email')}
                    onBlur={() => setFocusedInput(null)}
                    className="signin-card-input"
                    style={{
                      width: '100%',
                      height: 44,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: focusedInput === 'email' ? '1px solid #F66524' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      paddingLeft: 42,
                      paddingRight: 14,
                      outline: 'none',
                      boxShadow: focusedInput === 'email' ? '0 0 12px rgba(246, 101, 36, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>

                {/* Password Field */}
                <div style={{ position: 'relative' }}>
                  <Lock
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 18,
                      height: 18,
                      color: focusedInput === 'password' ? '#F66524' : 'rgba(255, 255, 255, 0.4)',
                      transition: 'color 0.2s ease',
                      zIndex: 2,
                    }}
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput(null)}
                    className="signin-card-input"
                    style={{
                      width: '100%',
                      height: 44,
                      backgroundColor: 'rgba(255, 255, 255, 0.06)',
                      border: focusedInput === 'password' ? '1px solid #F66524' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: 10,
                      color: '#ffffff',
                      fontSize: 14,
                      paddingLeft: 42,
                      paddingRight: 42,
                      outline: 'none',
                      boxShadow: focusedInput === 'password' ? '0 0 12px rgba(246, 101, 36, 0.3)' : 'none',
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <div
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? (
                      <Eye style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.6)' }} />
                    ) : (
                      <EyeClosed style={{ width: 18, height: 18, color: 'rgba(255, 255, 255, 0.4)' }} />
                    )}
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: 'rgba(255, 255, 255, 0.65)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                      style={{
                        width: 15,
                        height: 15,
                        accentColor: '#F66524',
                        cursor: 'pointer',
                        borderRadius: 4,
                      }}
                    />
                    Remember me
                  </label>

                  <Link href="/forgot-password" style={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.65)', textDecoration: 'none' }}>
                    Forgot password?
                  </Link>
                </div>

                {/* Submit Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={isLoading}
                  style={{
                    width: '100%',
                    height: 44,
                    marginTop: 8,
                    borderRadius: 10,
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    boxShadow: '0 4px 15px rgba(255, 255, 255, 0.15)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          width: 18,
                          height: 18,
                          border: '2px solid rgba(0,0,0,0.3)',
                          borderTopColor: '#000000',
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                    ) : (
                      <motion.span
                        key="text"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                      >
                        {currentMode === 'login' ? 'Sign In' : 'Create Account'}
                        <ArrowRight style={{ width: 16, height: 16 }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', margin: '4px 0' }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                  <span style={{ margin: '0 12px', fontSize: 12, color: 'rgba(255, 255, 255, 0.4)' }}>or</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
                </div>

                {/* Google Sign In Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={onGoogleSignIn}
                  style={{
                    width: '100%',
                    height: 44,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontWeight: 500,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14 }}>G</span>
                  <span>Sign in with Google</span>
                </motion.button>

                {/* Bottom Toggle Text */}
                <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255, 255, 255, 0.6)', margin: '12px 0 0 0' }}>
                  {currentMode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setCurrentMode('signup')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Sign up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setCurrentMode('login')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          fontWeight: 600,
                          cursor: 'pointer',
                          padding: 0,
                          textDecoration: 'underline',
                        }}
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </form>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
