import React from "react";
import { Trade, PerformanceStats } from "../types";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend
} from "recharts";
import { 
  TrendingUp, TrendingDown, Layers, Percent, ArrowUpRight, 
  Calendar, Award, AlertTriangle, RefreshCw
} from "lucide-react";

interface AnalyticsPanelProps {
  trades: Trade[];
  stats: PerformanceStats;
}

export default function AnalyticsPanel({ trades, stats }: AnalyticsPanelProps) {
  // Compute per-strategy statistics
  const strategiesData = React.useMemo(() => {
    const map: Record<string, { name: string; pnl: number; count: number; wins: number }> = {};
    
    trades.forEach(t => {
      if (!map[t.strategy]) {
        map[t.strategy] = { name: t.strategy, pnl: 0, count: 0, wins: 0 };
      }
      map[t.strategy].pnl += t.profit;
      map[t.strategy].count += 1;
      if (t.profit > 0) map[t.strategy].wins += 1;
    });

    return Object.values(map).map(s => {
      const winRate = s.count > 0 ? Math.round((s.wins / s.count) * 100) : 0;
      return {
        ...s,
        pnl: parseFloat(s.pnl.toFixed(2)),
        winRate
      };
    });
  }, [trades]);

  return (
    <div className="space-y-6">
      {/* 🚀 Visual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Profit */}
        <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Net Profit / PnL</span>
            <div className={`p-2 rounded-lg ${stats.totalProfit >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-[#00b074]" />
              ) : (
                <TrendingDown className="h-5 w-5 text-[#f23645]" />
              )}
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-bold font-sans tracking-tight ${stats.totalProfit >= 0 ? 'text-[#00b074]' : 'text-[#f23645]'}`}>
              {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Overall returns on logged capital</p>
        </div>

        {/* Win Rate */}
        <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Action Win Rate</span>
            <div className="p-2 bg-blue-600/10 rounded-lg">
              <Percent className="h-5 w-5 text-blue-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-sans tracking-tight text-white">{stats.winRate}%</span>
          </div>
          <div className="w-full bg-[#1C2128] rounded-full h-1.5 mt-3 border border-slate-800">
            <div 
              className="bg-[#00b074] h-1.5 rounded-full shadow-sm" 
              style={{ width: `${stats.winRate}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">{stats.wins} wins / {stats.losses} losses out of {stats.totalTrades} trades</p>
        </div>

        {/* Profit Factor */}
        <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Profit Factor</span>
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Award className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-bold font-sans tracking-tight text-yellow-400">{stats.profitFactor}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            {stats.profitFactor >= 1.5 ? "🎯 Highly profitable ratio" : "⚠️ Needs risk improvement"}
          </p>
        </div>

        {/* Average Gain / Slip Ratio */}
        <div className="bg-[#161B22] border border-slate-800 rounded-xl p-5 hover:border-blue-500/30 transition duration-300">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm">Average Win / Loss</span>
            <div className="p-2 bg-[#9c27b0]/10 rounded-lg">
              <ArrowUpRight className="h-5 w-5 text-[#9c27b0]" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex justify-between text-sm">
              <span className="text-[#64748b]">Avg Win:</span>
              <span className="text-[#00b074] font-medium">+${stats.averageProfit.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-[#64748b]">Avg Loss:</span>
              <span className="text-[#f23645] font-medium">-${stats.averageLoss.toFixed(0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 📊 main TradingView Style Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cumulative Profit / Return Equity Curve (TradingView Style) */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 lg:col-span-2 shadow-2xl relative">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white font-semibold text-lg">Cumulative Equity Curve</h3>
              <p className="text-xs text-slate-400">Trading growth and recovery progressions over time</p>
            </div>
            <span className="text-xs font-mono bg-[#1C2128] text-blue-400 px-2.5 py-1 rounded-full uppercase tracking-wider font-semibold border border-slate-800">
              Live Equity
            </span>
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.cumulativePnL} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F141C", borderRadius: "8px", borderColor: "#334155" }}
                  labelStyle={{ color: "#94a3b8", fontWeight: 600 }}
                  itemStyle={{ color: "#10b981" }}
                  formatter={(value: any) => [`$${value}`, "Balance Gain"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#2563EB" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorPnL)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Strategy Breakdown performance bar */}
        <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">Performance by Strategy</h3>
            <p className="text-xs text-slate-400 mb-4">P&L distribution sorted by execution framework</p>
          </div>

          {strategiesData.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <Layers className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm">No strategy distribution recorded yet.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1">
              {strategiesData.map((strat, i) => (
                <div key={i} className="bg-[#0F141C] border border-slate-800 p-3 rounded-xl">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white truncate max-w-[180px]">
                      {strat.name}
                    </span>
                    <span className={`text-xs font-semibold ${strat.pnl >= 0 ? 'text-[#00b074]' : 'text-[#f23645]'}`}>
                      {strat.pnl >= 0 ? "+" : ""}${strat.pnl}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    <span>{strat.count} Trades ({strat.winRate}% Win Rate)</span>
                    <div className="flex items-center space-x-1">
                      <div className="w-16 bg-[#1C2128] rounded-full h-1 border border-slate-800">
                        <div 
                          className={`h-1 rounded-full ${strat.pnl >= 0 ? 'bg-[#00b074]' : 'bg-[#f23645]'}`}
                          style={{ width: `${Math.min(100, Math.max(10, strat.winRate))}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ⚠️ Top Mistakes & Pitfalls Detected */}
      <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-2xl">
        <h3 className="text-white font-semibold text-lg flex items-center space-x-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          <span>Mistake Tracking & Psychology Guard</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Tracking emotional pitfalls to build a structural trading edge.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trades.filter(t => t.mistake && t.mistake.toLowerCase() !== "none").slice(0, 6).map((t, idx) => (
            <div key={idx} className="bg-[#0F141C] border border-l-4 border-l-red-500 border-slate-800 p-4 rounded-xl flex flex-col justify-between">
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono text-slate-400 font-semibold">{t.pair}</span>
                  <span className="text-slate-500 text-[10px]">{new Date(t.time).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 italic">"{t.mistake}"</p>
              </div>
              <div className="text-[10px] font-medium text-slate-400 bg-[#1C2128] px-2 py-1 rounded inline-block self-start border border-slate-800">
                Strategy: {t.strategy}
              </div>
            </div>
          ))}
          {trades.filter(t => t.mistake && t.mistake.toLowerCase() !== "none").length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 flex flex-col items-center justify-center">
              <Award className="h-12 w-12 text-[#00b074] mb-2" />
              <p className="text-sm font-medium text-gray-300">Perfect Execution Streak!</p>
              <p className="text-xs text-slate-500 mt-1">No psychological or strategy deviations logged so far.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
