'use client'

import { useEffect } from 'react'

export default function VisitorTracker() {
  useEffect(() => {
    // Smart Tracking: only fire once per session to reduce DB load
    const sessionKey = 'tif_visit_tracked_session'
    if (!sessionStorage.getItem(sessionKey)) {
      fetch('/api/track/visit', { method: 'POST' })
        .then(() => sessionStorage.setItem(sessionKey, 'true'))
        .catch(() => {})
    }
  }, [])

  return null
}
