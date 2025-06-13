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
// const { SerialPort } = require("serialport"); // Correct import

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
//     const ports = await SerialPort.list(); // Use SerialPort.list
//     return ports.map((port: { path: string }) => port.path);
//   } catch (error) {
//     console.error("Error listing ports:", error);
//     return [];
//   }
// });

// //handle opening a serial port
// let serialPort: typeof SerialPort.prototype | null = null; // Store the SerialPort instance
// ipcMain.handle("open-port", async (_event, portPath: string, baudRate: number = 9600) => {
//   return new Promise((resolve, reject) => {
//     if (serialPort && serialPort.isOpen) {
//       return resolve({ success: false, error: "Another port is already open" });
//     }

//     serialPort = new SerialPort({
//       path: portPath,
//       baudRate: baudRate,
//       autoOpen: false, // Prevent automatic opening
//     });

//     serialPort.open((err: Error | null) => {
//       if (err) {
//         console.error("Error opening port:", err);
//         serialPort = null; // Reset on failure
//         return reject({ success: false, error: err.message });
//       }

//       // Port opened successfully
//       console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
//       resolve({ success: true });

//       // Optional: Handle incoming data (you can expose this via another IPC channel if needed)
//       serialPort.on("data", (data: Buffer) => {
//         console.log("Data received:", data.toString());
//         // Optionally send data to renderer
//         win?.webContents.send("serial-data", data.toString());
//       });

//       serialPort.on("error", (err: Error) => {
//         console.error("Serial port error:", err);
//         win?.webContents.send("serial-error", err.message);
//       });

//       serialPort.on("close", () => {
//         console.log("Serial port closed");
//         serialPort = null; // Reset when port is closed
//         win?.webContents.send("serial-closed");
//       });
//     });
//   });
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
//     width: 1440,
//     height: 1024,
//     resizable: false,
//     frame: false, // Custom title bar
//     autoHideMenuBar: true,
//     icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
//     webPreferences: {
//       preload: path.join(__dirname, "preload.mjs"),
//     },
//   });

//   win.webContents.on("did-finish-load", () => {
//     win?.webContents.send("main-process-message", new Date().toLocaleString());
//   });

//   if (VITE_DEV_SERVER_URL) {
//     win.loadURL(VITE_DEV_SERVER_URL);
//   } else {
//     win.loadFile(path.join(RENDERER_DIST, "index.html"));
//     win.setTitle("Electron Vite App");
//   }

//   // Handle minimize and close requests
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

// app.whenReady().then(createWindow);



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
    console.log("Ports found:", ports.map((port: { path: string }) => port.path));
    return ports.map((port: { path: string }) => port.path);
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});

// Handle opening a serial port
let serialPort: typeof SerialPort.prototype | null = null;
ipcMain.handle("open-port", async (_event, portPath: string, baudRate: number = 9600) => {
  return new Promise((resolve, reject) => {
    if (serialPort && serialPort.isOpen) {
      return resolve({ success: false, error: "Another port is already open" });
    }

    serialPort = new SerialPort({
      path: portPath,
      baudRate: baudRate,
      autoOpen: false,
    });

    serialPort.open((err: Error | null) => {
      if (err) {
        console.error("Error opening port:", err);
        serialPort = null;
        return reject({ success: false, error: err.message });
      }

      console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
      resolve({ success: true });

      // Handle incoming data
      serialPort.on("data", (data: Buffer) => {
        const dataString = data.toString();
        console.log("Serial data received:", dataString);
        if (win && !win.isDestroyed()) {
          win.webContents.send("serial-data", dataString);
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
        if (win && !win.isDestroyed()) {
          win.webContents.send("serial-closed");
        }
      });
    });
  });
});

// Handle writing to the serial port
ipcMain.handle("write-port", async (_event, data: string) => {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) {
      return resolve({ success: false, error: "No port is open" });
    }
    serialPort.write(data, (err: Error | null) => {
      if (err) {
        console.error("Error writing to port:", err);
        return reject({ success: false, error: err.message });
      }
      console.log("Data written to port:", data);
      resolve({ success: true });
    });
  });
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
    height: 1024,
    resizable: false,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "public/icon.ico"),
    // icon: path.join(process.env.VITE_PUBLIC, "icon.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

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
    console.log("Startup ports:", ports.map((port: { path: string }) => port.path));
  } catch (error) {
    console.error("Error listing ports at startup:", error);
  }
});