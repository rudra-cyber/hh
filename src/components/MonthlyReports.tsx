import React, { useState } from "react";
import { Trade } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { 
  Calendar, TrendingUp, TrendingDown, BookOpen, Clock, AlertTriangle, 
  Sparkles, Layers, DollarSign, Target, Award, PieChart, ChevronDown, ChevronUp, FileText
} from "lucide-react";

interface MonthlyReportsProps {
  trades: Trade[];
  styles: any;
  activeTheme: "midnight" | "emerald" | "neon" | "light";
}

interface MonthlyGroup {
  monthKey: string;      // e.g. "2026-06"
  year: number;
  monthIndex: number;    // 0-11
  monthName: string;     // e.g. "June"
  trades: Trade[];
  totalProfit: number;
  winRate: number;
  wins: number;
  losses: number;
  avgRR: number;
  lotSum: number;
  popularTags: { tag: string; count: number; profit: number; winRate: number }[];
  frequentMistakes: { mistake: string; count: number }[];
}

export default function MonthlyReports({ trades, styles, activeTheme }: MonthlyReportsProps) {
  const [selectedMonthKey, setSelectedMonthKey] = useState<string | null>(null);

  // Group trades by month
  const monthlyGroups = React.useMemo(() => {
    const groups: { [key: string]: Trade[] } = {};
    
    trades.forEach(t => {
      let dateObj = new Date(t.time);
      if (isNaN(dateObj.getTime()) && t.date) {
        dateObj = new Date(t.date + "T00:00:00");
      }
      if (isNaN(dateObj.getTime())) return;

      const year = dateObj.getFullYear();
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const key = `${year}-${month}`;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(t);
    });

    const list: MonthlyGroup[] = Object.keys(groups).map(key => {
      const [yearStr, monthStr] = key.split("-");
      const year = parseInt(yearStr);
      const monthIndex = parseInt(monthStr) - 1;
      const monthTrades = groups[key];
      const monthName = new Date(year, monthIndex).toLocaleString("default", { month: "long" });

      // Financials
      let wins = 0;
      let losses = 0;
      let totalProfit = 0;
      let rrSum = 0;
      let lotSum = 0;

      // Extract tags performance for this month
      const tagMap: { [key: string]: { count: number; profit: number; wins: number } } = {};
      const mistakeMap: { [key: string]: number } = {};

      monthTrades.forEach(t => {
        totalProfit += t.profit;
        if (t.profit > 0) {
          wins++;
        } else if (t.profit < 0) {
          losses++;
        }
        rrSum += t.riskReward || 0;
        lotSum += t.lotSize || 0;

        // Tags statistics
        if (t.tags && t.tags.length > 0) {
          t.tags.forEach(tag => {
            if (!tagMap[tag]) {
              tagMap[tag] = { count: 0, profit: 0, wins: 0 };
            }
            tagMap[tag].count++;
            tagMap[tag].profit += t.profit;
            if (t.profit > 0) tagMap[tag].wins++;
          });
        }

        // Mistakes counting
        if (t.mistake && t.mistake.toLowerCase() !== "none") {
          mistakeMap[t.mistake] = (mistakeMap[t.mistake] || 0) + 1;
        }
      });

      const totalWinLossCount = wins + losses;
      const winRate = totalWinLossCount > 0 ? (wins / totalWinLossCount) * 100 : 0;
      const avgRR = monthTrades.length > 0 ? rrSum / monthTrades.length : 0;

      const popularTags = Object.keys(tagMap).map(tag => {
        const stats = tagMap[tag];
        return {
          tag,
          count: stats.count,
          profit: stats.profit,
          winRate: stats.count > 0 ? (stats.wins / stats.count) * 100 : 0
        };
      }).sort((a, b) => b.profit - a.profit);

      const frequentMistakes = Object.keys(mistakeMap).map(mistake => ({
        mistake,
        count: mistakeMap[mistake]
      })).sort((a, b) => b.count - a.count);

      return {
        monthKey: key,
        year,
        monthIndex,
        monthName,
        trades: monthTrades,
        totalProfit,
        winRate,
        wins,
        losses,
        avgRR,
        lotSum,
        popularTags,
        frequentMistakes
      };
    });

    // Sort chronologically in reverse (newest months first)
    return list.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [trades]);

  // Overall statistics of tags for general performance analysis by tag
  const overallTagStats = React.useMemo(() => {
    const tagMap: { [key: string]: { count: number; profit: number; wins: number; losses: number; rrSum: number } } = {};
    
    trades.forEach(t => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach(tag => {
          if (!tagMap[tag]) {
            tagMap[tag] = { count: 0, profit: 0, wins: 0, losses: 0, rrSum: 0 };
          }
          const s = tagMap[tag];
          s.count++;
          s.profit += t.profit;
          s.rrSum += t.riskReward || 0;
          if (t.profit > 0) s.wins++;
          else if (t.profit < 0) s.losses++;
        });
      }
    });

    return Object.keys(tagMap).map(tag => {
      const stats = tagMap[tag];
      const winRate = stats.count > 0 ? (stats.wins / stats.count) * 100 : 0;
      return {
        tag,
        count: stats.count,
        profit: stats.profit,
        wins: stats.wins,
        losses: stats.losses,
        avgRR: stats.count > 0 ? stats.rrSum / stats.count : 0,
        winRate
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [trades]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      
      {/* Overview Block */}
      <div className={`${styles.cardBg} border ${styles.border} p-6 rounded-3xl relative overflow-hidden shadow-2xl`}>
        <div className="absolute right-0 top-0 opacity-[0.03] text-blue-500 pointer-events-none select-none">
          <Calendar className="h-44 w-44 -mr-6 -mt-6" />
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
          <div>
            <span className="text-[10px] bg-blue-600/10 text-blue-400 font-black px-3 py-1 rounded-full uppercase tracking-wider font-mono border border-blue-500/15">
              📊 Chrono Ledger Auditor
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight mt-2 flex items-center space-x-2">
              <span>Monthly Audits & Reports</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Summarize historical months, isolate strategic margins, and evaluate edge metrics.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-[#06090e]/40 border border-slate-900 rounded-2xl p-3 text-right">
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">Total Recorded Months</p>
              <p className="text-xl font-mono font-black text-blue-400 mt-1">{monthlyGroups.length} Months</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tags performance analytics section (Users requested to filter and analyze performance by tag) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Tag Performance Matrix */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${styles.cardBg} border ${styles.border} p-5 rounded-2xl`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-rose-450 flex items-center space-x-1.5">
                <span>🏷️</span>
                <span>All-Time Tag Performance Analysis</span>
              </h2>
              <span className="text-[10px] text-slate-500 font-mono uppercase">
                {overallTagStats.length} Unique tags found
              </span>
            </div>

            {overallTagStats.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs">
                <p>No tagged trades logged yet.</p>
                <p className="text-slate-650 text-[10px] mt-1">Associate tags (like Breakout, Reversal) to trades to see this breakdown!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-400">
                  <thead>
                    <tr className="border-b border-slate-900 pb-2 text-[10px] text-slate-500 uppercase font-black font-mono">
                      <th className="py-3 px-1">Classification Tag</th>
                      <th className="py-3 px-2 text-center">Trades Logged</th>
                      <th className="py-3 px-2 text-center">Win Rate</th>
                      <th className="py-3 px-2 text-center">Average R:R</th>
                      <th className="py-3 px-2 text-right">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overallTagStats.map((stat, idx) => (
                      <tr 
                        key={stat.tag} 
                        className="border-b border-slate-900/60 hover:bg-[#06090e]/30 transition-colors"
                      >
                        <td className="py-3 px-1">
                          <span className="inline-flex items-center space-x-1 font-black uppercase text-[10px] tracking-wide text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                            🏷️ {stat.tag}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-center font-bold font-mono">
                          {stat.count}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className="font-bold font-mono text-white">{stat.winRate.toFixed(1)}%</span>
                            <div className="w-16 bg-slate-900 rounded-full h-1 mt-1 overflow-hidden border border-slate-800">
                              <div 
                                className={`h-full ${stat.winRate >= 50 ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                style={{ width: `${stat.winRate}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-2 text-center font-bold font-mono text-slate-300">
                          1:{stat.avgRR.toFixed(1)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <span className={`font-black font-mono ${stat.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {stat.profit >= 0 ? "+" : ""}${stat.profit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column: Quick Insight Widget */}
        <div className={`${styles.cardBg} border ${styles.border} p-5 rounded-2xl flex flex-col justify-between space-y-4`}>
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center space-x-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-yellow-300 shrink-0" />
              <span>Edge Optima Insight</span>
            </h2>
            <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
              Analyzing your tagged allocations reveals where your high-probability setups truly align:
            </p>
          </div>

          {overallTagStats.length > 0 ? (
            <div className="space-y-4 bg-[#06090e]/40 p-3 rounded-2xl border border-slate-900">
              {/* Best tag insight */}
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Most Lucrative Edge</p>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15">
                    {overallTagStats[0].tag}
                  </span>
                  <span className="text-xs font-mono font-black text-emerald-400">
                    +${overallTagStats[0].profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Compiling a win rate of {overallTagStats[0].winRate.toFixed(0)}%. Focus on compounding size here.
                </p>
              </div>

              {/* Worst tag insight */}
              {overallTagStats.length > 1 && overallTagStats[overallTagStats.length - 1].profit < 0 && (
                <div className="pt-3 border-t border-slate-950">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Risk Exposure / Drain</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/10 opacity-70">
                      {overallTagStats[overallTagStats.length - 1].tag}
                    </span>
                    <span className="text-xs font-mono font-black text-red-400">
                      -${Math.abs(overallTagStats[overallTagStats.length - 1].profit).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 italic">
                    Experiencing systematic leak. Consider reducing leverage or reviewing parameters.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-[10px] italic text-slate-500">Log tags to generate custom advice.</p>
          )}

          <div className="bg-blue-600/5 border border-blue-500/10 p-3 rounded-xl text-[10px] text-slate-400 leading-normal">
            <strong>📋 Edge Rule:</strong> Ensure you aren't lumping diverse market behaviors under single strategies. Using specific tags exposes underlying mechanics!
          </div>
        </div>

      </div>

      {/* monthly items grid */}
      <div className="space-y-4">
        
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Chronological Archives</span>
          <div className="flex-1 border-t border-slate-800"></div>
        </div>

        {monthlyGroups.length === 0 ? (
          <div className={`${styles.cardBg} border ${styles.border} rounded-2xl py-12 text-center text-slate-500`}>
            <p className="font-semibold text-slate-300">No monthly cycles archived</p>
            <p className="text-xs mt-1">Input trades with precise execution times to generate chronological records.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyGroups.map((group, gIdx) => {
              const isExpanded = selectedMonthKey === group.monthKey;
              const profitString = `${group.totalProfit >= 0 ? "+" : ""}$${group.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
              
              return (
                <motion.div 
                  key={group.monthKey} 
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(gIdx * 0.05, 0.4) }}
                  className={`${styles.cardBg} border ${styles.border} rounded-3xl overflow-hidden hover:shadow-[0_8px_24px_-10px_rgba(0,0,0,0.3)] transition-all`}
                >
                  
                  {/* Ledger summary banner click triggers expansion */}
                  <div 
                    onClick={() => setSelectedMonthKey(isExpanded ? null : group.monthKey)}
                    className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0 cursor-pointer hover:bg-slate-900/15 transition-colors"
                  >
                    
                    {/* Month description info */}
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 rounded-2xl bg-gradient-to-b from-blue-600/10 to-indigo-600/5 border border-blue-500/20 flex flex-col items-center justify-center text-center font-mono leading-none shrink-0">
                        <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">
                          {group.monthName.substring(0, 3)}
                        </span>
                        <span className="text-sm font-black text-white mt-0.5">
                          {group.year.toString().substring(2)}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-base font-black text-white leading-tight">
                          {group.monthName} {group.year} Report
                        </h3>
                        <p className="text-[11px] text-slate-505 font-mono mt-0.5 font-medium">
                          {group.trades.length} COMPLETED TRADES • SUM LOTS {group.lotSum.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Financial health indices */}
                    <div className="flex items-center space-x-6 flex-wrap gap-y-2">
                      <div className="text-center md:text-right">
                        <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">Monthly Return</p>
                        <p className={`text-lg font-mono font-black tracking-tight mt-0.5 ${group.totalProfit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {profitString}
                        </p>
                      </div>

                      <div className="text-center md:text-right">
                        <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">Win / Loss Ratio</p>
                        <div className="flex items-center space-x-1.5 mt-0.5 font-mono text-xs">
                          <span className="text-emerald-400 font-extrabold">{group.wins}W</span>
                          <span className="text-slate-600">-</span>
                          <span className="text-red-400 font-extrabold">{group.losses}L</span>
                          <span className="text-slate-500 font-bold bg-[#06090e] px-1.5 py-0.5 border border-slate-900 rounded">
                            {group.winRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>

                      <div className="text-center md:text-right">
                        <p className="text-[8.5px] font-bold text-slate-500 uppercase tracking-widest leading-none">Average R:R</p>
                        <p className="text-xs font-mono font-bold text-slate-300 mt-0.5">
                          1:{group.avgRR.toFixed(1)}
                        </p>
                      </div>

                      <div className="text-slate-500 p-1.5 rounded-full hover:bg-[#06090e] transition">
                        {isExpanded ? <ChevronUp className="h-5 w-5 font-bold" /> : <ChevronDown className="h-5 w-5 font-bold" />}
                      </div>
                    </div>

                  </div>

                  {/* Expansion block displaying precise trade metrics and graphs */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="border-t border-slate-900 bg-[#06090e]/40"
                      >
                        <div className="p-5 space-y-6">
                          
                          {/* Inner details grid metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            
                            {/* Monthly Tag Rankings */}
                            <motion.div 
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/50 space-y-3"
                            >
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-rose-400 flex items-center space-x-1.5">
                                <span>🏷️</span>
                                <span>Tag Performance ({group.monthName})</span>
                              </h4>
                              
                              {group.popularTags.length === 0 ? (
                                <p className="text-[10.5px] text-slate-500 italic">No tags selected in trades during this cycle.</p>
                              ) : (
                                <div className="space-y-2">
                                  {group.popularTags.map(tagStat => (
                                    <div 
                                      key={tagStat.tag} 
                                      className="flex justify-between items-center text-xs p-2 bg-[#06090e] rounded-xl border border-slate-900"
                                    >
                                      <div className="flex items-center space-x-1.5">
                                        <span className="text-[9.5px] uppercase font-black tracking-wide text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/15">
                                          {tagStat.tag}
                                        </span>
                                        <span className="text-[9.5px] text-slate-500 font-mono">({tagStat.count} trades)</span>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <span className="font-mono text-slate-400">{tagStat.winRate.toFixed(0)}% Win</span>
                                        <span className={`font-mono font-black ${tagStat.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                          {tagStat.profit >= 0 ? "+" : ""}${tagStat.profit.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>

                            {/* Monthly Mistakes Metrics */}
                            <motion.div 
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: 0.1 }}
                              className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/50 space-y-3"
                            >
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-yellow-400 flex items-center space-x-1.5">
                                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                                <span>Mistakes & Flaws List</span>
                              </h4>

                              {group.frequentMistakes.length === 0 ? (
                                <p className="text-[10.5px] text-slate-500 italic">First-class execution! No mistakes logged during this month.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  {group.frequentMistakes.map(mObj => (
                                    <div 
                                      key={mObj.mistake} 
                                      className="flex justify-between items-center text-[11px] p-2 bg-red-500/5 rounded-xl border border-red-500/10 text-red-300"
                                    >
                                      <span className="italic font-bold">"{mObj.mistake}"</span>
                                      <span className="font-mono text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/15">
                                        {mObj.count} Occurrence{mObj.count > 1 ? "s" : ""}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </motion.div>

                          </div>

                          {/* Historical Trade list of this month */}
                          <motion.div 
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35, delay: 0.2 }}
                            className="space-y-3"
                          >
                            <h4 className="text-[10.5px] font-bold uppercase tracking-widest text-slate-400">Month Ledger Transactions ({group.trades.length})</h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                              {group.trades.map((t, tIdx) => (
                                <motion.div 
                                  key={t.id} 
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ duration: 0.2, delay: 0.25 + Math.min(tIdx * 0.03, 0.3) }}
                                  className="p-3.5 bg-[#0F141C] rounded-2xl border border-slate-800/40 flex justify-between items-center text-xs text-slate-300 hover:border-slate-700/60 transition-colors"
                                >
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <span className="font-bold text-white font-mono">{t.pair}</span>
                                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded font-mono ${
                                        t.direction === "LONG" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                                      }`}>
                                        {t.direction}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 mt-1 flex items-center space-x-2">
                                      <span>{t.strategy}</span>
                                      <span>•</span>
                                      <span>{t.date ? new Date(t.date + "T00:00:00").toLocaleDateString([], { month: "short", day: "numeric" }) : new Date(t.time).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
                                    </div>
                                  </div>

                                  <div className="text-right">
                                    <p className={`font-mono font-black text-sm ${t.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                                      {t.profit >= 0 ? "+" : ""}${t.profit.toLocaleString()}
                                    </p>
                                    <p className="text-[9px] text-slate-505 mt-0.5">R:R 1:{t.riskReward}</p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </motion.div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
