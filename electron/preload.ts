// import { ipcRenderer, contextBridge } from 'electron';

// contextBridge.exposeInMainWorld('ipcRenderer', {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args;
//     return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.off(channel, ...omit);
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.send(channel, ...omit);
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args;
//     return ipcRenderer.invoke(channel, ...omit);
//   },
// });

// contextBridge.exposeInMainWorld('electronAPI', {
//   minimize: () => ipcRenderer.send('minimize-window'),
//   close: () => ipcRenderer.send('close-window'),
//   fetchAIAnalysis: (dataSummary: any) => ipcRenderer.invoke('fetch-ai-analysis', dataSummary),
// });

// contextBridge.exposeInMainWorld('authAPI', {
//   login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
// });

// contextBridge.exposeInMainWorld('config', {
//   OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
// });

// contextBridge.exposeInMainWorld('serialAPI', {
//   writePortRaw: (data: Uint8Array) => ipcRenderer.invoke("write-port-raw", data),
//   listPorts: () => ipcRenderer.invoke("list-ports"),
//   openPort: (port: string, baudRate: number) => ipcRenderer.invoke("open-port", port, baudRate),
//   closePort: () => ipcRenderer.invoke("close-port"),
//   writePort: (data: string) => ipcRenderer.invoke("write-port", data),
//   onSerialData: (callback: (data: string) => void) => {
//     ipcRenderer.on('serial-data', (_event, data) => {
//       console.log("[Preload DEBUG] Forwarding serial-data:", data);
//       callback(data);
//     });
//   },
//        removeSerialDataListener: () => {
//     ipcRenderer.removeAllListeners("serial-data");
//   },
//   onSerialVoltage: (callback: (data: { cellNo: number; voltage: string }) => void) => {
//     ipcRenderer.on('serial-voltage', (_event, data) => {
//       console.log("[Preload DEBUG] Forwarding serial-voltage:", data);
//       callback(data);
//     });
//   },

// });






import { ipcRenderer, contextBridge } from 'electron';

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args));
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },
});

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
  fetchAIAnalysis: (dataSummary: any) => ipcRenderer.invoke('fetch-ai-analysis', dataSummary),
});

contextBridge.exposeInMainWorld('authAPI', {
  login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
});

contextBridge.exposeInMainWorld('config', {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
});

contextBridge.exposeInMainWorld('fileAPI', {
  updateCellStatesFile: (data: any, filename?: string) => 
    ipcRenderer.invoke('update-cell-states-file', data, filename),
  getCellStates: (filename?: string) => 
    ipcRenderer.invoke('get-cell-states', filename),
  resetCellStates: (filename?: string) => 
    ipcRenderer.invoke('reset-cell-states', filename),
});

contextBridge.exposeInMainWorld('serialAPI', {
  writePortRaw: (data: Uint8Array) => ipcRenderer.invoke("write-port-raw", data),
  listPorts: () => ipcRenderer.invoke("list-ports"),
  openPort: (port: string, baudRate: number) => ipcRenderer.invoke("open-port", port, baudRate),
  closePort: () => ipcRenderer.invoke("close-port"),
  writePort: (data: string) => ipcRenderer.invoke("write-port", data),
  onSerialData: (callback: (data: any) => void) => {
    ipcRenderer.on('serial-data', (_event, data) => {
      console.log("[Preload DEBUG] Forwarding serial-data:", data);
      callback(data);
    });
  },
  removeSerialDataListener: () => {
    ipcRenderer.removeAllListeners("serial-data");
  },
  onSerialVoltage: (callback: (data: { cellNo: number; voltage: string }) => void) => {
    ipcRenderer.on('serial-voltage', (_event, data) => {
      console.log("[Preload DEBUG] Forwarding serial-voltage:", data);
      callback(data);
    });
  },
});