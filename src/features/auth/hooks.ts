'use client'
import { useState, useEffect } from 'react'
import { User } from '@/entities/user'

export function useCurrentUser() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const data = sessionStorage.getItem('user')
    if (data) setUser(JSON.parse(data))
  }, [])

  return user
}
