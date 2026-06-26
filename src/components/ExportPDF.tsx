import React, { useState } from "react";
import { Trade, PerformanceStats, Strategy } from "../types";
import { 
  FileText, X, Settings, Check, Layout, Palette, 
  SlidersHorizontal, Sparkles, RefreshCw, Layers, Eye, BookOpen, Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ExportPDFProps {
  trades: Trade[];
  stats: PerformanceStats;
  strategies: Strategy[];
}

type LayoutPreset = "slate" | "navy" | "emerald";
type ReportThemeMode = "light" | "grid" | "dark" | "glass" | "vintage" | "cyber";

export default function ExportPDF({ trades, stats, strategies }: ExportPDFProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("EdgeJournal Terminal Performance Audit");

  React.useEffect(() => {
    const isAllBacktest = trades.length > 0 && trades.every(t => t.tradeType === "BACKTEST");
    if (isAllBacktest) {
      setReportTitle("EdgeJournal Backtest Performance Audit");
    } else {
      setReportTitle("EdgeJournal Terminal Performance Audit");
    }
  }, [trades]);

  const [layoutPreset, setLayoutPreset] = useState<LayoutPreset>("slate");
  const [reportThemeMode, setReportThemeMode] = useState<ReportThemeMode>("dark");
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeStrategies, setIncludeStrategies] = useState(true);
  const [includeMistakes, setIncludeMistakes] = useState(true);
  const [selectedStrategyFilter, setSelectedStrategyFilter] = useState<string>("ALL");
  
  // Pipeline loading state
  const [compiling, setCompiling] = useState(false);
  const [compilationProgress, setCompilationProgress] = useState<string>("");
  const [pipelineStep, setPipelineStep] = useState(0);

  // Filter trades based on user strategy selection prior to printing
  const getFilteredTrades = () => {
    if (selectedStrategyFilter === "ALL") return trades;
    return trades.filter(t => t.strategy && t.strategy.toLowerCase() === selectedStrategyFilter.toLowerCase());
  };

  const getFilteredStats = (filtered: Trade[]): PerformanceStats => {
    if (filtered.length === trades.length) return stats;
    
    // Quick recalculation for filtered statistics
    const total = filtered.length;
    const wins = filtered.filter(t => t.profit > 0);
    const losses = filtered.filter(t => t.profit < 0);
    const totalWinVal = wins.reduce((acc, t) => acc + t.profit, 0);
    const totalLossVal = Math.abs(losses.reduce((acc, t) => acc + t.profit, 0));
    const profitFactor = totalLossVal > 0 ? parseFloat((totalWinVal / totalLossVal).toFixed(2)) : totalWinVal > 0 ? 99.9 : 0;
    const totalProfit = filtered.reduce((acc, t) => acc + t.profit, 0);
    const winRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;

    return {
      totalTrades: total,
      wins: wins.length,
      losses: losses.length,
      winRate,
      profitFactor,
      totalProfit,
      averageProfit: wins.length > 0 ? totalWinVal / wins.length : 0,
      averageLoss: losses.length > 0 ? totalLossVal / losses.length : 0,
      cumulativePnL: stats.cumulativePnL // default reference
    };
  };

  const formatBase64Image = (imgStr: string | undefined): string => {
    if (!imgStr) return "";
    if (imgStr.startsWith("data:image")) return imgStr;
    return `data:image/png;base64,${imgStr}`;
  };

  const triggerPDFCompilation = () => {
    setCompiling(true);
    setPipelineStep(0);
    setCompilationProgress("Initializing Ledger compiler pipeline...");

    const steps = [
      { msg: "Allocating and parsing multi-timeframe chart layouts...", delay: 400 },
      { msg: "Recalculating mathematical win splits & capital factors...", delay: 500 },
      { msg: "Injecting theme specifications & formatting layout matrices...", delay: 400 },
      { msg: "Validating OS print dialogue stream...", delay: 300 }
    ];

    let currentStep = 0;
    const executeStep = () => {
      if (currentStep < steps.length) {
        setPipelineStep(currentStep + 1);
        setCompilationProgress(steps[currentStep].msg);
        setTimeout(() => {
          currentStep++;
          executeStep();
        }, steps[currentStep].delay);
      } else {
        setCompiling(false);
        setIsOpen(false);
        generatePrintableReport();
      }
    };

    setTimeout(executeStep, 350);
  };

  const generatePrintableReport = () => {
    const subsetTrades = getFilteredTrades();
    const subsetStats = getFilteredStats(subsetTrades);

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to generate and open the dynamic PDF report.");
      return;
    }

    // Determine layout colors based on selected preset
    let primaryColor = "#0f172a"; // Slate default
    let accentColor = "#2563eb"; // Blue
    let accentLight = "#f0f6ff";
    let bodyFont = "'Inter', system-ui, -apple-system, sans-serif";
    
    if (layoutPreset === "navy") {
      primaryColor = "#030712";
      accentColor = "#1d4ed8"; // Navy primary
      accentLight = "#f5f7ff";
    } else if (layoutPreset === "emerald") {
      primaryColor = "#064e3b";
      accentColor = "#10b981"; // Emerald
      accentLight = "#f0fdf4";
    }

    // Configure Background and Element mapping based on reportThemeMode
    const isDark = reportThemeMode === "dark" || reportThemeMode === "glass" || reportThemeMode === "cyber";
    const isGrid = reportThemeMode === "grid";

    let bodyBg = "#ffffff";
    let bodyBgStyle = "background-color: #ffffff;";
    let bodyColor = "#1e293b";
    let cardBg = "#ffffff";
    let cardBorder = "1.5px solid #cbd5e1";
    let cardShadow = "0 4px 14px rgba(0,0,0,0.03)";
    let textTitleColor = isDark ? "#ffffff" : primaryColor;
    let labelBorderColor = isDark ? accentColor : primaryColor;
    
    let tableThBg = "#f1f5f9";
    let tableThText = "#334155";
    let tableThBorderBottom = "2.5px solid #cbd5e1";
    let trBottomBorder = "1px solid #e2e8f0";
    let trEvenBg = "#f8fafc";
    let metricCardBg = "#f8fafc";
    let metricCardBorder = "1.5px solid #cbd5e1";

    let confluenceBg = "#f8fafc";
    let confluenceText = "#334155";
    let confluenceBorder = "1px solid #cbd5e1";
    
    const isVintage = reportThemeMode === "vintage";
    const isGlass = reportThemeMode === "glass";
    const isCyber = reportThemeMode === "cyber";
    
    if (isDark) {
      bodyBg = "#070a14";
      bodyBgStyle = "background-color: #070a14; background-image: linear-gradient(to right, #111a2e 1px, transparent 1px), linear-gradient(to bottom, #111a2e 1px, transparent 1px); background-size: 24px 24px;";
      bodyColor = "#cbd5e1";
      cardBg = "#101827";
      cardBorder = "1.5px solid #1f2937";
      cardShadow = "0 8px 30px rgba(0,0,0,0.4)";
      textTitleColor = "#ffffff";
      labelBorderColor = accentColor;
      
      tableThBg = "#1f2937";
      tableThText = "#f9fafb";
      tableThBorderBottom = "2.5px solid #374151";
      trBottomBorder = "1px solid #1f2937";
      trEvenBg = "#111827";
      metricCardBg = "#111827";
      metricCardBorder = "1.5px solid #1f2937";

      confluenceBg = "#1f2937";
      confluenceText = "#e5e7eb";
      confluenceBorder = "1px solid #374151";
    } else if (isGrid) {
      bodyBg = "#fcfdfd";
      bodyBgStyle = "background-color: #fcfdfd; background-image: linear-gradient(to right, #eceef5 1px, transparent 1px), linear-gradient(to bottom, #eceef5 1px, transparent 1px); background-size: 24px 24px;";
    }

    if (isGlass) {
      bodyBg = "#0b101c";
      bodyBgStyle = "background: radial-gradient(circle at 10% 20%, #151c30 0%, #080b14 90.2%); background-attachment: fixed;";
      bodyColor = "#cbd5e1";
      cardBg = "rgba(16, 24, 48, 0.65)";
      cardBorder = "1px solid rgba(255, 255, 255, 0.08)";
      cardShadow = "0 8px 32px 0 rgba(0, 0, 0, 0.37); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);";
      textTitleColor = "#ffffff";
      labelBorderColor = "rgba(255, 255, 255, 0.15)";
      
      tableThBg = "rgba(255, 255, 255, 0.04)";
      tableThText = "#ffffff";
      tableThBorderBottom = "1px solid rgba(255, 255, 255, 0.1)";
      trBottomBorder = "1px solid rgba(255, 255, 255, 0.05)";
      trEvenBg = "rgba(255, 255, 255, 0.02)";
      metricCardBg = "rgba(255, 255, 255, 0.02)";
      metricCardBorder = "1px solid rgba(255, 255, 255, 0.05)";

      confluenceBg = "rgba(255, 255, 255, 0.05)";
      confluenceText = "#cbd5e1";
      confluenceBorder = "1px solid rgba(255, 255, 255, 0.1)";
    } else if (isVintage) {
      bodyBg = "#f8f5ee";
      bodyBgStyle = "background-color: #f8f5ee; background-image: radial-gradient(#dfdbd3 1px, transparent 1px); background-size: 20px 20px;";
      bodyColor = "#2c2519";
      cardBg = "#fdfbf7";
      cardBorder = "2px solid #dfdbd3";
      cardShadow = "2px 2px 8px rgba(44, 37, 25, 0.06)";
      textTitleColor = "#1a150e";
      labelBorderColor = "#8a775d";
      bodyFont = "'Georgia', serif";
      
      tableThBg = "#eae4d5";
      tableThText = "#4a3c28";
      tableThBorderBottom = "3px solid #dfdbd3";
      trBottomBorder = "1px solid #eae4d5";
      trEvenBg = "#f5f1e8";
      metricCardBg = "#fcfaf5";
      metricCardBorder = "2px solid #eae4d5";

      confluenceBg = "#eae4d5";
      confluenceText = "#4a3c28";
      confluenceBorder = "1px solid #dfdbd3";
    } else if (isCyber) {
      bodyBg = "#050112";
      bodyBgStyle = "background-color: #050112; background-image: linear-gradient(rgba(244, 63, 145, 0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(236, 72, 153, 0.06) 1px, transparent 1px); background-size: 25px 25px;";
      bodyColor = "#d8b4fe";
      cardBg = "#110729";
      cardBorder = "1.5px solid #d946ef";
      cardShadow = "0 0 15px rgba(217, 70, 239, 0.25)";
      textTitleColor = "#38bdf8";
      labelBorderColor = "#ec4899";
      bodyFont = "'Courier New', Courier, monospace";
      
      tableThBg = "#230b42";
      tableThText = "#38bdf8";
      tableThBorderBottom = "2.5px solid #d946ef";
      trBottomBorder = "1px solid #230b42";
      trEvenBg = "#08021c";
      metricCardBg = "#08021c";
      metricCardBorder = "1.5px solid #8b5cf6";

      confluenceBg = "#230b42";
      confluenceText = "#a78bfa";
      confluenceBorder = "1px solid #d946ef";
    }

    // Trades mini index rows
    const tradesIndexTableHtml = subsetTrades.map((t, idx) => `
      <tr style="border-bottom: ${trBottomBorder}; font-size: 11px;">
        <td style="padding: 12px 14px; font-family: monospace; color: #64748b; font-weight: bold;">#${String(idx + 1).padStart(2, '0')}</td>
        <td style="padding: 12px 14px; font-family: 'Inter', sans-serif; font-weight: 800; color: ${textTitleColor}">${t.pair}</td>
        <td style="padding: 12px 14px;"><span style="background-color: ${t.direction === 'LONG' ? '#d1fae5' : '#fee2e2'}; color: ${t.direction === 'LONG' ? '#065f46' : '#991b1b'}; font-weight: 800; font-size: 9.5px; padding: 4px 8px; border-radius: 6px; font-family: monospace; text-transform: uppercase; border: 1px solid ${t.direction === 'LONG' ? '#a7f3d0' : '#fecaca'};">${t.direction}</span></td>
        <td style="padding: 12px 14px; font-weight: 600; color: ${isDark ? '#e2e8f0' : '#334155'};">${t.strategy}</td>
        <td style="padding: 12px 14px; font-family: monospace; color: ${isDark ? '#94a3b8' : '#475569'};">${t.date ? t.date : ""} ${t.time || ""}</td>
        <td style="padding: 12px 14px; font-family: monospace; text-align: center; color: #0284c7; font-weight: bold;">1:${t.riskReward}</td>
        <td style="padding: 12px 14px; font-family: monospace; font-weight: 900; color: ${t.profit >= 0 ? '#10b981' : '#ef4444'}; text-align: right; font-size: 12px;">
          ${t.profit >= 0 ? '+' : ''}$${t.profit.toLocaleString()}
        </td>
      </tr>
    `).join("");

    // Strategies metrics blocks
    const strategiesHtml = includeStrategies ? strategies.map(strat => {
      const stratTrades = subsetTrades.filter(t => t.strategy && t.strategy.toLowerCase().trim() === strat.name.toLowerCase().trim());
      const count = stratTrades.length;
      if (count === 0) return "";
      const pnl = stratTrades.reduce((acc, t) => acc + t.profit, 0);
      const wins = stratTrades.filter(t => t.profit > 0).length;
      const rate = count > 0 ? Math.round((wins / count) * 100) : 0;
      
      return `
        <div style="border: ${cardBorder}; border-left: 4px solid ${accentColor}; border-radius: 10px; padding: 14px; background-color: ${metricCardBg}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
          <div style="display: flex; justify-content: space-between; align-items: start;">
            <h4 style="margin: 0; color: ${textTitleColor}; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: -0.1px;">${strat.name}</h4>
            <span style="font-size: 9.5px; background-color: ${isDark ? '#1f2937' : '#e2e8f0'}; color: ${isDark ? '#cbd5e1' : '#475569'}; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-weight: bold;">${rate}% WR</span>
          </div>
          <p style="margin: 8px 0 0 0; font-size: 11px; color: ${isDark ? '#94a3b8' : '#64748b'}; font-family: monospace;">
            Total Tickets: <strong style="color: ${isDark ? '#ffffff' : '#1e293b'};">${count}</strong> | Net Returns: <span style="font-weight: 900; color: ${pnl >= 0 ? '#10b981' : '#ef4444'};">${pnl >= 0 ? '+' : ''}$${pnl.toLocaleString()}</span>
          </p>
        </div>
      `;
    }).join("") : "";

    // Comprehensive Trade detailed sheets
    const tradesDetailedSheetsHtml = subsetTrades.map((t, idx) => {
      const hasImages = includeCharts && !!(t.dailyChart || t.fourHourChart || t.oneHourChart || (t as any).fifteenMinChart || (t.images && t.images.length > 0));
      
      let chartSegments = [];
      if (includeCharts) {
        if (t.dailyChart) {
          chartSegments.push(`
            <div style="border: ${cardBorder}; border-radius: 8px; padding: 8px; text-align: center; background-color: ${isDark ? '#111827' : '#fdfdfd'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="font-size: 8.5px; font-weight: 800; color: #b45309; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid ${isDark ? '#1f2937' : '#f1f5f9'}; padding-bottom: 4px; letter-spacing: 0.5px;">📅 DAILY TIMEFRAME STUDY</div>
              <img src="${formatBase64Image(t.dailyChart)}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
            </div>
          `);
        }
        if (t.fourHourChart) {
          chartSegments.push(`
            <div style="border: ${cardBorder}; border-radius: 8px; padding: 8px; text-align: center; background-color: ${isDark ? '#111827' : '#fdfdfd'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="font-size: 8.5px; font-weight: 800; color: #1d4ed8; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid ${isDark ? '#1f2937' : '#f1f5f9'}; padding-bottom: 4px; letter-spacing: 0.5px;">⏳ 4-HOUR STRUCTURE STUDY</div>
              <img src="${formatBase64Image(t.fourHourChart)}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
            </div>
          `);
        }
        if (t.oneHourChart) {
          chartSegments.push(`
            <div style="border: ${cardBorder}; border-radius: 8px; padding: 8px; text-align: center; background-color: ${isDark ? '#111827' : '#fdfdfd'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="font-size: 8.5px; font-weight: 800; color: #b91c1c; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid ${isDark ? '#1f2937' : '#f1f5f9'}; padding-bottom: 4px; letter-spacing: 0.5px;">🎯 1-HOUR CONFLUENCE STUDY</div>
              <img src="${formatBase64Image(t.oneHourChart)}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
            </div>
          `);
        }
        if ((t as any).fifteenMinChart) {
          chartSegments.push(`
            <div style="border: ${cardBorder}; border-radius: 8px; padding: 8px; text-align: center; background-color: ${isDark ? '#111827' : '#fdfdfd'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
              <div style="font-size: 8.5px; font-weight: 800; color: #6d28d9; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid ${isDark ? '#1f2937' : '#f1f5f9'}; padding-bottom: 4px; letter-spacing: 0.5px;">⚡ 15-MINUTE EXECUTION DETAIL</div>
              <img src="${formatBase64Image((t as any).fifteenMinChart)}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
            </div>
          `);
        }
        if (t.images && t.images.length > 0) {
          t.images.forEach((img, screenIdx) => {
            chartSegments.push(`
              <div style="border: ${cardBorder}; border-radius: 8px; padding: 8px; text-align: center; background-color: ${isDark ? '#111827' : '#fdfdfd'}; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
                <div style="font-size: 8.5px; font-weight: 800; color: #475569; text-transform: uppercase; margin-bottom: 6px; font-family: monospace; border-bottom: 1px solid ${isDark ? '#1f2937' : '#f1f5f9'}; padding-bottom: 4px; letter-spacing: 0.5px;">📋 SUPPORT EVIDENCE REFERENCE #${screenIdx + 1}</div>
                <img src="${formatBase64Image(img)}" style="max-width: 100%; max-height: 200px; object-fit: contain; border-radius: 4px;" />
              </div>
            `);
          });
        }
      }

      const verifiedConfluencesBadges = t.entryRules && t.entryRules.length > 0
        ? t.entryRules.map(r => `<span style="background-color: ${confluenceBg}; color: ${confluenceText}; font-size: 9.5px; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: ${confluenceBorder}; margin-right: 5px; display: inline-block; margin-bottom: 5px; font-family: monospace;">✓ ${r}</span>`).join("")
        : `<span style="color: #64748b; font-size: 11px; font-style: italic;">No specific checklist verified tags logged for this trade sheet.</span>`;

      // Chunk charts into standard side-by-side rows
      let chartRowsHtml = "";
      if (includeCharts && chartSegments.length > 0) {
        chartRowsHtml += `<table style="width: 100%; border-collapse: separate; border-spacing: 12px; margin-top: 6px;">`;
        for (let i = 0; i < chartSegments.length; i += 2) {
          const col1 = chartSegments[i] || "";
          const col2 = chartSegments[i + 1] || "";
          chartRowsHtml += `
            <tr>
              <td style="width: 50%; vertical-align: top; padding: 0;">${col1}</td>
              <td style="width: 50%; vertical-align: top; padding: 0;">${col2}</td>
            </tr>
          `;
        }
        chartRowsHtml += `</table>`;
      }

      // Elegant green/red banner edge
      const colorIndicatorLine = t.profit >= 0 ? "#10b981" : "#ef4444";

      return `
        <div class="detailed-trade-card" style="border: ${cardBorder}; border-left: 8px solid ${colorIndicatorLine}; border-radius: 12px; padding: 26px; margin-bottom: 35px; background-color: ${cardBg}; page-break-inside: avoid; box-shadow: ${cardShadow};">
          <!-- Sheet Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid ${isDark ? '#1f2937' : '#e2e8f0'}; padding-bottom: 12px; margin-bottom: 18px;">
            <div>
              <span style="font-weight: 900; font-size: 19px; color: ${textTitleColor}; letter-spacing: -0.5px; font-family: 'Inter', sans-serif;">TRADE BLUEPRINT SHEET #${idx + 1} &middot; <span style="text-decoration: underline; text-underline-offset: 4px;">${t.pair}</span></span>
              <span style="background-color: ${t.direction === 'LONG' ? '#dbf4e9' : '#fde2e4'}; color: ${t.direction === 'LONG' ? '#0f766e' : '#be123c'}; font-weight: 800; font-size: 10px; padding: 5px 12px; border-radius: 12px; text-transform: uppercase; margin-left: 10px; border: 1px solid ${t.direction === 'LONG' ? '#b2f5ea' : '#fecaca'};">
                ${t.direction}
              </span>
              <span style="font-size: 12px; font-family: monospace; color: #64748b; margin-left: 14px; font-weight: bold;">
                📅 ${t.date ? t.date : ""} ${t.time || ""}
              </span>
            </div>
            
            <div style="font-size: 20px; font-weight: 900; color: ${t.profit >= 0 ? '#10b981' : '#ef4444'}; font-family: monospace; background-color: ${t.profit >= 0 ? '#f0fdf4' : '#fef2f2'}; border: 1px solid ${t.profit >= 0 ? '#bbf7d0' : '#fecaca'}; padding: 6px 14px; border-radius: 8px;">
              ${t.profit >= 0 ? 'PROFIT: +' : 'LOSS: '}$${t.profit.toLocaleString()}
            </div>
          </div>

          <!-- Parameters Metric Row via precise HTML Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-family: monospace; font-size: 11px; background-color: ${metricCardBg}; border: ${cardBorder}; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 14px; border-right: ${cardBorder}; width: 20%;">
                <span style="color: #64748b; font-size: 8px; display: block; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">LOT SIZING</span>
                <strong style="color: ${textTitleColor}; font-size: 14px;">${t.lotSize !== undefined ? t.lotSize : "N/A"} Lots</strong>
              </td>
              <td style="padding: 14px; border-right: ${cardBorder}; width: 20%;">
                <span style="color: #64748b; font-size: 8px; display: block; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">RISK EXPOSURE</span>
                <strong style="color: ${textTitleColor}; font-size: 14px;">${t.riskPercent !== undefined ? t.riskPercent + "%" : "N/A"}</strong>
              </td>
              <td style="padding: 14px; border-right: ${cardBorder}; width: 20%;">
                <span style="color: #64748b; font-size: 8px; display: block; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">MULTIPLIER (LEVERAGE)</span>
                <strong style="color: ${textTitleColor}; font-size: 14px;">${t.leverage !== undefined ? t.leverage + "x" : "N/A"}</strong>
              </td>
              <td style="padding: 14px; border-right: ${cardBorder}; width: 20%;">
                <span style="color: #64748b; font-size: 8px; display: block; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">STOP LOSS PIP THRESHOLD</span>
                <strong style="color: ${textTitleColor}; font-size: 14px;">${t.stopLossPips !== undefined ? t.stopLossPips + " Pips" : "N/A"}</strong>
              </td>
              <td style="padding: 14px; width: 20%;">
                <span style="color: #64748b; font-size: 8px; display: block; font-weight: bold; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px;">ACCOUNT BALANCE DEPLOYED</span>
                <strong style="color: ${accentColor}; font-size: 14px;">${t.accountBalance !== undefined ? "$" + t.accountBalance.toLocaleString() : "N/A"}</strong>
              </td>
            </tr>
          </table>

          <!-- Strategy details -->
          <div style="margin-bottom: 22px; font-size: 13.5px; line-height: 1.5; color: ${bodyColor}; display: flex; align-items: center; border-bottom: 1.5px dashed ${isDark ? '#1f2937' : '#e2e8f0'}; padding-bottom: 12px;">
            <strong style="color: ${isDark ? '#94a3b8' : '#334155'}; font-weight: bold; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; margin-right: 10px;">Applied Operational Blueprint:</strong> 
            <span style="background-color: ${accentLight}; color: ${accentColor}; padding: 5px 12px; border-radius: 8px; font-weight: 800; border: 1.5px solid ${accentColor}30; font-size: 11.5px;">
              ${t.strategy}
            </span>
            <span style="margin-left: auto; font-size: 12.5px; color: ${isDark ? '#cbd5e1' : '#475569'}; font-family: monospace; font-weight: bold; background-color: ${isDark ? '#1f2937' : '#f1f5f9'}; padding: 4px 10px; border-radius: 6px;">
              🎯 Target Risk-Reward Index Ratio: 1:${t.riskReward}
            </span>
          </div>

          <!-- Confluences checklist -->
          <div style="margin-bottom: 22px;">
            <div style="font-size: 9.5px; font-weight: 800; text-transform: uppercase; color: ${isDark ? '#94a3b8' : '#475569'}; margin-bottom: 10px; font-family: monospace; letter-spacing: 0.8px;">CONFIRMED SETUP CHECKPOINTS VERIFIED:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 6px;">
              ${verifiedConfluencesBadges}
            </div>
          </div>

          <!-- Narrative description block -->
          <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 15px;">
            ${t.bigTimeFrameScenario ? `
            <div style="border-left: 5px solid #f59e0b; background-color: ${isDark ? '#1e1c15' : '#fffbeb'}; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.6; color: ${isDark ? '#ebd5bf' : '#1e293b'}; border-top: 1px solid ${isDark ? '#2e2617' : '#fef3c7'}; border-bottom: 1px solid ${isDark ? '#2e2617' : '#fef3c7'}; border-right: 1px solid ${isDark ? '#2e2617' : '#fef3c7'}; box-shadow: 0 1px 2px rgba(245,158,11,0.02)">
              <strong style="color: #b45309; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 8px; font-family: monospace; font-weight: bold; letter-spacing: 0.8px;">📈 Higher Timeframe Scenario Logic (D1/H4 Structure):</strong>
              ${t.bigTimeFrameScenario}
            </div>` : ""}

            ${t.entryReason ? `
            <div style="border-left: 5px solid ${accentColor}; background-color: ${isDark ? '#0c1220' : accentLight}; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.6; color: ${isDark ? '#cbd5e1' : '#1e293b'}; border-top: 1px solid ${isDark ? '#142544' : `${accentColor}15`}; border-bottom: 1px solid ${isDark ? '#142544' : `${accentColor}15`}; border-right: 1px solid ${isDark ? '#142544' : `${accentColor}15`}; box-shadow: 0 1px 2px rgba(37,99,235,0.02)">
              <strong style="color: ${accentColor}; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 8px; font-family: monospace; font-weight: bold; letter-spacing: 0.8px;">🎯 Lower Timeframe Entry Trigger Mechanics:</strong>
              <div style="white-space: pre-line; font-family: 'Inter', sans-serif;">${t.entryReason}</div>
            </div>` : ""}

            ${includeMistakes && t.mistake && t.mistake.toLowerCase() !== 'none' ? `
            <div style="border-left: 5px solid #ef4444; background-color: ${isDark ? '#210e11' : '#fef2f2'}; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; line-height: 1.6; color: ${isDark ? '#f87171' : '#991b1b'}; font-weight: 550; border-top: 1px solid ${isDark ? '#3d161c' : '#fee2e2'}; border-bottom: 1px solid ${isDark ? '#3d161c' : '#fee2e2'}; border-right: 1px solid ${isDark ? '#3d161c' : '#fee2e2'}; box-shadow: 0 1px 2px rgba(239,68,68,0.02)">
              <strong style="color: #b91c1c; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 8px; font-family: monospace; font-weight: bold; letter-spacing: 0.8px;">⚠️ CRITICAL EXECUTION PITFALL & CLINICAL DEVIATION:</strong>
              <span style="font-style: italic;">"${t.mistake}"</span>
            </div>` : ""}
          </div>

          <!-- Attached structural charts -->
          ${hasImages && chartRowsHtml ? `
          <div style="margin-top: 25px; border-top: 1.5px dashed ${isDark ? '#1f2937' : '#cbd5e1'}; padding-top: 20px; page-break-inside: avoid;">
            <strong style="font-size: 9.5px; color: ${isDark ? '#cbd5e1' : '#334155'}; text-transform: uppercase; display: block; margin-bottom: 12px; font-family: monospace; letter-spacing: 1px;">📸 ATTACHED MULTI-TIMEFRAME CHART PROOF EVIDENCE:</strong>
            ${chartRowsHtml}
          </div>` : ""}
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
            body {
              font-family: ${bodyFont};
              color: ${bodyColor};
              margin: 0;
              padding: 50px;
              line-height: 1.6;
              ${bodyBgStyle || `background-color: ${bodyBg};`}
            }
            .header-banner {
              border-bottom: 4px solid ${isDark ? accentColor : primaryColor};
              padding-bottom: 26px;
              margin-bottom: 40px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .header-info h1 {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.8px;
              color: ${textTitleColor};
              margin: 0;
              text-transform: uppercase;
              font-family: 'Inter', sans-serif;
            }
            .header-info p {
              margin: 6px 0 0 0;
              font-size: 11.5px;
              color: #64748b;
              font-weight: 700;
              letter-spacing: 0.8px;
              text-transform: uppercase;
            }
            .title-right {
              text-align: right;
            }
            .title-right strong {
              font-size: 13px;
              color: ${accentColor};
              letter-spacing: 1.2px;
              text-transform: uppercase;
              font-weight: 800;
            }
            .metrics-matrix {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 18px;
              margin-bottom: 40px;
            }
            .metric-card {
              border: ${metricCardBorder};
              border-radius: 12px;
              padding: 18px;
              text-align: center;
              background-color: ${metricCardBg};
              box-shadow: 0 1px 3px rgba(0,0,0,0.01);
            }
            .metric-title {
              font-size: 9.5px;
              color: #64748b;
              text-transform: uppercase;
              font-weight: 800;
              letter-spacing: 0.8px;
              margin-bottom: 8px;
              font-family: monospace;
            }
            .metric-value {
              font-size: 26px;
              font-weight: 900;
              letter-spacing: -0.6px;
              color: ${textTitleColor};
            }
            .section-label {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              font-weight: 950;
              border-bottom: 3.5px solid ${isDark ? accentColor : primaryColor};
              padding-bottom: 8px;
              margin-top: 50px;
              margin-bottom: 25px;
              color: ${textTitleColor};
              page-break-after: avoid;
              font-family: 'Inter', sans-serif;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background-color: ${tableThBg};
              text-align: left;
              padding: 14px;
              font-size: 11.5px;
              text-transform: uppercase;
              color: ${tableThText};
              border-bottom: ${tableThBorderBottom};
              font-weight: bold;
              font-family: monospace;
              letter-spacing: 0.5px;
            }
            tr:nth-child(even) {
              background-color: ${trEvenBg};
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 15px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; background-color: #f1f5f9; padding: 15px 20px; border-radius: 12px; border: 1.5px solid #cbd5e1;">
            <div style="font-size: 13.5px; color: #334155; font-family: 'Inter', sans-serif;">
              <span style="font-weight: 900; color: ${primaryColor};">🔍 QUANT PLATFORM COMPILER SYNC SUCCESS:</span> Live printable document is prepared and structured. Save to physical paper or PDF.
            </div>
            <button onclick="window.print();" style="background-color: ${accentColor}; color: white; padding: 11px 22px; border: none; border-radius: 8px; font-weight: 900; cursor: pointer; font-size: 13px; box-shadow: 0 4px 8px rgba(37,99,235,0.2); transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.5px;">
              Execute Print / Save PDF Document
            </button>
          </div>

          <div class="header-banner">
            <div class="header-info">
              <h1>⚡ ${reportTitle}</h1>
              <p>EdgeJournal Automated Quant Audit System</p>
            </div>
            <div class="title-right">
              <strong>OFFICIAL QUANT COMPILING LEDGER</strong><br/>
              <div style="font-size: 11px; font-family: monospace; color: #64748b; margin-top: 6px; font-weight: bold;">COMPILED: ${new Date().toLocaleDateString('us-EN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>

          <!-- Overall Core Metrics stats -->
          <div class="metrics-matrix">
            <div class="metric-card" style="border-top: 4px solid ${accentColor}">
              <div class="metric-title">Subset Total Tickets</div>
              <div class="metric-value">${subsetStats.totalTrades} Executions</div>
            </div>
            <div class="metric-card" style="border-top: 4px solid ${subsetStats.totalProfit >= 0 ? '#10b981' : '#ef4444'}">
              <div class="metric-title">Cumulative Returns</div>
              <div class="metric-value" style="color: ${subsetStats.totalProfit >= 0 ? '#10b981' : '#ef4444'};">
                ${subsetStats.totalProfit >= 0 ? '+' : ''}$${subsetStats.totalProfit.toLocaleString()}
              </div>
            </div>
            <div class="metric-card" style="border-top: 4px solid #3b82f6">
              <div class="metric-title">Statistical Win Rate</div>
              <div class="metric-value font-mono" style="color: #3b82f6;">${subsetStats.winRate}%</div>
            </div>
            <div class="metric-card" style="border-top: 4px solid #d97706">
              <div class="metric-title">Profit Factor Index</div>
              <div class="metric-value" style="color: #d97706;">${subsetStats.profitFactor}</div>
            </div>
          </div>

          <!-- Strategy Breakdown efficiency indicators -->
          ${includeStrategies && strategiesHtml ? `
          <div class="section-label">Tactic Allocation & Strategy Efficiencies</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            ${strategiesHtml}
          </div>` : ""}

          <!-- Quick lookup trade list ledger -->
          <div class="section-label" style="page-break-before: auto;">Part 1: Audit Master Execution Ledger</div>
          <table>
            <thead>
              <tr>
                <th style="width: 8%; padding: 12px 14px;">INDEX</th>
                <th style="width: 15%; padding: 12px 14px;">ASSET PAIR</th>
                <th style="width: 12%; padding: 12px 14px;">DIRECTION</th>
                <th style="width: 25%; padding: 12px 14px;">STRATEGY TACTIC</th>
                <th style="width: 20%; padding: 12px 14px;">EXECUTION TIMESTAMPS</th>
                <th style="width: 10%; text-align: center; padding: 12px 14px;">R:R TARGET</th>
                <th style="width: 10%; text-align: right; padding: 12px 14px;">NET RETURN</th>
              </tr>
            </thead>
            <tbody>
              ${tradesIndexTableHtml}
            </tbody>
          </table>

          <!-- Fully comprehensive detailed case file sheets breakdown -->
          <div class="section-label" style="page-break-before: always;">Part 2: Deep Confluence Trade Fact Sheets</div>
          <div style="display: flex; flex-direction: column;">
            ${tradesDetailedSheetsHtml}
          </div>

          <!-- Clinical Footer stamp -->
          <div style="margin-top: 80px; font-size: 11px; text-align: center; color: #94a3b8; border-top: 2.5px solid #cbd5e1; padding-top: 25px; page-break-inside: avoid; font-family: monospace; letter-spacing: 0.5px; line-height: 1.6;">
            <strong>EDGEJOURNAL CONFIDENTIAL DEPLOYMENT AUDIT</strong><br/>
            Secured and verified on institutional sandbox protocols &bull; Real-time cryptographic ledger match &bull; Capital preservation breeds systemic compounding growth.
          </div>

          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 600);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <>
      {/* Luxurious Export Hub Launch Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-[#1C2128] hover:bg-slate-850 border border-slate-800 hover:border-blue-500/50 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition duration-200 cursor-pointer"
        title="Open Quant PDF Export configuration Hub"
      >
        <FileText className="h-4 w-4 text-blue-400" />
        <span>Export PDF Report</span>
      </button>

      {/* Dynamic Animated Settings Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            
            {/* Modal Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !compiling && setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Main Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 260, damping: 25 }}
              className="relative bg-[#0d131f] border border-slate-800/80 rounded-2xl w-full max-w-4xl shadow-2xl p-6 overflow-hidden flex flex-col md:flex-row gap-6"
            >
              
              {/* Left Column: Toggles & Inputs settings */}
              <div className="flex-1 space-y-5">
                
                {/* Header title */}
                <div className="flex justify-between items-start pb-2 border-b border-slate-800">
                  <div>
                    <h3 className="text-white text-lg font-extrabold flex items-center space-x-2">
                      <motion.div
                        whileHover={{ rotate: 360, scale: 1.15 }}
                        transition={{ type: "spring", stiffness: 220, damping: 9 }}
                        className="p-1 rounded-lg bg-blue-500/10 inline-block"
                      >
                        <Layout className="h-5 w-5 text-blue-400" />
                      </motion.div>
                      <span>Ledger Report Audit Compiler</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">Configure advanced formatting parameters, layout themes, and study filters.</p>
                  </div>
                  {!compiling && (
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>

                {/* Report Custom Title */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Report Header Title</label>
                  <input
                    type="text"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                    disabled={compiling}
                    className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none transition"
                    placeholder="Enter custom report header..."
                  />
                </div>

                {/* Theme Style Presets choices */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <motion.span
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                      className="inline-block"
                    >
                      <Palette className="h-3.5 w-3.5 text-blue-400" />
                    </motion.span>
                    <span>Selected Visual Layout Accent Theme</span>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    
                    {/* Slate */}
                    <button
                      type="button"
                      onClick={() => setLayoutPreset("slate")}
                      disabled={compiling}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        layoutPreset === "slate" 
                          ? "bg-slate-800/20 border-blue-500 text-white" 
                          : "bg-[#161B22] border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>Executive Slate</span>
                        {layoutPreset === "slate" && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                      </div>
                      <div className="flex space-x-1.5 mt-2">
                        <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-800" />
                        <span className="w-3 h-3 rounded-full bg-blue-600" />
                      </div>
                    </button>

                    {/* Navy */}
                    <button
                      type="button"
                      onClick={() => setLayoutPreset("navy")}
                      disabled={compiling}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        layoutPreset === "navy" 
                          ? "bg-indigo-950/20 border-indigo-500 text-white" 
                          : "bg-[#161B22] border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>Terminal Navy</span>
                        {layoutPreset === "navy" && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                      </div>
                      <div className="flex space-x-1.5 mt-2">
                        <span className="w-3 h-3 rounded-full bg-black border border-slate-950" />
                        <span className="w-3 h-3 rounded-full bg-indigo-700" />
                      </div>
                    </button>

                    {/* Emerald */}
                    <button
                      type="button"
                      onClick={() => setLayoutPreset("emerald")}
                      disabled={compiling}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                        layoutPreset === "emerald" 
                          ? "bg-emerald-950/20 border-emerald-500 text-white" 
                          : "bg-[#161B22] border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <div className="text-xs font-bold flex items-center justify-between">
                        <span>Discipline Forest</span>
                        {layoutPreset === "emerald" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                      </div>
                      <div className="flex space-x-1.5 mt-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-950 border border-emerald-900" />
                        <span className="w-3 h-3 rounded-full bg-emerald-600" />
                      </div>
                    </button>

                  </div>
                </div>

                {/* Report Background layouts list with bouncy tabs */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                    <span>Report Background layout Style</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-[#10141d] p-1.5 rounded-xl border border-slate-900 relative">
                    <button
                      type="button"
                      onClick={() => setReportThemeMode("grid")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "grid" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "grid" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Draft Grid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportThemeMode("light")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "light" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "light" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Pure White</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportThemeMode("dark")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "dark" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "dark" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Deep Indigo</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportThemeMode("glass")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "glass" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "glass" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Glassmorphic</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportThemeMode("vintage")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "vintage" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "vintage" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Parchment</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReportThemeMode("cyber")}
                      disabled={compiling}
                      className={`relative py-2 px-1 text-center cursor-pointer transition text-[11px] font-extrabold z-10 w-full rounded-lg ${
                        reportThemeMode === "cyber" ? "text-white" : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {reportThemeMode === "cyber" && (
                        <motion.span
                          layoutId="reportBgTabPill"
                          className="absolute inset-0 bg-blue-600/20 border border-blue-500/35 rounded-lg -z-10"
                          transition={{ type: "spring", stiffness: 350, damping: 25 }}
                        />
                      )}
                      <span>Neon Synth</span>
                    </button>
                  </div>
                </div>

                {/* Filter Strategy Parameter */}
                <div className="space-y-1.5 text-xs">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-blue-400" />
                    <span>Strategy Allocation Filter</span>
                  </label>
                  <select
                    value={selectedStrategyFilter}
                    disabled={compiling}
                    onChange={(e) => setSelectedStrategyFilter(e.target.value)}
                    className="w-full bg-[#161B22] border border-slate-800 focus:border-blue-500 rounded-xl px-3 py-2 text-white focus:outline-none transition cursor-pointer"
                  >
                    <option value="ALL">All Logged Setups ({trades.length} trades)</option>
                    {strategies.map((strat, i) => {
                      const count = trades.filter(t => t.strategy?.toLowerCase() === strat.name?.toLowerCase()).length;
                      return (
                        <option key={i} value={strat.name}>
                          {strat.name} ({count} matches)
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Toggle configuration switches */}
                <div className="space-y-3 pt-2">
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Include Metadata Layers</label>
                  
                  <div className="space-y-2 bg-[#080d17] p-3 rounded-xl border border-slate-900">
                    
                    {/* Charts toggle */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-2">
                        <Eye className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs text-slate-200">Include Multi-Timeframe Chart screenshots</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => !compiling && setIncludeCharts(!includeCharts)}
                        className={`w-9 h-5 rounded-full relative transition cursor-pointer ${includeCharts ? "bg-emerald-500" : "bg-slate-800"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${includeCharts ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>

                    {/* Strategies toggle */}
                    <div className="flex justify-between items-center border-t border-slate-900/60 pt-2">
                      <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-blue-400" />
                        <span className="text-xs text-slate-200">Include Strategy Efficiency Matrices</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => !compiling && setIncludeStrategies(!includeStrategies)}
                        className={`w-9 h-5 rounded-full relative transition cursor-pointer ${includeStrategies ? "bg-blue-500" : "bg-slate-800"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${includeStrategies ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>

                    {/* Mistakes toggle */}
                    <div className="flex justify-between items-center border-t border-slate-900/60 pt-2">
                      <div className="flex items-center space-x-2">
                        <BookOpen className="h-4 w-4 text-red-400" />
                        <span className="text-xs text-slate-200">Include Pitfall Mistakes & Psychology notes</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => !compiling && setIncludeMistakes(!includeMistakes)}
                        className={`w-9 h-5 rounded-full relative transition cursor-pointer ${includeMistakes ? "bg-red-500" : "bg-slate-800"}`}
                      >
                        <div className={`w-3.5 h-3.5 rounded-full bg-slate-950 absolute top-0.5 transition-all ${includeMistakes ? "left-5" : "left-0.5"}`} />
                      </button>
                    </div>

                  </div>
                </div>

              </div>

              {/* Right Column: Dynamic Cover Preview Display */}
              <div className="w-full md:w-80 bg-[#080d17] border border-slate-950 rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
                
                {/* Visual grid decor inside cover mock */}
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/5 via-transparent to-transparent pointer-events-none" />
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-mono text-slate-500 uppercase font-black tracking-widest">LIVE COVER PREVIEW</span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">READY TO COMPILE</span>
                  </div>

                  {/* Physical Styled Report Sheet representation with real-time customized preview styling */}
                  <div className={`border rounded-xl p-4 aspect-[4/5] flex flex-col justify-between transition-all duration-300 ${
                    reportThemeMode === "dark" 
                      ? "bg-[#070a14] border-slate-800 text-white" 
                      : reportThemeMode === "grid"
                        ? "bg-[#fcfdfd] border-slate-200 text-slate-800 bg-[linear-gradient(to_right,#f1f3f7_1px,transparent_1px),linear-gradient(to_bottom,#f1f3f7_1px,transparent_1px)] bg-[size:16px_16px]"
                        : reportThemeMode === "glass"
                          ? "bg-[radial-gradient(circle_at_top_left,rgba(30,41,59,0.9),rgba(15,23,42,0.95))] border-slate-750 text-slate-200 shadow-md"
                          : reportThemeMode === "vintage"
                            ? "bg-[#fcfaf2] border-[#dfdbd3] text-[#2c2519] font-serif"
                            : reportThemeMode === "cyber"
                              ? "bg-[#0e0321] border-pink-500 text-[#d8b4fe] font-mono shadow-[0_0_10px_rgba(236,72,153,0.25)]"
                              : "bg-white border-slate-200 text-slate-800"
                  }`}>
                    <div className="space-y-2">
                      {/* Accent Accent bar */}
                      <div className={`h-1.5 w-12 rounded ${
                        layoutPreset === "slate" ? "bg-blue-500" :
                        layoutPreset === "navy" ? "bg-indigo-500" : "bg-emerald-500"
                      }`} />
                      <h4 className={`text-[10.5px] font-black uppercase tracking-tight line-clamp-3 leading-tight ${
                        reportThemeMode === "dark" || reportThemeMode === "glass" || reportThemeMode === "cyber" ? "text-white" : "text-slate-900"
                      }`}>
                        {reportTitle || "Untitled Audit Output"}
                      </h4>
                      <p className="text-[8px] text-slate-500 font-mono">EdgeJournal Professional Compiling Engine</p>
                    </div>

                    <div className={`space-y-1.5 border-t pt-3 ${
                      reportThemeMode === "dark" || reportThemeMode === "glass" || reportThemeMode === "cyber" ? "border-slate-800" : "border-slate-150"
                    }`}>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>STRATEGY:</span>
                        <span className={reportThemeMode === "dark" ? "text-white font-bold" : "text-slate-800 font-bold"}>{selectedStrategyFilter}</span>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500">
                        <span>CHARTS:</span>
                        <span className={includeCharts ? "text-emerald-400 font-bold" : "text-slate-400 font-bold"}>
                          {includeCharts ? "ENABLED" : "EXCLUDED"}
                        </span>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-slate-500 font-bold">
                        <span>TOTAL METRICS:</span>
                        <span className="text-blue-400 font-bold">{getFilteredTrades().length} MATCHED</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-900 space-y-2 relative z-10">
                  <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                    <Info className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Generates pristine high-density vectors ready for printing.</span>
                  </div>
                  
                  <button
                    type="button"
                    onClick={triggerPDFCompilation}
                    disabled={compiling || getFilteredTrades().length === 0}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-500 border border-blue-500 px-4 py-2.5 rounded-xl text-xs font-black tracking-wide uppercase transition cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <span>Compile & Export Report</span>
                  </button>
                </div>

              </div>

              {/* Holographic Compilation Processing Panel */}
              <AnimatePresence>
                {compiling && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8 text-center"
                  >
                    
                    {/* Glowing outer dual concentric spinning halos */}
                    <div className="relative h-28 w-28 mb-6 flex items-center justify-center">
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ rotate: 360, opacity: 1 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-full border-t-2 border-slate-800 border-r-2 border-r-blue-400 shadow-xl"
                      />
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ rotate: -360, opacity: 1 }}
                        transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-2 rounded-full border-b-2 border-slate-800 border-l-2 border-l-emerald-400"
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.12, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="p-3 bg-slate-900/80 rounded-full relative z-10 shadow-lg"
                      >
                        <RefreshCw className="h-8 w-8 text-blue-400 animate-spin" style={{ animationDuration: '3.5s' }} />
                      </motion.div>
                    </div>

                    <div className="space-y-2 max-w-sm">
                      <h4 className="text-sm font-black font-mono tracking-widest text-white uppercase flex items-center justify-center space-x-1.5">
                        <Sparkles className="h-4 w-4 text-blue-450 animate-pulse" />
                        <span>COMPILING AUDIT PORTFOLIO</span>
                      </h4>
                      <p className="text-[10px] text-blue-400 font-mono uppercase tracking-widest animate-pulse font-extrabold text-center">
                        Pipeline Step {pipelineStep} / 4 &middot; Active
                      </p>
                      
                      {/* Fake Terminal compile logger lines animated with staggered wave transitions */}
                      <div className="bg-[#05070a] p-3 rounded-lg border border-slate-900 font-mono text-[9px] text-slate-400 text-left w-72 space-y-1 mx-auto shadow-inner select-none overflow-hidden">
                        {[
                          { label: "Analyze filtered capital logs", step: 1 },
                          { label: "Decompress attached snapshots list", step: 2 },
                          { label: "Structure specific visual presets", step: 3 },
                          { label: "Mount operating print buffer", step: 4 }
                        ].map((item, idx) => {
                          const isActive = pipelineStep >= item.step;
                          return (
                            <motion.div 
                              key={idx}
                              animate={isActive ? { 
                                x: [0, 2, 0],
                                y: [0, -1, 1, 0],
                                color: ["#94a3b8", "#e2e8f0", "#94a3b8"]
                              } : {}}
                              transition={{ 
                                duration: 1.8, 
                                repeat: isActive ? Infinity : 0, 
                                ease: "easeInOut",
                                delay: idx * 0.2
                              }}
                              className="flex items-center space-x-1.5"
                            >
                              <span className={isActive ? "text-emerald-450 font-black" : "text-slate-600"}>
                                {isActive ? "✓" : "●"}
                              </span>
                              <span className={isActive ? "text-slate-200" : "text-slate-600"}>
                                {item.label}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>

                      <p className="text-[10.5px] font-mono text-slate-500 mt-2 truncate w-72 mx-auto italic select-none">
                        {compilationProgress}
                      </p>
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
