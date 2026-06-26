import React, { useState, useMemo } from "react";
import { Trade } from "../types";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";
import { motion } from "motion/react";

interface CalendarFilterProps {
  trades: Trade[];
  selectedDate: string | null;
  onSelectDate: (date: string | null) => void;
  activeTheme: "midnight" | "emerald" | "neon" | "light";
}

export default function CalendarFilter({
  trades,
  selectedDate,
  onSelectDate,
  activeTheme
}: CalendarFilterProps) {
  // Navigation states
  const [currentDate, setCurrentDate] = useState(() => new Date());
  
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper: Retrieve the simple local "YYYY-MM-DD" string from trade object
  const getTradeDateString = (t: Trade): string => {
    if (t.date) return t.date;
    if (t.createdAt) return t.createdAt.split("T")[0];
    if (t.time && t.time.includes("T")) return t.time.split("T")[0];
    return "";
  };

  // Memoized mapping of dates to trade performance of that day
  const tradeStatsByDate = useMemo(() => {
    const stats: Record<string, { count: number; profit: number; wins: number; losses: number }> = {};
    
    trades.forEach((t) => {
      const dStr = getTradeDateString(t);
      if (!dStr) return;
      
      if (!stats[dStr]) {
        stats[dStr] = { count: 0, profit: 0, wins: 0, losses: 0 };
      }
      
      stats[dStr].count += 1;
      stats[dStr].profit += t.profit;
      if (t.profit > 0) {
        stats[dStr].wins += 1;
      } else if (t.profit < 0) {
        stats[dStr].losses += 1;
      }
    });
    
    return stats;
  }, [trades]);

  // Calendar dates generation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay(); // 0 is Sunday, 1 is Monday...

  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays = useMemo(() => {
    const days: Array<{ day: number; monthOffset: "prev" | "curr" | "next"; dateStr: string }> = [];

    // Prior month overflow days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = currentMonth === 0 ? 11 : currentMonth - 1;
      const y = currentMonth === 0 ? currentYear - 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, monthOffset: "prev", dateStr });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ day: d, monthOffset: "curr", dateStr });
    }

    // Next month overflow days structure to complete a 6-row or 42-day viewport
    const totalSlots = 42; 
    const currentLength = days.length;
    for (let i = 1; i <= totalSlots - currentLength; i++) {
      const m = currentMonth === 11 ? 0 : currentMonth + 1;
      const y = currentMonth === 11 ? currentYear + 1 : currentYear;
      const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      days.push({ day: i, monthOffset: "next", dateStr });
    }

    return days;
  }, [currentYear, currentMonth, daysInMonth, firstDayIndex, prevMonthDays]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    
    // Auto-select today's date if requested
    const formattedToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    onSelectDate(formattedToday);
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Theme support styles variables
  const themeCardStyles = {
    midnight: {
      header: "text-slate-200 border-slate-800",
      calBg: "bg-[#111622]/90 border-slate-800/80",
      dayHover: "hover:bg-[#1f293d]",
      textMuted: "text-slate-600",
      textNormal: "text-slate-300",
      todayBorder: "border-blue-500 text-blue-400",
      selected: "bg-blue-600/30 border-2 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] text-white"
    },
    emerald: {
      header: "text-emerald-100 border-emerald-950/40",
      calBg: "bg-[#0c1811]/90 border-emerald-900/30",
      dayHover: "hover:bg-[#1b3325]",
      textMuted: "text-emerald-900",
      textNormal: "text-emerald-300",
      todayBorder: "border-emerald-500 text-emerald-400",
      selected: "bg-emerald-600/30 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] text-white"
    },
    neon: {
      header: "text-purple-100 border-purple-950/40",
      calBg: "bg-[#0e061c]/95 border-purple-900/30",
      dayHover: "hover:bg-[#28124c]",
      textMuted: "text-purple-900/60",
      textNormal: "text-purple-300",
      todayBorder: "border-fuchsia-500 text-fuchsia-400",
      selected: "bg-fuchsia-600/30 border-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)] text-white font-bold"
    },
    light: {
      header: "text-slate-800 border-slate-200",
      calBg: "bg-white/95 border-slate-200/80 shadow-md shadow-slate-100",
      dayHover: "hover:bg-slate-100",
      textMuted: "text-slate-300",
      textNormal: "text-slate-700",
      todayBorder: "border-blue-600 text-blue-600 font-semibold",
      selected: "bg-blue-100 border-2 border-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.2)] text-blue-900 font-semibold"
    }
  };

  const ts = themeCardStyles[activeTheme] || themeCardStyles.midnight;

  return (
    <div className={`rounded-2xl border ${ts.calBg} p-5 transition-all duration-300`}>
      {/* Calendar Header with Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
          <h3 className="text-sm font-bold tracking-tight text-white dark:text-slate-200">
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>
        
        <div className="flex items-center space-x-1.5Packed">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 hover:text-white transition duration-250 cursor-pointer"
            title="Previous Month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleToday}
            className="text-[10px] font-bold px-2 py-1 rounded bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition cursor-pointer border border-blue-500/20"
          >
            Today
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 hover:text-white transition duration-250 cursor-pointer"
            title="Next Month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday Labels Row */}
      <div className="grid grid-cols-7 text-center text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2">
        <span>Sun</span>
        <span>Mon</span>
        <span>Tue</span>
        <span>Wed</span>
        <span>Thu</span>
        <span>Fri</span>
        <span>Sat</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-xs">
        {calendarDays.map(({ day, monthOffset, dateStr }) => {
          const stats = tradeStatsByDate[dateStr];
          const hasTrades = !!stats;
          const isSelected = selectedDate === dateStr;
          
          const today = new Date();
          const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
          const isToday = todayFormatted === dateStr;

          // Color coded glow based on daily sum profit/loss
          let dailyStyle = "border-transparent";
          let dotStyle = "";

          if (hasTrades) {
            if (stats.profit > 0) {
              dailyStyle = activeTheme === "light" 
                ? "bg-emerald-50/75 text-emerald-800 border-emerald-300 hover:bg-emerald-100" 
                : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:border-emerald-400/60 shadow-[inset_0_0_4px_rgba(16,185,129,0.1)]";
              dotStyle = "bg-emerald-500 shadow-[0_0_6px_#10b981]";
            } else if (stats.profit < 0) {
              dailyStyle = activeTheme === "light" 
                ? "bg-red-50 text-red-800 border-red-300 hover:bg-red-100" 
                : "bg-red-500/10 text-red-300 border-red-500/30 hover:border-red-400/60 shadow-[inset_0_0_4px_rgba(239,68,68,0.1)]";
              dotStyle = "bg-red-500 shadow-[0_0_6px_#ef4444]";
            } else {
              dailyStyle = activeTheme === "light"
                ? "bg-blue-50 text-blue-800 border-blue-200"
                : "bg-blue-500/10 text-blue-300 border-blue-500/20";
              dotStyle = "bg-blue-400";
            }
          }

          return (
            <div key={dateStr} className="relative group">
              <button
                onClick={() => {
                  if (isSelected) {
                    onSelectDate(null); // click to toggle filter off
                  } else {
                    onSelectDate(dateStr);
                  }
                }}
                className={`w-full aspect-square flex flex-col items-center justify-center rounded-xl p-0.5 border text-center transition-all duration-200 cursor-pointer relative ${
                  monthOffset === "curr" ? ts.textNormal : ts.textMuted
                } ${isSelected ? ts.selected : isToday ? `${ts.todayBorder} border-dashed` : `${ts.dayHover} ${dailyStyle}`}`}
              >
                <span className="font-semibold">{day}</span>
                
                {/* Visual indicator for logged entries */}
                {hasTrades && (
                  <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotStyle}`} />
                )}
              </button>

              {/* Advanced Tooltip Panel triggered on Hover */}
              {hasTrades && (
                <div className="absolute z-30 bottom-full left-1/2 -translate-x-1/2 mb-2 w-36 p-2 rounded-xl bg-slate-950/95 border border-slate-800 text-[10px] text-slate-300 font-sans shadow-xl pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  <div className="font-extrabold text-[#00b074] flex justify-between items-center mb-1">
                    <span>📅 {dateStr}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-800/70 pb-1 mb-1">
                    <span>Total Trades:</span>
                    <span className="font-bold text-white">{stats.count}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>PnL Total:</span>
                    <span className={`font-bold ${stats.profit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {stats.profit >= 0 ? "+" : ""}${stats.profit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                    <span>W:{stats.wins} / L:{stats.losses}</span>
                    <span>{((stats.wins / stats.count) * 100).toFixed(0)}% WR</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Indicator Clear Button bar */}
      {selectedDate && (
        <motion.div 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between"
        >
          <div className="text-[10px] text-slate-400">
            Filtered: <span className="font-mono text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">{selectedDate}</span>
          </div>
          <button
            onClick={() => onSelectDate(null)}
            className="flex items-center space-x-1 text-[10px] font-bold text-rose-450 hover:text-rose-400 cursor-pointer transition duration-200"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset Filter</span>
          </button>
        </motion.div>
      )}

      {/* Live Calendar Legend */}
      <div className="mt-4 pt-3 border-t border-slate-800/50 grid grid-cols-3 gap-1 text-[9px] text-slate-500 text-center font-bold">
        <div className="flex items-center justify-center space-x-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full inline-block" />
          <span>Gain Day</span>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block" />
          <span>Loss Day</span>
        </div>
        <div className="flex items-center justify-center space-x-1">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full inline-block" />
          <span>Balanced</span>
        </div>
      </div>
    </div>
  );
}
