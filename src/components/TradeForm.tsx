import React, { useState, useRef, useEffect } from "react";
import { Trade, Strategy, TradeDirection, AIExtractResult } from "../types";
import { 
  X, Plus, Camera, Image as ImageIcon, Sparkles, 
  DollarSign, Percent, Scale, Save, UserCheck, CheckCircle2,
  Calendar, Clock, Layers, HelpCircle, Eye, AlertTriangle,
  Mic, MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AIAssistant from "./AIAssistant";

interface TradeFormProps {
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt"> & { id?: string }) => void;
  onCancel: () => void;
  strategies: Strategy[];
  initialData?: Trade | null;
}

export default function TradeForm({ onSaveTrade, onCancel, strategies, initialData }: TradeFormProps) {
  
  // --- IMAGE COMPRESSION LOGIC (FIRESTORE FIX) ---
  const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64Str);
        }
      };
    });
  };

  // Core states (Original)
  const [pair, setPair] = useState("");
  const [strategy, setStrategy] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [profit, setProfit] = useState<number | "">("");
  const [riskReward, setRiskReward] = useState<number | "">("");
  const [mistake, setMistake] = useState("None");
  const [entryReason, setEntryReason] = useState("");

  // Voice States (Original)
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "bn-BD">("en-US");
  const recognitionRef = useRef<any>(null);

  // Success Feedback States (Original)
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [successAnimationActive, setSuccessAnimationActive] = useState(false);
  const [saveLoadStep, setSaveLoadStep] = useState(1);
  const [saveProgress, setSaveProgress] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Entry Logic Checklist (Original)
  const [entryRules, setEntryRules] = useState<string[]>([]);
  const [customRuleInput, setCustomRuleInput] = useState("");
  const [manualEntryLogicText, setManualEntryLogicText] = useState("");
  const defaultRules = [
    "Fair Value Gap (FVG)", "Structure Shift (MSS/MSB)", "Change of Character (ChoCh)",
    "Liquidity Sweep / Grab", "Discount Zone Alignment", "HTF Key Level S/R",
    "Killzone Session Timing", "EMA/SMA Trend Alignment", "Fibonacci Golden Zone (0.618)"
  ];

  // Calculator States (Original)
  const [accountBalance, setAccountBalance] = useState<number>(() => {
    const saved = localStorage.getItem("pro_journal_balance");
    return saved ? parseFloat(saved) : 10000;
  });
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [leverage, setLeverage] = useState<number>(20);
  const [stopLossPips, setStopLossPips] = useState<number>(25);
  const [lotSize, setLotSize] = useState<number | "">("");
  const [entryPrice, setEntryPrice] = useState<number | "">("");
  const [stopLossPrice, setStopLossPrice] = useState<number | "">("");
  const [sizingMode, setSizingMode] = useState<"forex" | "crypto">("forex");
  const [aiCalculating, setAiCalculating] = useState(false);
  const [aiCalcResponse, setAiCalcResponse] = useState<any | null>(null);

  // Time & Strategy States (Original)
  const [date, setDate] = useState("");
  const [timeHour, setTimeHour] = useState("12");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [isCustomStrategy, setIsCustomStrategy] = useState(false);
  const [customStrategyName, setCustomStrategyName] = useState("");

  // Chart States (Original)
  const [dailyChart, setDailyChart] = useState("");
  const [fourHourChart, setFourHourChart] = useState("");
  const [oneHourChart, setOneHourChart] = useState("");
  const [fifteenMinChart, setFifteenMinChart] = useState("");
  const [bigTimeFrameScenario, setBigTimeFrameScenario] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [activePasteSlot, setActivePasteSlot] = useState<"daily" | "4h" | "1h" | "15m" | "generic">("generic");

  // Tag States (Original)
  const predefinedTags = ["Breakout", "Reversal", "Trend-following", "Range Bound", "Scalping", "News Event", "High Probability", "FOMO Trade", "Risk Off"];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Refs & Capturing
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCategory, setCaptureCategory] = useState<any>("generic");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRefGeneric = useRef<HTMLInputElement | null>(null);
  const fileInputRefDaily = useRef<HTMLInputElement | null>(null);
  const fileInputRefFourHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefOneHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefFifteenMin = useRef<HTMLInputElement | null>(null);

  // Handlers (Start Listening, Paste, AI, FileLoad - All updated with Compression)
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { showToast("❌ Voice not supported"); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); return; }
    try {
      const rec = new SpeechRecognition(); rec.lang = speechLang; rec.continuous = true;
      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onresult = (e: any) => {
        let text = ""; for (let i = e.resultIndex; i < e.results.length; ++i) if (e.results[i].isFinal) text += e.results[i][0].transcript;
        if (text) setEntryReason(prev => prev ? `${prev} ${text.trim()}` : text.trim());
      };
      recognitionRef.current = rec; rec.start();
    } catch (e) { setIsListening(false); }
  };

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement; if (target?.closest('.ai-assistant-zone')) return;
      const items = e.clipboardData?.items; if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile(); if (!file) continue; e.preventDefault();
          const reader = new FileReader();
          reader.onloadend = async () => {
            const compressed = await compressImage(reader.result as string);
            if (activePasteSlot === "daily") setDailyChart(compressed);
            else if (activePasteSlot === "4h") setFourHourChart(compressed);
            else if (activePasteSlot === "1h") setOneHourChart(compressed);
            else if (activePasteSlot === "15m") setFifteenMinChart(compressed);
            else setImages(p => [...p, compressed]);
            showToast("📸 Image Compressed & Attached!");
          };
          reader.readAsDataURL(file);
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [activePasteSlot]);

  const handleAIAutoFill = async (extracted: AIExtractResult, screenshot?: string) => {
    if (extracted.pair) setPair(extracted.pair.toUpperCase());
    if (extracted.direction) setDirection(extracted.direction);
    if (extracted.riskReward) setRiskReward(extracted.riskReward);
    if (extracted.entryReason) setEntryReason(extracted.entryReason);
    if (screenshot) {
      const comp = await compressImage(screenshot);
      if (!dailyChart) setDailyChart(comp); else setImages(p => [...p, comp]);
    }
  };

  const handleImageFileLoad = (e: React.ChangeEvent<HTMLInputElement>, cat: string) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const comp = await compressImage(reader.result as string);
      if (cat === "daily") setDailyChart(comp);
      else if (cat === "4h") setFourHourChart(comp);
      else if (cat === "1h") setOneHourChart(comp);
      else if (cat === "15m") setFifteenMinChart(comp);
      else setImages(p => [...p, comp]);
      showToast("✅ Image Ready!");
    };
    reader.readAsDataURL(file);
  };

  const startCamera = (cat: any) => {
    setCaptureCategory(cat); setIsCapturing(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then(s => { streamRef.current = s; if (videoRef.current) videoRef.current.srcObject = s; });
  };

  const snapPhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth; canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const comp = await compressImage(canvas.toDataURL("image/jpeg"));
      if (captureCategory === "daily") setDailyChart(comp);
      else if (captureCategory === "4h") setFourHourChart(comp);
      else if (captureCategory === "1h") setOneHourChart(comp);
      else if (captureCategory === "15m") setFifteenMinChart(comp);
      else setImages(p => [...p, comp]);
      closeCamera();
    }
  };

  const closeCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); setIsCapturing(false); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessAnimationActive(true); setSaveProgress(0); setSaveLoadStep(1);
    setTimeout(() => { setSaveProgress(30); setSaveLoadStep(2); }, 800);
    setTimeout(() => { setSaveProgress(65); setSaveLoadStep(3); }, 1800);
    setTimeout(() => {
      setSaveProgress(100);
      const manualRules = manualEntryLogicText.split(/[\n,]+/).map(r => r.trim()).filter(r => r.length > 0);
      const data = {
        id: initialData?.id, pair: pair || "BTCUSD", 
        strategy: isCustomStrategy ? customStrategyName : strategy,
        direction, profit: profit || 0, riskReward: riskReward || 2,
        mistake, entryReason, images, dailyChart, fourHourChart, oneHourChart, fifteenMinChart,
        bigTimeFrameScenario, entryRules: Array.from(new Set([...entryRules, ...manualRules])),
        lotSize, leverage, riskPercent, accountBalance, tags: selectedTags,
        time: new Date(`${date} ${timeHour}:${timeMinute} ${timePeriod}`).toISOString()
      };
      onSaveTrade(data as any); setSuccessAnimationActive(false);
    }, 2800);
  };

  return (
    <div className="relative bg-[#161B22] rounded-3xl border border-slate-800 overflow-hidden max-w-5xl mx-auto shadow-2xl p-6 font-sans text-slate-200">
      
      {/* Toast & Holographic Sync Overlay (Original Animation) */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-blue-600 px-6 py-3 rounded-full shadow-2xl border border-blue-400 text-xs font-bold uppercase tracking-widest">
            {toastMsg}
          </motion.div>
        )}
        {successAnimationActive && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-8">
            <motion.div initial={{ rotateY: -180, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} className="bg-[#070b12] border border-emerald-500/30 rounded-3xl p-10 shadow-2xl max-w-sm w-full text-center">
               <div className="relative h-32 w-32 mx-auto mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-2 border-emerald-500 rounded-full animate-ping opacity-20" />
                  <CheckCircle2 className="h-16 w-16 text-emerald-500" />
               </div>
               <h3 className="text-xl font-black text-white mb-4 uppercase tracking-tighter italic">Ledger Sync: {saveProgress}%</h3>
               <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden mb-4">
                  <motion.div animate={{ width: `${saveProgress}%` }} className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
               </div>
               <p className="text-[10px] font-mono text-emerald-400 animate-pulse uppercase">Committing payload to cloud database...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center pb-5 border-b border-slate-800 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="text-blue-500" /> {initialData ? "Edit Trade Ticket" : "Log Pro Terminal Trade"}
          </h2>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-1">Multi-Timeframe Evidence & Auto-Compression Active</p>
        </div>
        <button onClick={onCancel} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition"><X size={20}/></button>
      </div>

      {!initialData && <div className="mb-6"><AIAssistant onExtractionComplete={handleAIAutoFill} /></div>}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* LEFT COLUMN (Original Detailed Logic) */}
        <div className="space-y-6">
          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
            <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Core Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Trading Pair</label>
                <input value={pair} onChange={e => setPair(e.target.value)} className="w-full bg-black/40 border border-slate-800 p-3 rounded-xl focus:border-blue-500 outline-none font-black text-sm" placeholder="BTCUSD" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Direction</label>
                <div className="flex bg-black/40 p-1 rounded-xl border border-slate-800">
                  <button type="button" onClick={()=>setDirection("LONG")} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${direction==='LONG'?'bg-emerald-500 text-white':'text-slate-500'}`}>LONG</button>
                  <button type="button" onClick={()=>setDirection("SHORT")} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${direction==='SHORT'?'bg-red-500 text-white':'text-slate-500'}`}>SHORT</button>
                </div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Strategy</label> <button type="button" onClick={()=>setIsCustomStrategy(!isCustomStrategy)} className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{isCustomStrategy?"Pick Existing":"Custom"}</button></div>
              {isCustomStrategy ? <input value={customStrategyName} onChange={e=>setCustomStrategyName(e.target.value)} className="w-full bg-black/40 border border-blue-500/50 p-3 rounded-xl outline-none text-sm font-bold" placeholder="Strategy Name..." /> : 
              <select value={strategy} onChange={e=>setStrategy(e.target.value)} className="w-full bg-black/40 border border-slate-800 p-3 rounded-xl outline-none font-bold text-sm">{strategies.map(s=><option key={s.id} value={s.name}>{s.name}</option>)}</select>}
            </div>
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-emerald-400 tracking-[0.2em]">Entry Confirmation</h3>
            <div className="grid grid-cols-2 gap-2">
              {defaultRules.map(r => (
                <div key={r} onClick={()=>{ entryRules.includes(r)?setEntryRules(entryRules.filter(x=>x!==r)):setEntryRules([...entryRules,r])}} className={`p-2 rounded-xl border text-[10px] font-bold cursor-pointer transition-all ${entryRules.includes(r)?'bg-emerald-500/10 border-emerald-500 text-emerald-400':'border-slate-800 text-slate-500 hover:border-slate-700'}`}>
                  {entryRules.includes(r)?'✓':'●'} {r}
                </div>
              ))}
            </div>
            <textarea value={manualEntryLogicText} onChange={e=>setManualEntryLogicText(e.target.value)} rows={2} className="w-full bg-black/40 border border-slate-800 p-3 rounded-xl outline-none text-[11px] font-medium" placeholder="Additional manual confluences..." />
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em]">Risk & Lot Calculator</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Account ($)</label><input type="number" value={accountBalance} onChange={e=>setAccountBalance(parseFloat(e.target.value)||0)} className="w-full bg-black/40 border border-slate-800 p-2.5 rounded-xl outline-none font-bold text-xs" /></div>
              <div><label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Risk (%)</label><input type="number" step="0.1" value={riskPercent} onChange={e=>setRiskPercent(parseFloat(e.target.value)||0)} className="w-full bg-black/40 border border-slate-800 p-2.5 rounded-xl outline-none font-bold text-xs" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-[9px] font-bold text-slate-500 uppercase mb-1 block">Stop Loss (Pips)</label><input type="number" value={stopLossPips} onChange={e=>setStopLossPips(parseFloat(e.target.value)||0)} className="w-full bg-black/40 border border-slate-800 p-2.5 rounded-xl outline-none font-bold text-xs" /></div>
              <div className="bg-indigo-500/10 border border-indigo-500/20 p-2 rounded-xl text-center flex flex-col justify-center">
                <span className="text-[8px] font-black text-indigo-400 uppercase">Suggested Size</span>
                <span className="text-sm font-black text-white">{parseFloat(((accountBalance*riskPercent/100)/(stopLossPips*10)).toFixed(2))} LOTS</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Original Grid with Compression slots) */}
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'daily', label: 'Daily Chart', state: dailyChart, set: setDailyChart, ref: fileInputRefDaily, type: 'HTF' },
              { id: '4h', label: '4H Chart', state: fourHourChart, set: setFourHourChart, ref: fileInputRefFourHour, type: 'MTF' },
              { id: '1h', label: '1H Chart', state: oneHourChart, set: setOneHourChart, ref: fileInputRefOneHour, type: 'LTF' },
              { id: '15m', label: '15M Chart', state: fifteenMinChart, set: setFifteenMinChart, ref: fileInputRefFifteenMin, type: 'ENT' }
            ].map(s => (
              <div key={s.id} onClick={()=>setActivePasteSlot(s.id as any)} className={`relative h-36 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activePasteSlot===s.id?'border-blue-500 bg-blue-500/5 shadow-2xl':'border-slate-800 bg-black/30 hover:border-slate-700'}`}>
                <div className="absolute top-2 left-2 z-10 flex justify-between w-[calc(100%-16px)]">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">{s.label}</span>
                  <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-blue-400">{s.type}</span>
                </div>
                {s.state ? <><img src={s.state} className="w-full h-full object-cover" /><button type="button" onClick={(e)=>{e.stopPropagation();s.set("")}} className="absolute top-2 right-2 bg-red-600/80 p-1 rounded-full"><X size={10}/></button></> : 
                <div className="flex flex-col items-center justify-center h-full opacity-30 gap-2"><ImageIcon size={20}/><span className="text-[9px] font-black uppercase">CTRL+V HERE</span></div>}
                <div className="absolute bottom-2 left-2 flex gap-1"><button type="button" onClick={(e)=>{e.stopPropagation();s.ref.current?.click()}} className="text-[8px] font-bold bg-black/60 px-2 py-1 rounded border border-white/5">FILE</button><button type="button" onClick={(e)=>{e.stopPropagation();startCamera(s.id)}} className="text-[8px] font-bold bg-black/60 px-2 py-1 rounded border border-white/5">📷</button></div>
                <input type="file" ref={s.ref as any} className="hidden" onChange={e=>handleImageFileLoad(e,s.id)} />
              </div>
            ))}
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4">
             <div className="flex justify-between items-center"><h3 className="text-[10px] font-black uppercase text-rose-400 tracking-[0.2em]">Financials & Lessons</h3></div>
             <div className="grid grid-cols-2 gap-4">
                <input type="number" step="any" value={profit} onChange={e=>setProfit(e.target.value===""?"":parseFloat(e.target.value))} className="bg-black/40 border border-slate-800 p-3 rounded-xl outline-none font-black text-sm text-emerald-400" placeholder="PnL outcome..." />
                <input type="number" step="0.1" value={riskReward} onChange={e=>setRiskReward(e.target.value===""?"":parseFloat(e.target.value))} className="bg-black/40 border border-slate-800 p-3 rounded-xl outline-none font-black text-sm" placeholder="R:R target..." />
             </div>
             <textarea value={mistake} onChange={e=>setMistake(e.target.value)} rows={2} className="w-full bg-black/40 border border-red-500/20 p-3 rounded-xl outline-none text-[11px] font-medium text-red-300" placeholder="Mistakes or lessons learned?" />
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-3">
             <div className="flex justify-between items-center"><h3 className="text-[10px] font-black uppercase text-blue-400 tracking-[0.2em]">Final Synthesis</h3> <button type="button" onClick={startListening} className={`p-2 rounded-xl ${isListening?'bg-red-600 animate-pulse':'bg-white/5'}`}><Mic size={14}/></button></div>
             <textarea value={entryReason} onChange={e=>setEntryReason(e.target.value)} rows={3} className="w-full bg-black/40 border border-slate-800 p-3 rounded-xl outline-none text-xs italic leading-relaxed" placeholder="Final confluences or trade notes..." />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 tracking-[0.2em] uppercase text-sm italic">
            <Save size={20}/> Save Pro Ledger Ticket
          </motion.button>
        </div>
      </form>

      {isCapturing && (
        <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center p-6 backdrop-blur-3xl">
          <video ref={videoRef} className="max-w-md w-full rounded-[2rem] border-4 border-blue-6
