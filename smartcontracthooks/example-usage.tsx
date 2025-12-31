/**
 * Example component showing how to use the CasinoVault hooks
 * This is for reference - you can delete this file after understanding the usage
 */

import React, { useState } from 'react'
import {
  useDeposit,
  usePlayerDeposits,
  useVaultBalance,
  useVaultOwner,
  useDepositEvents,
  usePlayerDepositEvents,
  useFundVault,
  useEmergencyWithdraw,
  useTransferOwnership,
  type DepositEvent,
} from './index'

export function CasinoVaultExample() {
  const [depositAmount, setDepositAmount] = useState('')
  const [fundAmount, setFundAmount] = useState('')
  const [newOwner, setNewOwner] = useState('')

  // Player hooks
  const { deposit, isLoading: isDepositing, isConfirmed: isDepositConfirmed } = useDeposit({
    onSuccess: (txHash) => {
      console.log('Deposit successful:', txHash)
      setDepositAmount('')
    },
    onError: (error) => {
      console.error('Deposit failed:', error)
    },
  })

  const { deposits: playerDeposits, isLoading: isLoadingDeposits, refetch: refetchDeposits } = usePlayerDeposits()

  const { balance: vaultBalance, isLoading: isLoadingBalance, refetch: refetchBalance } = useVaultBalance()

  const { owner, isLoading: isLoadingOwner } = useVaultOwner()

  // Event listening
  const { events: allDepositEvents, clearEvents } = useDepositEvents({
    onDeposit: (event: DepositEvent) => {
      console.log('New deposit event:', event)
      // Here you can make API calls to save to your database
      // Example: saveDepositToDB(event)
    },
  })

  const { events: playerEvents } = usePlayerDepositEvents()

  // Owner hooks
  const { fundVault, isLoading: isFunding } = useFundVault({
    onSuccess: (txHash) => {
      console.log('Vault funded:', txHash)
      setFundAmount('')
      refetchBalance()
    },
  })

  const { emergencyWithdraw, isLoading: isEmergencyWithdrawing } = useEmergencyWithdraw({
    onSuccess: (txHash) => {
      console.log('Emergency withdrawal successful:', txHash)
      refetchBalance()
    },
  })

  const { transferOwnership, isLoading: isTransferring } = useTransferOwnership({
    onSuccess: (txHash) => {
      console.log('Ownership transferred:', txHash)
      setNewOwner('')
    },
  })

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return
    await deposit(depositAmount)
  }

  const handleFundVault = async () => {
    if (!fundAmount || parseFloat(fundAmount) <= 0) return
    await fundVault(fundAmount)
  }

  const handleEmergencyWithdraw = async () => {
    if (confirm('Are you sure you want to perform emergency withdrawal?')) {
      await emergencyWithdraw()
    }
  }

  const handleTransferOwnership = async () => {
    if (!newOwner) return
    await transferOwnership(newOwner)
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">CasinoVault Example</h1>

      {/* Vault Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Vault Information</h2>
        <p>Balance: {isLoadingBalance ? 'Loading...' : `${vaultBalance || '0'} MCS`}</p>
        <p>Owner: {isLoadingOwner ? 'Loading...' : (owner ? String(owner) : 'Unknown')}</p>
      </div>

      {/* Player Deposits */}
      <div className="bg-blue-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Your Deposits</h2>
        <p>Total Deposits: {isLoadingDeposits ? 'Loading...' : `${playerDeposits} MCS`}</p>
        <button
          onClick={() => refetchDeposits()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh
        </button>
      </div>

      {/* Deposit Form */}
      <div className="bg-green-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Make Deposit</h2>
        <div className="flex gap-2">
          <input
            type="number"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="Amount in MCS"
            className="flex-1 px-3 py-2 border rounded"
            step="0.001"
            min="0"
          />
          <button
            onClick={handleDeposit}
            disabled={isDepositing || !depositAmount}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {isDepositing ? 'Depositing...' : 'Deposit'}
          </button>
        </div>
        {isDepositConfirmed && <p className="text-green-600 mt-2">Deposit confirmed!</p>}
      </div>

      {/* Owner Functions */}
      <div className="bg-yellow-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Owner Functions</h2>
        
        <div className="space-y-4">
          {/* Fund Vault */}
          <div>
            <h3 className="font-medium">Fund Vault</h3>
            <div className="flex gap-2">
              <input
                type="number"
                value={fundAmount}
                onChange={(e) => setFundAmount(e.target.value)}
                placeholder="Amount in MCS"
                className="flex-1 px-3 py-2 border rounded"
                step="0.001"
                min="0"
              />
              <button
                onClick={handleFundVault}
                disabled={isFunding || !fundAmount}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
              >
                {isFunding ? 'Funding...' : 'Fund Vault'}
              </button>
            </div>
          </div>

          {/* Emergency Withdraw */}
          <div>
            <h3 className="font-medium">Emergency Withdraw</h3>
            <button
              onClick={handleEmergencyWithdraw}
              disabled={isEmergencyWithdrawing}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              {isEmergencyWithdrawing ? 'Withdrawing...' : 'Emergency Withdraw'}
            </button>
          </div>

          {/* Transfer Ownership */}
          <div>
            <h3 className="font-medium">Transfer Ownership</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="New owner address"
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleTransferOwnership}
                disabled={isTransferring || !newOwner}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
              >
                {isTransferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">Deposit Events</h2>
          <button
            onClick={clearEvents}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear Events
          </button>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {allDepositEvents.length === 0 ? (
            <p className="text-gray-500">No events yet</p>
          ) : (
            <div className="space-y-2">
              {allDepositEvents.map((event, index) => (
                <div key={index} className="bg-white p-2 rounded text-sm">
                  <p><strong>Player:</strong> {event.player}</p>
                  <p><strong>Amount:</strong> {event.amount.toString()} wei</p>
                  <p><strong>Timestamp:</strong> {new Date(Number(event.timestamp) * 1000).toLocaleString()}</p>
                  <p><strong>Tx Hash:</strong> {event.transactionHash}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Player Events */}
      <div className="bg-blue-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">Your Deposit Events</h2>
        <div className="max-h-60 overflow-y-auto">
          {playerEvents.length === 0 ? (
            <p className="text-gray-500">No events yet</p>
          ) : (
            <div className="space-y-2">
              {playerEvents.map((event, index) => (
                <div key={index} className="bg-white p-2 rounded text-sm">
                  <p><strong>Amount:</strong> {event.amount.toString()} wei</p>
                  <p><strong>Timestamp:</strong> {new Date(Number(event.timestamp) * 1000).toLocaleString()}</p>
                  <p><strong>Tx Hash:</strong> {event.transactionHash}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
