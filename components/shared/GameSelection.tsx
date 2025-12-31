'use client'
import Link from 'next/link'
import React, { useState } from 'react'
import { Header } from './Header'
import { Sparkles, TrendingUp, Users, Trophy, ChevronRight, Coins, Gift, Clock, Crown } from 'lucide-react'

export function GameSelection() {
  const [activeCategory, setActiveCategory] = useState('all')

  const heroPromos = [
    {
      title: "PLAY NOW",
      amount: "AND WIN BIG",
      bgColor: "from-green-600 to-emerald-500",
      character: "⚽",
      coins: true
    },
  ]

  const categories = [
    { id: 'all', name: 'All Games', icon: '🎮' },
    { id: 'crash', name: 'Crash', icon: '🚀' },
    { id: 'roulette', name: 'Roulette', icon: '🎡' },
    { id: 'slot', name: 'Slot', icon: '🎰' },
    { id: 'mines', name: 'Mines', icon: '💎' },
    { id: 'battles', name: 'Battles', icon: '⚔️' },
    { id: 'plinko', name: 'Plinko', icon: '🎯' },
  ]

  const featuredGames = [
    { name: "Sweet Bonanza", img: "/casinoHub/Mines.png", tag: "Popular", link: "/mine" },
    { name: "Gates of Olympus", img: "/casinoHub/Crash.png", tag: "Hot", link: "/crash" },
    { name: "Crazy Time", img: "/casinoHub/Slide.png", tag: "New", link: "/slide" },
    { name: "Dog House", img: "/casinoHub/Plinko.png", tag: "Trending", link: "/videopoker" },
  ]

  const leaderboard = [
    { rank: 1, name: "WolfGang123", avatar: "🐺", amount: "8,888,150", profit: "+8,888,888" },
    { rank: 2, name: "BigDreamer", avatar: "🎭", amount: "7,555,000", profit: "+7,555,555" },
    { rank: 3, name: "RayPig33", avatar: "🐷", amount: "6,888,888", profit: "+6,888,888" },
    { rank: 4, name: "StarPlay", avatar: "⭐", amount: "5,346,678", profit: "+5,346,678" },
    { rank: 5, name: "NexShy7", avatar: "🎪", amount: "4,888,220", profit: "+4,888,888" },
  ]

  return (
    <div className='min-h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden'>
      {/* Decorative Background Elements */}
      <div className='absolute top-0 left-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl'></div>
      <div className='absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl'></div>

      <Header />

      <div className='relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8'>

        {/* Hero Promotional Banners */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {heroPromos.map((promo, idx) => (
            <div
              key={idx}
              className={`relative bg-gradient-to-br ${promo.bgColor} rounded-2xl p-6 overflow-hidden group cursor-pointer hover:scale-105 transition-all duration-300 shadow-2xl`}
            >
              <div className='relative z-10 space-y-3'>
                <div className='text-xs font-bold text-white/80 tracking-widest uppercase'>Product</div>
                <h3 className='text-xl md:text-2xl font-bold text-white leading-tight'>{promo.title}</h3>
                <p className='text-2xl md:text-3xl font-black text-yellow-300'>{promo.amount}</p>
                <div className='flex gap-1'>
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className={`w-2 h-2 rounded-full ${i <= 3 ? 'bg-yellow-400' : 'bg-white/30'}`}></div>
                  ))}
                </div>
                <button className='bg-slate-900 text-white px-6 py-2 rounded-lg font-bold text-sm hover:bg-slate-800 transition-colors flex items-center gap-2'>
                  Claim Now <ChevronRight className='w-4 h-4' />
                </button>
              </div>

              {/* Character/Icon */}
              <div className='absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-90 group-hover:scale-110 transition-transform'>
                {promo.character}
              </div>

              {/* Floating Coins */}
              {promo.coins && (
                <>
                  <div className='absolute bottom-4 right-20 text-3xl animate-bounce'>🪙</div>
                  <div className='absolute bottom-12 right-32 text-2xl animate-pulse'>🪙</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Game Categories */}
        <div className='bg-slate-800/30 backdrop-blur-lg rounded-2xl p-4 border border-slate-700/50'>
          <div className='flex items-center gap-2 mb-4'>
            <Sparkles className='w-5 h-5 text-yellow-400' />
            <h2 className='text-xl font-bold text-white'>Original Game</h2>
          </div>

          <div className='flex gap-3 overflow-x-auto pb-2 scrollbar-hide'>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${activeCategory === cat.id
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50 scale-105'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
              >
                <span className='text-xl'>{cat.icon}</span>
                <span className='whitespace-nowrap'>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Games Grid */}
        <div className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Trophy className='w-5 h-5 text-yellow-400' />
              <h2 className='text-2xl font-bold text-white'>Featured Games</h2>
            </div>
            <button className='text-green-400 hover:text-green-300 transition-colors font-semibold flex items-center gap-1'>
              View All <ChevronRight className='w-4 h-4' />
            </button>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
            {featuredGames.map((game, idx) => (
              <Link
                href={game.link}
                key={idx}
                className='group relative bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-green-500/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20'
              >
                <div className='aspect-square relative'>
                  <div
                    className='w-full h-full bg-cover bg-center group-hover:scale-110 transition-transform duration-500'
                    style={{ backgroundImage: `url(${game.img})` }}
                  ></div>

                  {/* Tag Badge */}
                  <div className='absolute top-2 left-2 bg-yellow-500 text-slate-900 px-3 py-1 rounded-full text-xs font-black'>
                    {game.tag}
                  </div>

                  {/* Play Overlay */}
                  <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center'>
                    <div className='bg-green-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg'>
                      PLAY NOW
                    </div>
                  </div>
                </div>

                <div className='p-3'>
                  <h3 className='font-bold text-white text-sm truncate'>{game.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>


      </div>
    </div>
  )
}

