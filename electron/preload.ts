// import { ipcRenderer, contextBridge } from 'electron';

// // Expose ipcRenderer methods
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

// // ✅ Expose custom window controls
// contextBridge.exposeInMainWorld('electronAPI', {
//   minimize: () => ipcRenderer.send('minimize-window'),
//   close: () => ipcRenderer.send('close-window'),
// });

// contextBridge.exposeInMainWorld('authAPI', {
//   login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
// });


// // //new one
// contextBridge.exposeInMainWorld("serialAPI", {
//   writePortRaw: (data: Uint8Array) => ipcRenderer.invoke("write-port-raw", data),
//   listPorts: () => ipcRenderer.invoke("list-ports"),
//   openPort: (port: string, baudRate: number) => ipcRenderer.invoke("open-port", port, baudRate),
//   closePort: () => ipcRenderer.invoke("close-port"),
//   writePort: (data: string)=> ipcRenderer.invoke("write-port", data),
//   // onSerialData: (callback: (data:string) => void) => {
//   //   ipcRenderer.on("serial-data", (_event, data) => {
//   //     callback(data);
//   //   });
//   // }

//   onSerialData: (callback: (dataBuffer: Uint8Array | Buffer) => void) => {
//     ipcRenderer.on("serial-data", (_, dataBuffer) => {
//       if (dataBuffer instanceof Uint8Array || Buffer.isBuffer(dataBuffer)) {
//         callback(dataBuffer); // Send binary buffer directly
//       } else {
//         console.warn("Received unexpected data format", dataBuffer);
//       }
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
});

contextBridge.exposeInMainWorld('authAPI', {
  login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
});

contextBridge.exposeInMainWorld('serialAPI', {
  writePortRaw: (data: Uint8Array) => ipcRenderer.invoke("write-port-raw", data),
  listPorts: () => ipcRenderer.invoke("list-ports"),
  openPort: (port: string, baudRate: number) => ipcRenderer.invoke("open-port", port, baudRate),
  closePort: () => ipcRenderer.invoke("close-port"),
  writePort: (data: string) => ipcRenderer.invoke("write-port", data),
  onSerialData: (callback: (data: string) => void) => {
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