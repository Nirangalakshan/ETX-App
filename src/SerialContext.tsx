
// import React, { createContext, useContext, useState, useEffect } from 'react';

// interface SerialAPI {
//   listPorts: () => Promise<string[]>;
//   openPort: (portName: string, baudRate: number) => Promise<void>;
//   closePort: (portName: string) => Promise<void>;
//   writeData: (portName: string, command: string) => Promise<void>;
//   onSerialData: (handler: (data: { portName: string; hex: string; parsed: string | null }) => void) => void;
//   removeSerialDataListener: () => void;
//   onPortClosed?: (callback: (portName: string) => void) => void;
//   onSerialError?: (callback: (error: { portName: string; error: string }) => void) => void;
// }

// interface SerialState {
//   baudRate: number;
//   availablePorts: string[];
//   connectedPorts: string[];
//   selectedPort: string;
//   isPortOpen: boolean;
//   lastSerialData: string;
//   setBaudRate: (baudRate: number) => void;
//   setAvailablePorts: (ports: string[]) => void;
//   setConnectedPorts: (ports: string[]) => void;
//   setSelectedPort: (port: string) => void;
//   setIsPortOpen: (isOpen: boolean) => void;
//   setLastSerialData: (data: string) => void;
//   refreshPorts: () => Promise<void>;
//   initializePort: (port: string) => Promise<void>;
//   closePort: (port: string) => Promise<void>;
//   writeSerialData: (command: string) => Promise<void>;
//   serialAPI: SerialAPI;
// }

// const SerialContext = createContext<SerialState | undefined>(undefined);

// export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [baudRate, setBaudRate] = useState<number>(9600);
//   const [availablePorts, setAvailablePorts] = useState<string[]>([]);
//   const [connectedPorts, setConnectedPorts] = useState<string[]>([]);
//   const [selectedPort, setSelectedPort] = useState<string>('');
//   const [isPortOpen, setIsPortOpen] = useState<boolean>(false);
//   const [lastSerialData, setLastSerialData] = useState<string>('');
//   const [serialError, setSerialError] = useState<string | null>(null);

//   const serialAPI: SerialAPI = {
//     listPorts: async () => {
//       if (!window.serialAPI) {
//         console.error('Renderer: window.serialAPI not available');
//         throw new Error('Serial API not available. Check Electron preload configuration.');
//       }
//       try {
//         const ports = await window.serialAPI.listPorts();
//         console.log('Renderer: Detected ports:', ports);
//         return ports;
//       } catch (error) {
//         console.error('Renderer: Error listing ports:', error);
//         throw new Error(`Failed to list ports: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     },
//     openPort: async (portName: string, baudRate: number) => {
//       if (!window.serialAPI) {
//         throw new Error('Serial API not available');
//       }
//       try {
//         await window.serialAPI.openPort(portName, baudRate);
//         console.log('Renderer: Opened port:', portName, 'at baud rate:', baudRate);
//       } catch (error) {
//         console.error('Renderer: Error opening port:', portName, error);
//         throw new Error(`Failed to open port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     },
//     closePort: async (portName: string) => {
//       if (!window.serialAPI) {
//         throw new Error('Serial API not available');
//       }
//       try {
//         await window.serialAPI.closePort(portName);
//         console.log('Renderer: Closed port:', portName);
//       } catch (error) {
//         console.error('Renderer: Error closing port:', portName, error);
//         throw new Error(`Failed to close port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     },
//     writeData: async (portName: string, command: string) => {
//       if (!window.serialAPI) {
//         throw new Error('Serial API not available');
//       }
//       try {
//         await window.serialAPI.writeData(portName, command);
//         console.log(
//           'Renderer: Wrote data to port:', portName,
//           'hex:', Buffer.from(command).toString('hex').toUpperCase()
//         );
//       } catch (error) {
//         console.error('Renderer: Error writing to port:', portName, error);
//         throw new Error(`Failed to write to port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     },
//     onSerialData: (handler) => {
//       if (!window.serialAPI) {
//         console.error('Renderer: window.serialAPI not available for onSerialData');
//         return;
//       }
//       console.log('Renderer: Registering serial data handler');
//       window.serialAPI.onSerialData(handler);
//     },
//     removeSerialDataListener: () => {
//       if (!window.serialAPI) {
//         console.error('Renderer: window.serialAPI not available for removeSerialDataListener');
//         return;
//       }
//       console.log('Renderer: Removing serial data handler');
//       window.serialAPI.removeSerialDataListener();
//     },
//     onPortClosed: window.serialAPI?.onPortClosed
//       ? (callback) => {
//           console.log('Renderer: Registering port closed handler');
//           window.serialAPI.onPortClosed(callback);
//         }
//       : undefined,
//     onSerialError: window.serialAPI?.onSerialError
//       ? (callback) => {
//           console.log('Renderer: Registering serial error handler');
//           window.serialAPI.onSerialError(callback);
//         }
//       : undefined,
//   };

//   const refreshPorts = async () => {
//     try {
//       console.log('Renderer: Refreshing ports...');
//       const ports = await serialAPI.listPorts();
//       const filteredPorts = ports.filter((port) => !connectedPorts.includes(port));
//       setAvailablePorts(filteredPorts);
//       if (filteredPorts.length > 0 && !isPortOpen) {
//         setSelectedPort(filteredPorts[0]);
//       } else if (filteredPorts.length === 0 && !connectedPorts.includes(selectedPort)) {
//         setSelectedPort('');
//       }
//       console.log('Renderer: Updated available ports:', filteredPorts);
//       if (ports.length === 0) {
//         console.warn('Renderer: No serial ports detected. Ensure a device is connected and drivers are installed.');
//         setSerialError('No serial ports detected. Please connect a device and ensure drivers are installed.');
//       } else {
//         setSerialError(null);
//       }
//     } catch (error) {
//       console.error('Renderer: Error fetching ports:', error);
//       setAvailablePorts([]);
//       setSerialError(`Failed to fetch ports: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   const initializePort = async (port: string) => {
//     if (!port) {
//       console.error('Renderer: No port selected');
//       throw new Error('No port selected');
//     }
//     try {
//       console.log('Renderer: Initializing port:', port, 'at baud rate:', baudRate);
//       await serialAPI.openPort(port, baudRate);
//       setConnectedPorts((prev) => [...new Set([...prev, port])]);
//       setIsPortOpen(true);
//       setAvailablePorts((prev) => prev.filter((p) => p !== port));
//       console.log('Renderer: Port opened successfully:', port);
//       setSerialError(null);
//     } catch (error) {
//       console.error('Renderer: Failed to initialize port:', error);
//       throw new Error(`Failed to open port: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   const closePort = async (port: string) => {
//     try {
//       console.log('Renderer: Closing port:', port);
//       await serialAPI.closePort(port);
//       setConnectedPorts((prev) => prev.filter((p) => p !== port));
//       setIsPortOpen(false);
//       await refreshPorts();
//       console.log('Renderer: Port closed successfully:', port);
//     } catch (error) {
//       console.error('Renderer: Error closing port:', error);
//       throw new Error(`Failed to close port: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   const writeSerialData = async (command: string) => {
//     try {
//       console.log(
//         'Renderer: Writing serial data (hex):',
//         Buffer.from(command).toString('hex').toUpperCase()
//       );
//       await serialAPI.writeData(selectedPort, command);
//       console.log('Renderer: Successfully wrote command');
//     } catch (error) {
//       console.error('Renderer: Error writing serial data:', error);
//       throw new Error(`Failed to write to serial port: ${error instanceof Error ? error.message : String(error)}`);
//     }
//   };

//   useEffect(() => {
//     if (!window.serialAPI) {
//       console.error('Renderer: window.serialAPI not available on mount');
//       setSerialError('Serial API not available. Check Electron preload configuration.');
//       return;
//     }

//     refreshPorts();
//     if (serialAPI.onPortClosed) {
//       serialAPI.onPortClosed((portName) => {
//         console.log('Renderer: Port closed event received:', portName);
//         setConnectedPorts((prev) => prev.filter((p) => p !== portName));
//         setIsPortOpen(false);
//         refreshPorts();
//       });
//     } else {
//       console.warn('Renderer: onPortClosed not available in serialAPI');
//     }

//     if (serialAPI.onSerialError) {
//       serialAPI.onSerialError((error) => {
//         console.error('Renderer: Serial error:', error);
//         setSerialError(`Serial error on ${error.portName}: ${error.error}`);
//       });
//     } else {
//       console.warn('Renderer: onSerialError not available in serialAPI');
//     }

//     return () => {
//       if (serialAPI.removeSerialDataListener) {
//         serialAPI.removeSerialDataListener();
//       }
//     };
//   }, []);

//   return (
//     <SerialContext.Provider
//       value={{
//         baudRate,
//         availablePorts,
//         connectedPorts,
//         selectedPort,
//         isPortOpen,
//         lastSerialData,
//         setBaudRate,
//         setAvailablePorts,
//         setConnectedPorts,
//         setSelectedPort,
//         setIsPortOpen,
//         setLastSerialData,
//         refreshPorts,
//         initializePort,
//         closePort,
//         writeSerialData,
//         serialAPI,
//       }}
//     >
//       {children}
//     </SerialContext.Provider>
//   );
// };

// export const useSerial = () => {
//   const context = useContext(SerialContext);
//   if (!context) {
//     throw new Error('useSerial must be used within a SerialProvider');
//   }
//   return context;
// };









import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

interface SerialAPI {
  listPorts: () => Promise<string[]>;
  openPort: (portName: string, baudRate: number) => Promise<void>;
  closePort: (portName: string) => Promise<void>;
  writeData: (portName: string, command: string) => Promise<void>;
  writePortRaw: (data: Uint8Array) => Promise<void>;
  onSerialData: (handler: (data: { hex: string; parsed: string | null }) => void) => void;
  removeSerialDataListener: () => void;
  onPortClosed?: (callback: (portName: string) => void) => void;
  onSerialError?: (callback: (error: string) => void) => void;
  isPortOpen?: () => Promise<boolean>;
  removeSerialErrorListener?: () => void;
}

interface SerialState {
  baudRate: number;
  availablePorts: string[];
  connectedPorts: string[];
  selectedPort: string;
  isPortOpen: boolean;
  lastSerialData: string;
  serialError: string | null;
  isInitializing: boolean;
  setBaudRate: (baudRate: number) => void;
  setAvailablePorts: (ports: string[]) => void;
  setConnectedPorts: (ports: string[]) => void;
  setSelectedPort: (port: string) => void;
  setIsPortOpen: (isOpen: boolean) => void;
  setLastSerialData: (data: string) => void;
  setSerialError: (error: string | null) => void;
  refreshPorts: () => Promise<void>;
  initializePort: (port: string) => Promise<void>;
  closePort: (port: string) => Promise<void>;
  writeSerialData: (command: string) => Promise<void>;
  writeRawData: (data: Uint8Array) => Promise<void>;
  serialAPI: SerialAPI;
}

const SerialContext = createContext<SerialState | undefined>(undefined);

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [connectedPorts, setConnectedPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isPortOpen, setIsPortOpen] = useState<boolean>(false);
  const [lastSerialData, setLastSerialData] = useState<string>('');
  const [serialError, setSerialError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  
  const isMountedRef = useRef(true);
  const dataHandlerRef = useRef<((data: any) => void) | null>(null);
  const errorHandlerRef = useRef<((error: any) => void) | null>(null);

  // Enhanced serialAPI with better error handling
  const serialAPI: SerialAPI = {
    listPorts: async () => {
      if (!window.serialAPI) {
        console.error('Renderer: window.serialAPI not available');
        throw new Error('Serial API not available. Check Electron preload configuration.');
      }
      try {
        console.log('Renderer: Listing ports...');
        const ports = await window.serialAPI.listPorts();
        console.log('Renderer: Detected ports:', ports);
        return ports;
      } catch (error) {
        console.error('Renderer: Error listing ports:', error);
        throw new Error(`Failed to list ports: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    openPort: async (portName: string, baudRate: number) => {
      if (!window.serialAPI) {
        throw new Error('Serial API not available');
      }
      try {
        console.log('Renderer: Opening port:', portName, 'at baud rate:', baudRate);
        await window.serialAPI.openPort(portName, baudRate);
        console.log('Renderer: Successfully opened port:', portName);
      } catch (error) {
        console.error('Renderer: Error opening port:', portName, error);
        throw new Error(`Failed to open port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    closePort: async (portName: string) => {
      if (!window.serialAPI) {
        throw new Error('Serial API not available');
      }
      try {
        console.log('Renderer: Closing port:', portName);
        await window.serialAPI.closePort(portName);
        console.log('Renderer: Successfully closed port:', portName);
      } catch (error) {
        console.error('Renderer: Error closing port:', portName, error);
        throw new Error(`Failed to close port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    writeData: async (portName: string, command: string) => {
      if (!window.serialAPI) {
        throw new Error('Serial API not available');
      }
      try {
        console.log('Renderer: Writing data to port:', portName);
        await window.serialAPI.writeData(portName, command);
        console.log('Renderer: Successfully wrote data to port:', portName);
      } catch (error) {
        console.error('Renderer: Error writing to port:', portName, error);
        throw new Error(`Failed to write to port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    writePortRaw: async (data: Uint8Array) => {
      if (!window.serialAPI?.writePortRaw) {
        throw new Error('writePortRaw method not available');
      }
      try {
        console.log('Renderer: Writing raw data, length:', data.length);
        await window.serialAPI.writePortRaw(data);
        console.log('Renderer: Successfully wrote raw data');
      } catch (error) {
        console.error('Renderer: Error writing raw data:', error);
        throw new Error(`Failed to write raw data: ${error instanceof Error ? error.message : String(error)}`);
      }
    },

    onSerialData: (handler) => {
      if (!window.serialAPI?.onSerialData) {
        console.error('Renderer: window.serialAPI.onSerialData not available');
        return;
      }
      console.log('Renderer: Registering serial data handler');
      dataHandlerRef.current = handler;
      window.serialAPI.onSerialData(handler);
    },

    removeSerialDataListener: () => {
      if (!window.serialAPI?.removeSerialDataListener) {
        console.error('Renderer: window.serialAPI.removeSerialDataListener not available');
        return;
      }
      console.log('Renderer: Removing serial data handler');
      dataHandlerRef.current = null;
      window.serialAPI.removeSerialDataListener();
    },

    onPortClosed: window.serialAPI?.onPortClosed
      ? (callback) => {
          console.log('Renderer: Registering port closed handler');
          window.serialAPI.onPortClosed(callback);
        }
      : undefined,

    onSerialError: window.serialAPI?.onSerialError
      ? (callback) => {
          console.log('Renderer: Registering serial error handler');
          errorHandlerRef.current = callback;
          window.serialAPI.onSerialError(callback);
        }
      : undefined,

    isPortOpen: window.serialAPI?.isPortOpen
      ? async () => {
          try {
            return await window.serialAPI.isPortOpen();
          } catch (error) {
            console.error('Renderer: Error checking port status:', error);
            return false;
          }
        }
      : undefined,

    removeSerialErrorListener: window.serialAPI?.removeSerialErrorListener
      ? () => {
          console.log('Renderer: Removing serial error handler');
          errorHandlerRef.current = null;
          window.serialAPI.removeSerialErrorListener();
        }
      : undefined,
  };

  // Enhanced refreshPorts with better state management
  const refreshPorts = async () => {
    if (isInitializing) {
      console.log('Renderer: Refresh already in progress, skipping...');
      return;
    }

    try {
      setIsInitializing(true);
      console.log('Renderer: Refreshing ports...');
      
      const ports = await serialAPI.listPorts();
      const filteredPorts = ports.filter((port) => !connectedPorts.includes(port));
      
      // Use functional updates to ensure state consistency
      setAvailablePorts((prev) => {
        const newAvailable = filteredPorts;
        console.log('Renderer: Updated available ports:', newAvailable);
        return newAvailable;
      });

      if (filteredPorts.length > 0 && !isPortOpen && !selectedPort) {
        setSelectedPort(filteredPorts[0]);
      } else if (filteredPorts.length === 0 && !connectedPorts.includes(selectedPort)) {
        setSelectedPort('');
      }

      if (ports.length === 0) {
        console.warn('Renderer: No serial ports detected.');
        setSerialError('No serial ports detected. Please connect a device and ensure drivers are installed.');
      } else {
        setSerialError(null);
      }
    } catch (error) {
      console.error('Renderer: Error fetching ports:', error);
      if (isMountedRef.current) {
        setAvailablePorts([]);
        setSerialError(`Failed to fetch ports: ${error instanceof Error ? error.message : String(error)}`);
      }
    } finally {
      if (isMountedRef.current) {
        setIsInitializing(false);
      }
    }
  };

  // Enhanced initializePort with better state management
  const initializePort = async (port: string) => {
    if (!port) {
      console.error('Renderer: No port selected');
      throw new Error('No port selected');
    }
    
    if (connectedPorts.includes(port)) {
      console.log('Renderer: Port already connected:', port);
      return;
    }

    try {
      console.log('Renderer: Initializing port:', port, 'at baud rate:', baudRate);
      await serialAPI.openPort(port, baudRate);
      
      // Batch state updates
      if (isMountedRef.current) {
        setConnectedPorts((prev) => {
          const newConnected = [...new Set([...prev, port])];
          console.log('Renderer: Updated connected ports:', newConnected);
          return newConnected;
        });
        
        setIsPortOpen(true);
        setAvailablePorts((prev) => {
          const newAvailable = prev.filter((p) => p !== port);
          console.log('Renderer: Updated available ports:', newAvailable);
          return newAvailable;
        });
        
        setSerialError(null);
      }
      
      console.log('Renderer: Port opened successfully:', port);
    } catch (error) {
      console.error('Renderer: Failed to initialize port:', error);
      // Ensure state is consistent on error
      if (isMountedRef.current) {
        setConnectedPorts((prev) => prev.filter((p) => p !== port));
        setIsPortOpen(false);
        await refreshPorts();
      }
      throw new Error(`Failed to open port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Enhanced closePort
  const closePort = async (port: string) => {
    try {
      console.log('Renderer: Closing port:', port);
      await serialAPI.closePort(port);
      
      if (isMountedRef.current) {
        setConnectedPorts((prev) => {
          const newConnected = prev.filter((p) => p !== port);
          console.log('Renderer: Updated connected ports after close:', newConnected);
          return newConnected;
        });
        
        setIsPortOpen(false);
        await refreshPorts();
      }
      
      console.log('Renderer: Port closed successfully:', port);
    } catch (error) {
      console.error('Renderer: Error closing port:', error);
      // Still update state even if close fails
      if (isMountedRef.current) {
        setConnectedPorts((prev) => prev.filter((p) => p !== port));
        setIsPortOpen(false);
        await refreshPorts();
      }
      throw new Error(`Failed to close port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Enhanced writeSerialData with validation
  const writeSerialData = async (command: string) => {
    if (!selectedPort || !connectedPorts.includes(selectedPort)) {
      throw new Error('No port selected or port not connected');
    }
    
    try {
      console.log('Renderer: Writing serial data to port:', selectedPort);
      console.log('Renderer: Command (hex):', Buffer.from(command).toString('hex').toUpperCase());
      
      await serialAPI.writeData(selectedPort, command);
      console.log('Renderer: Successfully wrote command');
    } catch (error) {
      console.error('Renderer: Error writing serial data:', error);
      throw new Error(`Failed to write to serial port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Raw data writing method
  const writeRawData = async (data: Uint8Array) => {
    if (!selectedPort || !connectedPorts.includes(selectedPort)) {
      throw new Error('No port selected or port not connected');
    }
    
    try {
      console.log('Renderer: Writing raw data, length:', data.length);
      await serialAPI.writePortRaw(data);
      console.log('Renderer: Successfully wrote raw data');
    } catch (error) {
      console.error('Renderer: Error writing raw data:', error);
      throw new Error(`Failed to write raw data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Enhanced useEffect with proper cleanup
  useEffect(() => {
    isMountedRef.current = true;
    console.log('Renderer: SerialProvider mounted');

    const initialize = async () => {
      if (!window.serialAPI) {
        console.error('Renderer: window.serialAPI not available on mount');
        if (isMountedRef.current) {
          setSerialError('Serial API not available. Check Electron preload configuration.');
        }
        return;
      }

      try {
        await refreshPorts();
        
        // Set up port closed handler
        if (serialAPI.onPortClosed && isMountedRef.current) {
          serialAPI.onPortClosed((portName) => {
            console.log('Renderer: Port closed event received:', portName);
            if (isMountedRef.current) {
              setConnectedPorts((prev) => prev.filter((p) => p !== portName));
              setIsPortOpen(false);
              refreshPorts();
            }
          });
        }

        // Set up error handler
        if (serialAPI.onSerialError && isMountedRef.current) {
          serialAPI.onSerialError((error) => {
            console.error('Renderer: Serial error:', error);
            if (isMountedRef.current) {
              setSerialError(`Serial error: ${error}`);
            }
          });
        }
      } catch (error) {
        console.error('Renderer: Initialization error:', error);
        if (isMountedRef.current) {
          setSerialError(`Initialization failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    };

    initialize();

    return () => {
      console.log('Renderer: SerialProvider unmounting - cleaning up...');
      isMountedRef.current = false;
      
      // Clean up listeners
      if (serialAPI.removeSerialDataListener) {
        serialAPI.removeSerialDataListener();
      }
      if (serialAPI.removeSerialErrorListener) {
        serialAPI.removeSerialErrorListener();
      }
    };
  }, []);

  const value: SerialState = {
    baudRate,
    availablePorts,
    connectedPorts,
    selectedPort,
    isPortOpen,
    lastSerialData,
    serialError,
    isInitializing,
    setBaudRate,
    setAvailablePorts,
    setConnectedPorts,
    setSelectedPort,
    setIsPortOpen,
    setLastSerialData,
    setSerialError,
    refreshPorts,
    initializePort,
    closePort,
    writeSerialData,
    writeRawData,
    serialAPI,
  };

  return (
    <SerialContext.Provider value={value}>
      {children}
    </SerialContext.Provider>
  );
};

export const useSerial = () => {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
};