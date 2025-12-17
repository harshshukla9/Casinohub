'use client'
import { ReactNode } from 'react'
import { Header } from '@/components/shared/Header'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <div className="min-h-[calc(100vh-80px)] w-full">
        {children}
      </div>
    </div>
  )
}

