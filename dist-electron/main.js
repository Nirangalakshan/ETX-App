import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require2 = createRequire(import.meta.url);
const { SerialPort } = require2("serialport");
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
            if (frame[0] === 7 && (frame[2] === 166 || frame[2] === 167)) {
              const voltageLimit = (frame[4] << 8 | frame[5]) / 1e4;
              voltageVolts = voltageLimit.toFixed(3);
              console.log(`Voltage: ${voltageVolts} V`);
            }
            let tempCelsius = void 0;
            if (frame[0] === 7 && frame[2] === 165) {
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
process.env.APP_ROOT = __dirname;
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(__dirname, "../dist");
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
    const filePath = path.join(RENDERER_DIST, "index.html");
    console.log("Loading file:", filePath);
    win.loadFile(filePath);
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
