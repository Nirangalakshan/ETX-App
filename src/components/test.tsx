//rightone
// import React, { useEffect, useState, useRef } from "react";

// interface ResponseData {
//   command: string;
//   value: string;
// }

// interface SerialTerminalProps {
//   responseData: Record<number, ResponseData[]>;
//   setResponseData: React.Dispatch<
//     React.SetStateAction<Record<number, ResponseData[]>>
//   >;
// }

// const instructionToHexMap: Record<
//   string,
//   {
//     commandCode: string;
//     functionCode: string;
//     cellNoRange?: [number, number];
//     valueType?: string;
//   }
// > = {
//   get_voltage: {
//     commandCode: "04",
//     functionCode: "01",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_temp: {
//     commandCode: "04",
//     functionCode: "02",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_current: {
//     commandCode: "04",
//     functionCode: "03",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_cell_temp_res: {
//     commandCode: "04",
//     functionCode: "04",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_dc_csu_volt: {
//     commandCode: "04",
//     functionCode: "05",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_dc_csu_temp: {
//     commandCode: "04",
//     functionCode: "06",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_dc_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "07",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_dc_csu_ow: {
//     commandCode: "04",
//     functionCode: "08",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_11_csu_volt: {
//     commandCode: "04",
//     functionCode: "09",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_11_csu_temp: {
//     commandCode: "04",
//     functionCode: "0A",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_11_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "0B",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_11_csu_ow: {
//     commandCode: "04",
//     functionCode: "0C",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_12_csu_volt: {
//     commandCode: "04",
//     functionCode: "0D",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_12_csu_temp: {
//     commandCode: "04",
//     functionCode: "0E",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_12_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "0F",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_12_csu_ow: {
//     commandCode: "04",
//     functionCode: "10",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   set_voltage: {
//     commandCode: "03",
//     functionCode: "01",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   set_temp: {
//     commandCode: "03",
//     functionCode: "02",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   set_balance: {
//     commandCode: "03",
//     functionCode: "03",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   set_ow: {
//     commandCode: "03",
//     functionCode: "04",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   set_daisy_chain: {
//     commandCode: "03",
//     functionCode: "05",
//     valueType: "binary",
//   },
//   set_delay: { commandCode: "03", functionCode: "06", valueType: "int" },
//   set_cell_led: { commandCode: "03", functionCode: "07", valueType: "binary" },
//   set_automatic_sequence: {
//     commandCode: "03",
//     functionCode: "08",
//     valueType: "binary",
//   },
//   get_voltage_limits: {
//     commandCode: "A6",
//     functionCode: "D1",
//     valueType: "voltage_limits",
//   },
// };

// const baudRates = [
//   300, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200,
//   128000, 256000,
// ];

// const calculateCRC16 = (data: number[]): number => {
//   let crc = 0xffff;
//   const polynomial = 0xa001;

//   for (const byte of data) {
//     crc ^= byte;
//     for (let i = 0; i < 8; i++) {
//       const lsb = crc & 0x0001;
//       crc >>= 1;
//       if (lsb) crc ^= polynomial;
//     }
//   }
//   return crc;
// };

// const SerialTerminal: React.FC<SerialTerminalProps> = ({
//   responseData,
//   setResponseData,
// }) => {
//   const [ports, setPorts] = useState<string[]>([]);
//   const [selectedPort, setSelectedPort] = useState<string>("");
//   const [baudRate, setBaudRate] = useState<number>(() => {
//     const saved = localStorage.getItem("serialBaudRate");
//     return saved ? Number(saved) : 9600;
//   });
//   const [isOpen, setIsOpen] = useState(false);
//   const [received, setReceived] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [fileName, setFileName] = useState<string>("");
//   const [hexLines, setHexLines] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastGetCommand, setLastGetCommand] = useState<{
//     command: string;
//     cellNo?: number;
//   } | null>(null);

//   // ⬇️ these are new
// const lastGetCommandRef = useRef(lastGetCommand);
// const setReceivedRef = useRef(setReceived);


// useEffect(() => {
//   lastGetCommandRef.current = lastGetCommand;
// }, [lastGetCommand]);

// useEffect(() => {
//   setReceivedRef.current = setReceived;
// }, [setReceived]);



//   useEffect(() => {
//     localStorage.setItem("serialBaudRate", baudRate.toString());
//   }, [baudRate]);

//   useEffect(() => {
//     loadPorts();
//   }, []);

// useEffect(() => {
//   if (!window.serialAPI?.onSerialData) return;

//   const handler = (data: { hex: string; parsed: string | null }) => {
//     const timestamp = new Date().toLocaleTimeString();

//     const line = data.parsed
//       ? `[${timestamp}] Received HEX: ${data.hex} → ${data.parsed}`
//       : `[${timestamp}] Received HEX: ${data.hex}`;

//     setReceived((prev) => [...prev, line]);
//   };

//   window.serialAPI.onSerialData(handler);

//   return () => {
//     window.serialAPI.removeSerialDataListener?.();
//   };
// }, []);




//   const loadPorts = async () => {
//     setError(null);
//     try {
//       // @ts-ignore
//       const newPorts = await window.serialAPI.listPorts();
//       setPorts(newPorts);
//       if (newPorts.includes(selectedPort)) {
//       } else if (newPorts.length > 0) {
//         setSelectedPort(newPorts[0]);
//       } else {
//         setSelectedPort("");
//       }
//     } catch (err: any) {
//       setError("Failed to load ports: " + err.message);
//     }
//   };

//   const handleOpen = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       // @ts-ignore
//       await window.serialAPI.openPort(selectedPort, baudRate);
//       setIsOpen(true);
//     } catch (err: any) {
//       setError("Failed to open port: " + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClose = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       // @ts-ignore
//       await window.serialAPI.closePort();
//       setIsOpen(false);
//     } catch (err: any) {
//       setError("Failed to close port: " + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setFileName(file.name);
//     setHexLines([]);
//     setError(null);

//     try {
//       const text = await file.text();
//       const json = JSON.parse(text);

//       if (!Array.isArray(json)) {
//         setError("JSON must be an array of instruction objects.");
//         return;
//       }

//       const allHex: string[] = [];

//       for (const entry of json) {
//         let command = (entry.command || "").toLowerCase();
//         if (command === "get_temperature") {
//           command = "get_temp";
//         }

//         if (!command || !instructionToHexMap[command]) {
//           setError(`Invalid or unmapped command: ${entry.command}`);
//           continue;
//         }

//         const { commandCode, functionCode, cellNoRange, valueType } =
//           instructionToHexMap[command];
//         const frame: number[] = [
//           0x07,
//           parseInt(commandCode, 16),
//           parseInt(functionCode, 16),
//         ];

//         if (cellNoRange) {
//           const cellNo = parseInt(entry.cellNo, 10);
//           if (
//             isNaN(cellNo) ||
//             cellNo < cellNoRange[0] ||
//             cellNo > cellNoRange[1]
//           ) {
//             setError(`Invalid cellNo for ${command}: ${entry.cellNo}`);
//             continue;
//           }
//           frame.push(cellNo);
//         }

//         if (commandCode === "03") {
//           if (valueType === "float") {
//             const value = parseFloat(entry.voltage);
//             if (isNaN(value) || value < 2.0 || value > 4.2) {
//               setError(`Invalid voltage for ${command}: ${entry.voltage}`);
//               continue;
//             }
//             const valueInt = Math.round(value * 1000);
//             frame.push((valueInt >> 24) & 0xff, (valueInt >> 16) & 0xff, (valueInt >> 8) & 0xff, valueInt & 0xff);
//           } else if (valueType === "int") {
//             const value = parseInt(entry.temperature || entry.time, 10);
//             if (isNaN(value) || value < -20 || value > 100) {
//               setError(
//                 `Invalid temperature or time for ${command}: ${entry.temperature || entry.time}`
//               );
//               continue;
//             }
//             frame.push(value & 0xff);
//           } else if (valueType === "binary") {
//             const value =
//               entry.value !== undefined ? parseInt(entry.value, 10) : 1;
//             if (value !== 0 && value !== 1) {
//               setError(`Invalid binary value for ${command}: ${entry.value}`);
//               continue;
//             }
//             frame.push(value);
//           } else {
//             setError(`Unsupported value type for ${command}`);
//             continue;
//           }
//         }

//         const crc = calculateCRC16(frame);
//         frame.push(crc & 0xff, (crc >> 8) & 0xff);

//         const hexFrame = frame
//           .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
//           .join(" ");
//         allHex.push(hexFrame);
//       }

//       if (allHex.length === 0) {
//         setError("No valid commands processed.");
//       } else {
//         setHexLines(allHex);
//         const timestamp = new Date().toLocaleTimeString();
//         setReceived((prev) => [
//           ...prev,
//           `[${timestamp}] Hex frames ready:`,
//           ...allHex,
//         ]);
//       }
//     } catch (err: any) {
//       setError("Failed to process file: " + err.message);
//     }
//   };

//   const handleRunTest = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       for (const hexLine of hexLines) {
//         const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
//         const byteBuffer = new Uint8Array(hexArray);

//         const [, commandCode, functionCode, cellNo] = hexArray;
//         const commandEntry = Object.entries(instructionToHexMap).find(
//           ([, { commandCode: cc, functionCode: fc }]) =>
//             parseInt(cc, 16) === commandCode &&
//             parseInt(fc, 16) === functionCode
//         );

//         if (commandEntry) {
//           setLastGetCommand({ command: commandEntry[0], cellNo });
//         } else {
//           setLastGetCommand(null);
//         }

//         // @ts-ignore
//         await window.serialAPI.writePortRaw(byteBuffer);

//         const timestamp = new Date().toLocaleTimeString();
//         setReceived((prev) => [
//           ...prev,
//           `[${timestamp}] Sent (raw): ${hexLine}`,
//         ]);

//         if (commandCode === 0x04 || commandCode === 0xA6) {
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         } else {
//           await new Promise((resolve) => setTimeout(resolve, 100));
//         }
//       }

//       const timestamp = new Date().toLocaleTimeString();
//       setReceived((prev) => [
//         ...prev,
//         `[${timestamp}] ✅ Test sent successfully.`,
//       ]);

//       // @ts-ignore
//       if (window.serialAPI.isPortOpen) {
//         // @ts-ignore
//         const isPortOpen = await window.serialAPI.isPortOpen();
//         if (!isPortOpen) {
//           setError("Port disconnected during test. Attempting to reconnect...");
//           await handleOpen();
//         }
//       }
//     } catch (err: any) {
//       setError("Failed to send test data: " + err.message);
//     } finally {
//       setIsLoading(false);
//       setLastGetCommand(null);
//     }
//   };

//   const handleClearOutput = () => {
//     setReceived([]);
//     setResponseData({});
//   };

//   return (
//     <div className="w-100 mx-2 p-4 bg-white shadow-lg rounded-xl mt-8 space-y-4 border border-gray-200">
//       <h2 className="text-2xl font-bold text-gray-900 text-center">
//         🔌 BMS TEST RUN
//       </h2>

//       <div className="flex justify-center">
//         <div
//           className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
//             ${
//               isOpen
//                 ? "bg-green-100 text-green-800 shadow-green-300 shadow-md animate-pulse"
//                 : "bg-red-100 text-red-700 border border-red-300"
//             }`}
//         >
//           <span
//             className={`inline-block w-2.5 h-2.5 rounded-full ${
//               isOpen ? "bg-green-600" : "bg-red-600"
//             }`}
//           />
//           {isOpen ? "Connected" : "Disconnected"}
//         </div>
//       </div>

//       <div className="space-y-4">
//         <div className="flex items-end gap-2">
//           <div className="flex flex-col flex-1">
//             <label className="text-xs font-medium text-gray-700">
//               Serial Port
//             </label>
//             <select
//               value={selectedPort}
//               onChange={(e) => setSelectedPort(e.target.value)}
//               disabled={isOpen || isLoading}
//               className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
//             >
//               {ports.length === 0 ? (
//                 <option value="">No ports available</option>
//               ) : (
//                 ports.map((port) => (
//                   <option key={port} value={port}>
//                     {port}
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>
//           <button
//             onClick={loadPorts}
//             disabled={isOpen || isLoading}
//             className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors text-sm"
//             title="Refresh Ports"
//           >
//             🔄
//           </button>
//         </div>

//         <div className="flex flex-col">
//           <label className="text-xs font-medium text-gray-700">Baud Rate</label>
//           <select
//             value={baudRate}
//             onChange={(e) => setBaudRate(Number(e.target.value))}
//             disabled={isOpen || isLoading}
//             className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
//           >
//             {baudRates.map((rate) => (
//               <option key={rate} value={rate}>
//                 {rate} bps
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex gap-2">
//           {!isOpen ? (
//             <button
//               onClick={handleOpen}
//               disabled={isLoading || !selectedPort}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//             >
//               {isLoading ? (
//                 <svg
//                   className="animate-spin h-4 w-4 mr-2 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                   />
//                 </svg>
//               ) : null}
//               Open Port
//             </button>
//           ) : (
//             <button
//               onClick={handleClose}
//               disabled={isLoading}
//               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//             >
//               {isLoading ? (
//                 <svg
//                   className="animate-spin h-4 w-4 mr-2 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                   />
//                 </svg>
//               ) : null}
//               Close Port
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="relative group">
//         <label className="text-xs font-medium text-gray-700">
//           📁 Upload JSON Instructions
//         </label>
//         <input
//           type="file"
//           accept=".json"
//           onChange={handleFileChange}
//           disabled={!isOpen || isLoading}
//           className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
//         />
//         <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
//           Upload a JSON file with BMS commands (e.g., set_voltage, get_voltage)
//         </div>
//         {fileName && (
//           <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
//         )}
//       </div>

//       {hexLines.length > 0 && (
//         <button
//           onClick={handleRunTest}
//           disabled={!isOpen || isLoading}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//         >
//           {isLoading ? (
//             <svg
//               className="animate-spin h-4 w-4 mr-2 text-white"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//                 fill="none"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//               />
//             </svg>
//           ) : null}
//           ▶️ Run Test
//         </button>
//       )}

//       {error && (
//         <div className="p-2 bg-red-100 text-red-700 font-semibold rounded-lg text-sm animate-pulse">
//           {error}
//         </div>
//       )}

//       {Object.keys(responseData).length > 0 && (
//         <div className="space-y-2">
//           <label className="text-xs font-medium text-gray-700">
//             Response Data
//           </label>
//           <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm shadow-inner">
//             {Object.entries(responseData).map(([cellId, dataItems]) => (
//               <div key={cellId} className="text-gray-800 break-all mb-2">
//                 <div className="font-semibold">Cell {cellId}</div>
//                 {dataItems.map((item, idx) => (
//                   <div key={idx} className="ml-4">
//                     {item.command.replace("get_", "").replace(/_/g, " ")}:{" "}
//                     {item.value}
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="space-y-2">
//         <div className="flex justify-between items-center">
//           <label className="text-xs font-medium text-gray-700">
//             Output Console
//           </label>
//           {received.length > 0 && (
//             <button
//               onClick={handleClearOutput}
//               className="text-xs text-blue-600 hover:text-blue-800"
//             >
//               Clear Output
//             </button>
//           )}
//         </div>
//         <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner" style={{ textTransform: "none" }}>
//           {received.length === 0 ? (
//             <p className="text-gray-400">No data received yet.</p>
//           ) : (
//             received.map((line, idx) => (
//               <div key={idx}>{line}</div>
//             ))
            
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SerialTerminal;











//rightone 2

// import React, { useEffect, useState, useRef } from "react";

// interface ResponseData {
//   command: string;
//   value: string;
// }

// interface SerialTerminalProps {
//   responseData: Record<number, ResponseData[]>;
//   setResponseData: React.Dispatch<
//     React.SetStateAction<Record<number, ResponseData[]>>
//   >;
//   updateCellVoltage: (cellId: number, voltage: number) => void;
// }

// const instructionToHexMap: Record<
//   string,
//   {
//     commandCode: string;
//     functionCode: string;
//     cellNoRange?: [number, number];
//     valueType?: string;
//   }
// > = {
//   get_voltage: {
//     commandCode: "04",
//     functionCode: "01",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_temp: {
//     commandCode: "04",
//     functionCode: "02",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_current: {
//     commandCode: "04",
//     functionCode: "03",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_cell_temp_res: {
//     commandCode: "04",
//     functionCode: "04",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_dc_csu_volt: {
//     commandCode: "04",
//     functionCode: "05",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_dc_csu_temp: {
//     commandCode: "04",
//     functionCode: "06",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_dc_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "07",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_dc_csu_ow: {
//     commandCode: "04",
//     functionCode: "08",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_11_csu_volt: {
//     commandCode: "04",
//     functionCode: "09",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_11_csu_temp: {
//     commandCode: "04",
//     functionCode: "0A",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_11_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "0B",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_11_csu_ow: {
//     commandCode: "04",
//     functionCode: "0C",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   get_12_csu_volt: {
//     commandCode: "04",
//     functionCode: "0D",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   get_12_csu_temp: {
//     commandCode: "04",
//     functionCode: "0E",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   get_12_csu_balance_reg: {
//     commandCode: "04",
//     functionCode: "0F",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   get_12_csu_ow: {
//     commandCode: "04",
//     functionCode: "10",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   set_voltage: {
//     commandCode: "03",
//     functionCode: "01",
//     cellNoRange: [0, 22],
//     valueType: "float",
//   },
//   set_temp: {
//     commandCode: "03",
//     functionCode: "02",
//     cellNoRange: [0, 5],
//     valueType: "int",
//   },
//   set_balance: {
//     commandCode: "03",
//     functionCode: "03",
//     cellNoRange: [0, 22],
//     valueType: "binary",
//   },
//   set_ow: {
//     commandCode: "03",
//     functionCode: "04",
//     cellNoRange: [0, 23],
//     valueType: "binary",
//   },
//   set_daisy_chain: {
//     commandCode: "03",
//     functionCode: "05",
//     valueType: "binary",
//   },
//   set_delay: { commandCode: "03", functionCode: "06", valueType: "int" },
//   set_cell_led: { commandCode: "03", functionCode: "07", valueType: "binary" },
//   set_automatic_sequence: {
//     commandCode: "03",
//     functionCode: "08",
//     valueType: "binary",
//   },
//   get_voltage_limits: {
//     commandCode: "A6",
//     functionCode: "D1",
//     valueType: "voltage_limits",
//   },
// };

// const baudRates = [
//   300, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200,
//   128000, 256000,
// ];

// const calculateCRC16 = (data: number[]): number => {
//   let crc = 0xffff;
//   const polynomial = 0xa001;

//   for (const byte of data) {
//     crc ^= byte;
//     for (let i = 0; i < 8; i++) {
//       const lsb = crc & 0x0001;
//       crc >>= 1;
//       if (lsb) crc ^= polynomial;
//     }
//   }
//   return crc;
// };

// const SerialTerminal: React.FC<SerialTerminalProps> = ({
//   responseData,
//   setResponseData,
//   updateCellVoltage,
// }) => {
//   const [ports, setPorts] = useState<string[]>([]);
//   const [selectedPort, setSelectedPort] = useState<string>("");
//   const [baudRate, setBaudRate] = useState<number>(() => {
//     const saved = localStorage.getItem("serialBaudRate");
//     return saved ? Number(saved) : 9600;
//   });
//   const [isOpen, setIsOpen] = useState(false);
//   const [received, setReceived] = useState<string[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [fileName, setFileName] = useState<string>("");
//   const [hexLines, setHexLines] = useState<string[]>([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [lastSentCommand, setLastSentCommand] = useState<{
//     command: string;
//     cellNo?: number;
//   } | null>(null);

//   const lastSentCommandRef = useRef(lastSentCommand);
//   const setReceivedRef = useRef(setReceived);

//   useEffect(() => {
//     lastSentCommandRef.current = lastSentCommand;
//   }, [lastSentCommand]);

//   useEffect(() => {
//     setReceivedRef.current = setReceived;
//   }, [setReceived]);

//   useEffect(() => {
//     localStorage.setItem("serialBaudRate", baudRate.toString());
//   }, [baudRate]);

//   useEffect(() => {
//     loadPorts();
//     console.log("SerialTerminal: Checking serialAPI availability:", !!window.serialAPI);
//     if (!window.serialAPI) {
//       setError("Serial API not available. Ensure the app is running in a supported environment.");
//     }
//   }, []);

//   useEffect(() => {
//     if (!window.serialAPI?.onSerialData) {
//       console.warn("SerialTerminal: serialAPI.onSerialData not available");
//       return;
//     }

//     const handler = (data: { hex: string; parsed: string | null }) => {
//       console.log("SerialTerminal: Received serial data:", data);
//       const timestamp = new Date().toLocaleTimeString();
//       const logLine = data.parsed
//         ? `[${timestamp}] Received HEX: ${data.hex} → Parsed: ${data.parsed}`
//         : `[${timestamp}] Received HEX: ${data.hex} → No parsed data`;
//       setReceivedRef.current((prev) => [...prev, logLine]);

//       const hexArray = data.hex.split(" ").map((hex) => parseInt(hex, 16));
//       if (hexArray.length < 3) {
//         console.warn("SerialTerminal: Invalid hex data format:", data.hex);
//         return;
//       }

//       const [, commandCode, functionCode, cellNo] = hexArray;
//       const commandEntry = Object.entries(instructionToHexMap).find(
//         ([, { commandCode: cc, functionCode: fc }]) =>
//           parseInt(cc, 16) === commandCode && parseInt(fc, 16) === functionCode
//       );

//       if (!commandEntry || data.parsed === null) {
//         console.warn(
//           `SerialTerminal: Unknown command or no parsed data (commandCode: ${commandCode.toString(16)}, functionCode: ${functionCode.toString(16)})`
//         );
//         return;
//       }

//       const command = commandEntry[0];
//       const cellNumber = commandEntry[1].cellNoRange && !isNaN(cellNo) ? cellNo : undefined;

//       if (cellNumber !== undefined && commandEntry[1].cellNoRange) {
//         if (cellNo < commandEntry[1].cellNoRange[0] || cellNo > commandEntry[1].cellNoRange[1]) {
//           console.warn(`SerialTerminal: Invalid cellNo ${cellNo} for command ${command}`);
//           return;
//         }

//         if (
//           ["get_voltage", "get_dc_csu_volt", "get_11_csu_volt", "get_12_csu_volt"].includes(command)
//         ) {
//           const voltageValue = parseFloat(data.parsed);
//           if (!isNaN(voltageValue)) {
//             console.log(`SerialTerminal: Updating cell ${cellNumber} with voltage ${voltageValue}`);
//             updateCellVoltage(cellNumber, voltageValue);
//           } else {
//             console.warn(`SerialTerminal: Invalid voltage parsed: ${data.parsed}`);
//           }
//         }

//         setResponseData((prevData) => {
//           const existingDataForCell = prevData[cellNumber] || [];
//           const newResponseEntry: ResponseData = { command, value: data.parsed };
//           console.log(`SerialTerminal: Updated responseData for cell ${cellNumber}:`, newResponseEntry);
//           return {
//             ...prevData,
//             [cellNumber]: [...existingDataForCell, newResponseEntry],
//           };
//         });
//       } else if (command === "get_voltage_limits") {
//         setResponseData((prevData) => {
//           const existingDataForCell = prevData[0] || [];
//           const newResponseEntry: ResponseData = { command, value: data.parsed };
//           console.log("SerialTerminal: Updated responseData for voltage_limits:", newResponseEntry);
//           return {
//             ...prevData,
//             0: [...existingDataForCell, newResponseEntry],
//           };
//         });
//       }
//     };

//     window.serialAPI.onSerialData(handler);

//     return () => {
//       window.serialAPI.removeSerialDataListener?.();
//     };
//   }, [setResponseData, updateCellVoltage]);

//   const loadPorts = async () => {
//     setError(null);
//     try {
//       await window.serialAPI?.listPorts().then((newPorts: string[]) => {
//         setPorts(newPorts);
//         if (newPorts.length > 0 && !newPorts.includes(selectedPort)) {
//           setSelectedPort(newPorts[0]);
//         } else if (newPorts.length === 0) {
//           setSelectedPort("");
//         }
//       });
//     } catch (err: any) {
//       setError("Failed to load ports: " + err.message);
//     }
//   };

//   const handleOpen = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       await window.serialAPI?.openPort(selectedPort, baudRate);
//       setIsOpen(true);
//       console.log("SerialTerminal: Port opened successfully");
//     } catch (err: any) {
//       setError("Failed to open port: " + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleClose = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       await window.serialAPI?.closePort();
//       setIsOpen(false);
//       console.log("SerialTerminal: Port closed successfully");
//     } catch (err: any) {
//       setError("Failed to close port: " + err.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;

//     setFileName(file.name);
//     setHexLines([]);
//     setError(null);

//     try {
//       const text = await file.text();
//       const json = JSON.parse(text);

//       if (!Array.isArray(json)) {
//         setError("JSON must be an array of instruction objects.");
//         return;
//       }

//       const allHex: string[] = [];

//       for (const entry of json) {
//         let command = (entry.command || "").toLowerCase();
//         if (command === "get_temperature") {
//           command = "get_temp";
//         }

//         if (!command || !instructionToHexMap[command]) {
//           setError(`Invalid or unmapped command: ${entry.command}`);
//           continue;
//         }

//         const { commandCode, functionCode, cellNoRange, valueType } =
//           instructionToHexMap[command];
//         const frame: number[] = [
//           0x07,
//           parseInt(commandCode, 16),
//           parseInt(functionCode, 16),
//         ];

//         if (cellNoRange) {
//           const cellNo = parseInt(entry.cellNo, 10);
//           if (
//             isNaN(cellNo) ||
//             cellNo < cellNoRange[0] ||
//             cellNo > cellNoRange[1]
//           ) {
//             setError(`Invalid cellNo for ${command}: ${entry.cellNo}`);
//             continue;
//           }
//           frame.push(cellNo);
//         }

//         if (commandCode === "03") {
//           if (valueType === "float") {
//             const value = parseFloat(entry.voltage);
//             if (isNaN(value) || value < 2.0 || value > 4.2) {
//               setError(`Invalid voltage for ${command}: ${entry.voltage}`);
//               continue;
//             }
//             const valueInt = Math.round(value * 1000);
//             frame.push(
//               (valueInt >> 24) & 0xff,
//               (valueInt >> 16) & 0xff,
//               (valueInt >> 8) & 0xff,
//               valueInt & 0xff
//             );
//           } else if (valueType === "int") {
//             const value = parseInt(entry.temperature || entry.time, 10);
//             if (isNaN(value) || value < -20 || value > 100) {
//               setError(
//                 `Invalid temperature or time for ${command}: ${
//                   entry.temperature || entry.time
//                 }`
//               );
//               continue;
//             }
//             frame.push(value & 0xff);
//           } else if (valueType === "binary") {
//             const value =
//               entry.value !== undefined ? parseInt(entry.value, 10) : 1;
//             if (value !== 0 && value !== 1) {
//               setError(`Invalid binary value for ${command}: ${entry.value}`);
//               continue;
//             }
//             frame.push(value);
//           } else {
//             setError(`Unsupported value type for ${command}`);
//             continue;
//           }
//         }

//         const crc = calculateCRC16(frame);
//         frame.push(crc & 0xff, (crc >> 8) & 0xff);

//         const hexFrame = frame
//           .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
//           .join(" ");
//         allHex.push(hexFrame);
//       }

//       if (allHex.length === 0) {
//         setError("No valid commands processed.");
//       } else {
//         setHexLines(allHex);
//         const timestamp = new Date().toLocaleTimeString();
//         setReceived((prev) => [
//           ...prev,
//           `[${timestamp}] Hex frames ready:`,
//           ...allHex,
//         ]);
//       }
//     } catch (err: any) {
//       setError("Failed to process file: " + err.message);
//     }
//   };

//   const handleRunTest = async () => {
//     setError(null);
//     setIsLoading(true);
//     try {
//       for (const hexLine of hexLines) {
//         const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
//         const [, commandCode, functionCode, cellNo] = hexArray;
//         const commandEntry = Object.entries(instructionToHexMap).find(
//           ([, { commandCode: cc, functionCode: fc }]) =>
//             parseInt(cc, 16) === commandCode && parseInt(fc, 16) === functionCode
//         );

//         if (commandEntry) {
//           console.log(`SerialTerminal: Setting lastSentCommand to ${commandEntry[0]} for cell ${cellNo}`);
//           setLastSentCommand({ command: commandEntry[0], cellNo });
//         } else {
//           setLastSentCommand(null);
//         }

//         const byteBuffer = new Uint8Array(hexArray);
//         await window.serialAPI?.writePortRaw(byteBuffer);

//         const timestamp = new Date().toLocaleTimeString();
//         setReceived((prev) => [
//           ...prev,
//           `[${timestamp}] Sent (raw): ${hexLine}`,
//         ]);

//         if (commandCode === 0x04 || commandCode === 0xA6) {
//           await new Promise((resolve) => setTimeout(resolve, 1000));
//         } else {
//           await new Promise((resolve) => setTimeout(resolve, 100));
//         }
//       }

//       const timestamp = new Date().toLocaleTimeString();
//       setReceived((prev) => [
//         ...prev,
//         `[${timestamp}] ✅ Test sent successfully.`,
//       ]);

//       if (window.serialAPI?.isPortOpen) {
//         const isPortOpen = await window.serialAPI.isPortOpen();
//         if (!isPortOpen) {
//           setError("Port disconnected during test. Attempting to reconnect...");
//           await handleOpen();
//         }
//       }
//     } catch (err: any) {
//       setError("Failed to send test data: " + err.message);
//     } finally {
//       setIsLoading(false);
//       setLastSentCommand(null);
//     }
//   };

//   const handleClearOutput = () => {
//     setReceived([]);
//     setResponseData({});
//   };

//   return (
//     <div className="w-100 mx-2 p-4 bg-white shadow-lg rounded-xl mt-8 space-y-4 border border-gray-200">
//       <h2 className="text-2xl font-bold text-gray-900 text-center">
//         🔌 BMS TEST RUN
//       </h2>

//       <div className="flex justify-center">
//         <div
//           className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
//             ${
//               isOpen
//                 ? "bg-green-100 text-green-800 shadow-green-300 shadow-md animate-pulse"
//                 : "bg-red-100 text-red-700 border border-red-300"
//             }`}
//         >
//           <span
//             className={`inline-block w-2.5 h-2.5 rounded-full ${
//               isOpen ? "bg-green-600" : "bg-red-600"
//             }`}
//           />
//           {isOpen ? "Connected" : "Disconnected"}
//         </div>
//       </div>

//       <div className="space-y-4">
//         <div className="flex items-end gap-2">
//           <div className="flex flex-col flex-1">
//             <label className="text-xs font-medium text-gray-700">
//               Serial Port
//             </label>
//             <select
//               value={selectedPort}
//               onChange={(e) => setSelectedPort(e.target.value)}
//               disabled={isOpen || isLoading}
//               className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
//             >
//               {ports.length === 0 ? (
//                 <option value="">No ports available</option>
//               ) : (
//                 ports.map((port) => (
//                   <option key={port} value={port}>
//                     {port}
//                   </option>
//                 ))
//               )}
//             </select>
//           </div>
//           <button
//             onClick={loadPorts}
//             disabled={isOpen || isLoading}
//             className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors text-sm"
//             title="Refresh Ports"
//           >
//             🔄
//           </button>
//         </div>

//         <div className="flex flex-col">
//           <label className="text-xs font-medium text-gray-700">Baud Rate</label>
//           <select
//             value={baudRate}
//             onChange={(e) => setBaudRate(Number(e.target.value))}
//             disabled={isOpen || isLoading}
//             className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
//           >
//             {baudRates.map((rate) => (
//               <option key={rate} value={rate}>
//                 {rate} bps
//               </option>
//             ))}
//           </select>
//         </div>

//         <div className="flex gap-2">
//           {!isOpen ? (
//             <button
//               onClick={handleOpen}
//               disabled={isLoading || !selectedPort}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//             >
//               {isLoading ? (
//                 <svg
//                   className="animate-spin h-4 w-4 mr-2 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                   />
//                 </svg>
//               ) : null}
//               Open Port
//             </button>
//           ) : (
//             <button
//               onClick={handleClose}
//               disabled={isLoading}
//               className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//             >
//               {isLoading ? (
//                 <svg
//                   className="animate-spin h-4 w-4 mr-2 text-white"
//                   viewBox="0 0 24 24"
//                 >
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//                   />
//                 </svg>
//               ) : null}
//               Close Port
//             </button>
//           )}
//         </div>
//       </div>

//       <div className="relative group">
//         <label className="text-xs font-medium text-gray-700">
//           📁 Upload JSON Instructions
//         </label>
//         <input
//           type="file"
//           accept=".json"
//           onChange={handleFileChange}
//           disabled={!isOpen || isLoading}
//           className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
//         />
//         <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
//           Upload a JSON file with BMS commands (e.g., set_voltage, get_voltage)
//         </div>
//         {fileName && (
//           <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
//         )}
//       </div>

//       {hexLines.length > 0 && (
//         <button
//           onClick={handleRunTest}
//           disabled={!isOpen || isLoading}
//           className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
//         >
//           {isLoading ? (
//             <svg
//               className="animate-spin h-4 w-4 mr-2 text-white"
//               viewBox="0 0 24 24"
//             >
//               <circle
//                 className="opacity-25"
//                 cx="12"
//                 cy="12"
//                 r="10"
//                 stroke="currentColor"
//                 strokeWidth="4"
//                 fill="none"
//               />
//               <path
//                 className="opacity-75"
//                 fill="currentColor"
//                 d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
//               />
//             </svg>
//           ) : null}
//           ▶️ Run Test
//         </button>
//       )}

//       {error && (
//         <div className="p-2 bg-red-100 text-red-700 font-semibold rounded-lg text-sm animate-pulse">
//           {error}
//         </div>
//       )}

//       {Object.keys(responseData).length > 0 && (
//         <div className="space-y-2">
//           <label className="text-xs font-medium text-gray-700">
//             Response Data
//           </label>
//           <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm shadow-inner">
//             {Object.entries(responseData).map(([cellId, dataItems]) => (
//               <div key={cellId} className="text-gray-800 break-all mb-2">
//                 <div className="font-semibold">Cell {cellId}</div>
//                 {dataItems.map((item, idx) => (
//                   <div key={idx} className="ml-4">
//                     {item.command.replace("get_", "").replace(/_/g, " ")}:{" "}
//                     {item.value}
//                   </div>
//                 ))}
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       <div className="space-y-2">
//         <div className="flex justify-between items-center">
//           <label className="text-xs font-medium text-gray-700">
//             Output Console
//           </label>
//           {received.length > 0 && (
//             <button
//               onClick={handleClearOutput}
//               className="text-xs text-blue-600 hover:text-blue-800"
//             >
//               Clear Output
//             </button>
//           )}
//         </div>
//         <div
//           className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner"
//           style={{ textTransform: "none" }}
//         >
//           {received.length === 0 ? (
//             <p className="text-gray-400">No data received yet.</p>
//           ) : (
//             received.map((line, idx) => <div key={idx}>{line}</div>)
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SerialTerminal;











import React, { useEffect, useState, useRef } from "react";

interface ResponseData {
  command: string;
  value: string;
}

interface SerialTerminalProps {
  responseData: Record<number, ResponseData[]>;
  setResponseData: React.Dispatch<
    React.SetStateAction<Record<number, ResponseData[]>>
  >;
  updateCellVoltage: (cellId: number, voltage: number) => void;
}

const instructionToHexMap: Record<
  string,
  {
    commandCode: string;
    functionCode: string;
    cellNoRange?: [number, number];
    valueType?: string;
  }
> = {
  get_voltage: {
    commandCode: "04",
    functionCode: "01",
    cellNoRange: [0, 22],
    valueType: "float",
  },
  get_temp: {
    commandCode: "04",
    functionCode: "02",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_current: {
    commandCode: "04",
    functionCode: "03",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_cell_temp_res: {
    commandCode: "04",
    functionCode: "04",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_dc_csu_volt: {
    commandCode: "04",
    functionCode: "05",
    cellNoRange: [0, 22],
    valueType: "float",
  },
  get_dc_csu_temp: {
    commandCode: "04",
    functionCode: "06",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_dc_csu_balance_reg: {
    commandCode: "04",
    functionCode: "07",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_dc_csu_ow: {
    commandCode: "04",
    functionCode: "08",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_11_csu_volt: {
    commandCode: "04",
    functionCode: "09",
    cellNoRange: [0, 22],
    valueType: "float",
  },
  get_11_csu_temp: {
    commandCode: "04",
    functionCode: "0A",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_11_csu_balance_reg: {
    commandCode: "04",
    functionCode: "0B",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_11_csu_ow: {
    commandCode: "04",
    functionCode: "0C",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_12_csu_volt: {
    commandCode: "04",
    functionCode: "0D",
    cellNoRange: [0, 22],
    valueType: "float",
  },
  get_12_csu_temp: {
    commandCode: "04",
    functionCode: "0E",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_12_csu_balance_reg: {
    commandCode: "04",
    functionCode: "0F",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_12_csu_ow: {
    commandCode: "04",
    functionCode: "10",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  set_voltage: {
    commandCode: "03",
    functionCode: "01",
    cellNoRange: [0, 22],
    valueType: "float",
  },
  set_temp: {
    commandCode: "03",
    functionCode: "02",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  set_balance: {
    commandCode: "03",
    functionCode: "03",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  set_ow: {
    commandCode: "03",
    functionCode: "04",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  set_daisy_chain: {
    commandCode: "03",
    functionCode: "05",
    valueType: "binary",
  },
  set_delay: { commandCode: "03", functionCode: "06", valueType: "int" },
  set_cell_led: { commandCode: "03", functionCode: "07", valueType: "binary" },
  set_automatic_sequence: {
    commandCode: "03",
    functionCode: "08",
    valueType: "binary",
  },
  get_voltage_limits: {
    commandCode: "A6",
    functionCode: "D1",
    cellNoRange: [0, 23],
    valueType: "voltage_limits",
  },
};

const baudRates = [
  300, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200,
  128000, 256000,
];

const calculateCRC16 = (data: number[]): number => {
  let crc = 0xffff;
  const polynomial = 0xa001;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const lsb = crc & 0x0001;
      crc >>= 1;
      if (lsb) crc ^= polynomial;
    }
  }
  return crc;
};

const parseHexValue = (hexArray: number[], valueType: string): string | null => {
  if (hexArray.length < 7) return null;
  const valueBytes = hexArray.slice(3, 7);
  if (valueType === "float") {
    const valueInt = (valueBytes[0] << 24) | (valueBytes[1] << 16) | (valueBytes[2] << 8) | valueBytes[3];
    const floatValue = valueInt / 1000;
    return floatValue.toFixed(3);
  } else if (valueType === "int") {
    return valueBytes[3].toString();
  } else if (valueType === "binary") {
    return valueBytes[3] === 1 ? "On" : "Off";
  } else if (valueType === "voltage_limits") {
    // const minVoltage = ((valueBytes[0] << 8) | valueBytes[1]) / 1000;
    const maxVoltage = ((valueBytes[2] << 8) | valueBytes[3]) / 1000;
    return `${maxVoltage.toFixed(3)}`;
  }
  return null;
};

const SerialTerminal: React.FC<SerialTerminalProps> = ({
  responseData,
  setResponseData,
  updateCellVoltage,
}) => {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [baudRate, setBaudRate] = useState<number>(() => {
    const saved = localStorage.getItem("serialBaudRate");
    return saved ? Number(saved) : 9600;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [received, setReceived] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentCommand, setLastSentCommand] = useState<{
    command: string;
    cellNo?: number;
  } | null>(null);

  const lastSentCommandRef = useRef(lastSentCommand);
  const setReceivedRef = useRef(setReceived);

  useEffect(() => {
    lastSentCommandRef.current = lastSentCommand;
  }, [lastSentCommand]);

  useEffect(() => {
    setReceivedRef.current = setReceived;
  }, [setReceived]);

  useEffect(() => {
    localStorage.setItem("serialBaudRate", baudRate.toString());
  }, [baudRate]);

  useEffect(() => {
    loadPorts();
    console.log("SerialTerminal: Checking serialAPI availability:", !!window.serialAPI);
    if (!window.serialAPI) {
      setError("Serial API not available. Ensure the app is running in a supported environment.");
    }
  }, []);

  useEffect(() => {
    if (!window.serialAPI?.onSerialData) {
      console.warn("SerialTerminal: serialAPI.onSerialData not available");
      return;
    }

    const handler = (data: { hex: string; parsed: string | null }) => {
      console.log("SerialTerminal: Received serial data:", data);
      const timestamp = new Date().toLocaleTimeString();
      const logLine = data.parsed
        ? `[${timestamp}] Received HEX: ${data.hex} → Parsed: ${data.parsed}`
        : `[${timestamp}] Received HEX: ${data.hex} → No parsed data`;
      setReceivedRef.current((prev) => [...prev, logLine]);

      const hexArray = data.hex.split(" ").map((hex) => parseInt(hex, 16));
      if (hexArray.length < 7 || hexArray[0] !== 0x07) {
        console.warn("SerialTerminal: Invalid hex data format:", data.hex);
        return;
      }

      const [, cellNo, commandCode, functionCode] = hexArray;
      const commandEntry = Object.entries(instructionToHexMap).find(
        ([, { commandCode: cc, functionCode: fc }]) =>
          parseInt(cc, 16) === commandCode && parseInt(fc, 16) === functionCode
      );

      if (!commandEntry) {
        console.warn(
          `SerialTerminal: Unknown command (commandCode: ${commandCode.toString(16)}, functionCode: ${functionCode.toString(16)})`
        );
        return;
      }

      const command = commandEntry[0];
      const { cellNoRange, valueType } = commandEntry[1];
      const parsedValue = data.parsed || parseHexValue(hexArray, valueType || "float");

      if (!parsedValue) {
        console.warn(`SerialTerminal: Failed to parse value for ${command}:`, data);
        return;
      }

      if (cellNoRange && !isNaN(cellNo)) {
        if (cellNo < cellNoRange[0] || cellNo > cellNoRange[1]) {
          console.warn(`SerialTerminal: Invalid cellNo ${cellNo} for command ${command}`);
          return;
        }

        if (
          ["get_voltage", "get_dc_csu_volt", "get_11_csu_volt", "get_12_csu_volt"].includes(command)
        ) {
          const voltageValue = parseFloat(parsedValue);
          if (!isNaN(voltageValue)) {
            console.log(`SerialTerminal: Updating cell ${cellNo} with voltage ${voltageValue}`);
            updateCellVoltage(cellNo, voltageValue);
          } else {
            console.warn(`SerialTerminal: Invalid voltage parsed: ${parsedValue}`);
          }
        }

        setResponseData((prevData) => {
          const existingDataForCell = prevData[cellNo] || [];
          const newResponseEntry: ResponseData = { command, value: parsedValue };
          console.log(`SerialTerminal: Updated responseData for cell ${cellNo}:`, newResponseEntry);
          return {
            ...prevData,
            [cellNo]: [...existingDataForCell, newResponseEntry],
          };
        });
      } else {
        setResponseData((prevData) => {
          const existingDataForCell = prevData[cellNo] || [];
          const newResponseEntry: ResponseData = { command, value: parsedValue };
          console.log(`SerialTerminal: Updated responseData for ${command} (cell ${cellNo}):`, newResponseEntry);
          return {
            ...prevData,
            [cellNo]: [...existingDataForCell, newResponseEntry],
          };
        });
      }
    };

    window.serialAPI.onSerialData(handler);

    return () => {
      window.serialAPI.removeSerialDataListener?.();
    };
  }, [setResponseData, updateCellVoltage]);

  const loadPorts = async () => {
    setError(null);
    try {
      await window.serialAPI?.listPorts().then((newPorts: string[]) => {
        setPorts(newPorts);
        if (newPorts.length > 0 && !newPorts.includes(selectedPort)) {
          setSelectedPort(newPorts[0]);
        } else if (newPorts.length === 0) {
          setSelectedPort("");
        }
      });
    } catch (err: any) {
      setError("Failed to load ports: " + err.message);
    }
  };

  const handleOpen = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await window.serialAPI?.openPort(selectedPort, baudRate);
      setIsOpen(true);
      console.log("SerialTerminal: Port opened successfully");
    } catch (err: any) {
      setError("Failed to open port: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await window.serialAPI?.closePort();
      setIsOpen(false);
      console.log("SerialTerminal: Port closed successfully");
    } catch (err: any) {
      setError("Failed to close port: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHexLines([]);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json)) {
        setError("JSON must be an array of instruction objects.");
        return;
      }

      const allHex: string[] = [];

      for (const entry of json) {
        let command = (entry.command || "").toLowerCase();
        if (command === "get_temperature") {
          command = "get_temp";
        }

        if (!command || !instructionToHexMap[command]) {
          setError(`Invalid or unmapped command: ${entry.command}`);
          continue;
        }

        const { commandCode, functionCode, cellNoRange, valueType } =
          instructionToHexMap[command];
        const frame: number[] = [
          0x07,
          parseInt(commandCode, 16),
          parseInt(functionCode, 16),
        ];

        if (cellNoRange) {
          const cellNo = parseInt(entry.cellNo, 10);
          if (
            isNaN(cellNo) ||
            cellNo < cellNoRange[0] ||
            cellNo > cellNoRange[1]
          ) {
            setError(`Invalid cellNo for ${command}: ${entry.cellNo}`);
            continue;
          }
          frame.push(cellNo);
        }

        if (commandCode === "03") {
          if (valueType === "float") {
            const value = parseFloat(entry.voltage);
            if (isNaN(value) || value < 2.0 || value > 4.2) {
              setError(`Invalid voltage for ${command}: ${entry.voltage}`);
              continue;
            }
            const valueInt = Math.round(value * 1000);
            frame.push(
              (valueInt >> 24) & 0xff,
              (valueInt >> 16) & 0xff,
              (valueInt >> 8) & 0xff,
              valueInt & 0xff
            );
          } else if (valueType === "int") {
            const value = parseInt(entry.temperature || entry.time, 10);
            if (isNaN(value) || value < -20 || value > 100) {
              setError(
                `Invalid temperature or time for ${command}: ${
                  entry.temperature || entry.time
                }`
              );
              continue;
            }
            frame.push(value & 0xff);
          } else if (valueType === "binary") {
            const value =
              entry.value !== undefined ? parseInt(entry.value, 10) : 1;
            if (value !== 0 && value !== 1) {
              setError(`Invalid binary value for ${command}: ${entry.value}`);
              continue;
            }
            frame.push(value);
          } else {
            setError(`Unsupported value type for ${command}`);
            continue;
          }
        }

        const crc = calculateCRC16(frame);
        frame.push(crc & 0xff, (crc >> 8) & 0xff);

        const hexFrame = frame
          .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
          .join(" ");
        allHex.push(hexFrame);
      }

      if (allHex.length === 0) {
        setError("No valid commands processed.");
      } else {
        setHexLines(allHex);
        const timestamp = new Date().toLocaleTimeString();
        setReceived((prev) => [
          ...prev,
          `[${timestamp}] Hex frames ready:`,
          ...allHex,
        ]);
      }
    } catch (err: any) {
      setError("Failed to process file: " + err.message);
    }
  };

  const handleRunTest = async () => {
    setError(null);
    setIsLoading(true);
    try {
      for (const hexLine of hexLines) {
        const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
        const [, , commandCode, functionCode, cellNo] = hexArray;
        const commandEntry = Object.entries(instructionToHexMap).find(
          ([, { commandCode: cc, functionCode: fc }]) =>
            parseInt(cc, 16) === commandCode && parseInt(fc, 16) === functionCode
        );

        if (commandEntry) {
          console.log(`SerialTerminal: Setting lastSentCommand to ${commandEntry[0]} for cell ${cellNo}`);
          setLastSentCommand({ command: commandEntry[0], cellNo });
        } else {
          setLastSentCommand(null);
        }

        const byteBuffer = new Uint8Array(hexArray);
        await window.serialAPI?.writePortRaw(byteBuffer);

        const timestamp = new Date().toLocaleTimeString();
        setReceived((prev) => [
          ...prev,
          `[${timestamp}] Sent (raw): ${hexLine}`,
        ]);

        if (commandCode === 0x04 || commandCode === 0xA6) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        } else {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      const timestamp = new Date().toLocaleTimeString();
      setReceived((prev) => [
        ...prev,
        `[${timestamp}] ✅ Test sent successfully.`,
      ]);

      if (window.serialAPI?.isPortOpen) {
        const isPortOpen = await window.serialAPI.isPortOpen();
        if (!isPortOpen) {
          setError("Port disconnected during test. Attempting to reconnect...");
          await handleOpen();
        }
      }
    } catch (err: any) {
      setError("Failed to send test data: " + err.message);
    } finally {
      setIsLoading(false);
      setLastSentCommand(null);
    }
  };

  const handleClearOutput = () => {
    setReceived([]);
    setResponseData({});
  };

  return (
    <div className="w-100 mx-2 p-4 bg-white shadow-lg rounded-xl mt-8 space-y-4 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 text-center">
        🔌 BMS TEST RUN
      </h2>

      <div className="flex justify-center">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
            ${
              isOpen
                ? "bg-green-100 text-green-800 shadow-green-300 shadow-md animate-pulse"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
        >
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isOpen ? "bg-green-600" : "bg-red-600"
            }`}
          />
          {isOpen ? "Connected" : "Disconnected"}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex flex-col flex-1">
            <label className="text-xs font-medium text-gray-700">
              Serial Port
            </label>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={isOpen || isLoading}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
            >
              {ports.length === 0 ? (
                <option value="">No ports available</option>
              ) : (
                ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={loadPorts}
            disabled={isOpen || isLoading}
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors text-sm"
            title="Refresh Ports"
          >
            🔄
          </button>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-medium text-gray-700">Baud Rate</label>
          <select
            value={baudRate}
            onChange={(e) => setBaudRate(Number(e.target.value))}
            disabled={isOpen || isLoading}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
          >
            {baudRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate} bps
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {!isOpen ? (
            <button
              onClick={handleOpen}
              disabled={isLoading || !selectedPort}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                  />
                </svg>
              ) : null}
              Open Port
            </button>
          ) : (
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
            >
              {isLoading ? (
                <svg
                  className="animate-spin h-4 w-4 mr-2 text-white"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                  />
                </svg>
              ) : null}
              Close Port
            </button>
          )}
        </div>
      </div>

      <div className="relative group">
        <label className="text-xs font-medium text-gray-700">
          📁 Upload JSON Instructions
        </label>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={!isOpen || isLoading}
          className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
        />
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
          Upload a JSON file with BMS commands (e.g., set_voltage, get_voltage)
        </div>
        {fileName && (
          <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
        )}
      </div>

      {hexLines.length > 0 && (
        <button
          onClick={handleRunTest}
          disabled={!isOpen || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 mr-2 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
              />
            </svg>
          ) : null}
          ▶️ Run Test
        </button>
      )}

      {error && (
        <div className="p-2 bg-red-100 text-red-700 font-semibold rounded-lg text-sm animate-pulse">
          {error}
        </div>
      )}

      {Object.keys(responseData).length > 0 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">
            Response Data
          </label>
          <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm shadow-inner">
            {Object.entries(responseData).map(([cellId, dataItems]) => (
              <div key={cellId} className="text-gray-800 break-all mb-2">
                <div className="font-semibold">Cell {cellId}</div>
                {dataItems.map((item, idx) => (
                  <div key={idx} className="ml-4">
                    {item.command.replace("get_", "").replace(/_/g, " ")}:{" "}
                    {item.value}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">
            Output Console
          </label>
          {received.length > 0 && (
            <button
              onClick={handleClearOutput}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear Output
            </button>
          )}
        </div>
        <div
          className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner"
          style={{ textTransform: "none" }}
        >
          {received.length === 0 ? (
            <p className="text-gray-400">No data received yet.</p>
          ) : (
            received.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default SerialTerminal;