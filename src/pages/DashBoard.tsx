// import React, { useState, useEffect, useRef, useMemo } from "react";
// import MenuBar from "../components/MenuBar";
// import Battery from "../components/Battery";
// import CSU1 from "../components/CSU1";
// import CSU2 from "../components/CSU2";
// import ErrorWarningPanel from "../components/ErrorWarningPanel";
// import SerialTerminal from "../components/test";
// import Daicy from "../components/Daicy";
// import { useBatteryContext } from "../BatteryContext";
// import "../index.css";

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
//   setVoltage: number | null;
//   setTemperature: number | null;
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
//   setVoltage?: string;
//   setTemperature?: string;
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

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const TEMPERATURE_WARNING_THRESHOLD = 5;
// const TEMPERATURE_CRITICAL_THRESHOLD = 10;

// const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
//   1: 2.0,
//   2: 2.5,
//   3: 2.8,
//   4: 3.3,
//   5: 3.4,
//   6: 3.6,
//   7: 4.0,
//   8: 4.2,
// };

// const DashBoard: React.FC = () => {
//   const {
//     csu1ResponseData,
//     csu2ResponseData,
//     dcCsuResponseData,
//     setDcCsuResponseData,
//     responseData,
//     setResponseData,
//     instructions,
//     setInstructions,
//   } = useBatteryContext();
//   const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
//   const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const initializeCells = () => {
//     const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
//       id: i,
//       voltage: null,
//       temperature: null,
//       status: "normal" as CellStatus,
//       setVoltage: null,
//       setTemperature: null,
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
//       setVoltage: null,
//       setTemperature: null,
//       balancing: false,
//       openWire: false,
//       data: null,
//       voltageLimits: null,
//     }));
//     setCSU1Cells(initialCSU1Cells);
//     setCSU2Cells(initialCSU2Cells);
//     console.log("DashBoard: Initialized cells:", {
//       csu1Cells: initialCSU1Cells,
//       csu2Cells: initialCSU2Cells,
//     });
//   };

//   useEffect(() => {
//     initializeCells();
//   }, []);

//   useEffect(() => {
//     console.log("DashBoard: Instructions changed:", instructions);
//     const updateCellsFromInstructions = (cells: BatteryCell[], isCSU1: boolean) => {
//       return cells.map((cell) => {
//         const cellInstructions = instructions.filter(
//           (instr) => parseInt(instr.cellNo) - 1 === cell.id
//         );
//         let updatedCell = { ...cell };

//         const setVoltageInstr = cellInstructions.find(
//           (instr) => instr.command === "set_voltage"
//         );
//         if (setVoltageInstr) {
//           const newSetVoltage = parseFloat(setVoltageInstr.voltage);
//           updatedCell.setVoltage = !isNaN(newSetVoltage) ? newSetVoltage : null;
//         }

//         const setTempInstr = cellInstructions.find(
//           (instr) => instr.command === "set_temp"
//         );
//         if (setTempInstr) {
//           const newSetTemp = parseFloat(setTempInstr.temperature);
//           updatedCell.setTemperature = !isNaN(newSetTemp) ? newSetTemp : null;
//         }

//         const balanceInstr = cellInstructions.find(
//           (instr) => instr.command === "set_balance"
//         );
//         updatedCell.balancing = !!balanceInstr && balanceInstr.param1 === "1";

//         const owInstr = cellInstructions.find((instr) => instr.command === "set_ow");
//         updatedCell.openWire = !!owInstr && owInstr.param1 === "1";

//         updatedCell.status = calculateStatus(updatedCell);

//         return updatedCell;
//       });
//     };

//     // Only update if there are changes to prevent unnecessary renders
//     const newCSU1Cells = updateCellsFromInstructions(csu1Cells, true);
//     const newCSU2Cells = updateCellsFromInstructions(csu2Cells, false);
//     if (JSON.stringify(newCSU1Cells) !== JSON.stringify(csu1Cells) || JSON.stringify(newCSU2Cells) !== JSON.stringify(csu2Cells)) {
//       setCSU1Cells(newCSU1Cells);
//       setCSU2Cells(newCSU2Cells);
//     }
//   }, [instructions, csu1Cells, csu2Cells]); // Added csu1Cells, csu2Cells to dependencies to stabilize

//   useEffect(() => {
//     console.log("DashBoard: csu1ResponseData changed:", csu1ResponseData);
//     const updatedCells = csu1Cells.map((cell) => {
//       const dataItems = csu1ResponseData?.[cell.id.toString()] || [];
//       let updatedCell = { ...cell };
//       dataItems.forEach((item) => {
//         switch (item.command) {
//           case "get_11_csu_volt":
//             const newVoltage = parseFloat(item.value);
//             if (!isNaN(newVoltage)) {
//               updatedCell.voltage = newVoltage;
//             }
//             break;
//           case "get_11_csu_temp":
//             const newTemp = parseFloat(item.value.replace(" °C", ""));
//             if (!isNaN(newTemp)) {
//               updatedCell.temperature = newTemp;
//             }
//             break;
//           case "get_11_csu_balance_reg":
//             updatedCell.balancing = item.value === "On";
//             break;
//           case "get_11_csu_ow":
//             updatedCell.openWire = item.value === "On";
//             break;
//         }
//       });
//       updatedCell.status = calculateStatus(updatedCell);
//       return updatedCell;
//     });
//     if (JSON.stringify(updatedCells) !== JSON.stringify(csu1Cells)) {
//       setCSU1Cells(updatedCells);
//     }
//   }, [csu1ResponseData, csu1Cells]);

//   useEffect(() => {
//     console.log("DashBoard: csu2ResponseData changed:", csu2ResponseData);
//     const updatedCells = csu2Cells.map((cell) => {
//       const dataItems = csu2ResponseData?.[(cell.id - 12).toString()] || [];
//       let updatedCell = { ...cell };
//       dataItems.forEach((item) => {
//         switch (item.command) {
//           case "get_12_csu_volt":
//             const newVoltage = parseFloat(item.value);
//             if (!isNaN(newVoltage)) {
//               updatedCell.voltage = newVoltage;
//             }
//             break;
//           case "get_12_csu_temp":
//             const newTemp = parseFloat(item.value.replace(" °C", ""));
//             if (!isNaN(newTemp)) {
//               updatedCell.temperature = newTemp;
//             }
//             break;
//           case "get_12_csu_balance_reg":
//             updatedCell.balancing = item.value === "On";
//             break;
//           case "get_12_csu_ow":
//             updatedCell.openWire = item.value === "On";
//             break;
//         }
//       });
//       updatedCell.status = calculateStatus(updatedCell);
//       return updatedCell;
//     });
//     if (JSON.stringify(updatedCells) !== JSON.stringify(csu2Cells)) {
//       setCSU2Cells(updatedCells);
//     }
//   }, [csu2ResponseData, csu2Cells]);

//   useEffect(() => {
//     if (!dcCsuResponseData || typeof dcCsuResponseData !== 'object' || Array.isArray(dcCsuResponseData)) return;

//     const enrichedDcCsuResponseData = Object.entries(dcCsuResponseData).reduce((acc, [dcIc, cells]) => {
//       acc[dcIc] = Object.entries(cells).reduce((cellAcc, [cellNo, dataItems]) => {
//         const cellInstructions = instructions.filter(
//           (instr) => instr.cellNo === cellNo && (instr.param1 === dcIc || instr.param2 === dcIc)
//         );
//         cellAcc[cellNo] = dataItems.map(item => {
//           const setVoltageInstr = cellInstructions.find(instr => instr.command === 'set_voltage' && instr.cellNo === cellNo);
//           const setTempInstr = cellInstructions.find(instr => instr.command === 'set_temp' && instr.cellNo === cellNo);
//           return {
//             ...item,
//             setVoltage: setVoltageInstr?.voltage || undefined,
//             setTemperature: setTempInstr?.temperature || undefined,
//           };
//         });
//         return cellAcc;
//       }, {});
//       return acc;
//     }, {});

//     if (JSON.stringify(enrichedDcCsuResponseData) !== JSON.stringify(dcCsuResponseData)) {
//       setDcCsuResponseData(enrichedDcCsuResponseData);
//     }
//     console.log("DashBoard: Enriched dcCsuResponseData:", enrichedDcCsuResponseData);
//   }, [dcCsuResponseData, instructions]);

//   const calculateStatus = (cell: BatteryCell): CellStatus => {
//     let status: CellStatus = "normal";

//     if (cell.setVoltage !== null && cell.voltage !== null && cell.setVoltage in EXPECTED_SENT_VOLTAGES) {
//       const expectedVoltage = EXPECTED_SENT_VOLTAGES[cell.setVoltage];
//       const voltageGap = Math.abs(expectedVoltage - cell.voltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = "critical";
//       else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = "warning";
//     }

//     if (cell.setTemperature !== null && cell.temperature !== null) {
//       const tempGap = Math.abs(cell.setTemperature - cell.temperature);
//       if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = "critical";
//       else if (tempGap >= TEMPERATURE_WARNING_THRESHOLD && status !== "critical") status = "warning";
//     }

//     return status;
//   };

//   const updateCellVoltage = (cellId: number, voltage: number) => {
//     console.log(`DashBoard: Updating cell ${cellId} with voltage ${voltage}`);
//     const isCSU1 = cellId < 12;
//     const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;
//     const prevCells = isCSU1 ? csu1Cells : csu2Cells;
//     const updatedCells = prevCells.map((cell) =>
//       cell.id === cellId ? { ...cell, voltage, status: calculateStatus({ ...cell, voltage }) } : cell
//     );
//     if (JSON.stringify(updatedCells) !== JSON.stringify(prevCells)) {
//       setCells(updatedCells);
//     }
//   };

//   const handleLoadInstructions = () => {
//     console.log("DashBoard: Load instructions button clicked");
//     if (fileInputRef.current) {
//       console.log("DashBoard: Triggering file input");
//       fileInputRef.current.click();
//     } else {
//       console.error("DashBoard: File input ref is null");
//       alert("File input is not available. Please refresh the page.");
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     console.log("DashBoard: File change event triggered");
//     const file = event.target.files?.[0];
//     if (!file) {
//       console.warn("DashBoard: No file selected");
//       alert("No file selected. Please choose a JSON file.");
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       try {
//         console.log("DashBoard: Reading file:", file.name);
//         const text = e.target?.result as string;
//         const data = JSON.parse(text);
//         if (!Array.isArray(data)) {
//           throw new Error("File must contain a JSON array of instructions.");
//         }

//         const errors = data
//           .map((item, index) => validateInstruction(item, index, data.length))
//           .filter((error): error is string => error !== null);
//         if (errors.length > 0) {
//           console.error("DashBoard: Validation errors:", errors);
//           alert(`Invalid instructions:\n${errors.join("\n")}`);
//           return;
//         }

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
//         console.log("DashBoard: Loaded instructions:", validData);
//         if (validData.length === 1 && validData[0].command === "cycle") {
//           alert(
//             `Warning: Single cycle instruction will loop itself ${validData[0].param2} times. Add more instructions for meaningful looping.`
//           );
//         } else {
//           alert(`Successfully loaded ${validData.length} instructions.`);
//         }
//       } catch (error) {
//         console.error("DashBoard: Error parsing file:", error);
//         alert(
//           `Error loading file: ${
//             error instanceof Error ? error.message : String(error)
//           }`
//         );
//       }
//     };
//     reader.onerror = () => {
//       console.error("DashBoard: File read error");
//       alert("Failed to read file. Please ensure it is a valid JSON file.");
//     };
//     reader.readAsText(file);

//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleClearInstructions = () => {
//     setInstructions([]);
//     console.log("DashBoard: Cleared instructions");
//     alert("Instructions cleared.");
//   };

//   const batteryCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

//   useEffect(() => {
//     console.log("DashBoard: Props for ErrorWarningPanel", {
//       csu1Cells,
//       csu2Cells,
//       dcCsuResponseData,
//     });
//   }, [csu1Cells, csu2Cells, dcCsuResponseData]);

//   return (
//     <div className="flex flex-col max-h-full bg-zinc-100">
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
//                 <Daicy />
//               </div>
//             </div>
//             <div className="bg-white rounded-md shadow p-4 min-w-[510px] mt-10">
//               {csu1Cells.length > 0 && csu2Cells.length > 0 && dcCsuResponseData ? (
//                 <ErrorWarningPanel
//                   csu1Cells={csu1Cells}
//                   csu2Cells={csu2Cells}
//                   daisyChainData={dcCsuResponseData}
//                 />
//               ) : (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
//                   Loading cell data...
//                 </div>
//               )}
//             </div>
//           </div>
//           <div className="">
//             <SerialTerminal
//               responseData={responseData}
//               setResponseData={setResponseData}
//               dcCsuResponseData={dcCsuResponseData}
//               setDcCsuResponseData={setDcCsuResponseData}
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

// const validateInstruction = (
//   item: any,
//   index: number,
//   totalLength: number
// ): string | null => {
//   if (!item || typeof item !== "object") {
//     return `Instruction ${index + 1}: Invalid format (must be an object).`;
//   }
//   if (!item.command || typeof item.command !== "string") {
//     return `Instruction ${index + 1}: Missing or invalid 'command' field.`;
//   }
//   if (!validCommands.includes(item.command)) {
//     return `Instruction ${index + 1}: Invalid command '${item.command}'.`;
//   }

//   switch (item.command) {
//     case "set_voltage":
//     case "set_temp":
//     case "set_balance":
//     case "set_ow":
//       if (!item.cellNo || typeof item.cellNo !== "string") {
//         return `Instruction ${index + 1}: Missing or invalid 'cellNo' for ${item.command}.`;
//       }
//       const cellNo = parseInt(item.cellNo);
//       if (isNaN(cellNo) || cellNo < 1 || cellNo > 24) {
//         return `Instruction ${index + 1}: 'cellNo' must be between 1 and 24 for ${item.command}.`;
//       }
//       if (item.command === "set_voltage" && (!item.voltage || isNaN(parseFloat(item.voltage)))) {
//         return `Instruction ${index + 1}: Invalid or missing 'voltage' for set_voltage.`;
//       }
//       if (item.command === "set_temp" && (!item.temperature || isNaN(parseFloat(item.temperature)))) {
//         return `Instruction ${index + 1}: Invalid or missing 'temperature' for set_temp.`;
//       }
//       break;
//     case "delay":
//       if (!item.time || isNaN(parseInt(item.time))) {
//         return `Instruction ${index + 1}: Invalid or missing 'time' for delay.`;
//       }
//       break;
//     case "cycle":
//       if (!item.param1 || !item.param2 || !item.cycleNo) {
//         return `Instruction ${index + 1}: Missing 'param1', 'param2', or 'cycleNo' for cycle.`;
//       }
//       if (index !== totalLength - 1) {
//         return `Instruction ${index + 1}: 'cycle' must be the last instruction.`;
//       }
//       break;
//     case "end":
//       if (index !== totalLength - 1) {
//         return `Instruction ${index + 1}: 'end' must be the last instruction.`;
//       }
//       break;
//   }
//   return null;
// };

// export default DashBoard;



















import React, { useState, useEffect, useRef, useMemo } from "react";
import MenuBar from "../components/MenuBar";
import Battery from "../components/Battery";
import CSU1 from "../components/CSU1";
import CSU2 from "../components/CSU2";
import ErrorWarningPanel from "../components/ErrorWarningPanel";
import SerialTerminal from "../components/test";
import Daicy from "../components/Daicy";
import { useBatteryContext } from "../BatteryContext";
import "../index.css";

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
  setVoltage: number | null;
  setTemperature: number | null;
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
  setVoltage?: string;
  setTemperature?: string;
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

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
  1: 2.0,
  2: 2.5,
  3: 2.8,
  4: 3.3,
  5: 3.4,
  6: 3.6,
  7: 4.0,
  8: 4.2,
};

const DashBoard: React.FC = () => {
  const {
    csu1ResponseData,
    csu2ResponseData,
    dcCsuResponseData,
    setDcCsuResponseData,
    responseData,
    setResponseData,
    instructions,
    setInstructions,
  } = useBatteryContext();
  const [csu1Cells, setCSU1Cells] = useState<BatteryCell[]>([]);
  const [csu2Cells, setCSU2Cells] = useState<BatteryCell[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeCells = () => {
    const initialCSU1Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i, // 0-based internal ID
      voltage: null,
      temperature: null,
      status: "normal" as CellStatus,
      setVoltage: null,
      setTemperature: null,
      balancing: false,
      openWire: false,
      data: null,
      voltageLimits: null,
    }));

    const initialCSU2Cells = Array.from({ length: 12 }, (_, i) => ({
      id: i + 12, // 0-based internal ID starting at 12
      voltage: null,
      temperature: null,
      status: "normal" as CellStatus,
      setVoltage: null,
      setTemperature: null,
      balancing: false,
      openWire: false,
      data: null,
      voltageLimits: null,
    }));
    setCSU1Cells(initialCSU1Cells);
    setCSU2Cells(initialCSU2Cells);
    console.log("DashBoard: Initialized cells:", {
      csu1Cells: initialCSU1Cells,
      csu2Cells: initialCSU2Cells,
    });
  };

  useEffect(() => {
    initializeCells();
  }, []);

  useEffect(() => {
    console.log("DashBoard: Instructions changed:", instructions);
    const updateCellsFromInstructions = (
      cells: BatteryCell[],
      isCSU1: boolean
    ) => {
      return cells.map((cell) => {
        const cellInstructions = instructions.filter(
          (instr) => parseInt(instr.cellNo) - 1 === cell.id // Maps 1-based cellNo to 0-based id
        );
        let updatedCell = { ...cell };

        const setVoltageInstr = cellInstructions.find(
          (instr) => instr.command === "set_voltage"
        );
        if (setVoltageInstr) {
          const newSetVoltage = parseFloat(setVoltageInstr.voltage);
          updatedCell.setVoltage = !isNaN(newSetVoltage) ? newSetVoltage : null;
        }

        const setTempInstr = cellInstructions.find(
          (instr) => instr.command === "set_temp"
        );
        if (setTempInstr) {
          const newSetTemp = parseFloat(setTempInstr.temperature);
          updatedCell.setTemperature = !isNaN(newSetTemp) ? newSetTemp : null;
        }

        const balanceInstr = cellInstructions.find(
          (instr) => instr.command === "set_balance"
        );
        updatedCell.balancing = !!balanceInstr && balanceInstr.param1 === "1";

        const owInstr = cellInstructions.find(
          (instr) => instr.command === "set_ow"
        );
        updatedCell.openWire = !!owInstr && owInstr.param1 === "1";

        updatedCell.status = calculateStatus(updatedCell);

        return updatedCell;
      });
    };

    const newCSU1Cells = updateCellsFromInstructions(csu1Cells, true);
    const newCSU2Cells = updateCellsFromInstructions(csu2Cells, false);
    if (
      JSON.stringify(newCSU1Cells) !== JSON.stringify(csu1Cells) ||
      JSON.stringify(newCSU2Cells) !== JSON.stringify(csu2Cells)
    ) {
      setCSU1Cells(newCSU1Cells);
      setCSU2Cells(newCSU2Cells);
    }
  }, [instructions, csu1Cells, csu2Cells]);

  useEffect(() => {
    console.log("DashBoard: csu1ResponseData changed:", csu1ResponseData);
    const updatedCells = csu1Cells.map((cell) => {
      // Use 0-based cell.id to match 0-based cellNo from SerialTerminal
      const dataItems = csu1ResponseData?.[cell.id.toString()] || [];
      let updatedCell = { ...cell };
      dataItems.forEach((item) => {
        switch (item.command) {
          case "get_11_csu_volt":
            const newVoltage = parseFloat(item.value);
            if (!isNaN(newVoltage)) {
              updatedCell.voltage = newVoltage;
            }
            break;
          case "get_11_csu_temp":
            const newTemp = parseFloat(item.value.replace(" °C", ""));
            if (!isNaN(newTemp)) {
              updatedCell.temperature = newTemp;
            }
            break;
          case "get_11_csu_balance_reg":
            updatedCell.balancing = item.value === "On";
            break;
          case "get_11_csu_ow":
            updatedCell.openWire = item.value === "On";
            break;
        }
      });
      updatedCell.status = calculateStatus(updatedCell);
      console.log(
        `DashBoard: Updated CSU1 cell ${cell.id + 1} with response data`,
        {
          key: cell.id.toString(),
          id: cell.id + 1,
          voltage: updatedCell.voltage,
        }
      );
      return updatedCell;
    });
    if (JSON.stringify(updatedCells) !== JSON.stringify(csu1Cells)) {
      setCSU1Cells(updatedCells);
    }
  }, [csu1ResponseData, csu1Cells]);

  useEffect(() => {
    console.log("DashBoard: csu2ResponseData changed:", csu2ResponseData);
    const updatedCells = csu2Cells.map((cell) => {
      // Use 0-based (cell.id - 12) to match 0-based cellNo from SerialTerminal for CSU2
      const dataItems = csu2ResponseData?.[(cell.id - 12).toString()] || [];
      let updatedCell = { ...cell };
      dataItems.forEach((item) => {
        switch (item.command) {
          case "get_12_csu_volt":
            const newVoltage = parseFloat(item.value);
            if (!isNaN(newVoltage)) {
              updatedCell.voltage = newVoltage;
            }
            break;
          case "get_12_csu_temp":
            const newTemp = parseFloat(item.value.replace(" °C", ""));
            if (!isNaN(newTemp)) {
              updatedCell.temperature = newTemp;
            }
            break;
          case "get_12_csu_balance_reg":
            updatedCell.balancing = item.value === "On";
            break;
          case "get_12_csu_ow":
            updatedCell.openWire = item.value === "On";
            break;
        }
      });
      updatedCell.status = calculateStatus(updatedCell);
      console.log(
        `DashBoard: Updated CSU2 cell ${cell.id + 1} with response data`,
        {
          key: (cell.id - 12).toString(),
          id: cell.id + 1,
          voltage: updatedCell.voltage,
        }
      );
      return updatedCell;
    });
    if (JSON.stringify(updatedCells) !== JSON.stringify(csu2Cells)) {
      setCSU2Cells(updatedCells);
    }
  }, [csu2ResponseData, csu2Cells]);

  useEffect(() => {
    if (
      !dcCsuResponseData ||
      typeof dcCsuResponseData !== "object" ||
      Array.isArray(dcCsuResponseData)
    )
      return;

    const enrichedDcCsuResponseData = Object.entries(dcCsuResponseData).reduce(
      (acc, [dcIc, cells]) => {
        acc[dcIc] = Object.entries(cells).reduce(
          (cellAcc, [cellNo, dataItems]) => {
            const cellKey = String(cellNo); // ensure string key
            const cellInstructions = instructions.filter(
              (instr) =>
                instr.cellNo ===
                String(parseInt(dcIc) * 12 + parseInt(cellKey) + 1)
            );
            cellAcc[cellKey] = dataItems.map((item) => {
              const setVoltageInstr = cellInstructions.find(
                (instr) => instr.command === "set_voltage"
              );
              const setTempInstr = cellInstructions.find(
                (instr) => instr.command === "set_temp"
              );
              return {
                ...item,
                setVoltage: setVoltageInstr?.voltage || undefined,
                setTemperature: setTempInstr?.temperature || undefined,
              };
            });
            return cellAcc;
          },
          {} as Record<string, ResponseData[]>
        );
        return acc;
      },
      {} as Record<string, Record<string, ResponseData[]>>
    );

    if (
      JSON.stringify(enrichedDcCsuResponseData) !==
      JSON.stringify(dcCsuResponseData)
    ) {
      setDcCsuResponseData(enrichedDcCsuResponseData);
    }
    console.log(
      "DashBoard: Enriched dcCsuResponseData:",
      enrichedDcCsuResponseData
    );
  }, [dcCsuResponseData, instructions]);

  const calculateStatus = (cell: BatteryCell): CellStatus => {
    let status: CellStatus = "normal";

    if (
      cell.setVoltage !== null &&
      cell.voltage !== null &&
      cell.setVoltage in EXPECTED_SENT_VOLTAGES
    ) {
      const expectedVoltage = EXPECTED_SENT_VOLTAGES[cell.setVoltage];
      const voltageGap = Math.abs(expectedVoltage - cell.voltage);
      if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = "critical";
      else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = "warning";
    }

    if (cell.setTemperature !== null && cell.temperature !== null) {
      const tempGap = Math.abs(cell.setTemperature - cell.temperature);
      if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = "critical";
      else if (
        tempGap >= TEMPERATURE_WARNING_THRESHOLD &&
        status !== "critical"
      )
        status = "warning";
    }

    return status;
  };

  const updateCellVoltage = (cellId: number, voltage: number) => {
    console.log(`DashBoard: Updating cell ${cellId} with voltage ${voltage}`);
    const isCSU1 = cellId < 12;
    const setCells = isCSU1 ? setCSU1Cells : setCSU2Cells;
    const prevCells = isCSU1 ? csu1Cells : csu2Cells;
    const updatedCells = prevCells.map((cell) =>
      cell.id === cellId
        ? { ...cell, voltage, status: calculateStatus({ ...cell, voltage }) }
        : cell
    );
    if (JSON.stringify(updatedCells) !== JSON.stringify(prevCells)) {
      setCells(updatedCells);
    }
  };

  const handleLoadInstructions = () => {
    console.log("DashBoard: Load instructions button clicked");
    if (fileInputRef.current) {
      console.log("DashBoard: Triggering file input");
      fileInputRef.current.click();
    } else {
      console.error("DashBoard: File input ref is null");
      alert("File input is not available. Please refresh the page.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("DashBoard: File change event triggered");
    const file = event.target.files?.[0];
    if (!file) {
      console.warn("DashBoard: No file selected");
      alert("No file selected. Please choose a JSON file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log("DashBoard: Reading file:", file.name);
        const text = e.target?.result as string;
        const data = JSON.parse(text);
        if (!Array.isArray(data)) {
          throw new Error("File must contain a JSON array of instructions.");
        }

        const errors = data
          .map((item, index) => validateInstruction(item, index, data.length))
          .filter((error): error is string => error !== null);
        if (errors.length > 0) {
          console.error("DashBoard: Validation errors:", errors);
          alert(`Invalid instructions:\n${errors.join("\n")}`);
          return;
        }

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
        console.log("DashBoard: Loaded instructions:", validData);
        if (validData.length === 1 && validData[0].command === "cycle") {
          alert(
            `Warning: Single cycle instruction will loop itself ${validData[0].param2} times. Add more instructions for meaningful looping.`
          );
        } else {
          alert(`Successfully loaded ${validData.length} instructions.`);
        }
      } catch (error) {
        console.error("DashBoard: Error parsing file:", error);
        alert(
          `Error loading file: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    };
    reader.onerror = () => {
      console.error("DashBoard: File read error");
      alert("Failed to read file. Please ensure it is a valid JSON file.");
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleClearInstructions = () => {
    setInstructions([]);
    console.log("DashBoard: Cleared instructions");
    alert("Instructions cleared.");
  };

  const batteryCells = useMemo(
    () => [...csu1Cells, ...csu2Cells],
    [csu1Cells, csu2Cells]
  );

  useEffect(() => {
    console.log("DashBoard: Props for ErrorWarningPanel", {
      csu1Cells,
      csu2Cells,
      dcCsuResponseData,
    });
  }, [csu1Cells, csu2Cells, dcCsuResponseData]);

  return (
    <div className="flex flex-col max-h-full bg-zinc-100">
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
              {csu1Cells.length > 0 &&
              csu2Cells.length > 0 &&
              dcCsuResponseData ? (
                <ErrorWarningPanel
                  csu1Cells={csu1Cells}
                  csu2Cells={csu2Cells}
                  daisyChainData={dcCsuResponseData}
                />
              ) : (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
                  Loading cell data...
                </div>
              )}
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

const validateInstruction = (
  item: any,
  index: number,
  totalLength: number
): string | null => {
  if (!item || typeof item !== "object") {
    return `Instruction ${index + 1}: Invalid format (must be an object).`;
  }
  if (!item.command || typeof item.command !== "string") {
    return `Instruction ${index + 1}: Missing or invalid 'command' field.`;
  }
  if (!validCommands.includes(item.command)) {
    return `Instruction ${index + 1}: Invalid command '${item.command}'.`;
  }

  switch (item.command) {
    case "set_voltage":
    case "set_temp":
    case "set_balance":
    case "set_ow":
      if (!item.cellNo || typeof item.cellNo !== "string") {
        return `Instruction ${index + 1}: Missing or invalid 'cellNo' for ${
          item.command
        }.`;
      }
      const cellNo = parseInt(item.cellNo);
      if (isNaN(cellNo) || cellNo < 1 || cellNo > 24) {
        return `Instruction ${
          index + 1
        }: 'cellNo' must be between 1 and 24 for ${item.command}.`;
      }
      if (
        item.command === "set_voltage" &&
        (!item.voltage || isNaN(parseFloat(item.voltage)))
      ) {
        return `Instruction ${
          index + 1
        }: Invalid or missing 'voltage' for set_voltage.`;
      }
      if (
        item.command === "set_temp" &&
        (!item.temperature || isNaN(parseFloat(item.temperature)))
      ) {
        return `Instruction ${
          index + 1
        }: Invalid or missing 'temperature' for set_temp.`;
      }
      break;
    case "delay":
      if (!item.time || isNaN(parseInt(item.time))) {
        return `Instruction ${index + 1}: Invalid or missing 'time' for delay.`;
      }
      break;
    case "cycle":
      if (!item.param1 || !item.param2 || !item.cycleNo) {
        return `Instruction ${
          index + 1
        }: Missing 'param1', 'param2', or 'cycleNo' for cycle.`;
      }
      if (index !== totalLength - 1) {
        return `Instruction ${
          index + 1
        }: 'cycle' must be the last instruction.`;
      }
      break;
    case "end":
      if (index !== totalLength - 1) {
        return `Instruction ${index + 1}: 'end' must be the last instruction.`;
      }
      break;
  }
  return null;
};

export default DashBoard;
