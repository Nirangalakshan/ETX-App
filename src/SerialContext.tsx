
import React, { createContext, useContext, useState, useEffect } from 'react';

interface SerialAPI {
  listPorts: () => Promise<string[]>;
  openPort: (portName: string, baudRate: number) => Promise<void>;
  closePort: (portName: string) => Promise<void>;
  writeData: (portName: string, command: string) => Promise<void>;
  onSerialData: (handler: (data: { portName: string; hex: string; parsed: string | null }) => void) => void;
  removeSerialDataListener: () => void;
  onPortClosed?: (callback: (portName: string) => void) => void;
  onSerialError?: (callback: (error: { portName: string; error: string }) => void) => void;
}

interface SerialState {
  baudRate: number;
  availablePorts: string[];
  connectedPorts: string[];
  selectedPort: string;
  isPortOpen: boolean;
  lastSerialData: string;
  setBaudRate: (baudRate: number) => void;
  setAvailablePorts: (ports: string[]) => void;
  setConnectedPorts: (ports: string[]) => void;
  setSelectedPort: (port: string) => void;
  setIsPortOpen: (isOpen: boolean) => void;
  setLastSerialData: (data: string) => void;
  refreshPorts: () => Promise<void>;
  initializePort: (port: string) => Promise<void>;
  closePort: (port: string) => Promise<void>;
  writeSerialData: (command: string) => Promise<void>;
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

  const serialAPI: SerialAPI = {
    listPorts: async () => {
      if (!window.serialAPI) {
        console.error('Renderer: window.serialAPI not available');
        throw new Error('Serial API not available. Check Electron preload configuration.');
      }
      try {
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
        await window.serialAPI.openPort(portName, baudRate);
        console.log('Renderer: Opened port:', portName, 'at baud rate:', baudRate);
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
        await window.serialAPI.closePort(portName);
        console.log('Renderer: Closed port:', portName);
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
        await window.serialAPI.writeData(portName, command);
        console.log(
          'Renderer: Wrote data to port:', portName,
          'hex:', Buffer.from(command).toString('hex').toUpperCase()
        );
      } catch (error) {
        console.error('Renderer: Error writing to port:', portName, error);
        throw new Error(`Failed to write to port ${portName}: ${error instanceof Error ? error.message : String(error)}`);
      }
    },
    onSerialData: (handler) => {
      if (!window.serialAPI) {
        console.error('Renderer: window.serialAPI not available for onSerialData');
        return;
      }
      console.log('Renderer: Registering serial data handler');
      window.serialAPI.onSerialData(handler);
    },
    removeSerialDataListener: () => {
      if (!window.serialAPI) {
        console.error('Renderer: window.serialAPI not available for removeSerialDataListener');
        return;
      }
      console.log('Renderer: Removing serial data handler');
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
          window.serialAPI.onSerialError(callback);
        }
      : undefined,
  };

  const refreshPorts = async () => {
    try {
      console.log('Renderer: Refreshing ports...');
      const ports = await serialAPI.listPorts();
      const filteredPorts = ports.filter((port) => !connectedPorts.includes(port));
      setAvailablePorts(filteredPorts);
      if (filteredPorts.length > 0 && !isPortOpen) {
        setSelectedPort(filteredPorts[0]);
      } else if (filteredPorts.length === 0 && !connectedPorts.includes(selectedPort)) {
        setSelectedPort('');
      }
      console.log('Renderer: Updated available ports:', filteredPorts);
      if (ports.length === 0) {
        console.warn('Renderer: No serial ports detected. Ensure a device is connected and drivers are installed.');
        setSerialError('No serial ports detected. Please connect a device and ensure drivers are installed.');
      } else {
        setSerialError(null);
      }
    } catch (error) {
      console.error('Renderer: Error fetching ports:', error);
      setAvailablePorts([]);
      setSerialError(`Failed to fetch ports: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const initializePort = async (port: string) => {
    if (!port) {
      console.error('Renderer: No port selected');
      throw new Error('No port selected');
    }
    try {
      console.log('Renderer: Initializing port:', port, 'at baud rate:', baudRate);
      await serialAPI.openPort(port, baudRate);
      setConnectedPorts((prev) => [...new Set([...prev, port])]);
      setIsPortOpen(true);
      setAvailablePorts((prev) => prev.filter((p) => p !== port));
      console.log('Renderer: Port opened successfully:', port);
      setSerialError(null);
    } catch (error) {
      console.error('Renderer: Failed to initialize port:', error);
      throw new Error(`Failed to open port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const closePort = async (port: string) => {
    try {
      console.log('Renderer: Closing port:', port);
      await serialAPI.closePort(port);
      setConnectedPorts((prev) => prev.filter((p) => p !== port));
      setIsPortOpen(false);
      await refreshPorts();
      console.log('Renderer: Port closed successfully:', port);
    } catch (error) {
      console.error('Renderer: Error closing port:', error);
      throw new Error(`Failed to close port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const writeSerialData = async (command: string) => {
    try {
      console.log(
        'Renderer: Writing serial data (hex):',
        Buffer.from(command).toString('hex').toUpperCase()
      );
      await serialAPI.writeData(selectedPort, command);
      console.log('Renderer: Successfully wrote command');
    } catch (error) {
      console.error('Renderer: Error writing serial data:', error);
      throw new Error(`Failed to write to serial port: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  useEffect(() => {
    if (!window.serialAPI) {
      console.error('Renderer: window.serialAPI not available on mount');
      setSerialError('Serial API not available. Check Electron preload configuration.');
      return;
    }

    refreshPorts();
    if (serialAPI.onPortClosed) {
      serialAPI.onPortClosed((portName) => {
        console.log('Renderer: Port closed event received:', portName);
        setConnectedPorts((prev) => prev.filter((p) => p !== portName));
        setIsPortOpen(false);
        refreshPorts();
      });
    } else {
      console.warn('Renderer: onPortClosed not available in serialAPI');
    }

    if (serialAPI.onSerialError) {
      serialAPI.onSerialError((error) => {
        console.error('Renderer: Serial error:', error);
        setSerialError(`Serial error on ${error.portName}: ${error.error}`);
      });
    } else {
      console.warn('Renderer: onSerialError not available in serialAPI');
    }

    return () => {
      if (serialAPI.removeSerialDataListener) {
        serialAPI.removeSerialDataListener();
      }
    };
  }, []);

  return (
    <SerialContext.Provider
      value={{
        baudRate,
        availablePorts,
        connectedPorts,
        selectedPort,
        isPortOpen,
        lastSerialData,
        setBaudRate,
        setAvailablePorts,
        setConnectedPorts,
        setSelectedPort,
        setIsPortOpen,
        setLastSerialData,
        refreshPorts,
        initializePort,
        closePort,
        writeSerialData,
        serialAPI,
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