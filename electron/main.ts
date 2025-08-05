// //convert to values
// import { app, BrowserWindow, ipcMain } from "electron";
// import { createRequire } from "node:module";
// import { fileURLToPath } from "node:url";
// import path from "node:path";

// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Set working directory to ensure package.json is found
// process.chdir(__dirname);

// // Use createRequire for CommonJS modules
// const require = createRequire(import.meta.url);
// const sqlite3 = require("sqlite3").verbose();
// const { SerialPort } = require("serialport");

// const db = new sqlite3.Database("users.db");

// // Create users table and insert a test user
// db.run(`CREATE TABLE IF NOT EXISTS users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   username TEXT NOT NULL UNIQUE,
//   password TEXT NOT NULL
// )`);

// db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, [
//   "vega",
//   "vega123",
// ]);

// // Handle login requests
// ipcMain.handle("login", async (_event, username: string, password: string) => {
//   return new Promise((resolve, reject) => {
//     db.get(
//       `SELECT * FROM users WHERE username = ? AND password = ?`,
//       [username, password],
//       (err: Error | null, row: any) => {
//         if (err) {
//           reject(err);
//         } else if (row) {
//           resolve({ success: true });
//         } else {
//           resolve({ success: false, error: "Invalid credentials" });
//         }
//       }
//     );
//   });
// });

// // Handle serial port listing
// ipcMain.handle("list-ports", async () => {
//   try {
//     const ports = await SerialPort.list();
//     console.log(
//       "Ports found:",
//       ports.map((port: { path: string }) => port.path)
//     );
//     return ports.map((port: { path: string }) => port.path);
//   } catch (error) {
//     console.error("Error listing ports:", error);
//     return [];
//   }
// });

// // Handle opening a serial port
// let serialPort: typeof SerialPort.prototype | null = null;
// ipcMain.handle(
//   "open-port",
//   async (_event, portPath: string, baudRate: number = 9600) => {
//     return new Promise((resolve, reject) => {
//       if (serialPort && serialPort.isOpen) {
//         return resolve({
//           success: false,
//           error: "Another port is already open",
//         });
//       }

//       serialPort = new SerialPort({
//         path: portPath,
//         baudRate: baudRate,
//         autoOpen: false,
//       });

//       serialPort.open((err

// : Error | null) => {
//         if (err) {
//           console.error("Erroropening port:", err);
//           serialPort = null;
//           return reject({ success: false, error: err.message });
//         }

//         console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
//         resolve({ success: true });

//         serialPort.on("data", (data: Buffer) => {
//           // Convert buffer to array of hex strings
//           const hexString = Array.from(data)
//             .map((b) => b.toString(16).padStart(2, "0"))
//             .join(" ");
//           // Convert buffer to array of decimal values
//           const decimalString = Array.from(data)
//             .map((b) => b.toString(10).padStart(3, "0"))
//             .join(" ");

//           console.log("Serial HEX data received:", hexString.toUpperCase());
//           console.log("Serial DECIMAL data received:", decimalString);

//           // Define voltageVolts outside the if block
//           let voltageVolts: string | undefined = undefined;

//           // Check if this is a get_voltage_limits response (byte 0 = 0x07, byte 1 = 0xA6 or 0xA7)
//           if (data.length >= 3 && data[0] === 0x07 && (data[2] === 0xA6 || data[2] === 0xA7)) {
//             const voltageLimit = (data[2] << 8) | data[3]; // bytes 1 and 2
//             voltageVolts = (voltageLimit / 10000).toFixed(3); // Convert to volts
//             console.log(`Voltage: ${voltageVolts} V`);
//           }

//           if (win && !win.isDestroyed()) {
//             win.webContents.send("serial-data", 
//               { hex: hexString.toUpperCase(), 
//                 parsed: voltageVolts });
//           }
//         });

//         serialPort.on("error", (err: Error) => {
//           console.error("Serial port error:", err);
//           if (win && !win.isDestroyed()) {
//             win.webContents.send("serial-error", err.message);
//           }
//         });

//         serialPort.on("close", () => {
//           console.log("Serial port closed");
//           serialPort = null;
//           if (win && !win.isDestroyed()) {
//             win.webContents.send("serial-closed");
//           }
//         });
//       });
//     });
//   }
// );

// // Handle writing raw bytes to the serial port (from Uint8Array)
// ipcMain.handle("write-port-raw", async (_event, data: Uint8Array) => {
//   return new Promise((resolve, reject) => {
//     if (!serialPort || !serialPort.isOpen) {
//       return resolve({ success: false, error: "No port is open" });
//     }

//     const buffer = Buffer.from(data);

//     serialPort.write(buffer, (err: Error | null) => {
//       if (err) {
//         console.error("Error writing raw data to port:", err);
//         return reject({ success: false, error: err.message });
//       }

//       console.log("Raw data written to port:", buffer);
//       resolve({ success: true });
//     });
//   });
// });

// // Handle closing the serial port
// ipcMain.handle("close-port", async () => {
//   try {
//     if (serialPort && serialPort.isOpen) {
//       await serialPort.close();
//       serialPort = null;
//       console.log("Main: Port closed successfully");
//     } else {
//       console.log("Main: No open port to close");
//     }
//   } catch (error) {
//     console.error("Main: Error closing port:", error);
//     throw error;
//   }
// });

// // Vite/Electron build paths
// process.env.APP_ROOT = path.join(__dirname, "..");
// export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
// export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
// process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
//   ? path.join(process.env.APP_ROOT, "public")
//   : RENDERER_DIST;

// let win: BrowserWindow | null;

// function createWindow() {
//   win = new BrowserWindow({
//     width: 1920,
//     height: 1024,
//     resizable: false,
//     frame: false,
//     autoHideMenuBar: true,
//     icon: path.join(__dirname, "public/icon.ico"),
//     webPreferences: {
//       preload: path.join(__dirname, "preload.mjs"),
//     },
//   });
//   win.webContents.openDevTools();

//   win.webContents.on("did-finish-load", () => {
//     if (win && !win.isDestroyed()) {
//       win.webContents.send("main-process-message", new Date().toLocaleString());
//     }
//   });

//   if (VITE_DEV_SERVER_URL) {
//     win.loadURL(VITE_DEV_SERVER_URL);
//   } else {
//     win.loadFile(path.join(RENDERER_DIST, "index.html"));
//     win.setTitle("Electron Vite App");
//   }

//   ipcMain.on("minimize-window", () => {
//     win?.minimize();
//   });

//   ipcMain.on("close-window", () => {
//     win?.close();
//   });
// }

// app.on("window-all-closed", () => {
//   if (process.platform !== "darwin") {
//     app.quit();
//     win = null;
//   }
// });

// app.on("activate", () => {
//   if (BrowserWindow.getAllWindows().length === 0) {
//     createWindow();
//   }
// });

// app.whenReady().then(async () => {
//   createWindow();
//   try {
//     const ports = await SerialPort.list();
//     console.log(
//       "Startup ports:",
//       ports.map((port: { path: string }) => port.path)
//     );
//   } catch (error) {
//     console.error("Error listing ports at startup:", error);
//   }
// });








//setup for AI intergration
import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use createRequire for CommonJS modules
const require = createRequire(import.meta.url);
const dotenv = require('dotenv');

// Load .env file from the project root (parent directory of electron folder)
const envPath = path.join(__dirname, '..', '.env');
console.log(`Attempting to load .env from: ${envPath}`);

const result = dotenv.config({ path: envPath });
if (result.error) {
  console.error('Error loading .env file:', result.error);
  console.warn('Warning: .env file could not be loaded. API key may not be available.');
} else {
  console.log('Successfully loaded .env file');
  console.log(`OPENROUTER_API_KEY found: ${process.env.OPENROUTER_API_KEY ? 'Yes' : 'No'}`);
  if (process.env.OPENROUTER_API_KEY) {
    console.log(`API Key length: ${process.env.OPENROUTER_API_KEY.length}`);
    console.log(`API Key starts with: ${process.env.OPENROUTER_API_KEY.substring(0, 15)}...`);
  }
}

// Set working directory to ensure package.json is found
process.chdir(__dirname);

const { SerialPort } = require("serialport");
const fetch = require('node-fetch');

// Handle AI analysis requests
ipcMain.handle("fetch-ai-analysis", async (_event, dataSummary) => {
  try {
    // Get API key from environment variables
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    console.log("=== AI Analysis Request Debug ===");
    console.log("Environment variables check:");
    console.log("- API Key exists:", !!apiKey);
    
    if (!apiKey) {
      console.error("API key not found. Available env vars:", Object.keys(process.env).filter(key => key.includes('API') || key.includes('OPENROUTER')));
      throw new Error("OpenRouter API key not found in environment variables. Please check your .env file.");
    }
    
    console.log("API Key details:");
    console.log("- Length:", apiKey.length);
    console.log("- Starts with:", apiKey.substring(0, 20) + "...");
    console.log("- Format check:", apiKey.startsWith('sk-or-v1-') ? 'Valid format' : 'Invalid format');
    
    // Required headers for OpenRouter API
    const headers = {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://battery-system-app.local", // Required by OpenRouter
      "X-Title": "Battery System Analysis" // Optional but recommended
    };
    
    // Simple test request first
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
      
      // Check if it's an authentication error
      if (testResponse.status === 401) {
        throw new Error(`OpenRouter API Key Authentication Failed (401): The API key in your .env file appears to be invalid or expired. Please:

1. Check your OpenRouter account at https://openrouter.ai/
2. Verify your API key is active and has sufficient credits
3. Generate a new API key if needed
4. Update the OPENROUTER_API_KEY in your .env file

Current API key format: ${apiKey.startsWith('sk-or-v1-') ? 'Valid' : 'Invalid'} (${apiKey.length} characters)`);
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
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error("No content received from AI API");
    }

    console.log("AI Response content:", content);

    // Try to parse the JSON response
    try {
      const parsedResponse = JSON.parse(content);
      return {
        summary: parsedResponse.summary || "No summary provided",
        recommendations: Array.isArray(parsedResponse.recommendations)
          ? parsedResponse.recommendations
          : ["No specific recommendations provided"],
        error: null
      };
    } catch (parseError) {
      console.log("Failed to parse JSON response, using raw content");
      // If JSON parsing fails, return the raw content as summary
      return {
        summary: content,
        recommendations: ["Please review the analysis above for detailed recommendations"],
        error: null
      };
    }

  } catch (error) {
    console.error("Error fetching AI analysis:", error);
    
    // Provide a fallback analysis based on the data
    const fallbackAnalysis = generateFallbackAnalysis(dataSummary);
    
    return {
      summary: fallbackAnalysis.summary,
      recommendations: fallbackAnalysis.recommendations,
      error: `AI Analysis unavailable: ${error instanceof Error ? error.message : "Failed to fetch AI analysis"}`
    };
  }
});

// Fallback analysis function when AI API is not available
function generateFallbackAnalysis(dataSummary: any) {
  const summary = [];
  const recommendations = [];
  
  // Analyze CSU1 cells
  if (dataSummary.csu1Cells) {
    const csu1Critical = dataSummary.csu1Cells.filter((cell: any) => cell.status === 'critical').length;
    const csu1Warning = dataSummary.csu1Cells.filter((cell: any) => cell.status === 'warning').length;
    const csu1Normal = dataSummary.csu1Cells.filter((cell: any) => cell.status === 'normal').length;
    const csu1NoData = dataSummary.csu1Cells.filter((cell: any) => cell.status === 'no-data').length;
    
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
  
  // Analyze CSU2 cells
  if (dataSummary.csu2Cells) {
    const csu2Critical = dataSummary.csu2Cells.filter((cell: any) => cell.status === 'critical').length;
    const csu2Warning = dataSummary.csu2Cells.filter((cell: any) => cell.status === 'warning').length;
    const csu2Normal = dataSummary.csu2Cells.filter((cell: any) => cell.status === 'normal').length;
    const csu2NoData = dataSummary.csu2Cells.filter((cell: any) => cell.status === 'no-data').length;
    
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
  
  // Analyze daisy chain issues
  if (dataSummary.daisyChainIssues && dataSummary.daisyChainIssues.length > 0) {
    summary.push(`Daisy Chain: ${dataSummary.daisyChainIssues.length} issues detected`);
    recommendations.push(`Check daisy chain connections - ${dataSummary.daisyChainIssues.length} issues found`);
  }
  
  // Analyze voltage comparisons
  if (dataSummary.voltageComparisons && dataSummary.voltageComparisons.length > 0) {
    const mismatches = dataSummary.voltageComparisons.filter((comp: any) => comp.status === 'Mismatch').length;
    if (mismatches > 0) {
      summary.push(`Voltage: ${mismatches} mismatches found`);
      recommendations.push(`${mismatches} voltage mismatch(es) detected - verify set values`);
    }
  }
  
  // Default summary if no specific issues
  if (summary.length === 0) {
    summary.push("System status analysis completed - limited data available");
    recommendations.push("Ensure all battery cells are properly connected and monitored");
  }
  
  return {
    summary: `Battery System Analysis (Fallback Mode): ${summary.join('. ')}`,
    recommendations: recommendations.length > 0 ? recommendations : ["System appears stable - continue monitoring"]
  };
}



// Handle serial port listing
ipcMain.handle("list-ports", async () => {
  try {
    const ports = await SerialPort.list();
    console.log(
      "Ports found:",
      ports.map((port: { path: string }) => port.path)
    );
    return ports.map((port: { path: string }) => port.path);
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});

// CRC-16 calculation function (same as in SerialTerminal.tsx)
const calculateCRC16 = (data: number[]): number => {
  let crc = 0xffff;
  const polynomial = 0xa001;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const lsb = crc & 0x0001;
      crc >>= 1;
      if (lsb) crc ^= polynomial;
    }
  }
  return crc;
};

// Handle opening a serial port
let serialPort: typeof SerialPort.prototype | null = null;
ipcMain.handle(
  "open-port",
  async (_event, portPath: string, baudRate: number = 9600) => {
    return new Promise((resolve, reject) => {
      if (serialPort && serialPort.isOpen) {
        return resolve({
          success: false,
          error: "Another port is already open",
        });
      }

      serialPort = new SerialPort({
        path: portPath,
        baudRate: baudRate,
        autoOpen: false,
      });

      // Buffer to store incoming bytes
      let byteBuffer: number[] = [];

      serialPort.open((err: Error | null) => {
        if (err) {
          console.error("Error opening port:", err);
          serialPort = null;
          return reject({ success: false, error: err.message });
        }

        console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
        resolve({ success: true });

        serialPort.on("data", (data: Buffer) => {
          // Convert buffer to array of bytes
          const bytes = Array.from(data);
          byteBuffer = [...byteBuffer, ...bytes];

          // Process complete 8-byte frames
          while (byteBuffer.length >= 8) {
            const frame = byteBuffer.slice(0, 8); // Extract first 8 bytes
            byteBuffer = byteBuffer.slice(8); // Remove processed bytes from buffer

            // Validate frame start (0x07)
            if (frame[0] !== 0x07) {
              console.warn("Invalid frame start:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `Invalid frame start: ${frame}`);
              }
              continue;
            }

            // Verify CRC
            const receivedCRC = (frame[7] << 8) | frame[6];
            const calculatedCRC = calculateCRC16(frame.slice(0, 6));
            if (receivedCRC !== calculatedCRC) {
              console.warn("CRC mismatch:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `CRC mismatch: ${frame}`);
              }
              continue;
            }

            // Convert frame to hex string
            const hexString = frame
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ")
              .toUpperCase();
            // Convert frame to decimal string
            const decimalString = frame
              .map((b) => b.toString(10).padStart(3, "0"))
              .join(" ");

            console.log("Serial HEX data received:", hexString);
            console.log("Serial DECIMAL data received:", decimalString);

            // Parse voltage for get_voltage_limits (byte 0 = 0x07, byte 2 = 0xA6 or 0xA7)
            let voltageVolts: string | undefined = undefined;
            if (frame.length >= 8 && frame[0] === 0x07 && (frame[2] === 0xA6 || frame[2] === 0xA7)) {
              const voltageLimit = ((frame[2] << 8) | frame[3]) / 10000; // Use bytes 4 and 5 for voltage
              voltageVolts = voltageLimit.toFixed(3); // Convert to volts
              console.log(`Voltage: ${voltageVolts} V`);
            }

            let tempCelsius: string | undefined = undefined;
            if (frame.length >= 8 && frame[0] === 0x07 && frame[2] === 0xA5) {
              const tempRaw = (frame[4] << 8) | frame[5];
              const tempC = tempRaw / 100; // Use bytes 4 and 5 for temperature
              tempCelsius = tempC.toFixed(1); // Convert to degrees Celsius
              console.log(`Temperature: ${tempCelsius} °C`);
            }

            if (win && !win.isDestroyed()) {
              win.webContents.send("serial-data", {
                hex: hexString,
                parsed: voltageVolts,
              });
            }
          }
        });

        serialPort.on("error", (err: Error) => {
          console.error("Serial port error:", err);
          if (win && !win.isDestroyed()) {
            win.webContents.send("serial-error", err.message);
          }
        });

        serialPort.on("close", () => {
          console.log("Serial port closed");
          serialPort = null;
          byteBuffer = []; // Clear buffer on close
          if (win && !win.isDestroyed()) {
            win.webContents.send("serial-closed");
          }
        });
      });
    });
  }
);

// Handle writing raw bytes to the serial port (from Uint8Array)
ipcMain.handle("write-port-raw", async (_event, data: Uint8Array) => {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) {
      return resolve({ success: false, error: "No port is open" });
    }

    const buffer = Buffer.from(data);

    serialPort.write(buffer, (err: Error | null) => {
      if (err) {
        console.error("Error writing raw data to port:", err);
        return reject({ success: false, error: err.message });
      }

      console.log("Raw data written to port:", buffer);
      resolve({ success: true });
    });
  });
});

// Handle closing the serial port
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

// Vite/Electron build paths
process.env.APP_ROOT = path.join(__dirname, "..");
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

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
      preload: path.join(__dirname, "preload.mjs"),
    },
  });
  win.webContents.openDevTools();



  win.webContents.on("did-finish-load", () => {
    if (win && !win.isDestroyed()) {
      win.webContents.send("main-process-message", new Date().toLocaleString());
    }
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
    win.setTitle("Electron Vite App");
  }

  ipcMain.on("minimize-window", () => {
    win?.minimize();
  });

  ipcMain.on("close-window", () => {
    win?.close();
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
      ports.map((port: { path: string }) => port.path)
    );
  } catch (error) {
    console.error("Error listing ports at startup:", error);
  }
});