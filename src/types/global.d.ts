// interface SerialAPI {
//   listPorts: () => Promise<string[]>;
//   openPort: (port: string, baudRate: number) => Promise<{ success: boolean; error?: string }>;
//   closePort: () => Promise<{ success: boolean; error?: string }>;
//   writeData: (data: string) => Promise<{ success: boolean; error?: string }>;
//   onSerialData: (callback: (data: string) => void) => () => void;
//   listOtherPorts: () => Promise<string[]>;
//   openOtherPort: (port: string, baudRate: number) => Promise<{ success: boolean; error?: string }>;
//   closeOtherPort: () => Promise<{ success: boolean; error?: string }>;
//   writeOtherData: (data: string) => Promise<{ success: boolean; error?: string }>;
//   onOtherSerialData: (callback: (data: string) => void) => () => void;
// }

// interface Window {
//   serialAPI?: SerialAPI;
// }