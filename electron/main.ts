import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set working directory to ensure package.json is found (commented out to avoid ASAR issues)
// process.chdir(__dirname);

// Use createRequire for CommonJS modules
const require = createRequire(import.meta.url);

const { SerialPort } = require("serialport");

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

// CRC-16 calculation function
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
          const bytes = Array.from(data);
          byteBuffer = [...byteBuffer, ...bytes];

          while (byteBuffer.length >= 8) {
            const frame = byteBuffer.slice(0, 8);
            byteBuffer = byteBuffer.slice(8);

            if (frame[0] !== 0x07) {
              console.warn("Invalid frame start:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `Invalid frame start: ${frame}`);
              }
              continue;
            }

            const receivedCRC = (frame[7] << 8) | frame[6];
            const calculatedCRC = calculateCRC16(frame.slice(0, 6));
            if (receivedCRC !== calculatedCRC) {
              console.warn("CRC mismatch:", frame);
              if (win && !win.isDestroyed()) {
                win.webContents.send("serial-error", `CRC mismatch: ${frame}`);
              }
              continue;
            }

            const hexString = frame
              .map((b) => b.toString(16).padStart(2, "0"))
              .join(" ")
              .toUpperCase();
            const decimalString = frame
              .map((b) => b.toString(10).padStart(3, "0"))
              .join(" ");

            console.log("Serial HEX data received:", hexString);
            console.log("Serial DECIMAL data received:", decimalString);

            let voltageVolts: string | undefined = undefined;
            if (frame[0] === 0x07 && (frame[2] === 0xA6 || frame[2] === 0xA7)) {
              const voltageLimit = ((frame[4] << 8) | frame[5]) / 10000;
              voltageVolts = voltageLimit.toFixed(3);
              console.log(`Voltage: ${voltageVolts} V`);
            }

            let tempCelsius: string | undefined = undefined;
            if (frame[0] === 0x07 && frame[2] === 0xA5) {
              const tempRaw = (frame[4] << 8) | frame[5];
              const tempC = tempRaw / 100;
              tempCelsius = tempC.toFixed(1);
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
          byteBuffer = [];
          if (win && !win.isDestroyed()) {
            win.webContents.send("serial-closed");
          }
        });
      });
    });
  }
);

// Handle writing raw bytes to the serial port
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
process.env.APP_ROOT = __dirname; // Root is the directory of main.js
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(__dirname, "../dist"); // Simplified to relative path within app.asar
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
    const filePath = path.join(RENDERER_DIST, "index.html");
    console.log("Loading file:", filePath); // Debug log
    win.loadFile(filePath);
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











// //update for database
// import { app, BrowserWindow, ipcMain } from "electron";
// import { createRequire } from "node:module";
// import { fileURLToPath } from "node:url";
// import path from "node:path";
// import Database from "better-sqlite3";
// import { dirname } from "node:path";

// // ESM __dirname only
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename)
// const dbPath = path.join(__dirname, "cell_data.db");

// // Use createRequire for CommonJS modules
// const require = createRequire(import.meta.url);
// const { SerialPort } = require("serialport");

// // --- SQLite Setup ---
// const db = new Database(dbPath);
// db.prepare(`
//   CREATE TABLE IF NOT EXISTS cell_data (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     cell_id INTEGER,
//     voltage REAL,
//     temperature REAL,
//     set_voltage REAL,
//     set_temperature REAL,
//     balancing INTEGER,
//     open_wire INTEGER,
//     delay INTEGER,
//     cell_led INTEGER,
//     automatic_sequence INTEGER,
//     voltage_limits TEXT,
//     csu11_voltage REAL,
//     csu11_temperature REAL,
//     csu11_balance INTEGER,
//     csu11_open_wire INTEGER,
//     csu12_voltage REAL,
//     csu12_temperature REAL,
//     csu12_balance INTEGER,
//     csu12_open_wire INTEGER,
//     dc_csu_voltage REAL,
//     dc_csu_temperature REAL,
//     dc_csu_balance INTEGER,
//     dc_csu_open_wire INTEGER,
//     daisy_chain TEXT,
//     saved_at DATETIME DEFAULT CURRENT_TIMESTAMP
//   )
// `).run();

// // --- Serial Port Logic ---
// let serialPort: typeof SerialPort.prototype | null = null;
// let win: BrowserWindow | null = null;

// ipcMain.handle("list-ports", async () => {
//   try {
//     const ports = await SerialPort.list();
//     return ports.map((port: { path: string }) => port.path);
//   } catch (error) {
//     console.error("Error listing ports:", error);
//     return [];
//   }
// });

// const calculateCRC16 = (data: number[]): number => {
//   let crc = 0xffff;
//   const polynomial = 0xa001;
//   for (const byte of data) {
//     crc ^= byte;
//     for (let i = 0; i < 8; i++) {
//       const lsb = crc & 0x0001;
//       crc >>= 1;
//       if (lsb) crc ^= polynomial;
//     }
//   }
//   return crc;
// };

// ipcMain.handle(
//   "open-port",
//   async (_event, portPath: string, baudRate: number = 9600) => {
//     try {
//       return await new Promise((resolve, reject) => {
//         if (serialPort && serialPort.isOpen) {
//           return resolve({
//             success: false,
//             error: "Another port is already open",
//           });
//         }

//         serialPort = new SerialPort({
//           path: portPath,
//           baudRate: baudRate,
//           autoOpen: false,
//         });

//         let byteBuffer: number[] = [];

//         serialPort.open((err: Error | null) => {
//           if (err) {
//             console.error("Error opening port:", err);
//             serialPort = null;
//             return reject({ success: false, error: err.message });
//           }

//           resolve({ success: true });

//           serialPort.on("data", (data: Buffer) => {
//             const bytes = Array.from(data);
//             byteBuffer = [...byteBuffer, ...bytes];

//             while (byteBuffer.length >= 8) {
//               const frame = byteBuffer.slice(0, 8);
//               byteBuffer = byteBuffer.slice(8);

//               if (frame[0] !== 0x07) continue;

//               const receivedCRC = (frame[7] << 8) | frame[6];
//               const calculatedCRC = calculateCRC16(frame.slice(0, 6));
//               if (receivedCRC !== calculatedCRC) continue;

//               // --- Parse cell number and data ---
//               const cellId = frame[3]; // Adjust index if your protocol is different

//               let voltage: number | undefined = undefined;
//               let temperature: number | undefined = undefined;

//               // Example: If frame[2] is voltage command
//               if (frame[2] === 0xA6 || frame[2] === 0xA7) {
//                 voltage = ((frame[4] << 8) | frame[5]) / 10000;
//               }
//               // Example: If frame[2] is temperature command
//               if (frame[2] === 0xA5) {
//                 temperature = ((frame[4] << 8) | frame[5]) / 100;
//               }

//               // --- Send to renderer for this cell ---
//               if (win && !win.isDestroyed()) {
//                 win.webContents.send("cell-data", {
//                   cellId,
//                   voltage,
//                   temperature,
//                   raw: frame,
//                   timestamp: new Date().toISOString(),
//                 });
//               }
//             }
//           });

//           serialPort.on("error", (err: Error) => {
//             console.error("Serial port error:", err);
//           });

//           serialPort.on("close", () => {
//             serialPort = null;
//             byteBuffer = [];
//           });
//         });
//       });
//     } catch (err) {
//       console.error("Error in open-port:", err);
//       return { success: false, error: err instanceof Error ? err.message : String(err) };
//     }
//   }
// );

// ipcMain.handle("write-port-raw", async (_event, data: Uint8Array) => {
//   try {
//     return await new Promise((resolve, reject) => {
//       if (!serialPort || !serialPort.isOpen) {
//         return resolve({ success: false, error: "No port is open" });
//       }
//       const buffer = Buffer.from(data);
//       serialPort.write(buffer, (err: Error | null) => {
//         if (err) {
//           console.error("Error writing raw data to port:", err);
//           return reject({ success: false, error: err.message });
//         }
//         resolve({ success: true });
//       });
//     });
//   } catch (err) {
//     console.error("Error in write-port-raw:", err);
//     return { success: false, error: err instanceof Error ? err.message : String(err) };
//   }
// });

// ipcMain.handle("close-port", async () => {
//   try {
//     if (serialPort && serialPort.isOpen) {
//       await serialPort.close();
//       serialPort = null;
//     }
//     return { success: true };
//   } catch (error) {
//     console.error("Error closing port:", error);
//     return { success: false, error: error instanceof Error ? error.message : String(error) };
//   }
// });

// // --- Save Cell Data IPC ---
// ipcMain.handle("save-cell-data", async (_event, cellDataArray) => {
//   try {
//     const stmt = db.prepare(`
//       INSERT INTO cell_data (
//         cell_id, voltage, temperature, set_voltage, set_temperature,
//         balancing, open_wire, delay, cell_led, automatic_sequence, voltage_limits,
//         csu11_voltage, csu11_temperature, csu11_balance, csu11_open_wire,
//         csu12_voltage, csu12_temperature, csu12_balance, csu12_open_wire,
//         dc_csu_voltage, dc_csu_temperature, dc_csu_balance, dc_csu_open_wire,
//         daisy_chain
//       ) VALUES (
//         @id, @voltage, @temperature, @setVoltage, @setTemperature,
//         @balancing, @openWire, @delay, @cellLed, @automaticSequence, @voltageLimits,
//         @csu11Voltage, @csu11Temperature, @csu11Balance, @csu11OpenWire,
//         @csu12Voltage, @csu12Temperature, @csu12Balance, @csu12OpenWire,
//         @dcCsuVoltage, @dcCsuTemperature, @dcCsuBalance, @dcCsuOpenWire,
//         @daisyChain
//       )
//     `);
//     const insertMany = db.transaction((cells) => {
//       for (const cell of cells) stmt.run(cell);
//     });
//     insertMany(cellDataArray);
//     return { success: true };
//   } catch (err) {
//     console.error("Failed to save cell data:", err);
//     return { success: false, error: err instanceof Error ? err.message : String(err) };
//   }
// });

// // --- Electron Window Setup ---
// process.env.APP_ROOT = __dirname;
// export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
// export const RENDERER_DIST = path.join(__dirname, "../dist");
// process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
//   ? path.join(process.env.APP_ROOT, "public")
//   : RENDERER_DIST;

// function createWindow() {
//   win = new BrowserWindow({
//     width: 1920,
//     height: 1080,
//     resizable: false,
//     center: true,
//     frame: false,
//     autoHideMenuBar: true,
//     icon: path.join(__dirname, "public/icon.ico"),
//     webPreferences: {
//       preload: path.join(__dirname, "preload.js"), // or .ts/.mjs as appropriate
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
//     const filePath = path.join(RENDERER_DIST, "index.html");
//     win.loadFile(filePath);
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