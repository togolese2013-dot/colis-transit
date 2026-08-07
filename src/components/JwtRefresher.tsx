'use client'

import { useEffect } from 'react'

export function JwtRefresher() {
  useEffect(() => {
    fetch('/api/auth/profile').catch(() => {})
  }, [])

  return null
}
