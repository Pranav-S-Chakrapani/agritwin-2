import express from "express";
import path from "path";
import https from "https";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

  // JSON payload parser
  app.use(express.json({ limit: "20mb" }));

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      system: "AgriTwin Digital Twin Server",
      timestamp: new Date().toISOString(),
    });
  });

  // Server-side Gemini AI Vision Analysis for 6 Digital Twin Parameters
  app.post("/api/analyze-plant", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing on server.",
        });
      }

      const { imageBase64, mimeType, cropContext } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ error: "Missing imageBase64 in request body" });
      }

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
You are the Computer Vision & Biophysical Digital Twin AI engine for Smart Agriculture.
Analyze the provided crop image and evaluate the 6 MAIN DIGITAL TWIN PARAMETERS shown in the system architecture:
1. Plant Height Detection (estimate height in cm, e.g. 10 - 200 cm)
2. Canopy Coverage Detection (estimate percentage of ground covered by foliage, 0-100%)
3. Growth Stage & Growth Velocity (determine growth stage like Germination, Vegetative, Flowering, Fruit Set, or Harvest Ready)
4. Disease Detection (identify any plant disease, pathogen, leaf spots, nutrient deficiency, or chlorosis, give risk score 0-100% and recommended action)
5. Fruit Ripeness Detection (estimate ripeness percentage 0-100%, color stage, and days to optimal harvest)
6. Crop Yield Estimation (predict projected yield in kg/m², e.g., 2.0 to 18.0)

Crop Context provided by farmer: ${cropContext || 'General Crop'}.

Respond strictly in valid JSON format with the following JSON structure:
{
  "plantHeightEstimateCm": number,
  "canopyCoveragePercent": number,
  "growthStage": string,
  "healthAssessment": {
    "diseaseName": string,
    "riskScore": number,
    "severity": "None" | "Mild" | "Moderate" | "Severe",
    "recommendedAction": string
  },
  "fruitRipeness": {
    "ripenessPercent": number,
    "colorStage": string,
    "daysToOptimalHarvest": number
  },
  "yieldProjectionKgPerM2": number,
  "confidenceScore": number,
  "keyObservations": string[]
}
`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType || "image/jpeg",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                },
              },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const analysisResult = JSON.parse(responseText);

      return res.json({
        success: true,
        analysis: analysisResult,
      });
    } catch (err: any) {
      console.error("Error in /api/analyze-plant:", err);
      return res.status(500).json({
        error: "Failed to analyze plant photo using Gemini AI.",
        details: err?.message || String(err),
      });
    }
  });

  // Server-side Slide Creation endpoint using client OAuth token
  app.post("/api/slides/create", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          error: "Unauthorized: Missing or invalid Authorization header with Bearer token.",
        });
      }

      const accessToken = authHeader.split(" ")[1];
      const { projectTitle, studentName, collegeName, teamMembers, clientName, twinData } = req.body;

      // 1. Create a presentation via Google Slides REST API
      const createResponse = await fetch("https://slides.googleapis.com/v1/presentations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `${projectTitle || "AgriTwin Project Blueprint"} - Presentation Deck`,
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.text();
        console.error("Google Slides API create error:", errorData);
        return res.status(createResponse.status).json({
          error: "Failed to create presentation in Google Slides API.",
          details: errorData,
        });
      }

      const presentation = await createResponse.json();
      const presentationId = presentation.presentationId;

      // 2. Add slide content requests
      const requests = [
        // Title slide creation / formatting
        {
          createSlide: {
            insertionIndex: 1,
            slideLayoutType: "TITLE",
          },
        },
        {
          createSlide: {
            insertionIndex: 2,
            slideLayoutType: "SECTION_HEADER",
          },
        },
        {
          createSlide: {
            insertionIndex: 3,
            slideLayoutType: "MAIN_POINT",
          },
        },
      ];

      // Send batchUpdate
      const batchResponse = await fetch(
        `https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ requests }),
        }
      );

      return res.json({
        success: true,
        presentationId,
        presentationUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
      });
    } catch (err: any) {
      console.error("Error in /api/slides/create:", err);
      return res.status(500).json({
        error: "Failed to create Google Slides deck.",
        details: err?.message || String(err),
      });
    }
  });

  // Server-side Gemini AI call with Google Search Grounding to fetch weather data
  app.post("/api/weather", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY environment variable is missing on server.",
        });
      }

      const { location } = req.body;
      const queryLocation = location || "Dharwad, Karnataka, India"; // Fallback to a default location

      const ai = new GoogleGenAI({ apiKey });

      const prompt = `Provide the current local weather forecast and conditions for ${queryLocation}. Use Google Search to find the latest real-time data.
      Return the results STRICTLY in valid JSON format matching this structure exactly:
      {
        "airTemp": "numeric value in °C, e.g. 26",
        "humidity": "numeric value in %, e.g. 76",
        "windSpeed": "numeric value in km/h, e.g. 18.9",
        "uvIndex": "string, e.g. 'moderate' or 'high'",
        "sunrise": "string time, e.g. '06:15 AM'",
        "sunset": "string time, e.g. '06:51 PM'"
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3.7-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const weatherData = JSON.parse(responseText);

      return res.json({
        success: true,
        weather: weatherData,
      });
    } catch (err: any) {
      console.error("Error in /api/weather:", err);
      
      const isQuotaError = err?.status === 429 || String(err).includes("429") || String(err).includes("RESOURCE_EXHAUSTED");
      
      if (isQuotaError) {
        return res.status(429).json({
          error: "Gemini API Quota Exhausted. Please check your plan.",
          isQuotaExhausted: true
        });
      }

      return res.status(500).json({
        error: "Failed to fetch weather data using Gemini AI.",
        details: err?.message || String(err),
      });
    }
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // POST /api/telemetry
  // Writes TelemetryObservation[] to Firestore via the REST API using
  // Node.js https.request (bypasses native fetch / WebChannel issues).
  // ─────────────────────────────────────────────────────────────────────────────
  {
    const FS_PROJECT_ID  = "unified-correlate-hxctm";
    const FS_DATABASE_ID = "ai-studio-agritwincropdigi-372ea700-9482-4e27-9cbd-81501a2db50d";
    const FS_API_KEY     = "AIzaSyCDQYt6IuskPWbzEWLqHUrVjld25ha-17A";

    /** Convert a JS value → Firestore REST typed field value */
    function toFsValue(v: any): any {
      if (v === null || v === undefined) return { nullValue: null };
      if (typeof v === "boolean")        return { booleanValue: v };
      if (typeof v === "number")         return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
      if (typeof v === "string")         return { stringValue: v };
      if (Array.isArray(v))             return { arrayValue: { values: v.map(toFsValue) } };
      if (typeof v === "object") {
        const fields: Record<string, any> = {};
        for (const [k, val] of Object.entries(v)) fields[k] = toFsValue(val);
        return { mapValue: { fields } };
      }
      return { stringValue: String(v) };
    }

    function toFsDoc(obj: Record<string, any>) {
      const fields: Record<string, any> = {};
      for (const [k, v] of Object.entries(obj)) fields[k] = toFsValue(v);
      return { fields };
    }

    /** PATCH one Firestore document via Node https.request — no fetch, no WebChannel */
    function fsRestPatch(docId: string, body: object): Promise<{ ok: boolean; status: number; text: string }> {
      return new Promise((resolve) => {
        const payload = JSON.stringify(body);
        const path = `/v1/projects/${FS_PROJECT_ID}/databases/${FS_DATABASE_ID}/documents/telemetry_observations/${encodeURIComponent(docId)}?key=${FS_API_KEY}`;
        const options = {
          hostname: "firestore.googleapis.com",
          port: 443,
          path,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload),
          },
        };
        const req = https.request(options, (res) => {
          let data = "";
          res.on("data", (chunk) => { data += chunk; });
          res.on("end", () => {
            resolve({ ok: (res.statusCode ?? 500) < 300, status: res.statusCode ?? 500, text: data });
          });
        });
        req.on("error", (err) => {
          resolve({ ok: false, status: 0, text: err.message });
        });
        req.write(payload);
        req.end();
      });
    }

    app.post("/api/telemetry", async (req, res) => {
      const { observations } = req.body as { observations: Record<string, any>[] };

      if (!Array.isArray(observations) || observations.length === 0) {
        return res.status(400).json({ success: false, error: "No observations provided." });
      }

      const writeErrors: string[] = [];
      let written = 0;

      await Promise.all(
        observations.map(async (obs) => {
          const result = await fsRestPatch(obs.id, toFsDoc(obs));
          if (result.ok) {
            written++;
          } else {
            writeErrors.push(`${obs.id}: HTTP ${result.status} — ${result.text.slice(0, 200)}`);
          }
        })
      );

      if (writeErrors.length > 0) {
        console.error("[FIRESTORE DEMO WRITE ERROR]", {
          status: "partial_failure",
          code: "REST_WRITE_ERROR",
          message: writeErrors.join(" | "),
        });
      }

      if (written === 0) {
        return res.status(500).json({ success: false, error: "All Firestore writes failed.", details: writeErrors });
      }

      console.log("[FIRESTORE DEMO WRITE SUCCESS]", {
        databaseId: FS_DATABASE_ID,
        collection: "telemetry_observations",
        count: written,
      });

      return res.json({ success: true, count: written });
    });
  }

  // Vite middleware in dev mode vs static serve in prod
  if (process.env.NODE_ENV !== "production") {
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AgriTwin Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
