'use client'

import { useEffect, useRef } from 'react'
import { initializeStores } from '../stores'

interface StoreInitializerProps {
  children: React.ReactNode
}

export function StoreInitializer({ children }: StoreInitializerProps) {
  const hasInitialized = useRef(false)

  useEffect(() => {
    if (!hasInitialized.current) {
      initializeStores()
      hasInitialized.current = true
    }
  }, [])

  return <>{children}</>
} 