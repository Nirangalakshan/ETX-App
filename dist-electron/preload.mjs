"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
});
electron.contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => electron.ipcRenderer.send("minimize-window"),
  close: () => electron.ipcRenderer.send("close-window"),
  fetchAIAnalysis: (dataSummary) => electron.ipcRenderer.invoke("fetch-ai-analysis", dataSummary)
});
electron.contextBridge.exposeInMainWorld("authAPI", {
  login: (username, password) => electron.ipcRenderer.invoke("login", username, password)
});
electron.contextBridge.exposeInMainWorld("config", {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
});
electron.contextBridge.exposeInMainWorld("serialAPI", {
  writePortRaw: (data) => electron.ipcRenderer.invoke("write-port-raw", data),
  listPorts: () => electron.ipcRenderer.invoke("list-ports"),
  openPort: (port, baudRate) => electron.ipcRenderer.invoke("open-port", port, baudRate),
  closePort: () => electron.ipcRenderer.invoke("close-port"),
  writePort: (data) => electron.ipcRenderer.invoke("write-port", data),
  onSerialData: (callback) => {
    electron.ipcRenderer.on("serial-data", (_event, data) => {
      console.log("[Preload DEBUG] Forwarding serial-data:", data);
      callback(data);
    });
  },
  removeSerialDataListener: () => {
    electron.ipcRenderer.removeAllListeners("serial-data");
  },
  onSerialVoltage: (callback) => {
    electron.ipcRenderer.on("serial-voltage", (_event, data) => {
      console.log("[Preload DEBUG] Forwarding serial-voltage:", data);
      callback(data);
    });
  }
});
