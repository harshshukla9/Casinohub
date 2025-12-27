'use client'
import Link from 'next/link'
import React from 'react'
import Card from '@/components/games/VideoPoker/Cards/Card'
import { CarouselDemo } from '../casinoHub/Carousel'

export function GameSelection() {
  const games = [
    {
      name: "Mine",
      link: "/mine",
      img: "/games/mines.png",
      background: "mine",
      desc: "Find Gem"
    },
    {
      name: "Crash",
      link: "/crash",
      img: "/games/mines.png",
      background: "crash",
      desc: "Never stop!"
    },
    {
      name: "Slide",
      link: "/slide",
      img: "/games/mines.png",
      background: "jackport",
      desc: "Anyhow, it stops"
    },
    {
      name: "Poker",
      link: "/videopoker",
      img: "/games/mines.png",
      background: "poker",
      desc: "Poker king"
    },
  ]

  return (
    <div className='min-h-screen w-full flex items-center justify-center'>
      <div className='w-full max-w-6xl'>
        <div className='text-center mb-4'>
          <h1 className='text-4xl font-bold text-black mb-2'>Status Mines</h1>
          {/* <p className='text-lg text-black/70'>Choose your game and start winning</p> */}
        </div>
        <CarouselDemo />

        <div className='grid grid-cols-2 gap-4 p-2'>
          {games.map((game, idx) => (
            <Link href={game.link} className='w-full h-[20vh] bg-green-300 overflow-hidden rounded-xl' key={idx}>
              <div className='w-full h-full bg-cover bg-center' style={{ backgroundImage: `url(${game.img})` }}></div>
            </Link>
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

