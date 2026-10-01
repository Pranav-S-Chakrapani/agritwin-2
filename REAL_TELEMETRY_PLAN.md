# Implementation Plan: Display Real Firebase Last-Recorded Telemetry Across AgriTwin

## 1. Ground Truth & Telemetry Analysis
- **Firebase Root Path**:
  - `Node_2`: `airTemp: 35.5°C, humidity: 68.8%, lux: 2760, nitrogen: 50, phosphorus: 50, potassium: 50, soilEC: 50, soilMoisture: 5%, soilPH: 0.5, soilTemp: 5°C, timestamp: 1788423829213 (~26 days ago)`
  - `Node_3`: `airTemp: 35.7°C, humidity: 65.9%, lux: 1348, nitrogen: 83, phosphorus: 83, potassium: 83, soilEC: 83, soilMoisture: 8.3%, soilPH: 0.83, soilTemp: 8.3°C, timestamp: 1788423829496 (~26 days ago)`
  - `Node_4`: `airTemp: 22.8°C, humidity: 52.8%, lux: 142.5, nitrogen: 0, phosphorus: 0, potassium: 0, soilEC: 0, soilMoisture: 0%, soilPH: 0, soilTemp: 0°C, timestamp: 1775812812526 (~172 days ago / test phase)`
  - `Node_5`: `airTemp: 22.9°C, humidity: 56.8%, lux: 147.5, NPK/Soil: 0, timestamp: 1775812984364`
  - `Node_6`: `airTemp: 24.4°C, humidity: 53.1%, lux: 90, NPK/Soil: 0, timestamp: 1775815074680`
  - `Node_7`: `airTemp: 25.3°C, humidity: 47.1%, lux: 116.6, NPK/Soil: 0, timestamp: 1775814752111`
  - `Node_1`: Initial provisioning/standby (assigned to Zone 1, fallback to standby initial state or Node 2/3 metrics).

## 2. Core Enhancements to Implement
1. **Extend `firebaseTelemetry.ts`**:
   - Capture all 10 Firebase metrics (`airTemp`, `humidity`, `lux`, `nitrogen`, `phosphorus`, `potassium`, `soilEC`, `soilMoisture`, `soilPH`, `soilTemp`).
   - Listen to all 7 nodes (`Node_1` to `Node_7`) by default so no node data is missed.
   - Return real recorded timestamps directly in `SensorNode`.

2. **Create a Single Reusable `UnifiedSensorCard.tsx` Component**:
   - Displays real numeric readings without rounding discrepancies or zeroes unless that was the actual reading.
   - Status badge: Clean muted gray `"OFFLINE"` badge (not alarmist red).
   - Shows relative time `"Last reading: 26 days ago"` + exact UTC/local timestamp on hover or subtitle.
   - Visually muted styling (reduced opacity / subtle grayscale card) that automatically transitions to vibrant live styling whenever `isOnline === true` upon socket ping.

3. **Wire Unified Card and Real Data Everywhere**:
   - **Sensors Page (`src/pages/MySensors.tsx`)**: Replace inline sensor display with `UnifiedSensorCard` for all mapped and standby nodes.
   - **Dashboard (`src/pages/Dashboard.tsx`)**: Use real `Node_2` / mapped node values (`airTemp: 35.5°C, humidity: 68.8%, moisture: 5%`) for gauges and score cards. Score cards explicitly captioned: *"Based on last known readings (26 days ago — sensors currently offline)"*.
   - **Alerts Panel**: Surface dated observations rather than active alarms (e.g. *"Note: last recorded soil moisture was 5% (26 days ago), before sensor went offline"*).
   - **Digital Twin Map (`InteractiveFarmDigitalTwin.tsx`)**: Zone popup detail cards use the exact same telemetry and offline badge formatting.

4. **Preserve Future Live Transition**:
   - Zero separate "historical only" branched code paths; single real-time listener switches state automatically when new packets are written to Firebase.
