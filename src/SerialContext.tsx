// import React, { createContext, useContext, useState, useEffect } from 'react';

// interface SerialState {
//   baudRate: number;
//   availablePorts: string[];
//   selectedPort: string;
//   isPortOpen: boolean;
//   lastSerialData: string;
//   setBaudRate: (baudRate: number) => void;
//   setAvailablePorts: (ports: string[]) => void;
//   setSelectedPort: (port: string) => void;
//   setIsPortOpen: (isOpen: boolean) => void;
//   setLastSerialData: (data: string) => void;
//   refreshPorts: () => Promise<void>;
//   initializePort: () => Promise<void>;
//   closePort: () => Promise<void>;
//   writeSerialData: (command: string) => Promise<void>;
// }

// const SerialContext = createContext<SerialState | undefined>(undefined);

// export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
//   const [baudRate, setBaudRate] = useState<number>(9600);
//   const [availablePorts, setAvailablePorts] = useState<string[]>([]);
//   const [selectedPort, setSelectedPort] = useState<string>("");
//   const [isPortOpen, setIsPortOpen] = useState<boolean>(false);
//   const [lastSerialData, setLastSerialData] = useState<string>("");

//   const refreshPorts = async () => {
//     if (window.serialAPI) {
//       try {
//         console.log("Renderer: Refreshing ports...");
//         const ports = await window.serialAPI.listPorts();
//         console.log("Renderer: Available ports:", ports);
//         setAvailablePorts(ports);
//         if (ports.length > 0 && !isPortOpen) {
//           setSelectedPort(ports[0]);
//         }
//       } catch (error) {
//         console.error("Renderer: Error fetching ports:", error);
//         alert(`Failed to fetch ports: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     } else {
//       console.error("Renderer: serialAPI is not available");
//       alert("Serial API is not available. Ensure the application supports serial communication.");
//     }
//   };

//   const initializePort = async () => {
//     if (window.serialAPI && selectedPort) {
//       try {
//         console.log("Renderer: Initializing port:", selectedPort, "at baud rate:", baudRate);
//         await window.serialAPI.openPort(selectedPort, baudRate);
//         setIsPortOpen(true);
//         console.log("Renderer: Port opened successfully at", baudRate);
//         alert(`Port ${selectedPort} opened successfully at ${baudRate} baud.`);
//       } catch (error) {
//         console.error("Renderer: Failed to initialize port:", error);
//         alert(`Failed to open port at ${baudRate} baud: ${error instanceof Error ? error.message : String(error)}. Try 9600 baud.`);
//       }
//     } else {
//       alert("No port selected or serialAPI unavailable.");
//     }
//   };

//   const closePort = async () => {
//     if (window.serialAPI && window.serialAPI.closePort) {
//       try {
//         console.log("Renderer: Closing port...");
//         await window.serialAPI.closePort();
//         setIsPortOpen(false);
//         console.log("Renderer: Port closed successfully");
//         alert("Port closed successfully.");
//       } catch (error) {
//         console.error("Renderer: Error closing port:", error);
//         alert(`Failed to close port: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     } else {
//       console.error("Renderer: serialAPI or closePort is not available");
//       alert("Cannot close port: Serial API is not available.");
//       setIsPortOpen(false);
//     }
//   };

//   const writeSerialData = async (command: string) => {
//     if (window.serialAPI && isPortOpen) {
//       try {
//         console.log("Renderer: Writing serial data (hex):", command.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' '));
//         await window.serialAPI.writeData(command);
//         console.log("Renderer: Successfully wrote command");
//       } catch (error) {
//         console.error("Renderer: Error writing serial data:", error);
//         alert(`Failed to write to serial port: ${error instanceof Error ? error.message : String(error)}`);
//       }
//     } else {
//       console.error("Renderer: Cannot write, port is not open or serialAPI is unavailable");
//       alert("Serial port is not open or serialAPI is unavailable.");
//     }
//   };

//   useEffect(() => {
//     refreshPorts();
//   }, []);

//   return (
//     <SerialContext.Provider
//       value={{
//         baudRate,
//         availablePorts,
//         selectedPort,
//         isPortOpen,
//         lastSerialData,
//         setBaudRate,
//         setAvailablePorts,
//         setSelectedPort,
//         setIsPortOpen,
//         setLastSerialData,
//         refreshPorts,
//         initializePort,
//         closePort,
//         writeSerialData,
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









import React, { createContext, useContext, useState, useEffect } from 'react';

interface SerialState {
  baudRate: number;
  availablePorts: string[];
  connectedPorts: string[]; // New state for tracking connected ports
  selectedPort: string;
  isPortOpen: boolean;
  lastSerialData: string;
  setBaudRate: (baudRate: number) => void;
  setAvailablePorts: (ports: string[]) => void;
  setConnectedPorts: (ports: string[]) => void; // New setter for connected ports
  setSelectedPort: (port: string) => void;
  setIsPortOpen: (isOpen: boolean) => void;
  setLastSerialData: (data: string) => void;
  refreshPorts: () => Promise<void>;
  initializePort: (port: string) => Promise<void>; // Modified to accept port parameter
  closePort: (port: string) => Promise<void>; // Modified to accept port parameter
  writeSerialData: (command: string) => Promise<void>;
}

const SerialContext = createContext<SerialState | undefined>(undefined);

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [connectedPorts, setConnectedPorts] = useState<string[]>([]); // New state
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [isPortOpen, setIsPortOpen] = useState<boolean>(false);
  const [lastSerialData, setLastSerialData] = useState<string>('');

  const refreshPorts = async () => {
    if (window.serialAPI) {
      try {
        console.log('Renderer: Refreshing ports...');
        const ports = await window.serialAPI.listPorts();
        console.log('Renderer: Available ports:', ports);
        // Filter out connected ports from available ports
        const filteredPorts = ports.filter((port) => !connectedPorts.includes(port));
        setAvailablePorts(filteredPorts);
        if (filteredPorts.length > 0 && !isPortOpen) {
          setSelectedPort(filteredPorts[0]);
        } else if (filteredPorts.length === 0 && !connectedPorts.includes(selectedPort)) {
          setSelectedPort('');
        }
      } catch (error) {
        console.error('Renderer: Error fetching ports:', error);
        alert(`Failed to fetch ports: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.error('Renderer: serialAPI is not available');
      alert('Serial API is not available. Ensure the application supports serial communication.');
    }
  };

  const initializePort = async (port: string) => {
    if (window.serialAPI && port) {
      try {
        console.log('Renderer: Initializing port:', port, 'at baud rate:', baudRate);
        await window.serialAPI.openPort(port, baudRate);
        setConnectedPorts((prev) => [...prev, port]); // Add to connected ports
        setIsPortOpen(true);
        setAvailablePorts((prev) => prev.filter((p) => p !== port)); // Remove from available ports
        console.log('Renderer: Port opened successfully at', baudRate);
        // alert(`Port ${port} opened successfully at ${baudRate} baud.`);
      } catch (error) {
        console.error('Renderer: Failed to initialize port:', error);
        alert(`Failed to open port at ${baudRate} baud: ${error instanceof Error ? error.message : String(error)}. Try 9600 baud.`);
      }
    } else {
      alert('No port selected or serialAPI unavailable.');
    }
  };

  const closePort = async (port: string) => {
    if (window.serialAPI && window.serialAPI.closePort) {
      try {
        console.log('Renderer: Closing port:', port);
        await window.serialAPI.closePort();
        setConnectedPorts((prev) => prev.filter((p) => p !== port)); // Remove from connected ports
        setIsPortOpen(false);
        await refreshPorts(); // Refresh available ports
        console.log('Renderer: Port closed successfully');
        // alert(`Port ${port} closed successfully.`);
      } catch (error) {
        console.error('Renderer: Error closing port:', error);
        alert(`Failed to close port: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.error('Renderer: serialAPI or closePort is not available');
      alert('Cannot close port: Serial API is not available.');
      setIsPortOpen(false);
      setConnectedPorts((prev) => prev.filter((p) => p !== port));
      await refreshPorts();
    }
  };

  const writeSerialData = async (command: string) => {
    if (window.serialAPI && isPortOpen) {
      try {
        console.log(
          'Renderer: Writing serial data (hex):',
          command
            .split('')
            .map((c) => c.charCodeAt(0).toString(16).padStart(2, '0'))
            .join(' ')
        );
        await window.serialAPI.writeData(command);
        console.log('Renderer: Successfully wrote command');
      } catch (error) {
        console.error('Renderer: Error writing serial data:', error);
        alert(`Failed to write to serial port: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.error('Renderer: Cannot write, port is not open or serialAPI is unavailable');
      alert('Serial port is not open or serialAPI is unavailable.');
    }
  };

  useEffect(() => {
    refreshPorts();
  }, []);

  return (
    <SerialContext.Provider
      value={{
        baudRate,
        availablePorts,
        connectedPorts, // New state exposed
        selectedPort,
        isPortOpen,
        lastSerialData,
        setBaudRate,
        setAvailablePorts,
        setConnectedPorts, // New setter
        setSelectedPort,
        setIsPortOpen,
        setLastSerialData,
        refreshPorts,
        initializePort,
        closePort,
        writeSerialData,
      }}
    >
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