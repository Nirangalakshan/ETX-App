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









import { app, BrowserWindow, ipcMain } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Set working directory to ensure package.json is found
process.chdir(__dirname);

// Use createRequire for CommonJS modules
const require = createRequire(import.meta.url);
const sqlite3 = require("sqlite3").verbose();
const { SerialPort } = require("serialport");

const db = new sqlite3.Database("users.db");

// Create users table and insert a test user
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
)`);

db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, [
  "vega",
  "vega123",
]);

// Handle login requests
ipcMain.handle("login", async (_event, username: string, password: string) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE username = ? AND password = ?`,
      [username, password],
      (err: Error | null, row: any) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve({ success: true });
        } else {
          resolve({ success: false, error: "Invalid credentials" });
        }
      }
    );
  });
});

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