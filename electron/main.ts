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
    width: 2560,
    height: 1440,
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


// const __dirname = path.dirname(fileURLToPath(import.meta.url));

// // Use createRequire for CommonJS modules
// const require = createRequire(import.meta.url);
// const { SerialPort } = require("serialport");
// const {sqlite3} = require("sqlite3").verbose();

// let db = new sqlite3.Database('cell_voltage_data.db');

// // SQLite Database Setup


// const initDatabase = (): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     const dbPath = path.join(app.getPath('userData'), 'cell_voltage_data.db');
    
//     db = new sqlite3.Database(dbPath, (err: Error | null) => {
//       if (err) {
//         console.error('Error opening database:', err);
//         reject(err);
//         return;
//       }
      
//       console.log('Connected to SQLite database at:', dbPath);
      
//       // Create tables if they don't exist
//       db.serialize(() => {
//         // Main cell data table
//         db.run(`CREATE TABLE IF NOT EXISTS cell_data (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           cell_id INTEGER NOT NULL,
//           unit_type TEXT NOT NULL, -- 'CSU1', 'CSU2', 'DAISY_CHAIN'
//           actual_voltage REAL,
//           expected_voltage REAL,
//           voltage_difference REAL, -- calculated as actual - expected
//           raw_frame TEXT, -- store the raw frame data as hex string
//           timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//         )`);

//         // CSU1 specific data
//         db.run(`CREATE TABLE IF NOT EXISTS csu1_data (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           cell_id INTEGER NOT NULL,
//           actual_voltage REAL,
//           expected_voltage REAL,
//           voltage_difference REAL,
//           raw_frame TEXT,
//           timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//         )`);

//         // CSU2 specific data
//         db.run(`CREATE TABLE IF NOT EXISTS csu2_data (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           cell_id INTEGER NOT NULL,
//           actual_voltage REAL,
//           expected_voltage REAL,
//           voltage_difference REAL,
//           raw_frame TEXT,
//           timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//         )`);

//         // Daisy chain specific data
//         db.run(`CREATE TABLE IF NOT EXISTS daisy_chain_data (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           cell_id INTEGER NOT NULL,
//           actual_voltage REAL,
//           expected_voltage REAL,
//           voltage_difference REAL,
//           raw_frame TEXT,
//           timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
//         )`);

//         // Summary/session table for tracking overall data
//         db.run(`CREATE TABLE IF NOT EXISTS data_sessions (
//           id INTEGER PRIMARY KEY AUTOINCREMENT,
//           session_name TEXT,
//           start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
//           end_time DATETIME,
//           total_cells_recorded INTEGER DEFAULT 0,
//           notes TEXT
//         )`);
//       });
      
//       resolve();
//     });
//   });
// };

// // Database operation functions
// const saveCellData = (cellData: {
//   cellId: number;
//   unitType: string;
//   actualVoltage?: number;
//   expectedVoltage?: number;
//   rawFrame: string;
// }): Promise<void> => {
//   return new Promise((resolve, reject) => {
//     if (!db) {
//       reject(new Error('Database not initialized'));
//       return;
//     }

//     const voltageDiff = (cellData.actualVoltage && cellData.expectedVoltage) 
//       ? cellData.actualVoltage - cellData.expectedVoltage 
//       : null;

//     // Save to main cell_data table
//     db.run(
//       `INSERT INTO cell_data (cell_id, unit_type, actual_voltage, expected_voltage, voltage_difference, raw_frame) 
//        VALUES (?, ?, ?, ?, ?, ?)`,
//       [cellData.cellId, cellData.unitType, cellData.actualVoltage, cellData.expectedVoltage, voltageDiff, cellData.rawFrame],
//       function(err: Error | null) {
//         if (err) {
//           console.error('Error saving to cell_data:', err);
//           reject(err);
//           return;
//         }

//         // Also save to specific unit table
//         let tableName = '';
//         switch (cellData.unitType.toUpperCase()) {
//           case 'CSU1':
//             tableName = 'csu1_data';
//             break;
//           case 'CSU2':
//             tableName = 'csu2_data';
//             break;
//           case 'DAISY_CHAIN':
//             tableName = 'daisy_chain_data';
//             break;
//           default:
//             console.warn('Unknown unit type:', cellData.unitType);
//             resolve();
//             return;
//         }

//         db.run(
//           `INSERT INTO ${tableName} (cell_id, actual_voltage, expected_voltage, voltage_difference, raw_frame) 
//            VALUES (?, ?, ?, ?, ?)`,
//           [cellData.cellId, cellData.actualVoltage, cellData.expectedVoltage, voltageDiff, cellData.rawFrame],
//           function(err: Error | null) {
//             if (err) {
//               console.error(`Error saving to ${tableName}:`, err);
//               reject(err);
//               return;
//             }
//             console.log(`Saved cell ${cellData.cellId} data to ${tableName}`);
//             resolve();
//           }
//         );
//       }
//     );
//   });
// };

// // IPC handlers for database operations
// ipcMain.handle('db:save-cell-data', async (_event, cellData) => {
//   try {
//     await saveCellData(cellData);
//     return { success: true };
//   } catch (error) {
//     console.error('Failed to save cell data:', error);
//     return { success: false, error: error instanceof Error ? error.message : String(error) };
//   }
// });

// ipcMain.handle('db:get-cell-data', async (_event, filters?: {
//   unitType?: string;
//   cellId?: number;
//   startDate?: string;
//   endDate?: string;
//   limit?: number;
// }) => {
//   return new Promise((resolve, reject) => {
//     if (!db) {
//       reject(new Error('Database not initialized'));
//       return;
//     }

//     let query = 'SELECT * FROM cell_data WHERE 1=1';
//     const params: any[] = [];

//     if (filters?.unitType) {
//       query += ' AND unit_type = ?';
//       params.push(filters.unitType);
//     }

//     if (filters?.cellId !== undefined) {
//       query += ' AND cell_id = ?';
//       params.push(filters.cellId);
//     }

//     if (filters?.startDate) {
//       query += ' AND timestamp >= ?';
//       params.push(filters.startDate);
//     }

//     if (filters?.endDate) {
//       query += ' AND timestamp <= ?';
//       params.push(filters.endDate);
//     }

//     query += ' ORDER BY timestamp DESC';

//     if (filters?.limit) {
//       query += ' LIMIT ?';
//       params.push(filters.limit);
//     }

//     db.all(query, params, (err: Error | null, rows: any[]) => {
//       if (err) {
//         reject(err);
//         return;
//       }
//       resolve(rows);
//     });
//   });
// });

// ipcMain.handle('db:get-latest-by-unit', async (_event, unitType: string) => {
//   return new Promise((resolve, reject) => {
//     if (!db) {
//       reject(new Error('Database not initialized'));
//       return;
//     }

//     db.all(
//       `SELECT cell_id, actual_voltage, expected_voltage, voltage_difference, timestamp 
//        FROM cell_data 
//        WHERE unit_type = ? 
//        ORDER BY cell_id ASC, timestamp DESC`,
//       [unitType],
//       (err: Error | null, rows: any[]) => {
//         if (err) {
//           reject(err);
//           return;
//         }
        
//         // Get latest reading for each cell
//         const latestByCellId: { [key: number]: any } = {};
//         rows.forEach(row => {
//           if (!latestByCellId[row.cell_id]) {
//             latestByCellId[row.cell_id] = row;
//           }
//         });
        
//         resolve(Object.values(latestByCellId));
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

// // CRC-16 calculation function
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

// // Determine unit type based on frame data or other logic
// const determineUnitType = (frame: number[]): string => {
//   // You'll need to implement this based on your protocol
//   // This is a placeholder - adjust based on your actual frame structure
  
//   // Example logic - you might determine unit type from:
//   // - Specific byte positions in the frame
//   // - Command codes
//   // - Address ranges
  
//   if (frame[1] >= 0x01 && frame[1] <= 0x10) {
//     return 'CSU1';
//   } else if (frame[1] >= 0x11 && frame[1] <= 0x20) {
//     return 'CSU2';
//   } else {
//     return 'DAISY_CHAIN';
//   }
// };

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

//       let byteBuffer: number[] = [];

//       serialPort.open((err: Error | null) => {
//         if (err) {
//           console.error("Error opening port:", err);
//           serialPort = null;
//           return reject({ success: false, error: err.message });
//         }

//         console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
//         resolve({ success: true });

//         serialPort.on("data", async (data: Buffer) => {
//           const bytes = Array.from(data);
//           byteBuffer = [...byteBuffer, ...bytes];

//           while (byteBuffer.length >= 8) {
//             const frame = byteBuffer.slice(0, 8);
//             byteBuffer = byteBuffer.slice(8);

//             if (frame[0] !== 0x07) {
//               console.warn("Invalid frame start:", frame);
//               if (win && !win.isDestroyed()) {
//                 win.webContents.send("serial-error", `Invalid frame start: ${frame}`);
//               }
//               continue;
//             }

//             const receivedCRC = (frame[7] << 8) | frame[6];
//             const calculatedCRC = calculateCRC16(frame.slice(0, 6));
//             if (receivedCRC !== calculatedCRC) {
//               console.warn("CRC mismatch:", frame);
//               if (win && !win.isDestroyed()) {
//                 win.webContents.send("serial-error", `CRC mismatch: ${frame}`);
//               }
//               continue;
//             }

//             const hexString = frame
//               .map((b) => b.toString(16).padStart(2, "0"))
//               .join(" ")
//               .toUpperCase();
//             const decimalString = frame
//               .map((b) => b.toString(10).padStart(3, "0"))
//               .join(" ");

//             console.log("Serial HEX data received:", hexString);
//             console.log("Serial DECIMAL data received:", decimalString);

//             // Parse cell ID and voltage data
//             const cellId = frame[3] || frame[1]; // Adjust based on your protocol
//             const unitType = determineUnitType(frame);
//             let actualVoltage: number | undefined = undefined;
//             let expectedVoltage: number | undefined = undefined; // You might get this from another frame or set it manually

//             // Parse voltage data
//             if (frame[0] === 0x07 && (frame[2] === 0xA6 || frame[2] === 0xA7)) {
//               const voltageLimit = ((frame[4] << 8) | frame[5]) / 10000;
//               actualVoltage = voltageLimit;
//               console.log(`Cell ${cellId} (${unitType}) Voltage: ${actualVoltage} V`);
//             }

//             // Parse temperature if needed
//             let tempCelsius: string | undefined = undefined;
//             if (frame[0] === 0x07 && frame[2] === 0xA5) {
//               const tempRaw = (frame[4] << 8) | frame[5];
//               const tempC = tempRaw / 100;
//               tempCelsius = tempC.toFixed(1);
//               console.log(`Cell ${cellId} (${unitType}) Temperature: ${tempCelsius} °C`);
//             }

//             // Save to database if we have voltage data
//             if (actualVoltage !== undefined) {
//               try {
//                 await saveCellData({
//                   cellId: cellId,
//                   unitType: unitType,
//                   actualVoltage: actualVoltage,
//                   expectedVoltage: expectedVoltage, // You might want to set this based on your requirements
//                   rawFrame: hexString
//                 });
//               } catch (error) {
//                 console.error('Failed to save cell data to database:', error);
//               }
//             }

//             // Send to renderer
//             if (win && !win.isDestroyed()) {
//               win.webContents.send("serial-data", {
//                 hex: hexString,
//                 parsed: actualVoltage,
//                 cellId: cellId,
//                 unitType: unitType,
//                 temperature: tempCelsius
//               });
//             }
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
//           byteBuffer = [];
//           if (win && !win.isDestroyed()) {
//             win.webContents.send("serial-closed");
//           }
//         });
//       });
//     });
//   }
// );

// // Handle writing raw bytes to the serial port
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
// process.env.APP_ROOT = __dirname;
// export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
// export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
// export const RENDERER_DIST = path.join(__dirname, "../dist");
// process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
//   ? path.join(process.env.APP_ROOT, "public")
//   : RENDERER_DIST;

// let win: BrowserWindow | null;

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
//     const filePath = path.join(RENDERER_DIST, "index.html");
//     console.log("Loading file:", filePath);
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
//   // Close database connection
//   if (db) {
//     db.close((err: Error | null) => {
//       if (err) {
//         console.error('Error closing database:', err);
//       } else {
//         console.log('Database connection closed.');
//       }
//     });
//   }

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

// app.on("before-quit", () => {
//   if (db) {
//     db.close();
//   }
// });

// app.whenReady().then(async () => {
//   try {
//     // Initialize database first
//     await initDatabase();
//     console.log('Database initialized successfully');
    
//     // Then create window
//     createWindow();
    
//     // List available ports
//     const ports = await SerialPort.list();
//     console.log(
//       "Startup ports:",
//       ports.map((port: { path: string }) => port.path)
//     );
//   } catch (error) {
//     console.error("Error during startup:", error);
//     app.quit();
//   }
// });