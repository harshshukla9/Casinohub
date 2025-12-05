'use client'

import { GameLayout } from '../GameLayout'

export function Demo() {
  return (
    <div className="flex h-screen w-full flex-col items-center">
      <div className="w-full space-y-6 md:space-y-0 md:h-full md:w-full md:flex">
        <GameLayout />
      </div>
    </div>
  )
}
