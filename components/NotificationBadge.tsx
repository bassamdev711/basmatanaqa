'use client'

import React, { useEffect, useState } from 'react'

export default function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    fetch('/api/user/notifications/unread-count')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.count === 'number') {
          setUnreadCount(data.count)
        }
      })
      .catch(() => {})
  }, [])

  if (unreadCount === 0) return null

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white pointer-events-none shadow-sm">
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  )
}
