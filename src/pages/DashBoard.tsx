
// //correct upto now
// import React, { useState, useEffect, useRef, useMemo } from "react";
// import MenuBar from "../components/MenuBar";
// import Battery from "../components/Battery";
// import CSU1 from "../components/CSU1";
// import CSU2 from "../components/CSU2";
// import ErrorWarningPanel from "../components/ErrorWarningPanel";
// import SerialTerminal from "../components/test";
// import { useSerial } from "../SerialContext";
// import Daicy from "../components/Daicy";
// import "../index.css"

// declare global {
//   interface Window {
//     serialAPI?: {
//       listPorts: () => Promise<string[]>;
//       openPort: (port: string, baudRate: number) => Promise<void>;
//       closePort: () => Promise<void>;
//       writeData: (data: string) => Promise<void>;
//       onSerialData: (callback: (data: string) => void) => void;
//     };
//   }
// }

// type CellStatus = "normal" | "warning" | "critical";

// interface BatteryCell {
//   id: number;
//   voltage: number | null;
//   temperature: number | null;
//   status: CellStatus;
//   setVoltage: number;
//   balancing: boolean;
//   openWire: boolean;
//   data: string | null;
//   voltageLimits?: string | null;
// }

// interface SetInstruction {
//   id: number;
//   command: string;
//   param1: string;
//   param2: string;
//   cellNo: string;
//   cycleNo: string;
//   voltage: string;
//   temperature: string;
//   time: string;
// }

// interface ResponseData {
//   command: string;
//   value: string;
// }

// const validCommands = [
//   "set_voltage",
//   "set_temp",
//   "set_balance",
//   "set_ow",
//   "delay",
//   "cycle",
//   "end",
// ];

// const DashBoard: React.FC = () => {
//   const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
//   const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
//   const [instructions, setInstructions] = useState<SetInstruction[]>([]);
//   const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});
//   const fileInputRef = useRef<HTMLInputElement>(null);
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
//     writeSerialData,
//   } = useSerial();

//   // Initialize cell data with null values
//   useEffect(() => {
//     const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i,
//       voltage: null,
//       temperature: null,
//       status: "normal" as CellStatus,
//       setVoltage: 3.65,
//       balancing: false,
//       openWire: false,
//       data: null,
//       voltageLimits: null,
//     }));


//     const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i + 12,
//       voltage: null,
//       temperature: null,
//       status: "normal" as CellStatus,
//       setVoltage: 3.65,
//       balancing: false,
//       openWire: false,
//       data: null,
//       voltageLimits: null,
//     }));
//     setCSU1Cells(initialCSU1Cells);
//     setCSU2Cells(initialCSU2Cells);
//     console.log("Renderer: Initialized cells:", {
//       csu1Cells: initialCSU1Cells,
//       csu2Cells: initialCSU2Cells,
//     });
//   }, []);

//   const calculateStatus = (voltage: number | null, temperature: number | null): CellStatus => {
//     let status: CellStatus = "normal";
//     if (voltage !== null) {
//       if (voltage < 2.0 || voltage > 5.0) {
//         status = "critical";
//       } else if ((voltage < 1.8 || voltage > 4.4) && status !== "critical") {
//         status = "warning";
//       }
//     }
//     if (temperature !== null) {
//       if (temperature < -20 || temperature > 60) {
//         status = "critical";
//       } else if ((temperature < 0 || temperature > 45) && status !== "critical") {
//         status = "warning";
//       }
//     }
//     return status;
//   };

//   const updateCellVoltage = (cellId: number, voltage: number) => {
//     console.log(`DashBoard: Updating cell ${cellId} with voltage ${voltage}`);
//     const isCSU1 = cellId < 12;
//     setCSU1Cells(prev => isCSU1 ? prev.map(cell =>
//       cell.id === cellId ? { ...cell, voltage, status: calculateStatus(voltage, cell.temperature) } : cell
//     ) : prev);
//     setCSU2Cells(prev => !isCSU1 ? prev.map(cell =>
//       cell.id === cellId ? { ...cell, voltage, status: calculateStatus(voltage, cell.temperature) } : cell
//     ) : prev);
//   };

//   // Update cell states based on responseData
//   useEffect(() => {
//     console.log('DashBoard: responseData changed:', responseData);
//     Object.entries(responseData).forEach(([cellNo, dataItems]) => {
//       const cellId = parseInt(cellNo);
//       if (cellId < 0 || cellId >= 24) return;

//       const isCSU1 = cellId < 12;
//       const cellIndex = isCSU1 ? cellId : cellId - 12;

//       const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;
//       setCells(prev => {
//         const updatedCells = [...prev];
//         const updatedCell = { ...updatedCells[cellIndex] };
//         dataItems.forEach((item) => {
//           switch (item.command) {
//             case "get_voltage":
//             case "get_dc_csu_volt":
//             case "get_11_csu_volt":
//             case "get_12_csu_volt":
//               const newVoltage = parseFloat(item.value);
//               if (!isNaN(newVoltage)) {
//                 updatedCell.voltage = newVoltage;
//               }
//               break;
//             case "get_temp":
//             case "get_dc_csu_temp":
//             case "get_11_csu_temp":
//             case "get_12_csu_temp":
//               const newTemp = parseFloat(item.value);
//               if (!isNaN(newTemp)) {
//                 updatedCell.temperature = newTemp;
//               }
//               break;
//             case "get_dc_csu_balance_reg":
//             case "get_11_csu_balance_reg":
//             case "get_12_csu_balance_reg":
//               updatedCell.balancing = item.value === "On";
//               break;
//             case "get_dc_csu_ow":
//             case "get_11_csu_ow":
//             case "get_12_csu_ow":
//               updatedCell.openWire = item.value === "On";
//               break;
//             case "get_current":
//             case "get_cell_temp_res":
//               updatedCell.data = item.value;
//               break;
//             case "get_voltage_limits":
//               updatedCell.voltageLimits = item.value;
//               break;
//           }
//         });

//         updatedCell.status = calculateStatus(updatedCell.voltage, updatedCell.temperature);
//         updatedCells[cellIndex] = updatedCell;
//         console.log(`Renderer: Updated cell ${cellId} with response data`, updatedCell);
//         return updatedCells;
//       });
//     });
//   }, [responseData]);

//   const validateInstruction = (
//     instruction: any,
//     index: number,
//     totalInstructions: number
//   ): string | null => {
//     if (!instruction.command || !validCommands.includes(instruction.command)) {
//       return `Instruction ${index + 1}: Invalid or missing command`;
//     }
//     switch (instruction.command) {
//       case "set_voltage":
//         if (
//           !instruction.cellNo ||
//           isNaN(parseInt(instruction.cellNo)) ||
//           parseInt(instruction.cellNo) < 1 ||
//           parseInt(instruction.cellNo) > 23
//         ) {
//           return `Instruction ${index + 1}: Invalid cellNo for set_voltage (1-23)`;
//         }
//         if (
//           !instruction.voltage ||
//           isNaN(parseFloat(instruction.voltage)) ||
//           parseFloat(instruction.voltage) < 0
//         ) {
//           return `Instruction ${index + 1}: Invalid voltage for set_voltage`;
//         }
//         break;
//       case "set_temp":
//         if (
//           !instruction.cellNo ||
//           isNaN(parseInt(instruction.cellNo)) ||
//           parseInt(instruction.cellNo) < 1 ||
//           parseInt(instruction.cellNo) > 6
//         ) {
//           return `Instruction ${index + 1}: Invalid cellNo for set_temp (1-6)`;
//         }
//         if (
//           !instruction.temperature ||
//           isNaN(parseFloat(instruction.temperature)) ||
//           parseFloat(instruction.temperature) < 0
//         ) {
//           return `Instruction ${index + 1}: Invalid temperature for set_temp`;
//         }
//         break;
//       case "set_balance":
//         if (
//           !instruction.cellNo ||
//           isNaN(parseInt(instruction.cellNo)) ||
//           parseInt(instruction.cellNo) < 1 ||
//           parseInt(instruction.cellNo) > 23
//         ) {
//           return `Instruction ${index + 1}: Invalid cellNo for set_balance (1-23)`;
//         }
//         break;
//       case "set_ow":
//         if (
//           !instruction.cellNo ||
//           isNaN(parseInt(instruction.cellNo)) ||
//           parseInt(instruction.cellNo) < 1 ||
//           parseInt(instruction.cellNo) > 24
//         ) {
//           return `Instruction ${index + 1}: Invalid cellNo for set_ow (1-24)`;
//         }
//         break;
//       case "cycle":
//         if (
//           !instruction.param1 ||
//           !instruction.param1.startsWith("Step ") ||
//           isNaN(parseInt(instruction.param1.replace("Step ", "")))
//         ) {
//           return `Instruction ${index + 1}: Invalid param1 for cycle`;
//         }
//         const stepNum = parseInt(instruction.param1.replace("Step ", ""));
//         if (stepNum < 1 || stepNum > totalInstructions) {
//           return `Instruction ${index + 1}: param1 references invalid step (${stepNum})`;
//         }
//         if (
//           !instruction.param2 ||
//           isNaN(parseInt(instruction.param2)) ||
//           parseInt(instruction.param2) <= 0
//         ) {
//           return `Instruction ${index + 1}: Invalid param2 for cycle`;
//         }
//         if (instruction.cellNo) {
//           console.warn(`Instruction ${index + 1}: cellNo ignored for cycle`);
//         }
//         break;
//       case "delay":
//         if (
//           !instruction.time ||
//           isNaN(parseInt(instruction.time)) ||
//           parseInt(instruction.time) <= 0
//         ) {
//           return `Instruction ${index + 1}: Invalid time for delay`;
//         }
//         break;
//       case "end":
//         break;
//       default:
//         return `Instruction ${index + 1}: Unknown command`;
//     }
//     return null;
//   };

//   const handleLoadInstructions = () => {
//     if (fileInputRef.current) {
//       console.log("Renderer: Triggering file input");
//       fileInputRef.current.click();
//     } else {
//       console.error("Renderer: File input ref is null");
//       alert("File input is not available. Please refresh the page.");
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     console.log("Renderer: File change event triggered");
//     const file = event.target.files?.[0];
//     if (!file) {
//       console.warn("Renderer: No file selected");
//       alert("No file selected. Please choose a JSON file.");
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         console.log("Renderer: Reading file:", file.name);
//         const text = e.target?.result as string;
//         const data = JSON.parse(text);
//         if (!Array.isArray(data)) {
//           throw new Error("File must contain a JSON array of instructions.");
//         }

//         // Validate instructions
//         const errors = data
//           .map((item, index) => validateInstruction(item, index, data.length))
//           .filter((error): error is string => error !== null);
//         if (errors.length > 0) {
//           console.error("Renderer: Validation errors:", errors);
//           alert(`Invalid instructions:\n${errors.join("\n")}`);
//           return;
//         }

//         // Create valid data
//         const validData = data.map((item, index) => ({
//           id: index + 1,
//           command: item.command || "",
//           param1: item.command === "cycle" ? item.param1 || "" : "",
//           param2: item.command === "cycle" ? item.param2 || "" : "",
//           cellNo: ["set_voltage", "set_temp", "set_balance", "set_ow"].includes(
//             item.command
//           )
//             ? item.cellNo || ""
//             : "",
//           cycleNo: item.command === "cycle" ? item.cycleNo || "" : "",
//           voltage: item.command === "set_voltage" ? item.voltage || "" : "",
//           temperature:
//             item.command === "set_temp" ? item.temperature || "" : "",
//           time: item.command === "delay" ? item.time || "" : "",
//         }));

//         setInstructions(validData);
//         console.log("Renderer: Loaded instructions:", validData);
//         if (validData.length === 1 && validData[0].command === "cycle") {
//           alert(
//             `Warning: Single cycle instruction will loop itself ${validData[0].param2} times. Add more instructions for meaningful looping.`
//           );
//         } else {
//           alert(`Successfully loaded ${validData.length} instructions.`);
//         }
//       } catch (error) {
//         console.error("Renderer: Error parsing file:", error);
//         alert(
//           `Error loading file: ${
//             error instanceof Error ? error.message : String(error)
//           }`
//         );
//       }
//     };
//     reader.onerror = () => {
//       console.error("Renderer: File read error");
//       alert("Failed to read file. Please ensure it is a valid JSON file.");
//     };
//     reader.readAsText(file);

//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleClearInstructions = () => {
//     setInstructions([]);
//     console.log("Renderer: Cleared instructions");
//     alert("Instructions cleared.");
//   };

//   // Update cell states based on command
//   const updateCellState = (instruction: SetInstruction) => {
//     const cellNo = parseInt(instruction.cellNo) - 1;
//     if (cellNo < 0 || cellNo >= 24) return;

//     const isCSU1 = cellNo < 12;
//     const cellIndex = isCSU1 ? cellNo : cellNo - 12;
//     const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;

//     setCells(prev => {
//       const updatedCells = [...prev];
//       const updatedCell = { ...updatedCells[cellIndex] };
//       switch (instruction.command) {
//         case "set_voltage":
//           const newVoltage = parseFloat(instruction.voltage);
//           if (!isNaN(newVoltage)) {
//             updatedCell.setVoltage = newVoltage;
//           }
//           break;
//         case "set_balance":
//           updatedCell.balancing = true;
//           break;
//         case "set_ow":
//           updatedCell.openWire = true;
//           break;
//         case "set_temp":
//           const newTemp = parseFloat(instruction.temperature);
//           if (!isNaN(newTemp)) {
//             updatedCell.temperature = newTemp;
//           }
//           break;
//       }
//       updatedCell.status = calculateStatus(updatedCell.voltage, updatedCell.temperature);
//       updatedCells[cellIndex] = updatedCell;
//       console.log(`Renderer: Updated cell ${cellNo} for command ${instruction.command}`, updatedCell);
//       return updatedCells;
//     });
//   };

//   // Memoize batteryCells to prevent unnecessary re-renders
//   const batteryCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

//   return (
//     <div className="flex flex-col h-screen bg-gray-150">
//       <MenuBar />
//       <div className="flex-1 p-4">
//         <div className="flex flex-row gap-4 items-start">
//           <div className="w-100">
//             <Battery cells={batteryCells} setSelectedCell={() => {}} />
//           </div>
//           <div className="flex flex-col gap-1 ml-0.5 h-180">
//             <div className="flex flex-row gap-2">
//               <div className="flex flex-col gap-1">
//                 <CSU1 />
//               </div>
//               <div className="flex flex-col gap-1">
//                 <CSU2 />
//               </div>
//               <div className="flex flex-col gap-1">
//                 <Daicy/>
//               </div>
//             </div>
//             <div className="bg-white rounded-md shadow p-4 min-w-[510px] mt-10">
//               <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={csu2Cells} />
//             </div>
//           </div>
         
//           <div className="">
//             <SerialTerminal
//               responseData={responseData}
//               setResponseData={setResponseData}
//               updateCellVoltage={updateCellVoltage}
//             />
//           </div>
//         </div>
//       </div>
//       <input
//         type="file"
//         accept=".json"
//         ref={fileInputRef}
//         style={{ display: "none" }}
//         onChange={handleFileChange}
//       />
//     </div>
//   );
// };

// export default DashBoard;
















//correct upto now
import React, { useState, useEffect, useRef, useMemo } from "react";
import MenuBar from "../components/MenuBar";
import Battery from "../components/Battery";
import CSU1 from "../components/CSU1";
import CSU2 from "../components/CSU2";
import ErrorWarningPanel from "../components/ErrorWarningPanel";
import SerialTerminal from "../components/test";
import { useSerial } from "../SerialContext";
import Daicy from "../components/Daicy";
import "../index.css"

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
  voltage: number | null;
  temperature: number | null;
  status: CellStatus;
  setVoltage: number;
  balancing: boolean;
  openWire: boolean;
  data: string | null;
  voltageLimits?: string | null;
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

interface ResponseData {
  command: string;
  value: string;
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
  const [dcCsuResponseData, setDcCsuResponseData] = useState<Record<number, Record<number, ResponseData[]>>>({});
  const [instructions, setInstructions] = useState<SetInstruction[]>([]);
  const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  // const {
  //   baudRate,
  //   availablePorts,
  //   selectedPort,
  //   isPortOpen,
  //   lastSerialData,
  //   setBaudRate,
  //   setSelectedPort,
  //   setLastSerialData,
  //   refreshPorts,
  //   initializePort,
  //   closePort,
  //   writeSerialData,
  // } = useSerial();

  // Initialize cell data with null values
  useEffect(() => {
    const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      voltage: null,
      temperature: null,
      status: "normal" as CellStatus,
      setVoltage: 3.65,
      balancing: false,
      openWire: false,
      data: null,
      voltageLimits: null,
    }));

    const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i + 12,
      voltage: null,
      temperature: null,
      status: "normal" as CellStatus,
      setVoltage: 3.65,
      balancing: false,
      openWire: false,
      data: null,
      voltageLimits: null,
    }));
    setCSU1Cells(initialCSU1Cells);
    setCSU2Cells(initialCSU2Cells);
    console.log("Renderer: Initialized cells:", {
      csu1Cells: initialCSU1Cells,
      csu2Cells: initialCSU2Cells,
    });
  }, []);

  const calculateStatus = (voltage: number | null, temperature: number | null): CellStatus => {
    let status: CellStatus = "normal";
    if (voltage !== null) {
      if (voltage < 2.0 || voltage > 5.0) {
        status = "critical";
      } else if ((voltage < 1.8 || voltage > 4.4) && status !== "critical") {
        status = "warning";
      }
    }
    if (temperature !== null) {
      if (temperature < -20 || temperature > 60) {
        status = "critical";
      } else if ((temperature < 0 || temperature > 45) && status !== "critical") {
        status = "warning";
      }
    }
    return status;
  };

  const updateCellVoltage = (cellId: number, voltage: number) => {
    console.log(`DashBoard: Updating cell ${cellId} with voltage ${voltage}`);
    const isCSU1 = cellId < 12;
    setCSU1Cells(prev => isCSU1 ? prev.map(cell =>
      cell.id === cellId ? { ...cell, voltage, status: calculateStatus(voltage, cell.temperature) } : cell
    ) : prev);
    setCSU2Cells(prev => !isCSU1 ? prev.map(cell =>
      cell.id === cellId ? { ...cell, voltage, status: calculateStatus(voltage, cell.temperature) } : cell
    ) : prev);
  };

  // Update cell states based on responseData and dcCsuResponseData
  useEffect(() => {
    console.log('DashBoard: responseData changed:', responseData);
    Object.entries(responseData).forEach(([cellNo, dataItems]) => {
      const cellId = parseInt(cellNo);
      if (cellId < 0 || cellId >= 24) return;

      const isCSU1 = cellId < 12;
      const cellIndex = isCSU1 ? cellId : cellId - 12;

      const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;
      setCells(prev => {
        const updatedCells = [...prev];
        const updatedCell = { ...updatedCells[cellIndex] };
        dataItems.forEach((item) => {
          switch (item.command) {
            case "get_voltage":
            case "get_dc_csu_volt":
            case "get_11_csu_volt":
            case "get_12_csu_volt":
              const newVoltage = parseFloat(item.value);
              if (!isNaN(newVoltage)) {
                updatedCell.voltage = newVoltage;
              }
              break;
            case "get_temp":
            case "get_dc_csu_temp":
            case "get_11_csu_temp":
            case "get_12_csu_temp":
              const newTemp = parseFloat(item.value);
              if (!isNaN(newTemp)) {
                updatedCell.temperature = newTemp;
              }
              break;
            case "get_dc_csu_balance_reg":
            case "get_11_csu_balance_reg":
            case "get_12_csu_balance_reg":
              updatedCell.balancing = item.value === "On";
              break;
            case "get_dc_csu_ow":
            case "get_11_csu_ow":
            case "get_12_csu_ow":
              updatedCell.openWire = item.value === "On";
              break;
            case "get_current":
            case "get_cell_temp_res":
              updatedCell.data = item.value;
              break;
            case "get_voltage_limits":
              updatedCell.voltageLimits = item.value;
              break;
          }
        });

        updatedCell.status = calculateStatus(updatedCell.voltage, updatedCell.temperature);
        updatedCells[cellIndex] = updatedCell;
        console.log(`Renderer: Updated cell ${cellId} with response data`, updatedCell);
        return updatedCells;
      });
    });

    // Handle dcCsuResponseData
    console.log('DashBoard: dcCsuResponseData changed:', dcCsuResponseData);
    Object.entries(dcCsuResponseData).forEach(([dcIc, cellData]) => {
      Object.entries(cellData).forEach(([cellNo, dataItems]) => {
        const cellId = parseInt(cellNo);
        if (cellId < 0 || cellId >= 24) return;

        const isCSU1 = cellId < 12;
        const cellIndex = isCSU1 ? cellId : cellId - 12;
        const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;

        setCells(prev => {
          const updatedCells = [...prev];
          const updatedCell = { ...updatedCells[cellIndex] };
          dataItems.forEach((item) => {
            switch (item.command) {
              case "get_dc_csu_volt":
                const newVoltage = parseFloat(item.value);
                if (!isNaN(newVoltage)) {
                  updatedCell.voltage = newVoltage;
                }
                break;
              case "get_dc_csu_temp":
                const newTemp = parseFloat(item.value.replace(" °C", ""));
                if (!isNaN(newTemp)) {
                  updatedCell.temperature = newTemp;
                }
                break;
              case "get_dc_csu_balance":
                updatedCell.balancing = item.value === "On";
                break;
              case "get_dc_csu_ow":
                updatedCell.openWire = item.value === "On";
                break;
            }
          });

          updatedCell.status = calculateStatus(updatedCell.voltage, updatedCell.temperature);
          updatedCells[cellIndex] = updatedCell;
          console.log(`Renderer: Updated DC CSU cell ${cellId} (DC IC ${dcIc}) with data`, updatedCell);
          return updatedCells;
        });
      });
    });
  }, [responseData, dcCsuResponseData]);

  const validateInstruction = (
    instruction: any,
    index: number,
    totalInstructions: number
  ): string | null => {
    if (!instruction.command || !validCommands.includes(instruction.command)) {
      return `Instruction ${index + 1}: Invalid or missing command`;
    }
    switch (instruction.command) {
      case "set_voltage":
        if (
          !instruction.cellNo ||
          isNaN(parseInt(instruction.cellNo)) ||
          parseInt(instruction.cellNo) < 1 ||
          parseInt(instruction.cellNo) > 23
        ) {
          return `Instruction ${index + 1}: Invalid cellNo for set_voltage (1-23)`;
        }
        if (
          !instruction.voltage ||
          isNaN(parseFloat(instruction.voltage)) ||
          parseFloat(instruction.voltage) < 0
        ) {
          return `Instruction ${index + 1}: Invalid voltage for set_voltage`;
        }
        break;
      case "set_temp":
        if (
          !instruction.cellNo ||
          isNaN(parseInt(instruction.cellNo)) ||
          parseInt(instruction.cellNo) < 1 ||
          parseInt(instruction.cellNo) > 6
        ) {
          return `Instruction ${index + 1}: Invalid cellNo for set_temp (1-6)`;
        }
        if (
          !instruction.temperature ||
          isNaN(parseFloat(instruction.temperature)) ||
          parseFloat(instruction.temperature) < 0
        ) {
          return `Instruction ${index + 1}: Invalid temperature for set_temp`;
        }
        break;
      case "set_balance":
        if (
          !instruction.cellNo ||
          isNaN(parseInt(instruction.cellNo)) ||
          parseInt(instruction.cellNo) < 1 ||
          parseInt(instruction.cellNo) > 23
        ) {
          return `Instruction ${index + 1}: Invalid cellNo for set_balance (1-23)`;
        }
        break;
      case "set_ow":
        if (
          !instruction.cellNo ||
          isNaN(parseInt(instruction.cellNo)) ||
          parseInt(instruction.cellNo) < 1 ||
          parseInt(instruction.cellNo) > 24
        ) {
          return `Instruction ${index + 1}: Invalid cellNo for set_ow (1-24)`;
        }
        break;
      case "cycle":
        if (
          !instruction.param1 ||
          !instruction.param1.startsWith("Step ") ||
          isNaN(parseInt(instruction.param1.replace("Step ", "")))
        ) {
          return `Instruction ${index + 1}: Invalid param1 for cycle`;
        }
        const stepNum = parseInt(instruction.param1.replace("Step ", ""));
        if (stepNum < 1 || stepNum > totalInstructions) {
          return `Instruction ${index + 1}: param1 references invalid step (${stepNum})`;
        }
        if (
          !instruction.param2 ||
          isNaN(parseInt(instruction.param2)) ||
          parseInt(instruction.param2) <= 0
        ) {
          return `Instruction ${index + 1}: Invalid param2 for cycle`;
        }
        if (instruction.cellNo) {
          console.warn(`Instruction ${index + 1}: cellNo ignored for cycle`);
        }
        break;
      case "delay":
        if (
          !instruction.time ||
          isNaN(parseInt(instruction.time)) ||
          parseInt(instruction.time) <= 0
        ) {
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
          cellNo: ["set_voltage", "set_temp", "set_balance", "set_ow"].includes(
            item.command
          )
            ? item.cellNo || ""
            : "",
          cycleNo: item.command === "cycle" ? item.cycleNo || "" : "",
          voltage: item.command === "set_voltage" ? item.voltage || "" : "",
          temperature:
            item.command === "set_temp" ? item.temperature || "" : "",
          time: item.command === "delay" ? item.time || "" : "",
        }));

        setInstructions(validData);
        console.log("Renderer: Loaded instructions:", validData);
        if (validData.length === 1 && validData[0].command === "cycle") {
          alert(
            `Warning: Single cycle instruction will loop itself ${validData[0].param2} times. Add more instructions for meaningful looping.`
          );
        } else {
          alert(`Successfully loaded ${validData.length} instructions.`);
        }
      } catch (error) {
        console.error("Renderer: Error parsing file:", error);
        alert(
          `Error loading file: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
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
    const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;

    setCells(prev => {
      const updatedCells = [...prev];
      const updatedCell = { ...updatedCells[cellIndex] };
      switch (instruction.command) {
        case "set_voltage":
          const newVoltage = parseFloat(instruction.voltage);
          if (!isNaN(newVoltage)) {
            updatedCell.setVoltage = newVoltage;
          }
          break;
        case "set_balance":
          updatedCell.balancing = true;
          break;
        case "set_ow":
          updatedCell.openWire = true;
          break;
        case "set_temp":
          const newTemp = parseFloat(instruction.temperature);
          if (!isNaN(newTemp)) {
            updatedCell.temperature = newTemp;
          }
          break;
      }
      updatedCell.status = calculateStatus(updatedCell.voltage, updatedCell.temperature);
      updatedCells[cellIndex] = updatedCell;
      console.log(`Renderer: Updated cell ${cellNo} for command ${instruction.command}`, updatedCell);
      return updatedCells;
    });
    
  };

  // Memoize batteryCells to prevent unnecessary re-renders
  const batteryCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

  return (
    <div className="flex flex-col h-screen bg-gray-150">
      <MenuBar />
      <div className="flex-1 p-4">
        <div className="flex flex-row gap-4 items-start">
          <div className="w-100">
            <Battery cells={batteryCells} setSelectedCell={() => {}} />
          </div>
          <div className="flex flex-col gap-1 ml-0.5 h-180">
            <div className="flex flex-row gap-2">
              <div className="flex flex-col gap-1">
                <CSU1 />
              </div>
              <div className="flex flex-col gap-1">
                <CSU2 />
              </div>
              <div className="flex flex-col gap-1">
                <Daicy />

              </div>
            </div>
            <div className="bg-white rounded-md shadow p-4 min-w-[510px] mt-10">
              <ErrorWarningPanel csu1Cells={csu1Cells} csu2Cells={csu2Cells} />
            </div>
          </div>
         
          <div className="">
            <SerialTerminal
              responseData={responseData}
              setResponseData={setResponseData}
              dcCsuResponseData={dcCsuResponseData}
              setDcCsuResponseData={setDcCsuResponseData}
              updateCellVoltage={updateCellVoltage}
            />
          </div>
        </div>
      </div>
      <input
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default DashBoard;