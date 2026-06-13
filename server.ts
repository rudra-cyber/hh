import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing large JSON payloads (since we support uploading screenshots/images for AI parsing)
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

// Lazy initializer for Google GenAI client
let aiClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// 🩺 Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// 🤖 AI Extract Trade details endpoint (Server-side Gemini 3.5 Flash)
app.post("/api/gemini/parse-trade", async (req, res) => {
  try {
    const { text, image } = req.body;

    if (!text && !image) {
       res.status(400).json({ error: "Please provide a description or a snapshot image of the trade." });
       return;
    }

    const ai = getGenAI();
    const contents: any[] = [];

    // 1. Incorporate User Note
    if (text) {
      contents.push({ text: `Analyze the user's trading note text and extract details: "${text}"` });
    }

    // 2. Incorporate User Chart Screenshot
    if (image) {
      // Parse base64 string
      const matches = image.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.*)$/);
      if (matches && matches.length === 3) {
        const mimeType = matches[1];
        const data = matches[2];
        contents.push({
          inlineData: {
            mimeType,
            data
          }
        });
      } else {
        // Fallback if not a data URI but raw base64
        contents.push({
          inlineData: {
            mimeType: "image/png",
            data: image
          }
        });
      }
    }

    // Include system instruction in prompt context for strict Extraction rules
    const promptContext = `
      You are an expert financial market analyst and professional trading coach.
      Analyze the attached trading chart screenshot and/or natural language description of a trade.
      Extract the following data points to help the user log their trade:
      - Asset or Trading Pair (e.g. BTCUSD, EURUSD, AAPL, NASDAQ, etc. Convert to uppercase).
      - Direction of the trade: 'LONG' or 'SHORT'.
      - Time/Date of entry if specified or can be estimated (e.g. "12:30 PM", or a timestamp, or keep empty if unknown).
      - Planned Risk-to-Reward (RR) ratio as a positive number (e.g. 1.5, 2.0, 3.0. Default to 2.0 if not specified).
      - Bullet points summarizing the entry reasons / technical setup recognized (e.g. Support breakout, double bottom, bullish engulfing, moving average crossing, etc.).
      - Potential Execution Mistakes or psychological pitfalls recognized if described in notes (e.g. "FOMO", "Chasing price", "No stop loss", "Exited too early", or "None" if trade execution looks disiplined).
    `;

    contents.push({ text: promptContext });

    // Requesting structured JSON from Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pair: {
              type: Type.STRING,
              description: "The parsed asset token / trading pair name, e.g. BTCUSD or EURUSD."
            },
            direction: {
              type: Type.STRING,
              description: "Must be 'LONG' or 'SHORT'. Default based on context."
            },
            time: {
              type: Type.STRING,
              description: "Extracted time or duration, e.g. '12:30 PM' or date."
            },
            riskReward: {
              type: Type.NUMBER,
              description: "The estimated risk-reward ratio, e.g. 3.0"
            },
            entryReason: {
              type: Type.STRING,
              description: "Short list of reasons why the entry was taken (technical indicators or breakout rules)."
            },
            mistake: {
              type: Type.STRING,
              description: "Any trade execution mistake mentioned or deduced, otherwise 'None'."
            }
          },
          required: ["pair", "direction", "riskReward", "entryReason", "mistake"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Gemini Parsing Error:", error);
    res.status(500).json({
      error: error.message || "Unable to parse trade details at this moment.",
      fallback: {
        pair: "EURUSD",
        direction: "LONG",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        riskReward: 2.0,
        entryReason: "Bullish price action breakout",
        mistake: "None"
      }
    });
  }
});

// 📊 AI Lot & Sizing Position Estimator / Calculator
app.post("/api/gemini/calculate-position", async (req, res) => {
  try {
    const { pair, direction, accountBalance, riskPercent, leverage, entryReason } = req.body;

    const ai = getGenAI();
    const prompt = `
      You are an elite, professional risk management coach and currency/crypto algorithmic calculator.
      The user wants to calculate the optimal position size and lot size for their trade with these guidelines:
      - Trading Asset/Pair: ${pair || "BTCUSD"}
      - Direction: ${direction || "LONG"}
      - Account Balance (USD): $${accountBalance || 10000}
      - Risk Target (%): ${riskPercent || 1}%
      - Leverage Used: ${leverage || 20}x
      - Text Context / Setup Description: "${entryReason || "Standard retest"}"

      Task:
      Determine standard contract specs for this asset class (e.g. BTCUSD is Crypto, EURUSD is Forex, NASDAQ/SPX is Indices).
      1. Choose a reasonable, realistic current Entry Price and a suggested logical Stop Loss Price based on standard technical ranges or description details.
      2. Calculate the Stop Loss distance in Pips (specifically for Forex where 1 pip = 0.0001, JPY = 0.01) or Points/Percentage (for Crypto/Stocks).
      3. Calculate the absolute Risk Amount in USD (Account Balance * Risk Percent / 100).
      4. Calculate the standard recommended Lot Size/Quantities:
         - Forex: Lot size = Risk Amount / (Stop Loss in pips * pip value per standard lot, which is $10 for base USD quote pairs).
         - Crypto/Stocks: Volume/Lot size = Risk Amount / absolute distance (Entry - StopLoss).
      5. Calculate the absolute Notional Position Value in USD (Lot/Quantities * Entry Price) and the client margin required (Notional Value / Leverage) to execute this trade.
      6. Provide a concise, professional AI commentary detailing exactly how this calculation was reached with steps in light of risk management.

      Ensure numbers are returned strictly as flat floats/doubles without symbols. Return the outcome strictly in JSON matching the schema provided.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [{ text: prompt }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            entryPrice: { 
              type: Type.NUMBER, 
              description: "The estimated or recommended entry price flat number." 
            },
            stopLossPrice: { 
              type: Type.NUMBER, 
              description: "The recommended logical stop loss price flat number." 
            },
            stopLossPips: { 
              type: Type.NUMBER, 
              description: "The distance in pips or points (e.g., 25 pips or 500 points)." 
            },
            riskAmountUsd: { 
              type: Type.NUMBER, 
              description: "The total absolute USD cash risked (Balance * Risk%)." 
            },
            lotSize: { 
              type: Type.NUMBER, 
              description: "Recommended lot size (Forex standard lots, e.g., 0.45, or Cryptocurrency tokens, e.g., 0.12 BTC)." 
            },
            notionalUsd: { 
              type: Type.NUMBER, 
              description: "The total notional position size in USD dollars." 
            },
            marginUsd: { 
              type: Type.NUMBER, 
              description: "Calculated margin required in USD (Notional / Leverage)." 
            },
            commentary: { 
              type: Type.STRING, 
              description: "Clean step-by-step math calculation breakdown and professional risk tips." 
            }
          },
          required: ["entryPrice", "stopLossPrice", "stopLossPips", "riskAmountUsd", "lotSize", "notionalUsd", "marginUsd", "commentary"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (error: any) {
    console.error("Position calculation endpoint error:", error);
    res.status(500).json({ error: error.message || "Failed to calculate sizing details." });
  }
});

// Setup Server and optional Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to port 3000 and 0.0.0.0
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[EdgeJournal Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start EdgeJournal Server:", err);
});
