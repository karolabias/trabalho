"use client";

import { useState, useEffect } from "react";
import { createClient } from '@supabase/supabase-js';
import ExecutionDock from "@/components/ExecutionDock";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

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
  time: string;
}

interface MissedTrade {
  id: number;
  pair: string;
  reason: string;
  date: string;
}

interface DayNote {
  note: string;
  experience: string;
  image: string;
}

export default function Home() {
  const [activeSubTab, setActiveSubTab] = useState<"analytics" | "review" | "trades" | "missed" | "milestones">("review");
  const [activeTab, setActiveTab] = useState<"dashboard" | "add" | "calendar" | "smc">("dashboard");
  
  const [initialBalance, setInitialBalance] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trader_initial_balance");
      return saved ? parseFloat(saved) : 2500;
    }
    return 2500;
  });

  const [trades, setTrades] = useState<Trade[]>([]);

  const [missedTrades, setMissedTrades] = useState<MissedTrade[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trader_missed");
      return saved ? JSON.parse(saved) : [
        { id: 1, pair: "XAU/USD", reason: "Hesitei no CHoCH de 1H, o preço voou sem mim.", date: "2026-08-04" }
      ];
    }
    return [];
  });

  const [calendarNotes, setCalendarNotes] = useState<Record<string, DayNote>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("trader_calendar_notes");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isEditingBalance, setIsEditingBalance] = useState<boolean>(false);
  const [tempBalance, setTempBalance] = useState<string>(initialBalance.toString());

  // Form states para Missed Trade
  const [missedPair, setMissedPair] = useState("XAU/USD");
  const [missedReason, setMissedReason] = useState("");
  const [missedDate, setMissedDate] = useState("2026-08-01");

  const [currentNote, setCurrentNote] = useState("");
  const [currentExp, setCurrentExp] = useState("");
  const [currentImg, setCurrentImg] = useState("");

  // Buscar trades diretamente do Supabase
  useEffect(() => {
    async function fetchTrades() {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar trades do Supabase:', error);
      } else if (data) {
        const formattedTrades: Trade[] = data.map((t: any) => ({
          id: t.id,
          pair: t.asset || "XAU/USD",
          type: t.type || "BUY",
          lot: Number(t.lots || 1),
          pnl: Number(t.net_pnl ?? t.pnl ?? 0),
          date: t.created_at ? t.created_at.split('T')[0] : "2026-08-15",
          rr: String(t.risk_reward || "1:2"),
          emotion: t.emotion || "Disciplined",
          execution: t.execution || "Perfect",
          time: t.time || "08:00"
        }));
        setTrades(formattedTrades);
      }
    }

    fetchTrades();
  }, []);

  useEffect(() => {
    localStorage.setItem("trader_initial_balance", initialBalance.toString());
  }, [initialBalance]);

  useEffect(() => {
    localStorage.setItem("trader_missed", JSON.stringify(missedTrades));
  }, [missedTrades]);

  useEffect(() => {
    localStorage.setItem("trader_calendar_notes", JSON.stringify(calendarNotes));
  }, [calendarNotes]);

  useEffect(() => {
    if (selectedDate) {
      const noteData = calendarNotes[selectedDate];
      setCurrentNote(noteData?.note || "");
      setCurrentExp(noteData?.experience || "");
      setCurrentImg(noteData?.image || "");
    }
  }, [selectedDate, calendarNotes]);

  const totalPnl = trades.reduce((acc, t) => acc + (typeof t.pnl === "number" ? t.pnl : parseFloat(t.pnl) || 0), 0);
  const currentBalance = initialBalance + totalPnl;
  const winningTrades = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? ((winningTrades / trades.length) * 100).toFixed(1) : "0.0";
  
  const totalGains = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? (totalGains / totalLosses).toFixed(2) : totalGains > 0 ? "Infinite" : "0.00";
  const returnPercentage = ((totalPnl / initialBalance) * 100).toFixed(1);
  
  const expectancy = trades.length > 0 
    ? (totalPnl / trades.length).toFixed(2) 
    : "0.00";

  const handleAddMissed = (e: React.FormEvent) => {
    e.preventDefault();
    const missed: MissedTrade = {
      id: Date.now(),
      pair: missedPair,
      reason: missedReason,
      date: missedDate
    };
    setMissedTrades([missed, ...missedTrades]);
    setMissedReason("");
  };

  const handleSaveDayPage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    setCalendarNotes({
      ...calendarNotes,
      [selectedDate]: {
        note: currentNote,
        experience: currentExp,
        image: currentImg
      }
    });
    alert("Apontamentos guardados com sucesso!");
  };

  const handleDeleteTrade = async (id: string | number) => {
    if (confirm("Tens a certeza que pretendes apagar esta operação?")) {
      const { error } = await supabase.from('trades').delete().eq('id', id);
      if (error) {
        console.error("Erro ao apagar do Supabase:", error);
      } else {
        setTrades(trades.filter(t => t.id !== id));
      }
    }
  };

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Lateral */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-end gap-1 bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div className="w-1 h-4 bg-emerald-400 rounded-sm"></div>
              <div className="w-1 h-6 bg-sky-400 rounded-sm"></div>
            </div>
            <div>
              <h1 className="text-xs font-extrabold tracking-widest text-slate-100 uppercase">ALL DAY EVERY DAY</h1>
              <p className="text-[10px] text-emerald-400 tracking-wider uppercase font-semibold">Trading Journal</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <button 
              onClick={() => { setActiveTab("dashboard"); setActiveSubTab("review"); setSelectedDate(null); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === "dashboard" && activeSubTab === "review" ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
            >
              📊 Painel Geral
            </button>
            <button 
              onClick={() => { setActiveTab("calendar"); setActiveSubTab("review"); setSelectedDate(null); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === "calendar" ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
            >
              📅 Calendário & Diário
            </button>
            <button 
              onClick={() => { setActiveTab("add"); setSelectedDate(null); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === "add" ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
            >
              ➕ Registar Trade
            </button>
            <button 
              onClick={() => { setActiveTab("smc"); setSelectedDate(null); }}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-medium text-sm transition ${activeTab === "smc" ? "bg-sky-600 text-white shadow-lg shadow-sky-900/30" : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"}`}
            >
              🧠 Smart Money (SMC)
            </button>
          </nav>
        </div>

        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
          <p className="text-[11px] text-slate-500 uppercase font-semibold">Ativo Principal</p>
          <p className="text-xs font-bold text-emerald-400 mt-1">XAU/USD (Gold)</p>
        </div>
      </aside>

      {/* Área Principal */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-xl font-extrabold tracking-wide text-slate-100 uppercase">
              ALL DAY EVERY DAY <span className="text-emerald-400 font-normal text-xs ml-2">// EXECUTION SYSTEM</span>
            </h1>
            <p className="text-slate-400 text-xs mt-0.5">Gestão institucional e controlo de performance</p>
          </div>
          <button 
            onClick={() => { setActiveTab("add"); setSelectedDate(null); }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-medium transition shadow-lg shadow-emerald-950"
          >
            + New Trade
          </button>
        </header>

        {/* SECÇÃO DE ADICIONAR TRADE COM O EXECUTION DOCK */}
        {activeTab === "add" && (
          <div className="max-w-4xl mx-auto mb-6">
            <ExecutionDock />
          </div>
        )}

        {/* SECÇÃO SMC (Smart Money Concepts) */}
        {activeTab === "smc" && (
          <div className="max-w-3xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-bold text-sky-400 uppercase">🧠 Smart Money Concepts (SMC) & Regras</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Guia operativo institucional para XAU/USD. Foco absoluto em Liquidity Sweeps, Order Blocks (OB), Fair Value Gaps (FVG) e Change of Character (CHoCH).
            </p>
            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
              <p className="text-emerald-400 font-bold">1. Confirmação de Estrutura:</p>
              <p className="text-slate-300">Nunca entrar sem ver um CHoCH claro em timeframe de 15m ou 1h apoiado por mitigação de FVG diário ou de 4H.</p>
              <p className="text-amber-400 font-bold pt-2">2. Controlo Emocional:</p>
              <p className="text-slate-300">Execuções marcadas como FOMO ou Revenge resultam imediatamente em corte de lote na sessão seguinte.</p>
            </div>
          </div>
        )}

        {/* BARRA DE ABAS SUPERIOR */}
        {activeTab === "dashboard" && (
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 border-b border-slate-800/60 text-xs">
            <button 
              onClick={() => { setActiveSubTab("review"); setSelectedDate(null); }}
              className={`px-3 py-1.5 rounded-lg font-medium transition border ${activeSubTab === "review" ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}`}
            >
              📊 Review & Dashboard
            </button>
            <button 
              onClick={() => setActiveSubTab("analytics")}
              className={`px-3 py-1.5 rounded-lg font-medium transition border ${activeSubTab === "analytics" ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}`}
            >
              📈 Analytics
            </button>
            <button 
              onClick={() => setActiveSubTab("trades")}
              className={`px-3 py-1.5 rounded-lg font-medium transition border ${activeSubTab === "trades" ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}`}
            >
              📁 Trades DB ({trades.length})
            </button>
            <button 
              onClick={() => setActiveSubTab("missed")}
              className={`px-3 py-1.5 rounded-lg font-medium transition border ${activeSubTab === "missed" ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}`}
            >
              ⚠️ Missed Trades DB ({missedTrades.length})
            </button>
            <button 
              onClick={() => setActiveSubTab("milestones")}
              className={`px-3 py-1.5 rounded-lg font-medium transition border ${activeSubTab === "milestones" ? "bg-slate-800 text-sky-400 border-slate-700" : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"}`}
            >
              🏆 Milestones
            </button>
          </div>
        )}

        {/* SECÇÃO CALENDAR & DIÁRIO */}
        {(activeTab === "calendar" || selectedDate) && !selectedDate && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h2 className="text-sm font-bold text-slate-100">📅 August - 2026 (Calendário & Diário)</h2>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-slate-400">P/L: <strong className={totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}>{totalPnl >= 0 ? `+$${totalPnl}` : `-$${Math.abs(totalPnl)}`}</strong></span>
                <span className="text-slate-400">Trades: <strong className="text-slate-200">{trades.length}</strong></span>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={`empty-${i}`} className="bg-slate-950/20 border border-slate-900 rounded-lg min-h-[100px] opacity-30"></div>
              ))}

              {Array.from({ length: 31 }, (_, i) => {
                const dayNum = i + 1;
                const dayStr = `2026-08-${dayNum < 10 ? "0" + dayNum : dayNum}`;
                const dayTrades = trades.filter(t => t.date === dayStr);
                const hasNote = calendarNotes[dayStr]?.note;

                return (
                  <div 
                    key={dayStr}
                    onClick={() => setSelectedDate(dayStr)}
                    className="bg-slate-950 border border-slate-800 hover:border-sky-500 rounded-lg p-2 flex flex-col justify-between cursor-pointer transition min-h-[100px] group hover:bg-sky-950/10"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-sky-400">{dayNum}</span>
                      {hasNote && <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>}
                    </div>

                    <div className="flex flex-col gap-1 my-1 overflow-y-auto max-h-[60px]">
                      {dayTrades.map(t => {
                        const pnlVal = typeof t.pnl === "number" ? t.pnl : parseFloat(t.pnl) || 0;
                        const isWin = pnlVal >= 0;
                        return (
                          <div key={t.id} className={`text-[9px] p-1 rounded font-semibold border flex justify-between ${isWin ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60" : "bg-red-950/60 text-red-300 border-red-800/60"}`}>
                            <span>{t.pair}</span>
                            <span>{isWin ? `+$${pnlVal}` : `-$${Math.abs(pnlVal)}`}</span>
                          </div>
                        );
                      })}
                    </div>

                    {dayTrades.length === 0 && <div className="text-[9px] text-slate-700 italic text-center my-auto">-</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PÁGINA DO DIA */}
        {selectedDate && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-lg">
              <button onClick={() => setSelectedDate(null)} className="text-xs font-bold bg-slate-950 hover:bg-slate-800 text-sky-400 px-4 py-2 rounded-lg border border-slate-700 transition">
                ← Back to Calendar View
              </button>
              <span className="text-xs text-slate-400">Selected Date: <strong className="text-white">{selectedDate}</strong></span>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-emerald-400 mb-4 uppercase">Trades on {selectedDate}</h3>
              {trades.filter(t => t.date === selectedDate).length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">No trades recorded for this date.</p>
              ) : (
                <div className="space-y-2">
                  {trades.filter(t => t.date === selectedDate).map(t => (
                    <div key={t.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-0.5 rounded font-bold ${t.type === "BUY" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>{t.type}</span>
                        <span>{t.pair} ({t.lot} lots) - RR: {t.rr} | Emotion: {t.emotion}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`font-bold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>{t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}</span>
                        <button onClick={() => handleDeleteTrade(t.id)} className="text-red-400 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-sky-400 mb-4 uppercase">Daily Review & Notes</h3>
              <form onSubmit={handleSaveDayPage} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Technical Notes / Setup</label>
                    <textarea rows={3} value={currentNote} onChange={(e) => setCurrentNote(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white" placeholder="CHoCH, FVG..." />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 block mb-1">Psychology / Experience</label>
                    <textarea rows={3} value={currentExp} onChange={(e) => setCurrentExp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white" placeholder="Patience, Discipline..." />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Chart Image URL</label>
                  <input type="text" value={currentImg} onChange={(e) => setCurrentImg(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white" placeholder="Paste link..." />
                </div>
                <button type="submit" className="bg-sky-600 hover:bg-sky-500 text-white text-xs px-4 py-2.5 rounded-lg font-bold">Save Daily Review</button>
              </form>
            </div>
          </div>
        )}

        {/* SUB-ABA: REVIEW & DASHBOARD */}
        {activeSubTab === "review" && activeTab === "dashboard" && !selectedDate && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Win Rate</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">{winRate}%</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Total P&L</span>
                <p className={`text-xl font-bold mt-1 ${totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {totalPnl >= 0 ? `+$${totalPnl.toFixed(0)}` : `-$${Math.abs(totalPnl).toFixed(0)}`}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Returns</span>
                <p className={`text-xl font-bold mt-1 ${parseFloat(returnPercentage) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {returnPercentage}%
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Profit Factor</span>
                <p className="text-xl font-bold text-sky-400 mt-1">{profitFactor}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl col-span-2 md:col-span-1 flex flex-col justify-between">
                <span className="text-slate-400 text-[10px] uppercase font-semibold">Account Balance</span>
                <div className="flex items-baseline justify-between">
                  <p className="text-lg font-bold text-slate-100">${currentBalance.toLocaleString()}</p>
                  <button onClick={() => setIsEditingBalance(!isEditingBalance)} className="text-[10px] text-sky-400 hover:underline">Edit</button>
                </div>
                {isEditingBalance && (
                  <div className="mt-2 flex gap-1">
                    <input type="number" value={tempBalance} onChange={(e) => setTempBalance(e.target.value)} className="bg-slate-950 text-xs px-2 py-1 rounded w-full text-white border border-slate-700" />
                    <button onClick={() => { setInitialBalance(parseFloat(tempBalance) || 2500); setIsEditingBalance(false); }} className="bg-sky-600 text-xs px-2 py-1 rounded">Save</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-100">📊 Visão Geral de Execução (XAU/USD)</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Painel otimizado para rastreio de performance de Smart Money Concepts sob o padrão All Day Every Day.
              </p>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setActiveSubTab("trades")} className="bg-slate-800 hover:bg-slate-700 text-sky-400 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 transition">
                  Ver Trades DB ({trades.length})
                </button>
                <button onClick={() => setActiveSubTab("analytics")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 px-4 py-2 rounded-lg text-xs font-bold border border-slate-700 transition">
                  Ver Analytics
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA: ANALYTICS */}
        {activeSubTab === "analytics" && activeTab === "dashboard" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Expectativa por Trade</span>
                  <p className="text-2xl font-bold text-sky-400 mt-1">${expectancy}</p>
                  <p className="text-[10px] text-slate-500 mt-1">Quanto ganhas em média por cada operação.</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Win Rate</span>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">{winRate}%</p>
                </div>
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl">
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Profit Factor</span>
                  <p className="text-2xl font-bold text-amber-400 mt-1">{profitFactor}</p>
                </div>
              </div>

              {/* Grelha de análise de Execução */}
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-xl">
                <h3 className="text-xs font-bold text-slate-300 uppercase mb-4">Qualidade de Execução</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(["Perfect", "Good", "FOMO", "Revenge"] as const).map((type) => (
                    <div key={type} className="text-center p-4 bg-slate-900 border border-slate-800 rounded-lg">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">{type}</p>
                      <p className="text-xl font-bold text-white mt-1">
                        {trades.filter(t => t.execution === type).length}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SUB-ABA: TRADES DB */}
        {activeSubTab === "trades" && activeTab === "dashboard" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-5xl mx-auto">
            <h2 className="text-sm font-bold text-slate-100 uppercase">📁 Base de Dados de Trades Registados</h2>
            <div className="space-y-2">
              {trades.map(t => (
                <div key={t.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg flex justify-between items-center text-xs">
                  <div>
                    <span className={`px-2 py-0.5 rounded font-bold mr-2 ${t.type === "BUY" ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"}`}>{t.type}</span>
                    <span className="font-bold text-white">{t.pair}</span> ({t.lot} lots) — RR: {t.rr} | Emoção: {t.emotion} | Data: {t.date}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`font-bold ${t.pnl >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {t.pnl >= 0 ? `+$${t.pnl}` : `-$${Math.abs(t.pnl)}`}
                    </span>
                    <button onClick={() => handleDeleteTrade(t.id)} className="text-red-400 hover:text-red-300">Apagar</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-ABA: MISSED TRADES DB */}
        {activeSubTab === "missed" && activeTab === "dashboard" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-5xl mx-auto">
            <h2 className="text-sm font-bold text-slate-100 uppercase">⚠️ Registo de Oportunidades Perdidas (Missed Trades)</h2>
            <form onSubmit={handleAddMissed} className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 text-xs">
              <input type="text" value={missedPair} onChange={(e) => setMissedPair(e.target.value)} placeholder="Par" className="bg-slate-950 border border-slate-800 rounded p-2 text-white" />
              <input type="text" value={missedReason} onChange={(e) => setMissedReason(e.target.value)} placeholder="Motivo / Razão (ex: Hesitação)" className="bg-slate-950 border border-slate-800 rounded p-2 text-white md:col-span-2" />
              <button type="submit" className="bg-sky-600 hover:bg-sky-500 font-bold text-white rounded p-2">Adicionar Missed Trade</button>
            </form>
            <div className="space-y-2 pt-4">
              {missedTrades.map(m => (
                <div key={m.id} className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-amber-400 mr-2">[{m.pair}]</span>
                    <span className="text-slate-300">{m.reason}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{m.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-ABA: MILESTONES */}
        {activeSubTab === "milestones" && activeTab === "dashboard" && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-4 max-w-5xl mx-auto">
            <h2 className="text-sm font-bold text-slate-100 uppercase">🏆 Milestones & Metas de Trading</h2>
            <p className="text-xs text-slate-400">Objetivos institucionais alcançados e metas futuras de consistência e gestão de risco.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl border-emerald-800/60">
                <p className="font-bold text-emerald-400 uppercase">Meta 1: 10 Trades Disciplinados</p>
                <p className="text-slate-400 mt-1">Concluído com foco estrito em SMC e gestão de lote.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl border-sky-800/60">
                <p className="font-bold text-sky-400 uppercase">Meta 2: Zero Revenge Trading</p>
                <p className="text-slate-400 mt-1">Manter o plano de contingência ativo após dias de drawdown.</p>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl border-slate-800">
                <p className="font-bold text-slate-300 uppercase">Meta 3: Crescimento Composto</p>
                <p className="text-slate-400 mt-1">Alcançar 20% de retorno acumulado no mês de agosto.</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}