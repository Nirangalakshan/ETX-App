import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require2 = createRequire(import.meta.url);
const dotenv = require2("dotenv");
const envPath = path.join(__dirname, "..", ".env");
console.log(`Attempting to load .env from: ${envPath}`);
const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error("Error loading .env file:", result.error);
  console.warn("Warning: .env file could not be loaded. API key may not be available.");
} else {
  console.log("Successfully loaded .env file");
  console.log(`OPENROUTER_API_KEY found: ${process.env.OPENROUTER_API_KEY ? "Yes" : "No"}`);
  if (process.env.OPENROUTER_API_KEY) {
    console.log(`API Key length: ${process.env.OPENROUTER_API_KEY.length}`);
    console.log(`API Key starts with: ${process.env.OPENROUTER_API_KEY.substring(0, 15)}...`);
  }
}
process.chdir(__dirname);
const { SerialPort } = require2("serialport");
const fetch = require2("node-fetch");
ipcMain.handle("fetch-ai-analysis", async (_event, dataSummary) => {
  var _a, _b;
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    console.log("=== AI Analysis Request Debug ===");
    console.log("Environment variables check:");
    console.log("- API Key exists:", !!apiKey);
    if (!apiKey) {
      console.error("API key not found. Available env vars:", Object.keys(process.env).filter((key) => key.includes("API") || key.includes("OPENROUTER")));
      throw new Error("OpenRouter API key not found in environment variables. Please check your .env file.");
    }
    console.log("API Key details:");
    console.log("- Length:", apiKey.length);
    console.log("- Starts with:", apiKey.substring(0, 20) + "...");
    console.log("- Format check:", apiKey.startsWith("sk-or-v1-") ? "Valid format" : "Invalid format");
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://battery-system-app.local",
      // Required by OpenRouter
      "X-Title": "Battery System Analysis"
      // Optional but recommended
    };
    const testRequestBody = {
      "model": "openrouter/horizon-beta",
      "messages": [
        {
          "role": "user",
          "content": "Hello, this is a test message."
        }
      ],
      "max_tokens": 50
    };
    const testResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(testRequestBody)
    });
    console.log("Test response status:", testResponse.status);
    if (!testResponse.ok) {
      const testErrorText = await testResponse.text();
      console.log("Test error response:", testErrorText);
      if (testResponse.status === 401) {
        throw new Error(`OpenRouter API Key Authentication Failed (401): The API key in your .env file appears to be invalid or expired. Please:

1. Check your OpenRouter account at https://openrouter.ai/
2. Verify your API key is active and has sufficient credits
3. Generate a new API key if needed
4. Update the OPENROUTER_API_KEY in your .env file

Current API key format: ${apiKey.startsWith("sk-or-v1-") ? "Valid" : "Invalid"} (${apiKey.length} characters)`);
      }
      throw new Error(`OpenRouter API error: ${testResponse.status} - ${testErrorText}`);
    }
    const testData = await testResponse.json();
    console.log("API key test successful, proceeding with main request...");
    const prompt = `Analyze this battery system data and provide insights in JSON format with "summary" and "recommendations" fields:

Battery System Data:
${JSON.stringify(dataSummary, null, 2)}

Please provide:
1. A brief summary of the overall system status
2. Specific recommendations for any issues found
3. Format the response as valid JSON with "summary" and "recommendations" array fields`;
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        "model": "openrouter/horizon-beta",
        "messages": [
          {
            "role": "system",
            "content": "You are a battery system analysis expert. Analyze the provided data and respond with valid JSON containing 'summary' (string) and 'recommendations' (array of strings) fields."
          },
          {
            "role": "user",
            "content": prompt
          }
        ],
        "max_tokens": 500,
        "temperature": 0.3
      })
    });
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      const errorText = await response.text();
      console.log("Error response body:", errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    const content = (_b = (_a = data.choices[0]) == null ? void 0 : _a.message) == null ? void 0 : _b.content;
    if (!content) {
      throw new Error("No content received from AI API");
    }
    console.log("AI Response content:", content);
    try {
      const parsedResponse = JSON.parse(content);
      return {
        summary: parsedResponse.summary || "No summary provided",
        recommendations: Array.isArray(parsedResponse.recommendations) ? parsedResponse.recommendations : ["No specific recommendations provided"],
        error: null
      };
    } catch (parseError) {
      console.log("Failed to parse JSON response, using raw content");
      return {
        summary: content,
        recommendations: ["Please review the analysis above for detailed recommendations"],
        error: null
      };
    }
  } catch (error) {
    console.error("Error fetching AI analysis:", error);
    const fallbackAnalysis = generateFallbackAnalysis(dataSummary);
    return {
      summary: fallbackAnalysis.summary,
      recommendations: fallbackAnalysis.recommendations,
      error: `AI Analysis unavailable: ${error instanceof Error ? error.message : "Failed to fetch AI analysis"}`
    };
  }
});
function generateFallbackAnalysis(dataSummary) {
  const summary = [];
  const recommendations = [];
  if (dataSummary.csu1Cells) {
    const csu1Critical = dataSummary.csu1Cells.filter((cell) => cell.status === "critical").length;
    const csu1Warning = dataSummary.csu1Cells.filter((cell) => cell.status === "warning").length;
    const csu1Normal = dataSummary.csu1Cells.filter((cell) => cell.status === "normal").length;
    const csu1NoData = dataSummary.csu1Cells.filter((cell) => cell.status === "no-data").length;
    summary.push(`CSU1: ${csu1Normal} normal, ${csu1Warning} warnings, ${csu1Critical} critical, ${csu1NoData} no data`);
    if (csu1Critical > 0) {
      recommendations.push(`CSU1 has ${csu1Critical} critical cell(s) - immediate attention required`);
    }
    if (csu1Warning > 0) {
      recommendations.push(`CSU1 has ${csu1Warning} warning(s) - monitor closely`);
    }
    if (csu1NoData > 0) {
      recommendations.push(`CSU1 has ${csu1NoData} cell(s) with no data - check connections`);
    }
  }
  if (dataSummary.csu2Cells) {
    const csu2Critical = dataSummary.csu2Cells.filter((cell) => cell.status === "critical").length;
    const csu2Warning = dataSummary.csu2Cells.filter((cell) => cell.status === "warning").length;
    const csu2Normal = dataSummary.csu2Cells.filter((cell) => cell.status === "normal").length;
    const csu2NoData = dataSummary.csu2Cells.filter((cell) => cell.status === "no-data").length;
    summary.push(`CSU2: ${csu2Normal} normal, ${csu2Warning} warnings, ${csu2Critical} critical, ${csu2NoData} no data`);
    if (csu2Critical > 0) {
      recommendations.push(`CSU2 has ${csu2Critical} critical cell(s) - immediate attention required`);
    }
    if (csu2Warning > 0) {
      recommendations.push(`CSU2 has ${csu2Warning} warning(s) - monitor closely`);
    }
    if (csu2NoData > 0) {
      recommendations.push(`CSU2 has ${csu2NoData} cell(s) with no data - check connections`);
    }
  }
  if (dataSummary.daisyChainIssues && dataSummary.daisyChainIssues.length > 0) {
    summary.push(`Daisy Chain: ${dataSummary.daisyChainIssues.length} issues detected`);
    recommendations.push(`Check daisy chain connections - ${dataSummary.daisyChainIssues.length} issues found`);
  }
  if (dataSummary.voltageComparisons && dataSummary.voltageComparisons.length > 0) {
    const mismatches = dataSummary.voltageComparisons.filter((comp) => comp.status === "Mismatch").length;
    if (mismatches > 0) {
      summary.push(`Voltage: ${mismatches} mismatches found`);
      recommendations.push(`${mismatches} voltage mismatch(es) detected - verify set values`);
    }
  }
  if (summary.length === 0) {
    summary.push("System status analysis completed - limited data available");
    recommendations.push("Ensure all battery cells are properly connected and monitored");
  }
  return {
    summary: `Battery System Analysis (Fallback Mode): ${summary.join(". ")}`,
    recommendations: recommendations.length > 0 ? recommendations : ["System appears stable - continue monitoring"]
  };
}
ipcMain.handle("list-ports", async () => {
  try {
    const ports = await SerialPort.list();
    console.log(
      "Ports found:",
      ports.map((port) => port.path)
    );
    return ports.map((port) => port.path);
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});
const calculateCRC16 = (data) => {
  let crc = 65535;
  const polynomial = 40961;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const lsb = crc & 1;
      crc >>= 1;
      if (lsb) crc ^= polynomial;
    }
  }
  return crc;
};
let serialPort = null;
ipcMain.handle(
  "open-port",
  async (_event, portPath, baudRate = 9600) => {
    return new Promise((resolve, reject) => {
      if (serialPort && serialPort.isOpen) {
        return resolve({
          success: false,
          error: "Another port is already open"
        });
      }
      serialPort = new SerialPort({
        path: portPath,
        baudRate,
        autoOpen: false
      });
      let byteBuffer = [];
      serialPort.open((err) => {
        if (err) {
          console.error("Error opening port:", err);
          serialPort = null;
          return reject({ success: false, error: err.message });
        }
        console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
        resolve({ success: true });
        serialPort.on("data", (data) => {
          const bytes = Array.from(data);
          byteBuffer = [...byteBuffer, ...bytes];
          while (byteBuffer.length >= 8) {
            const frame = byteBuffer.slice(0, 8);
            byteBuffer = byteBuffer.slice(8);
            if (frame[0] !== 7) {
              console.warn("Invalid frame start:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `Invalid frame start: ${frame}`);
              }
              continue;
            }
            const receivedCRC = frame[7] << 8 | frame[6];
            const calculatedCRC = calculateCRC16(frame.slice(0, 6));
            if (receivedCRC !== calculatedCRC) {
              console.warn("CRC mismatch:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `CRC mismatch: ${frame}`);
              }
              continue;
            }
            const hexString = frame.map((b) => b.toString(16).padStart(2, "0")).join(" ").toUpperCase();
            const decimalString = frame.map((b) => b.toString(10).padStart(3, "0")).join(" ");
            console.log("Serial HEX data received:", hexString);
            console.log("Serial DECIMAL data received:", decimalString);
            let voltageVolts = void 0;
            if (frame.length >= 8 && frame[0] === 7 && (frame[2] === 166 || frame[2] === 167)) {
              const voltageLimit = (frame[2] << 8 | frame[3]) / 1e4;
              voltageVolts = voltageLimit.toFixed(3);
              console.log(`Voltage: ${voltageVolts} V`);
            }
            let tempCelsius = void 0;
            if (frame.length >= 8 && frame[0] === 7 && frame[2] === 165) {
              const tempRaw = frame[4] << 8 | frame[5];
              const tempC = tempRaw / 100;
              tempCelsius = tempC.toFixed(1);
              console.log(`Temperature: ${tempCelsius} °C`);
            }
            if (win && !win.isDestroyed()) {
              win.webContents.send("serial-data", {
                hex: hexString,
                parsed: voltageVolts
              });
            }
          }
        });
        serialPort.on("error", (err2) => {
          console.error("Serial port error:", err2);
          if (win && !win.isDestroyed()) {
            win.webContents.send("serial-error", err2.message);
          }
        });
        serialPort.on("close", () => {
          console.log("Serial port closed");
          serialPort = null;
          byteBuffer = [];
          if (win && !win.isDestroyed()) {
            win.webContents.send("serial-closed");
          }
        });
      });
    });
  }
);
ipcMain.handle("write-port-raw", async (_event, data) => {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) {
      return resolve({ success: false, error: "No port is open" });
    }
    const buffer = Buffer.from(data);
    serialPort.write(buffer, (err) => {
      if (err) {
        console.error("Error writing raw data to port:", err);
        return reject({ success: false, error: err.message });
      }
      console.log("Raw data written to port:", buffer);
      resolve({ success: true });
    });
  });
});
ipcMain.handle("close-port", async () => {
  try {
    if (serialPort && serialPort.isOpen) {
      await serialPort.close();
      serialPort = null;
      console.log("Main: Port closed successfully");
    } else {
      console.log("Main: No open port to close");
    }
  } catch (error) {
    console.error("Main: Error closing port:", error);
    throw error;
  }
});
process.env.APP_ROOT = path.join(__dirname, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1920,
    height: 1080,
    resizable: false,
    center: true,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "public/icon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
  win.webContents.openDevTools();
  win.webContents.on("did-finish-load", () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
    }
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
    win.setTitle("Electron Vite App");
  }
  ipcMain.on("minimize-window", () => {
    win == null ? void 0 : win.minimize();
  });
  ipcMain.on("close-window", () => {
    win == null ? void 0 : win.close();
  });
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(async () => {
  createWindow();
  try {
    const ports = await SerialPort.list();
    console.log(
      "Startup ports:",
      ports.map((port) => port.path)
    );
  } catch (error) {
    console.error("Error listing ports at startup:", error);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
