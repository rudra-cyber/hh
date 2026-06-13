import React from "react";
import { Trade, PerformanceStats, Strategy } from "../types";
import { FileText, Download, CheckSquare, TrendingUp, HelpCircle } from "lucide-react";

interface ExportPDFProps {
  trades: Trade[];
  stats: PerformanceStats;
  strategies: Strategy[];
}

export default function ExportPDF({ trades, stats, strategies }: ExportPDFProps) {
  
  const generatePrintableReport = () => {
    // We create a pristine, well-styled print window containing standard PDF styles,
    // which prompts native Operating System dialogs (Save to PDF, Print to Paper).
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Please allow pop-ups to generate and download the PDF report.");
      return;
    }

    const tradesListHtml = trades.map((t, idx) => `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace; font-size: 11px;">#${idx + 1}</td>
        <td style="padding: 10px; font-family: monospace; font-weight: bold;">${t.pair}</td>
        <td style="padding: 10px;"><span style="background-color: ${t.direction === 'LONG' ? '#dbf4e9' : '#fde2e4'}; color: ${t.direction === 'LONG' ? '#0f766e' : '#be123c'}; font-weight: bold; font-size: 10px; padding: 2px 6px; border-radius: 4px;">${t.direction}</span></td>
        <td style="padding: 10px; font-size: 11px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.strategy}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px;">${t.time}</td>
        <td style="padding: 10px; font-family: monospace; font-size: 11px;">1:${t.riskReward}</td>
        <td style="padding: 10px; font-family: monospace; font-weight: bold; color: ${t.profit >= 0 ? '#10b981' : '#ef4444'};">
          ${t.profit >= 0 ? '+' : ''}$${t.profit.toLocaleString()}
        </td>
        <td style="padding: 10px; font-size: 11px; color: #475569;">${t.mistake || 'None'}</td>
      </tr>
    `).join("");

    const strategiesHtml = strategies.map(strat => {
      const stratTrades = trades.filter(t => t.strategy === strat.name);
      const count = stratTrades.length;
      const pnl = stratTrades.reduce((acc, t) => acc + t.profit, 0);
      return `
        <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; margin-bottom: 8px; background-color: #f8fafc;">
          <h4 style="margin: 0; color: #1e293b; font-size: 12px;">${strat.name}</h4>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b; font-family: monospace;">
            Trades: ${count} | Net PnL: <span style="font-weight: bold; color: ${pnl >= 0 ? '#10b981' : '#ef4444'};">${pnl >= 0 ? '+' : ''}$${pnl}</span>
          </p>
        </div>
      `;
    }).join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>EdgeJournal Trading Audit Report</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              margin: 0;
              padding: 40px;
              line-height: 1.5;
            }
            .header {
              display: flex;
              justify-content: space-between;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 20px;
              margin-bottom: 300;
              margin-bottom: 25px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              letter-spacing: -0.5px;
              color: #0f172a;
            }
            .title {
              font-size: 14px;
              color: #64748b;
              text-align: right;
            }
            .grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .card {
              border: 1px solid #e2e8f0;
              border-radius: 10px;
              padding: 15px;
              text-align: center;
              background-color: #fafafa;
            }
            .card-val {
              font-size: 20px;
              font-weight: bold;
              margin-top: 5px;
            }
            .section-title {
              font-size: 14px;
              text-transform: uppercase;
              letter-spacing: 1px;
              font-weight: bold;
              border-bottom: 1px solid #cfd8dc;
              padding-bottom: 5px;
              margin-top: 30px;
              margin-bottom: 15px;
              color: #0f172a;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background-color: #f1f5f9;
              text-align: left;
              padding: 10px;
              font-size: 11px;
              text-transform: uppercase;
              color: #475569;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 20px; text-align: right;">
            <button onclick="window.print();" style="background-color: #2962ff; color: white; padding: 10px 20px; border: none; border-radius: 6px; font-weight: bold; cursor: pointer; font-size: 13px;">
              💾 Save / Download as PDF
            </button>
          </div>

          <div class="header">
            <div>
              <div class="logo">⚡ EDGEJOURNAL</div>
              <div style="font-size: 10px; color: #64748b; margin-top: 4px;">AI-powered Professional Trading Companion</div>
            </div>
            <div class="title">
              <div>Trading Performance Audit</div>
              <div style="font-size: 11px; font-family: monospace; margin-top: 4px;">Date Compiled: ${new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <!-- Overall metrics -->
          <div class="grid">
            <div class="card">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Total Trades</div>
              <div class="card-val" style="color: #0f172a;">${stats.totalTrades}</div>
            </div>
            <div class="card">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Net Profit/Loss</div>
              <div class="card-val" style="color: ${stats.totalProfit >= 0 ? '#10b981' : '#ef4444'};">
                ${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toLocaleString()}
              </div>
            </div>
            <div class="card">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Win rate</div>
              <div class="card-val" style="color: #2962ff;">${stats.winRate}%</div>
            </div>
            <div class="card">
              <div style="font-size: 10px; color: #64748b; text-transform: uppercase;">Profit Factor</div>
              <div class="card-val" style="color: #e0a800;">${stats.profitFactor}</div>
            </div>
          </div>

          <!-- Strategy Performance -->
          <div class="section-title">Framework & Strategy Efficiency</div>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
            ${strategiesHtml}
          </div>

          <!-- Full trade list -->
          <div class="section-title">Trade Execution Ledger</div>
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Pair</th>
                <th>Dir</th>
                <th>Strategy</th>
                <th>Time</th>
                <th>R:R</th>
                <th>Net Return</th>
                <th>Pitfall / Mistake</th>
              </tr>
            </thead>
            <tbody>
              ${tradesListHtml}
            </tbody>
          </table>

          <div style="margin-top: 50px; font-size: 9px; text-align: center; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 15px;">
            Generated by EdgeJournal Trading System. Build an edge, master execution, stay disciplined.
          </div>

          <script>
            // Automatically prompt print dialog on load
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <button
      onClick={generatePrintableReport}
      className="px-4 py-2.5 bg-[#1C2128] border border-slate-800 hover:border-blue-500 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition cursor-pointer"
      title="Compile detailed PDF ledger report"
    >
      <FileText className="h-4 w-4" />
      <span>Download PDF Report</span>
    </button>
  );
}
