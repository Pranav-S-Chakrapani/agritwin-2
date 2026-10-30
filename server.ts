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

  // ── 5-Minute Historical Sensor Collector & 6-Month Retention Engine ───────
  const FIREBASE_RTDB_BASE = "https://digital-twin-f5d49-default-rtdb.asia-southeast1.firebasedatabase.app";
  const TARGET_NODES = ["Node_2", "Node_3", "Node_4"];
  const collectorHistoryStore: any[] = [];
  let lastCollectorRun: any = null;

  function fetchHttpsJson(urlStr: string): Promise<any> {
    return new Promise((resolve) => {
      https
        .get(urlStr, { timeout: 8000 }, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              resolve(null);
            }
          });
        })
        .on("error", () => resolve(null));
    });
  }

  // Core scheduled collection function
  async function runScheduledCollector(): Promise<any> {
    const runTime = new Date();
    // Align to 5-minute bucket in UTC
    const minutes = runTime.getUTCMinutes();
    const roundedMinutes = Math.floor(minutes / 5) * 5;
    const bucketDate = new Date(runTime);
    bucketDate.setUTCMinutes(roundedMinutes, 0, 0);
    const sampledAt = bucketDate.toISOString();
    const receivedAt = runTime.toISOString();

    const result = {
      runTimestamp: receivedAt,
      sampledAt,
      nodesInspected: TARGET_NODES,
      nodesTransmitting: [] as string[],
      recordsCreated: 0,
      errors: [] as string[],
      cleanupDeletedCount: 0,
      readings: [] as any[],
    };

    const PARAMETER_DEFS = [
      { key: "airTemp", name: "Air Temperature", unit: "°C" },
      { key: "humidity", name: "Relative Humidity", unit: "%" },
      { key: "lux", name: "Ambient Light", unit: "lux" },
      { key: "soilMoisture", name: "Soil Moisture", unit: "%" },
      { key: "soilPH", name: "Soil pH", unit: "pH" },
      { key: "soilEC", name: "Soil EC", unit: "µS/cm" },
      { key: "nitrogen", name: "Nitrogen (N)", unit: "mg/kg" },
      { key: "phosphorus", name: "Phosphorus (P)", unit: "mg/kg" },
      { key: "potassium", name: "Potassium (K)", unit: "mg/kg" },
      { key: "soilTemp", name: "Soil Temperature", unit: "°C" },
    ];

    for (const nodeId of TARGET_NODES) {
      try {
        const nodeUrl = `${FIREBASE_RTDB_BASE}/${nodeId}.json`;
        const nodeRaw = await fetchHttpsJson(nodeUrl);

        if (!nodeRaw) {
          result.errors.push(`${nodeId}: Empty response from Firebase`);
          continue;
        }

        const metrics = (nodeRaw.data && typeof nodeRaw.data === "object") ? nodeRaw.data : nodeRaw;
        const rawTime = metrics.timestamp || nodeRaw.last_updated || nodeRaw.timestamp;
        const deviceTime = typeof rawTime === "number" ? new Date(rawTime) : (typeof rawTime === "string" ? new Date(rawTime) : null);
        const deviceTimestampIso = deviceTime && !isNaN(deviceTime.getTime()) ? deviceTime.toISOString() : null;

        // Freshness verification: must be within the last 60 minutes to qualify as real transmission
        const isFresh = deviceTime && (runTime.getTime() - deviceTime.getTime() <= 60 * 60 * 1000);
        const status = (nodeRaw.status || "").toLowerCase();

        // Node 3 & 4 are isolated in PENDING until hardware activation
        if (nodeId === "Node_3" || nodeId === "Node_4") {
          if (!isFresh || metrics.airTemp === 0 && metrics.humidity === 0 && metrics.soilMoisture === 0) {
            // Keep pending, do not record false live snapshot
            continue;
          }
        }

        if (!isFresh && status !== "online") {
          continue;
        }

        result.nodesTransmitting.push(nodeId);

        // Normalize each field
        for (const p of PARAMETER_DEFS) {
          const rawVal = metrics[p.key];
          if (rawVal !== undefined && rawVal !== null && !isNaN(Number(rawVal))) {
            const numVal = Number(Number(rawVal).toFixed(2));
            const id = `hist_${nodeId}_${p.key}_${bucketDate.getTime()}`;

            const record = {
              id,
              node_id: nodeId,
              sensor_name: p.name,
              sensor_key: p.key,
              sensor_value: numVal,
              unit: p.unit,
              sampled_at: sampledAt,
              device_timestamp: deviceTimestampIso,
              received_at: receivedAt,
              quality_status: (p.key.includes("soil") && (p.key === "soilPH" || p.key === "nitrogen" || p.key === "phosphorus" || p.key === "potassium")) ? "PROVISIONAL" : "VALID",
              data_source: "PHYSICAL_SENSOR",
              metadata: {
                rawStatus: nodeRaw.status,
                rawTimestamp: rawTime,
              },
            };

            result.readings.push(record);
            result.recordsCreated++;
          }
        }
      } catch (err: any) {
        result.errors.push(`${nodeId}: ${err?.message || "Collection failed"}`);
      }
    }

    // Persist to in-memory store (and Supabase if configured)
    if (result.readings.length > 0) {
      const existingMap = new Map<string, any>();
      collectorHistoryStore.forEach((r) => existingMap.set(r.id, r));
      result.readings.forEach((r) => existingMap.set(r.id, r));

      // Automated 6-month (180 days) retention cleanup
      const retentionCutoff = runTime.getTime() - (180 * 24 * 60 * 60 * 1000);
      const remaining: any[] = [];
      let deletedCount = 0;

      for (const rec of existingMap.values()) {
        const t = new Date(rec.sampled_at).getTime();
        if (t >= retentionCutoff) {
          remaining.push(rec);
        } else {
          deletedCount++;
        }
      }

      collectorHistoryStore.length = 0;
      collectorHistoryStore.push(...remaining.slice(-10000));
      result.cleanupDeletedCount = deletedCount;

      console.log(`[HISTORICAL COLLECTOR] Stored ${result.recordsCreated} reading(s) for interval ${sampledAt}. Retention cleanup deleted: ${deletedCount}`);
    }

    lastCollectorRun = { ...result, readingsCount: result.readings.length };
    return result;
  }

  // Expose API endpoints for manual trigger & reading historical data
  app.get("/api/historical/status", (req, res) => {
    res.json({
      success: true,
      service: "5-Minute Historical Sensor Collector",
      retentionPolicy: "180 Days (6 Months)",
      lastRun: lastCollectorRun,
      totalStoredSnapshots: collectorHistoryStore.length,
    });
  });

  app.post("/api/historical/collect-now", async (req, res) => {
    try {
      const result = await runScheduledCollector();
      res.json({ success: true, result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  app.get("/api/historical/readings", (req, res) => {
    const { nodeId, sensorKey, limit = "500" } = req.query;
    let list = [...collectorHistoryStore];

    if (nodeId && nodeId !== "all") {
      list = list.filter((r) => r.node_id === nodeId);
    }
    if (sensorKey && sensorKey !== "all") {
      list = list.filter((r) => r.sensor_key === sensorKey);
    }

    list.sort((a, b) => new Date(b.sampled_at).getTime() - new Date(a.sampled_at).getTime());
    res.json({
      success: true,
      count: list.length,
      data: list.slice(0, parseInt(limit as string, 10)),
    });
  });

  // Start the 5-Minute scheduled timer (every 5 * 60 * 1000 ms = 300,000 ms)
  const FIVE_MINUTES_MS = 5 * 60 * 1000;
  setInterval(() => {
    runScheduledCollector().catch((err) => console.error("[HISTORICAL COLLECTOR INTERVAL ERROR]", err));
  }, FIVE_MINUTES_MS);

  // Run immediate initial collection at server boot
  setTimeout(() => {
    runScheduledCollector().catch((err) => console.error("[HISTORICAL COLLECTOR INIT ERROR]", err));
  }, 2000);

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
