import { ipcMain, app, BrowserWindow } from "electron";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs/promises";
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
ipcMain.handle("update-cell-states-file", async (_event, data) => {
  try {
    const testRunDir = path.join(app.getPath("desktop"), "BMS TESTER");
    const testId = data.testId || `test_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}`;
    const filename = `cell_states_${testId}.json`;
    const filePath2 = path.join(testRunDir, filename);
    console.log(`Appending to cell states file at: ${filePath2}`);
    await fs.mkdir(testRunDir, { recursive: true });
    let existingData = [];
    try {
      const fileContent = await fs.readFile(filePath2, "utf-8");
      existingData = JSON.parse(fileContent);
      if (!Array.isArray(existingData)) {
        console.warn(`Existing ${filename} is not an array, initializing as empty array`);
        existingData = [];
      }
    } catch (error) {
      console.log(`Creating new ${filename} at:`, filePath2);
    }
    if (!["csu11", "csu12", "dccsu", "individual"].includes(data.type)) {
      console.error(`Invalid type: ${data.type}`);
      return { success: false, error: `Invalid type: ${data.type}. Must be one of 'csu11', 'csu12', 'dccsu', 'individual'` };
    }
    if (typeof data.cycleNo !== "number" || data.cycleNo < 1) {
      console.error(`Invalid cycleNo: ${data.cycleNo}`);
      return { success: false, error: `Invalid cycleNo: ${data.cycleNo}. Must be a positive number` };
    }
    if (typeof data.cellNo !== "number" || data.cellNo < 0 || data.cellNo > 23) {
      console.error(`Invalid cellNo: ${data.cellNo}`);
      return { success: false, error: `Invalid cellNo: ${data.cellNo}. Must be between 0 and 23` };
    }
    if (typeof data.setVoltage !== "number") {
      console.error(`Invalid setVoltage: ${data.setVoltage}`);
      return { success: false, error: `Invalid setVoltage: ${data.setVoltage}. Must be a number` };
    }
    if (typeof data.testerVoltage !== "number") {
      console.error(`Invalid testerVoltage: ${data.testerVoltage}`);
      return { success: false, error: `Invalid testerVoltage: ${data.testerVoltage}. Must be a number` };
    }
    if (typeof data.actualVoltage !== "number") {
      console.error(`Invalid actualVoltage: ${data.actualVoltage}`);
      return { success: false, error: `Invalid actualVoltage: ${data.actualVoltage}. Must be a number` };
    }
    const newEntry = {
      cycleNo: data.cycleNo,
      type: data.type,
      cellNo: data.cellNo,
      setVoltage: data.setVoltage,
      testerVoltage: data.testerVoltage,
      actualVoltage: data.actualVoltage,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      testId
    };
    existingData.push(newEntry);
    await fs.writeFile(filePath2, JSON.stringify(existingData, null, 2));
    console.log(`Appended data to ${filePath2}:`, newEntry);
    return { success: true, path: filePath2, testId };
  } catch (error) {
    console.error(`Error appending to ${filePath}:`, error.message);
    return { success: false, error: `Failed to append to cell states file: ${error.message}` };
  }
});
ipcMain.handle("get-cell-states", async (_event, testId) => {
  try {
    const testRunDir = path.join(app.getPath("desktop"), "BMS TESTER");
    const filename = `cell_states_${testId}.json`;
    const filePath2 = path.join(testRunDir, filename);
    console.log(`Reading cell states file from: ${filePath2}`);
    try {
      const fileContent = await fs.readFile(filePath2, "utf-8");
      const data = JSON.parse(fileContent);
      console.log("Successfully read cell states file:", filePath2);
      return { success: true, data };
    } catch (error) {
      console.log("No cell states file found or invalid JSON:", filePath2);
      return { success: true, data: [] };
    }
  } catch (error) {
    console.error("Error reading cell states file:", error.message);
    return { success: false, error: `Failed to read cell states file: ${error.message}` };
  }
});
ipcMain.handle("reset-cell-states", async (_event, testId) => {
  try {
    const testRunDir = path.join(app.getPath("desktop"), "BMS TESTER");
    const filename = `cell_states_${testId}.json`;
    const filePath2 = path.join(testRunDir, filename);
    console.log(`Resetting cell states file at: ${filePath2}`);
    await fs.mkdir(testRunDir, { recursive: true });
    const initialData = [];
    await fs.writeFile(filePath2, JSON.stringify(initialData, null, 2));
    console.log(`Cell states file reset: ${filePath2}`);
    return { success: true, path: filePath2 };
  } catch (error) {
    console.error("Error resetting cell states file:", error.message);
    return { success: false, error: `Failed to reset cell states file: ${error.message}` };
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
    resizable: true,
    center: true,
    frame: false,
    autoHideMenuBar: true,
    icon: path.join(__dirname, "public/vega.ico"),
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
    const filePath2 = path.join(RENDERER_DIST, "index.html");
    console.log("Loading file:", filePath2);
    win.loadFile(filePath2);
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
