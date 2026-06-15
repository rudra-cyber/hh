import React, { useState, useRef, useEffect } from "react";
import { Trade, Strategy, TradeDirection, AIExtractResult } from "../types";
import { 
  X, Plus, Camera, Image as ImageIcon, Sparkles, 
  DollarSign, Percent, Scale, Save, UserCheck, CheckCircle2,
  Calendar, Clock, Layers, HelpCircle, Eye, AlertTriangle,
  Mic, MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Fixed import for compatibility
import AIAssistant from "./AIAssistant";

interface TradeFormProps {
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt"> & { id?: string }) => void;
  onCancel: () => void;
  strategies: Strategy[];
  initialData?: Trade | null;
}

export default function TradeForm({ onSaveTrade, onCancel, strategies, initialData }: TradeFormProps) {
  // --- IMAGE COMPRESSION LOGIC (FIRESTORE 1MB LIMIT FIX) ---
  const compressImage = (base64Str: string, maxWidth = 1024, quality = 0.6): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize logic: maintain aspect ratio
        if (width > maxWidth) {
          height = (maxWidth / width) * height;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Convert to JPEG with compression quality 0.6
          resolve(canvas.toDataURL('image/jpeg', quality));
        } else {
          resolve(base64Str);
        }
      };
    });
  };

  // Core states
  const [pair, setPair] = useState("");
  const [strategy, setStrategy] = useState("");
  const [direction, setDirection] = useState<TradeDirection>("LONG");
  const [profit, setProfit] = useState<number | "">("");
  const [riskReward, setRiskReward] = useState<number | "">("");
  const [mistake, setMistake] = useState("None");
  const [entryReason, setEntryReason] = useState("");

  // Voice-to-Text states
  const [isListening, setIsListening] = useState(false);
  const [speechLang, setSpeechLang] = useState<"en-US" | "bn-BD">("en-US");
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log(err);
        }
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("❌ Speech recognition not supported.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (err) {}
      }
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRecognition();
      rec.lang = speechLang;
      rec.interimResults = false;
      rec.continuous = true;

      rec.onstart = () => {
        setIsListening(true);
        showToast(`🎙️ Listening in ${speechLang === "en-US" ? "English" : "Bangla"}...`);
      };

      rec.onend = () => setIsListening(false);
      rec.onresult = (event: any) => {
        let finalTrans = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalTrans += event.results[i][0].transcript;
        }
        if (finalTrans) setEntryReason((prev) => prev ? `${prev} ${finalTrans.trim()}` : finalTrans.trim());
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Visual success feedback
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [successAnimationActive, setSuccessAnimationActive] = useState(false);
  const [saveLoadStep, setSaveLoadStep] = useState(1);
  const [saveProgress, setSaveProgress] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const [entryRules, setEntryRules] = useState<string[]>([]);
  const [customRuleInput, setCustomRuleInput] = useState("");
  const [manualEntryLogicText, setManualEntryLogicText] = useState("");
  const defaultRules = [
    "Fair Value Gap (FVG)", "Structure Shift (MSS/MSB)", "Change of Character (ChoCh)",
    "Liquidity Sweep / Grab", "Discount Zone Alignment", "HTF Key Level S/R",
    "Killzone Session Timing", "EMA/SMA Trend Alignment", "Fibonacci Golden Zone (0.618)"
  ];

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
  const [date, setDate] = useState("");
  const [timeHour, setTimeHour] = useState("12");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");
  const [isCustomStrategy, setIsCustomStrategy] = useState(false);
  const [customStrategyName, setCustomStrategyName] = useState("");

  const [dailyChart, setDailyChart] = useState("");
  const [fourHourChart, setFourHourChart] = useState("");
  const [oneHourChart, setOneHourChart] = useState("");
  const [fifteenMinChart, setFifteenMinChart] = useState("");
  const [bigTimeFrameScenario, setBigTimeFrameScenario] = useState("");
  const [images, setImages] = useState<string[]>([]);

  const [activePasteSlot, setActivePasteSlot] = useState<"daily" | "4h" | "1h" | "15m" | "generic">("generic");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCategory, setCaptureCategory] = useState<"daily" | "4h" | "1h" | "15m" | "generic">("generic");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRefGeneric = useRef<HTMLInputElement | null>(null);
  const fileInputRefDaily = useRef<HTMLInputElement | null>(null);
  const fileInputRefFourHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefOneHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefFifteenMin = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (strategies.length > 0) setStrategy(strategies[0].name);
    const now = new Date();
    setDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`);
    let hr = now.getHours();
    setTimePeriod(hr >= 12 ? "PM" : "AM");
    hr = hr % 12 || 12;
    setTimeHour(String(hr).padStart(2, '0'));
    setTimeMinute(String(now.getMinutes()).padStart(2, '0'));
  }, [strategies]);

  useEffect(() => {
    if (initialData) {
      setPair(initialData.pair);
      setDirection(initialData.direction);
      setEntryReason(initialData.entryReason);
      setProfit(initialData.profit);
      setRiskReward(initialData.riskReward);
      setMistake(initialData.mistake);
      setImages(initialData.images || []);
      setDailyChart(initialData.dailyChart || "");
      setFourHourChart(initialData.fourHourChart || "");
      setOneHourChart(initialData.oneHourChart || "");
      setFifteenMinChart((initialData as any).fifteenMinChart || "");
      setBigTimeFrameScenario(initialData.bigTimeFrameScenario || "");
      if (initialData.entryRules) setEntryRules(initialData.entryRules.filter(r => defaultRules.includes(r)));
      if (initialData.lotSize) setLotSize(initialData.lotSize);
      if (initialData.leverage) setLeverage(initialData.leverage);
      if (initialData.riskPercent) setRiskPercent(initialData.riskPercent);
      if (initialData.stopLossPips) setStopLossPips(initialData.stopLossPips);
      if (initialData.accountBalance) setAccountBalance(initialData.accountBalance);
      setSelectedTags(initialData.tags || []);
    }
  }, [initialData]);

  // Unified Pasting with Compression
  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('.ai-assistant-zone')) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            const reader = new FileReader();
            reader.onloadend = async () => {
              const compressed = await compressImage(reader.result as string);
              if (activePasteSlot === "daily") setDailyChart(compressed);
              else if (activePasteSlot === "4h") setFourHourChart(compressed);
              else if (activePasteSlot === "1h") setOneHourChart(compressed);
              else if (activePasteSlot === "15m") setFifteenMinChart(compressed);
              else setImages((prev) => [...prev, compressed]);
              showToast("📸 Image Compressed & Attached!");
            };
            reader.readAsDataURL(file);
          }
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, [activePasteSlot]);

  const handleAIAutoFill = async (extracted: AIExtractResult, screenshotBase64?: string) => {
    if (extracted.pair) setPair(extracted.pair.toUpperCase());
    if (extracted.direction) setDirection(extracted.direction);
    if (extracted.riskReward) setRiskReward(extracted.riskReward);
    if (extracted.entryReason) setEntryReason(extracted.entryReason);
    
    if (screenshotBase64) {
      const compressed = await compressImage(screenshotBase64);
      if (!dailyChart) setDailyChart(compressed);
      else setImages((prev) => [...prev, compressed]);
      showToast("🤖 AI Snapshot Compressed!");
    }
  };

  const handleImageFileLoad = (e: React.ChangeEvent<HTMLInputElement>, category: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        if (category === "daily") setDailyChart(compressed);
        else if (category === "4h") setFourHourChart(compressed);
        else if (category === "1h") setOneHourChart(compressed);
        else if (category === "15m") setFifteenMinChart(compressed);
        else setImages((prev) => [...prev, compressed]);
        showToast("✅ Uploaded & Compressed!");
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = (category: any) => {
    setCaptureCategory(category);
    setIsCapturing(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      });
  };

  const snapPhoto = async () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
      const compressed = await compressImage(canvas.toDataURL("image/jpeg"), 1024, 0.6);
      
      if (captureCategory === "daily") setDailyChart(compressed);
      else if (captureCategory === "4h") setFourHourChart(compressed);
      else if (captureCategory === "1h") setOneHourChart(compressed);
      else if (captureCategory === "15m") setFifteenMinChart(compressed);
      else setImages((prev) => [...prev, compressed]);
      
      closeCamera();
    }
  };

  const closeCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    setIsCapturing(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessAnimationActive(true);
    setSaveProgress(0);

    // Simulated sync steps
    setTimeout(() => setSaveProgress(30), 500);
    setTimeout(() => setSaveProgress(70), 1500);
    setTimeout(() => {
      setSaveProgress(100);
      const finalTrade = {
        id: initialData?.id,
        pair: pair || "BTCUSD",
        strategy: isCustomStrategy ? customStrategyName : strategy,
        direction,
        time: new Date(`${date} ${timeHour}:${timeMinute} ${timePeriod}`).toISOString(),
        profit: profit || 0,
        riskReward: riskReward || 2,
        mistake,
        entryReason,
        dailyChart, fourHourChart, oneHourChart, fifteenMinChart,
        images,
        entryRules,
        tags: selectedTags,
        lotSize, leverage, riskPercent, accountBalance
      };
      onSaveTrade(finalTrade as any);
      setSuccessAnimationActive(false);
    }, 2500);
  };

  return (
    <div className="relative bg-[#161B22] rounded-3xl border border-slate-800 overflow-hidden max-w-5xl mx-auto shadow-2xl p-6 text-slate-200">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="fixed top-10 left-1/2 -translate-x-1/2 z-[150] bg-blue-600 px-6 py-3 rounded-full font-bold shadow-xl border border-blue-400">
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      {successAnimationActive && (
        <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-64 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <motion.div animate={{ width: `${saveProgress}%` }} className="h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
          </div>
          <p className="mt-4 font-mono text-emerald-500 animate-pulse uppercase tracking-widest text-xs">Syncing to Cloud Ledger...</p>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-black italic tracking-tighter flex items-center gap-2">
          <Sparkles className="text-blue-500" /> {initialData ? "EDIT TICKET" : "LOG NEW TRADE"}
        </h2>
        <button onClick={onCancel} className="p-2 hover:bg-white/5 rounded-full"><X /></button>
      </div>

      {!initialData && <AIAssistant onExtractionComplete={handleAIAutoFill} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6">
        
        {/* Left Section */}
        <div className="space-y-6">
          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4 shadow-inner">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Asset Pair</label>
                <input value={pair} onChange={e => setPair(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-blue-500 outline-none font-black" placeholder="BTCUSD" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Direction</label>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                  <button type="button" onClick={() => setDirection("LONG")} className={`flex-1 py-2 rounded-lg text-xs font-black ${direction === 'LONG' ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>LONG</button>
                  <button type="button" onClick={() => setDirection("SHORT")} className={`flex-1 py-2 rounded-lg text-xs font-black ${direction === 'SHORT' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>SHORT</button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Strategy</label>
              <select value={strategy} onChange={e => setStrategy(e.target.value)} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl outline-none font-bold">
                {strategies.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4">
             <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Outcome ($)</label>
                 <input type="number" value={profit} onChange={e => setProfit(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-emerald-500 outline-none font-mono font-black" placeholder="0.00" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Risk:Reward</label>
                 <input type="number" value={riskReward} onChange={e => setRiskReward(e.target.value === "" ? "" : parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 p-3 rounded-xl focus:border-blue-500 outline-none font-mono" placeholder="2.0" />
               </div>
             </div>
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-2">
            <label className="text-[10px] font-bold text-red-500 uppercase tracking-widest block">Mistakes / Lessons</label>
            <textarea value={mistake} onChange={e => setMistake(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-red-500 outline-none text-xs leading-loose" rows={3} placeholder="Any psychological or technical errors?" />
          </div>
        </div>

        {/* Right Section: Multi-Timeframe Charts with Auto-Compression */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">CHART EVIDENCE</h3>
            <span className="text-[9px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded font-bold animate-pulse">AUTO-COMPRESS ACTIVE</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'daily', label: 'Daily HTF', state: dailyChart, set: setDailyChart, ref: fileInputRefDaily },
              { id: '4h', label: '4 Hour MTF', state: fourHourChart, set: setFourHourChart, ref: fileInputRefFourHour },
              { id: '1h', label: '1 Hour LTF', state: oneHourChart, set: setOneHourChart, ref: fileInputRefOneHour },
              { id: '15m', label: '15 Min Entry', state: fifteenMinChart, set: setFifteenMinChart, ref: fileInputRefFifteenMin }
            ].map((slot) => (
              <div 
                key={slot.id} 
                onClick={() => setActivePasteSlot(slot.id as any)}
                className={`relative h-32 rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${activePasteSlot === slot.id ? 'border-blue-500 bg-blue-500/5' : 'border-white/5 bg-black/20'}`}
              >
                {slot.state ? (
                  <>
                    <img src={slot.state} className="w-full h-full object-cover" />
                    <button type="button" onClick={(e) => { e.stopPropagation(); slot.set(""); }} className="absolute top-2 right-2 bg-red-600 p-1 rounded-full"><X size={12}/></button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2">
                    <ImageIcon size={20} className={activePasteSlot === slot.id ? 'text-blue-500' : 'text-slate-600'} />
                    <span className="text-[9px] font-black uppercase text-slate-500">{slot.label}</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 flex gap-1">
                  <button type="button" onClick={(e) => { e.stopPropagation(); slot.ref.current?.click(); }} className="p-1 bg-black/60 rounded border border-white/10 text-[8px] font-bold">FILE</button>
                  <button type="button" onClick={(e) => { e.stopPropagation(); startCamera(slot.id); }} className="p-1 bg-black/60 rounded border border-white/10">📷</button>
                </div>
                <input type="file" ref={slot.ref as any} className="hidden" onChange={(e) => handleImageFileLoad(e, slot.id)} />
              </div>
            ))}
          </div>

          <div className="bg-[#0F141C] p-5 rounded-2xl border border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">Entry Reason</label>
                <button type="button" onClick={startListening} className={`p-2 rounded-xl transition-all ${isListening ? 'bg-red-600 animate-pulse' : 'bg-white/5'}`}><Mic size={16}/></button>
             </div>
             <textarea value={entryReason} onChange={e => setEntryReason(e.target.value)} className="w-full bg-black/40 border border-white/5 p-4 rounded-xl focus:border-blue-500 outline-none text-xs italic" rows={4} placeholder="Dictate or type your confluence..." />
          </div>

          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-900/20 flex items-center justify-center gap-3 tracking-widest uppercase text-sm">
            <Save /> Save Pro Ticket
          </motion.button>
        </div>
      </form>

      {isCapturing && (
        <div className="fixed inset-0 z-[250] bg-black flex flex-col items-center justify-center p-6">
          <video ref={videoRef} className="max-w-md w-full rounded-3xl border-4 border-blue-600 shadow-2xl" autoPlay playsInline />
          <div className="mt-8 flex gap-6">
            <button onClick={closeCamera} className="px-8 py-3 bg-white/10 rounded-2xl font-bold">CANCEL</button>
            <button onClick={snapPhoto} className="px-8 py-3 bg-blue-600 rounded-2xl font-black">CAPTURE</button>
          </div>
        </div>
      )}
    </div>
  );
}
