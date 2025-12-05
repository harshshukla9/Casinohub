'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { verifyGameHash, reconstructGameState } from '@/lib/provable-fair'

function VerifyContent() {
  const searchParams = useSearchParams()
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean
    minePositions: number[]
    computedHash: string
  } | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hash = searchParams.get('hash')
  const serverSeed = searchParams.get('serverSeed')
  const clientSeed = searchParams.get('clientSeed')
  const mines = searchParams.get('mines')
  const mode = searchParams.get('mode')
  const bet = searchParams.get('bet')

  useEffect(() => {
    if (hash && serverSeed && clientSeed && mines && mode && bet) {
      verify()
    }
  }, [hash, serverSeed, clientSeed, mines, mode, bet])

  const verify = async () => {
    if (!hash || !serverSeed || !clientSeed || !mines || !mode || !bet) {
      setError('Missing required parameters')
      return
    }

    setIsVerifying(true)
    setError(null)

    try {
      const result = await verifyGameHash(
        hash,
        serverSeed,
        clientSeed,
        parseInt(mines),
        25, // totalTiles
        mode,
        parseFloat(bet)
      )

      setVerificationResult(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setIsVerifying(false)
    }
  }

  const renderGrid = (minePositions: number[]) => {
    const rows = 5
    const cols = 5
    const grid: boolean[][] = Array(rows).fill(null).map(() => Array(cols).fill(false))

    minePositions.forEach(pos => {
      const row = Math.floor(pos / cols)
      const col = pos % cols
      grid[row][col] = true
    })

    return (
      <div className="grid grid-cols-5 gap-2 max-w-md mx-auto">
        {grid.map((row, rowIdx) =>
          row.map((isMine, colIdx) => (
            <div
              key={`${rowIdx}-${colIdx}`}
              className={`w-12 h-12 rounded flex items-center justify-center text-lg ${
                isMine
                  ? 'bg-red-500/30 border-2 border-red-500'
                  : 'bg-green-500/30 border-2 border-green-500'
              }`}
            >
              {isMine ? '💣' : '💎'}
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          Provable Fair Verification
        </h1>

        <div className="bg-gray-900/50 rounded-lg p-6 space-y-6">
          {/* Game Parameters */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Game Parameters</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Game Hash:</span>
                <div className="text-white font-mono text-xs break-all mt-1">
                  {hash || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Server Seed:</span>
                <div className="text-white font-mono text-xs break-all mt-1">
                  {serverSeed || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Client Seed:</span>
                <div className="text-white font-mono text-xs break-all mt-1">
                  {clientSeed || 'N/A'}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Mines:</span>
                <div className="text-white mt-1">{mines || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-400">Mode:</span>
                <div className="text-white mt-1 capitalize">{mode || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-400">Bet Amount:</span>
                <div className="text-white mt-1">{bet ? `${bet} STT` : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Verification Result */}
          {isVerifying && (
            <div className="text-center py-8">
              <div className="text-white">Verifying...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
              <div className="text-red-300 font-medium">Error</div>
              <div className="text-red-200 text-sm mt-1">{error}</div>
            </div>
          )}

          {verificationResult && (
            <>
              <div
                className={`border-2 rounded-lg p-4 ${
                  verificationResult.isValid
                    ? 'bg-green-500/20 border-green-500'
                    : 'bg-red-500/20 border-red-500'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {verificationResult.isValid ? (
                    <>
                      <span className="text-2xl">✅</span>
                      <span className="text-xl font-bold text-green-300">
                        Hash Verified Successfully!
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">❌</span>
                      <span className="text-xl font-bold text-red-300">
                        Hash Verification Failed!
                      </span>
                    </>
                  )}
                </div>
                <div className="text-sm text-gray-300 mt-2">
                  <div>Expected Hash: {hash}</div>
                  <div>Computed Hash: {verificationResult.computedHash}</div>
                </div>
              </div>

              {/* Mine Positions Grid */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-4">
                  Mine Positions (Reconstructed)
                </h2>
                <div className="text-sm text-gray-400 mb-2">
                  Positions: {verificationResult.minePositions.join(', ')}
                </div>
                {renderGrid(verificationResult.minePositions)}
              </div>
            </>
          )}

          {/* Manual Verification */}
          <div className="border-t border-gray-700 pt-6">
            <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
            <div className="text-gray-300 text-sm space-y-2">
              <p>
                1. The game uses a provable fair system with server and client seeds.
              </p>
              <p>
                2. Mine positions are deterministically generated from the combined seed.
              </p>
              <p>
                3. A hash is computed from the game state before any tiles are revealed.
              </p>
              <p>
                4. You can verify that the hash matches the actual game state using this page.
              </p>
              <p>
                5. The server seed should only be revealed after the game ends to ensure fairness.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-purple-900 p-8 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    }>
      <VerifyContent />
    </Suspense>
  )
}

