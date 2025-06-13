import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
process.chdir(__dirname);
const require2 = createRequire(import.meta.url);
const sqlite3 = require2("sqlite3").verbose();
const { SerialPort } = require2("serialport");
const db = new sqlite3.Database("users.db");
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL
)`);
db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, [
  "vega",
  "vega123"
]);
ipcMain.handle("login", async (_event, username, password) => {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT * FROM users WHERE username = ? AND password = ?`,
      [username, password],
      (err, row) => {
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
ipcMain.handle("list-ports", async () => {
  try {
    const ports = await SerialPort.list();
    console.log("Ports found:", ports.map((port) => port.path));
    return ports.map((port) => port.path);
  } catch (error) {
    console.error("Error listing ports:", error);
    return [];
  }
});
let serialPort = null;
ipcMain.handle("open-port", async (_event, portPath, baudRate = 9600) => {
  return new Promise((resolve, reject) => {
    if (serialPort && serialPort.isOpen) {
      return resolve({ success: false, error: "Another port is already open" });
    }
    serialPort = new SerialPort({
      path: portPath,
      baudRate,
      autoOpen: false
    });
    serialPort.open((err) => {
      if (err) {
        console.error("Error opening port:", err);
        serialPort = null;
        return reject({ success: false, error: err.message });
      }
      console.log(`Serial port ${portPath} opened at baud rate ${baudRate}`);
      resolve({ success: true });
      serialPort.on("data", (data) => {
        const dataString = data.toString();
        console.log("Serial data received:", dataString);
        if (win && !win.isDestroyed()) {
          win.webContents.send("serial-data", dataString);
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
        if (win && !win.isDestroyed()) {
          win.webContents.send("serial-closed");
        }
      });
    });
  });
});
ipcMain.handle("write-port", async (_event, data) => {
  return new Promise((resolve, reject) => {
    if (!serialPort || !serialPort.isOpen) {
      return resolve({ success: false, error: "No port is open" });
    }
    serialPort.write(data, (err) => {
      if (err) {
        console.error("Error writing to port:", err);
        return reject({ success: false, error: err.message });
      }
      console.log("Data written to port:", data);
      resolve({ success: true });
    });
  });
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
    height: 1024,
    resizable: false,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "public/icon.ico"),
    // icon: path.join(process.env.VITE_PUBLIC, "icon.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs")
    }
  });
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
    console.log("Startup ports:", ports.map((port) => port.path));
  } catch (error) {
    console.error("Error listing ports at startup:", error);
  }
});
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
