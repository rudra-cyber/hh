import React, { useState, useEffect } from "react";
import { Trade, Strategy, PerformanceStats } from "./types";
import { 
  DEFAULT_STRATEGIES, 
  calculatePerformanceStats, 
  sampleTrades 
} from "./utils";
import { 
  Plus, Search, SlidersHorizontal, Trash2, Edit2, 
  Database, RefreshCw, BarChart3, BookOpen, Layers, 
  Download, LogIn, LogOut, Check, AlertTriangle, Play,
  TrendingUp, Compass, FolderSync, Settings, Sparkles, Image as ImageIcon,
  Activity, ChevronDown, ChevronUp
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AnalyticsPanel from "./components/AnalyticsPanel";
import StrategyManager from "./components/StrategyManager";
import TradeForm from "./components/TradeForm";
import ExportPDF from "./components/ExportPDF";
import MonthlyReports from "./components/MonthlyReports";
import Tooltip from "./components/Tooltip";

const themeStyles = {
  midnight: {
    bg: "bg-[#0A0E14] text-slate-200",
    headerBg: "bg-[#0F141C] border-slate-800",
    cardBg: "bg-[#161B22] border-slate-800",
    cardHover: "hover:bg-[#1C2128] hover:border-blue-500/35",
    buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/10",
    badgeBg: "bg-blue-500/10 text-blue-400 border border-blue-500/15",
    textMuted: "text-slate-400",
    textTitle: "text-white",
    border: "border-slate-800",
    inputBg: "bg-[#0A0E14] border-slate-800 focus:border-blue-500 text-slate-200",
    pillBg: "bg-[#1C2128]"
  },
  emerald: {
    bg: "bg-[#050C07] text-emerald-100",
    headerBg: "bg-[#0A160F] border-emerald-950/70",
    cardBg: "bg-[#102116] border-emerald-900/40",
    cardHover: "hover:bg-[#142A1D] hover:border-emerald-500/35 shadow-emerald-950/20",
    buttonPrimary: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/10",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15",
    textMuted: "text-emerald-400/80",
    textTitle: "text-emerald-100",
    border: "border-[#142a1c]",
    inputBg: "bg-[#050C07] border-[#0a1b11] focus:border-emerald-500 text-emerald-200",
    pillBg: "bg-[#0E1E14]"
  },
  neon: {
    bg: "bg-[#070114] text-pink-100/90",
    headerBg: "bg-[#0F0429] border-purple-950",
    cardBg: "bg-[#170836] border-purple-900/20",
    cardHover: "hover:bg-[#200D47] hover:border-pink-500/35 shadow-pink-950/20",
    buttonPrimary: "bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-500/10",
    badgeBg: "bg-pink-500/10 text-pink-400 border border-pink-500/15",
    textMuted: "text-purple-400",
    textTitle: "text-pink-500",
    border: "border-[#200D47]",
    inputBg: "bg-[#070114] border-[#180A34] focus:border-pink-500 text-pink-200",
    pillBg: "bg-[#13062E]"
  },
  light: {
    bg: "bg-[#F1F5F9] text-slate-800",
    headerBg: "bg-white border-slate-200 shadow-sm",
    cardBg: "bg-white border-slate-200 shadow-sm",
    cardHover: "hover:bg-slate-50 hover:border-blue-550 hover:shadow-md",
    buttonPrimary: "bg-blue-600 hover:bg-blue-700 text-white shadow shadow-blue-500/10",
    badgeBg: "bg-indigo-50 text-indigo-600 border border-indigo-200",
    textMuted: "text-slate-500",
    textTitle: "text-slate-900",
    border: "border-[#E2E8F0]",
    inputBg: "bg-slate-100 border-slate-200 focus:border-blue-500 text-slate-800",
    pillBg: "bg-slate-200/80"
  }
};

// Optional cloud service connection
import { 
  isFirebaseEnabled, 
  auth, 
  db, 
  googleProvider,
  handleFirestoreError,
  OperationType
} from "./firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  setDoc,
  writeBatch 
} from "firebase/firestore";

export default function App() {
  // Theme Configurator states ("design er koyekta nomuna bananu jay jate nijer iccha moto design pochondo korte pari")
  const [activeTheme, setActiveTheme] = useState<"midnight" | "emerald" | "neon" | "light">(() => {
    return (localStorage.getItem("ej_active_theme") as any) || "midnight";
  });

  const styles = themeStyles[activeTheme];

  const changeTheme = (newTheme: "midnight" | "emerald" | "neon" | "light") => {
    setActiveTheme(newTheme);
    localStorage.setItem("ej_active_theme", newTheme);
  };

  // Current tab view: "ledger" | "analytics" | "strategies" | "reports"
  const [activeTab, setActiveTab] = useState<"ledger" | "analytics" | "strategies" | "reports">("ledger");

  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Core database states
  const [trades, setTrades] = useState<Trade[]>([]);
  const [strategies, setStrategies] = useState<Strategy[]>(DEFAULT_STRATEGIES);

  // Filter and search variables
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "WINS" | "LOSSES">("ALL");
  const [strategyFilter, setStrategyFilter] = useState("ALL_STRATEGIES");
  const [tagFilter, setTagFilter] = useState("ALL_TAGS");

  // Form Modals
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [editTradeData, setEditTradeData] = useState<Trade | null>(null);

  // New State for main app notifications
  const [tradeSavedAlert, setTradeSavedAlert] = useState<{
    show: boolean;
    pair: string;
    profit: number;
    type: "SAVE" | "UPDATE" | "DELETE";
  } | null>(null);

  // Active picture modal zoom
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Expanded trade ledger card IDs
  const [expandedTradeIds, setExpandedTradeIds] = useState<string[]>([]);
  const toggleTradeExpanded = (id: string) => {
    setExpandedTradeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Reset confirmation dialogs
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDoubleTyped, setResetDoubleTyped] = useState("");

  // Loading indicator for background sync matches
  const [syncing, setSyncing] = useState(false);

  // 1. Initial Load from LocalStorage (Offline Cache First)
  useEffect(() => {
    const localTrades = localStorage.getItem("ej_trades");
    if (localTrades) {
      try {
        setTrades(JSON.parse(localTrades));
      } catch (e) {
        console.error("Local trades parse failure", e);
      }
    } else {
      // Seed default sample trades so page isn't totally empty on initial load
      const samples = sampleTrades();
      setTrades(samples);
      localStorage.setItem("ej_trades", JSON.stringify(samples));
    }

    const localStrats = localStorage.getItem("ej_strategies");
    if (localStrats) {
      try {
        setStrategies(JSON.parse(localStrats));
      } catch (e) {
        console.error("Local strategies parse failure", e);
      }
    }
  }, []);

  // 2. Local Auth observer, syncing to Cloud Firestore if signed in
  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Logged in: Sync trades and strategies from cloud database!
        setSyncing(true);
        try {
          // A. Fetch cloud strategies
          const stratsRef = collection(db, "strategies");
          const stratsQuery = query(stratsRef, where("userId", "==", user.uid));
          let stratsSnap;
          try {
            stratsSnap = await getDocs(stratsQuery);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "strategies");
            throw err;
          }
          
          let cloudStrats: Strategy[] = [];
          stratsSnap.forEach(d => {
            cloudStrats.push(d.data() as Strategy);
          });

          if (cloudStrats.length > 0) {
            setStrategies(cloudStrats);
            localStorage.setItem("ej_strategies", JSON.stringify(cloudStrats));
          } else {
            // Upload initial default strategies to Firestore for cloud sync
            const batch = writeBatch(db);
            DEFAULT_STRATEGIES.forEach(s => {
              const docRef = doc(db, "strategies", s.id);
              batch.set(docRef, JSON.parse(JSON.stringify({ ...s, userId: user.uid })));
            });
            try {
              await batch.commit();
            } catch (err) {
              handleFirestoreError(err, OperationType.CREATE, "strategies");
              throw err;
            }
          }

          // B. Fetch cloud trades
          const tradesRef = collection(db, "trades");
          const tradesQuery = query(tradesRef, where("userId", "==", user.uid));
          let tradesSnap;
          try {
            tradesSnap = await getDocs(tradesQuery);
          } catch (err) {
            handleFirestoreError(err, OperationType.LIST, "trades");
            throw err;
          }
          
          let cloudTrades: Trade[] = [];
          tradesSnap.forEach(d => {
            cloudTrades.push(d.data() as Trade);
          });

          // Sort descending by time
          const parsed = cloudTrades.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
          setTrades(parsed);
          localStorage.setItem("ej_trades", JSON.stringify(parsed));
        } catch (err) {
          console.error("Cloud syncing failed:", err);
        } finally {
          setSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Save Trades local backup on change
  const saveTradesState = (updatedTrades: Trade[]) => {
    setTrades(updatedTrades);
    localStorage.setItem("ej_trades", JSON.stringify(updatedTrades));
  };

  // 4. Save Strategies local backup on change
  const saveStrategiesState = (updatedStrats: Strategy[]) => {
    setStrategies(updatedStrats);
    localStorage.setItem("ej_strategies", JSON.stringify(updatedStrats));
  };

  // Google Login Handlers
  const handleSignIn = async () => {
    if (!isFirebaseEnabled) {
      alert("Cloud Sync is currently in offline-fallback. Once the workspace owner sets up Firebase, Google Sign-in will connect.");
      return;
    }
    try {
      setSyncing(true);
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      console.error("Authentication trigger error:", e);
      alert("Sign-in failed. Check pop-up blockers or server credentials.");
    } finally {
      setSyncing(false);
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      setCurrentUser(null);
      // Reload defaults or local
    } catch (e) {
      console.error("Sign out failed", e);
    }
  };

  // Helper to remove any undefined or null-like properties to prevent Firestore errors
  const cleanUndefined = <T extends object>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj)) as T;
  };

  // ➕ Save Trade Handler (Handles both Create and Edit)
  const handleSaveTrade = async (formData: Omit<Trade, "id" | "createdAt"> & { id?: string }) => {
    const isEdit = !!formData.id;
    const tradeId = isEdit ? formData.id! : `t-${Date.now()}`;
    const timestamp = isEdit 
      ? trades.find(t => t.id === tradeId)?.createdAt || new Date().toISOString()
      : new Date().toISOString();

    const completeTrade: Trade = {
      id: tradeId,
      userId: currentUser?.uid || "anonymous",
      pair: formData.pair,
      strategy: formData.strategy,
      entryReason: formData.entryReason,
      direction: formData.direction,
      time: formData.time,
      date: formData.date,
      profit: formData.profit,
      riskReward: formData.riskReward,
      mistake: formData.mistake,
      images: formData.images || [],
      dailyChart: formData.dailyChart,
      fourHourChart: formData.fourHourChart,
      oneHourChart: formData.oneHourChart,
      fifteenMinChart: formData.fifteenMinChart,
      bigTimeFrameScenario: formData.bigTimeFrameScenario,
      entryRules: formData.entryRules || [],
      lotSize: formData.lotSize,
      leverage: formData.leverage,
      riskPercent: formData.riskPercent,
      stopLossPips: formData.stopLossPips,
      accountBalance: formData.accountBalance,
      createdAt: timestamp
    };

    let updatedTrades = [...trades];
    if (isEdit) {
      updatedTrades = updatedTrades.map(t => t.id === tradeId ? completeTrade : t);
    } else {
      updatedTrades = [completeTrade, ...updatedTrades];
    }

    // Save locally
    saveTradesState(updatedTrades);

    // Sync to Cloud Firestore if connected
    if (currentUser && db) {
      try {
        setSyncing(true);
        const docRef = doc(db, "trades", tradeId);
        await setDoc(docRef, cleanUndefined(completeTrade));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `trades/${tradeId}`);
      } finally {
        setSyncing(false);
      }
    }

    setShowTradeForm(false);
    setEditTradeData(null);

    // Trigger premium beautiful UI banner confirmation with text info
    setTradeSavedAlert({
      show: true,
      pair: completeTrade.pair,
      profit: completeTrade.profit,
      type: isEdit ? "UPDATE" : "SAVE"
    });

    setTimeout(() => {
      setTradeSavedAlert(null);
    }, 4500);
  };

  // 🗑️ Delete Trade Handler
  const handleDeleteTrade = async (tradeId: string) => {
    if (!confirm("Are you sure you want to delete this trading ticket record?")) return;

    const tToDelete = trades.find(t => t.id === tradeId);
    const updated = trades.filter(t => t.id !== tradeId);
    saveTradesState(updated);

    if (currentUser && db) {
      try {
        setSyncing(true);
        const docRef = doc(db, "trades", tradeId);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `trades/${tradeId}`);
      } finally {
        setSyncing(false);
      }
    }

    // Trigger toast notification
    setTradeSavedAlert({
      show: true,
      pair: tToDelete ? tToDelete.pair : "Trade",
      profit: tToDelete ? tToDelete.profit : 0,
      type: "DELETE"
    });

    setTimeout(() => {
      setTradeSavedAlert(null);
    }, 4500);
  };

  // ➕ Add Custom Strategy
  const handleAddStrategy = async (name: string, description: string) => {
    const id = `s-${Date.now()}`;
    const newStrat: Strategy = {
      id,
      name,
      description,
      createdAt: new Date().toISOString()
    };

    const updated = [...strategies, newStrat];
    saveStrategiesState(updated);

    if (currentUser && db) {
      try {
        setSyncing(true);
        const docRef = doc(db, "strategies", id);
        await setDoc(docRef, cleanUndefined({ ...newStrat, userId: currentUser.uid }));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `strategies/${id}`);
      } finally {
        setSyncing(false);
      }
    }
  };

  // 🗑️ Delete Custom Strategy
  const handleDeleteStrategy = async (stratId: string) => {
    if (!confirm("Confirm deleting this custom strategy? Trades assigned to this strategy will remain mapped, but the category will be removed.")) return;

    const updated = strategies.filter(s => s.id !== stratId);
    saveStrategiesState(updated);

    if (currentUser && db) {
      try {
        setSyncing(true);
        const docRef = doc(db, "strategies", stratId);
        await deleteDoc(docRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `strategies/${stratId}`);
      } finally {
        setSyncing(false);
      }
    }
  };

  // 💥 Reset Database Handler ("data rest er option rakba, jate shob kisu zero hoye jay")
  const handleResetAllData = async () => {
    if (resetDoubleTyped.toLowerCase() !== "reset") {
      alert("Mismatch: Please type 'RESET' exactly to clear ledger database.");
      return;
    }

    setTrades([]);
    setStrategies(DEFAULT_STRATEGIES);
    localStorage.removeItem("ej_trades");
    localStorage.removeItem("ej_strategies");

    // Clear firestore collection if signed in
    if (currentUser && db) {
      try {
        setSyncing(true);
        // Delete each document of trade in a batch or notify user
        // Simple iteration
        const batch = writeBatch(db);
        trades.forEach(t => {
          batch.delete(doc(db, "trades", t.id));
        });
        await batch.commit();
      } catch (e) {
        handleFirestoreError(e, OperationType.DELETE, "trades");
      } finally {
        setSyncing(false);
      }
    }

    setShowResetConfirm(false);
    setResetDoubleTyped("");
    alert("Ledger completely reset! All metrics and trades are now zero.");
  };

  // Compute stats
  const performanceStats = React.useMemo(() => {
    return calculatePerformanceStats(trades);
  }, [trades]);

  // Apply filters on the ledger list
  const filteredTrades = React.useMemo(() => {
    return trades.filter((t) => {
      // 1. Text Search query (Filter of pair, strategy, or reasons)
      const matchesSearch = 
        t.pair.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.strategy.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.entryReason.toLowerCase().includes(searchQuery.toLowerCase());

      // 2. Win / Loss outcomes
      const matchesWinLoss = 
        statusFilter === "ALL" ? true :
        statusFilter === "WINS" ? t.profit > 0 : t.profit < 0;

      // 3. Strategy classification
      const matchesStrategy =
        strategyFilter === "ALL_STRATEGIES" ? true :
        t.strategy === strategyFilter;

      // 4. Tag classification filter
      const matchesTag =
        tagFilter === "ALL_TAGS" ? true :
        t.tags && t.tags.includes(tagFilter);

      return matchesSearch && matchesWinLoss && matchesStrategy && matchesTag;
    });
  }, [trades, searchQuery, statusFilter, strategyFilter, tagFilter]);

  return (
    <div className={`min-h-screen ${activeTheme !== 'light' ? 'ambient-glowing-bg' : styles.bg} flex flex-col font-sans selection:bg-blue-650/30 transition-colors duration-200 relative overflow-hidden`}>
      
      {/* Aurora Ambient blur spheres */}
      {activeTheme !== 'light' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/5 -top-40 -left-40 aurora-blur-sphere animate-pulse" />
          <div className="absolute w-[600px] h-[600px] rounded-full bg-rose-500/5 top-1/2 left-2/3 aurora-blur-sphere animate-pulse animate-duration-10000" />
        </div>
      )}
      
      {/* 🖥️ Top Trading-Terminal Header */}
      <header className={`${styles.headerBg} border-b border-slate-800 sticky top-0 z-30 backdrop-blur-md px-6 py-4 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 transition-all`}>
        
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-500/10">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="font-extrabold tracking-tight text-white text-lg">EDGEJOURNAL</span>
              <span className="text-[10px] font-mono tracking-wider bg-emerald-500/20 text-[#00b074] font-bold px-2 py-0.5 rounded uppercase">
                Pro Terminal v1.2
              </span>
              <span className="text-[10px] font-mono tracking-wider bg-gradient-to-r from-pink-500 to-purple-500 text-white font-black px-2.5 py-0.5 rounded uppercase shadow-sm shadow-pink-500/30">
                Made by Topu
              </span>
            </div>
            <p className="text-[10px] text-slate-500">Isolate metrics. Build discipline. Elevate edge.</p>
          </div>
        </div>

        {/* Sync, PDF Export and Clear state */}
        <div className="flex items-center space-x-2 flex-wrap">
          
          {/* Cloud Sync Status Pill */}
          <div className={`flex items-center ${styles.pillBg} border border-slate-800 rounded-xl px-3 py-2 text-xs ${styles.textMuted} space-x-2`}>
            <div className={`h-2 w-2 rounded-full ${isFirebaseEnabled || currentUser ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}></div>
            <span>
              {currentUser 
                ? `Syncing: ${currentUser.email?.slice(0, 15)}...` 
                : isFirebaseEnabled 
                  ? "Cloud Backup Off (Signed Out)" 
                  : "LocalStorage Cache Only"
              }
            </span>
          </div>

          {/* Sync indicator */}
          {syncing && (
            <div className="p-2 text-blue-500">
              <RefreshCw className="h-4 w-4 animate-spin" />
            </div>
          )}

          {/* PDF Report Export Component */}
          <Tooltip content="Print/Export Custom PDF Analytical Report">
            <div>
              <ExportPDF trades={trades} stats={performanceStats} strategies={strategies} />
            </div>
          </Tooltip>

          {/* Auth Login triggers */}
          {isFirebaseEnabled && (
            currentUser ? (
              <Tooltip content="Sign Out from Google Cloud Secure Sync">
                <button
                  onClick={handleSignOut}
                  className="bg-[#1C2128] hover:bg-red-500/10 border border-red-500/20 text-red-400 hover:text-white hover:border-red-500 p-2 text-xs font-semibold rounded-xl transition duration-200 cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </Tooltip>
            ) : (
              <Tooltip content="Authenticate with Google Accounts to Cloud Sync">
                <button
                  onClick={handleSignIn}
                  className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 p-2 text-xs font-bold rounded-xl transition duration-200 cursor-pointer flex items-center space-x-1"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Google Sync</span>
                </button>
              </Tooltip>
            )
          )}

          {/* 🎨 Theme preset templates selection panel */}
          <div className={`flex p-1 border rounded-xl space-x-1 items-center ${styles.pillBg}`} style={{ borderColor: activeTheme === 'light' ? '#CBD5E1' : '#1e293b' }}>
            <span className="text-[10px] uppercase font-mono px-1.5 pb-0.5 text-slate-500 hidden lg:inline-block">Theme:</span>
            
            <Tooltip content="Midnight Obsidian Theme Preset">
              <button
                type="button"
                onClick={() => changeTheme("midnight")}
                className={`h-5 w-5 rounded-full bg-[#161B22] border cursor-pointer transition ${activeTheme === "midnight" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-700 hover:border-slate-400"}`}
              />
            </Tooltip>

            <Tooltip content="Emerald Bull Market Theme Preset">
              <button
                type="button"
                onClick={() => changeTheme("emerald")}
                className={`h-5 w-5 rounded-full bg-[#102116] border cursor-pointer transition ${activeTheme === "emerald" ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-900 hover:border-emerald-500"}`}
              />
            </Tooltip>

            <Tooltip content="Cyberpunk Neon Theme Preset">
              <button
                type="button"
                onClick={() => changeTheme("neon")}
                className={`h-5 w-5 rounded-full bg-[#170836] border cursor-pointer transition ${activeTheme === "neon" ? "border-pink-500 ring-2 ring-pink-500/20" : "border-purple-800 hover:border-pink-500"}`}
              />
            </Tooltip>

            <Tooltip content="Light Terminal Pro Theme Preset">
              <button
                type="button"
                onClick={() => changeTheme("light")}
                className={`h-5 w-5 rounded-full bg-slate-100 border cursor-pointer transition ${activeTheme === "light" ? "border-blue-500 ring-2 ring-blue-500/20" : "border-slate-350 hover:border-blue-550"}`}
              />
            </Tooltip>
          </div>

          {/* 💥 Danger Reset button */}
          <Tooltip content="Purge all Trade Logs & Reset Local State">
            <button
              onClick={() => {
                setResetDoubleTyped("");
                setShowResetConfirm(true);
              }}
              className="bg-red-600/10 hover:bg-red-600 border border-red-600/30 text-red-500 hover:text-white p-2 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>
      </header>

      {/* Primary analytical dashboard or sub-tab selects */}
      <main className="max-w-7xl w-full mx-auto p-6 space-y-6 flex-1">
        
        {/* Navigation tabs Row */}
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center border-b ${styles.border} pb-4 space-y-4 sm:space-y-0`}>
          
          <div className={`flex ${styles.headerBg} p-1 border rounded-xl relative`} style={{ borderColor: activeTheme === 'light' ? '#E2E8F0' : '#1e293b' }}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("ledger")}
              className={`relative py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors duration-300 flex items-center space-x-1.5 cursor-pointer z-10 ${
                activeTab === "ledger" ? "text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "ledger" && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                animate={activeTab === "ledger" ? { rotate: [0, 360], scale: [1, 1.2, 1] } : { rotate: 0 }}
                transition={{ type: "tween", duration: 0.5 }}
              >
                <Compass className="h-4 w-4" />
              </motion.span>
              <span>Trades Ledger</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("analytics")}
              className={`relative py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors duration-300 flex items-center space-x-1.5 cursor-pointer z-10 ${
                activeTab === "analytics" ? "text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "analytics" && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                animate={activeTab === "analytics" ? { y: [0, -5, 2, 0], scale: [1, 1.25, 0.9, 1] } : { y: 0 }}
                transition={{ type: "tween", duration: 0.5, ease: "easeInOut" }}
              >
                <BarChart3 className="h-4 w-4" />
              </motion.span>
              <span>Edge Analytics</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("strategies")}
              className={`relative py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors duration-300 flex items-center space-x-1.5 cursor-pointer z-10 ${
                activeTab === "strategies" ? "text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "strategies" && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                animate={activeTab === "strategies" ? { x: [0, -4, 4, -2, 2, 0] } : { x: 0 }}
                transition={{ type: "tween", duration: 0.5 }}
              >
                <Layers className="h-4 w-4" />
              </motion.span>
              <span>Strategies Vault</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab("reports")}
              className={`relative py-2 px-4 rounded-lg text-xs font-bold tracking-wide transition-colors duration-300 flex items-center space-x-1.5 cursor-pointer z-10 ${
                activeTab === "reports" ? "text-white font-extrabold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {activeTab === "reports" && (
                <motion.span
                  layoutId="activeTabPill"
                  className="absolute inset-0 bg-blue-600 rounded-lg -z-10 shadow-lg shadow-blue-500/10"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <motion.span
                animate={activeTab === "reports" ? { rotate: [0, 360] } : { rotate: 0 }}
                transition={{ type: "spring", stiffness: 180, damping: 12 }}
              >
                <BookOpen className="h-4 w-4" />
              </motion.span>
              <span>Monthly Audits</span>
            </motion.button>
          </div>

          <motion.button
            whileHover={{ scale: 1.03, y: -2, boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.4)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setEditTradeData(null);
              setShowTradeForm(true);
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold tracking-wide flex items-center justify-center space-x-1.5 cursor-pointer shadow-lg shadow-blue-900/20 transition-all duration-300"
          >
            <Plus className="h-4 w-4" />
            <span>Record New Ticket</span>
          </motion.button>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {/* 📚 TAB 1: trades list / ledger view */}
          {activeTab === "ledger" && (
            <motion.div
              key="ledger-tab"
              initial={{ opacity: 0, x: -40, scale: 0.98 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 210, damping: 23 }}
              className="space-y-4"
            >
            
            {/* Search, Filter blocks */}
            <div className={`${styles.cardBg} border ${styles.border} p-4 rounded-2xl flex flex-col md:flex-row justify-between items-stretch md:items-center space-y-3 md:space-y-0 md:space-x-4 transition-all duration-300`}>
              
              {/* Dynamic search bar */}
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-500 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search pairs, setups, confluences..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-xs pl-10 pr-4 py-2.5 ${styles.inputBg} rounded-xl focus:border-blue-500 focus:outline-none placeholder-slate-500 text-slate-200 font-sans`}
                />
              </div>

              <div className="flex items-center space-x-3 flex-wrap">
                
                {/* Win / Loss quick filter selector */}
                <div className={`flex ${styles.pillBg} p-1 border ${styles.border} rounded-xl`}>
                  <button
                    onClick={() => setStatusFilter("ALL")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider transition uppercase cursor-pointer ${
                      statusFilter === "ALL" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter("WINS")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider transition uppercase cursor-pointer ${
                      statusFilter === "WINS" ? "bg-emerald-500/20 text-[#00b074]" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Wins
                  </button>
                  <button
                    onClick={() => setStatusFilter("LOSSES")}
                    className={`py-1.5 px-3 rounded-lg text-[10px] font-bold tracking-wider transition uppercase cursor-pointer ${
                      statusFilter === "LOSSES" ? "bg-red-500/20 text-red-500" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Losses
                  </button>
                </div>

                {/* Strategy specific filter */}
                <div className="relative">
                  <select
                    value={strategyFilter}
                    onChange={(e) => setStrategyFilter(e.target.value)}
                    className={`appearance-none ${styles.inputBg} border ${styles.border} text-xs py-2 px-4 pr-8 rounded-xl font-medium focus:outline-none cursor-pointer`}
                  >
                    <option value="ALL_STRATEGIES">All Strategies</option>
                    {strategies.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tag classification filter */}
                <div className="relative">
                  <select
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    className={`appearance-none ${styles.inputBg} border ${styles.border} text-xs py-2 px-4 pr-8 rounded-xl font-semibold text-rose-450 focus:border-rose-500 focus:outline-none cursor-pointer`}
                  >
                    <option value="ALL_TAGS" className="text-slate-400">🏷️ All Trade Tags</option>
                    {Array.from(new Set(trades.flatMap(t => t.tags || []).filter(Boolean))).map((tTag) => (
                      <option key={tTag} value={tTag} className="text-white bg-slate-950">
                        🏷️ {tTag}
                      </option>
                    ))}
                  </select>
                </div>

              </div>

            </div>

             {/* Trading Tickets list display */}
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence mode="popLayout">
                {filteredTrades.map((t) => {
                  const isExpanded = expandedTradeIds.includes(t.id);
                  return (
                    <div key={t.id} style={{ perspective: 1200 }} className="w-full">
                      <motion.div 
                         layout
                         animate={{ 
                           opacity: 1, 
                           scale: 1,
                           rotateY: isExpanded ? 180 : 0 
                         }}
                         initial={{ opacity: 0, y: 15, scale: 0.98 }}
                         exit={{ opacity: 0, scale: 0.95 }}
                         transition={{ 
                           type: "spring", 
                           stiffness: 120, 
                           damping: 18,
                           layout: { type: "spring", stiffness: 180, damping: 21 }
                         }}
                         style={{ transformStyle: "preserve-3d" }}
                         whileHover={{ y: -2, scale: 1.004 }}
                         className="relative w-full"
                      >
                        {/* FRONT SIDE (rotated 0deg) */}
                        <div
                          style={{ 
                            backfaceVisibility: "hidden", 
                            WebkitBackfaceVisibility: "hidden"
                          }}
                          className={`${
                            isExpanded ? "absolute inset-0 pointer-events-none overflow-hidden opacity-0" : "relative"
                          } ${styles.cardBg} ${styles.cardHover} border ${styles.border} rounded-2xl p-5 shadow-xl transition-all duration-300 md:flex justify-between items-start space-y-4 md:space-y-0`}
                        >
                          {/* Left segment details */}
                          <div className="space-y-2 flex-1 pr-6">
                            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
                              <span className={`font-mono text-lg font-extrabold ${activeTheme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                                {t.pair}
                              </span>
                              <span className={`text-[10px] font-extrabold tracking-widest px-2.5 py-0.5 rounded font-mono ${
                                t.direction === "LONG" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-450"
                              }`}>
                                {t.direction}
                              </span>
                              <span className={`text-[10px] ${styles.textMuted} bg-slate-850 px-2 py-0.5 rounded border ${styles.border}`}>
                                R:R 1:{t.riskReward}
                              </span>
                              <span className={`text-[10px] ${styles.textMuted} font-medium`}>
                                {new Date(t.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}  • {t.date ? new Date(t.date + "T00:00:00").toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : new Date(t.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                              </span>
                            </div>

                            <div className="flex items-center space-x-3 mt-1 flex-wrap gap-y-1.5">
                              <div className="text-xs text-blue-500 font-semibold flex items-center space-x-1">
                                <Layers className="h-3.5 w-3.5 text-blue-400" />
                                <span>{t.strategy}</span>
                              </div>
                              {t.tags && t.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1">
                                  {t.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-[9.5px] font-black px-2.5 py-0.5 rounded-lg uppercase tracking-wider bg-rose-550/10 border border-rose-500/25 text-rose-400 flex items-center space-x-1"
                                    >
                                      <span>🏷️</span>
                                      <span>{tag}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                             {/* Mistakes displays */}
                            {t.mistake && t.mistake.toLowerCase() !== "none" && (
                              <div className="flex items-center space-x-1.5 mt-2 bg-red-550/10 text-red-500 text-xs px-2.5 py-1 rounded-lg border border-red-500/20 max-w-fit font-semibold">
                                <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                                <span>Execution Flaw: <strong className="font-semibold italic">"{t.mistake}"</strong></span>
                              </div>
                            )}

                            {/* Position size parameters (Lot size, Leverage, Risk Percent, Account Balance) */}
                            {(t.lotSize !== undefined || t.leverage !== undefined || t.riskPercent !== undefined) && (
                              <div className="grid grid-cols-3 gap-2 mt-2 bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[10px]">
                                {t.lotSize !== undefined && (
                                  <div className="flex flex-col items-center justify-center py-1 text-center border-r border-slate-800/60">
                                    <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider mb-0.5">Lot Sizing</span>
                                    <span className="text-white font-extrabold text-xs">{t.lotSize} Lots</span>
                                  </div>
                                )}
                                {t.riskPercent !== undefined && (
                                  <div className="flex flex-col items-center justify-center py-1 text-center border-r border-slate-800/60">
                                    <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider mb-0.5">Risk Exposure</span>
                                    <span className="text-red-400 font-extrabold text-xs">{t.riskPercent}%</span>
                                  </div>
                                )}
                                {t.leverage !== undefined && (
                                  <div className="flex flex-col items-center justify-center py-1 text-center">
                                    <span className="text-slate-500 uppercase font-bold text-[8px] tracking-wider mb-0.5">Multiplier</span>
                                    <span className="text-amber-500 font-extrabold text-xs">{t.leverage}x Leverage</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Expandable Details Toggle */}
                            <div className="pt-2">
                              <button
                                onClick={() => toggleTradeExpanded(t.id)}
                                className={`px-3.5 py-1.5 rounded-xl border text-[11px] font-bold tracking-wide flex items-center space-x-1.5 transition-all duration-300 cursor-pointer ${
                                  activeTheme === "light"
                                    ? "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200/50"
                                    : "bg-[#0A0E14] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/40"
                                }`}
                              >
                                <span>Inspect Analytics & Chart Proof</span>
                                <motion.span
                                  animate={{ rotate: isExpanded ? 180 : 0 }}
                                  transition={{ duration: 0.25 }}
                                >
                                  <ChevronDown className="h-3.5 w-3.5 text-blue-400" />
                                </motion.span>
                              </button>
                            </div>
                          </div>

                          {/* Right segment stats & delete triggers */}
                          <div className="flex md:flex-col justify-between items-end md:space-y-4">
                            <div className="text-right">
                              <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Net PnL Outcome</span>
                              <span className={`text-xl font-bold font-mono tracking-tight ${t.profit >= 0 ? "text-[#00b074]" : "text-[#f23645]"}`}>
                                {t.profit >= 0 ? "+" : ""}${t.profit.toLocaleString()}
                              </span>
                            </div>

                            {/* Actions edit / delete buttons */}
                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  setEditTradeData(t);
                                  setShowTradeForm(true);
                                }}
                                className="p-2 text-slate-400 hover:text-white bg-[#1C2128] border border-slate-800 rounded-xl transition cursor-pointer hover:bg-[#161B22]"
                                title="Edit entry details"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTrade(t.id)}
                                className="p-2 text-red-400 hover:text-white hover:bg-red-500/10 border border-red-500/20 rounded-xl transition cursor-pointer"
                                title="Delete ticket"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* BACK SIDE (rotated 180deg) */}
                        <div
                          style={{ 
                            backfaceVisibility: "hidden", 
                            WebkitBackfaceVisibility: "hidden",
                            transform: "rotateY(180deg)",
                          }}
                          className={`${
                            !isExpanded ? "absolute inset-0 pointer-events-none overflow-hidden opacity-0" : "relative"
                          } ${styles.cardBg} border ${styles.border} rounded-2xl p-5 shadow-xl transition-all duration-300 space-y-4`}
                        >
                          {/* Back side header */}
                          <div className="flex justify-between items-center pb-2.5 border-b border-slate-800/40">
                            <div className="flex items-center space-x-2.5 flex-wrap gap-y-1.5">
                              <span className={`font-mono text-base font-extrabold ${activeTheme === 'light' ? 'text-slate-900' : 'text-white'} tracking-tight`}>
                                {t.pair}
                              </span>
                              <span className={`text-[9px] font-extrabold tracking-widest px-2 py-0.5 rounded font-mono ${
                                t.direction === "LONG" ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-450"
                              }`}>
                                {t.direction}
                              </span>
                              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-lg font-mono">
                                Analytical Backstage
                              </span>
                            </div>

                            {/* Flip card back button */}
                            <button
                              type="button"
                              onClick={() => toggleTradeExpanded(t.id)}
                              className={`px-3 py-1 text-[10px] font-bold tracking-wide flex items-center space-x-1.5 transition-all duration-300 cursor-pointer ${
                                activeTheme === "light"
                                  ? "bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-200/50"
                                  : "bg-[#0A0E14] text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800/40"
                              }`}
                            >
                              <span>Return to Front</span>
                              <RefreshCw className="h-3 w-3 animate-spin-slow text-blue-400" />
                            </button>
                          </div>

                          {/* Back side content (Analytics and evidence) */}
                          <div className="space-y-3.5">
                            {/* Entry Rules Confirmation Checklist */}
                            {t.entryRules && t.entryRules.length > 0 && (
                              <div className="space-y-1 bg-slate-900/10 p-2.5 rounded-xl border border-slate-800/40">
                                <span className={`text-[9px] font-bold uppercase tracking-wider ${styles.textMuted} block`}>
                                  🛡️ Passed entry logic thresholds ({t.entryRules.length}):
                                </span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {t.entryRules.map((rule, idx) => (
                                    <span 
                                      key={idx} 
                                      className="text-[9px] font-mono bg-emerald-500/10 text-[#00b074] border border-emerald-500/15 rounded px-2 py-0.5 uppercase tracking-wide font-extrabold"
                                    >
                                      ✓ {rule}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Big Timeframe scenario text details */}
                            {t.bigTimeFrameScenario && (
                              <div className={`bg-amber-500/5 border ${activeTheme === 'light' ? 'border-amber-400/20' : 'border-[#F59E0B]/20'} p-3 rounded-xl`}>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-500 block mb-1">
                                  📈 Higher Timeframe Scenario (Daily/4H Structure)
                                </span>
                                <p className={`text-xs ${activeTheme === 'light' ? 'text-slate-700' : 'text-slate-300'} leading-relaxed font-sans`}>
                                  {t.bigTimeFrameScenario}
                                </p>
                              </div>
                            )}

                            {/* What triggered the entry explanation */}
                            {t.entryReason && (
                              <div className={`bg-blue-500/5 border ${activeTheme === 'light' ? 'border-blue-400/20' : 'border-[#3B82F6]/20'} p-3 rounded-xl`}>
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-500 block mb-1">
                                  🎯 Lower Timeframe Trigger (Confluences)
                                </span>
                                <p className={`text-xs ${activeTheme === 'light' ? 'text-slate-700' : 'text-slate-300'} leading-relaxed font-sans whitespace-pre-wrap`}>
                                  {t.entryReason}
                                </p>
                              </div>
                            )}

                            {/* Visual Snapshots block */}
                            {(t.dailyChart || t.fourHourChart || t.oneHourChart || (t as any).fifteenMinChart || (t.images && t.images.length > 0)) && (
                              <div className="pt-1 bg-[#0A0E14]/15 p-3 rounded-xl border border-slate-800/40">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.textMuted} block mb-2`}>
                                  📸 Multi-Timeframe Chart Evidence & Snapshots Check:
                                </span>
                                
                                <div className="flex gap-2.5 flex-wrap">
                                  {/* DAILY CHART */}
                                  {t.dailyChart && (
                                    <div 
                                      onClick={() => setZoomedImage(t.dailyChart!)}
                                      className="relative rounded-xl overflow-hidden border border-slate-850 hover:border-blue-500 cursor-zoom-in h-16 w-28 group bg-black/30"
                                    >
                                      <img src={t.dailyChart} alt="Daily chart" className="h-full w-full object-cover transition duration-350 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute top-1 left-1 bg-amber-500 text-black font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        DAILY
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}

                                  {/* 4H CHART */}
                                  {t.fourHourChart && (
                                    <div 
                                      onClick={() => setZoomedImage(t.fourHourChart!)}
                                      className="relative rounded-xl overflow-hidden border border-slate-850 hover:border-blue-500 cursor-zoom-in h-16 w-28 group bg-black/30"
                                    >
                                      <img src={t.fourHourChart} alt="4H chart" className="h-full w-full object-cover transition duration-350 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute top-1 left-1 bg-blue-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        4 HOUR
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}

                                  {/* 1H CHART */}
                                  {t.oneHourChart && (
                                    <div 
                                      onClick={() => setZoomedImage(t.oneHourChart!)}
                                      className="relative rounded-xl overflow-hidden border border-slate-850 hover:border-blue-500 cursor-zoom-in h-16 w-28 group bg-black/30"
                                    >
                                      <img src={t.oneHourChart} alt="1H chart" className="h-full w-full object-cover transition duration-350 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute top-1 left-1 bg-red-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        1 HOUR
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}

                                  {/* 15M CHART */}
                                  {(t as any).fifteenMinChart && (
                                    <div 
                                      onClick={() => setZoomedImage((t as any).fifteenMinChart!)}
                                      className="relative rounded-xl overflow-hidden border border-slate-850 hover:border-blue-500 cursor-zoom-in h-16 w-28 group bg-black/30"
                                    >
                                      <img src={(t as any).fifteenMinChart} alt="15M chart" className="h-full w-full object-cover transition duration-350 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute top-1 left-1 bg-purple-500 text-white font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono">
                                        15 MIN
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  )}

                                  {/* Generic supporting images */}
                                  {t.images && t.images.map((img, idx) => (
                                    <div 
                                      key={idx} 
                                      onClick={() => setZoomedImage(img)}
                                      className="relative rounded-xl overflow-hidden border border-slate-850 hover:border-blue-500 cursor-zoom-in h-16 w-28 group bg-black/30"
                                    >
                                      <img src={img} alt="Supporting screenshot" className="h-full w-full object-cover transition duration-350 group-hover:scale-110" referrerPolicy="no-referrer" />
                                      <div className="absolute top-1 left-1 bg-slate-800 text-slate-300 font-extrabold text-[8px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono border border-slate-700">
                                        SUPPORT
                                      </div>
                                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                                        <ImageIcon className="h-4 w-4 text-white" />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Back side footer */}
                          <div className="flex justify-between items-center pt-3 border-t border-slate-800/40 text-[10px] font-mono">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-slate-500">PnL Check:</span>
                              <span className={`font-extrabold ${t.profit >= 0 ? "text-[#00b074]" : "text-[#f23645]"}`}>
                                {t.profit >= 0 ? "+" : ""}${t.profit.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-slate-500">Risked:</span>
                              <span className="text-white font-extrabold">{t.riskPercent ? `${t.riskPercent}%` : "0%"}</span>
                              <span className="text-slate-700">|</span>
                              <span className="text-slate-500">Strategy:</span>
                              <span className="text-blue-400 font-extrabold">{t.strategy}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })}
              </AnimatePresence>



              {filteredTrades.length === 0 && (
                <div className="bg-[#161B22] border border-slate-800 rounded-2xl py-12 text-center text-slate-500 flex flex-col items-center justify-center">
                  <Activity className="h-12 w-12 text-slate-600 mb-3" />
                  <p className="text-md font-semibold text-slate-300">No trading tickets found</p>
                  <p className="text-xs text-slate-500 mt-1">Try resetting the filters or log a fresh trade to populate the ledger.</p>
                </div>
              )}
            </div>

          </motion.div>
        )}

        {/* 📊 TAB 2: Performance analytics panels */}
        {activeTab === "analytics" && (
          <motion.div
            key="analytics-tab"
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -30 }}
            transition={{ type: "spring", stiffness: 170, damping: 18 }}
          >
            <AnalyticsPanel trades={trades} stats={performanceStats} />
          </motion.div>
        )}

        {/* 🗃️ TAB 3: Strategy rules vault */}
        {activeTab === "strategies" && (
          <motion.div
            key="strategies-tab"
            style={{ perspective: 1200 }}
            initial={{ opacity: 0, y: -40, rotateX: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, rotateX: -6, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 180, damping: 19 }}
          >
            <StrategyManager 
              strategies={strategies} 
              onAddStrategy={handleAddStrategy} 
              onDeleteStrategy={handleDeleteStrategy}
              trades={trades}
            />
          </motion.div>
        )}

        {/* 📅 TAB 4: Monthly audits & Chrono reports */}
        {activeTab === "reports" && (
          <motion.div
            key="reports-tab"
            style={{ perspective: 1200 }}
            initial={{ opacity: 0, rotateY: 10, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, rotateY: -10, x: -50, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 160, damping: 18 }}
          >
            <MonthlyReports 
              trades={trades} 
              styles={styles} 
              activeTheme={activeTheme}
            />
          </motion.div>
        )}
        </AnimatePresence>

      </main>

      {/* FOOTER */}
      <footer className="bg-[#0F141C] border-t border-slate-800 py-5 px-6 shrink-0 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <span>&copy; {new Date().getFullYear()} EdgeJournal Terminal. Craft an edge, master metrics.</span>
        </div>
        <div className="flex items-center space-x-3 text-[10px] uppercase font-semibold">
          <a href="#" className="hover:text-white transition">Documentation</a>
          <span className="text-slate-700">•</span>
          <a href="#" className="hover:text-white transition">Security Spec</a>
        </div>
      </footer>

      {/* Render Add/Edit Modal */}
      {showTradeForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl">
            <TradeForm 
              onSaveTrade={handleSaveTrade} 
              onCancel={() => {
                setShowTradeForm(false);
                setEditTradeData(null);
              }} 
              strategies={strategies}
              initialData={editTradeData}
            />
          </div>
        </div>
      )}

      {/* 💥 database Purge / Reset confirmation popup */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#161B22] border border-red-500/40 rounded-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="inline-block p-3 bg-red-600/10 rounded-full text-red-500">
              <AlertTriangle className="h-10 w-10 animate-bounce" />
            </div>
            
            <h3 className="text-lg font-bold text-white">Prism Database Purge Alert</h3>
            <p className="text-xs text-slate-400">
              This action will completely delete all recorded trade history, metrics, and custom strategy settings, resetting all statistics back to zero. This is a terminal action.
            </p>

            <div className="space-y-2 text-left">
              <label className="block text-[10px] text-slate-500 tracking-wider font-semibold uppercase">Type "RESET" to confirm deletion</label>
              <input
                type="text"
                placeholder="Type RESET"
                value={resetDoubleTyped}
                onChange={(e) => setResetDoubleTyped(e.target.value)}
                className="w-full text-xs font-mono bg-[#0A0E14] border border-red-500/30 rounded-xl p-3 text-red-400 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="w-full text-xs bg-[#1C2128] text-slate-400 hover:text-white py-2.5 rounded-xl font-semibold transition cursor-pointer"
              >
                Nevermind, Cancel
              </button>
              
              <button
                onClick={handleResetAllData}
                disabled={resetDoubleTyped !== "RESET"}
                className="w-full text-xs bg-red-600 hover:bg-red-700 disabled:bg-[#1C2128] disabled:text-slate-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-bold transition cursor-pointer"
              >
                Yes, Purge Database
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Enlarge zoom view modal */}
      {zoomedImage && (
        <div 
          onClick={() => setZoomedImage(null)}
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center cursor-zoom-out p-4"
        >
          <img src={zoomedImage} alt="Zoomed chart snapshot" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl object-contain" />
        </div>
      )}

      {/* 🚀 Satisfying Animated Confirmation Notification Banner */}
      <AnimatePresence>
        {tradeSavedAlert && (
          <motion.div
            initial={{ opacity: 0, x: 250, y: 0, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 200, scale: 0.9, transition: { duration: 0.2 } }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-[#0d1d2b]/95 border border-emerald-500/30 rounded-2xl shadow-2xl p-4 backdrop-blur-md flex items-start space-x-3"
          >
            <div className={`p-2.5 rounded-xl shrink-0 ${
              tradeSavedAlert.type === "SAVE" ? "bg-emerald-500/15 text-emerald-400" :
              tradeSavedAlert.type === "UPDATE" ? "bg-blue-500/15 text-blue-400" : "bg-red-500/15 text-red-500"
            }`}>
              {tradeSavedAlert.type === "SAVE" ? <Check className="h-5 w-5" /> : 
               tradeSavedAlert.type === "UPDATE" ? <RefreshCw className="h-5 w-5 font-bold animate-spin" style={{ animationDuration: '3s' }} /> : <Trash2 className="h-5 w-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black uppercase tracking-wider text-white">
                {tradeSavedAlert.type === "SAVE" ? "Ledger Entry Added!" : 
                 tradeSavedAlert.type === "UPDATE" ? "Ticket Information Updated" : "Ledger Entry Deleted"}
              </p>
              <p className="text-[11px] text-slate-300 leading-normal mt-1">
                {tradeSavedAlert.type === "SAVE" && (
                  <span>
                    Successfully logged premium transaction for <strong>{tradeSavedAlert.pair}</strong> with result of{" "}
                    <strong className={tradeSavedAlert.profit >= 0 ? "text-emerald-400" : "text-red-400"}>
                      ${tradeSavedAlert.profit.toLocaleString()}
                    </strong>.
                  </span>
                )}
                {tradeSavedAlert.type === "UPDATE" && (
                  <span>
                    Successfully synchronized and updated details for <strong>{tradeSavedAlert.pair}</strong> ledger sheet.
                  </span>
                )}
                {tradeSavedAlert.type === "DELETE" && (
                  <span>
                    The selected <strong>{tradeSavedAlert.pair}</strong> ledger ticket has been permanently deleted from storage.
                  </span>
                )}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                  💾 Local Cache Synced
                </span>
                {currentUser && (
                  <span className="text-[9px] font-mono text-blue-400/80 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase font-bold">
                    ☁️ Cloud Synced
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={() => setTradeSavedAlert(null)}
              className="text-slate-500 hover:text-white p-0.5"
            >
              <Plus className="h-4 w-4 rotate-45 shrink-0 cursor-pointer" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
