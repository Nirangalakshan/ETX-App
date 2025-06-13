// import { ipcRenderer, contextBridge } from 'electron'

// // --------- Expose some API to the Renderer process ---------
// contextBridge.exposeInMainWorld('ipcRenderer', {
//   on(...args: Parameters<typeof ipcRenderer.on>) {
//     const [channel, listener] = args
//     return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
//   },
//   off(...args: Parameters<typeof ipcRenderer.off>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.off(channel, ...omit)
//   },
//   send(...args: Parameters<typeof ipcRenderer.send>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.send(channel, ...omit)
//   },
//   invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
//     const [channel, ...omit] = args
//     return ipcRenderer.invoke(channel, ...omit)
//   },

//   // You can expose other APTs you need here.
//   // ...
// })

import { ipcRenderer, contextBridge } from 'electron';

// Expose ipcRenderer methods
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

// ✅ Expose custom window controls
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-window'),
  close: () => ipcRenderer.send('close-window'),
});

contextBridge.exposeInMainWorld('authAPI', {
  login: (username: string, password: string) => ipcRenderer.invoke('login', username, password),
});


// //new one
contextBridge.exposeInMainWorld("serialAPI", {
  listPorts: () => ipcRenderer.invoke("list-ports"),
  openPort: (port: string, baudRate: number) => ipcRenderer.invoke("open-port", port, baudRate),
  closePort: () => ipcRenderer.invoke("close-port"),
  writePort: (data: string)=> ipcRenderer.invoke("write-port", data),
  onSerialData: (callback: (data:string) => void) => {
    ipcRenderer.on("serial-data", (_event, data) => {
      callback(data);
    });
  }
});

contextBridge.exposeInMainWorld("serialAPI",{

})

//newone2
// contextBridge.exposeInMainWorld("electron", {
//   ipcRenderer: {
//     invoke: (channel: string, ...args: any[]) => ipcRenderer.invoke(channel, ...args),
//     on: (channel: string, listener: (...args: any[]) => void) => ipcRenderer.on(channel, listener),
//   },
// });
