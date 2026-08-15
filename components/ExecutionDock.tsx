'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function ExecutionDock() {
  const [asset, setAsset] = useState('XAU/USD')
  const [type, setType] = useState('BUY')
  const [lots, setLots] = useState('')
  const [pnl, setPnl] = useState('')
  const [rr, setRr] = useState('')
  const [session, setSession] = useState('London')
  const [confluence, setConfluence] = useState('Order Block')
  const [emotion, setEmotion] = useState('Disciplined')
  
  // Checklist SMC State
  const [checklist, setChecklist] = useState({
    ob4h: false,
    liquiditySweep: false,
    fvgMitigation: false,
    dxyAligned: false,
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.from('trades').insert([
      {
        asset,
        type,
        lots: parseFloat(lots),
        net_pnl: parseFloat(pnl),
        risk_reward: parseFloat(rr),
        session,
        confluence,
        emotion,
        // Guardamos também o estado da checklist numa string ou metadados
        notes: `SMC Checklist -> OB 4H: ${checklist.ob4h ? '✔' : '✘'} | Liq Sweep: ${checklist.liquiditySweep ? '✔' : '✘'} | FVG: ${checklist.fvgMitigation ? '✔' : '✘'} | DXY: ${checklist.dxyAligned ? '✔' : '✘'}`,
      },
    ])

    setLoading(false)

    if (error) {
      setMessage('Erro ao gravar trade: ' + error.message)
    } else {
      setMessage('Trade registado com sucesso!')
      setLots('')
      setPnl('')
      setRr('')
      setChecklist({ ob4h: false, liquiditySweep: false, fvgMitigation: false, dxyAligned: false })
    }
  }

  return (
    <div className="bg-[#121318] border border-[#232530] p-5 rounded-xl text-xs font-mono space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-[#e1e1e6] font-bold text-sm tracking-wider uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          [Painel 3] Execution Dock & SMC Checklist
        </h3>
        {message && (
          <span className={`px-2.5 py-1 rounded font-bold ${message.includes('Erro') ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {message}
          </span>
        )}
      </div>

      {/* SMC Checklist Interativa */}
      <div className="bg-[#1a1b23] border border-[#2b2d3c] p-3 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input 
            type="checkbox" 
            checked={checklist.ob4h} 
            onChange={(e) => setChecklist({...checklist, ob4h: e.target.checked})}
            className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>OB 4H Aligned</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input 
            type="checkbox" 
            checked={checklist.liquiditySweep} 
            onChange={(e) => setChecklist({...checklist, liquiditySweep: e.target.checked})}
            className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>Liquidity Sweep</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input 
            type="checkbox" 
            checked={checklist.fvgMitigation} 
            onChange={(e) => setChecklist({...checklist, fvgMitigation: e.target.checked})}
            className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>FVG Mitigation</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-slate-300">
          <input 
            type="checkbox" 
            checked={checklist.dxyAligned} 
            onChange={(e) => setChecklist({...checklist, dxyAligned: e.target.checked})}
            className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0"
          />
          <span>DXY Correlated</span>
        </label>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-8 gap-3">
        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">Ativo</label>
          <input
            type="text"
            value={asset}
            onChange={(e) => setAsset(e.target.value)}
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white font-bold"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">Direção</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white font-bold"
          >
            <option value="BUY">BUY 🟢</option>
            <option value="SELL">SELL 🔴</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">Lotes</label>
          <input
            type="number"
            step="0.01"
            placeholder="1.00"
            value={lots}
            onChange={(e) => setLots(e.target.value)}
            required
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">PnL Líquido ($)</label>
          <input
            type="number"
            step="0.01"
            placeholder="150.00"
            value={pnl}
            onChange={(e) => setPnl(e.target.value)}
            required
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">R Rácio (R)</label>
          <input
            type="number"
            step="0.1"
            placeholder="3.0"
            value={rr}
            onChange={(e) => setRr(e.target.value)}
            required
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          />
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">Sessão</label>
          <select
            value={session}
            onChange={(e) => setSession(e.target.value)}
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          >
            <option value="Asia">Ásia</option>
            <option value="London">Londres</option>
            <option value="New York">Nova Iorque</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">SMC Tag</label>
          <select
            value={confluence}
            onChange={(e) => setConfluence(e.target.value)}
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          >
            <option value="Order Block">Order Block</option>
            <option value="Liquidity Sweep">Liquidity Sweep</option>
            <option value="FVG / Imbalance">FVG / Imbalance</option>
            <option value="Breaker Block">Breaker Block</option>
          </select>
        </div>

        <div className="col-span-2 md:col-span-1">
          <label className="block text-gray-400 mb-1">Estado Emocional</label>
          <select
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="w-full bg-[#1a1b23] border border-[#2b2d3c] rounded p-2 text-white"
          >
            <option value="Disciplined">Disciplinado 🧠</option>
            <option value="FOMO">FOMO ⚠️</option>
            <option value="Revenge">Revenge 🛑</option>
            <option value="Impatience">Impaciência ⏳</option>
          </select>
        </div>

        <div className="col-span-8 mt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded transition-colors uppercase tracking-wider"
          >
            {loading ? 'A Registar na Nuvem...' : 'Executar & Guardar Trade com Validação SMC'}
          </button>
        </div>
      </form>
    </div>
  )
}