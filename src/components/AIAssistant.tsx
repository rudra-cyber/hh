import React, { useState, useRef } from "react";
import { Sparkles, Camera, Upload, AlertCircle, Loader2, CheckCircle2, RefreshCw } from "lucide-react";
import { AIExtractResult } from "../types";
import { motion, AnimatePresence } from "motion/react";

interface AIAssistantProps {
  onExtractionComplete: (extracted: AIExtractResult, screenshotBase64?: string) => void;
}

export default function AIAssistant({ onExtractionComplete }: AIAssistantProps) {
  const [inputText, setInputText] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Camera capture states
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // File Upload trigger
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Paste image directly (e.g. copied from TradingView)
  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = e.clipboardData?.items;
    let imageFound = false;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          imageFound = true;
          const file = items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              setScreenshot(reader.result as string);
              setSuccessMsg("Screenshot pasted from clipboard successfully!");
            };
            reader.readAsDataURL(file);
          }
        }
      }
    }
    if (imageFound) {
      e.preventDefault();
    }
  };

  // Image upload handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 📷 Web Camera capture functions
  const startCamera = async () => {
    try {
      setError(null);
      setShowCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err: any) {
      console.error("Camera access failed:", err);
      setError("Unable to access your camera/webcam. Please verify permission or upload a file directly.");
      setShowCamera(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/png");
        setScreenshot(dataUrl);
        stopCamera();
      }
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setShowCamera(false);
  };

  // ⚡ Call backend handler to parse with Gemini
  const handleSmartExtract = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const response = await fetch("/api/gemini/parse-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          image: screenshot
        })
      });

      if (!response.ok) {
        throw new Error(`Extraction server error (${response.status})`);
      }

      const result = await response.json();
      
      // Clean up fallback or parse values
      const extracted: AIExtractResult = {
        pair: result.pair || "EURUSD",
        direction: (result.direction?.toUpperCase() === "SHORT" ? "SHORT" : "LONG") as any,
        time: result.time || new Date().toISOString(),
        riskReward: Number(result.riskReward) || 2.0,
        entryReason: result.entryReason || "",
        mistake: result.mistake || "None"
      };

      onExtractionComplete(extracted, screenshot || undefined);
      setSuccessMsg("Trade details successfully auto-extracted by Gemini!");
      // Clear inputs briefly or keep them
      setInputText("");
      setScreenshot(null);
    } catch (err: any) {
      console.error("AI Assistant extraction exception:", err);
      setError(err?.message || "Something went wrong during extraction.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.12)" }}
      className="bg-[#161B22] border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-4 ai-assistant-zone position-relative" 
      onPaste={handlePaste}
    >
      {/* Title block */}
      <div className="flex items-center space-x-2">
        <div className="p-2 bg-blue-600/10 rounded-lg text-blue-400 animate-pulse">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h4 className="text-white font-semibold text-sm">Gemini AI Auto-Extract ticket</h4>
          <p className="text-xs text-slate-400">Describe or paste (Ctrl+V) / upload a trade photo to parse metrics immediately</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Text & Capture area */}
        <div className="space-y-3">
          <textarea
            placeholder={`Describe your setup. e.g.: "Entered short on BTCUSD at 10:45 AM, breakout of horizontal range with a 1:3 RR but took it slightly late due to FOMO."`}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full text-sm h-32 bg-[#0A0E14] border border-slate-800 focus:border-blue-500 focus:outline-none rounded-xl p-3 text-white placeholder-slate-600 resize-none font-sans transition-all duration-300 focus:shadow-[0_0_12px_rgba(37,99,235,0.15)]"
          ></textarea>

          {/* Controls: camera image upload */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (fileInputRef.current) fileInputRef.current.click();
              }}
              className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-slate-300 bg-[#1C2128] hover:bg-[#242b36] rounded-xl border border-slate-800 transition cursor-pointer hover:border-slate-500 hover:text-white"
            >
              <Upload className="h-4 w-4 text-slate-400" />
              <span>Upload Screenshot</span>
            </button>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />

            <button
              onClick={showCamera ? capturePhoto : startCamera}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium rounded-xl border transition cursor-pointer ${
                showCamera 
                ? 'bg-[#00b074] hover:bg-[#008f5d] border-transparent text-white' 
                : 'text-slate-300 bg-[#1C2128] hover:bg-[#242b36] border-slate-800 hover:border-slate-500 hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>{showCamera ? "Snapping Look" : "Take Photo"}</span>
            </button>
          </div>
        </div>

        {/* Right: Preview / Camera Area */}
        <div className="bg-[#0A0E14] border border-slate-800 rounded-xl flex flex-col items-center justify-center overflow-hidden min-h-[140px] relative">
          {showCamera ? (
            <div className="w-full h-full relative flex flex-col items-center">
              <video 
                ref={videoRef} 
                className="w-full h-32 object-cover"
                autoPlay 
                playsInline 
                muted
              ></video>
              <button
                onClick={stopCamera}
                className="absolute top-2 right-2 text-white bg-red-600/80 hover:bg-red-600 px-2 py-0.5 rounded text-[10px]"
              >
                Cancel
              </button>
            </div>
          ) : screenshot ? (
            <div className="w-full h-full relative group">
              <img 
                src={screenshot} 
                alt="Snapped / Uploaded trade preview" 
                className="w-full h-32 object-contain"
              />
              <button
                onClick={() => setScreenshot(null)}
                className="absolute top-2 right-2 text-white bg-black/60 hover:bg-black/90 p-1.5 rounded-full cursor-pointer transition-transform hover:scale-110"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="p-4 text-center cursor-pointer group w-full" onClick={() => { if (fileInputRef.current) fileInputRef.current.click() }}>
              <div className="mx-auto w-10 h-10 border border-dashed border-slate-800 rounded-full flex items-center justify-center mb-2 transition-colors group-hover:border-blue-500">
                <Upload className="h-4 w-4 text-slate-500 group-hover:text-blue-400 group-hover:animate-bounce" />
              </div>
              <p className="text-xs text-slate-400 group-hover:text-slate-200">Captured Chart or Screenshot preview</p>
              <p className="text-[10px] text-slate-600 mt-1">Accepts PNG, JPG snapshots — Paste (Ctrl+V) anywhere</p>
            </div>
          )}
        </div>
      </div>

      {/* Trigger Buttons & Info messages */}
      <div className="pt-2 flex flex-col space-y-2">
        <button
          onClick={handleSmartExtract}
          disabled={isLoading || (!inputText && !screenshot)}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-[#1C2128] disabled:text-slate-600 disabled:cursor-not-allowed text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-blue-900/10 transition duration-200 active:scale-[0.99]"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span>Analyzing layout with Gemini...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Smart Extract & Auto-Fill</span>
            </>
          )}
        </button>

        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-red-500/10 border border-red-500/30 p-2.5 rounded-xl flex items-start space-x-2 text-xs text-red-200 overflow-hidden"
            >
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div 
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="bg-[#12533e]/30 border border-[#00b074]/30 p-2.5 rounded-xl flex items-center space-x-2 text-xs text-[#00b074] overflow-hidden"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
