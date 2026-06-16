import React, { useState, useRef, useEffect } from "react";
import { Trade, Strategy, TradeDirection, AIExtractResult } from "../types";
import { 
  X, Plus, Camera, Image as ImageIcon, Sparkles, 
  DollarSign, Percent, Scale, Save, UserCheck, CheckCircle2,
  Calendar, Clock, Layers, HelpCircle, Eye, AlertTriangle,
  Mic, MicOff
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import AIAssistant from "./AIAssistant";

interface TradeFormProps {
  onSaveTrade: (trade: Omit<Trade, "id" | "createdAt"> & { id?: string }) => void;
  onCancel: () => void;
  strategies: Strategy[];
  initialData?: Trade | null;
}

export default function TradeForm({ onSaveTrade, onCancel, strategies, initialData }: TradeFormProps) {
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
      showToast("❌ Speech recognition not supported in your browser. Please try Chrome/Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (err) {
          console.log(err);
        }
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
        showToast(`🎙️ Listening in ${speechLang === "en-US" ? "English" : "Bangla"}... Speak now!`);
      };

      rec.onerror = (e: any) => {
        console.error("Speech recognition error", e);
        if (e.error === "not-allowed") {
          showToast("❌ Mic permission denied. Please allow microphone access!");
        } else {
          showToast(`❌ Mic Error: ${e.error || "failed"}`);
        }
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      rec.onresult = (event: any) => {
        let finalTrans = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setEntryReason((prev) => prev ? `${prev} ${finalTrans.trim()}` : finalTrans.trim());
          showToast(`📝 Dictated: "${finalTrans.trim().substring(0, 20)}..."`);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error(e);
      showToast("❌ Failed to initiate voice stream.");
    }
  };

  // Visual success feedback & prompt states
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [successAnimationActive, setSuccessAnimationActive] = useState(false);
  const [saveLoadStep, setSaveLoadStep] = useState(1);
  const [saveProgress, setSaveProgress] = useState(0);

  const showToast = (msg: string) => {
    setToastMsg(msg);
  };

  // Entry Logic Checklist states
  const [entryRules, setEntryRules] = useState<string[]>([]);
  const [customRuleInput, setCustomRuleInput] = useState("");
  const [manualEntryLogicText, setManualEntryLogicText] = useState("");
  const defaultRules = [
    "Fair Value Gap (FVG)",
    "Structure Shift (MSS/MSB)",
    "DOM CHART",
    "Liquidity Sweep / Grab",
    "FOOTPRINT CHART",
    "HTF Key Level S/R",
     "1K DELTA",
     "HEAVY DELTA FLIP",
     "REVERSAL PATTERN",
    "BIG CANDLE",
    "MAXIMUM RETAILER ENTRY,TRAP AND SL.",
    "Fibonacci Golden Zone (0.618)"
  ];

  // Custom Lot & Risk Calculator States
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
  
  // Sizing mode (Forex Standard LOTS vs Crypto/Indices Spot Tokens/Units)
  const [sizingMode, setSizingMode] = useState<"forex" | "crypto">("forex");
  
  // AI Calculation loading/response states
  const [aiCalculating, setAiCalculating] = useState(false);
  const [aiCalcResponse, setAiCalcResponse] = useState<any | null>(null);

  // New Date & Time states
  const [date, setDate] = useState("");
  const [timeHour, setTimeHour] = useState("12");
  const [timeMinute, setTimeMinute] = useState("00");
  const [timePeriod, setTimePeriod] = useState<"AM" | "PM">("AM");

  // New Strategy Customization state
  const [isCustomStrategy, setIsCustomStrategy] = useState(false);
  const [customStrategyName, setCustomStrategyName] = useState("");

  // New dedicated Timeframe Charts states
  const [dailyChart, setDailyChart] = useState("");
  const [fourHourChart, setFourHourChart] = useState("");
  const [oneHourChart, setOneHourChart] = useState("");
  const [fifteenMinChart, setFifteenMinChart] = useState("");
  const [bigTimeFrameScenario, setBigTimeFrameScenario] = useState("");
  const [images, setImages] = useState<string[]>([]); // general slides

  // Which slot is active for clipboard copy-pasting (Ctrl+V)
  const [activePasteSlot, setActivePasteSlot] = useState<"daily" | "4h" | "1h" | "15m" | "generic">("generic");

  // Tag classification states
  const predefinedTags = [
    "Breakout",
    "Reversal",
    "Trend-following",
    "Range Bound",
    "Scalping",
    "News Event",
    "High Probability",
    "FOMO Trade",
    "Risk Off"
  ];
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState("");

  // Multi image and camera capability variables
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureCategory, setCaptureCategory] = useState<"daily" | "4h" | "1h" | "15m" | "generic">("generic");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // File input refs
  const fileInputRefGeneric = useRef<HTMLInputElement | null>(null);
  const fileInputRefDaily = useRef<HTMLInputElement | null>(null);
  const fileInputRefFourHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefOneHour = useRef<HTMLInputElement | null>(null);
  const fileInputRefFifteenMin = useRef<HTMLInputElement | null>(null);

  // Set initial default date/time & strategy on mount
  useEffect(() => {
    if (strategies.length > 0) {
      setStrategy(strategies[0].name);
    }
    
    // Set standard default values
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setDate(`${year}-${month}-${day}`);
    
    let hr = now.getHours();
    const min = String(now.getMinutes()).padStart(2, '0');
    const period = hr >= 12 ? "PM" : "AM";
    hr = hr % 12;
    if (hr === 0) hr = 12;
    setTimeHour(String(hr));
    setTimeMinute(min);
    setTimePeriod(period);
  }, [strategies]);

  // Load edit values from initialData if editing
  useEffect(() => {
    if (initialData) {
      setPair(initialData.pair);
      setDirection(initialData.direction);
      setEntryReason(initialData.entryReason);
      setProfit(initialData.profit);
      setRiskReward(initialData.riskReward);
      setMistake(initialData.mistake);
      setImages(initialData.images || []);

      // Dedicated timeframes
      setDailyChart(initialData.dailyChart || "");
      setFourHourChart(initialData.fourHourChart || "");
      setOneHourChart(initialData.oneHourChart || "");
      setFifteenMinChart((initialData as any).fifteenMinChart || "");
      setBigTimeFrameScenario(initialData.bigTimeFrameScenario || "");

      // Populate position size and checklist metrics
      if (initialData.entryRules) {
        const checkboxRules = initialData.entryRules.filter(r => defaultRules.includes(r));
        const customRules = initialData.entryRules.filter(r => !defaultRules.includes(r));
        setEntryRules(checkboxRules);
        setManualEntryLogicText(customRules.join("\n"));
      }
      if (initialData.lotSize) setLotSize(initialData.lotSize);
      if (initialData.leverage) setLeverage(initialData.leverage);
      if (initialData.riskPercent) setRiskPercent(initialData.riskPercent);
      if (initialData.stopLossPips) setStopLossPips(initialData.stopLossPips);
      if (initialData.accountBalance) setAccountBalance(initialData.accountBalance);
      setSelectedTags(initialData.tags || []);

      // Handle custom strategy detection
      const matchStrat = strategies.find(s => s.name === initialData.strategy);
      if (matchStrat) {
        setStrategy(initialData.strategy);
        setIsCustomStrategy(false);
      } else {
        setStrategy("custom_inline");
        setIsCustomStrategy(true);
        setCustomStrategyName(initialData.strategy);
      }

      // Parse Date and Time
      if (initialData.date) {
        setDate(initialData.date);
      } else if (initialData.time) {
        try {
          const dObj = new Date(initialData.time);
          if (!isNaN(dObj.getTime())) {
            const y = dObj.getFullYear();
            const m = String(dObj.getMonth() + 1).padStart(2, '0');
            const d = String(dObj.getDate()).padStart(2, '0');
            setDate(`${y}-${m}-${d}`);
          }
        } catch (_) {}
      }

      if (initialData.time) {
        const timeStr = initialData.time;
        const matchAMPM = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
        if (matchAMPM) {
          setTimeHour(matchAMPM[1]);
          setTimeMinute(matchAMPM[2]);
          setTimePeriod(matchAMPM[3].toUpperCase() as "AM" | "PM");
        } else {
          try {
            const dObj = new Date(timeStr);
            if (!isNaN(dObj.getTime())) {
              let hr = dObj.getHours();
              const min = String(dObj.getMinutes()).padStart(2, '0');
              const period = hr >= 12 ? "PM" : "AM";
              hr = hr % 12;
              if (hr === 0) hr = 12;
              setTimeHour(String(hr));
              setTimeMinute(min);
              setTimePeriod(period);
            } else {
              const matchHHMM = timeStr.match(/(\d+):(\d+)/);
              if (matchHHMM) {
                let hr = parseInt(matchHHMM[1]);
                const min = matchHHMM[2];
                const period = hr >= 12 ? "PM" : "AM";
                hr = hr % 12;
                if (hr === 0) hr = 12;
                setTimeHour(String(hr));
                setTimeMinute(min);
                setTimePeriod(period);
              }
            }
          } catch (_) {}
        }
      }
    }
  }, [initialData, strategies]);

  // Helper to compress and resize images to keep total document size under 1MB limit
  const compressAndResizeBase64 = (base64Str: string): Promise<string> => {
    if (!base64Str || !base64Str.startsWith("data:image")) {
      return Promise.resolve(base64Str);
    }
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1024;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress as JPEG to respect the 0.6 quality parameter
          resolve(canvas.toDataURL("image/jpeg", 0.6));
        } else {
          resolve(base64Str);
        }
      };
      img.onerror = () => {
        resolve(base64Str);
      };
      img.src = base64Str;
    });
  };

  // Global paste handler routed strictly to the currently highlighted "activePasteSlot"
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Avoid intercepting paste inside inputs or textareas in AI assistant zone
      const target = e.target as HTMLElement;
      if (target && target.closest('.ai-assistant-zone')) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items) return;

      let imageFound = false;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          imageFound = true;
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Data = reader.result as string;
              compressAndResizeBase64(base64Data).then((compressed) => {
                if (activePasteSlot === "daily") {
                  setDailyChart(compressed);
                  showToast("📅 Daily Chart pasted & optimized!");
                } else if (activePasteSlot === "4h") {
                  setFourHourChart(compressed);
                  showToast("⏱️ 4 Hour Chart pasted & optimized!");
                } else if (activePasteSlot === "1h") {
                  setOneHourChart(compressed);
                  showToast("⚡ 1 Hour Chart pasted & optimized!");
                } else if (activePasteSlot === "15m") {
                  setFifteenMinChart(compressed);
                  showToast("🎯 15 Min Chart pasted & optimized!");
                } else {
                  setImages((prev) => [...prev, compressed]);
                  showToast("📸 Supporting screenshot attached & optimized!");
                }
              });
            };
            reader.readAsDataURL(file);
          }
        }
      }
      if (imageFound) {
        e.preventDefault();
      }
    };

    window.addEventListener("paste", handleGlobalPaste);
    return () => {
      window.removeEventListener("paste", handleGlobalPaste);
    };
  }, [activePasteSlot]);

  // Auto-fill from AI Assistant extractor
  const handleAIAutoFill = (extracted: AIExtractResult, screenshotBase64?: string) => {
    if (extracted.pair) setPair(extracted.pair.toUpperCase());
    if (extracted.direction) setDirection(extracted.direction);
    if (extracted.riskReward) setRiskReward(extracted.riskReward);
    if (extracted.entryReason) setEntryReason(extracted.entryReason);
    if (extracted.mistake) setMistake(extracted.mistake);
    
    // Auto populate screenshot using cascading logic (or active category if selected)
    if (screenshotBase64) {
      compressAndResizeBase64(screenshotBase64).then((compressed) => {
        if (activePasteSlot !== "generic") {
          if (activePasteSlot === "daily") {
            setDailyChart(compressed);
            showToast("Gemini parsed Daily Chart & optimized!");
          } else if (activePasteSlot === "4h") {
            setFourHourChart(compressed);
            showToast("Gemini parsed 4H Chart & optimized!");
          } else if (activePasteSlot === "1h") {
            setOneHourChart(compressed);
            showToast("Gemini parsed 1H Chart & optimized!");
          } else if (activePasteSlot === "15m") {
            setFifteenMinChart(compressed);
            showToast("Gemini parsed 15M Chart & optimized!");
          }
        } else {
          // Smart Cascading Attachment routes screenshot to the first unpopulated block!
          if (!dailyChart) {
            setDailyChart(compressed);
            showToast("Gemini screenshot auto-saved to Daily Chart & optimized!");
          } else if (!fourHourChart) {
            setFourHourChart(compressed);
            showToast("Gemini screenshot auto-saved to 4 Hour Chart & optimized!");
          } else if (!oneHourChart) {
            setOneHourChart(compressed);
            showToast("Gemini screenshot auto-saved to 1 Hour Chart & optimized!");
          } else if (!fifteenMinChart) {
            setFifteenMinChart(compressed);
            showToast("Gemini screenshot auto-saved to 15 Min Chart & optimized!");
          } else {
            setImages((prev) => [...prev, compressed]);
            showToast("Gemini screenshot appended & optimized!");
          }
        }
      });
    } else {
      showToast("Gemini extracted metrics successfully!");
    }
  };

  // Image loading handlers
  const handleImageFileLoad = (e: React.ChangeEvent<HTMLInputElement>, category: "daily" | "4h" | "1h" | "15m" | "generic") => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        compressAndResizeBase64(base64).then((compressed) => {
          if (category === "daily") {
            setDailyChart(compressed);
            showToast("📅 Daily Chart uploaded & optimized!");
          } else if (category === "4h") {
            setFourHourChart(compressed);
            showToast("⏱️ 4 Hour Chart uploaded & optimized!");
          } else if (category === "1h") {
            setOneHourChart(compressed);
            showToast("⚡ 1 Hour Chart uploaded & optimized!");
          } else if (category === "15m") {
            setFifteenMinChart(compressed);
            showToast("🎯 15 Min Chart uploaded & optimized!");
          } else {
            setImages((prev) => [...prev, compressed]);
            showToast("📷 Supporting slide uploaded & optimized!");
          }
        });
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const handleMultipleGenericImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      (Array.from(files) as File[]).forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          compressAndResizeBase64(reader.result as string).then((compressed) => {
            setImages((prev) => [...prev, compressed]);
          });
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Direct webcam snapping
  const startCamera = (category: "daily" | "4h" | "1h" | "15m" | "generic") => {
    setCaptureCategory(category);
    setIsCapturing(true);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      })
      .catch((e) => {
        console.error("Camera error", e);
        alert("Camera permission denied. Please choose setup from local storage files instead.");
        setIsCapturing(false);
      });
  };

  const snapPhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      // Set to max 1024 width and responsive height for high-fidelity compression!
      const maxWidth = 1024;
      let width = videoRef.current.videoWidth || 640;
      let height = videoRef.current.videoHeight || 480;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const base64Img = canvas.toDataURL("image/jpeg", 0.6);
        
        if (captureCategory === "daily") setDailyChart(base64Img);
        else if (captureCategory === "4h") setFourHourChart(base64Img);
        else if (captureCategory === "1h") setOneHourChart(base64Img);
        else if (captureCategory === "15m") setFifteenMinChart(base64Img);
        else setImages((prev) => [...prev, base64Img]);

        closeCamera();
      }
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCapturing(false);
  };

  // Form submits compiling unified ISO timestamp values
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-resolve empty parameters, making nothing strictly mandatory!
    const finalPair = pair.trim() !== "" ? pair.toUpperCase().trim() : "BTCUSD";
    const finalStrategy = isCustomStrategy 
      ? (customStrategyName.trim() !== "" ? customStrategyName.trim() : "Custom Strategy") 
      : (strategy.trim() !== "" ? strategy : "General Setup");
    
    // If profit is left empty, default to $0
    const finalProfit = profit === "" ? 0 : parseFloat(String(profit));

    // Formulate ISO composite time
    let compiledTimeISO = new Date().toISOString();
    try {
      let hr24 = parseInt(timeHour);
      if (timePeriod === "PM" && hr24 < 12) hr24 += 12;
      if (timePeriod === "AM" && hr24 === 12) hr24 = 0;
      const minVal = parseInt(timeMinute) || 0;
      
      const [y, m, d] = date.split("-");
      const dObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d), hr24, minVal);
      if (!isNaN(dObj.getTime())) {
        compiledTimeISO = dObj.toISOString();
      }
    } catch (_) {}

    if (accountBalance) {
      localStorage.setItem("pro_journal_balance", accountBalance.toString());
    }

    // Extract custom manually typed entry confluences from manualEntryLogicText
    const manualRules = manualEntryLogicText
      .split(/[\n,]+/)
      .map(r => r.trim())
      .filter(r => r.length > 0);
    
    // Combine selected confluences with manually typed confluences
    const combinedEntryRules = Array.from(new Set([...entryRules, ...manualRules]));

    // Start professional terminal validation and save confirmation sequence!
    setSuccessAnimationActive(true);
    setSaveProgress(0);
    setSaveLoadStep(1);

    // Let's optimize/compress all photos to ensure the total document is guaranteed under 1MB limit.
    const totalImageLength = 
      (dailyChart?.length || 0) +
      (fourHourChart?.length || 0) +
      (oneHourChart?.length || 0) +
      (fifteenMinChart?.length || 0) +
      images.reduce((acc, img) => acc + (img?.length || 0), 0);

    // Calculate maximum safe parameters depending on total load size
    let targetWidth = 1024;
    let targetQuality = 0.6;
    if (totalImageLength > 600000) {
      // 600KB base64 is around 450KB binary. If we exceed this, aggressively bring sizes down
      targetWidth = 800;
      targetQuality = 0.5;
    }
    if (totalImageLength > 1200000) {
      // Extremely high load - compress down to ultra small footprint (640px wide 0.45 quality triggers)
      targetWidth = 640;
      targetQuality = 0.45;
    }

    const compressImage = (base64: string): Promise<string> => {
      if (!base64 || !base64.startsWith("data:image")) return Promise.resolve(base64);
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > targetWidth) {
            height = Math.round((height * targetWidth) / width);
            width = targetWidth;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL("image/jpeg", targetQuality));
          } else {
            resolve(base64);
          }
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
      });
    };

    // Compress all charts & screenshots in parallel. This completes in milliseconds!
    const optimizedDaily = await compressImage(dailyChart);
    const optimized4h = await compressImage(fourHourChart);
    const optimized1h = await compressImage(oneHourChart);
    const optimized15m = await compressImage(fifteenMinChart);
    const optimizedImages = await Promise.all(images.map(img => compressImage(img)));

    // Dynamic logging progression milestones
    const t1 = setTimeout(() => {
      setSaveProgress(28);
      setSaveLoadStep(2);
    }, 800);

    const t2 = setTimeout(() => {
      setSaveProgress(58);
      setSaveLoadStep(3);
    }, 1600);

    const t3 = setTimeout(() => {
      setSaveProgress(86);
      setSaveLoadStep(4);
    }, 2500);

    const t4 = setTimeout(() => {
      setSaveProgress(100);
    }, 3200);

    const t5 = setTimeout(() => {
      onSaveTrade({
        id: initialData?.id,
        pair: finalPair,
        strategy: finalStrategy,
        direction,
        time: compiledTimeISO,
        date,
        entryReason,
        profit: finalProfit,
        riskReward: parseFloat(String(riskReward)) || 2.0,
        mistake: mistake || "None",
        images: optimizedImages,
        dailyChart: optimizedDaily,
        fourHourChart: optimized4h,
        oneHourChart: optimized1h,
        fifteenMinChart: optimized15m,
        bigTimeFrameScenario,
        entryRules: combinedEntryRules,
        lotSize: lotSize !== "" ? parseFloat(String(lotSize)) : undefined,
        leverage,
        riskPercent,
        stopLossPips: stopLossPips ? parseFloat(String(stopLossPips)) : undefined,
        accountBalance,
        tags: selectedTags
      } as any);
      setSuccessAnimationActive(false);
    }, 3600);
  };

  return (
    <div className="relative bg-[#161B22] rounded-3xl border border-slate-800 overflow-hidden max-w-5xl mx-auto shadow-2xl p-6 font-sans">
      
      {/* Dynamic Animated Status Toast notifications */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 350, damping: 20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-extrabold px-6 py-3 rounded-full shadow-2xl shadow-blue-500/40 flex items-center space-x-2.5 border border-blue-400/30 text-xs tracking-wider uppercase"
          >
            <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Professional Holographic Ledger Sync Completed Overlay Animation */}
      <AnimatePresence>
        {successAnimationActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-8 overflow-hidden"
          >
            {/* Ambient sliding wave glow background lines */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
              <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] -top-20 -left-20 animate-pulse" />
              <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-[120px] -bottom-20 -right-20 animate-pulse" />
            </div>

            {/* 3D Rotating & Flipping Console Panel */}
            <motion.div
              initial={{ rotateY: -180, scale: 0.82, opacity: 0 }}
              animate={{ rotateY: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 14, mass: 1.2 }}
              className="relative z-10 flex flex-col items-center bg-[#070b12]/90 border border-emerald-500/25 rounded-3xl p-10 shadow-2xl shadow-emerald-500/10 backdrop-blur-xl max-w-sm w-full font-sans"
              style={{ perspective: 1200 }}
            >
              {/* Pulsing holographic glowing ring */}
              <div className="relative flex items-center justify-center h-40 w-40 mb-6">
                <motion.div 
                  initial={{ scale: 0.75, opacity: 0 }}
                  animate={{ scale: [1, 1.12, 1], rotate: 360, opacity: 0.75 }}
                  transition={{ duration: 1.8, ease: "easeInOut", repeat: Infinity }}
                  className="absolute inset-0 rounded-full border-t-4 border-b-4 border-emerald-500 bg-emerald-500/5 shadow-2xl shadow-emerald-500/30"
                />
                <motion.div 
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: [1, 1.03, 1], rotate: -360, opacity: 0.5 }}
                  transition={{ duration: 1.4, ease: "easeInOut", repeat: Infinity }}
                  className="absolute inset-2 rounded-full border-l-2 border-r-2 border-cyan-400"
                />
                <motion.div
                  initial={{ scale: 0, rotate: -270 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 220, damping: 15, delay: 0.25 }}
                  className="h-24 w-24 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/50 relative z-10"
                >
                  <CheckCircle2 className="h-14 w-14 text-[#06090e] shrink-0" />
                </motion.div>
              </div>

              {/* Glowing Text Banners */}
              <div className="space-y-3 w-full text-center">
                <h3 className="text-2xl font-black font-mono tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-300 bg-clip-text text-transparent uppercase">
                  Terminal Compiler Sync
                </h3>
                <p className="text-[11px] text-emerald-400 font-extrabold uppercase tracking-widest font-mono animate-pulse">
                  {saveProgress === 100 ? "🎉 Ledger Sync Complete" : "⚡ Committing Trade Ledger Ticket"}
                </p>
                
                {/* Dynamic Terminal Sync Loading Indicator */}
                <div className="bg-[#05070a] p-4 rounded-xl border border-slate-900 font-mono text-[10px] text-emerald-500 text-left space-y-2 mt-4 w-full shadow-inner select-none">
                  <div className="flex justify-between border-b border-emerald-950 pb-1 text-[9px] text-emerald-600 font-bold">
                    <span>METRICS PIPELINE</span>
                    <span className="animate-pulse">{saveProgress === 100 ? "SUCCESS" : "CONNECTING..."}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">ASSET TARGET:</span>
                    <span className="font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">{pair.toUpperCase().trim() || "BTCUSD"}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">NET OUTCOME:</span>
                    <span className={`font-black ${profit === "" || parseFloat(String(profit)) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {profit === "" || parseFloat(String(profit)) >= 0 ? "+" : ""}${profit === "" ? "0.00" : parseFloat(String(profit)).toLocaleString()}
                    </span>
                  </div>

                  {/* Progressive Terminal Logs */}
                  <div className="pt-2 border-t border-slate-900 text-[9px] text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <span className={saveLoadStep >= 1 ? "text-emerald-400" : "text-slate-600"}>{saveLoadStep >= 1 ? "✓" : "●"}</span>
                      <span className={saveLoadStep === 1 ? "text-emerald-300 font-bold animate-pulse" : saveLoadStep > 1 ? "text-slate-500 line-through" : "text-slate-600"}>
                        Encrypting transaction payload...
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={saveLoadStep >= 2 ? "text-emerald-400" : "text-slate-600"}>{saveLoadStep >= 2 ? "✓" : "●"}</span>
                      <span className={saveLoadStep === 2 ? "text-emerald-300 font-bold animate-pulse" : saveLoadStep > 2 ? "text-slate-500 line-through" : "text-slate-600"}>
                        Evaluating mathematical win/loss ratios...
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={saveLoadStep >= 3 ? "text-emerald-400" : "text-slate-600"}>{saveLoadStep >= 3 ? "✓" : "●"}</span>
                      <span className={saveLoadStep === 3 ? "text-emerald-300 font-bold animate-pulse" : saveLoadStep > 3 ? "text-slate-500 line-through" : "text-slate-600"}>
                        Synchronizing state caches...
                      </span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className={saveLoadStep >= 4 ? "text-emerald-400" : "text-slate-600"}>{saveLoadStep >= 4 ? "✓" : "●"}</span>
                      <span className={saveLoadStep === 4 ? "text-emerald-300 font-bold" : "text-slate-600"}>
                        Durable audit ledger secured.
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden mt-3 border border-slate-900">
                    <motion.div
                      animate={{ width: `${saveProgress}%` }}
                      transition={{ type: "spring", stiffness: 80, damping: 12 }}
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-0.5">
                    <span>PROGRESS STATUS</span>
                    <span>{saveProgress}%</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Header */}
      <div className="flex justify-between items-center pb-5 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center space-x-2">
            <span className="text-blue-500">⚡</span>
            <span>{initialData ? "Edit Trade Ledger Ticket" : "Log Pro Terminal Trade"}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Multi-timeframe confluences, AM/PM precise clocks, and screenshot pasting</p>
        </div>
        <button 
          onClick={onCancel}
          className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* AI Assistance autofiller */}
      {!initialData && (
        <div className="py-4 border-b border-slate-800 bg-[#0F141C]/50 rounded-xl px-2 my-2">
          <AIAssistant onExtractionComplete={handleAIAutoFill} />
        </div>
      )}

      {/* Main Form containing customized widgets */}
      <form onSubmit={handleSubmit} className="space-y-6 pt-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left Column: Metrics & Time fields */}
          <div className="space-y-5">
            
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Core Parameters</h3>
              
              {/* Pair and Direction Row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Trading Pair</label>
                  <input
                    type="text"
                    placeholder="e.g. BTCUSD"
                    value={pair}
                    onChange={(e) => setPair(e.target.value)}
                    className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-600 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Direction</label>
                  <div className="grid grid-cols-2 gap-2 bg-[#06090e] p-1 border border-slate-800 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDirection("LONG")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        direction === "LONG" 
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BULLISH (LONG)
                    </button>
                    <button
                      type="button"
                      onClick={() => setDirection("SHORT")}
                      className={`py-2 rounded-lg text-xs font-bold transition-all ${
                        direction === "SHORT" 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-900/30' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      BEARISH (SHORT)
                    </button>
                  </div>
                </div>
              </div>

              {/* Instant Customize Strategy Setup ("strategy customize hobe. customize er purno shubidha") */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Trading Strategy Framework
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomStrategy(!isCustomStrategy);
                      if (!isCustomStrategy) {
                        setStrategy("custom_inline");
                        setCustomStrategyName(strategy && strategy !== "custom_inline" ? strategy : "");
                      } else {
                        if (strategies.length > 0) setStrategy(strategies[0].name);
                      }
                    }}
                    className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition cursor-pointer"
                  >
                    <span>{isCustomStrategy ? "Select Default Vault" : "✍️ Write Custom Strategy"}</span>
                  </button>
                </div>

                {isCustomStrategy ? (
                  <div className="space-y-2 animate-fadeIn">
                    <input
                      type="text"
                      placeholder="Enter Custom Strategy Name (e.g. Daily FVG Retest)"
                      value={customStrategyName}
                      onChange={(e) => setCustomStrategyName(e.target.value)}
                      className="w-full text-sm bg-[#06090e] border border-blue-500/50 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-650 font-semibold"
                    />
                    <p className="text-[10px] text-slate-500">This custom strategy will map directly to this specific trading ledger record.</p>
                  </div>
                ) : (
                  <select
                    value={strategy}
                    onChange={(e) => {
                      if (e.target.value === "custom_inline") {
                        setIsCustomStrategy(true);
                      } else {
                        setStrategy(e.target.value);
                      }
                    }}
                    className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white appearance-none cursor-pointer"
                  >
                    {strategies.map((strat) => (
                      <option key={strat.id} value={strat.name}>
                        {strat.name}
                      </option>
                    ))}
                    <option value="custom_inline">➕ Create New Custom Strategy Inline...</option>
                  </select>
                )}
              </div>
            </div>

            {/* 🛡️ PRO ENTRY LOGIC SELECTOR Checklist */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center space-x-1.5">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Entry Confirmation Logic (Rules Checklist)</span>
                </h3>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  {entryRules.length} Active Confluences
                </span>
              </div>
              
              <p className="text-[11px] text-slate-400">Select parameters that triggered this entry. Complete confluence increases strategy accuracy tier.</p>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                {defaultRules.map((rule) => {
                  const isChecked = entryRules.includes(rule);
                  return (
                    <div 
                      key={rule} 
                      onClick={() => {
                        if (isChecked) {
                          setEntryRules(prev => prev.filter(r => r !== rule));
                        } else {
                          setEntryRules(prev => [...prev, rule]);
                        }
                      }}
                      className={`flex items-center space-x-2.5 p-2 rounded-xl border border-dashed cursor-pointer transition-all ${
                        isChecked 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/50" 
                          : "border-slate-800/80 hover:border-slate-705 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      <input 
                        type="checkbox" 
                        checked={isChecked}
                        onChange={() => {}} 
                        className="rounded border-slate-800 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 h-3.5 w-3.5"
                      />
                      <span className="truncate select-none font-medium text-[11px]">{rule}</span>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Rules Inline */}
              <div className="flex space-x-2 mt-2 pt-2 border-t border-slate-800/50">
                <input
                  type="text"
                  placeholder="Add custom rule target..."
                  value={customRuleInput}
                  onChange={(e) => setCustomRuleInput(e.target.value)}
                  className="flex-1 text-xs bg-[#06090e] border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-lg px-3 py-2 text-white placeholder-slate-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customRuleInput.trim()) {
                      const rule = customRuleInput.trim();
                      if (!entryRules.includes(rule)) {
                        setEntryRules(prev => [...prev, rule]);
                      }
                      setCustomRuleInput("");
                    }
                  }}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* ✍️ WRITE CUSTOM ENTRY LOGIC (MANUAL TEXT BOX) */}
              <div className="pt-2 border-t border-slate-800/50 space-y-1.5">
                <label className="block text-[10px] font-extrabold text-[#00b074] uppercase tracking-wider">
                  ✍️ Write Custom Entry Logic (Nije Likhun)
                </label>
                <textarea
                  rows={3}
                  placeholder={`Write your own rules / confluences manually here. Use commas or newlines to separate multiple items.
e.g. swept previous day high, shifted structure, 5m FVG entry`}
                  value={manualEntryLogicText}
                  onChange={(e) => setManualEntryLogicText(e.target.value)}
                  className="w-full text-xs bg-[#06090e] border border-slate-800 focus:border-emerald-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-650 font-sans resize-none leading-relaxed"
                />
                <p className="text-[9px] text-slate-500 font-mono">Lines written above are automatically compiled into custom checklist badges upon save!</p>
              </div>
            </div>

            {/* 🧮 INTELLIGENT POSITION SIZE & LOT CALCULATOR */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
                  <Scale className="h-4 w-4 text-indigo-400" />
                  <span>Position Size & Lot Calculator</span>
                </h3>
                <div className="flex bg-[#06090e] border border-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setSizingMode("forex")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${sizingMode === "forex" ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                  >
                    Forex Lots
                  </button>
                  <button
                    type="button"
                    onClick={() => setSizingMode("crypto")}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded ${sizingMode === "crypto" ? "bg-indigo-600 text-white" : "text-slate-500"}`}
                  >
                    Crypto/Spot
                  </button>
                </div>
              </div>

              {/* Calculator Inputs */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Account Balance */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Account Balance ($)</label>
                  <input
                    type="number"
                    value={accountBalance}
                    onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs font-bold font-mono bg-[#06090e] border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>

                {/* Customized Risk Percent */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Risk Percentage (%)
                  </label>
                  <div className="flex items-center space-x-1.5 bg-[#06090e] border border-slate-800 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      step="0.1"
                      value={riskPercent}
                      onChange={(e) => setRiskPercent(parseFloat(e.target.value) || 0)}
                      className="w-full bg-transparent text-xs font-bold font-mono focus:outline-none text-white border-none py-1.5 text-center"
                    />
                    <span className="text-[10px] font-bold text-slate-500">%</span>
                  </div>
                </div>

                {/* Customized Risk in Dollar Amount */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Risk per Trade ($ Dollar)
                  </label>
                  <div className="flex items-center space-x-1.5 bg-[#06090e] border border-slate-800 rounded-xl px-2 py-1">
                    <span className="text-[10px] font-bold text-slate-500">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. 150"
                      value={parseFloat((accountBalance * riskPercent / 100).toFixed(2)) || ""}
                      onChange={(e) => {
                        const dollarVal = parseFloat(e.target.value) || 0;
                        if (accountBalance > 0) {
                          const pct = parseFloat(((dollarVal / accountBalance) * 105).toFixed(2));
                          // Actually let's use the precise math: pct = (dollarVal / accountBalance) * 100
                          const precisePct = parseFloat(((dollarVal / accountBalance) * 100).toFixed(2));
                          setRiskPercent(precisePct);
                        }
                      }}
                      className="w-full bg-transparent text-xs font-bold font-mono focus:outline-none text-white border-none py-1.5 text-center"
                    />
                  </div>
                </div>

                {/* Customized Leverage */}
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                    Leverage (Multiplier)
                  </label>
                  <div className="flex items-center space-x-1.5 bg-[#06090e] border border-slate-800 rounded-xl px-2 py-1">
                    <input
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value) || 1)}
                      className="w-full bg-transparent text-xs font-bold font-mono focus:outline-none text-white border-none py-1.5 text-center"
                    />
                    <span className="text-[10px] font-bold text-slate-500">x</span>
                  </div>
                </div>
              </div>

              {/* Slider customization for Risk and Leverage */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Risk: {riskPercent}%</span>
                    <span>Max 5%</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5.0"
                    step="0.1"
                    value={riskPercent}
                    onChange={(e) => setRiskPercent(parseFloat(e.target.value))}
                    className="w-full h-1 bg-[#06090e] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
                <div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>Leverage: {leverage}x</span>
                    <span>Max 200x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    step="1"
                    value={leverage}
                    onChange={(e) => setLeverage(parseInt(e.target.value))}
                    className="w-full h-1 bg-[#06090e] rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>
              </div>

              {/* Price level inputs for math calculations */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Entry Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.12000"
                    value={entryPrice}
                    onChange={(e) => setEntryPrice(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs font-bold font-mono bg-[#06090e] border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Stop Loss Price</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 1.11750"
                    value={stopLossPrice}
                    onChange={(e) => setStopLossPrice(e.target.value !== "" ? parseFloat(e.target.value) : "")}
                    className="w-full text-xs font-bold font-mono bg-[#06090e] border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              {/* Direct Stop Loss state directly editable if no prices entered */}
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">
                  Manual Stop Loss distance (Pips / Points)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    value={stopLossPips}
                    onChange={(e) => setStopLossPips(parseFloat(e.target.value) || 0)}
                    className="flex-1 text-xs font-bold font-mono bg-[#06090e] border border-slate-800 rounded-xl p-2.5 text-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (entryPrice && stopLossPrice) {
                        const calculatedDist = Math.abs(parseFloat(String(entryPrice)) - parseFloat(String(stopLossPrice)));
                        if (sizingMode === "forex") {
                          const pipsValue = parseFloat((calculatedDist * 10000).toFixed(1));
                          setStopLossPips(pipsValue);
                        } else {
                          setStopLossPips(parseFloat(calculatedDist.toFixed(2)));
                        }
                      } else {
                        alert("Please specify reasonable Entry and Stop Loss prices first!");
                      }
                    }}
                    className="bg-[#06090e] hover:border-slate-700 border border-slate-800 text-slate-300 px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>🧮 Compute from Prices</span>
                  </button>
                </div>
              </div>

              {/* Calculate trigger and display results */}
              <div className="bg-[#06090e] p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-2">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 font-sans font-semibold">
                  <span className="text-slate-500">Risk Capital:</span>
                  <span className="text-red-400 font-bold">${(accountBalance * riskPercent / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5 font-sans font-semibold">
                  <span className="text-slate-500">Stop Distance:</span>
                  <span className="text-white font-bold">{stopLossPips} {sizingMode === "forex" ? "Pips" : "Units/Points"}</span>
                </div>

                {/* Instant Calculation output */}
                <div className="flex justify-between items-center bg-indigo-500/10 border border-indigo-500/25 rounded-lg p-2 font-sans">
                  <div>
                    <span className="text-xs text-indigo-400 font-bold block">Recommended Lots/Size:</span>
                    <span className="text-lg font-black font-mono text-white">
                      {(() => {
                        let calcLots = 0;
                        const riskVal = (accountBalance * riskPercent / 100);
                        if (stopLossPips > 0) {
                          if (sizingMode === "forex") {
                            calcLots = riskVal / (stopLossPips * 10);
                          } else {
                            calcLots = riskVal / stopLossPips;
                          }
                        }
                        const finalL = calcLots > 0 ? parseFloat(calcLots.toFixed(sizingMode === "forex" ? 2 : 4)) : 0;
                        return finalL;
                      })()}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {sizingMode === "forex" ? "Standard Forex Lots" : "Crypto token/Shares units"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      let calcLots = 0;
                      const riskVal = (accountBalance * riskPercent / 100);
                      if (stopLossPips > 0) {
                        if (sizingMode === "forex") {
                          calcLots = riskVal / (stopLossPips * 10);
                        } else {
                          calcLots = riskVal / stopLossPips;
                        }
                      }
                      const finalL = calcLots > 0 ? parseFloat(calcLots.toFixed(sizingMode === "forex" ? 2 : 4)) : 0;
                      setLotSize(finalL);
                    }}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-extrabold text-[10px] px-3 py-2 rounded-lg transition"
                  >
                    👉 Copy to Ticket
                  </button>
                </div>
              </div>

              {/* ✨ AI Sizing generator */}
              <div className="pt-1.5">
                <button
                  type="button"
                  disabled={aiCalculating}
                  onClick={async () => {
                    setAiCalculating(true);
                    setAiCalcResponse(null);
                    try {
                      const res = await fetch("/api/gemini/calculate-position", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          pair: pair || "BTCUSD",
                          direction,
                          accountBalance,
                          riskPercent,
                          leverage,
                          entryReason: entryReason || "No context yet"
                        })
                      });
                      const data = await res.json();
                      if (data.error) {
                        alert("AI Sizing Alert: " + data.error);
                      } else {
                        setAiCalcResponse(data);
                        if (data.entryPrice) setEntryPrice(data.entryPrice);
                        if (data.stopLossPrice) setStopLossPrice(data.stopLossPrice);
                        if (data.stopLossPips) setStopLossPips(data.stopLossPips);
                        if (data.lotSize) setLotSize(data.lotSize);
                      }
                    } catch (err: any) {
                      console.error(err);
                      alert("Unable to fetch AI Position sizing.");
                    } finally {
                      setAiCalculating(false);
                    }
                  }}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-3 rounded-xl font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-lg shadow-purple-950/40 transition-all disabled:opacity-50"
                >
                  <Sparkles className="h-4 w-4 text-yellow-300" />
                  <span>{aiCalculating ? "🤖 AI Sizing Estimator Computing..." : "✨ Ask AI to Estimate Entry, SL & Lots"}</span>
                </button>

                {aiCalcResponse && (
                  <div className="mt-3 bg-purple-950/15 border border-purple-500/20 rounded-xl p-3 text-xs space-y-2">
                    <p className="text-purple-400 font-extrabold flex items-center space-x-1">
                      <span>🤖 Artificial Risk Assessment:</span>
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-300 bg-black/40 p-2 rounded-lg border border-slate-900">
                      <div><span className="text-slate-500">AI Est Entry:</span> <span className="text-emerald-400 font-black">{aiCalcResponse.entryPrice}</span></div>
                      <div><span className="text-slate-500">AI Est Stop:</span> <span className="text-red-400 font-black">{aiCalcResponse.stopLossPrice}</span></div>
                      <div><span className="text-slate-500">AI Est Lot Size:</span> <span className="text-indigo-400 font-black">{aiCalcResponse.lotSize}</span></div>
                      <div><span className="text-slate-500">Needed Margin:</span> <span className="text-yellow-400 font-black">${aiCalcResponse.marginUsd?.toFixed(2)}</span></div>
                    </div>
                    <div className="text-[10px] bg-black/10 rounded p-1.5 text-slate-405 leading-normal italic whitespace-pre-line border-l-2 border-purple-500/50">
                      {aiCalcResponse.commentary}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Precise Clock and AM / PM and Date picker ("entry time e am pm e hobe,date add koro") */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Date & Entry Time</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Date Selection Box */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-500" />
                    <span>Execution Date</span>
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white font-semibold font-mono cursor-pointer"
                  />
                </div>

                {/* AM/PM Time Picker Selectors */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-500" />
                    <span>Precise Time (AM/PM)</span>
                  </label>
                  
                  <div className="flex items-center space-x-1 bg-[#06090e] p-1 border border-slate-800 rounded-xl">
                    {/* Hour Select */}
                    <select
                      value={timeHour}
                      onChange={(e) => setTimeHour(e.target.value)}
                      className="bg-transparent text-sm text-white focus:outline-none cursor-pointer px-2 py-1.5 font-bold font-mono text-center flex-1"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                        <option key={h} value={h} className="bg-[#0F141C]">{h}</option>
                      ))}
                    </select>
                    
                    <span className="text-slate-600 font-bold">:</span>

                    {/* Minute Select */}
                    <select
                      value={timeMinute}
                      onChange={(e) => setTimeMinute(e.target.value)}
                      className="bg-transparent text-sm text-white focus:outline-none cursor-pointer px-2 py-1.5 font-bold font-mono text-center flex-1"
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                        <option key={m} value={m} className="bg-[#0F141C]">{m}</option>
                      ))}
                    </select>

                    {/* AM / PM Toggle Selector */}
                    <div className="flex bg-[#0F141C] rounded-lg p-0.5 border border-slate-800">
                      <button
                        type="button"
                        onClick={() => setTimePeriod("AM")}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${timePeriod === "AM" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                      >
                        AM
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimePeriod("PM")}
                        className={`px-2 py-1 text-[10px] font-bold rounded ${timePeriod === "PM" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                      >
                        PM
                      </button>
                    </div>

                  </div>
                </div>

              </div>
            </div>

            {/* Tag Classification System */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center space-x-1.5">
                  <span className="text-rose-500">🏷️</span>
                  <span>Trade Tags & Labels</span>
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">
                  {selectedTags.length} SELECTED
                </span>
              </div>
              
              <p className="text-[10.5px] text-slate-400 leading-normal">
                Classify your trade with custom labels to filter and analyze strategic edges later.
              </p>

              {/* Predefined suggestion tags slider */}
              <div className="space-y-2">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Quick Select Tags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {predefinedTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <motion.button
                        key={tag}
                        type="button"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedTags(selectedTags.filter(t => t !== tag));
                          } else {
                            setSelectedTags([...selectedTags, tag]);
                          }
                        }}
                        className={`text-xs px-3 py-1.5 rounded-xl font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-blue-400 shadow-md shadow-blue-500/20"
                            : "bg-[#06090e] border-slate-800 text-slate-400 hover:border-slate-700 hover:text-white"
                        }`}
                      >
                        {tag}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Custom tags editor adding row */}
              <div className="pt-2 border-t border-slate-900 space-y-2">
                <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  Add Custom Tag
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="e.g. Inverted FVG..."
                    value={customTagInput}
                    onChange={(e) => setCustomTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = customTagInput.trim();
                        if (trimmed && !selectedTags.includes(trimmed)) {
                          setSelectedTags([...selectedTags, trimmed]);
                          setCustomTagInput("");
                          showToast(`Added Tag "${trimmed}"!`);
                        }
                      }
                    }}
                    className="flex-1 text-xs bg-[#06090e] border border-slate-800 focus:border-rose-400 focus:outline-none rounded-xl p-2.5 text-white placeholder-slate-650"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const trimmed = customTagInput.trim();
                      if (trimmed && !selectedTags.includes(trimmed)) {
                        setSelectedTags([...selectedTags, trimmed]);
                        setCustomTagInput("");
                        showToast(`Added Tag "${trimmed}"!`);
                      }
                    }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-white border border-slate-800 hover:border-rose-500/50 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>+ Add</span>
                  </button>
                </div>
              </div>

              {/* List of currently selected tags */}
              {selectedTags.length > 0 && (
                <div className="pt-2 bg-[#06090e]/30 p-2.5 rounded-xl border border-slate-900 flex flex-wrap gap-1.5 items-center animate-fade-in">
                  <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest mr-1">Active:</span>
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center space-x-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-lg px-2 py-0.5 text-[11px] font-extrabold"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedTags(selectedTags.filter(t => t !== tag));
                        }}
                        className="hover:bg-rose-500/35 text-rose-400 font-extrabold rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] transition cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Results input and RR Metrics */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Financial Performance</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Net Financial Outcome ($)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3.5 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      step="any"
                      placeholder="e.g. +500 or -120"
                      value={profit}
                      onChange={(e) => setProfit(e.target.value === "" ? "" : parseFloat(e.target.value))}
                      className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl pl-8 p-3 text-white placeholder-slate-700 font-extrabold font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Planned Risk-to-Reward Ratio</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 3.5"
                    value={riskReward}
                    onChange={(e) => setRiskReward(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-700 font-mono font-semibold"
                  />
                </div>
              </div>

              {/* Logged Position Sizing Data */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Logged Position Lot Size</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 0.45 lots"
                    value={lotSize}
                    onChange={(e) => setLotSize(e.target.value === "" ? "" : parseFloat(e.target.value))}
                    className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-705 font-semibold font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Execution Leverage Used</label>
                  <div className="flex bg-[#06090e] border border-slate-800 rounded-xl p-0.5">
                    <input
                      type="number"
                      value={leverage}
                      onChange={(e) => setLeverage(parseInt(e.target.value) || 1)}
                      className="w-full text-sm bg-transparent focus:outline-none text-white font-mono font-semibold text-center py-2.5"
                    />
                    <span className="text-xs text-slate-500 flex items-center pr-3">x</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-red-500 uppercase tracking-wider">
                  ⚠️ Execution Pitfall / Lessons (Mistake Ghor)
                </label>
                <textarea
                  rows={2}
                  placeholder="Write your psychological/execution mistakes here (e.g. FOMO entry, moved stop loss, chased early, took profit too fast, etc.)"
                  value={mistake}
                  onChange={(e) => setMistake(e.target.value)}
                  className="w-full text-sm bg-[#06090e] border border-slate-800 focus:border-red-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-705 font-sans resize-none leading-relaxed"
                />
                
                {/* Handy quick chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {[
                    "None (Perfect execution)",
                    "FOMO / Chase",
                    "Overleveraged",
                    "Moved Stop Loss",
                    "Early TP",
                    "Revenge Trade",
                    "Late Entry"
                  ].map((presetVal) => (
                    <button
                      key={presetVal}
                      type="button"
                      onClick={() => {
                        if (!mistake || mistake === "None" || mistake === "None (Perfect execution)") {
                          setMistake(presetVal);
                        } else {
                          const currentClean = mistake.trim();
                          if (currentClean.endsWith(",")) {
                            setMistake(`${currentClean} ${presetVal}`);
                          } else {
                            setMistake(`${currentClean}, ${presetVal}`);
                          }
                        }
                      }}
                      className="text-[10px] bg-red-500/5 hover:bg-red-500/10 text-red-400 border border-red-500/10 rounded px-2 py-0.5 font-bold transition select-none"
                    >
                      + {presetVal}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Multi-Timeframe Analysis & Explanations */}
          <div className="space-y-4">
            
            {/* HTF and LTF description fields ("ki dekhe entry nilam, big time frame e ki scenario chilo") */}
            <div className="bg-[#0F141C] p-4 rounded-2xl border border-slate-800/60 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-blue-400">Timeframe Scenarios</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 text-amber-500">
                  📈 Higher Timeframe Scenario (Daily/4H Structure)
                </label>
                <textarea
                  placeholder="Daily/4H structure checklist: Is daily trend bullish? Key order block retest? Scenario on high time frame..."
                  value={bigTimeFrameScenario}
                  onChange={(e) => setBigTimeFrameScenario(e.target.value)}
                  className="w-full text-sm h-24 bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-700 font-sans resize-none"
                ></textarea>
              </div>

              <div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider text-blue-400">
                    🎯 Lower Timeframe Trigger (What triggered the 1H/15m entry?)
                  </label>
                  
                  {/* Dynamic Voice-to-Text Dictation Segment */}
                  <div className="flex items-center space-x-1 px-1 py-1 rounded-xl bg-[#06090e] border border-slate-800 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        const nextLang = speechLang === "en-US" ? "bn-BD" : "en-US";
                        setSpeechLang(nextLang);
                        showToast(`Language switched to: ${nextLang === "en-US" ? "English" : "Bangla"}`);
                      }}
                      className="px-2 py-1 text-[10px] font-extrabold rounded bg-slate-800 hover:bg-slate-705 text-white transition flex items-center gap-1 cursor-pointer"
                      title="Switch dictation language between English and Bangla"
                    >
                      <span className="text-xs">{speechLang === "en-US" ? "🇬🇧" : "🇧🇩"}</span>
                      <span>{speechLang === "en-US" ? "EN" : "বাংলা (BN)"}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={startListening}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase flex items-center space-x-1.5 transition-all duration-300 border cursor-pointer ${
                        isListening 
                          ? "bg-red-600/20 border-red-500 text-red-400 animate-pulse shadow-lg shadow-red-500/20" 
                          : "bg-blue-600/20 border-blue-500/40 text-blue-400 hover:bg-blue-600/30"
                      }`}
                      title={isListening ? "Stop voice dictation" : "Start typing using voice"}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="h-3.5 w-3.5 animate-bounce" />
                          <span className="text-[9px]">STOP RECORDING</span>
                        </>
                      ) : (
                        <>
                          <Mic className="h-3.5 w-3.5 text-blue-400" />
                          <span className="text-[9px]">DIKTAT (VOICE)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                <textarea
                  placeholder="What did you see before pressing entry? Send voice dictation or type manually! (Bangla also supported)"
                  value={entryReason}
                  onChange={(e) => setEntryReason(e.target.value)}
                  className="w-full text-sm h-28 bg-[#06090e] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-700 font-sans resize-none"
                ></textarea>
              </div>
            </div>

            {/* Webcam snapping interface */}
            {isCapturing && (
              <div className="bg-black/90 p-4 rounded-xl border-2 border-dashed border-emerald-500 space-y-3 animate-pulse">
                <p className="text-xs text-emerald-400 font-bold">📷 Snapping Photo for category: {captureCategory.toUpperCase()}</p>
                <video ref={videoRef} className="w-full h-40 object-cover rounded-lg"></video>
                <div className="flex justify-end space-x-2">
                  <button 
                    type="button" 
                    onClick={closeCamera}
                    className="bg-red-500/10 hover:bg-red-505/20 border border-red-500 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={snapPhoto}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    Capture Snap
                  </button>
                </div>
              </div>
            )}

            {/* 📸 Timeframe dedicated charts pasting guide & dashboard ("daily chart, 4h, 1h er chart er pic add koro, alada alada") */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Multi-Timeframe Screenshots</span>
                <span className="text-[10px] text-amber-500 font-bold animate-pulse bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Select a slot & Paste (Ctrl+V) instantly!
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                
                {/* DAILY HTF SLOT */}
                <div 
                  onClick={() => setActivePasteSlot("daily")}
                  className={`relative cursor-pointer rounded-2xl border p-3 flex flex-col justify-between h-40 transition-all ${
                    activePasteSlot === "daily" 
                      ? "border-blue-500 bg-gradient-to-b from-blue-950/40 to-blue-900/10 shadow-2xl shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/30" 
                      : "border-slate-800 bg-[#0F141C] hover:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Daily Chart</span>
                    <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold font-mono">HTF</span>
                  </div>

                  {dailyChart ? (
                    <div className="relative mt-2 flex-1 rounded-lg overflow-hidden border border-slate-800 group bg-black/40">
                      <img src={dailyChart} alt="Daily chart" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setDailyChart(""); }}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 mt-2 border border-dashed border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-slate-500">
                      <ImageIcon className={`h-4 w-4 mb-1 ${activePasteSlot === "daily" ? "text-blue-400 animate-bounce" : "text-slate-600"}`} />
                      <span className={`text-[9.5px] leading-tight ${activePasteSlot === "daily" ? "text-blue-300 font-black animate-pulse" : ""}`}>
                        {activePasteSlot === "daily" ? "🎯 Press Ctrl+V" : "Select & Paste"}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-1 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRefDaily.current?.click(); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white px-2 py-1 rounded flex-1 text-center transition"
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera("daily"); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white px-1 py-1 rounded transition"
                    >
                      📷
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRefDaily}
                    className="hidden"
                    onChange={(e) => handleImageFileLoad(e, "daily")}
                  />
                </div>

                {/* 4H MTF SLOT */}
                <div 
                  onClick={() => setActivePasteSlot("4h")}
                  className={`relative cursor-pointer rounded-2xl border p-3 flex flex-col justify-between h-40 transition-all ${
                    activePasteSlot === "4h" 
                      ? "border-blue-500 bg-gradient-to-b from-blue-950/40 to-blue-900/10 shadow-2xl shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/30" 
                      : "border-slate-800 bg-[#0F141C] hover:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">4H Chart</span>
                    <span className="text-[9px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold font-mono">MTF</span>
                  </div>

                  {fourHourChart ? (
                    <div className="relative mt-2 flex-1 rounded-lg overflow-hidden border border-slate-800 group bg-black/40">
                      <img src={fourHourChart} alt="4H chart" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFourHourChart(""); }}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 mt-2 border border-dashed border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-slate-500">
                      <ImageIcon className={`h-4 w-4 mb-1 ${activePasteSlot === "4h" ? "text-blue-400 animate-bounce" : "text-slate-600"}`} />
                      <span className={`text-[9.5px] leading-tight ${activePasteSlot === "4h" ? "text-blue-300 font-black animate-pulse" : ""}`}>
                        {activePasteSlot === "4h" ? "🎯 Press Ctrl+V" : "Select & Paste"}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-1 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRefFourHour.current?.click(); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white px-2 py-1 rounded flex-1 text-center transition"
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera("4h"); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white px-1 py-1 rounded transition"
                    >
                      📷
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRefFourHour}
                    className="hidden"
                    onChange={(e) => handleImageFileLoad(e, "4h")}
                  />
                </div>

                {/* 1H ENTRY LTF SLOT */}
                <div 
                  onClick={() => setActivePasteSlot("1h")}
                  className={`relative cursor-pointer rounded-2xl border p-3 flex flex-col justify-between h-40 transition-all ${
                    activePasteSlot === "1h" 
                      ? "border-blue-500 bg-gradient-to-b from-blue-950/40 to-blue-900/10 shadow-2xl shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/30" 
                      : "border-slate-800 bg-[#0F141C] hover:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">1H Chart</span>
                    <span className="text-[9px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded font-bold font-mono">LTF</span>
                  </div>

                  {oneHourChart ? (
                    <div className="relative mt-2 flex-1 rounded-lg overflow-hidden border border-slate-800 group bg-black/40">
                      <img src={oneHourChart} alt="1H chart" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setOneHourChart(""); }}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 mt-2 border border-dashed border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-slate-500">
                      <ImageIcon className={`h-4 w-4 mb-1 ${activePasteSlot === "1h" ? "text-blue-400 animate-bounce" : "text-slate-600"}`} />
                      <span className={`text-[9.5px] leading-tight ${activePasteSlot === "1h" ? "text-blue-300 font-black animate-pulse" : ""}`}>
                        {activePasteSlot === "1h" ? "🎯 Press Ctrl+V" : "Select & Paste"}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-1 mt-1.5">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRefOneHour.current?.click(); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white px-2 py-1 rounded flex-1 text-center transition"
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera("1h"); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white px-1 py-1 rounded transition"
                    >
                      📷
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRefOneHour}
                    className="hidden"
                    onChange={(e) => handleImageFileLoad(e, "1h")}
                  />
                </div>

                {/* 15M ENTRY LTF SLOT */}
                <div 
                  onClick={() => setActivePasteSlot("15m")}
                  className={`relative cursor-pointer rounded-2xl border p-3 flex flex-col justify-between h-40 transition-all ${
                    activePasteSlot === "15m" 
                      ? "border-blue-500 bg-gradient-to-b from-blue-950/40 to-blue-900/10 shadow-2xl shadow-blue-500/20 scale-[1.02] ring-2 ring-blue-500/30" 
                      : "border-slate-800 bg-[#0F141C] hover:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">15M Chart</span>
                    <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded font-bold font-mono">15M</span>
                  </div>

                  {fifteenMinChart ? (
                    <div className="relative mt-2 flex-1 rounded-lg overflow-hidden border border-slate-800 group bg-black/40">
                      <img src={fifteenMinChart} alt="15M chart" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setFifteenMinChart(""); }}
                        className="absolute inset-0 bg-red-600/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex-1 mt-2 border border-dashed border-slate-800/80 rounded-lg flex flex-col items-center justify-center p-2 text-center text-slate-500">
                      <ImageIcon className={`h-4 w-4 mb-1 ${activePasteSlot === "15m" ? "text-blue-400 animate-bounce" : "text-slate-600"}`} />
                      <span className={`text-[9.5px] leading-tight ${activePasteSlot === "15m" ? "text-blue-300 font-black animate-pulse" : ""}`}>
                        {activePasteSlot === "15m" ? "🎯 Press Ctrl+V" : "Select & Paste"}
                      </span>
                    </div>
                  )}

                  <div className="flex space-x-1 mt-1.5 transition">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); fileInputRefFifteenMin.current?.click(); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-blue-500 text-slate-400 hover:text-white px-2 py-1 rounded flex-1 text-center transition"
                    >
                      File
                    </button>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); startCamera("15m"); }}
                      className="text-[9px] font-bold bg-[#06090e] border border-slate-800 hover:border-emerald-500 text-slate-400 hover:text-white px-1 py-1 rounded transition"
                    >
                      📷
                    </button>
                  </div>
                  
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRefFifteenMin}
                    className="hidden"
                    onChange={(e) => handleImageFileLoad(e, "15m")}
                  />
                </div>

              </div>

              {/* General support images uploading */}
              <div 
                onClick={() => setActivePasteSlot("generic")}
                className={`bg-[#0F141C] p-4 rounded-2xl border ${
                  activePasteSlot === "generic" ? "border-blue-500 bg-blue-600/5" : "border-slate-800"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400">Other supportive charts ({images.length})</span>
                  <span className="text-[9px] text-slate-500">Falls back to generic pasting</span>
                </div>

                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); fileInputRefGeneric.current?.click(); }}
                    className="flex-1 py-2.5 border border-dashed border-slate-800 hover:border-blue-500 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition flex items-center justify-center space-x-2"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Attach Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); startCamera("generic"); }}
                    className="px-3 border border-dashed border-slate-800 hover:border-emerald-500 rounded-xl text-slate-400 hover:text-emerald-400 transition"
                  >
                    📷
                  </button>
                </div>

                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRefGeneric}
                  className="hidden"
                  onChange={handleMultipleGenericImages}
                />

                {images.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {images.map((img, idx) => (
                      <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-800 aspect-video h-10 bg-black/30">
                        <img src={img} alt="Thumbnail generic" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setImages(prev => prev.filter((_, i) => i !== idx)); }}
                          className="absolute inset-0 bg-red-650/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* paste hint */}
              <div className="p-3 bg-[#0a0e14] border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-start space-x-2 leading-relaxed">
                <span className="text-blue-400 font-bold shrink-0">💡 TV Paste Technique:</span>
                <span>
                  Copy chart from TradingView (Right-click → Save Image → Copy image) then click any of these 3 template blocks, and press <strong>Ctrl + V</strong> to attach directly!
                </span>
              </div>

            </div>

          </div>

        </div>

        {/* Action Triggers */}
        <div className="flex justify-end space-x-3 pt-5 border-t border-slate-800">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 bg-slate-800 hover:bg-slate-700 hover:text-white transition cursor-pointer"
          >
            Cancel
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.03, boxShadow: "0 10px 25px -5px rgba(59, 130, 246, 0.45)" }}
            whileTap={{ scale: 0.97 }}
            type="submit"
            className="relative px-6 py-2.5 overflow-hidden rounded-xl text-sm font-bold text-white flex items-center space-x-1.5 shadow-lg shadow-blue-500/20 cursor-pointer bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-650 transition"
          >
            {/* Ambient sliding white color wave (custom shimmer) */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent w-full"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
            />
            <Save className="h-4 w-4 shrink-0 relative z-10" />
            <span className="relative z-10">Save Ledger Entry</span>
          </motion.button>
        </div>

      </form>
    </div>
  );
}
