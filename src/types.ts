export type TradeDirection = "LONG" | "SHORT";

export interface Trade {
  id: string;
  userId?: string;
  pair: string;            // e.g. "BTCUSD", "EURUSD"
  strategy: string;        // Name or ID of the strategy (e.g. "Order Block", "Support/Resistance")
  entryReason: string;     // Text description / reasons for entry
  direction: TradeDirection;
  time: string;            // Time of trade execution, e.g. "12:30" or ISO timestamp
  date?: string;           // Date of trade execution, e.g. "2026-06-13"
  profit: number;          // Net result (positive for profit, negative for loss)
  riskReward: number;      // Planned Risk-Reward ratio, e.g. 2.5
  mistake: string;         // Mistakes/Lessons, e.g. "Chased Price", "None", "FOMO"
  images: string[];        // Array of Base64 encoded chart screenshots
  dailyChart?: string;     // Base64 Daily candle chart
  fourHourChart?: string;  // Base64 4 Hour candle chart
  oneHourChart?: string;   // Base64 1 Hour candle chart
  fifteenMinChart?: string; // Base64 15 Min candle chart
  bigTimeFrameScenario?: string; // Scenario in high timeframe (HTF)
  createdAt: string;       // ISO Timestamp when recorded
  
  // Custom Lot & Position Parameters
  entryRules?: string[];   // Active entry logic rules/checkpoints
  lotSize?: number;        // Logged position lot size
  leverage?: number;       // Custom leverage used (e.g. 20)
  riskPercent?: number;    // Risk % of account (e.g. 1.5)
  stopLossPips?: number;   // Stop loss in pips/points
  accountBalance?: number; // Account balance at entry
  tags?: string[];         // e.g. ["Breakout", "Reversal", "Trend-following"]
}

export interface Strategy {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface PerformanceStats {
  totalTrades: number;
  totalProfit: number;
  winRate: number;
  wins: number;
  losses: number;
  averageProfit: number;
  averageLoss: number;
  profitFactor: number;
  cumulativePnL: { date: string; pnl: number }[];
}

export interface AIExtractResult {
  pair: string;
  direction: TradeDirection;
  time: string;
  riskReward: number;
  entryReason: string;
  mistake: string;
}
