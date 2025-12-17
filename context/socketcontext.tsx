'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import io, { Socket } from 'socket.io-client'
import { API_URL } from '@/config'
import { usePathname } from 'next/navigation'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    // Only connect socket.io for crash game, not for slide or other games
    // Since we're using API-based approach now, we don't need socket.io
    // Keeping this for backward compatibility but not connecting
    if (false && pathname?.includes('/crash')) {
      // Disabled - using API instead of socket.io
      const newSocket = io(`${API_URL}/crash`, {
        transports: ['websocket'],
        autoConnect: false,
      })

      newSocket.on('connect', () => {
        setConnected(true)
      })

      newSocket.on('disconnect', () => {
        setConnected(false)
      })

      setSocket(newSocket)

      return () => {
        if (newSocket.connected) {
          newSocket.close()
        }
      }
    } else {
      // For all pages, don't create socket connection (using API instead)
      setSocket(null)
      setConnected(false)
    }
  }, [pathname])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context.socket
}

