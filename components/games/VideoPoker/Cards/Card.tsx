'use client'
import Link from 'next/link'
import React, { useState } from 'react'

const Card = ({ background, link, name, desc }: any) => {
  const [isHovered, setIsHovered] = useState(false)
  const [cardTransform, setCardTransform] = useState('')

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget.closest('.card-wrapper')
    if (!card) return

    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const rotateX = ((y - centerY) / centerY) * 20
    const rotateY = ((centerX - x) / centerX) * 10

    setCardTransform(`rotateX(${rotateX}deg) rotateY(${rotateY}deg)`)
  }

  const handleMouseLeave = () => {
    setCardTransform('')
    setIsHovered(false)
  }

  const handleMouseEnter = () => {
    setIsHovered(true)
  }

  return (
    <div
      className="card-wrapper relative w-[254px] h-[198px] transition-all duration-200 active:scale-[0.96] select-none"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={link} className="block w-full h-full">
        <div className="relative w-full h-full" style={{ perspective: '800px' }}>
          <div
            className="card-3d absolute inset-0 z-0 flex justify-center items-center rounded-[20px] transition-all duration-[700ms] bg-gradient-to-br from-[#1a1a1a] to-[#262626] border-2 border-white/10 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.3),inset_0_0_20px_rgba(0,0,0,0.2)]"
            style={{
              transform: cardTransform || 'rotateX(0deg) rotateY(0deg)',
              filter: isHovered ? 'brightness(1.1)' : 'brightness(1)',
            }}
          >
            <div
              className={`card-content relative w-full h-full bg-${background} bg-center bg-cover`}
            >
              {/* Glare effect */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Cyber lines */}
              <div className="cyber-lines absolute inset-0 pointer-events-none">
                <span
                  className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(92,103,255,0.2)] to-transparent origin-left"
                  style={{
                    transform: 'scaleX(0)',
                    animation: 'lineGrow 3s linear infinite',
                  }}
                />
                <span
                  className="absolute top-[40%] right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(92,103,255,0.2)] to-transparent origin-right"
                  style={{
                    transform: 'scaleX(0)',
                    animation: 'lineGrow 3s linear infinite 1s',
                  }}
                />
                <span
                  className="absolute top-[60%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(92,103,255,0.2)] to-transparent origin-left"
                  style={{
                    transform: 'scaleX(0)',
                    animation: 'lineGrow 3s linear infinite 2s',
                  }}
                />
                <span
                  className="absolute top-[80%] right-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[rgba(92,103,255,0.2)] to-transparent origin-right"
                  style={{
                    transform: 'scaleX(0)',
                    animation: 'lineGrow 3s linear infinite 1.5s',
                  }}
                />
              </div>

              {/* Prompt text */}
              <p
                className={`absolute bottom-[100px] left-1/2 -translate-x-1/2 z-20 font-semibold text-3xl tracking-[2px] transition-all duration-300 ease-in-out text-center text-white/70 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] ${
                  isHovered ? 'opacity-0' : 'opacity-100'
                }`}
              >
                {name}
              </p>

              {/* Title */}
              <div
                className={`absolute top-5 w-full text-center pt-5 text-[28px] font-extrabold tracking-[4px] transition-all duration-300 ease-in-out bg-gradient-to-r from-[#00ffaa] to-[#00a2ff] bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(0,255,170,0.3)] ${
                  isHovered ? 'opacity-100 -translate-y-[10px]' : 'opacity-0'
                }`}
              >
                Enter the<br />
                {name}
              </div>

              {/* Glowing elements */}
              <div className="glowing-elements absolute inset-0 pointer-events-none">
                <div
                  className={`absolute -top-5 -left-5 w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,170,0.3)_0%,rgba(0,255,170,0)_70%)] blur-[15px] transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  className={`absolute top-1/2 -right-[30px] -translate-y-1/2 w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,170,0.3)_0%,rgba(0,255,170,0)_70%)] blur-[15px] transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <div
                  className={`absolute -bottom-5 left-[30%] w-[100px] h-[100px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,255,170,0.3)_0%,rgba(0,255,170,0)_70%)] blur-[15px] transition-opacity duration-300 ${
                    isHovered ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>

              {/* Radial gradient background on hover */}
              <div
                className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(0,255,170,0.1)_0%,rgba(0,162,255,0.05)_50%,transparent_100%)] blur-[20px] transition-opacity duration-300 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {/* Subtitle */}
              <div className="subtitle absolute bottom-10 w-full text-center text-xs tracking-[2px] translate-y-[30px] text-white/60">
                <span className="text-[#00ffaa] ml-[5px] font-bold bg-gradient-to-r from-[#5c67ff] to-[#ad51ff] bg-clip-text text-transparent">
                  {desc}
                </span>
              </div>

              {/* Card particles */}
              <div className="card-particles absolute inset-0 pointer-events-none">
                {[
                  { x: 1, y: -1, top: '40%', left: '20%' },
                  { x: -1, y: -1, top: '60%', right: '20%' },
                  { x: 0.5, y: 1, top: '20%', left: '40%' },
                  { x: -0.5, y: 1, top: '80%', right: '40%' },
                  { x: 1, y: 0.5, top: '30%', left: '60%' },
                  { x: -1, y: 0.5, top: '70%', right: '60%' },
                ].map((pos, i) => (
                  <span
                    key={i}
                    className={`absolute w-[3px] h-[3px] bg-[#00ffaa] rounded-full transition-opacity duration-300 ${
                      isHovered ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{
                      '--x': pos.x,
                      '--y': pos.y,
                      top: pos.top,
                      left: pos.left || undefined,
                      right: pos.right || undefined,
                      animationName: isHovered ? 'particleFloat' : 'none',
                      animationDuration: '2s',
                      animationIterationCount: 'infinite',
                      animationTimingFunction: 'ease',
                      animationDelay: `${i * 0.1}s`,
                    } as React.CSSProperties}
                  />
                ))}
              </div>

              {/* Corner elements */}
              <div className="corner-elements absolute inset-0 pointer-events-none">
                <span
                  className={`absolute top-[10px] left-[10px] w-[15px] h-[15px] border-2 border-[rgba(92,103,255,0.3)] border-r-0 border-b-0 transition-all duration-300 ${
                    isHovered ? 'border-[rgba(92,103,255,0.8)] shadow-[0_0_10px_rgba(92,103,255,0.5)]' : ''
                  }`}
                />
                <span
                  className={`absolute top-[10px] right-[10px] w-[15px] h-[15px] border-2 border-[rgba(92,103,255,0.3)] border-l-0 border-b-0 transition-all duration-300 ${
                    isHovered ? 'border-[rgba(92,103,255,0.8)] shadow-[0_0_10px_rgba(92,103,255,0.5)]' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-[10px] left-[10px] w-[15px] h-[15px] border-2 border-[rgba(92,103,255,0.3)] border-r-0 border-t-0 transition-all duration-300 ${
                    isHovered ? 'border-[rgba(92,103,255,0.8)] shadow-[0_0_10px_rgba(92,103,255,0.5)]' : ''
                  }`}
                />
                <span
                  className={`absolute bottom-[10px] right-[10px] w-[15px] h-[15px] border-2 border-[rgba(92,103,255,0.3)] border-l-0 border-t-0 transition-all duration-300 ${
                    isHovered ? 'border-[rgba(92,103,255,0.8)] shadow-[0_0_10px_rgba(92,103,255,0.5)]' : ''
                  }`}
                />
              </div>

              {/* Scan line */}
              <div
                className="scan-line absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(92,103,255,0.1)] to-transparent -translate-y-full"
                style={{
                  animation: 'scanMove 2s linear infinite',
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default Card
