import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'

export default function HiddenAdminTrigger() {
  const [isVisible, setIsVisible] = useState(false)
  const barRef = useRef(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Track gesture only on public page ("/")
  useEffect(() => {
    if (location.pathname !== '/' || isVisible) return

    let startY = 0
    let isTracking = false

    const handleStart = (clientY) => {
      // Must be near the very top of the page scroll
      if (window.scrollY > 10) return
      // Must start near the top of the viewport (within ~60px)
      if (clientY > 60) return

      startY = clientY
      isTracking = true
    }

    const handleMove = (clientY) => {
      if (!isTracking) return
      // If user starts scrolling down the page, cancel gesture
      if (window.scrollY > 10) {
        isTracking = false
        return
      }

      const deltaY = clientY - startY
      // Threshold: 60px downward pull
      if (deltaY >= 60) {
        setIsVisible(true)
        isTracking = false
      }
    }

    const handleEnd = () => {
      isTracking = false
    }

    // Touch event listeners (mobile)
    const onTouchStart = (e) => {
      if (e.touches && e.touches.length === 1) {
        handleStart(e.touches[0].clientY)
      }
    }

    const onTouchMove = (e) => {
      if (e.touches && e.touches.length === 1) {
        handleMove(e.touches[0].clientY)
      }
    }

    const onTouchEnd = () => {
      handleEnd()
    }

    // Mouse event listeners (desktop testing)
    const onMouseDown = (e) => {
      if (e.button !== 0) return // Left click only
      handleStart(e.clientY)
    }

    const onMouseMove = (e) => {
      if (e.buttons !== 1) {
        isTracking = false
        return
      }
      handleMove(e.clientY)
    }

    const onMouseUp = () => {
      handleEnd()
    }

    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })

    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)

      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [location.pathname, isVisible])

  // Auto-hide after 4 seconds of inactivity or on outside click
  useEffect(() => {
    if (!isVisible) return

    // Auto-hide timer
    const autoHideTimer = setTimeout(() => {
      setIsVisible(false)
    }, 4000)

    // Outside click / tap listener
    const handleOutsideClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        setIsVisible(false)
      }
    }

    // Small delay to prevent the trigger release from closing it immediately
    const outsideListenerTimeout = setTimeout(() => {
      window.addEventListener('mousedown', handleOutsideClick)
      window.addEventListener('touchstart', handleOutsideClick)
    }, 100)

    return () => {
      clearTimeout(autoHideTimer)
      clearTimeout(outsideListenerTimeout)
      window.removeEventListener('mousedown', handleOutsideClick)
      window.removeEventListener('touchstart', handleOutsideClick)
    }
  }, [isVisible])

  const handleAdminLogin = () => {
    setIsVisible(false)
    navigate('/admin/login')
  }

  // Active on the public "/" page only
  if (location.pathname !== '/') {
    return null
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={barRef}
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          className="fixed top-0 left-0 right-0 z-[100] h-[48px] bg-white border-b border-gray-200/80 shadow-sm flex items-center justify-center px-4"
        >
          <button
            type="button"
            onClick={handleAdminLogin}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gray-50 hover:bg-black text-gray-800 hover:text-white border border-gray-200 text-sm font-medium transition-colors duration-200 shadow-xs cursor-pointer"
          >
            <span>🔐</span>
            <span>Admin Login</span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
