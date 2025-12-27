'use client'
import { ReactNode } from 'react'
import { Header } from '@/components/shared/Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-black">
      <Header />
      <div className="min-h-[calc(100vh-80px)] text-black! w-full">
        {children}
      </div>
    </div>
  )
}

