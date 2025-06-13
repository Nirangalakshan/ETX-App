// import React, { useState, useEffect } from 'react';
// import MenuBar from '../components/MenuBar';
// import Battery from '../components/Battery';
// import CSU1 from '../components/CSU1';
// import CSU2 from '../components/CSU2';
// import ErrorWarningPanel from '../components/ErrorWarningPanel';

// // Extend the Window interface to include serialAPI
// declare global {
//   interface Window {
//     serialAPI?: {
//       listPorts: () => Promise<string[]>;
//       openPort: (port: string, baudRate: number) => Promise<void>;
//       closePort: () => Promise<void>;
//     };
//   }
// }

// type CellStatus = 'normal' | 'warning' | 'critical';

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
//   const [selectedPort, setSelectedPort] = useState<string>('');
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
//       status: 'normal' as CellStatus,
//     }));
//     const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i + 12,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: 'normal' as CellStatus,
//     }));
//     setCSU1Cells(initialCSU1Cells);
//     setCSU2Cells(initialCSU2Cells);

//     const interval = setInterval(() => {
//       setCSU1Cells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';
//           return { ...cell, voltage, temperature, status };
//         })
//       );
//       setCSU2Cells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';
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
//         alert('Failed to initialize port. Ensure a device is connected.');
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
//         <div className="flex justify-start gap-4 items-start">
//           <Battery setSelectedCell={() => {}} />
//           <CSU1 />
//           <CSU2 />
//           {/* Serial config panel */}
//           <div className="bg-white border rounded shadow p-4 min-w-[220px] ml-4">
//             <h2 className="text-lg font-semibold mb-2">Port Configuration</h2>
//             <div className="flex flex-col gap-3">
//               <div>
//                 <label className="block text-sm font-medium mb-1" htmlFor="baudrate-select">
//                   Baud Rate
//                 </label>
//                 <select
//                   id="baudrate-select"
//                   value={baudRate}
//                   onChange={(e) => setBaudRate(parseInt(e.target.value))}
//                   className="p-2 border rounded w-full"
//                   title="Baud Rate"
//                   aria-label="Baud Rate"
//                 >
//                   <option value={9600}>9600</option>
//                   <option value={19200}>19200</option>
//                   <option value={38400}>38400</option>
//                   <option value={57600}>57600</option>
//                   <option value={115200}>115200</option>
//                 </select>
//               </div>
//               <div>
//                 <label className="block text-sm font-medium mb-1" htmlFor="port-select">
//                   Serial Port
//                 </label>
//                 <select
//                   id="port-select"
//                   value={selectedPort}
//                   onChange={(e) => setSelectedPort(e.target.value)}
//                   className="p-2 border rounded w-full"
//                   disabled={availablePorts.length === 0}
//                   title="Available Serial Ports"
//                   aria-label="Available Serial Ports"
//                 >
//                   {availablePorts.map((port) => (
//                     <option key={port} value={port}>{port}</option>
//                   ))}
//                 </select>
//               </div>
//               <div className="flex gap-2">
//                 <button
//                   onClick={initializePort}
//                   className="flex-1 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//                   disabled={isPortOpen || availablePorts.length === 0}
//                 >
//                   Initialize
//                 </button>
//                 <button
//                   onClick={closePort}
//                   className="flex-1 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
//                   disabled={!isPortOpen}
//                 >
//                   Close
//                 </button>
//               </div>
//               {isPortOpen && (
//                 <div className="text-green-600 text-sm mt-1 text-center">Port Open</div>
//               )}
//             </div>
//           </div>
//         </div>
//         <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={csu2Cells} />
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
import SerialTerminal from "../components/test";
import DaicyChain from "../components/DaicyChain";
import InstructionRunner from "../components/TestRun";

// Extend the Window interface to include serialAPI
declare global {
  interface Window {
    serialAPI?: {
      listPorts: () => Promise<string[]>;
      openPort: (port: string, baudRate: number) => Promise<void>;
      closePort: () => Promise<void>;
    };
  }
}

type CellStatus = "normal" | "warning" | "critical";

interface BatteryCell {
  id: number;
  voltage: number;
  temperature: number;
  status: CellStatus;
}

const DashBoard: React.FC = () => {
  const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
  const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [availablePorts, setAvailablePorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [isPortOpen, setIsPortOpen] = useState<boolean>(false);

  // Fetch available serial ports on mount
  useEffect(() => {
    if (window.serialAPI) {
      window.serialAPI.listPorts().then((ports: string[]) => {
        setAvailablePorts(ports);
        if (ports.length > 0) setSelectedPort(ports[0]);
      });
    }
  }, []);

  // Simulate fetching initial cell data from CSU1 and CSU2
  useEffect(() => {
    const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      voltage: 3.6,
      temperature: 25.0,
      status: "normal" as CellStatus,
    }));
    const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i + 12,
      voltage: 3.6,
      temperature: 25.0,
      status: "normal" as CellStatus,
    }));
    setCSU1Cells(initialCSU1Cells);
    setCSU2Cells(initialCSU2Cells);

    const interval = setInterval(() => {
      setCSU1Cells((prev) =>
        prev.map((cell) => {
          const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
          const temperature = +(Math.random() * 20 + 20).toFixed(1);
          const status: CellStatus =
            voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
          return { ...cell, voltage, temperature, status };
        })
      );
      setCSU2Cells((prev) =>
        prev.map((cell) => {
          const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
          const temperature = +(Math.random() * 20 + 20).toFixed(1);
          const status: CellStatus =
            voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
          return { ...cell, voltage, temperature, status };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Serial port actions via preload API
  const initializePort = async () => {
    if (window.serialAPI && selectedPort) {
      try {
        await window.serialAPI.openPort(selectedPort, baudRate);
        setIsPortOpen(true);
      } catch (error) {
        alert("Failed to initialize port. Ensure a device is connected.");
      }
    }
  };

  const closePort = async () => {
    if (window.serialAPI) {
      await window.serialAPI.closePort();
      setIsPortOpen(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <MenuBar />

      <div className="flex-1 p-4">
        <div className="flex flex-row gap-4 items-start">
          {/* Left column: Battery */}
          <div>
            <Battery setSelectedCell={() => {}} />
          </div>

          {/* Middle column: 2 columns for CSU1 and CSU2, each with its error panel */}
          <div className="flex flex-row gap-3">
            {/* CSU1 and its error panel */}
            <div className="flex flex-col gap-4">
              <CSU1 />
              <div className="bg-white border rounded shadow p-4 min-w-[250px] mt-19">
                <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={[]} />
              </div>
            </div>
            {/* CSU2 and its error panel */}
            <div className="flex flex-col gap-4">
              <CSU2 />
              <div className="bg-white border rounded shadow p-4 min-w-[250px] mt-19">
                <ErrorWarningPanel csu1Cells={[]} csu2Cells={csu2Cells} />
              </div>
            </div>
          </div>
          <div>
            <DaicyChain />
          </div>
          {/* Right column: Serial config panel + InstructionRunner */}
          <div className="flex flex-col gap-4 min-w-[260px]">
            <div className="bg-white border rounded shadow p-4">
              <h2 className="text-lg font-semibold mb-2">Port Configuration</h2>
              <div className="flex flex-col gap-3">
                <div>
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="baudrate-select"
                  >
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
                  <label
                    className="block text-sm font-medium mb-1"
                    htmlFor="port-select"
                  >
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
                </div>
                {isPortOpen && (
                  <div className="text-green-600 text-sm mt-1 text-center">
                    Port Open
                  </div>
                )}
              </div>
            </div>
            {/* InstructionRunner placed directly below port config */}
            <InstructionRunner />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashBoard;