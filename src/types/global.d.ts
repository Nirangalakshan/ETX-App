interface ElectronAPI {
  minimize: () => void;
  close: () => void;
  fetchAIAnalysis: (dataSummary: any) => Promise<{
    summary: string;
    recommendations: string[];
    error: string | null;
  }>;
}

interface SerialAPI {
  writePortRaw: (data: Uint8Array) => Promise<{ success: boolean; error?: string }>;
  listPorts: () => Promise<string[]>;
  openPort: (port: string, baudRate: number) => Promise<{ success: boolean; error?: string }>;
  closePort: () => Promise<void>;
  writePort: (data: string) => Promise<{ success: boolean; error?: string }>;
  onSerialData: (callback: (data: string) => void) => void;
  removeSerialDataListener: () => void;
  onSerialVoltage: (callback: (data: { cellNo: number; voltage: string }) => void) => void;
}

interface AuthAPI {
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
}

interface Config {
  OPENROUTER_API_KEY: string;
}

interface Window {
  electronAPI: ElectronAPI;
  serialAPI: SerialAPI;
  authAPI: AuthAPI;
  config: Config;
  ipcRenderer: {
    on: (...args: any[]) => any;
    off: (...args: any[]) => any;
    send: (...args: any[]) => any;
    invoke: (...args: any[]) => any;
  };
}