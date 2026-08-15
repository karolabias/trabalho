"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ExecutionDock from "@/components/ExecutionDock";
import PerformanceAnalytics from "@/components/PerformanceAnalytics";

interface Trade {
  id: string | number;
  pair: string;
  type: "BUY" | "SELL";
  lot: number;
  pnl: number;
  date: string;
  rr: string;
  emotion: string;
  execution: "Perfect" | "Good" | "FOMO" | "Revenge";
  notes?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("terminal");
  const [trades, setTrades] = useState<Trade[]>([]);
  const [utcTime, setUtcTime] = useState<string>("");
  const [activeSession, setActiveSession] = useState<string>("Closed");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // Saldo Inicial Dinâmico (forçado a número)
  const [initialBalance, setInitialBalance] = useState<number>(2500);

  // Filtros
  const [filterAsset, setFilterAsset] = useState<string>("ALL");

  // Marcar quando o componente monta no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Relógio UTC e Sessão
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25));
      const hours = now.getUTCHours();
      if (hours >= 0 && hours < 8) setActiveSession("🌅 Asia (Tokyo)");
      else if (hours >= 7 && hours < 16) setActiveSession("📈 London");
      else if (hours >= 13 && hours < 22) setActiveSession("🗽 New York");
      else setActiveSession("🌙 Inter-session");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Supabase Trades
  useEffect(() => {
    async function fetchTrades() {
      const { data, error } = await supabase.from('trades').select('*').order('created_at', { ascending: false });
      if (error) {
        console.error("Erro ao carregar trades:", error);
      }
      if (data) {
        setTrades(data.map((t: any) => ({
          id: t.id,
          pair: t.asset || t.pair || "XAU/USD",
          type: t.type || "BUY",
          lot: Number(t.lots ?? t.lot ?? 1),
          pnl: Number(t.net_pnl ?? t.pnl ?? 0),
          date: t.created_at?.split('T')[0] || "2026-08-15",
          rr: String(t.risk_reward || t.rr || "1:2"),
          emotion: t.emotion || "Disciplined",
          execution: t.execution || "Perfect",
          notes: t.notes || ""
        })));
      }
    }
    fetchTrades();
  }, []);

  // Métricas Financeiras seguras
  const totalPnl = trades.reduce((acc, t) => acc + t.pnl, 0);
  const parsedInitial = Number(initialBalance) || 2500;
  const currentBalance = parsedInitial + totalPnl;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : "0.0";
  
  const totalGains = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? "Infinite" : "0.00";
  const expectancy = trades.length > 0 ? (totalPnl / trades.length).toFixed(2) : "0.00";

  // Risco & Compliance
  const maxDailyLossLimit = parsedInitial * 0.05;
  const currentDrawdown = totalPnl < 0 ? Math.abs(totalPnl) : 0;
  const drawdownPercentage = maxDailyLossLimit > 0 ? (currentDrawdown / maxDailyLossLimit) * 100 : 0;
  const isKillSwitchActive = currentDrawdown >= maxDailyLossLimit;
  const isWarningZone = drawdownPercentage >= 80 && !isKillSwitchActive;

  const filteredTrades = trades.filter(t => filterAsset === "ALL" || t.pair === filterAsset);

  let runningBalance = parsedInitial;
  const equityCurveData = trades.slice().reverse().map(t => {
    runningBalance += t.pnl;
    return { id: t.id, balance: runningBalance, pnl: t.pnl, date: t.date };
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans">
      {/* MENU LATERAL COM OS 7 PAINÉIS */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between hidden md:flex">
        <nav className="flex flex-col gap-1.5 overflow-y-auto">
          <div className="text-xs font-extrabold tracking-widest text-slate-100 uppercase mb-4 flex items-center gap-2 px-2">
            <span>🪙</span> XAU/USD TERMINAL
          </div>
          
          <button onClick={() => setActiveTab("terminal")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "terminal" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>📊</span> 1. Terminal Principal
          </button>
          
          <button onClick={() => setActiveTab("analytics")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "analytics" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>📈</span> 2. Painel Analítico SMC
          </button>

          <button onClick={() => setActiveTab("equity")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "equity" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>📉</span> 3. Curva de Capital
          </button>

          <button onClick={() => setActiveTab("risk")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "risk" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>🛡️</span> 4. Risco & Compliance
          </button>

          <button onClick={() => setActiveTab("market")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "market" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>🌐</span> 5. Market Pulse
          </button>

          <button onClick={() => setActiveTab("audit")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "audit" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>📁</span> 6. Diário de Auditoria
          </button>

          <button onClick={() => setActiveTab("add")} className={`px-3 py-2.5 rounded-xl text-xs text-left transition flex items-center gap-2.5 ${activeTab === "add" ? "bg-sky-600 text-white shadow-lg font-semibold" : "text-slate-400 hover:bg-slate-800"}`}>
            <span>➕</span> 7. Registar Operação
          </button>
        </nav>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs mt-4">
          <p className="text-slate-500 uppercase font-semibold text-[10px]">Cloud Sync</p>
          <p className="text-emerald-400 font-bold mt-1 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> ☁️ Supabase Connected
          </p>
        </div>
      </aside>

      <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
        <header className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs shadow-xl">
          <div className="flex items-center gap-4">
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg font-mono text-sky-400 flex items-center gap-2">
              <span>🕒</span> UTC: {isMounted ? (utcTime || "00:00:00") : "00:00:00"}
            </div>
            <div className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <span className="text-slate-400">Sessão:</span>
              <span className="font-bold text-emerald-400">{activeSession}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">Ativo Principal: <strong className="text-white">🥇 XAU/USD</strong></span>
            <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-lg font-bold flex items-center gap-1">
              <span>🟢</span> STATUS: OPERACIONAL
            </span>
          </div>
        </header>

        {/* 1. TERMINAL PRINCIPAL */}
        {activeTab === "terminal" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Win Rate</p>
                <p className="text-xl font-bold text-emerald-400 mt-1">{winRate}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">PnL Líquido</p>
                <p className={`text-xl font-bold mt-1 ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Profit Factor</p>
                <p className="text-xl font-bold text-sky-400 mt-1">{profitFactor}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Expectativa</p>
                <p className="text-xl font-bold text-amber-400 mt-1">${expectancy}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Inicial</p>
                  <input 
                    type="number" 
                    value={initialBalance} 
                    onChange={(e) => setInitialBalance(e.target.value === "" ? 0 : Number(e.target.value))}
                    className="w-20 bg-slate-950 border border-slate-700 text-sky-400 font-bold text-right px-1.5 py-0.5 rounded text-xs focus:outline-none"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Saldo Atual</p>
                  <p className="text-lg font-bold text-slate-100 mt-0.5">
                    {isMounted ? `$${currentBalance.toLocaleString()}` : `$${currentBalance}`}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-slate-400 text-xs shadow-xl space-y-2">
              <p className="text-sm font-bold text-slate-200">Terminal Principal Ativo</p>
              <p>Usa o menu lateral para alternar entre as 7 secções dedicadas e manter o teu espaço de trabalho limpo.</p>
            </div>
          </div>
        )}

        {/* 2. PAINEL ANALÍTICO SMC */}
        {activeTab === "analytics" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold uppercase text-slate-300">📈 Painel Analítico & Auditoria SMC</h2>
            <PerformanceAnalytics />
          </div>
        )}

        {/* 3. CURVA DE CAPITAL */}
        {activeTab === "equity" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 uppercase text-sm">📉 Curva de Capital (Equity Curve)</h3>
              <span className="text-slate-400">Base Inicial: ${parsedInitial}</span>
            </div>
            <div className="h-48 flex items-end gap-2 pt-6 bg-slate-950 px-6 rounded-lg border border-slate-800 overflow-x-auto">
              {equityCurveData.length > 0 ? equityCurveData.map((item, idx) => {
                const heightPercent = Math.min(Math.max((item.balance / (parsedInitial * 1.2)) * 100, 10), 100);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative h-full justify-end">
                    <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition">${item.balance.toFixed(0)}</span>
                    <div style={{ height: `${heightPercent}%` }} className={`w-full rounded-t ${item.pnl >= 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                    <span className="text-[9px] text-slate-500">{item.date.slice(5)}</span>
                  </div>
                );
              }) : <p className="text-slate-500 m-auto">Sem dados de capital registados.</p>}
            </div>
          </div>
        )}

        {/* 4. RISCO & COMPLIANCE */}
        {activeTab === "risk" && (
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-sm font-bold uppercase text-slate-300">🛡️ Gestão de Risco & Compliance</h2>
            <div className={`border rounded-xl p-6 shadow-xl space-y-4 ${isKillSwitchActive ? "bg-red-950/40 border-red-800" : isWarningZone ? "bg-amber-950/30 border-amber-800" : "bg-slate-900 border-slate-800"}`}>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-100 uppercase">Estado da Conta</span>
                <span className={`px-3 py-1 rounded font-bold ${isKillSwitchActive ? "bg-red-900 text-white" : isWarningZone ? "bg-amber-800 text-white" : "bg-emerald-950 text-emerald-400"}`}>
                  {isKillSwitchActive ? "KILL-SWITCH ATIVO" : isWarningZone ? "ZONA DE PERIGO" : "SEGURO"}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Max Daily Loss Limit:</span>
                  <p className="text-white font-bold mt-1 text-sm">${maxDailyLossLimit.toFixed(2)}</p>
                </div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Drawdown Atual:</span>
                  <p className={`font-bold mt-1 text-sm ${currentDrawdown > 0 ? "text-red-400" : "text-emerald-400"}`}>${currentDrawdown.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MARKET PULSE */}
        {activeTab === "market" && (
          <div className="max-w-xl mx-auto space-y-4">
            <h2 className="text-sm font-bold uppercase text-slate-300">🌐 Market Pulse & Ativos</h2>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><span className="text-slate-400 text-[10px]">XAU/USD</span><p className="text-emerald-400 font-bold mt-1 text-sm">Live</p></div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><span className="text-slate-400 text-[10px]">DXY</span><p className="text-sky-400 font-bold mt-1 text-sm">Correlated</p></div>
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-800"><span className="text-slate-400 text-[10px]">Volatility</span><p className="text-amber-400 font-bold mt-1 text-sm">Normal</p></div>
              </div>
            </div>
          </div>
        )}

        {/* 6. DIÁRIO DE AUDITORIA */}
        {activeTab === "audit" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 text-xs">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-100 uppercase text-sm">📁 Diário de Auditoria ({filteredTrades.length})</h3>
              <select value={filterAsset} onChange={(e) => setFilterAsset(e.target.value)} className="bg-slate-950 text-sky-400 font-bold p-1.5 rounded border border-slate-800">
                <option value="ALL">Todos os Pares</option>
                <option value="XAU/USD">XAU/USD</option>
                <option value="EUR/USD">EUR/USD</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredTrades.map(t => (
                <div key={t.id} className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className={`px-2 py-0.5 rounded font-bold mr-2 ${t.type === "BUY" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>{t.type}</span>
                      <span className="font-bold text-white">{t.pair}</span> ({t.lot} lot) — RR: {t.rr}
                    </div>
                    <span className={`font-bold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}</span>
                  </div>
                  {t.notes && <div className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800/60 font-mono">{t.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. REGISTAR OPERAÇÃO */}
        {activeTab === "add" && (
          <div className="max-w-4xl mx-auto space-y-4">
            <h2 className="text-sm font-bold uppercase text-slate-300">➕ Registar Operação & Validação SMC</h2>
            <ExecutionDock />
          </div>
        )}
      </main>
    </div>
  );
}