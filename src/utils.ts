import { Trade, PerformanceStats, Strategy } from "./types";

export const DEFAULT_STRATEGIES: Strategy[] = [
  {
    id: "s1",
    name: "1k Delta Strategy",
    description: "Candle with delta 1k and then make opposite candle,then high or low break or retailer sl hit,then opposite candle and entry.",
    createdAt: new Date().toISOString()
  },
  {
    id: "s2",
    name: "DOM CHART LIQUIDITY",
    description: HUGE AMOUNT LIQUIDITY ,MARKET SHOULD GO THERE.",
    createdAt: new Date().toISOString()
  },
  {
    id: "s3",
    name: "Fibonacci Golden Pocket Bounce",
    description: "Entering at 0.618 - 0.65 retracement zones with sl below 0.786.",
    createdAt: new Date().toISOString()
  },
  {
    id: "s4",
    name: "EMA Ribbon & Trend Following",
    description: "Trading pullback bounces on 20/50 EMA ribbon configurations on high timeframes.",
    createdAt: new Date().toISOString()
  },
  {
    id: "s5",
    name: "ICT Silver Bullet",
    description: "Searching for fair value gaps (FVG) created during session silver bullet hours (10-11 AM NY).",
    createdAt: new Date().toISOString()
  }
];

export function calculatePerformanceStats(trades: Trade[]): PerformanceStats {
  const sortedTrades = [...trades].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

  const totalTrades = sortedTrades.length;
  const winsList = sortedTrades.filter(t => t.profit > 0);
  const lossesList = sortedTrades.filter(t => t.profit < 0);

  const wins = winsList.length;
  const losses = lossesList.length;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  const totalProfit = sortedTrades.reduce((acc, t) => acc + t.profit, 0);

  const totalWinsAmount = winsList.reduce((acc, t) => acc + t.profit, 0);
  const totalLossesAmount = Math.abs(lossesList.reduce((acc, t) => acc + t.profit, 0));

  const averageProfit = wins > 0 ? totalWinsAmount / wins : 0;
  const averageLoss = losses > 0 ? totalLossesAmount / losses : 0;

  const profitFactor = totalLossesAmount > 0 ? totalWinsAmount / totalLossesAmount : totalWinsAmount > 0 ? 999 : 0;

  // Compute cumulative PnL series
  let runningPnL = 0;
  const cumulativePnL = sortedTrades.map((t, index) => {
    runningPnL += t.profit;
    const formattedDate = new Date(t.time).toLocaleDateString([], { month: "short", day: "numeric" });
    return {
      date: `${formattedDate} (#${index + 1})`,
      pnl: parseFloat(runningPnL.toFixed(2))
    };
  });

  // If no trades, start with 0
  if (cumulativePnL.length === 0) {
    cumulativePnL.push({ date: "Start", pnl: 0 });
  } else {
    cumulativePnL.unshift({ date: "Start", pnl: 0 });
  }

  return {
    totalTrades,
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    winRate: parseFloat(winRate.toFixed(1)),
    wins,
    losses,
    averageProfit: parseFloat(averageProfit.toFixed(2)),
    averageLoss: parseFloat(averageLoss.toFixed(2)),
    profitFactor: parseFloat(profitFactor.toFixed(2)),
    cumulativePnL
  };
}

export function sampleTrades(): Trade[] {
  return [
    {
      id: "t1",
      pair: "BTCUSD",
      strategy: "Order Block & Liquidity Sweep (ICT)",
      entryReason: "Liquidity swept below $68,200. Clean bullish fair value gap (FVG) formed on the 5m chart with structural market shift.",
      direction: "LONG",
      time: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      profit: 450,
      riskReward: 3.0,
      mistake: "None",
      images: [],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t2",
      pair: "EURUSD",
      strategy: "Support & Resistance Breakout",
      entryReason: "Assembled a nice breakout above 1.0850 daily resistance, but got stopped out on a sudden news spike wick.",
      direction: "LONG",
      time: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      profit: -150,
      riskReward: 2.0,
      mistake: "Traded too close to red folder inflation news",
      images: [],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t3",
      pair: "NASDAQ100",
      strategy: "EMA Ribbon & Trend Following",
      entryReason: "Beautiful bounce off the 50 EMA ribbon on 15m chart. Moving averages perfectly aligned.",
      direction: "SHORT",
      time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      profit: 600,
      riskReward: 2.5,
      mistake: "None",
      images: [],
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "t4",
      pair: "SOLUSD",
      strategy: "Order Block & Liquidity Sweep (ICT)",
      entryReason: "Took a premature short entry after seeing a minor rejection. Violated 15m trend structure.",
      direction: "SHORT",
      time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      profit: -200,
      riskReward: 2.0,
      mistake: "Chased price out of FOMO. Need to wait for session sweep.",
      images: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}
