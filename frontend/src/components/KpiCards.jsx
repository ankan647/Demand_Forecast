import { useRef, useEffect, useCallback } from 'react'
import { HiCurrencyRupee, HiShoppingCart, HiChartBar, HiStar, HiCube } from 'react-icons/hi'
import { gsap } from 'gsap'

const DEFAULT_GLOW_COLOR = '245, 158, 11'
const DEFAULT_SPOTLIGHT_RADIUS = 300

const createParticleElement = (x, y, color = DEFAULT_GLOW_COLOR) => {
  const el = document.createElement('div')
  el.className = 'bento-particle'
  el.style.cssText = `
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: rgba(${color}, 1);
    box-shadow: 0 0 8px rgba(${color}, 0.8);
    pointer-events: none;
    z-index: 100;
    left: ${x}px;
    top: ${y}px;
  `
  return el
}

const updateCardGlowProperties = (card, mouseX, mouseY, glow, radius) => {
  const rect = card.getBoundingClientRect()
  const relativeX = ((mouseX - rect.left) / rect.width) * 100
  const relativeY = ((mouseY - rect.top) / rect.height) * 100

  card.style.setProperty('--glow-x', `${relativeX}%`)
  card.style.setProperty('--glow-y', `${relativeY}%`)
  card.style.setProperty('--glow-intensity', glow.toString())
  card.style.setProperty('--glow-radius', `${radius}px`)
}

function ParticleKpiCard({ children, className, style, i }) {
  const cardRef = useRef(null)
  const particlesRef = useRef([])
  const timeoutsRef = useRef([])
  const isHoveredRef = useRef(false)
  const memoizedParticles = useRef([])
  const particlesInitialized = useRef(false)
  const magnetismAnimationRef = useRef(null)

  const initializeParticles = useCallback(() => {
    if (particlesInitialized.current || !cardRef.current) return
    const { width, height } = cardRef.current.getBoundingClientRect()
    memoizedParticles.current = Array.from({ length: 8 }, () =>
      createParticleElement(Math.random() * width, Math.random() * height, DEFAULT_GLOW_COLOR)
    )
    particlesInitialized.current = true
  }, [])

  const clearAllParticles = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    magnetismAnimationRef.current?.kill()

    particlesRef.current.forEach(particle => {
      gsap.to(particle, {
        scale: 0,
        opacity: 0,
        duration: 0.3,
        ease: 'back.in(1.7)',
        onComplete: () => {
          particle.parentNode?.removeChild(particle)
        }
      })
    })
    particlesRef.current = []
  }, [])

  const animateParticles = useCallback(() => {
    if (!cardRef.current || !isHoveredRef.current) return
    if (!particlesInitialized.current) initializeParticles()

    memoizedParticles.current.forEach((particle, index) => {
      const timeoutId = setTimeout(() => {
        if (!isHoveredRef.current || !cardRef.current) return

        const clone = particle.cloneNode(true)
        cardRef.current.appendChild(clone)
        particlesRef.current.push(clone)

        gsap.fromTo(clone, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' })

        gsap.to(clone, {
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
          rotation: Math.random() * 360,
          duration: 2 + Math.random() * 2,
          ease: 'none',
          repeat: -1,
          yoyo: true
        })

        gsap.to(clone, {
          opacity: 0.3,
          duration: 1.5,
          ease: 'power2.inOut',
          repeat: -1,
          yoyo: true
        })
      }, index * 120)

      timeoutsRef.current.push(timeoutId)
    })
  }, [initializeParticles])

  useEffect(() => {
    const element = cardRef.current
    if (!element) return

    const handleMouseEnter = () => {
      isHoveredRef.current = true
      animateParticles()
      gsap.to(element, {
        rotateX: 4,
        rotateY: 4,
        duration: 0.3,
        ease: 'power2.out',
        transformPerspective: 1000
      })
    }

    const handleMouseLeave = () => {
      isHoveredRef.current = false
      clearAllParticles()
      gsap.to(element, {
        rotateX: 0,
        rotateY: 0,
        x: 0,
        y: 0,
        duration: 0.3,
        ease: 'power2.out'
      })
    }

    const handleMouseMove = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2

      const rotateX = ((y - centerY) / centerY) * -8
      const rotateY = ((x - centerX) / centerX) * 8
      const magnetX = (x - centerX) * 0.04
      const magnetY = (y - centerY) * 0.04

      gsap.to(element, {
        rotateX,
        rotateY,
        x: magnetX,
        y: magnetY,
        duration: 0.15,
        ease: 'power2.out',
        transformPerspective: 1000
      })
    }

    const handleClick = e => {
      const rect = element.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const maxDistance = Math.max(
        Math.hypot(x, y),
        Math.hypot(x - rect.width, y),
        Math.hypot(x, y - rect.height),
        Math.hypot(x - rect.width, y - rect.height)
      )

      const ripple = document.createElement('div')
      ripple.style.cssText = `
        position: absolute;
        width: ${maxDistance * 2}px;
        height: ${maxDistance * 2}px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(${DEFAULT_GLOW_COLOR}, 0.4) 0%, rgba(${DEFAULT_GLOW_COLOR}, 0.2) 30%, transparent 70%);
        left: ${x - maxDistance}px;
        top: ${y - maxDistance}px;
        pointer-events: none;
        z-index: 1000;
      `

      element.appendChild(ripple)

      gsap.fromTo(
        ripple,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 0.8,
          ease: 'power2.out',
          onComplete: () => ripple.remove()
        }
      )
    }

    element.addEventListener('mouseenter', handleMouseEnter)
    element.addEventListener('mouseleave', handleMouseLeave)
    element.addEventListener('mousemove', handleMouseMove)
    element.addEventListener('click', handleClick)

    return () => {
      isHoveredRef.current = false
      element.removeEventListener('mouseenter', handleMouseEnter)
      element.removeEventListener('mouseleave', handleMouseLeave)
      element.removeEventListener('mousemove', handleMouseMove)
      element.removeEventListener('click', handleClick)
      clearAllParticles()
    }
  }, [animateParticles, clearAllParticles])

  return (
    <div
      ref={cardRef}
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}

export default function KpiCards({ data }) {
  const gridRef = useRef(null)
  const spotlightRef = useRef(null)

  useEffect(() => {
    if (!gridRef.current) return

    const spotlight = document.createElement('div')
    spotlight.className = 'global-spotlight'
    spotlight.style.cssText = `
      position: fixed;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      pointer-events: none;
      background: radial-gradient(circle,
        rgba(${DEFAULT_GLOW_COLOR}, 0.18) 0%,
        rgba(${DEFAULT_GLOW_COLOR}, 0.08) 20%,
        rgba(${DEFAULT_GLOW_COLOR}, 0.02) 40%,
        transparent 70%
      );
      z-index: 200;
      opacity: 0;
      transform: translate(-50%, -50%);
      mix-blend-mode: screen;
    `
    document.body.appendChild(spotlight)
    spotlightRef.current = spotlight

    const handleMouseMove = e => {
      if (!spotlightRef.current || !gridRef.current) return

      const rect = gridRef.current.getBoundingClientRect()
      const mouseInside =
        e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom

      const cards = gridRef.current.querySelectorAll('.kpi-card')

      if (!mouseInside) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
        cards.forEach(card => card.style.setProperty('--glow-intensity', '0'))
        return
      }

      cards.forEach(card => {
        const cardRect = card.getBoundingClientRect()
        const centerX = cardRect.left + cardRect.width / 2
        const centerY = cardRect.top + cardRect.height / 2
        const distance = Math.hypot(e.clientX - centerX, e.clientY - centerY) - Math.max(cardRect.width, cardRect.height) / 2
        const effectiveDistance = Math.max(0, distance)

        let glowIntensity = 0
        if (effectiveDistance <= 150) glowIntensity = 1
        else if (effectiveDistance <= 300) glowIntensity = (300 - effectiveDistance) / 150

        updateCardGlowProperties(card, e.clientX, e.clientY, glowIntensity, DEFAULT_SPOTLIGHT_RADIUS)
      })

      gsap.to(spotlightRef.current, {
        left: e.clientX,
        top: e.clientY,
        opacity: 0.8,
        duration: 0.1,
        ease: 'power2.out'
      })
    }

    const handleMouseLeave = () => {
      gridRef.current?.querySelectorAll('.kpi-card').forEach(card => {
        card.style.setProperty('--glow-intensity', '0')
      })
      if (spotlightRef.current) {
        gsap.to(spotlightRef.current, { opacity: 0, duration: 0.3, ease: 'power2.out' })
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
      spotlightRef.current?.parentNode?.removeChild(spotlightRef.current)
    }
  }, [])

  if (!data) return null

  const kpis = [
    {
      label: 'Total Revenue',
      value: `₹${data.total_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${data.date_range?.start} — ${data.date_range?.end}`,
      valueClass: 'revenue',
      icon: <HiCurrencyRupee />,
    },
    {
      label: 'Active Days',
      value: data.total_orders?.toLocaleString('en-IN'),
      sub: `${data.products_sold} products sold`,
      valueClass: 'orders',
      icon: <HiShoppingCart />,
    },
    {
      label: 'Avg Daily Revenue',
      value: `₹${data.avg_order_value?.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`,
      sub: `${data.total_units?.toLocaleString('en-IN')} total units`,
      valueClass: 'aov',
      icon: <HiChartBar />,
    },
    {
      label: 'Top Product',
      value: data.top_item,
      sub: `₹${data.top_item_revenue?.toLocaleString('en-IN', { maximumFractionDigits: 0 })} revenue`,
      valueClass: 'product',
      icon: <HiStar />,
    },
    {
      label: 'Categories',
      value: data.categories,
      sub: `${data.refund_count} refunds (₹${data.refund_amount?.toLocaleString('en-IN', { maximumFractionDigits: 0 })})`,
      valueClass: 'orders',
      icon: <HiCube />,
    },
  ]

  return (
    <div className="kpi-grid" ref={gridRef}>
      {kpis.map((kpi, i) => (
        <ParticleKpiCard
          key={kpi.label}
          i={i}
          className={`kpi-card kpi-card--border-glow animate-fade-in stagger-${i + 1}`}
        >
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-label">{kpi.label}</div>
          <div className={`kpi-value ${kpi.valueClass}`}>{kpi.value}</div>
          <div className="kpi-sub">{kpi.sub}</div>
        </ParticleKpiCard>
      ))}
    </div>
  )
}
