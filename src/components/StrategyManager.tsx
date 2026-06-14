import React, { useState } from "react";
import { Strategy, Trade } from "../types";
import { 
  Plus, 
  Trash, 
  BookOpen, 
  Clock, 
  Activity, 
  ArrowLeft, 
  Download, 
  Image as ImageIcon, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  Sparkles,
  X,
  Maximize2
} from "lucide-react";
import { motion } from "motion/react";

interface StrategyManagerProps {
  strategies: Strategy[];
  onAddStrategy: (name: string, description: string) => void;
  onDeleteStrategy: (id: string) => void;
  trades: Trade[];
}

export default function StrategyManager({ strategies, onAddStrategy, onDeleteStrategy, trades }: StrategyManagerProps) {
  const [newStrategyName, setNewStrategyName] = useState("");
  const [newStrategyDesc, setNewStrategyDesc] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedStrategyId, setSelectedStrategyId] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [galleryTrade, setGalleryTrade] = useState<Trade | null>(null);

  // Compute number of trades executed per strategy
  const getStrategyCounts = (stratName: string) => {
    return trades.filter(t => t && t.strategy && t.strategy.toLowerCase() === stratName.toLowerCase()).length;
  };

  const getStrategyNetPnL = (stratName: string) => {
    const stratTrades = trades.filter(t => t && t.strategy && t.strategy.toLowerCase() === stratName.toLowerCase());
    return stratTrades.reduce((acc, t) => acc + (t.profit || 0), 0);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStrategyName) return alert("Write strategy name!");
    
    onAddStrategy(newStrategyName, newStrategyDesc);
    setNewStrategyName("");
    setNewStrategyDesc("");
    setIsAdding(false);
  };

  // Find the selected strategy details
  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);
  
  // Trades specific to the selected strategy
  const strategyTrades = selectedStrategy 
    ? trades.filter(t => t.strategy.toLowerCase() === selectedStrategy.name.toLowerCase()) 
    : [];

  // Helper inside details rendering to format Base64 image
  const formatBase64Image = (imgStr: string | undefined): string => {
    if (!imgStr) return "";
    if (imgStr.startsWith("data:image")) return imgStr;
    return `data:image/png;base64,${imgStr}`;
  };

  // Function to compile and generate a premium PDF of this specific strategy and its trades
  const downloadStrategyPDFReport = (strat: Strategy, stratTrades: Trade[]) => {
    const winTrades = stratTrades.filter(t => t.profit > 0).length;
    const lossTrades = stratTrades.filter(t => t.profit < 0).length;
    const winRate = stratTrades.length > 0 ? Math.round((winTrades / stratTrades.length) * 100) : 0;
    const profitVal = stratTrades.reduce((acc, t) => acc + t.profit, 0);

    const reportWindow = window.open("", "_blank");
    if (!reportWindow) {
      alert("Please allow pop-ups to download the strategy PDF report.");
      return;
    }

    const tradeSheetsHtml = stratTrades.map((t, idx) => {
      // Build confluences HTML
      const flowRulesHtml = t.entryRules && t.entryRules.length > 0
        ? t.entryRules.map(r => `<span style="background-color: #e6fcf5; color: #0ca678; font-size: 9px; padding: 3px 8px; border-radius: 4px; font-weight: bold; margin-right: 4px; border: 1px solid #c3fae8;">✓ ${r}</span>`).join("")
        : `<span style="color: #868e96; font-size: 10px; font-style: italic;">No specific checklist logged</span>`;

      // Build charts HTML
      let chartSegments = [];
      if (t.fourHourChart) {
        chartSegments.push(`
          <div style="text-align: center; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px; background-color: #fff;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 4px; text-transform: uppercase;">4 Hour Chart</div>
            <img src="${formatBase64Image(t.fourHourChart)}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px;" />
          </div>
        `);
      }
      if (t.oneHourChart) {
        chartSegments.push(`
          <div style="text-align: center; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px; background-color: #fff;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 4px; text-transform: uppercase;">1 Hour Chart</div>
            <img src="${formatBase64Image(t.oneHourChart)}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px;" />
          </div>
        `);
      }
      if (t.fifteenMinChart) {
        chartSegments.push(`
          <div style="text-align: center; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px; background-color: #fff;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 4px; text-transform: uppercase;">15 Min Chart</div>
            <img src="${formatBase64Image(t.fifteenMinChart)}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px;" />
          </div>
        `);
      }
      if (t.dailyChart) {
        chartSegments.push(`
          <div style="text-align: center; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px; background-color: #fff;">
            <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 4px; text-transform: uppercase;">Daily Chart</div>
            <img src="${formatBase64Image(t.dailyChart)}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px;" />
          </div>
        `);
      }
      if (t.images && t.images.length > 0) {
        t.images.forEach((img, i) => {
          chartSegments.push(`
            <div style="text-align: center; border: 1px solid #e9ecef; border-radius: 8px; padding: 8px; background-color: #fff;">
              <div style="font-size: 9px; font-weight: bold; color: #495057; margin-bottom: 4px; text-transform: uppercase;">Screenshot #${i + 1}</div>
              <img src="${formatBase64Image(img)}" style="max-width: 100%; max-height: 180px; object-fit: contain; border-radius: 4px;" />
            </div>
          `);
        });
      }

      const chartsGroupHtml = chartSegments.length > 0
        ? `<div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 10px;">${chartSegments.join("")}</div>`
        : `<div style="font-size: 10px; color: #adb5bd; font-style: italic; margin-top: 5px;">No visual screenshot attachments uploaded for this execution.</div>`;

      return `
        <div class="trade-card" style="border: 1px solid #dee2e6; border-radius: 12px; padding: 18px; margin-bottom: 25px; background-color: #fdfdfd; page-break-inside: avoid;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #e9ecef; padding-bottom: 8px; margin-bottom: 10px;">
            <div>
              <span style="font-weight: 800; font-size: 14px; color: #212529;">#${idx + 1} - ${t.pair}</span>
              <span style="background-color: ${t.direction === "LONG" ? "#dbf5ea" : "#fce7eb"}; color: ${t.direction === "LONG" ? "#0ca678" : "#e03131"}; border-radius: 4px; font-size: 10px; font-weight: 800; padding: 2px 7px; margin-left: 8px;">${t.direction}</span>
            </div>
            <div style="font-size: 14px; font-weight: 800; color: ${t.profit >= 0 ? "#0ca678" : "#e03131"};">
              ${t.profit >= 0 ? "+" : ""}$${t.profit.toLocaleString()}
            </div>
          </div>

          <!-- Parameters table & Details -->
          <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; background-color: #f1f3f5; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px;">
            <div><span style="color: #868e96; font-size: 9px; display: block;">DATE / TIME</span><strong>${t.date || "N/A"} ${t.time}</strong></div>
            <div><span style="color: #868e96; font-size: 9px; display: block;">RISK DEPLOYED</span><strong>${t.riskPercent ? t.riskPercent + "%" : "N/A"}</strong></div>
            <div><span style="color: #868e96; font-size: 9px; display: block;">LOT SIZE</span><strong>${t.lotSize ? t.lotSize : "N/A"} Lots</strong></div>
            <div><span style="color: #868e96; font-size: 9px; display: block;">LEVERAGE / R:R</span><strong>${t.leverage ? t.leverage + "x" : "N/A"} / 1:${t.riskReward || "N/A"}</strong></div>
          </div>

          <!-- Entry Logic Badges -->
          <div style="margin-top: 10px;">
            <div style="font-size: 9px; text-transform: uppercase; font-weight: bold; color: #495057; margin-bottom: 4px;">Entry Rules Checklist:</div>
            <div style="display: flex; flex-wrap: wrap; gap: 4px;">
              ${flowRulesHtml}
            </div>
          </div>

          <!-- Trade Narrative commentary -->
          <div style="margin-top: 10px; border-left: 3px solid #228be6; padding-left: 8px; font-size: 11px; line-height: 1.45; color: #343a40;">
            <strong>Setup Narrative:</strong> ${t.entryReason || "No custom logic description provided."}
          </div>

          ${t.bigTimeFrameScenario ? `
          <div style="margin-top: 6px; border-left: 3px solid #fcc419; padding-left: 8px; font-size: 11px; line-height: 1.45; color: #343a40;">
            <strong>HTF Context:</strong> ${t.bigTimeFrameScenario}
          </div>` : ""}

          ${t.mistake && t.mistake.toLowerCase() !== "none" ? `
          <div style="margin-top: 8px; background-color: #fff5f5; border: 1px solid #ffc9c9; border-radius: 6px; padding: 6px 10px; font-size: 11px; color: #c92a2a; display: flex; align-items: center; gap: 6px;">
            <strong>⚠️ Logged Pitfall / Mistake:</strong> ${t.mistake}
          </div>` : ""}

          <!-- Attached charts screenshots -->
          <div style="margin-top: 12px; border-top: 1px dashed #dee2e6; padding-top: 8px;">
            <strong style="font-size: 10px; color: #495057; text-transform: uppercase;">Visual Chart Attachments:</strong>
            ${chartsGroupHtml}
          </div>
        </div>
      `;
    }).join("");

    const totalTradesHtml = `
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 25px;">
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; color: #868e96; text-transform: uppercase;">Executed Tickets</div>
          <div style="font-size: 20px; font-weight: 800; color: #212529;">${stratTrades.length}</div>
        </div>
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; color: #868e96; text-transform: uppercase;">Overall Win Rate</div>
          <div style="font-size: 20px; font-weight: 800; color: #228be6;">${winRate}%</div>
        </div>
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; color: #868e96; text-transform: uppercase;">Wins vs Losses</div>
          <div style="font-size: 20px; font-weight: 800; color: #495057;">${winTrades}W - ${lossTrades}L</div>
        </div>
        <div style="border: 1px solid #dee2e6; border-radius: 8px; padding: 12px; text-align: center;">
          <div style="font-size: 10px; color: #868e96; text-transform: uppercase;">Net Return</div>
          <div style="font-size: 20px; font-weight: 800; color: ${profitVal >= 0 ? "#0ca678" : "#e03131"};">
            ${profitVal >= 0 ? "+" : ""}$${profitVal.toLocaleString()}
          </div>
        </div>
      </div>
    `;

    reportWindow.document.write(`
      <html>
        <head>
          <title>${strat.name} - EdgeJournal Strategic Performance Audit</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #212529;
              margin: 0;
              padding: 40px;
              background-color: #fff;
              line-height: 1.45;
            }
            .no-print-btn {
              background-color: #1c7ed6;
              color: white;
              padding: 10px 18px;
              border: none;
              border-radius: 6px;
              font-weight: bold;
              cursor: pointer;
              font-size: 13px;
              display: inline-flex;
              align-items: center;
              gap: 6px;
              transition: background-color 0.15s;
            }
            .no-print-btn:hover {
              background-color: #1a64a4;
            }
            @media print {
              .no-print {
                display: none !important;
              }
              body {
                padding: 10px !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 25px; text-align: right;">
            <button class="no-print-btn" onclick="window.print();">
              🖨️ Save as PDF / Print Strategic Vault Report
            </button>
          </div>

          <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #212529; padding-bottom: 12px; margin-bottom: 20px;">
            <div>
              <strong style="font-size: 20px; letter-spacing: -0.5px; color: #1a64a4;">⚡ EDGEJOURNAL FRAMEWORK HUB</strong>
              <div style="font-size: 10px; color: #868e96; text-transform: uppercase; margin-top: 3px; font-weight: bold;">Professional Strategic Edge Ledger</div>
            </div>
            <div style="text-align: right; font-size: 11px; font-family: monospace;">
              <strong>Strategic Vault Audit</strong><br/>
              Compiled: ${new Date().toLocaleDateString()}<br/>
              Subject: ${strat.name}
            </div>
          </div>

          <!-- Strategy description metadata -->
          <div style="background-color: #f8f9fa; border: 1.5px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 6px 0; font-size: 15px; color: #1a64a4;">${strat.name}</h2>
            <p style="margin: 0; font-size: 12px; color: #495057; line-height: 1.5;">
              <strong>Execution Blueprint Details:</strong> ${strat.description || "No specific blueprints logged."}
            </p>
          </div>

          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; border-bottom: 1.5px solid #212529; padding-bottom: 4px; color: #212529;">1. Aggregated Success Metrics</h3>
          ${totalTradesHtml}

          <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-top: 30px; margin-bottom: 15px; border-bottom: 1.5px solid #212529; padding-bottom: 4px; color: #212529;">2. Historical Trading Executions (${stratTrades.length} Trades)</h3>
          
          <div style="display: flex; flex-direction: column;">
            ${stratTrades.length > 0 ? tradeSheetsHtml : `<div style="text-align: center; color: #868e96; padding: 40px; border: 1px dashed #dee2e6; border-radius: 8px; font-style: italic; font-size: 12px;">No trade executions registered under this strategy style. Log a trade in the journal ledger to populate this audit.</div>`}
          </div>

          <div style="margin-top: 50px; font-size: 10px; border-top: 1px dashed #dee2e6; padding-top: 15px; text-align: center; color: #868e96;">
            Compiled automatically via EdgeJournal Trading Ledger. Protect capital, cultivate discipline, analyze edge.
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
    reportWindow.document.close();
  };

  return (
    <div className="space-y-6">
      
      {/* 🔮 CUSTOM BACK-BUTTON VIEW FOR SELECTED STRATEGY LOGS */}
      {selectedStrategy ? (
        <div className="space-y-6">
          {/* Detailed Header & Stats Row */}
          <div className="bg-[#161B22] border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <button
                  onClick={() => setSelectedStrategyId(null)}
                  className="p-3 bg-[#0A0E14] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded-2xl transition cursor-pointer"
                >
                  <ArrowLeft className="h-4.5 w-4.5" />
                </button>
                <div>
                  <div className="flex items-center space-x-1.5 text-[10px] text-blue-400 font-extrabold uppercase tracking-widest">
                    <span>Strategy Vault Detail</span>
                    <Sparkles className="h-3 w-3 text-yellow-400" />
                  </div>
                  <h3 className="text-white font-black text-xl tracking-tight mt-0.5">{selectedStrategy.name}</h3>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => downloadStrategyPDFReport(selectedStrategy, strategyTrades)}
                  className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer shadow-lg shadow-emerald-950/20"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Strategy PDF Report</span>
                </button>

                <button
                  onClick={() => setSelectedStrategyId(null)}
                  className="px-4 py-2.5 bg-[#1C2128] hover:bg-[#282E37] border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Back to Vault
                </button>
              </div>
            </div>

            {/* Strategy blueprints block */}
            <div className="bg-[#0A0E14] border border-slate-800/80 p-4.5 rounded-2xl">
              <h4 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center space-x-1 mb-1.5">
                <BookOpen className="h-3.5 w-3.5 text-blue-400" />
                <span>Execution Blueprints & Guidelines</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedStrategy.description || "No execution instructions written."}
              </p>
            </div>

            {/* Aggregated strategy performance analytics cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-[#0A0E14] border border-slate-800 p-4 rounded-2xl text-center">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-extrabold block mb-1">Total Executed</span>
                <span className="text-xl font-mono font-black text-white">{strategyTrades.length} Trades</span>
              </div>

              <div className="bg-[#0A0E14] border border-slate-800 p-4 rounded-2xl text-center">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-extrabold block mb-1">Win Rate</span>
                <span className="text-xl font-mono font-black text-blue-400">
                  {strategyTrades.length > 0 
                    ? Math.round((strategyTrades.filter(t => t.profit > 0).length / strategyTrades.length) * 100) 
                    : 0}%
                </span>
              </div>

              <div className="bg-[#0A0E14] border border-slate-800 p-4 rounded-2xl text-center">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-extrabold block mb-1">Net Performance</span>
                <span className={`text-xl font-mono font-black ${getStrategyNetPnL(selectedStrategy.name) >= 0 ? "text-emerald-400" : "text-rose-500"}`}>
                  {getStrategyNetPnL(selectedStrategy.name) >= 0 ? "+" : ""}${getStrategyNetPnL(selectedStrategy.name).toLocaleString()}
                </span>
              </div>

              <div className="bg-[#0A0E14] border border-slate-800 p-4 rounded-2xl text-center">
                <span className="text-[10px] uppercase text-slate-500 tracking-wider font-extrabold block mb-1">Ratio W / L</span>
                <span className="text-xl font-mono font-black text-slate-400">
                  {strategyTrades.filter(t => t.profit > 0).length}W - {strategyTrades.filter(t => t.profit < 0).length}L
                </span>
              </div>
            </div>
          </div>

          {/* List of Trades executed with ALL details and screenshots */}
          <div className="space-y-4">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Historical Trade Tickets</h4>

            <div className="space-y-4">
              {strategyTrades.map((t, index) => {
                const profitStatus = t.profit > 0 ? "win" : t.profit < 0 ? "loss" : "be";
                
                return (
                  <div key={t.id} className="bg-[#161B22] border border-slate-800/80 hover:border-slate-750 p-6 rounded-3xl transition space-y-4">
                    {/* Trade Card Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-500 font-mono text-xs font-bold">#{index + 1}</span>
                        <h5 className="text-white font-black text-base tracking-tight">{t.pair}</h5>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                          profitStatus === "win" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          profitStatus === "loss" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" :
                          "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                        }`}>
                          {t.direction}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">
                          {t.date || "N/A"} {t.time}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500 font-mono font-bold">Planned R:R: <span className="text-white">1:{t.riskReward}</span></span>
                        <span className="text-slate-700">|</span>
                        <span className={`font-mono text-sm font-black ${
                          profitStatus === "win" ? "text-emerald-400" :
                          profitStatus === "loss" ? "text-rose-500" :
                          "text-slate-400"
                        }`}>
                          {t.profit >= 0 ? "+" : ""}${t.profit.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Highly Detailed Metrics Block Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-[#0A0E14] p-3.5 rounded-2xl border border-slate-800/50">
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500 font-extrabold tracking-wider mb-0.5">Lot Size</span>
                        <span className="text-xs font-mono font-bold text-white">{t.lotSize !== undefined ? `${t.lotSize} Lots` : "Not logged"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500 font-extrabold tracking-wider mb-0.5">Execution Leverage</span>
                        <span className="text-xs font-mono font-bold text-amber-500">{t.leverage !== undefined ? `${t.leverage}x` : "Not logged"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500 font-extrabold tracking-wider mb-0.5">Percent Risked</span>
                        <span className="text-xs font-mono font-bold text-rose-400">{t.riskPercent !== undefined ? `${t.riskPercent}%` : "Not logged"}</span>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase text-slate-500 font-extrabold tracking-wider mb-0.5">Stop Loss Distance</span>
                        <span className="text-xs font-mono font-bold text-slate-300">{t.stopLossPips !== undefined ? `${t.stopLossPips} Pips` : "Not logged"}</span>
                      </div>
                      <div className="col-span-2 md:col-span-1">
                        <span className="block text-[9px] uppercase text-slate-500 font-extrabold tracking-wider mb-0.5">Balance at Entry</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{t.accountBalance !== undefined ? `$${t.accountBalance.toLocaleString()}` : "Not logged"}</span>
                      </div>
                    </div>

                    {/* Entry Checklist Confluences Met */}
                    {t.entryRules && t.entryRules.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-[#00b074] uppercase tracking-wider block">🛡️ Passed entry logic thresholds ({t.entryRules.length}):</span>
                        <div className="flex flex-wrap gap-1">
                          {t.entryRules.map((rule, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-mono font-extrabold bg-emerald-500/10 text-[#00b074] border border-emerald-500/10 rounded-lg px-2.5 py-0.5"
                            >
                              ✓ {rule}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Entry Narrative description notes */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest block">📝 Setup Narrative / Entry Reason:</span>
                      <p className="text-xs text-slate-300 bg-[#0A0E14] p-3 rounded-2xl border border-slate-900 leading-relaxed font-sans whitespace-pre-line">
                        {t.entryReason || "No setup narrative written."}
                      </p>
                    </div>

                    {/* High timeframe scenario */}
                    {t.bigTimeFrameScenario && (
                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-yellow-500 uppercase tracking-widest block">🌐 High Timeframe (HTF) Macro Context:</span>
                        <p className="text-xs text-slate-300 bg-[#0A0E14] p-3 rounded-2xl border border-slate-900 leading-relaxed">
                          {t.bigTimeFrameScenario}
                        </p>
                      </div>
                    )}

                    {/* Mistakes displays */}
                    {t.mistake && t.mistake.toLowerCase() !== "none" && (
                      <div className="flex items-center space-x-2 bg-rose-500/10 text-rose-400 text-xs px-3.5 py-2.5 rounded-2xl border border-rose-500/10 max-w-fit font-bold">
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
                        <span>⚠️ Logged Execution Pitfall: {t.mistake}</span>
                      </div>
                    )}

                    {/* Image snapshots grid section */}
                    {((t.fourHourChart) || (t.oneHourChart) || (t.fifteenMinChart) || (t.dailyChart) || (t.images && t.images.length > 0)) && (
                      <div className="space-y-2 border-t border-slate-800/50 pt-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest block">📸 Trading Chart Snapshots:</span>
                          <button 
                            type="button"
                            onClick={() => setGalleryTrade(t)}
                            className="text-[10px] font-extrabold text-blue-400 hover:text-blue-300 transition flex items-center space-x-1 uppercase tracking-wider cursor-pointer"
                          >
                            <span>🔍 Open Grid Gallery ({[t.dailyChart, t.fourHourChart, t.oneHourChart, t.fifteenMinChart, ...(t.images || [])].filter(Boolean).length})</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {t.fourHourChart && (
                            <div 
                              onClick={() => setGalleryTrade(t)}
                              className="relative overflow-hidden group border border-slate-800 rounded-xl cursor-pointer bg-black/40 h-28 flex flex-col justify-between p-2 hover:border-blue-500 transition"
                            >
                              <img src={formatBase64Image(t.fourHourChart)} alt="4H Chart" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition duration-300" />
                              <span className="relative z-10 text-[9px] font-extrabold uppercase bg-black/80 px-1.5 py-0.5 rounded text-white self-start">4 Hour Chart</span>
                              <Eye className="relative z-10 h-3.5 w-3.5 text-slate-400 group-hover:text-white self-end" />
                            </div>
                          )}

                          {t.oneHourChart && (
                            <div 
                              onClick={() => setGalleryTrade(t)}
                              className="relative overflow-hidden group border border-slate-800 rounded-xl cursor-pointer bg-black/40 h-28 flex flex-col justify-between p-2 hover:border-blue-500 transition"
                            >
                              <img src={formatBase64Image(t.oneHourChart)} alt="1H Chart" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition duration-300" />
                              <span className="relative z-10 text-[9px] font-extrabold uppercase bg-black/80 px-1.5 py-0.5 rounded text-white self-start">1 Hour Chart</span>
                              <Eye className="relative z-10 h-3.5 w-3.5 text-slate-400 group-hover:text-white self-end" />
                            </div>
                          )}

                          {t.fifteenMinChart && (
                            <div 
                              onClick={() => setGalleryTrade(t)}
                              className="relative overflow-hidden group border border-slate-800 rounded-xl cursor-pointer bg-black/40 h-28 flex flex-col justify-between p-2 hover:border-blue-500 transition"
                            >
                              <img src={formatBase64Image(t.fifteenMinChart)} alt="15M Chart" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition duration-300" />
                              <span className="relative z-10 text-[9px] font-extrabold uppercase bg-black/80 px-1.5 py-0.5 rounded text-white self-start">15 Min Chart</span>
                              <Eye className="relative z-10 h-3.5 w-3.5 text-slate-400 group-hover:text-white self-end" />
                            </div>
                          )}

                          {t.dailyChart && (
                            <div 
                              onClick={() => setGalleryTrade(t)}
                              className="relative overflow-hidden group border border-slate-800 rounded-xl cursor-pointer bg-black/40 h-28 flex flex-col justify-between p-2 hover:border-blue-500 transition"
                            >
                              <img src={formatBase64Image(t.dailyChart)} alt="Daily Chart" className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition duration-300" />
                              <span className="relative z-10 text-[9px] font-extrabold uppercase bg-black/80 px-1.5 py-0.5 rounded text-white self-start">Daily Chart</span>
                              <Eye className="relative z-10 h-3.5 w-3.5 text-slate-400 group-hover:text-white self-end" />
                            </div>
                          )}

                          {t.images && t.images.length > 0 && t.images.map((img, idx) => (
                            <div 
                              key={idx}
                              onClick={() => setGalleryTrade(t)}
                              className="relative overflow-hidden group border border-slate-800 rounded-xl cursor-pointer bg-black/40 h-28 flex flex-col justify-between p-2 hover:border-blue-500 transition"
                            >
                              <img src={formatBase64Image(img)} alt={`Screenshot ${idx + 1}`} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-105 transition duration-300" />
                              <span className="relative z-10 text-[9px] font-extrabold uppercase bg-black/80 px-1.5 py-0.5 rounded text-white self-start">Snapshot #{idx + 1}</span>
                              <Eye className="relative z-10 h-3.5 w-3.5 text-slate-400 group-hover:text-white self-end" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {strategyTrades.length === 0 && (
                <div className="bg-[#161B22] border border-slate-800/80 rounded-3xl py-14 text-center text-slate-400 flex flex-col items-center justify-center">
                  <Activity className="h-10 w-10 text-slate-600 mb-3" />
                  <p className="text-sm font-semibold text-slate-300">No trading executions found for this framework.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                    Log new tickets in the Ledger tab matching this exact strategy name to compute statistics.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* 🗃️ LANDING LIST OF STRATEGY BLUIPRINTS / VAULT CARDS */
        <div className="space-y-6">
          <div className="bg-[#161B22] border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div>
              <h3 className="text-white font-bold text-lg">Trading Frameworks & Strategy Vault</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Register and configure your key market confluences. Your edge develops when you isolate success statistics per framework.
              </p>
            </div>
            
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="mt-4 sm:mt-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1 cursor-pointer transition shadow-lg shadow-blue-900/10"
            >
              <Plus className="h-4 w-4" />
              <span>{isAdding ? "Collapse Form" : "Add Custom Strategy"}</span>
            </button>
          </div>

          {/* ➕ Add Custom Strategy Form */}
          {isAdding && (
            <form onSubmit={handleCreate} className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Strategy Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Order Flow Inducement"
                    value={newStrategyName}
                    onChange={(e) => setNewStrategyName(e.target.value)}
                    className="w-full text-xs bg-[#0A0E14] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3.5 text-white placeholder-slate-600 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Technical Rules / Setup Steps</label>
                  <input
                    type="text"
                    placeholder="e.g. 1. FVG sweep, 2. MSB on 5m, 3. Entry at discount."
                    value={newStrategyDesc}
                    onChange={(e) => setNewStrategyDesc(e.target.value)}
                    className="w-full text-xs bg-[#0A0E14] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3.5 text-white placeholder-slate-600 font-semibold"
                  />
                </div>
              </div>

              <div className="flex justify-end pr-1">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition duration-200 cursor-pointer"
                >
                  Save Strategy Blueprint
                </button>
              </div>
            </form>
          )}

          {/* 🗃️ Grid list of Strategy Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strategies.map((strat, idx) => {
              const count = getStrategyCounts(strat.name);
              const pnl = getStrategyNetPnL(strat.name);

              return (
                <motion.div 
                  key={strat.id} 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  whileHover={{ 
                    scale: 1.03, 
                    y: -6,
                    borderColor: "#3b82f6",
                    boxShadow: "0 20px 25px -5px rgba(59,130,246,0.1), 0 10px 10px -5px rgba(59,130,246,0.04)"
                  }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 260, 
                    damping: 18,
                    delay: idx * 0.05 
                  }}
                  className="bg-[#161B22] border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col justify-between transition duration-300 group relative overflow-hidden"
                >
                  {/* Subtle decorative background wave gradient */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/2 to-transparent pointer-events-none" />

                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <motion.span 
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="bg-blue-600/10 text-blue-400 text-[9px] font-bold px-2.5 py-1 rounded inline-flex items-center gap-1 uppercase tracking-wider border border-blue-500/10"
                      >
                        <Sparkles className="h-2.5 w-2.5 text-blue-400 group-hover:rotate-180 transition duration-500" />
                        <span>Edge Engine</span>
                      </motion.span>
 
                      {/* Disable delete for default built-in setup guidelines to prevent mistakes */}
                      {strat.id !== "s1" && strat.id !== "s2" && strat.id !== "s3" && strat.id !== "s4" && strat.id !== "s5" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteStrategy(strat.id);
                          }}
                          className="text-slate-500 hover:text-red-500 p-1.5 rounded-xl hover:bg-rose-500/10 transition cursor-pointer relative z-10"
                          title="Delete strategy"
                        >
                          <Trash className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
 
                    <h4 className="text-white font-bold text-base truncate pr-1" title={strat.name}>
                      {strat.name}
                    </h4>
                    
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed h-8">
                      {strat.description || "No execution instructions blueprint logged."}
                    </p>
                  </div>
 
                  {/* Strategy Metrics row info summary */}
                  <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center">
                    <div className="bg-[#0A0E14] p-2.5 rounded-xl border border-slate-800/80 group-hover:border-slate-700 transition duration-300">
                      <span className="block text-[8px] uppercase text-slate-500 tracking-wider font-extrabold">Total Trades</span>
                      <span className="text-blue-400 text-sm font-black font-mono mt-0.5 block">{count}</span>
                    </div>
 
                    <div className="bg-[#0A0E14] p-2.5 rounded-xl border border-slate-800/80 group-hover:border-slate-700 transition duration-300">
                      <span className="block text-[8px] uppercase text-slate-500 tracking-wider font-extrabold">Net Profit</span>
                      <span className={`text-sm font-black font-mono mt-0.5 block ${pnl >= 0 ? "text-[#00b074]" : "text-rose-500"}`}>
                        {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                      </span>
                    </div>
                  </div>
 
                  {/* Open details page trigger button */}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedStrategyId(strat.id)}
                    className="w-full mt-4 py-2.5 bg-[#0A0E14] group-hover:bg-blue-600 border border-slate-800 group-hover:border-blue-500 text-slate-400 group-hover:text-white rounded-xl text-xs font-bold transition duration-300 flex items-center justify-center space-x-1 cursor-pointer"
                  >
                    <span>Inspect System & Trades ({count})</span>
                    <motion.span
                      className="inline-block"
                      animate={{ rotate: isAdding ? 180 : 0 }}
                      whileHover={{ rotation: 360 }}
                    >
                      <Eye className="h-3.5 w-3.5 text-slate-400 group-hover:text-white transition" />
                    </motion.span>
                  </motion.button>
 
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Interactive premium Multi-Timeframe Grid Gallery Modal */}
      {galleryTrade && (
        <div className="fixed inset-0 z-50 bg-[#0B0F17]/95 backdrop-blur-md overflow-y-auto" id="strat-gallery-modal">
          <div className="min-h-screen py-8 px-4 sm:px-6 md:px-8 flex flex-col max-w-7xl mx-auto justify-center">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-[#111723] border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl leading-none">
              <div className="flex items-center space-x-3.5">
                <div className="bg-[#1D2636] p-2.5 rounded-xl border border-slate-700/60 text-blue-400">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                    Multi-Timeframe Execution Blueprint [{galleryTrade.pair}]
                  </h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 font-mono uppercase tracking-wider">
                    {galleryTrade.direction} Ticket — Action logged at {galleryTrade.date || "N/A"} {galleryTrade.time}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGalleryTrade(null)}
                className="p-2 sm:p-2.5 bg-[#1B2332] hover:bg-[#253249] text-slate-300 hover:text-white rounded-xl transition border border-slate-755/60 cursor-pointer"
                title="Return to Strategy View"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
              {[
                { label: "Daily Frame Outlook", image: galleryTrade.dailyChart },
                { label: "4 Hour Structural Context", image: galleryTrade.fourHourChart },
                { label: "1 Hour Local Flow Trigger", image: galleryTrade.oneHourChart },
                { label: "15 Minute Execution Alignment", image: galleryTrade.fifteenMinChart },
                ...(galleryTrade.images || []).map((img, i) => ({
                  label: `Supporting Screenshot #${i + 1}`,
                  image: img
                }))
              ]
                .filter(item => item.image)
                .map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex flex-col bg-[#111723] rounded-2xl border border-slate-800/80 overflow-hidden hover:border-slate-700 transition duration-300 group shadow-md"
                  >
                    {/* Image Header with Label */}
                    <div className="bg-[#151D2C] px-4 py-3 flex justify-between items-center border-b border-slate-800/60">
                      <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest font-mono">
                        {item.label}
                      </span>
                      <button
                        onClick={() => setZoomedImage(formatBase64Image(item.image))}
                        className="p-1 text-slate-400 hover:text-white bg-[#1C2536] hover:bg-[#253249] rounded-lg transition border border-slate-700/40 cursor-zoom-in"
                        title="Expand Image"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Actual high-res image box */}
                    <div className="relative aspect-video sm:aspect-[4/3] w-full bg-black/60 flex items-center justify-center p-2.5 overflow-hidden">
                      <img 
                        src={formatBase64Image(item.image)} 
                        alt={item.label} 
                        className="max-w-full max-h-full object-contain rounded-lg shadow-inner group-hover:scale-[1.02] transition duration-300 pointer-events-auto"
                      />
                      <div 
                        onClick={() => setZoomedImage(formatBase64Image(item.image))}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-zoom-in transition duration-300 animate-fade-in"
                      >
                        <div className="bg-[#0A0E14] text-white font-bold text-[10px] uppercase px-3 py-1.5 rounded-lg flex items-center space-x-1 border border-slate-800 shadow-lg">
                          <Maximize2 className="h-3 w-3" />
                          <span>Fullscreen Magnify</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Modal Footer quick specs */}
            <div className="bg-[#111723] border border-slate-800/80 rounded-2xl p-4 text-center">
              <p className="text-[11px] text-slate-400">
                Loaded <strong className="text-white">{[galleryTrade.dailyChart, galleryTrade.fourHourChart, galleryTrade.oneHourChart, galleryTrade.fifteenMinChart, ...(galleryTrade.images || [])].filter(Boolean).length} visual evidence sheets</strong>. Use <kbd className="bg-slate-800 border border-slate-700 text-[9px] px-1.5 py-0.5 rounded text-white mx-1">ESC</kbd> or click the Close button to go back.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* Local Image Lightbox Zoom Overlay modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center cursor-zoom-out p-4"
        >
          <img src={zoomedImage} alt="Zoomed snapshot" className="max-w-full max-h-[95vh] rounded-2xl shadow-2xl object-scale-down border border-slate-800 animate-fade-in" />
        </div>
      )}

    </div>
  );
}
