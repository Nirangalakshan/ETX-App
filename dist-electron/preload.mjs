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
  close: () => electron.ipcRenderer.send("close-window")
});
electron.contextBridge.exposeInMainWorld("authAPI", {
  login: (username, password) => electron.ipcRenderer.invoke("login", username, password)
});
electron.contextBridge.exposeInMainWorld("serialAPI", {
  listPorts: () => electron.ipcRenderer.invoke("list-ports"),
  openPort: (port, baudRate) => electron.ipcRenderer.invoke("open-port", port, baudRate),
  closePort: () => electron.ipcRenderer.invoke("close-port"),
  writePort: (data) => electron.ipcRenderer.invoke("write-port", data),
  onSerialData: (callback) => {
    electron.ipcRenderer.on("serial-data", (_event, data) => {
      callback(data);
    });
  }
});
