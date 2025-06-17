// import React, { useState, useEffect } from "react";
// import MenuBar from "../components/MenuBar";
// import Battery from "../components/Battery";
// import CSU1 from "../components/CSU1";
// import CSU2 from "../components/CSU2";
// import ErrorWarningPanel from "../components/ErrorWarningPanel";
// import DaicyChain from "../components/DaicyChain";
// import InstructionRunner from "../components/TestRun";

// // Extend the Window interface to include serialAPI
// declare global {
//   interface Window {
//     serialAPI?: {
//       listPorts: () => Promise<string[]>;
//       openPort: (port: string, baudRate: number) => Promise<void>;
//       closePort: () => Promise<void>;
//       onSerialData: (callback: (data: string) => void) => void;
//     };
//   }
// }

// type CellStatus = "normal" | "warning" | "critical";

// interface BatteryCell {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: CellStatus;
// }

// const DashBoard: React.FC = () => {
//   const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
//   const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
//   const [baudRate, setBaudRate] = useState<number>(9600);
//   const [availablePorts, setAvailablePorts] = useState<string[]>([]);
//   const [selectedPort, setSelectedPort] = useState<string>("");
//   const [isPortOpen, setIsPortOpen] = useState<boolean>(false);

//   // Fetch available serial ports on mount
//   useEffect(() => {
//     if (window.serialAPI) {
//       window.serialAPI.listPorts().then((ports: string[]) => {
//         setAvailablePorts(ports);
//         if (ports.length > 0) setSelectedPort(ports[0]);
//       });
//     }
//   }, []);

//   // Simulate fetching initial cell data from CSU1 and CSU2
//   useEffect(() => {
//     const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: "normal" as CellStatus,
//     }));
//     const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i + 12,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: "normal" as CellStatus,
//     }));
//     setCSU1Cells(initialCSU1Cells);
//     setCSU2Cells(initialCSU2Cells);

//     const interval = setInterval(() => {
//       setCSU1Cells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
//           return { ...cell, voltage, temperature, status };
//         })
//       );
//       setCSU2Cells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
//           return { ...cell, voltage, temperature, status };
//         })
//       );
//     }, 3000);

//     return () => clearInterval(interval);
//   }, []);

//   // Serial port actions via preload API
//   const initializePort = async () => {
//     if (window.serialAPI && selectedPort) {
//       try {
//         await window.serialAPI.openPort(selectedPort, baudRate);
//         setIsPortOpen(true);
//       } catch (error) {
//         alert("Failed to initialize port. Ensure a device is connected.");
//       }
//     }
//   };

//   const closePort = async () => {
//     if (window.serialAPI) {
//       await window.serialAPI.closePort();
//       setIsPortOpen(false);
//     }
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-100">
//       <MenuBar />

//       <div className="flex-1 p-4">
//         <div className="flex flex-row gap-4 items-start">
//           {/* Left column: Battery */}
//           <div>
//             <Battery setSelectedCell={() => {}} />
//           </div>

//           {/* Middle column: 2 columns for CSU1 and CSU2, each with its error panel */}
//           <div className="flex flex-row gap-3">
//             {/* CSU1 and its error panel */}
//             <div className="flex flex-col gap-4">
//               <CSU1 />
//               <div className="bg-white border rounded shadow p-4 min-w-[250px] mt-19">
//                 <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={[]} />
//               </div>
//             </div>
//             {/* CSU2 and its error panel */}
//             <div className="flex flex-col gap-4">
//               <CSU2 />
//               <div className="bg-white border rounded shadow p-4 min-w-[250px] mt-19">
//                 <ErrorWarningPanel csu1Cells={[]} csu2Cells={csu2Cells} />
//               </div>
//             </div>
//           </div>
//           <div>
//             <DaicyChain />
//           </div>
//           {/* Right column: Serial config panel + InstructionRunner */}
//           <div className="flex flex-col gap-4 min-w-[260px]">
//             <div className="bg-white border rounded shadow p-4">
//               <h2 className="text-lg font-semibold mb-2">Port Configuration</h2>
//               <div className="flex flex-col gap-3">
//                 <div>
//                   <label
//                     className="block text-sm font-medium mb-1"
//                     htmlFor="baudrate-select"
//                   >
//                     Baud Rate
//                   </label>
//                   <select
//                     id="baudrate-select"
//                     value={baudRate}
//                     onChange={(e) => setBaudRate(parseInt(e.target.value))}
//                     className="p-2 border rounded w-full"
//                     title="Baud Rate"
//                     aria-label="Baud Rate"
//                   >
//                     <option value={9600}>9600</option>
//                     <option value={19200}>19200</option>
//                     <option value={38400}>38400</option>
//                     <option value={57600}>57600</option>
//                     <option value={115200}>115200</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label
//                     className="block text-sm font-medium mb-1"
//                     htmlFor="port-select"
//                   >
//                     Serial Port
//                   </label>
//                   <select
//                     id="port-select"
//                     value={selectedPort}
//                     onChange={(e) => setSelectedPort(e.target.value)}
//                     className="p-2 border rounded w-full"
//                     disabled={availablePorts.length === 0}
//                     title="Available Serial Ports"
//                     aria-label="Available Serial Ports"
//                   >
//                     {availablePorts.map((port) => (
//                       <option key={port} value={port}>
//                         {port}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={initializePort}
//                     className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     disabled={isPortOpen || availablePorts.length === 0}
//                   >
//                     Initialize
//                   </button>
//                   <button
//                     onClick={closePort}
//                     className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                     disabled={!isPortOpen}
//                   >
//                     Close
//                   </button>
//                 </div>
//                 {isPortOpen && (
//                   <div className="text-green-600 text-sm mt-1 text-center">
//                     Port Open
//                   </div>
//                 )}
//               </div>
//             </div>
//             {/* InstructionRunner placed directly below port config */}
//             <InstructionRunner />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashBoard;





// the most updated one with refresh close functionality
// import React, { useState, useEffect } from "react";
// import MenuBar from "../components/MenuBar";
// import Battery from "../components/Battery";
// import CSU1 from "../components/CSU1";
// import CSU2 from "../components/CSU2";
// import ErrorWarningPanel from "../components/ErrorWarningPanel";
// import DaicyChain from "../components/DaicyChain";
// import InstructionRunner from "../components/TestRun";
// import SerialTerminal from "../components/test";
// import { useSerial } from "../SerialContext";

// declare global {
//   interface Window {
//     serialAPI?: {
//       listPorts: () => Promise<string[]>;
//       openPort: (port: string, baudRate: number) => Promise<void>;
//       closePort: () => Promise<void>;
//       writePort: (data: string) => Promise<void>;
//       onSerialData: (callback: (data: string) => void) => void;
//     };
//   }
// }

// type CellStatus = "normal" | "warning" | "critical";

// interface BatteryCell {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: CellStatus;
//   setVoltage: number;
//   balancing: boolean;
//   openWire: boolean;
//   data: string;
// }

// const DashBoard: React.FC = () => {
//   const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
//   const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
//   const {
//     baudRate,
//     availablePorts,
//     selectedPort,
//     isPortOpen,
//     lastSerialData,
//     setBaudRate,
//     setSelectedPort,
//     setLastSerialData,
//     refreshPorts,
//     initializePort,
//     closePort,
//   } = useSerial();

//   // Initialize cell data
//   useEffect(() => {
//     const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: "normal" as CellStatus,
//       setVoltage: 3.65,
//       balancing: false,
//       openWire: false,
//       data: "",
//     }));
//     const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i + 12,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: "normal" as CellStatus,
//       setVoltage: 3.65,
//       balancing: false,
//       openWire: false,
//       data: "",
//     }));
//     setCSU1Cells(initialCSU1Cells);
//     setCSU2Cells(initialCSU2Cells);
//     console.log("Renderer: Initialized cells:", { csu1Cells: initialCSU1Cells, csu2Cells: initialCSU2Cells });
//   }, []);

//   // Handle serial data
//   useEffect(() => {
//     if (window.serialAPI && isPortOpen) {
//       console.log("Renderer: Setting up serial data listener...");
//       window.serialAPI.onSerialData((data: string) => {
//         console.log("Renderer: Received serial data:", data);
//         setLastSerialData(data);

//         // Process data (expecting at least 24 letters)
//         const letters = data.replace(/\s+/g, "").split("").slice(0, 24);
//         const paddedLetters = [...letters, ...Array(24 - letters.length).fill("N/A")];
//         const newCSU1Cells: BatteryCell[] = [];
//         const newCSU2Cells: BatteryCell[] = [];

//         paddedLetters.forEach((letter: string, index: number) => {
//           const ascii = letter.charCodeAt(0) || 97;
//           const voltage = +((ascii - 97) / 25 * 0.7 + 3.1).toFixed(2);
//           const temperature = +((ascii - 97) / 25 * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";

//           const cell: BatteryCell = {
//             id: index,
//             voltage,
//             temperature,
//             status,
//             setVoltage: 3.65,
//             balancing: false,
//             openWire: Math.random() < 0.05,
//             data: letter,
//           };

//           if (index < 12) {
//             newCSU1Cells[index] = cell;
//           } else {
//             newCSU2Cells[index - 12] = cell;
//           }
//         });

//         console.log("Renderer: Updating cells:", { newCSU1Cells, newCSU2Cells });
//         setCSU1Cells(newCSU1Cells);
//         setCSU2Cells(newCSU2Cells);
//       });
//     }
//   }, [isPortOpen, setLastSerialData]);

//   // Combine cells for Battery component
//   const batteryCells = [...csu1Cells, ...csu2Cells];
//   console.log("Renderer: Passing batteryCells to Battery:", batteryCells);

//   return (
//     <div className="flex flex-col h-screen bg-gray-100">
//       <MenuBar />
//       <div className="flex-1 p-4">
//         <div className="flex flex-row gap-4 items-start">
//           <div>
//             <Battery cells={batteryCells} setSelectedCell={() => {}} />
//           </div>
//           <div className="flex flex-col gap-4">
//             <div className="flex flex-row gap-3">
//               <div className="flex flex-col gap-4">
//                 <CSU1 />
//               </div>
//               <div className="flex flex-col gap-4">
//                 <CSU2 />
//               </div>
//             </div>
//             <div className="bg-white border rounded shadow p-4 min-w-[510px] mt-15">
//               <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={csu2Cells} />
//             </div>
//           </div>
//           <div>
//             <DaicyChain />
//           </div>
//           <div className="flex flex-col gap-4 min-w-[260px]">
//             <div className="bg-white border rounded shadow p-4">
//               <h2 className="text-lg font-semibold mb-2">Port Configuration</h2>
//               <div className="flex flex-col gap-3">
//                 <div>
//                   <label className="block text-sm font-medium mb-1" htmlFor="baudrate-select">
//                     Baud Rate
//                   </label>
//                   <select
//                     id="baudrate-select"
//                     value={baudRate}
//                     onChange={(e) => setBaudRate(parseInt(e.target.value))}
//                     className="p-2 border rounded w-full"
//                     title="Baud Rate"
//                     aria-label="Baud Rate"
//                   >
//                     <option value={9600}>9600</option>
//                     <option value={19200}>19200</option>
//                     <option value={38400}>38400</option>
//                     <option value={57600}>57600</option>
//                     <option value={115200}>115200</option>
//                   </select>
//                 </div>
//                 <div>
//                   <label className="block text-sm font-medium mb-1" htmlFor="port-select">
//                     Serial Port
//                   </label>
//                   <select
//                     id="port-select"
//                     value={selectedPort}
//                     onChange={(e) => setSelectedPort(e.target.value)}
//                     className="p-2 border rounded w-full"
//                     disabled={availablePorts.length === 0}
//                     title="Available Serial Ports"
//                     aria-label="Available Serial Ports"
//                   >
//                     {availablePorts.map((port) => (
//                       <option key={port} value={port}>
//                         {port}
//                       </option>
//                     ))}
//                   </select>
//                 </div>
//                 <div className="flex gap-2">
//                   <button
//                     onClick={initializePort}
//                     className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//                     disabled={isPortOpen || availablePorts.length === 0}
//                   >
//                     Initialize
//                   </button>
//                   <button
//                     onClick={closePort}
//                     className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                     disabled={!isPortOpen}
//                   >
//                     Disconnect
//                   </button>
//                   <button
//                     onClick={refreshPorts}
//                     className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
//                     disabled={isPortOpen}
//                   >
//                     Refresh
//                   </button>
//                 </div>
//                 {isPortOpen && (
//                   <div className="text-green-600 text-sm mt-1 text-center">
//                     Port Open
//                   </div>
//                 )}
//                 <div className="text-sm mt-2">
//                   <span className="font-semibold">Last Serial Data:</span> {lastSerialData || "None"}
//                 </div>
//               </div>
//             </div>
//             <InstructionRunner />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashBoard;







import React, { useState, useEffect, useRef } from "react";
import MenuBar from "../components/MenuBar";
import Battery from "../components/Battery";
import CSU1 from "../components/CSU1";
import CSU2 from "../components/CSU2";
import ErrorWarningPanel from "../components/ErrorWarningPanel";
import DaicyChain from "../components/DaicyChain";
import InstructionRunner from "../components/TestRun";
import SerialTerminal from "../components/test";
import { useSerial } from "../SerialContext";

declare global {
  interface Window {
    serialAPI?: {
      listPorts: () => Promise<string[]>;
      openPort: (port: string, baudRate: number) => Promise<void>;
      closePort: () => Promise<void>;
      writeData: (data: string) => Promise<void>;
      onSerialData: (callback: (data: string) => void) => void;
    };
  }
}

type CellStatus = "normal" | "warning" | "critical";

interface BatteryCell {
  id: number;
  voltage: number;
  temperature: number;
  status: CellStatus;
  setVoltage: number;
  balancing: boolean;
  openWire: boolean;
  data: string;
}

interface SetInstruction {
  id: number;
  command: string;
  param1: string;
  param2: string;
  cellNo: string;
  cycleNo: string;
  voltage: string;
  temperature: string;
  time: string;
}

const validCommands = [
  "set_voltage",
  "set_temp",
  "set_balance",
  "set_ow",
  "delay",
  "cycle",
  "end",
];

const DashBoard: React.FC = () => {
  const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
  const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
  const [instructions, setInstructions] = useState<SetInstruction[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    baudRate,
    availablePorts,
    selectedPort,
    isPortOpen,
    lastSerialData,
    setBaudRate,
    setSelectedPort,
    setLastSerialData,
    refreshPorts,
    initializePort,
    closePort,
    writeSerialData,
  } = useSerial();

  // Initialize cell data
  useEffect(() => {
    const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      voltage: 3.6,
      temperature: 25.0,
      status: "normal" as CellStatus,
      setVoltage: 3.65,
      balancing: false,
      openWire: false,
      data: "",
    }));
    const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i + 12,
      voltage: 3.6,
      temperature: 25.0,
      status: "normal" as CellStatus,
      setVoltage: 3.65,
      balancing: false,
      openWire: false,
      data: "",
    }));
    setCSU1Cells(initialCSU1Cells);
    setCSU2Cells(initialCSU2Cells);
    console.log("Renderer: Initialized cells:", { csu1Cells: initialCSU1Cells, csu2Cells: initialCSU2Cells });
  }, []);

  // Handle serial data
  useEffect(() => {
    if (window.serialAPI && isPortOpen) {
      console.log("Renderer: Setting up serial data listener...");
      window.serialAPI.onSerialData((data: string) => {
        console.log("Renderer: Received serial data (raw):", data);
        const hexData = data.split('').map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join(' ');
        console.log("Renderer: Received serial data (hex):", hexData);
        setLastSerialData(hexData);
      });
    }
  }, [isPortOpen, setLastSerialData]);

  const validateInstruction = (instruction: any, index: number, totalInstructions: number): string | null => {
    if (!instruction.command || !validCommands.includes(instruction.command)) {
      return `Instruction ${index + 1}: Invalid or missing command`;
    }
    switch (instruction.command) {
      case "set_voltage":
        if (!instruction.cellNo || isNaN(parseInt(instruction.cellNo)) || parseInt(instruction.cellNo) < 1 || parseInt(instruction.cellNo) > 23) {
          return `Instruction ${index + 1}: Invalid cellNo for set_voltage (1-23)`;
        }
        if (!instruction.voltage || isNaN(parseFloat(instruction.voltage)) || parseFloat(instruction.voltage) < 0) {
          return `Instruction ${index + 1}: Invalid voltage for set_voltage`;
        }
        break;
      case "set_temp":
        if (!instruction.cellNo || isNaN(parseInt(instruction.cellNo)) || parseInt(instruction.cellNo) < 1 || parseInt(instruction.cellNo) > 6) {
          return `Instruction ${index + 1}: Invalid cellNo for set_temp (1-6)`;
        }
        if (!instruction.temperature || isNaN(parseFloat(instruction.temperature)) || parseFloat(instruction.temperature) < 0) {
          return `Instruction ${index + 1}: Invalid temperature for set_temp`;
        }
        break;
      case "set_balance":
        if (!instruction.cellNo || isNaN(parseInt(instruction.cellNo)) || parseInt(instruction.cellNo) < 1 || parseInt(instruction.cellNo) > 23) {
          return `Instruction ${index + 1}: Invalid cellNo for set_balance (1-23)`;
        }
        break;
      case "set_ow":
        if (!instruction.cellNo || isNaN(parseInt(instruction.cellNo)) || parseInt(instruction.cellNo) < 1 || parseInt(instruction.cellNo) > 24) {
          return `Instruction ${index + 1}: Invalid cellNo for set_ow (1-24)`;
        }
        break;
      case "cycle":
        if (!instruction.param1 || !instruction.param1.startsWith("Step ") || isNaN(parseInt(instruction.param1.replace("Step ", "")))) {
          return `Instruction ${index + 1}: Invalid param1 for cycle`;
        }
        const stepNum = parseInt(instruction.param1.replace("Step ", ""));
        if (stepNum < 1 || stepNum > totalInstructions) {
          return `Instruction ${index + 1}: param1 references invalid step (${stepNum})`;
        }
        if (!instruction.param2 || isNaN(parseInt(instruction.param2)) || parseInt(instruction.param2) <= 0) {
          return `Instruction ${index + 1}: Invalid param2 for cycle`;
        }
        if (instruction.cellNo) {
          console.warn(`Instruction ${index + 1}: cellNo ignored for cycle`);
        }
        break;
      case "delay":
        if (!instruction.time || isNaN(parseInt(instruction.time)) || parseInt(instruction.time) <= 0) {
          return `Instruction ${index + 1}: Invalid time for delay`;
        }
        break;
      case "end":
        break;
      default:
        return `Instruction ${index + 1}: Unknown command`;
    }
    return null;
  };

  const handleLoadInstructions = () => {
    if (fileInputRef.current) {
      console.log("Renderer: Triggering file input");
      fileInputRef.current.click();
    } else {
      console.error("Renderer: File input ref is null");
      alert("File input is not available. Please refresh the page.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Renderer: File change event triggered");
    const file = event.target.files?.[0];
    if (!file) {
      console.warn("Renderer: No file selected");
      alert("No file selected. Please choose a JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log("Renderer: Reading file:", file.name);
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          throw new Error("File must contain a JSON array of instructions.");
        }

        // Validate instructions
        const errors = data
          .map((item, index) => validateInstruction(item, index, data.length))
          .filter((error): error is string => error !== null);
        if (errors.length > 0) {
          console.error("Renderer: Validation errors:", errors);
          alert(`Invalid instructions:\n${errors.join("\n")}`);
          return;
        }

        // Create valid data
        const validData = data.map((item, index) => ({
          id: index + 1,
          command: item.command || "",
          param1: item.command === "cycle" ? item.param1 || "" : "",
          param2: item.command === "cycle" ? item.param2 || "" : "",
          cellNo: ["set_voltage", "set_temp", "set_balance", "set_ow"].includes(item.command) ? item.cellNo || "" : "",
          cycleNo: item.command === "cycle" ? item.cycleNo || "" : "",
          voltage: item.command === "set_voltage" ? item.voltage || "" : "",
          temperature: item.command === "set_temp" ? item.temperature || "" : "",
          time: item.command === "delay" ? item.time || "" : "",
        }));

        setInstructions(validData);
        console.log("Renderer: Loaded instructions:", validData);
        if (validData.length === 1 && validData[0].command === "cycle") {
          alert(`Warning: Single cycle instruction will loop itself ${validData[0].param2} times. Add more instructions for meaningful looping.`);
        } else {
          alert(`Successfully loaded ${validData.length} instructions.`);
        }
      } catch (error) {
        console.error("Renderer: Error parsing file:", error);
        alert(`Error loading file: ${error instanceof Error ? error.message : String(error)}`);
      }
    };
    reader.onerror = () => {
      console.error("Renderer: File read error");
      alert("Failed to read file. Please ensure it is a valid JSON file.");
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearInstructions = () => {
    setInstructions([]);
    console.log("Renderer: Cleared instructions");
    alert("Instructions cleared.");
  };

  // Update cell states based on command
  const updateCellState = (instruction: SetInstruction) => {
    const cellNo = parseInt(instruction.cellNo) - 1;
    if (cellNo < 0 || cellNo >= 24) return;

    const isCSU1 = cellNo < 12;
    const cellIndex = isCSU1 ? cellNo : cellNo - 12;
    const cells = isCSU1 ? csu1Cells : csu2Cells;
    const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;

    if (cells[cellIndex]) {
      const updatedCell = { ...cells[cellIndex] };
      switch (instruction.command) {
        case "set_voltage":
          updatedCell.setVoltage = parseFloat(instruction.voltage) || updatedCell.setVoltage;
          break;
        case "set_balance":
          updatedCell.balancing = true;
          break;
        case "set_ow":
          updatedCell.openWire = true;
          break;
        case "set_temp":
          updatedCell.temperature = parseFloat(instruction.temperature) || updatedCell.temperature;
          break;
      }
      const updatedCells = [...cells];
      updatedCells[cellIndex] = updatedCell;
      setCells(updatedCells);
      console.log(`Renderer: Updated cell ${cellNo + 1} for command ${instruction.command}`);
    }
  };

  // Combine cells for Battery component
  const batteryCells = [...csu1Cells, ...csu2Cells];

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <MenuBar />
      <div className="flex-1 p-4">
        <div className="flex flex-row gap-4 items-start">
          <div>
            <Battery cells={batteryCells} setSelectedCell={() => {}} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex flex-row gap-3">
              <div className="flex flex-col gap-4">
                <CSU1 />
              </div>
              <div className="flex flex-col gap-4">
                <CSU2 />
              </div>
            </div>
            <div className="bg-white border rounded shadow p-4 min-w-[510px] mt-15">
              <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={csu2Cells} />
            </div>
          </div>
          <div>
            <DaicyChain />
          </div>
          <div className="flex flex-col gap-4 min-w-[260px] mt-10 ml-10">
            <div className="bg-white border rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Port Configuration</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="baudrate-select">
                    Baud Rate
                  </label>
                  <select
                    id="baudrate-select"
                    value={baudRate}
                    onChange={(e) => setBaudRate(parseInt(e.target.value))}
                    className="p-2 border rounded w-full"
                    title="Baud Rate"
                    aria-label="Baud Rate"
                  >
                    <option value={9600}>9600</option>
                    <option value={19200}>19200</option>
                    <option value={38400}>38400</option>
                    <option value={57600}>57600</option>
                    <option value={115200}>115200</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" htmlFor="port-select">
                    Serial Port
                  </label>
                  <select
                    id="port-select"
                    value={selectedPort}
                    onChange={(e) => setSelectedPort(e.target.value)}
                    className="p-2 border rounded w-full"
                    disabled={availablePorts.length === 0}
                    title="Available Serial Ports"
                    aria-label="Available Serial Ports"
                  >
                    {availablePorts.map((port) => (
                      <option key={port} value={port}>
                        {port}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={initializePort}
                    className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={isPortOpen || availablePorts.length === 0}
                  >
                    Initialize
                  </button>
                  <button
                    onClick={closePort}
                    className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    disabled={!isPortOpen}
                  >
                    Close
                  </button>
                  <button
                    onClick={refreshPorts}
                    className="flex-1 px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
                    disabled={isPortOpen}
                  >
                    Refresh
                  </button>
                </div>
                {isPortOpen && (
                  <div className="text-green-600 text-sm mt-1 text-center">
                    Port Open
                  </div>
                )}
                <div className="text-sm mt-2">
                  <span className="font-semibold">Last Serial Data (Hex):</span> {lastSerialData || "None"}
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={handleLoadInstructions}
                    className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                  >
                    Load Instructions
                  </button>
                  <button
                    onClick={handleClearInstructions}
                    className="px-3 py-1 bg-gray-300 text-black rounded hover:bg-gray-400"
                    disabled={instructions.length === 0}
                  >
                    Clear Instructions
                  </button>
                  <div className="text-sm">
                    <span className="font-semibold">Instructions Loaded:</span> {instructions.length}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".json"
                    title="Load instructions JSON file"
                  />
                </div>
              </div>
            </div>
            <InstructionRunner
              instructions={instructions}
              isPortOpen={isPortOpen}
              writeSerialData={writeSerialData}
              updateCellState={updateCellState}
            />
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default DashBoard;



