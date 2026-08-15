'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface Trade {
  id: number
  net_pnl: number
  risk_reward: number
  notes?: string
}

export default function PerformanceAnalytics() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalyticsData() {
      const { data, error } = await supabase.from('trades').select('*')
      if (!error && data) {
        setTrades(data)
      }
      setLoading(false)
    }
    fetchAnalyticsData()
  }, [])

  if (loading) {
    return <div className="text-xs font-mono text-gray-500 p-4">A carregar métricas de performance...</div>
  }

  // Cálculos analíticos
  const totalTrades = trades.length
  const winningTrades = trades.filter(t => t.net_pnl > 0).length
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : '0'

  // Auditoria da Checklist SMC guardada nas notas
  const ob4hWins = trades.filter(t => t.notes?.includes('OB 4H: ✔') && t.net_pnl > 0).length
  const ob4hTotal = trades.filter(t => t.notes?.includes('OB 4H:')).length
  const ob4hWinRate = ob4hTotal > 0 ? ((ob4hWins / ob4hTotal) * 100).toFixed(0) : '0'

  const sweepWins = trades.filter(t => t.notes?.includes('Liq Sweep: ✔') && t.net_pnl > 0).length
  const sweepTotal = trades.filter(t => t.notes?.includes('Liq Sweep:')).length
  const sweepWinRate = sweepTotal > 0 ? ((sweepWins / sweepTotal) * 100).toFixed(0) : '0'

  return (
    <div className="bg-[#121318] border border-[#232530] p-5 rounded-xl text-xs font-mono space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[#e1e1e6] font-bold text-sm tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          [Painel Analítico] Auditoria de Setup & SMC Edge
        </h3>
        <span className="text-gray-400">Total Auditado: {totalTrades} Operações</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Bloco Geral */}
        <div className="bg-[#1a1b23] border border-[#2b2d3c] p-4 rounded-lg space-y-2">
          <div className="text-gray-400 uppercase tracking-wide text-[10px]">Win Rate Global</div>
          <div className="text-2xl font-bold text-emerald-400">{winRate}%</div>
          <div className="text-[11px] text-gray-500">{winningTrades} vencedoras de {totalTrades} trades</div>
        </div>

        {/* Bloco OB 4H */}
        <div className="bg-[#1a1b23] border border-[#2b2d3c] p-4 rounded-lg space-y-2">
          <div className="text-gray-400 uppercase tracking-wide text-[10px]">Edge: Order Block 4H</div>
          <div className="text-2xl font-bold text-sky-400">{ob4hWinRate}%</div>
          <div className="text-[11px] text-gray-500">Baseado em {ob4hTotal} execuções validadas</div>
        </div>

        {/* Bloco Liquidity Sweep */}
        <div className="bg-[#1a1b23] border border-[#2b2d3c] p-4 rounded-lg space-y-2">
          <div className="text-gray-400 uppercase tracking-wide text-[10px]">Edge: Liquidity Sweep</div>
          <div className="text-2xl font-bold text-amber-400">{sweepWinRate}%</div>
          <div className="text-[11px] text-gray-500">Baseado em {sweepTotal} execuções validadas</div>
        </div>
      </div>
    </div>
  )
}