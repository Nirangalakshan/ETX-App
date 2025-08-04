// //normal report generation
// import React, { useMemo } from "react";
// import CustomTitleBar from "../components/MenuBar";
// import { useBatteryContext } from "../BatteryContext";
// import { ResponseData } from "./components/test";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";

// type CellStatus = "normal" | "warning" | "critical" | "no-data";

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

// const Report: React.FC = () => {
//   const {
//     csu1ResponseData,
//     csu2ResponseData,
//     dcCsuResponseData,
//     responseData,
//     daisyChainData,
//     instructions,
//   } = useBatteryContext();

//   // Calculate cell statuses
//   const calculateStatus = (voltage: number | null, temperature: number | null): CellStatus => {
//     if (voltage === null && temperature === null) {
//       return "no-data";
//     }
//     let status: CellStatus = "normal";
//     if (voltage !== null) {
//       if (voltage > 1.0) {
//         status = "critical";
//       } else if (voltage < 1.0) {
//         status = "warning";
//       }
//     }
//     if (temperature !== null) {
//       if (temperature > 60) {
//         status = "critical";
//       } else if (temperature > 45 && status !== "critical") {
//         status = "warning";
//       }
//     }
//     return status;
//   };

//   // Process CSU1 and CSU2 cells
//   const csu1Cells: BatteryCell[] = useMemo(() => {
//     return Array.from({ length: 12 }, (_, i) => {
//       const dataItems = csu1ResponseData[i] || [];
//       const voltageItem = dataItems.find((item) => item.command === "get_11_csu_volt");
//       const tempItem = dataItems.find((item) => item.command === "get_11_csu_temp");
//       const balanceItem = dataItems.find(
//         (item) => item.command === "get_11_csu_balance_reg"
//       );
//       const openWireItem = dataItems.find((item) => item.command === "get_11_csu_ow");
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//       const temperature = tempItem
//         ? parseFloat(tempItem.value.replace(" °C", ""))
//         : null;

//       return {
//         id: i,
//         voltage,
//         temperature,
//         status: calculateStatus(voltage, temperature),
//         setVoltage: 3.65,
//         balancing: balanceItem?.value === "On",
//         openWire: openWireItem?.value === "On",
//         data: null,
//         voltageLimits: null,
//       };
//     });
//   }, [csu1ResponseData]);

//   const csu2Cells: BatteryCell[] = useMemo(() => {
//     return Array.from({ length: 12 }, (_, i) => {
//       const dataItems = csu2ResponseData[i] || [];
//       const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
//       const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");
//       const balanceItem = dataItems.find(
//         (item) => item.command === "get_12_csu_balance_reg"
//       );
//       const openWireItem = dataItems.find((item) => item.command === "get_12_csu_ow");
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//       const temperature = tempItem
//         ? parseFloat(tempItem.value.replace(" °C", ""))
//         : null;

//       return {
//         id: i + 12,
//         voltage,
//         temperature,
//         status: calculateStatus(voltage, temperature),
//         setVoltage: 3.65,
//         balancing: balanceItem?.value === "On",
//         openWire: openWireItem?.value === "On",
//         data: null,
//         voltageLimits: null,
//       };
//     });
//   }, [csu2ResponseData]);

//   // Process daisy chain issues
//   const daisyChainIssues = useMemo(() => {
//     const issues: { type: string; cellId: number; status: CellStatus; details: string }[] =
//       [];
//     if (dcCsuResponseData && typeof dcCsuResponseData === "object") {
//       Object.entries(dcCsuResponseData).forEach(([dcIc, cellData]) => {
//         Object.entries(cellData).forEach(([cellNo, dataItems]) => {
//           const cellId = parseInt(cellNo);
//           const openWireItem = dataItems.find((item) => item.command === "get_dc_csu_ow");
//           const voltageItem = dataItems.find((item) => item.command === "get_dc_csu_volt");
//           const tempItem = dataItems.find((item) => item.command === "get_dc_csu_temp");
//           const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//           const temperature = tempItem
//             ? parseFloat(tempItem.value.replace(" °C", ""))
//             : null;
//           const status = calculateStatus(voltage, temperature);
//           if (status !== "no-data" || (openWireItem && openWireItem.value === "On")) {
//             const details = `Voltage: ${voltageItem ? voltageItem.value : "N/A"}V, Temperature: ${
//               tempItem ? tempItem.value : "N/A"
//             }, Daisy Chain: ${openWireItem?.value ?? "N/A"}`;
//             issues.push({
//               type: `Daisy Chain (IC ${dcIc})`,
//               cellId,
//               status: openWireItem && openWireItem.value === "On" ? "warning" : status,
//               details,
//             });
//           }
//         });
//       });
//     }
//     return issues;
//   }, [dcCsuResponseData]);

//   // Filter statuses for CSU1 and CSU2
//   const csu1NormalCells = useMemo(() => csu1Cells.filter((cell) => cell.status === "normal"), [csu1Cells]);
//   const csu1Warnings = useMemo(() => csu1Cells.filter((cell) => cell.status === "warning"), [csu1Cells]);
//   const csu1Errors = useMemo(() => csu1Cells.filter((cell) => cell.status === "critical"), [csu1Cells]);
//   const csu1NoDataCells = useMemo(() => csu1Cells.filter((cell) => cell.status === "no-data"), [csu1Cells]);
//   const csu2NormalCells = useMemo(() => csu2Cells.filter((cell) => cell.status === "normal"), [csu2Cells]);
//   const csu2Warnings = useMemo(() => csu2Cells.filter((cell) => cell.status === "warning"), [csu2Cells]);
//   const csu2Errors = useMemo(() => csu2Cells.filter((cell) => cell.status === "critical"), [csu2Cells]);
//   const csu2NoDataCells = useMemo(() => csu2Cells.filter((cell) => cell.status === "no-data"), [csu2Cells]);
//   const daisyChainNormal = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "normal"), [daisyChainIssues]);
//   const daisyChainWarnings = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "warning"), [daisyChainIssues]);
//   const daisyChainErrors = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "critical"), [daisyChainIssues]);

//   // Split instructions by CSU
//   const csu1Instructions = useMemo(() => {
//     return instructions.filter((instr) => {
//       const cellNo = parseInt(instr.cellNo);
//       return (
//         !instr.cellNo ||
//         (cellNo >= 1 && cellNo <= 12) ||
//         ["delay", "cycle", "end"].includes(instr.command)
//       );
//     });
//   }, [instructions]);

//   const csu2Instructions = useMemo(() => {
//     return instructions.filter((instr) => {
//       const cellNo = parseInt(instr.cellNo);
//       return (
//         !instr.cellNo ||
//         (cellNo >= 13 && cellNo <= 24) ||
//         ["delay", "cycle", "end"].includes(instr.command)
//       );
//     });
//   }, [instructions]);

//   // Instruction summaries
//   const csu1InstructionSummary = useMemo(() => {
//     const commandCounts: Record<string, number> = {};
//     csu1Instructions.forEach((instr) => {
//       commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
//     });
//     return Object.entries(commandCounts)
//       .map(([command, count]) => `${count} ${command}`)
//       .join(", ");
//   }, [csu1Instructions]);

//   const csu2InstructionSummary = useMemo(() => {
//     const commandCounts: Record<string, number> = {};
//     csu2Instructions.forEach((instr) => {
//       commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
//     });
//     return Object.entries(commandCounts)
//       .map(([command, count]) => `${count} ${command}`)
//       .join(", ");
//   }, [csu2Instructions]);

//   const daisyChainInstructionSummary = useMemo(() => {
//     const commandCounts: Record<string, number> = {};
//     instructions.forEach((instr) => {
//       commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
//     });
//     return Object.entries(commandCounts)
//       .map(([command, count]) => `${count} ${command}`)
//       .join(", ");
//   }, [instructions]);

//   // Voltage comparison for set_voltage instructions
//   const voltageComparisons = useMemo(() => {
//     const comparisons: {
//       cellId: number;
//       setVoltage: number | null;
//       actualVoltage: number | null;
//       variance: number | null;
//       status: "Match" | "Mismatch" | "No Data";
//     }[] = [];
//     const voltageInstructions = instructions.filter(
//       (instr) => instr.command === "set_voltage"
//     );

//     voltageInstructions.forEach((instr) => {
//       const cellNo = parseInt(instr.cellNo) - 1;
//       if (cellNo < 0 || cellNo >= 24) return;
//       const setVoltage = parseFloat(instr.voltage);
//       if (isNaN(setVoltage)) return;

//       const isCSU1 = cellNo < 12;
//       const cellIndex = isCSU1 ? cellNo : cellNo - 12;
//       const cell = isCSU1 ? csu1Cells[cellIndex] : csu2Cells[cellIndex];
//       const actualVoltage = cell.voltage;

//       const variance =
//         actualVoltage !== null && setVoltage !== null
//           ? Math.abs(actualVoltage - setVoltage)
//           : null;
//       const status =
//         actualVoltage === null || setVoltage === null
//           ? "No Data"
//           : variance <= 0.1
//           ? "Match"
//           : "Mismatch";

//       comparisons.push({
//         cellId: cellNo,
//         setVoltage,
//         actualVoltage,
//         variance,
//         status,
//       });
//     });

//     return comparisons;
//   }, [instructions, csu1Cells, csu2Cells]);

//   // Format instruction details
//   const formatInstruction = (instruction: SetInstruction) => {
//     switch (instruction.command) {
//       case "set_voltage":
//         return `Set Voltage for Cell ${instruction.cellNo}: ${instruction.voltage}V`;
//       case "set_temp":
//         return `Set Temperature for Cell ${instruction.cellNo}: ${instruction.temperature}°C`;
//       case "set_balance":
//         return `Set Balancing for Cell ${instruction.cellNo}: On`;
//       case "set_ow":
//         return `Set Open Wire for Cell ${instruction.cellNo}: On`;
//       case "delay":
//         return `Delay: ${instruction.time}ms`;
//       case "cycle":
//         return `Cycle: ${instruction.param1}, ${instruction.param2} times`;
//       case "end":
//         return "End Instruction";
//       default:
//         return `Unknown Command: ${instruction.command}`;
//     }
//   };

//   // Download report as PDF
//   const downloadReport = () => {
//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text("Battery System Report", 20, 20);
//     let currentY = 30;

//     // CSU1 Summary
//     doc.setFontSize(12);
//     doc.text("CSU1 Summary", 20, currentY);
//     autoTable(doc, {
//       startY: currentY + 5,
//       head: [["Metric", "Value"]],
//       body: [
//         ["Total Cells", "12"],
//         ["Normal Cells", csu1NormalCells.length.toString()],
//         ["Critical Errors", csu1Errors.length.toString()],
//         ["Warnings", csu1Warnings.length.toString()],
//         ["No Data Cells", csu1NoDataCells.length.toString()],
//         ["Instructions Sent", csu1Instructions.length.toString()],
//         ["Instruction Breakdown", csu1InstructionSummary || "None"],
//       ],
//       theme: "grid",
//       styles: { fontSize: 10 },
//     });
//     currentY = (doc as any).lastAutoTable.finalY + 10;

//     // CSU2 Summary
//     doc.setFontSize(12);
//     doc.text("CSU2 Summary", 20, currentY);
//     autoTable(doc, {
//       startY: currentY + 5,
//       head: [["Metric", "Value"]],
//       body: [
//         ["Total Cells", "12"],
//         ["Normal Cells", csu2NormalCells.length.toString()],
//         ["Critical Errors", csu2Errors.length.toString()],
//         ["Warnings", csu2Warnings.length.toString()],
//         ["No Data Cells", csu2NoDataCells.length.toString()],
//         ["Instructions Sent", csu2Instructions.length.toString()],
//         ["Instruction Breakdown", csu2InstructionSummary || "None"],
//       ],
//       theme: "grid",
//       styles: { fontSize: 10 },
//     });
//     currentY = (doc as any).lastAutoTable.finalY + 10;

//     // Daisy Chain Summary
//     doc.setFontSize(12);
//     doc.text("Daisy Chain Summary", 20, currentY);
//     autoTable(doc, {
//       startY: currentY + 5,
//       head: [["Metric", "Value"]],
//       body: [
//         ["Total Cells", daisyChainIssues.length.toString()],
//         ["Normal Cells", daisyChainNormal.length.toString()],
//         ["Critical Errors", daisyChainErrors.length.toString()],
//         ["Warnings", daisyChainWarnings.length.toString()],
//         ["Instructions Sent", instructions.length.toString()],
//         ["Instruction Breakdown", daisyChainInstructionSummary || "None"],
//       ],
//       theme: "grid",
//       styles: { fontSize: 10 },
//     });
//     currentY = (doc as any).lastAutoTable.finalY + 10;

//     // CSU1 Normal Cells
//     if (csu1NormalCells.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU1 Normal Cells (${csu1NormalCells.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu1NormalCells.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // CSU2 Normal Cells
//     if (csu2NormalCells.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU2 Normal Cells (${csu2NormalCells.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu2NormalCells.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // CSU1 Critical Errors
//     if (csu1Errors.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU1 Critical Errors (${csu1Errors.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu1Errors.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // CSU2 Critical Errors
//     if (csu2Errors.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU2 Critical Errors (${csu2Errors.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu2Errors.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // CSU1 Warnings
//     if (csu1Warnings.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU1 Warnings (${csu1Warnings.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu1Warnings.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // CSU2 Warnings
//     if (csu2Warnings.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`CSU2 Warnings (${csu2Warnings.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell", "Details"]],
//         body: csu2Warnings.map((cell) => [
//           `Cell ${cell.id}`,
//           `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
//             cell.temperature?.toFixed(1) ?? "-"
//           }°C${cell.balancing ? ", Balancing: On" : ""}${
//             cell.openWire ? ", Open Wire: Detected" : ""
//           }`,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // Daisy Chain Issues
//     if (daisyChainIssues.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`Daisy Chain Issues (${daisyChainIssues.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Item", "Details"]],
//         body: daisyChainIssues.map((item) => [item.type, item.details]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // No Data Cells
//     if (csu1NoDataCells.length > 0 || csu2NoDataCells.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`Cells with No Data`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["CSU", "Cell IDs"]],
//         body: [
//           ["CSU1", csu1NoDataCells.length > 0 ? csu1NoDataCells.map((cell) => cell.id).join(", ") : "None"],
//           ["CSU2", csu2NoDataCells.length > 0 ? csu2NoDataCells.map((cell) => cell.id).join(", ") : "None"],
//         ],
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // Voltage Comparison
//     if (voltageComparisons.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`Voltage Comparison (${voltageComparisons.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Cell ID", "Set Voltage (V)", "Actual Voltage (V)", "Variance (V)", "Status"]],
//         body: voltageComparisons.map((comp) => [
//           `${comp.cellId} (CSU ${comp.cellId < 12 ? 1 : 2})`,
//           comp.setVoltage?.toFixed(2) ?? "-",
//           comp.actualVoltage?.toFixed(2) ?? "-",
//           comp.variance?.toFixed(2) ?? "-",
//           comp.status,
//         ]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // Instructions Sent
//     if (instructions.length > 0) {
//       doc.setFontSize(12);
//       doc.text(`Instructions Sent (${instructions.length})`, 20, currentY);
//       autoTable(doc, {
//         startY: currentY + 5,
//         head: [["Instruction ID", "Details"]],
//         body: instructions.map((instr) => [instr.id.toString(), formatInstruction(instr)]),
//         theme: "grid",
//         styles: { fontSize: 10 },
//       });
//       currentY = (doc as any).lastAutoTable.finalY + 10;
//     }

//     // No Data
//     if (
//       csu1Cells.every((cell) => cell.status === "no-data") &&
//       csu2Cells.every((cell) => cell.status === "no-data") &&
//       daisyChainIssues.length === 0 &&
//       instructions.length === 0
//     ) {
//       doc.setFontSize(10);
//       doc.text("No data available for report.", 20, currentY);
//     }

//     doc.save("Battery_System_Report.pdf");
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-100">
//       <CustomTitleBar />
//       <div className="flex-1 p-6">
//         <div className="flex justify-between items-center mb-6">
//           <h1 className="text-xl font-bold text-gray-800">Battery System Report</h1>
//           <button
//             onClick={downloadReport}
//             className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
//           >
//             Download Report (PDF)
//           </button>
//         </div>
//         <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
//           {/* CSU1 Summary */}
//           <div>
//             <h2 className="text-xl font-semibold text-gray-700 mb-4">CSU1 Summary</h2>
//             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
//               <div>
//                 <p className="text-sm text-gray-600">Total Cells</p>
//                 <p className="text-lg font-medium">12</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Normal Cells</p>
//                 <p className="text-lg font-medium text-green-600">{csu1NormalCells.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Critical Errors</p>
//                 <p className="text-lg font-medium text-red-600">{csu1Errors.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Warnings</p>
//                 <p className="text-lg font-medium text-yellow-600">{csu1Warnings.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">No Data Cells</p>
//                 <p className="text-lg font-medium">{csu1NoDataCells.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instructions Sent</p>
//                 <p className="text-lg font-medium">{csu1Instructions.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instruction Breakdown</p>
//                 <p className="text-lg font-medium">{csu1InstructionSummary || "None"}</p>
//               </div>
//             </div>
//           </div>

//           {/* CSU2 Summary */}
//           <div>
//             <h2 className="text-xl font-semibold text-gray-700 mb-4">CSU2 Summary</h2>
//             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
//               <div>
//                 <p className="text-sm text-gray-600">Total Cells</p>
//                 <p className="text-lg font-medium">12</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Normal Cells</p>
//                 <p className="text-lg font-medium text-green-600">{csu2NormalCells.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Critical Errors</p>
//                 <p className="text-lg font-medium text-red-600">{csu2Errors.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Warnings</p>
//                 <p className="text-lg font-medium text-yellow-600">{csu2Warnings.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">No Data Cells</p>
//                 <p className="text-lg font-medium">{csu2NoDataCells.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instructions Sent</p>
//                 <p className="text-lg font-medium">{csu2Instructions.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instruction Breakdown</p>
//                 <p className="text-lg font-medium">{csu2InstructionSummary || "None"}</p>
//               </div>
//             </div>
//           </div>

//           {/* Daisy Chain Summary */}
//           <div>
//             <h2 className="text-xl font-semibold text-gray-700 mb-4">Daisy Chain Summary</h2>
//             <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
//               <div>
//                 <p className="text-sm text-gray-600">Total Cells</p>
//                 <p className="text-lg font-medium">{daisyChainIssues.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Normal Cells</p>
//                 <p className="text-lg font-medium text-green-600">{daisyChainNormal.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Critical Errors</p>
//                 <p className="text-lg font-medium text-red-600">{daisyChainErrors.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Warnings</p>
//                 <p className="text-lg font-medium text-yellow-600">{daisyChainWarnings.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instructions Sent</p>
//                 <p className="text-lg font-medium">{instructions.length}</p>
//               </div>
//               <div>
//                 <p className="text-sm text-gray-600">Instruction Breakdown</p>
//                 <p className="text-lg font-medium">{daisyChainInstructionSummary || "None"}</p>
//               </div>
//             </div>
//           </div>

//           {/* Cells with No Data */}
//           {(csu1NoDataCells.length > 0 || csu2NoDataCells.length > 0) && (
//             <div>
//               <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 📉 Cells with No Data
//                 <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
//                   {csu1NoDataCells.length + csu2NoDataCells.length}
//                 </span>
//               </h2>
//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800">
//                 <p>
//                   <strong>CSU1:</strong>{" "}
//                   {csu1NoDataCells.length > 0
//                     ? csu1NoDataCells.map((cell) => cell.id).join(", ")
//                     : "None"}
//                 </p>
//                 <p>
//                   <strong>CSU2:</strong>{" "}
//                   {csu2NoDataCells.length > 0
//                     ? csu2NoDataCells.map((cell) => cell.id).join(", ")
//                     : "None"}
//                 </p>
//               </div>
//             </div>
//           )}

//           {/* CSU1 Normal Cells */}
//           {csu1NormalCells.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center gap-2">
//                 🟢 CSU1 Normal Cells
//                 <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//                   {csu1NormalCells.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu1NormalCells.map((cell, index) => (
//                   <li
//                     key={`csu1-normal-${index}`}
//                     className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* CSU2 Normal Cells */}
//           {csu2NormalCells.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center gap-2">
//                 🟢 CSU2 Normal Cells
//                 <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
//                   {csu2NormalCells.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu2NormalCells.map((cell, index) => (
//                   <li
//                     key={`csu2-normal-${index}`}
//                     className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* CSU1 Critical Errors */}
//           {csu1Errors.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-red-600 mb-4 flex items-center gap-2">
//                 🔴 CSU1 Critical Errors
//                 <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
//                   {csu1Errors.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu1Errors.map((cell, index) => (
//                   <li
//                     key={`csu1-error-${index}`}
//                     className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* CSU2 Critical Errors */}
//           {csu2Errors.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-red-600 mb-4 flex items-center gap-2">
//                 🔴 CSU2 Critical Errors
//                 <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
//                   {csu2Errors.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu2Errors.map((cell, index) => (
//                   <li
//                     key={`csu2-error-${index}`}
//                     className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* CSU1 Warnings */}
//           {csu1Warnings.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-yellow-600 mb-4 flex items-center gap-2">
//                 🟡 CSU1 Warnings
//                 <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
//                   {csu1Warnings.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu1Warnings.map((cell, index) => (
//                   <li
//                     key={`csu1-warning-${index}`}
//                     className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* CSU2 Warnings */}
//           {csu2Warnings.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-yellow-600 mb-4 flex items-center gap-2">
//                 🟡 CSU2 Warnings
//                 <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
//                   {csu2Warnings.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {csu2Warnings.map((cell, index) => (
//                   <li
//                     key={`csu2-warning-${index}`}
//                     className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800"
//                   >
//                     <strong>Cell {cell.id}</strong><br />
//                     Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
//                     Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
//                     {cell.balancing && (
//                       <>
//                         <br />
//                         Balancing: On
//                       </>
//                     )}
//                     {cell.openWire && (
//                       <>
//                         <br />
//                         Open Wire: Detected
//                       </>
//                     )}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Daisy Chain Issues */}
//           {daisyChainIssues.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 🌐 Daisy Chain Issues
//                 <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
//                   {daisyChainIssues.length}
//                 </span>
//               </h2>
//               <ul className="space-y-3">
//                 {daisyChainIssues.map((item, index) => (
//                   <li
//                     key={`daisy-chain-${index}`}
//                     className={`border rounded-lg p-4 text-sm ${
//                       item.status === "warning"
//                         ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                         : item.status === "critical"
//                         ? "bg-red-50 border-red-200 text-red-800"
//                         : "bg-green-50 border-green-200 text-green-800"
//                     }`}
//                   >
//                     <strong>{item.type} Cell {item.cellId}</strong>
//                     <br />
//                     {item.details}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* Voltage Comparison */}
//           {voltageComparisons.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                 ⚡ Voltage Comparison
//                 <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                   {voltageComparisons.length}
//                 </span>
//               </h2>
//               <div className="overflow-x-auto">
//                 <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
//                   <thead>
//                     <tr className="bg-gray-100">
//                       <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
//                         Cell ID
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
//                         Set Voltage (V)
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
//                         Actual Voltage (V)
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
//                         Variance (V)
//                       </th>
//                       <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
//                         Status
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {voltageComparisons.map((comp, index) => (
//                       <tr
//                         key={`comp-${index}`}
//                         className="border-t border-gray-200"
//                       >
//                         <td className="px-4 py-2 text-sm text-gray-800">
//                           {comp.cellId} (CSU {comp.cellId < 12 ? 1 : 2})
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-800">
//                           {comp.setVoltage?.toFixed(2) ?? "-"}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-800">
//                           {comp.actualVoltage?.toFixed(2) ?? "-"}
//                         </td>
//                         <td className="px-4 py-2 text-sm text-gray-800">
//                           {comp.variance?.toFixed(2) ?? "-"}
//                         </td>
//                         <td
//                           className={`px-4 py-2 text-sm ${
//                             comp.status === "Match"
//                               ? "text-green-600"
//                               : comp.status === "Mismatch"
//                               ? "text-red-600"
//                               : "text-gray-600"
//                           }`}
//                         >
//                           {comp.status}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           )}

//           {/* Instructions Sent */}
//           {instructions.length > 0 && (
//             <div>
//               <h2 className="text-2xl font-semibold text-gray-700 mb-4">
//                 Instructions Sent
//               </h2>
//               <ul className="space-y-3">
//                 {instructions.map((instruction, index) => (
//                   <li
//                     key={`instruction-${index}`}
//                     className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800"
//                   >
//                     <strong>Instruction {instruction.id}</strong>: {formatInstruction(instruction)}
//                   </li>
//                 ))}
//               </ul>
//             </div>
//           )}

//           {/* No Data */}
//           {csu1Cells.every((cell) => cell.status === "no-data") &&
//             csu2Cells.every((cell) => cell.status === "no-data") &&
//             daisyChainIssues.length === 0 &&
//             instructions.length === 0 && (
//               <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                 No data available for report.
//               </div>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Report;














//AI Analysis
import React, { useMemo, useEffect, useCallback } from "react";
import CustomTitleBar from "../components/MenuBar";
import { useBatteryContext } from "../BatteryContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import CryptoJS from "crypto-js"; // Use crypto-js for hashing

type CellStatus = "normal" | "warning" | "critical" | "no-data";

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

const Report: React.FC = () => {
  const {
    csu1ResponseData,
    csu2ResponseData,
    dcCsuResponseData,
    responseData,
    daisyChainData,
    instructions,
    aiAnalysis,
    setAIAnalysis,
  } = useBatteryContext();

  // Calculate cell statuses
  const calculateStatus = (voltage: number | null, temperature: number | null): CellStatus => {
    if (voltage === null && temperature === null) {
      return "no-data";
    }
    let status: CellStatus = "normal";
    if (voltage !== null) {
      if (voltage > 1.0) {
        status = "critical";
      } else if (voltage < 1.0) {
        status = "warning";
      }
    }
    if (temperature !== null) {
      if (temperature > 60) {
        status = "critical";
      } else if (temperature > 45 && status !== "critical") {
        status = "warning";
      }
    }
    return status;
  };

  // Process CSU1 and CSU2 cells
  const csu1Cells: BatteryCell[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const dataItems = csu1ResponseData[i] || [];
      const voltageItem = dataItems.find((item) => item.command === "get_11_csu_volt");
      const tempItem = dataItems.find((item) => item.command === "get_11_csu_temp");
      const balanceItem = dataItems.find(
        (item) => item.command === "get_11_csu_balance_reg"
      );
      const openWireItem = dataItems.find((item) => item.command === "get_11_csu_ow");
      const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
      const temperature = tempItem
        ? parseFloat(tempItem.value.replace(" °C", ""))
        : null;

      return {
        id: i,
        voltage,
        temperature,
        status: calculateStatus(voltage, temperature),
        setVoltage: 3.65,
        balancing: balanceItem?.value === "On",
        openWire: openWireItem?.value === "On",
        data: null,
        voltageLimits: null,
      };
    });
  }, [csu1ResponseData]);

  const csu2Cells: BatteryCell[] = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const dataItems = csu2ResponseData[i] || [];
      const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
      const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");
      const balanceItem = dataItems.find(
        (item) => item.command === "get_12_csu_balance_reg"
      );
      const openWireItem = dataItems.find((item) => item.command === "get_12_csu_ow");
      const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
      const temperature = tempItem
        ? parseFloat(tempItem.value.replace(" °C", ""))
        : null;

      return {
        id: i + 12,
        voltage,
        temperature,
        status: calculateStatus(voltage, temperature),
        setVoltage: 3.65,
        balancing: balanceItem?.value === "On",
        openWire: openWireItem?.value === "On",
        data: null,
        voltageLimits: null,
      };
    });
  }, [csu2ResponseData]);

  // Process daisy chain issues
  const daisyChainIssues = useMemo(() => {
    const issues: { type: string; cellId: number; status: CellStatus; details: string }[] = [];
    if (dcCsuResponseData && typeof dcCsuResponseData === "object") {
      Object.entries(dcCsuResponseData).forEach(([dcIc, cellData]) => {
        Object.entries(cellData).forEach(([cellNo, dataItems]) => {
          const cellId = parseInt(cellNo);
          const openWireItem = dataItems.find((item) => item.command === "get_dc_csu_ow");
          const voltageItem = dataItems.find((item) => item.command === "get_dc_csu_volt");
          const tempItem = dataItems.find((item) => item.command === "get_dc_csu_temp");
          const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
          const temperature = tempItem
            ? parseFloat(tempItem.value.replace(" °C", ""))
            : null;
          const status = calculateStatus(voltage, temperature);
          if (status !== "no-data" || (openWireItem && openWireItem.value === "On")) {
            const details = `Voltage: ${voltageItem ? voltageItem.value : "N/A"}V, Temperature: ${
              tempItem ? tempItem.value : "N/A"
            }, Daisy Chain: ${openWireItem?.value ?? "N/A"}`;
            issues.push({
              type: `Daisy Chain (IC ${dcIc})`,
              cellId,
              status: openWireItem && openWireItem.value === "On" ? "warning" : status,
              details,
            });
          }
        });
      });
    }
    return issues;
  }, [dcCsuResponseData]);

  // Filter statuses for CSU1 and CSU2
  const csu1NormalCells = useMemo(() => csu1Cells.filter((cell) => cell.status === "normal"), [csu1Cells]);
  const csu1Warnings = useMemo(() => csu1Cells.filter((cell) => cell.status === "warning"), [csu1Cells]);
  const csu1Errors = useMemo(() => csu1Cells.filter((cell) => cell.status === "critical"), [csu1Cells]);
  const csu1NoDataCells = useMemo(() => csu1Cells.filter((cell) => cell.status === "no-data"), [csu1Cells]);
  const csu2NormalCells = useMemo(() => csu2Cells.filter((cell) => cell.status === "normal"), [csu2Cells]);
  const csu2Warnings = useMemo(() => csu2Cells.filter((cell) => cell.status === "warning"), [csu2Cells]);
  const csu2Errors = useMemo(() => csu2Cells.filter((cell) => cell.status === "critical"), [csu2Cells]);
  const csu2NoDataCells = useMemo(() => csu2Cells.filter((cell) => cell.status === "no-data"), [csu2Cells]);
  const daisyChainNormal = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "normal"), [daisyChainIssues]);
  const daisyChainWarnings = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "warning"), [daisyChainIssues]);
  const daisyChainErrors = useMemo(() => daisyChainIssues.filter((issue) => issue.status === "critical"), [daisyChainIssues]);

  // Split instructions by CSU
  const csu1Instructions = useMemo(() => {
    return instructions.filter((instr) => {
      const cellNo = parseInt(instr.cellNo);
      return (
        !instr.cellNo ||
        (cellNo >= 1 && cellNo <= 12) ||
        ["delay", "cycle", "end"].includes(instr.command)
      );
    });
  }, [instructions]);

  const csu2Instructions = useMemo(() => {
    return instructions.filter((instr) => {
      const cellNo = parseInt(instr.cellNo);
      return (
        !instr.cellNo ||
        (cellNo >= 13 && cellNo <= 24) ||
        ["delay", "cycle", "end"].includes(instr.command)
      );
    });
  }, [instructions]);

  // Instruction summaries
  const csu1InstructionSummary = useMemo(() => {
    const commandCounts: Record<string, number> = {};
    csu1Instructions.forEach((instr) => {
      commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
    });
    return Object.entries(commandCounts)
      .map(([command, count]) => `${count} ${command}`)
      .join(", ");
  }, [csu1Instructions]);

  const csu2InstructionSummary = useMemo(() => {
    const commandCounts: Record<string, number> = {};
    csu2Instructions.forEach((instr) => {
      commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
    });
    return Object.entries(commandCounts)
      .map(([command, count]) => `${count} ${command}`)
      .join(", ");
  }, [csu2Instructions]);

  const daisyChainInstructionSummary = useMemo(() => {
    const commandCounts: Record<string, number> = {};
    instructions.forEach((instr) => {
      commandCounts[instr.command] = (commandCounts[instr.command] || 0) + 1;
    });
    return Object.entries(commandCounts)
      .map(([command, count]) => `${count} ${command}`)
      .join(", ");
  }, [instructions]);

  // Voltage comparison for set_voltage instructions
  const voltageComparisons = useMemo(() => {
    const comparisons: {
      cellId: number;
      setVoltage: number | null;
      actualVoltage: number | null;
      variance: number | null;
      status: "Match" | "Mismatch" | "No Data";
    }[] = [];
    const voltageInstructions = instructions.filter(
      (instr) => instr.command === "set_voltage"
    );

    voltageInstructions.forEach((instr) => {
      const cellNo = parseInt(instr.cellNo) - 1;
      if (cellNo < 0 || cellNo >= 24) return;
      const setVoltage = parseFloat(instr.voltage);
      if (isNaN(setVoltage)) return;

      const isCSU1 = cellNo < 12;
      const cellIndex = isCSU1 ? cellNo : cellNo - 12;
      const cell = isCSU1 ? csu1Cells[cellIndex] : csu2Cells[cellIndex];
      const actualVoltage = cell.voltage;

      const variance =
        actualVoltage !== null && setVoltage !== null
          ? Math.abs(actualVoltage - setVoltage)
          : null;
      const status =
        actualVoltage === null || setVoltage === null
          ? "No Data"
          : variance <= 0.1
          ? "Match"
          : "Mismatch";

      comparisons.push({
        cellId: cellNo,
        setVoltage,
        actualVoltage,
        variance,
        status,
      });
    });

    return comparisons;
  }, [instructions, csu1Cells, csu2Cells]);

  // Memoized AI input data
  const dataSummary = useMemo(() => {
    return {
      csu1Cells: csu1Cells.map((cell) => ({
        id: cell.id,
        voltage: cell.voltage,
        temperature: cell.temperature,
        status: cell.status,
        balancing: cell.balancing,
        openWire: cell.openWire,
      })),
      csu2Cells: csu2Cells.map((cell) => ({
        id: cell.id,
        voltage: cell.voltage,
        temperature: cell.temperature,
        status: cell.status,
        balancing: cell.balancing,
        openWire: cell.openWire,
      })),
      daisyChainIssues: daisyChainIssues.map((issue) => ({
        type: issue.type,
        cellId: issue.cellId,
        status: issue.status,
        details: issue.details,
      })),
      instructions: instructions.map((instr) => ({
        id: instr.id,
        command: instr.command,
        cellNo: instr.cellNo,
        voltage: instr.voltage,
        temperature: instr.temperature,
        time: instr.time,
      })),
      voltageComparisons: voltageComparisons.map((comp) => ({
        cellId: comp.cellId,
        setVoltage: comp.setVoltage,
        actualVoltage: comp.actualVoltage,
        variance: comp.variance,
        status: comp.status,
      })),
    };
  }, [csu1Cells, csu2Cells, daisyChainIssues, instructions, voltageComparisons]);

  // Generate a hash of the dataSummary for comparison
  const dataHash = useMemo(() => {
    return CryptoJS.SHA256(JSON.stringify(dataSummary)).toString();
  }, [dataSummary]);

  // Fetch AI analysis via IPC to Ollama
  const fetchAIAnalysis = useCallback(async () => {
    setAIAnalysis((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await (window as any).electronAPI.fetchAIAnalysis(dataSummary);
      if (result.error) {
        throw new Error(result.error);
      }

      setAIAnalysis({
        summary: result.summary,
        recommendations: result.recommendations,
        isLoading: false,
        error: null,
        dataHash,
      });
    } catch (error) {
      console.error("Error fetching AI analysis:", error);
      setAIAnalysis({
        summary: "",
        recommendations: [],
        isLoading: false,
        error: "Failed to fetch AI analysis. Ensure Ollama is running and the model is available.",
        dataHash: undefined,
      });
    }
  }, [dataSummary, dataHash, setAIAnalysis]);

  // Fetch AI analysis only if no valid analysis exists or data has changed
  useEffect(() => {
    if (
      !aiAnalysis.isLoading &&
      (!aiAnalysis.summary || aiAnalysis.dataHash !== dataHash)
    ) {
      fetchAIAnalysis();
    }
  }, [aiAnalysis, dataHash, fetchAIAnalysis]);

  // Manual refresh handler
  const handleRefreshAI = useCallback(() => {
    fetchAIAnalysis();
  }, [fetchAIAnalysis]);

  // Format instruction details
  const formatInstruction = (instruction: SetInstruction) => {
    switch (instruction.command) {
      case "set_voltage":
        return `Set Voltage for Cell ${instruction.cellNo}: ${instruction.voltage}V`;
      case "set_temp":
        return `Set Temperature for Cell ${instruction.cellNo}: ${instruction.temperature}°C`;
      case "set_balance":
        return `Set Balancing for Cell ${instruction.cellNo}: On`;
      case "set_ow":
        return `Set Open Wire for Cell ${instruction.cellNo}: On`;
      case "delay":
        return `Delay: ${instruction.time}ms`;
      case "cycle":
        return `Cycle: ${instruction.param1}, ${instruction.param2} times`;
      case "end":
        return "End Instruction";
      default:
        return `Unknown Command: ${instruction.command}`;
    }
  };

  // Download report as PDF
  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Battery System Report", 20, 20);
    let currentY = 30;

    // AI Analysis
    doc.setFontSize(12);
    doc.text("AI Analysis", 20, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Section", "Details"]],
      body: [
        ["Summary", aiAnalysis.summary || "No AI analysis available."],
        [
          "Recommendations",
          aiAnalysis.recommendations.length > 0
            ? aiAnalysis.recommendations.join("; ")
            : "None",
        ],
        ["Status", aiAnalysis.isLoading ? "Loading..." : aiAnalysis.error || "Completed"],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // CSU1 Summary
    doc.setFontSize(12);
    doc.text("CSU1 Summary", 20, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Metric", "Value"]],
      body: [
        ["Total Cells", "12"],
        ["Normal Cells", csu1NormalCells.length.toString()],
        ["Critical Errors", csu1Errors.length.toString()],
        ["Warnings", csu1Warnings.length.toString()],
        ["No Data Cells", csu1NoDataCells.length.toString()],
        ["Instructions Sent", csu1Instructions.length.toString()],
        ["Instruction Breakdown", csu1InstructionSummary || "None"],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // CSU2 Summary
    doc.setFontSize(12);
    doc.text("CSU2 Summary", 20, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Metric", "Value"]],
      body: [
        ["Total Cells", "12"],
        ["Normal Cells", csu2NormalCells.length.toString()],
        ["Critical Errors", csu2Errors.length.toString()],
        ["Warnings", csu2Warnings.length.toString()],
        ["No Data Cells", csu2NoDataCells.length.toString()],
        ["Instructions Sent", csu2Instructions.length.toString()],
        ["Instruction Breakdown", csu2InstructionSummary || "None"],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // Daisy Chain Summary
    doc.setFontSize(12);
    doc.text("Daisy Chain Summary", 20, currentY);
    autoTable(doc, {
      startY: currentY + 5,
      head: [["Metric", "Value"]],
      body: [
        ["Total Cells", daisyChainIssues.length.toString()],
        ["Normal Cells", daisyChainNormal.length.toString()],
        ["Critical Errors", daisyChainErrors.length.toString()],
        ["Warnings", daisyChainWarnings.length.toString()],
        ["Instructions Sent", instructions.length.toString()],
        ["Instruction Breakdown", daisyChainInstructionSummary || "None"],
      ],
      theme: "grid",
      styles: { fontSize: 10 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 10;

    // CSU1 Normal Cells
    if (csu1NormalCells.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU1 Normal Cells (${csu1NormalCells.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu1NormalCells.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // CSU2 Normal Cells
    if (csu2NormalCells.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU2 Normal Cells (${csu2NormalCells.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu2NormalCells.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // CSU1 Critical Errors
    if (csu1Errors.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU1 Critical Errors (${csu1Errors.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu1Errors.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // CSU2 Critical Errors
    if (csu2Errors.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU2 Critical Errors (${csu2Errors.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu2Errors.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // CSU1 Warnings
    if (csu1Warnings.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU1 Warnings (${csu1Warnings.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu1Warnings.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // CSU2 Warnings
    if (csu2Warnings.length > 0) {
      doc.setFontSize(12);
      doc.text(`CSU2 Warnings (${csu2Warnings.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell", "Details"]],
        body: csu2Warnings.map((cell) => [
          `Cell ${cell.id}`,
          `Voltage: ${cell.voltage?.toFixed(2) ?? "-"}V, Temp: ${
            cell.temperature?.toFixed(1) ?? "-"
          }°C${cell.balancing ? ", Balancing: On" : ""}${
            cell.openWire ? ", Open Wire: Detected" : ""
          }`,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Daisy Chain Issues
    if (daisyChainIssues.length > 0) {
      doc.setFontSize(12);
      doc.text(`Daisy Chain Issues (${daisyChainIssues.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Item", "Details"]],
        body: daisyChainIssues.map((item) => [item.type, item.details]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // No Data Cells
    if (csu1NoDataCells.length > 0 || csu2NoDataCells.length > 0) {
      doc.setFontSize(12);
      doc.text(`Cells with No Data`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["CSU", "Cell IDs"]],
        body: [
          ["CSU1", csu1NoDataCells.length > 0 ? csu1NoDataCells.map((cell) => cell.id).join(", ") : "None"],
          ["CSU2", csu2NoDataCells.length > 0 ? csu2NoDataCells.map((cell) => cell.id).join(", ") : "None"],
        ],
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Voltage Comparison
    if (voltageComparisons.length > 0) {
      doc.setFontSize(12);
      doc.text(`Voltage Comparison (${voltageComparisons.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Cell ID", "Set Voltage (V)", "Actual Voltage (V)", "Variance (V)", "Status"]],
        body: voltageComparisons.map((comp) => [
          `${comp.cellId} (CSU ${comp.cellId < 12 ? 1 : 2})`,
          comp.setVoltage?.toFixed(2) ?? "-",
          comp.actualVoltage?.toFixed(2) ?? "-",
          comp.variance?.toFixed(2) ?? "-",
          comp.status,
        ]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Instructions Sent
    if (instructions.length > 0) {
      doc.setFontSize(12);
      doc.text(`Instructions Sent (${instructions.length})`, 20, currentY);
      autoTable(doc, {
        startY: currentY + 5,
        head: [["Instruction ID", "Details"]],
        body: instructions.map((instr) => [instr.id.toString(), formatInstruction(instr)]),
        theme: "grid",
        styles: { fontSize: 10 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // No Data
    if (
      csu1Cells.every((cell) => cell.status === "no-data") &&
      csu2Cells.every((cell) => cell.status === "no-data") &&
      daisyChainIssues.length === 0 &&
      instructions.length === 0
    ) {
      doc.setFontSize(10);
      doc.text("No data available for report.", 20, currentY);
    }

    doc.save("Battery_System_Report.pdf");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <CustomTitleBar />
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-gray-800">Battery System Report</h1>
          <div className="space-x-2">
            <button
              onClick={handleRefreshAI}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
              disabled={aiAnalysis.isLoading}
            >
              {aiAnalysis.isLoading ? "Loading..." : "Refresh AI Analysis"}
            </button>
            <button
              onClick={downloadReport}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Download Report (PDF)
            </button>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 space-y-6">
          {/* AI Analysis */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
              🤖 AI Analysis
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {aiAnalysis.isLoading ? "Loading..." : aiAnalysis.error ? "Error" : "Completed"}
              </span>
            </h2>
            {aiAnalysis.isLoading ? (
              <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                Loading AI analysis...
              </div>
            ) : aiAnalysis.error ? (
              <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                {aiAnalysis.error}
              </div>
            ) : (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p>
                  <strong>Summary:</strong> {aiAnalysis.summary || "No summary available."}
                </p>
                {aiAnalysis.recommendations.length > 0 && (
                  <>
                    <p className="mt-2">
                      <strong>Recommendations:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      {aiAnalysis.recommendations.map((rec, index) => (
                        <li key={`rec-${index}`}>{rec}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </div>

          {/* CSU1 Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">CSU1 Summary</h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cells</p>
                <p className="text-lg font-medium">12</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Normal Cells</p>
                <p className="text-lg font-medium text-green-600">{csu1NormalCells.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical Errors</p>
                <p className="text-lg font-medium text-red-600">{csu1Errors.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-lg font-medium text-yellow-600">{csu1Warnings.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No Data Cells</p>
                <p className="text-lg font-medium">{csu1NoDataCells.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instructions Sent</p>
                <p className="text-lg font-medium">{csu1Instructions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instruction Breakdown</p>
                <p className="text-lg font-medium">{csu1InstructionSummary || "None"}</p>
              </div>
            </div>
          </div>

          {/* CSU2 Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">CSU2 Summary</h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cells</p>
                <p className="text-lg font-medium">12</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Normal Cells</p>
                <p className="text-lg font-medium text-green-600">{csu2NormalCells.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical Errors</p>
                <p className="text-lg font-medium text-red-600">{csu2Errors.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-lg font-medium text-yellow-600">{csu2Warnings.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">No Data Cells</p>
                <p className="text-lg font-medium">{csu2NoDataCells.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instructions Sent</p>
                <p className="text-lg font-medium">{csu2Instructions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instruction Breakdown</p>
                <p className="text-lg font-medium">{csu2InstructionSummary || "None"}</p>
              </div>
            </div>
          </div>

          {/* Daisy Chain Summary */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">Daisy Chain Summary</h2>
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Cells</p>
                <p className="text-lg font-medium">{daisyChainIssues.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Normal Cells</p>
                <p className="text-lg font-medium text-green-600">{daisyChainNormal.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Critical Errors</p>
                <p className="text-lg font-medium text-red-600">{daisyChainErrors.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Warnings</p>
                <p className="text-lg font-medium text-yellow-600">{daisyChainWarnings.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instructions Sent</p>
                <p className="text-lg font-medium">{instructions.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Instruction Breakdown</p>
                <p className="text-lg font-medium">{daisyChainInstructionSummary || "None"}</p>
              </div>
            </div>
          </div>

          {/* Cells with No Data */}
          {(csu1NoDataCells.length > 0 || csu2NoDataCells.length > 0) && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                📉 Cells with No Data
                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {csu1NoDataCells.length + csu2NoDataCells.length}
                </span>
              </h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800">
                <p>
                  <strong>CSU1:</strong>{" "}
                  {csu1NoDataCells.length > 0
                    ? csu1NoDataCells.map((cell) => cell.id).join(", ")
                    : "None"}
                </p>
                <p>
                  <strong>CSU2:</strong>{" "}
                  {csu2NoDataCells.length > 0
                    ? csu2NoDataCells.map((cell) => cell.id).join(", ")
                    : "None"}
                </p>
              </div>
            </div>
          )}

          {/* CSU1 Normal Cells */}
          {csu1NormalCells.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center gap-2">
                🟢 CSU1 Normal Cells
                <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {csu1NormalCells.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu1NormalCells.map((cell, index) => (
                  <li
                    key={`csu1-normal-${index}`}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSU2 Normal Cells */}
          {csu2NormalCells.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-green-600 mb-4 flex items-center gap-2">
                🟢 CSU2 Normal Cells
                <span className="text-sm bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                  {csu2NormalCells.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu2NormalCells.map((cell, index) => (
                  <li
                    key={`csu2-normal-${index}`}
                    className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSU1 Critical Errors */}
          {csu1Errors.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                🔴 CSU1 Critical Errors
                <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {csu1Errors.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu1Errors.map((cell, index) => (
                  <li
                    key={`csu1-error-${index}`}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSU2 Critical Errors */}
          {csu2Errors.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-red-600 mb-4 flex items-center gap-2">
                🔴 CSU2 Critical Errors
                <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                  {csu2Errors.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu2Errors.map((cell, index) => (
                  <li
                    key={`csu2-error-${index}`}
                    className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSU1 Warnings */}
          {csu1Warnings.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-yellow-600 mb-4 flex items-center gap-2">
                🟡 CSU1 Warnings
                <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  {csu1Warnings.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu1Warnings.map((cell, index) => (
                  <li
                    key={`csu1-warning-${index}`}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* CSU2 Warnings */}
          {csu2Warnings.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-yellow-600 mb-4 flex items-center gap-2">
                🟡 CSU2 Warnings
                <span className="text-sm bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                  {csu2Warnings.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {csu2Warnings.map((cell, index) => (
                  <li
                    key={`csu2-warning-${index}`}
                    className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800"
                  >
                    <strong>Cell {cell.id}</strong><br />
                    Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? "-"}</span>,
                    Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? "-"}</span>
                    {cell.balancing && (
                      <>
                        <br />
                        Balancing: On
                      </>
                    )}
                    {cell.openWire && (
                      <>
                        <br />
                        Open Wire: Detected
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Daisy Chain Issues */}
          {daisyChainIssues.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                🌐 Daisy Chain Issues
                <span className="text-sm bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                  {daisyChainIssues.length}
                </span>
              </h2>
              <ul className="space-y-3">
                {daisyChainIssues.map((item, index) => (
                  <li
                    key={`daisy-chain-${index}`}
                    className={`border rounded-lg p-4 text-sm ${
                      item.status === "warning"
                        ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                        : item.status === "critical"
                        ? "bg-red-50 border-red-200 text-red-800"
                        : "bg-green-50 border-green-200 text-green-800"
                    }`}
                  >
                    <strong>{item.type} Cell {item.cellId}</strong>
                    <br />
                    {item.details}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Voltage Comparison */}
          {voltageComparisons.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4 flex items-center gap-2">
                ⚡ Voltage Comparison
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {voltageComparisons.length}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Cell ID
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Set Voltage (V)
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Actual Voltage (V)
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Variance (V)
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {voltageComparisons.map((comp, index) => (
                      <tr
                        key={`comp-${index}`}
                        className="border-t border-gray-200"
                      >
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {comp.cellId} (CSU {comp.cellId < 12 ? 1 : 2})
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {comp.setVoltage?.toFixed(2) ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {comp.actualVoltage?.toFixed(2) ?? "-"}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-800">
                          {comp.variance?.toFixed(2) ?? "-"}
                        </td>
                        <td
                          className={`px-4 py-2 text-sm ${
                            comp.status === "Match"
                              ? "text-green-600"
                              : comp.status === "Mismatch"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {comp.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Instructions Sent */}
          {instructions.length > 0 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                Instructions Sent
              </h2>
              <ul className="space-y-3">
                {instructions.map((instruction, index) => (
                  <li
                    key={`instruction-${index}`}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800"
                  >
                    <strong>Instruction {instruction.id}</strong>: {formatInstruction(instruction)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No Data */}
          {csu1Cells.every((cell) => cell.status === "no-data") &&
            csu2Cells.every((cell) => cell.status === "no-data") &&
            daisyChainIssues.length === 0 &&
            instructions.length === 0 && (
              <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                No data available for report.
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Report;





