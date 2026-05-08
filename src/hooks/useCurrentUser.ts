'use client'

import { useEffect, useState } from 'react'

export function useCurrentUser() {
  const [displayName, setDisplayName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hc_display_name') || localStorage.getItem('hc_user') || ''
    }
    return ''
  })

  useEffect(() => {
    fetch('/api/auth/profile')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.displayName) {
          setDisplayName(data.displayName)
          localStorage.setItem('hc_display_name', data.displayName)
        }
      })
      .catch(() => {})
  }, [])

  const initials = displayName
    ? displayName.slice(0, 2).toUpperCase()
    : '?'

  return { username: displayName, initials }
}
