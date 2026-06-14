import React, { useState } from "react";
import { Trade, PerformanceStats } from "../types";
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, Legend, PieChart, Pie
} from "recharts";
import { 
  TrendingUp, TrendingDown, Layers, Percent, ArrowUpRight, 
  Calendar, Award, AlertTriangle, RefreshCw, PieChart as PieIcon, Activity, CheckCircle, Flame
} from "lucide-react";
import { motion } from "motion/react";

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

  const winsLossesPieData = React.useMemo(() => {
    return [
      { name: "Wins", value: stats.wins, color: "#10b981", percent: stats.totalTrades > 0 ? Math.round((stats.wins / stats.totalTrades) * 100) : 0 },
      { name: "Losses", value: stats.losses, color: "#ef4444", percent: stats.totalTrades > 0 ? Math.round((stats.losses / stats.totalTrades) * 100) : 0 }
    ].filter(item => item.value > 0);
  }, [stats.wins, stats.losses, stats.totalTrades]);

  const strategyPieData = React.useMemo(() => {
    const data = strategiesData.map(s => ({
      name: s.name || "Default Tactic",
      value: s.count,
      pnl: s.pnl
    }));
    return data.sort((a, b) => b.value - a.value);
  }, [strategiesData]);

  const COLORS_PALETTE = ["#3b82f6", "#10b981", "#ca8a04", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4"];

  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      {/* 🚀 Visual Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Profit (Slides from the Left Vector) */}
        <motion.div 
          initial={{ opacity: 0, x: -60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          whileHover={{ scale: 1.025, border: "1px solid rgba(16, 185, 129, 0.45)", boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.15)" }}
          onMouseEnter={() => setHoveredCard(1)}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-[#161B22] border border-slate-800 rounded-xl p-5 transition duration-300 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-semibold">Net Profit / PnL</span>
            <motion.div 
              animate={hoveredCard === 1 ? { y: [0, -8, 8, -6, 6, 0] } : {}}
              transition={{ duration: 1.2, ease: "easeInOut", repeat: hoveredCard === 1 ? Infinity : 0 }}
              className={`p-2 rounded-lg ${stats.totalProfit >= 0 ? 'bg-emerald-500/10 animate-pulse' : 'bg-red-500/10'}`}
            >
              {stats.totalProfit >= 0 ? (
                <TrendingUp className="h-5 w-5 text-[#00b074]" />
              ) : (
                <TrendingDown className="h-5 w-5 text-[#f23645]" />
              )}
            </motion.div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className={`text-2xl font-black font-sans tracking-tight ${stats.totalProfit >= 0 ? 'text-[#00b074]' : 'text-[#f23645]'}`}>
              {stats.totalProfit >= 0 ? "+" : ""}${stats.totalProfit.toLocaleString()}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Overall returns on logged capital</p>
        </motion.div>

        {/* Win Rate (Slides up from Bottom Vector) */}
        <motion.div 
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          whileHover={{ scale: 1.025, border: "1px solid rgba(59, 130, 246, 0.45)", boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.15)" }}
          onMouseEnter={() => setHoveredCard(2)}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-[#161B22] border border-slate-800 rounded-xl p-5 transition duration-300 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-semibold">Action Win Rate</span>
            <motion.div 
              animate={hoveredCard === 2 ? { rotate: [0, -15, 15, -15, 15, 0] } : {}}
              transition={{ duration: 0.8 }}
              className="p-2 bg-blue-600/10 rounded-lg"
            >
              <Percent className="h-5 w-5 text-blue-400" />
            </motion.div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black font-sans tracking-tight text-white">{stats.winRate}%</span>
          </div>
          <div className="w-full bg-[#1C2128] rounded-full h-1.5 mt-3 border border-slate-800">
            <motion.div 
              initial={{ width: "0%" }}
              whileInView={{ width: `${stats.winRate}%` }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 1.2, ease: "easeOut" }}
              className="bg-[#00b074] h-1.5 rounded-full shadow-sm" 
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">{stats.wins} wins / {stats.losses} losses out of {stats.totalTrades} trades</p>
        </motion.div>

        {/* Profit Factor (Slides down from Top Vector with 360-degree rotation) */}
        <motion.div 
          initial={{ opacity: 0, y: -60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          whileHover={{ scale: 1.025, border: "1px solid rgba(234, 179, 8, 0.45)", boxShadow: "0 10px 25px -5px rgba(234, 179, 8, 0.15)" }}
          onMouseEnter={() => setHoveredCard(3)}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-[#161B22] border border-slate-800 rounded-xl p-5 transition duration-300 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-semibold">Profit Factor</span>
            <motion.div 
              animate={hoveredCard === 3 ? { rotate: 360, scale: 1.25 } : { rotate: 0, scale: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 12 }}
              className="p-2 bg-yellow-500/10 rounded-lg"
            >
              <Award className="h-5 w-5 text-yellow-400 text-shadow-md" />
            </motion.div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black font-sans tracking-tight text-yellow-400">{stats.profitFactor}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {stats.profitFactor >= 1.5 ? "🎯 Highly profitable ratio" : "⚠️ Needs risk improvement"}
          </p>
        </motion.div>

        {/* Average Gain / Slip Ratio (Slides from the Right Vector) */}
        <motion.div 
          initial={{ opacity: 0, x: 60 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ type: "spring", stiffness: 90, damping: 14 }}
          whileHover={{ scale: 1.025, border: "1px solid rgba(168, 85, 247, 0.45)", boxShadow: "0 10px 25px -5px rgba(168, 85, 247, 0.15)" }}
          onMouseEnter={() => setHoveredCard(4)}
          onMouseLeave={() => setHoveredCard(null)}
          className="bg-[#161B22] border border-slate-800 rounded-xl p-5 transition duration-300 cursor-pointer"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-400 text-sm font-semibold">Average Win / Loss</span>
            <motion.div 
              animate={hoveredCard === 4 ? { x: [0, 5, 0], y: [0, -5, 0] } : {}}
              transition={{ duration: 0.8, repeat: hoveredCard === 4 ? Infinity : 0 }}
              className="p-2 bg-[#9c27b0]/10 rounded-lg"
            >
              <ArrowUpRight className="h-5 w-5 text-[#9c27b0]" />
            </motion.div>
          </div>
          <div className="flex flex-col space-y-1.5 mt-1">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#64748b]">Avg Win:</span>
              <span className="text-[#00b074] font-black">+${stats.averageProfit.toFixed(0)}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#64748b]">Avg Loss:</span>
              <span className="text-[#f23645] font-black">-${stats.averageLoss.toFixed(0)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 🌊 Interactive Discipline Flow Wave Oscillator Block (Wave Motion Alignment) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 80, damping: 15 }}
        whileHover={{ scale: 1.005, borderColor: "rgba(56, 189, 248, 0.45)", boxShadow: "0 10px 30px rgba(56, 189, 248, 0.1)" }}
        className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 shadow-xl transition-all duration-300 relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4 cursor-pointer"
      >
        <div className="space-y-1.5 z-10 w-full md:w-auto">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <h4 className="text-white font-mono text-xs uppercase tracking-widest font-black flex items-center space-x-1">
              <span>Discipline Wave & Volatility Alignment Index</span>
            </h4>
          </div>
          <p className="text-[11.5px] text-slate-400 max-w-2xl leading-relaxed">
            Real-time visual monitoring of market emotional equilibrium. Compound returns are optimized by tracking consistency waves and balancing execution frequency against setup quality.
          </p>
        </div>

        {/* 15-Column Sine wave simulation with staggered animated columns */}
        <div className="flex items-end space-x-1.5 h-12 px-4 shrink-0 bg-slate-950/45 p-2 rounded-xl border border-slate-900/60 z-10">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: ["12px", "40px", "12px"],
                backgroundColor: ["#3b82f6", "#06b6d4", "#10b981", "#3b82f6"]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.12
              }}
              className="w-1.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.25)]"
              style={{ minHeight: "6px" }}
            />
          ))}
        </div>
      </motion.div>

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
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  whileHover={{ 
                    scale: 1.02, 
                    x: 6, 
                    borderColor: strat.pnl >= 0 ? "#10b981" : "#ef4444",
                    boxShadow: "0 10px 15px -3px rgba(59,130,246,0.05)"
                  }}
                  transition={{ type: "spring", stiffness: 220, damping: 15 }}
                  className="bg-[#0F141C] border border-slate-800 p-3 rounded-xl cursor-pointer group"
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-white truncate max-w-[180px] flex items-center space-x-1.5">
                      <motion.span
                        className="inline-block"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Layers className="h-3.5 w-3.5 text-blue-400 group-hover:text-blue-300" />
                      </motion.span>
                      <span>{strat.name}</span>
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 🧭 Strategic Allocation & Win/Loss distribution (Pie Charts) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Donut Win / Loss Allocation */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-2xl relative flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <PieIcon className="h-5 w-5 text-emerald-400" />
              <h3 className="text-white font-semibold text-lg">Outcome Win / Loss Split</h3>
            </div>
            <p className="text-xs text-slate-400">Dynamic distribution of profitable wins versus loss transactions</p>
          </div>

          <div className="h-[240px] w-full relative flex items-center justify-center mt-3">
            {winsLossesPieData.length === 0 ? (
              <div className="text-center text-slate-500 font-mono text-xs">
                Not enough trade parameters to plot outcomes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    <linearGradient id="gradientWin" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#047857" stopOpacity={0.9} />
                    </linearGradient>
                    <linearGradient id="gradientLoss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#b91c1c" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <Pie
                    data={winsLossesPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={65}
                    outerRadius={88}
                    paddingAngle={3}
                    dataKey="value"
                    stroke="#161B22"
                    strokeWidth={4}
                  >
                    {winsLossesPieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.name === "Wins" ? "url(#gradientWin)" : "url(#gradientLoss)"} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F141C", borderRadius: "8px", borderColor: "#334155" }}
                    itemStyle={{ color: "#fff", fontSize: "11px", fontWeight: "bold" }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    content={({ payload }) => (
                      <div className="flex justify-center space-x-6 text-xs text-slate-400">
                        {payload?.map((entry: any, index: number) => {
                          const dataItem = winsLossesPieData[index];
                          return (
                            <div key={`legend-${index}`} className="flex items-center space-x-1.5">
                              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="font-semibold text-slate-200">{dataItem?.percent}% {dataItem?.name}</span>
                              <span className="font-mono text-[11px] text-slate-500">({dataItem?.value})</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Central Win Rate Indicator Overlay */}
            {winsLossesPieData.length > 0 && (
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[26px] font-black font-sans tracking-tighter text-emerald-400 bg-clip-text">
                  {stats.winRate}%
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                  WIN RATE
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Card 2: Strategy frequency / capital weight pie chart */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.1 }}
          className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="h-5 w-5 text-blue-400" />
              <h3 className="text-white font-semibold text-lg">Tactic Deployment Share</h3>
            </div>
            <p className="text-xs text-slate-400">Strategy distribution by frequency to isolate key drivers</p>
          </div>

          <div className="h-[240px] w-full relative flex items-center justify-center mt-3">
            {strategyPieData.length === 0 ? (
              <div className="text-center text-slate-500 font-mono text-xs">
                No active strategy records logged yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={strategyPieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="#161B22"
                    strokeWidth={3}
                  >
                    {strategyPieData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS_PALETTE[index % COLORS_PALETTE.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0F141C", borderRadius: "8px", borderColor: "#334155" }}
                    itemStyle={{ color: "#fff", fontSize: "11px", fontWeight: "bold" }}
                    formatter={(value: any, name: any, props: any) => {
                      const percentVal = stats.totalTrades > 0 ? Math.round((Number(value) / stats.totalTrades) * 100) : 0;
                      return [`${value} trades (${percentVal}%)`, name];
                    }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={40} 
                    content={({ payload }) => (
                      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400 max-h-[50px] overflow-y-auto no-scrollbar">
                        {payload?.map((entry: any, index: number) => {
                          const dataItem = strategyPieData[index];
                          const percentValue = stats.totalTrades > 0 ? Math.round((dataItem.value / stats.totalTrades) * 100) : 0;
                          return (
                            <div key={`legend-${index}`} className="flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="font-bold text-slate-300 truncate max-w-[80px]" title={dataItem.name}>{dataItem.name}</span>
                              <span className="text-[9px] text-blue-400 font-bold">({percentValue}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Strategy Center Metric */}
            {strategyPieData.length > 0 && (
              <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <span className="text-[22px] font-black font-sans tracking-tighter text-blue-400">
                  {strategyPieData.length}
                </span>
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest block font-bold">
                  ACTIVE SETUPS
                </span>
              </div>
            )}
          </div>
        </motion.div>

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
            <motion.div 
              key={idx} 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.04, 
                rotate: [0, 1, -1, 0],
                boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.1)"
              }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="bg-[#0F141C] border border-l-4 border-l-red-500 border-slate-800 p-4 rounded-xl flex flex-col justify-between cursor-pointer group"
            >
              <div className="mb-2">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-mono text-slate-400 font-semibold flex items-center gap-1">
                    <motion.span
                      whileHover={{ scale: 1.2, rotate: 360 }}
                      className="inline-block"
                    >
                      <AlertTriangle className="h-3 w-3 text-red-400" />
                    </motion.span>
                    {t.pair}
                  </span>
                  <span className="text-slate-500 text-[10px]">{new Date(t.time).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-slate-200 line-clamp-2 italic">"{t.mistake}"</p>
              </div>
              <div className="text-[10px] font-medium text-slate-400 bg-[#1C2128] px-2 py-1 rounded inline-block self-start border border-slate-800">
                Strategy: {t.strategy}
              </div>
            </motion.div>
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
