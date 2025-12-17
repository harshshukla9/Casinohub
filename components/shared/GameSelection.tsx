'use client'
import Link from 'next/link'
import React from 'react'
import Card from '@/components/games/VideoPoker/Cards/Card'

export function GameSelection() {
  const games = [
    {
      name: "Mine",
      link: "/mine",
      background: "mine",
      desc: "Find Gem"
    },
    {
      name: "Crash",
      link: "/crash",
      background: "crash",
      desc: "Never stop!"
    },
    {
      name: "Slide",
      link: "/slide",
      background: "jackport",
      desc: "Anyhow, it stops"
    },
    {
      name: "Poker",
      link: "/videopoker",
      background: "poker",
      desc: "Poker king"
    },
  ]

  return (
    <div className='min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4'>
      <div className='w-full max-w-6xl'>
        <div className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-white mb-2'>Status Mines</h1>
          <p className='text-lg text-white/70'>Choose your game and start winning</p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 gap-8 w-full max-w-4xl mx-auto'>
          {games.map((game, idx) => (
            <Card {...game} key={idx} />
          ))}
        </div>

        <div className='text-center mt-8'>
          <p className='text-sm text-white/50'>
            Connect your wallet to start playing. All games share the same balance.
          </p>
        </div>
      </div>
    </div>
  )
}

