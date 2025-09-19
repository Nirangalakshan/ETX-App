// /* eslint-disable */
// /* @ts-nocheck */

// import React, { useMemo, useRef, useEffect, useState } from "react";
// import CustomTitleBar from "../components/MenuBar";
// import { useBatteryContext } from "../BatteryContext";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import Chart from "chart.js/auto";
// import * as XLSX from "xlsx";

// type CellStatus = "normal" | "warning" | "critical" | "N/A";

// interface SetInstruction {
//   id: number;
//   command: string;
//   param1: string;
//   param2: string;
//   value: string;
//   cellNo: string;
//   cycleNo: string;
//   voltage: string;
//   temperature: string;
//   time: string;
// }

// interface CellData {
//   id: number;
//   cycle: string;
//   individualVoltage: number | null;
//   expectedVoltage: number | null;
//   csu11Voltage: number | null;
//   csu12Voltage: number | null;
//   dcCsuVoltage: number | null;
//   status: CellStatus;
// }

// const Report: React.FC = () => {
//   const {
//     instructions,
//     dcCsuInstructions,
//     csu1Instructions,
//     csu2Instructions,
//     csu1Statuses,
//     csu2Statuses,
//     daisyStatuses,
//     statuses,
//   } = useBatteryContext();

//   const [uploadedData, setUploadedData] = useState<any>(null);
//   const [selectedCycle, setSelectedCycle] = useState<string>("");
//   const [selectedVoltageSource, setSelectedVoltageSource] = useState<string>("csu11");
//   const [selectedCell, setSelectedCell] = useState<string>("");
//   const [csuCardNumber, setCsuCardNumber] = useState<string>("");
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const voltageChartRef = useRef<HTMLCanvasElement | null>(null);
//   const cellVoltageChartRef = useRef<HTMLCanvasElement | null>(null);
//   const issueChartRef = useRef<HTMLCanvasElement | null>(null);
//   const voltageChartInstance = useRef<Chart | null>(null);
//   const cellVoltageChartInstance = useRef<Chart | null>(null);
//   const issueChartInstance = useRef<Chart | null>(null);

//   // Extract cycle numbers
//   const cycleNumbers = useMemo(() => {
//     if (!uploadedData) return [];
//     return Object.keys(uploadedData).sort();
//   }, [uploadedData]);

//   // Extract cell IDs
//   const cellIds = useMemo(() => {
//     if (!uploadedData) return [];
//     const ids = new Set<number>();
//     Object.values(uploadedData).forEach((cycleData: any) => {
//       const csu11Cells = cycleData.csu11 || [];
//       const csu12Cells = cycleData.csu12 || [];
//       [...csu11Cells, ...csu12Cells].forEach((cell: any) => {
//         const id = parseInt(cell.cell.replace("cell_", ""));
//         ids.add(id);
//       });
//     });
//     return Array.from(ids).sort((a, b) => a - b);
//   }, [uploadedData]);

//   // Handle file upload
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file && file.type === "application/json") {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const jsonData = JSON.parse(e.target?.result as string);
//           setUploadedData(jsonData);
//           if (Object.keys(jsonData).length > 0) {
//             setSelectedCycle(Object.keys(jsonData)[0]);
//             const firstCycleData = jsonData[Object.keys(jsonData)[0]];
//             const cells = firstCycleData.csu11 || firstCycleData.csu12 || [];
//             if (cells.length > 0) {
//               setSelectedCell(cells[0].cell.replace("cell_", ""));
//             }
//           }
//           console.log("Report: Uploaded JSON data:", jsonData);
//         } catch (error) {
//           console.error("Report: Error parsing JSON file:", error);
//           alert("Error parsing JSON file. Please ensure it's a valid JSON.");
//         }
//       };
//       reader.readAsText(file);
//     } else {
//       alert("Please upload a valid JSON file.");
//     }
//   };

//   // Handle cycle selection
//   const handleCycleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCycle(event.target.value);
//   };

//   // Handle voltage source selection
//   const handleVoltageSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedVoltageSource(event.target.value);
//   };

//   // Handle cell selection
//   const handleCellChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCell(event.target.value);
//   };

//   // Handle CSU card number input
//   const handleCsuCardNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     setCsuCardNumber(event.target.value);
//   };

//   // Calculate cell status based on voltage difference
//   const calculateStatus = (actualVoltage: number | null, expectedVoltage: number | null): CellStatus => {
//     if (actualVoltage === null || expectedVoltage === null) return "N/A";
//     const difference = Math.abs(actualVoltage - expectedVoltage);
//     if (difference > 0.3) return "critical";
//     if (difference > 0.1) return "warning";
//     return "normal";
//   };

//   // Process cells for a given cycle
//   const getCellsForCycle = (cycle: string) => {
//     if (!uploadedData) return [];

//     const cellData: CellData[] = [];
//     const cycleData = uploadedData[cycle] || {};
//     const csu11Cells = cycleData.csu11 || [];
//     const csu12Cells = cycleData.csu12 || [];

//     // Create a map for easier lookup
//     const csu11Map = new Map(csu11Cells.map((cell: any) => [cell.cell, cell]));
//     const csu12Map = new Map(csu12Cells.map((cell: any) => [cell.cell, cell]));

//     // Process all possible cell IDs (up to 24)
//     const maxCells = 24;
//     for (let id = 0; id < maxCells; id++) {
//       const cellKey = `cell_${id}`;
//       const csu11Data = csu11Map.get(cellKey);
//       const csu12Data = csu12Map.get(cellKey);

//       const csu11Voltage = csu11Data ? csu11Data.csu11Voltage : null;
//       const csu12Voltage = csu12Data ? csu12Data.csu12Voltage : null;
//       // Use testerVoltage1 for csu11, testerVoltage2 for csu12
//       const expectedVoltage = selectedVoltageSource === "csu11" && csu11Data
//         ? csu11Data.testerVoltage1
//         : selectedVoltageSource === "csu12" && csu12Data
//         ? csu12Data.testerVoltage2
//         : null;

//       // Determine actual voltage based on selected source
//       const actualVoltage =
//         selectedVoltageSource === "csu11" ? csu11Voltage :
//         selectedVoltageSource === "csu12" ? csu12Voltage :
//         null;

//       cellData.push({
//         id,
//         cycle,
//         individualVoltage: null, // Not available in ado1.json
//         expectedVoltage,
//         csu11Voltage,
//         csu12Voltage,
//         dcCsuVoltage: null, // Not available in ado1.json
//         status: calculateStatus(actualVoltage, expectedVoltage),
//       });
//     }

//     return cellData.sort((a, b) => a.id - b.id);
//   };

//   // Process cells for the selected cycle (for UI)
//   const cells = useMemo(() => {
//     return getCellsForCycle(selectedCycle);
//   }, [uploadedData, selectedCycle, selectedVoltageSource]);

//   // Identify issues
//   const issues = useMemo(() => {
//     const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

//     cells.forEach((cell) => {
//       if (cell.status !== "N/A") {
//         const details = [
//           `CSU11 Voltage: ${cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) + " V" : "N/A"}`,
//           `CSU12 Voltage: ${cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) + " V" : "N/A"}`,
//           `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) + " V" : "N/A"}`,
//         ].filter(d => !d.includes("N/A")).join(", ");
//         issuesList.push({
//           type: selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1),
//           cellId: cell.id,
//           cycle: cell.cycle,
//           status: cell.status,
//           details,
//         });
//       }
//     });

//     return issuesList;
//   }, [cells, selectedVoltageSource]);

//   // Combine statuses for display
//   const errorWarningStatuses = useMemo(() => {
//     return [
//       ...csu1Statuses.map((s) => ({ ...s, type: "CSU1" })),
//       ...csu2Statuses.map((s) => ({ ...s, type: "CSU2" })),
//       ...daisyStatuses.map((s) => ({ ...s, type: "Daisy Chain" })),
//       ...statuses.map((s) => ({ ...s, type: "Individual" })),
//     ];
//   }, [csu1Statuses, csu2Statuses, daisyStatuses, statuses]);

//   // Format instruction for display
//   const formatInstruction = (instruction: SetInstruction) => {
//     const parts: string[] = [`Command: ${instruction.command}`];
//     if (instruction.cellNo) parts.push(`Cell: ${instruction.cellNo}`);
//     if (instruction.voltage) parts.push(`Voltage: ${instruction.voltage} V`);
//     if (instruction.temperature) parts.push(`Temperature: ${instruction.temperature} °C`);
//     if (instruction.param1) parts.push(`Param1: ${instruction.param1}`);
//     if (instruction.param2) parts.push(`Param2: ${instruction.param2}`);
//     if (instruction.cycleNo) parts.push(`Cycle: ${instruction.cycleNo}`);
//     if (instruction.time) parts.push(`Time: ${instruction.time}`);
//     if (instruction.value) parts.push(`Value: ${instruction.value}`);
//     return parts.join(", ");
//   };

//   // Voltage data for Voltage Trends chart
//   const voltageData = useMemo(() => {
//     console.log(`Report: Generating voltageData for source: ${selectedVoltageSource}`);
//     return cells.map(cell => ({
//       label: `Cell ${cell.id}`,
//       actualVoltage:
//         selectedVoltageSource === "csu11" ? cell.csu11Voltage :
//         selectedVoltageSource === "csu12" ? cell.csu12Voltage :
//         null,
//       setVoltage: cell.expectedVoltage,
//       status: cell.status,
//     }));
//   }, [cells, selectedVoltageSource]);

//   // Voltage data for Cell Voltage Trends chart
//   const cellVoltageData = useMemo(() => {
//     if (!uploadedData || !selectedCell) return [];
//     console.log(`Report: Generating cellVoltageData for cell: ${selectedCell}, source: ${selectedVoltageSource}`);
//     return cycleNumbers.map(cycle => {
//       const cycleData = uploadedData[cycle] || {};
//       const csu11Cells = cycleData.csu11 || [];
//       const csu12Cells = cycleData.csu12 || [];
//       const csu11Data = csu11Cells.find((c: any) => c.cell === `cell_${selectedCell}`);
//       const csu12Data = csu12Cells.find((c: any) => c.cell === `cell_${selectedCell}`);
//       const actualVoltage =
//         selectedVoltageSource === "csu11" ? (csu11Data ? csu11Data.csu11Voltage : null) :
//         selectedVoltageSource === "csu12" ? (csu12Data ? csu12Data.csu12Voltage : null) :
//         null;
//       const expectedVoltage =
//         selectedVoltageSource === "csu11" ? (csu11Data ? csu11Data.testerVoltage1 : null) :
//         selectedVoltageSource === "csu12" ? (csu12Data ? csu12Data.testerVoltage2 : null) :
//         null;
//       return {
//         cycle,
//         actualVoltage: actualVoltage !== null ? parseFloat(actualVoltage) : null,
//         expectedVoltage: expectedVoltage !== null ? parseFloat(expectedVoltage) : null,
//       };
//     });
//   }, [uploadedData, selectedCell, selectedVoltageSource, cycleNumbers]);

//   // Initialize and update charts
//   useEffect(() => {
//     console.log("Report: Updating charts with voltageData:", voltageData, "cellVoltageData:", cellVoltageData);

//     const initializeCharts = () => {
//       // Voltage Trends chart
//       if (voltageChartRef.current) {
//         const ctx = voltageChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: `${selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1)} Voltage (V)`,
//               data: voltageData.map((d) => d.actualVoltage !== null ? parseFloat(d.actualVoltage.toFixed(2)) : null),
//               borderColor: "rgba(75, 192, 192, 1)",
//               backgroundColor: "rgba(75, 192, 192, 0.2)",
//               fill: true,
//               skipNull: false,
//               spanGaps: true,
//               pointRadius: 5,
//               pointHoverRadius: 7,
//               lineTension: 0.1,
//             },
//             {
//               label: "Expected Voltage (V)",
//               data: voltageData.map((d) => d.setVoltage !== null ? parseFloat(d.setVoltage.toFixed(2)) : null),
//               borderColor: "rgba(255, 99, 132, 1)",
//               backgroundColor: "rgba(255, 99, 132, 0.2)",
//               fill: true,
//               skipNull: false,
//               spanGaps: true,
//               pointRadius: 5,
//               pointHoverRadius: 7,
//             },
//           ];

//           if (voltageChartInstance.current) {
//             console.log("Report: Updating existing voltage chart");
//             voltageChartInstance.current.data.labels = voltageData.map((d) => d.label);
//             voltageChartInstance.current.data.datasets = datasets;
//             voltageChartInstance.current.update();
//           } else {
//             console.log("Report: Creating new voltage chart");
//             voltageChartInstance.current = new Chart(ctx, {
//               type: "bar",
//               data: {
//                 labels: voltageData.map((d) => d.label),
//                 datasets,
//               },
//               options: {
//                 responsive: true,
//                 scales: {
//                   y: {
//                     beginAtZero: true,
//                     title: { display: true, text: "Voltage (V)" },
//                     suggestedMin: 0,
//                     suggestedMax: 10,
//                   },
//                   x: {
//                     title: { display: true, text: `Cell ID (Cycle: ${selectedCycle || 'N/A'}, Source: ${selectedVoltageSource})` },
//                   },
//                 },
//                 plugins: {
//                   tooltip: {
//                     enabled: true,
//                     mode: "nearest",
//                     callbacks: {
//                       label: (context) => `${context.dataset.label}: ${context.raw || 'N/A'} V`,
//                     },
//                   },
//                   legend: {
//                     display: true,
//                   },
//                 },
//               },
//             });
//           }
//         } else {
//           console.error("Report: Failed to get 2d context for voltage chart");
//         }
//       } else {
//         console.warn("Report: voltageChartRef.current is null, skipping voltage chart initialization");
//       }

//       // Cell Voltage Trends chart
//       if (cellVoltageChartRef.current) {
//         const ctx = cellVoltageChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: `${selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1)} Voltage (V)`,
//               data: cellVoltageData.map((d) => d.actualVoltage),
//               borderColor: "rgba(75, 192, 192, 1)",
//               backgroundColor: "rgba(75, 192, 192, 0.2)",
//               fill: true,
//               skipNull: true,
//               spanGaps: true,
//               pointRadius: 5,
//               pointHoverRadius: 7,
//               lineTension: 0.3,
//             },
//             {
//               label: "Expected Voltage (V)",
//               data: cellVoltageData.map((d) => d.expectedVoltage),
//               borderColor: "rgba(255, 99, 132, 1)",
//               backgroundColor: "rgba(255, 99, 132, 0.2)",
//               fill: true,
//               skipNull: true,
//               spanGaps: true,
//               pointRadius: 5,
//               pointHoverRadius: 7,
//               lineTension: 0.3,
//             },
//           ];

//           if (cellVoltageChartInstance.current) {
//             console.log("Report: Updating existing cell voltage chart");
//             cellVoltageChartInstance.current.data.labels = cycleNumbers;
//             cellVoltageChartInstance.current.data.datasets = datasets;
//             cellVoltageChartInstance.current.update();
//           } else {
//             console.log("Report: Creating new cell voltage chart");
//             cellVoltageChartInstance.current = new Chart(ctx, {
//               type: "line",
//               data: {
//                 labels: cycleNumbers,
//                 datasets,
//               },
//               options: {
//                 responsive: true,
//                 scales: {
//                   y: {
//                     beginAtZero: true,
//                     title: { display: true, text: "Voltage (V)" },
//                     suggestedMin: 0.3,
//                     suggestedMax: 6,
//                   },
//                   x: {
//                     title: { display: true, text: `Cycle Number (Cell: ${selectedCell || 'N/A'}, Source: ${selectedVoltageSource})` },
//                     ticks: {
//                       maxTicksLimit: 50,
//                       autoSkip: false,
//                       maxRotation: 45,
//                       minRotation: 45,
//                     },
//                   },
//                 },
//                 plugins: {
//                   tooltip: {
//                     enabled: true,
//                     mode: "nearest",
//                     callbacks: {
//                       label: (context) => `${context.dataset.label}: ${context.raw || 'N/A'} V`,
//                     },
//                   },
//                   legend: {
//                     display: true,
//                   },
//                 },
//               },
//             });
//           }
//         } else {
//           console.error("Report: Failed to get 2d context for cell voltage chart");
//         }
//       } else {
//         console.warn("Report: cellVoltageChartRef.current is null, skipping cell voltage chart initialization");
//       }

//       // Issue chart
//       if (issueChartRef.current) {
//         const ctx = issueChartRef.current.getContext("2d");
//         if (ctx) {
//           const issueCounts = issues.reduce(
//             (acc, issue) => {
//               if (issue.status === "critical") acc.critical += 1;
//               else if (issue.status === "warning") acc.warning += 1;
//               else if (issue.status === "normal") acc.normal += 1;
//               return acc;
//             },
//             { critical: 0, warning: 0, normal: 0 }
//           );
//           console.log("Report: Issue chart counts:", issueCounts);

//           const datasets = [
//             {
//               label: "Issue Count",
//               data: [issueCounts.critical, issueCounts.warning, issueCounts.normal],
//               backgroundColor: [
//                 "rgba(255, 99, 132, 0.5)",
//                 "rgba(255, 206, 86, 0.5)",
//                 "rgba(75, 192, 192, 0.5)",
//               ],
//             },
//           ];

//           if (issueChartInstance.current) {
//             console.log("Report: Updating existing issue chart");
//             issueChartInstance.current.data.datasets = datasets;
//             issueChartInstance.current.update();
//           } else {
//             console.log("Report: Creating new issue chart");
//             issueChartInstance.current = new Chart(ctx, {
//               type: "bar",
//               data: {
//                 labels: ["Critical", "Warning", "Normal"],
//                 datasets,
//               },
//               options: {
//                 responsive: true,
//                 scales: {
//                   y: {
//                     beginAtZero: true,
//                     title: { display: true, text: "Count" },
//                   },
//                 },
//               },
//             });
//           }
//         } else {
//           console.error("Report: Failed to get 2d context for issue chart");
//         }
//       } else {
//         console.warn("Report: issueChartRef.current is null, skipping issue chart initialization");
//       }
//     };

//     let rafId: number;
//     const scheduleCharts = () => {
//       console.log("Report: Scheduling chart initialization");
//       rafId = requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           if (voltageChartRef.current && cellVoltageChartRef.current && issueChartRef.current) {
//             initializeCharts();
//           } else {
//             console.warn("Report: Some canvas refs are still null, delaying initialization");
//           }
//         });
//       });
//     };

//     if (uploadedData && selectedCycle && selectedCell) {
//       scheduleCharts();
//     }

//     return () => {
//       cancelAnimationFrame(rafId);
//       if (voltageChartInstance.current) {
//         voltageChartInstance.current.destroy();
//         voltageChartInstance.current = null;
//       }
//       if (cellVoltageChartInstance.current) {
//         cellVoltageChartInstance.current.destroy();
//         cellVoltageChartInstance.current = null;
//       }
//       if (issueChartInstance.current) {
//         issueChartInstance.current.destroy();
//         issueChartInstance.current = null;
//       }
//     };
//   }, [voltageData, cellVoltageData, issues, selectedCycle, selectedVoltageSource, selectedCell, cycleNumbers]);

//   // Generate PDF report with Cell Data for all cycles, split by type
// // Generate PDF report with Cell Data for all cycles, including both CSU11 and CSU12 if data exists
//   const generatePDF = () => {
//     if (!uploadedData) {
//       alert("Please upload a JSON file.");
//       return;
//     }

//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Battery Management System Report - All Cycles`, 20, 20);
//     doc.setFontSize(12);
//     doc.text(`CSU Card Number: ${csuCardNumber || 'N/A'}`, 20, 30);
//     let finalY = 30;

//     cycleNumbers.forEach((cycle) => {
//       const cycleData = uploadedData[cycle] || {};
//       const csu11Cells = cycleData.csu11 || [];
//       const csu12Cells = cycleData.csu12 || [];
//       const csu11Map = new Map(csu11Cells.map((cell: any) => [cell.cell, cell]));
//       const csu12Map = new Map(csu12Cells.map((cell: any) => [cell.cell, cell]));

//       // Add cycle header
//       doc.setFontSize(14);
//       doc.text(`Cycle ${cycle}`, 20, finalY + 10);
//       finalY += 15;

//       // CSU11 Cells Table
//       const csu11ValidCells = csu11Cells.filter((cell: any) => 
//         cell.csu11Voltage !== null && cell.testerVoltage1 !== null
//       );
//       if (csu11ValidCells.length > 0) {
//         doc.setFontSize(12);
//         doc.text("CSU11 Cells", 20, finalY + 10);
//         autoTable(doc, {
//           startY: finalY + 15,
//           head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
//           body: csu11ValidCells.map((cell: any) => {
//             const actualVoltage = cell.csu11Voltage;
//             const expectedVoltage = cell.testerVoltage1;
//             const variance = actualVoltage !== null && expectedVoltage !== null 
//               ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
//               : "N/A";
//             const status = calculateStatus(actualVoltage, expectedVoltage);
//             return [
//               parseInt(cell.cell.replace("cell_", "")),
//               actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
//               expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
//               variance,
//               status.charAt(0).toUpperCase() + status.slice(1),
//             ];
//           }),
//           styles: { fontSize: 8 },
//           headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//           alternateRowStyles: { fillColor: [240, 240, 240] },
//         });
//         finalY = (doc as any).lastAutoTable.finalY + 10;
//       }

//       // CSU12 Cells Table
//       const csu12ValidCells = csu12Cells.filter((cell: any) => 
//         cell.csu12Voltage !== null && cell.testerVoltage2 !== null
//       );
//       if (csu12ValidCells.length > 0) {
//         doc.setFontSize(12);
//         doc.text("CSU12 Cells", 20, finalY + 10);
//         autoTable(doc, {
//           startY: finalY + 15,
//           head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
//           body: csu12ValidCells.map((cell: any) => {
//             const actualVoltage = cell.csu12Voltage;
//             const expectedVoltage = cell.testerVoltage2;
//             const variance = actualVoltage !== null && expectedVoltage !== null 
//               ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
//               : "N/A";
//             const status = calculateStatus(actualVoltage, expectedVoltage);
//             return [
//               parseInt(cell.cell.replace("cell_", "")),
//               actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
//               expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
//               variance,
//               status.charAt(0).toUpperCase() + status.slice(1),
//             ];
//           }),
//           styles: { fontSize: 8 },
//           headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//           alternateRowStyles: { fillColor: [240, 240, 240] },
//         });
//         finalY = (doc as any).lastAutoTable.finalY + 10;
//       }
//     });

//     doc.save(`BMS_Report_All_Cycles_${csuCardNumber || 'N/A'}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
//   };

//   // Generate Excel report with Cell Data for all cycles, including both CSU11 and CSU12 if data exists
//   const generateExcel = () => {
//     if (!uploadedData) {
//       alert("Please upload a JSON file.");
//       return;
//     }

//     const wb = XLSX.utils.book_new();

//     cycleNumbers.forEach((cycle) => {
//       const cycleData = uploadedData[cycle] || {};
//       const csu11Cells = cycleData.csu11 || [];
//       const csu12Cells = cycleData.csu12 || [];

//       // CSU11 Cells Sheet
//       const csu11ValidCells = csu11Cells.filter((cell: any) => 
//         cell.csu11Voltage !== null && cell.testerVoltage1 !== null
//       );
//       if (csu11ValidCells.length > 0) {
//         const wsData = [
//           [`CSU Card Number: ${csuCardNumber || 'N/A'}`],
//           [],
//           ["CSU11 Cells - Cycle " + cycle],
//           ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
//           ...csu11ValidCells.map((cell: any) => {
//             const actualVoltage = cell.csu11Voltage;
//             const expectedVoltage = cell.testerVoltage1;
//             const variance = actualVoltage !== null && expectedVoltage !== null 
//               ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
//               : "N/A";
//             const status = calculateStatus(actualVoltage, expectedVoltage);
//             return [
//               parseInt(cell.cell.replace("cell_", "")),
//               actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
//               expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
//               variance,
//               status.charAt(0).toUpperCase() + status.slice(1),
//             ];
//           }),
//         ];
//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_CSU11`);
//       }

//       // CSU12 Cells Sheet
//       const csu12ValidCells = csu12Cells.filter((cell: any) => 
//         cell.csu12Voltage !== null && cell.testerVoltage2 !== null
//       );
//       if (csu12ValidCells.length > 0) {
//         const wsData = [
//           [`CSU Card Number: ${csuCardNumber || 'N/A'}`],
//           [],
//           ["CSU12 Cells - Cycle " + cycle],
//           ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
//           ...csu12ValidCells.map((cell: any) => {
//             const actualVoltage = cell.csu12Voltage;
//             const expectedVoltage = cell.testerVoltage2;
//             const variance = actualVoltage !== null && expectedVoltage !== null 
//               ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
//               : "N/A";
//             const status = calculateStatus(actualVoltage, expectedVoltage);
//             return [
//               parseInt(cell.cell.replace("cell_", "")),
//               actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
//               expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
//               variance,
//               status.charAt(0).toUpperCase() + status.slice(1),
//             ];
//           }),
//         ];
//         const ws = XLSX.utils.aoa_to_sheet(wsData);
//         XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_CSU12`);
//       }
//     });

//     XLSX.writeFile(wb, `BMS_Report_All_Cycles_${csuCardNumber || 'N/A'}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`);
//   };


//   // Check chart visibility
//   const hasVoltageData = useMemo(() => {
//     return voltageData.some((d) => d.actualVoltage !== null || d.setVoltage !== null);
//   }, [voltageData]);

//   const hasCellVoltageData = useMemo(() => {
//     return cellVoltageData.some((d) => d.actualVoltage !== null || d.expectedVoltage !== null);
//   }, [cellVoltageData]);

//   const hasIssueData = issues.length > 0;

//   return (
//     <div className="flex-1 bg-gray-100 h-screen overflow-auto">
//       <CustomTitleBar />
//       <div className="w-11/12 p-2 mx-auto space-y-6 mt-10 mb-10 shadow-lg">
//         <div className="flex justify-between items-center p-2">
//           <h1 className="text-2xl font-bold text-gray-900 font-inter">
//             TEST SUMMARY
//           </h1>
//           <div className="flex gap-2 items-center">
           
//             <input
//               placeholder="Upload JSON"
//               type="file"
//               accept=".json"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//             />
//             {cycleNumbers.length > 0 && (
//               <select
//                 title="Select Cycle"
//                 value={selectedCycle}
//                 onChange={handleCycleChange}
//                 className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               >
//                 {cycleNumbers.map((cycle) => (
//                   <option key={cycle} value={cycle}>
//                     Cycle {cycle}
//                   </option>
//                 ))}
//               </select>
//             )}
//             <button
//               onClick={generatePDF}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               disabled={!uploadedData}
//             >
//               📄 Generate PDF
//             </button>
//             <button
//               onClick={generateExcel}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               disabled={!uploadedData}
//             >
//               📄 Generate Excel
//             </button>
//           </div>
//            <input
//               placeholder="Enter CSU Card Number"
//               type="text"
//               value={csuCardNumber}
//               onChange={handleCsuCardNumberChange}
//               className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//             />
//         </div>

//         {!uploadedData && (
//           <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//             Please upload a JSON file to view the report.
//           </div>
//         )}

//         {uploadedData && !selectedCycle && (
//           <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//             Please select a cycle to view the report.
//           </div>
//         )}

//         {uploadedData && selectedCycle && (
//           <div className="space-y-6">
//             {/* Voltage Trends Chart */}
//             <div>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold font-inter text-gray-700"> Voltage Trends</h2>
//                 <select
//                   title="Select Voltage Source"
//                   value={selectedVoltageSource}
//                   onChange={handleVoltageSourceChange}
//                   className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                 >
//                   <option value="csu11">CSU11</option>
//                   <option value="csu12">CSU12</option>
//                 </select>
//               </div>
//               <div style={{ display: hasVoltageData ? "block" : "none" }}>
//                 <canvas ref={voltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasVoltageData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No voltage data available for {selectedVoltageSource} source.
//                 </div>
//               )}
//             </div>

//             {/* Cell Voltage Trends Chart */}
//             <div>
//               <div className="flex justify-between items-center mb-4 ">
//                 <h2 className="text-xl font-semibold font-inter text-gray-700">Cell Voltage Trends</h2>
//                 <div className="flex gap-2">
//                   <select
//                     title="Select Cell"
//                     value={selectedCell}
//                     onChange={handleCellChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     {cellIds.map((cellId) => (
//                       <option key={cellId} value={cellId}>
//                         Cell {cellId}
//                       </option>
//                     ))}
//                   </select>
//                   <select
//                     title="Select Voltage Source"
//                     value={selectedVoltageSource}
//                     onChange={handleVoltageSourceChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     <option value="csu11">CSU11</option>
//                     <option value="csu12">CSU12</option>
//                   </select>
//                 </div>
//               </div>
//               <div className="" style={{ display: hasCellVoltageData ? "block" : "none" }}>
//                 <canvas ref={cellVoltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasCellVoltageData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No voltage data available for Cell {selectedCell} ({selectedVoltageSource} source).
//                 </div>
//               )}
//             </div>

//             {/* Issue Distribution Chart */}
//             <div>
//               <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4"> Issue Distribution</h2>
//               <div style={{ display: hasIssueData ? "block" : "none" }}>
//                 <canvas ref={issueChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasIssueData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No issue data available for chart.
//                 </div>
//               )}
//             </div>
// {/* Cell Data */}
//   {cells.some((cell) => cell.status !== "N/A") && (
//     <div>
//       <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//         Cell Data Status ({selectedVoltageSource.toUpperCase()})
//         <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//           {cells.filter((cell) => cell.status !== "N/A").length}
//         </span>
//       </h2>
//       <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
//         <table className="w-full text-sm text-gray-800">
//           <thead className="bg-gray-100">
//             <tr>
//               <th className="px-4 py-2 text-left font-semibold">Cell ID</th>
//               <th className="px-4 py-2 text-left font-semibold">Voltage (V)</th>
//               <th className="px-4 py-2 text-left font-semibold">Expected Voltage (V)</th>
//               <th className="px-4 py-2 text-left font-semibold">Variance (V)</th>
//               <th className="px-4 py-2 text-left font-semibold">Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {cells.map((cell) => {
//               const actualVoltage = selectedVoltageSource === "csu11" ? cell.csu11Voltage : cell.csu12Voltage;
//               const expectedVoltage = cell.expectedVoltage;
//               const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
//               const status = calculateStatus(actualVoltage, expectedVoltage);

//               if (status === "N/A") return null;

//               return (
//                 <tr
//                   key={`cell-${cell.id}`}
//                   className={`border-t ${
//                     status === "critical"
//                       ? "bg-red-50 text-red-800"
//                       : status === "warning"
//                       ? "bg-yellow-50 text-yellow-800"
//                       : "bg-green-50 text-green-800"
//                   }`}
//                 >
//                   <td className="px-4 py-2">Cell {cell.id}</td>
//                   <td className="px-4 py-2">{actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A"}</td>
//                   <td className="px-4 py-2">{expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A"}</td>
//                   <td className="px-4 py-2">{variance}</td>
//                   <td className="px-4 py-2">{status.charAt(0).toUpperCase() + status.slice(1)}</td>
//                 </tr>
//               );
//             })}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   )}

//             {/* Instructions Sent */}
//             {[
//               { title: "General Instructions", data: instructions },
//               { title: "CSU1 Instructions", data: csu1Instructions },
//               { title: "CSU2 Instructions", data: csu2Instructions },
//               { title: "DC CSU Instructions", data: dcCsuInstructions },
//             ].map(({ title, data }, index) => (
//               data.length > 0 && (
//                 <div key={`instructions-${index}`}>
//                   <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4">
//                     {title}
//                   </h2>
//                   <ul className="space-y-3 overflow-y-auto max-h-100">
//                     {data.map((instruction, i) => (
//                       <li
//                         key={`instruction-${i}`}
//                         className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800"
//                       >
//                         <strong>Instruction {instruction.id}</strong>:{" "}
//                         {formatInstruction(instruction)}
//                       </li>
//                     ))}
//                   </ul>
//                 </div>
//               )
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Report;












/* eslint-disable */
/* @ts-nocheck */

import React, { useMemo, useRef, useEffect, useState } from "react";
import CustomTitleBar from "../components/MenuBar";
import { useBatteryContext } from "../BatteryContext";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Chart from "chart.js/auto";
import * as XLSX from "xlsx";

type CellStatus = "normal" | "warning" | "critical" | "N/A";

interface SetInstruction {
  id: number;
  command: string;
  param1: string;
  param2: string;
  value: string;
  cellNo: string;
  cycleNo: string;
  voltage: string;
  temperature: string;
  time: string;
}

interface CellData {
  id: number;
  cycle: string;
  individualVoltage: number | null;
  expectedVoltage: number | null;
  csu11Voltage: number | null;
  csu12Voltage: number | null;
  dcCsuVoltage: number | null;
  status: CellStatus;
}

const Report: React.FC = () => {
  const {
    instructions,
    dcCsuInstructions,
    csu1Instructions,
    csu2Instructions,
    csu1Statuses,
    csu2Statuses,
    daisyStatuses,
    statuses,
  } = useBatteryContext();

  const [uploadedData, setUploadedData] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedVoltageSource, setSelectedVoltageSource] = useState<string>("csu11");
  const [selectedCell, setSelectedCell] = useState<string>("");
  const [csuCardNumber, setCsuCardNumber] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voltageChartRef = useRef<HTMLCanvasElement | null>(null);
  const cellVoltageChartRef = useRef<HTMLCanvasElement | null>(null);
  const issueChartRef = useRef<HTMLCanvasElement | null>(null);
  const voltageChartInstance = useRef<Chart | null>(null);
  const cellVoltageChartInstance = useRef<Chart | null>(null);
  const issueChartInstance = useRef<Chart | null>(null);

  // Extract cycle numbers
  const cycleNumbers = useMemo(() => {
    if (!uploadedData) return [];
    return Object.keys(uploadedData).sort();
  }, [uploadedData]);

  // Extract cell IDs
  const cellIds = useMemo(() => {
    if (!uploadedData) return [];
    const ids = new Set<number>();
    Object.values(uploadedData).forEach((cycleData: any) => {
      const csu11Cells = cycleData.csu11 || [];
      const csu12Cells = cycleData.csu12 || [];
      const dcCsuCells = cycleData.dcCsu || [];
      [...csu11Cells, ...csu12Cells, ...dcCsuCells].forEach((cell: any) => {
        const id = parseInt(cell.cell.replace("cell_", ""));
        ids.add(id);
      });
    });
    return Array.from(ids).sort((a, b) => a - b);
  }, [uploadedData]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          setUploadedData(jsonData);
          if (Object.keys(jsonData).length > 0) {
            setSelectedCycle(Object.keys(jsonData)[0]);
            const firstCycleData = jsonData[Object.keys(jsonData)[0]];
            const cells = firstCycleData.csu11 || firstCycleData.csu12 || [];
            if (cells.length > 0) {
              setSelectedCell(cells[0].cell.replace("cell_", ""));
            }
          }
          console.log("Report: Uploaded JSON data:", jsonData);
        } catch (error) {
          console.error("Report: Error parsing JSON file:", error);
          alert("Error parsing JSON file. Please ensure it's a valid JSON.");
        }
      };
      reader.readAsText(file);
    } else {
      alert("Please upload a valid JSON file.");
    }
  };

  // Handle cycle selection
  const handleCycleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCycle(event.target.value);
  };

  // Handle voltage source selection
  const handleVoltageSourceChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedVoltageSource(event.target.value);
  };

  // Handle cell selection
  const handleCellChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCell(event.target.value);
  };

  // Handle CSU card number input
  const handleCsuCardNumberChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCsuCardNumber(event.target.value);
  };

  // Calculate cell status based on voltage difference
  const calculateStatus = (actualVoltage: number | null, expectedVoltage: number | null): CellStatus => {
    if (actualVoltage === null || expectedVoltage === null) return "N/A";
    const difference = Math.abs(actualVoltage - expectedVoltage);
    if (difference > 0.3) return "critical";
    if (difference > 0.1) return "warning";
    return "normal";
  };

  // Process cells for a given cycle
  const getCellsForCycle = (cycle: string) => {
    if (!uploadedData) return [];

    const cellData: CellData[] = [];
    const cycleData = uploadedData[cycle] || {};
    const csu11Cells = cycleData.csu11 || [];
    const csu12Cells = cycleData.csu12 || [];
    const dcCsuCells = cycleData.dcCsu || [];

    // Create a map for easier lookup
    const csu11Map = new Map(csu11Cells.map((cell: any) => [cell.cell, cell]));
    const csu12Map = new Map(csu12Cells.map((cell: any) => [cell.cell, cell]));
    const dcCsuMap = new Map(dcCsuCells.map((cell: any) => [cell.cell, cell]));

    // Process all possible cell IDs (up to 24)
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      const cellKey = `cell_${id}`;
      const csu11Data = csu11Map.get(cellKey);
      const csu12Data = csu12Map.get(cellKey);
      const dcCsuData = dcCsuMap.get(cellKey);

      const csu11Voltage = csu11Data ? csu11Data.csu11Voltage : null;
      const csu12Voltage = csu12Data ? csu12Data.csu12Voltage : null;
      const dcCsuVoltage = dcCsuData ? dcCsuData.dcCsuVoltage : null;

      // Use testerVoltage1 for csu11, testerVoltage2 for csu12
      const expectedVoltage = 
      selectedVoltageSource === "csu11" && csu11Data ? csu11Data.testerVoltage1 :
      selectedVoltageSource === "csu12" && csu12Data ? csu12Data.testerVoltage2 :
      selectedVoltageSource === "dcCsu" && dcCsuData ? dcCsuData.testerVoltage :
      null;

      // Determine actual voltage based on selected source
    const actualVoltage =
      selectedVoltageSource === "csu11" ? csu11Voltage :
      selectedVoltageSource === "csu12" ? csu12Voltage :
      selectedVoltageSource === "dcCsu" ? dcCsuVoltage :
      null;

      cellData.push({
        id,
        cycle,
        individualVoltage: null, // Not available in ado1.json
        expectedVoltage,
        csu11Voltage,
        csu12Voltage,
        dcCsuVoltage, // Not available in ado1.json
        status: calculateStatus(actualVoltage, expectedVoltage),
      });
    }

    return cellData.sort((a, b) => a.id - b.id);
  };

  // Process cells for the selected cycle (for UI)
  const cells = useMemo(() => {
    return getCellsForCycle(selectedCycle);
  }, [uploadedData, selectedCycle, selectedVoltageSource]);

  // Identify issues
  const issues = useMemo(() => {
    const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

    cells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `CSU11 Voltage: ${cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) + " V" : "N/A"}`,
          `CSU12 Voltage: ${cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) + " V" : "N/A"}`,
          `DC CSU Voltage: ${cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) + " V" : "N/A"}`,
          `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) + " V" : "N/A"}`,
        ].filter(d => !d.includes("N/A")).join(", ");
        issuesList.push({
          type: selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1),
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    return issuesList;
  }, [cells, selectedVoltageSource]);

  // Combine statuses for display
  const errorWarningStatuses = useMemo(() => {
    return [
      ...csu1Statuses.map((s) => ({ ...s, type: "CSU1" })),
      ...csu2Statuses.map((s) => ({ ...s, type: "CSU2" })),
      ...daisyStatuses.map((s) => ({ ...s, type: "Daisy Chain" })),
      ...statuses.map((s) => ({ ...s, type: "Individual" })),
    ];
  }, [csu1Statuses, csu2Statuses, daisyStatuses, statuses]);

  // Format instruction for display
  const formatInstruction = (instruction: SetInstruction) => {
    const parts: string[] = [`Command: ${instruction.command}`];
    if (instruction.cellNo) parts.push(`Cell: ${instruction.cellNo}`);
    if (instruction.voltage) parts.push(`Voltage: ${instruction.voltage} V`);
    if (instruction.temperature) parts.push(`Temperature: ${instruction.temperature} °C`);
    if (instruction.param1) parts.push(`Param1: ${instruction.param1}`);
    if (instruction.param2) parts.push(`Param2: ${instruction.param2}`);
    if (instruction.cycleNo) parts.push(`Cycle: ${instruction.cycleNo}`);
    if (instruction.time) parts.push(`Time: ${instruction.time}`);
    if (instruction.value) parts.push(`Value: ${instruction.value}`);
    return parts.join(", ");
  };

  // Voltage data for Voltage Trends chart
  const voltageData = useMemo(() => {
    console.log(`Report: Generating voltageData for source: ${selectedVoltageSource}`);
    return cells.map(cell => ({
      label: `Cell ${cell.id}`,
      actualVoltage:
        selectedVoltageSource === "csu11" ? cell.csu11Voltage :
        selectedVoltageSource === "csu12" ? cell.csu12Voltage :
        selectedVoltageSource === "dcCsu" ? cell.dcCsuVoltage :
        null,
      setVoltage: cell.expectedVoltage,
      status: cell.status,
    }));
  }, [cells, selectedVoltageSource]);

  // Voltage data for Cell Voltage Trends chart
  const cellVoltageData = useMemo(() => {
    if (!uploadedData || !selectedCell) return [];
    console.log(`Report: Generating cellVoltageData for cell: ${selectedCell}, source: ${selectedVoltageSource}`);
    return cycleNumbers.map(cycle => {
      const cycleData = uploadedData[cycle] || {};
      const csu11Cells = cycleData.csu11 || [];
      const csu12Cells = cycleData.csu12 || [];
      const dcCsuCells = cycleData.dcCsu || [];
      
      const csu11Data = csu11Cells.find((c: any) => c.cell === `cell_${selectedCell}`);
      const csu12Data = csu12Cells.find((c: any) => c.cell === `cell_${selectedCell}`);
      const dcCsuData = dcCsuCells.find((c: any) => c.cell === `cell_${selectedCell}`);

      const actualVoltage =
        selectedVoltageSource === "csu11" ? (csu11Data ? csu11Data.csu11Voltage : null) :
        selectedVoltageSource === "csu12" ? (csu12Data ? csu12Data.csu12Voltage : null) :
        selectedVoltageSource === "dcCsu" ? (dcCsuData ? dcCsuData.dcCsuVoltage : null) :
        null;
      const expectedVoltage =
        selectedVoltageSource === "csu11" ? (csu11Data ? csu11Data.testerVoltage1 : null) :
        selectedVoltageSource === "csu12" ? (csu12Data ? csu12Data.testerVoltage2 : null) :
        selectedVoltageSource === "dcCsu" ? (dcCsuData ? dcCsuData.testerVoltage : null) :
        null;
      return {
        cycle,
        actualVoltage: actualVoltage !== null ? parseFloat(actualVoltage) : null,
        expectedVoltage: expectedVoltage !== null ? parseFloat(expectedVoltage) : null,
      };
    });
  }, [uploadedData, selectedCell, selectedVoltageSource, cycleNumbers]);

  // Initialize and update charts
  useEffect(() => {
    console.log("Report: Updating charts with voltageData:", voltageData, "cellVoltageData:", cellVoltageData);

    const initializeCharts = () => {
      // Voltage Trends chart
      if (voltageChartRef.current) {
        const ctx = voltageChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: `${selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1)} Voltage (V)`,
              data: voltageData.map((d) => d.actualVoltage !== null ? parseFloat(d.actualVoltage.toFixed(2)) : null),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              skipNull: false,
              spanGaps: true,
              pointRadius: 5,
              pointHoverRadius: 7,
              lineTension: 0.1,
            },
            {
              label: "Expected Voltage (V)",
              data: voltageData.map((d) => d.setVoltage !== null ? parseFloat(d.setVoltage.toFixed(2)) : null),
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
              skipNull: false,
              spanGaps: true,
              pointRadius: 5,
              pointHoverRadius: 7,
            },
          ];

          if (voltageChartInstance.current) {
            console.log("Report: Updating existing voltage chart");
            voltageChartInstance.current.data.labels = voltageData.map((d) => d.label);
            voltageChartInstance.current.data.datasets = datasets;
            voltageChartInstance.current.update();
          } else {
            console.log("Report: Creating new voltage chart");
            voltageChartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: voltageData.map((d) => d.label),
                datasets,
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Voltage (V)" },
                    suggestedMin: 0,
                    suggestedMax: 10,
                  },
                  x: {
                    title: { display: true, text: `Cell ID (Cycle: ${selectedCycle || 'N/A'}, Source: ${selectedVoltageSource})` },
                  },
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "nearest",
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.raw || 'N/A'} V`,
                    },
                  },
                  legend: {
                    display: true,
                  },
                },
              },
            });
          }
        } else {
          console.error("Report: Failed to get 2d context for voltage chart");
        }
      } else {
        console.warn("Report: voltageChartRef.current is null, skipping voltage chart initialization");
      }

      // Cell Voltage Trends chart
      if (cellVoltageChartRef.current) {
        const ctx = cellVoltageChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: `${selectedVoltageSource.charAt(0).toUpperCase() + selectedVoltageSource.slice(1)} Voltage (V)`,
              data: cellVoltageData.map((d) => d.actualVoltage),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: true,
              skipNull: true,
              spanGaps: true,
              pointRadius: 5,
              pointHoverRadius: 7,
              lineTension: 0.3,
            },
            {
              label: "Expected Voltage (V)",
              data: cellVoltageData.map((d) => d.expectedVoltage),
              borderColor: "rgba(255, 99, 132, 1)",
              backgroundColor: "rgba(255, 99, 132, 0.2)",
              fill: true,
              skipNull: true,
              spanGaps: true,
              pointRadius: 5,
              pointHoverRadius: 7,
              lineTension: 0.3,
            },
          ];

          if (cellVoltageChartInstance.current) {
            console.log("Report: Updating existing cell voltage chart");
            cellVoltageChartInstance.current.data.labels = cycleNumbers;
            cellVoltageChartInstance.current.data.datasets = datasets;
            cellVoltageChartInstance.current.update();
          } else {
            console.log("Report: Creating new cell voltage chart");
            cellVoltageChartInstance.current = new Chart(ctx, {
              type: "line",
              data: {
                labels: cycleNumbers,
                datasets,
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Voltage (V)" },
                    suggestedMin: 0.3,
                    suggestedMax: 6,
                  },
                  x: {
                    title: { display: true, text: `Cycle Number (Cell: ${selectedCell || 'N/A'}, Source: ${selectedVoltageSource})` },
                    ticks: {
                      maxTicksLimit: 50,
                      autoSkip: false,
                      maxRotation: 45,
                      minRotation: 45,
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "nearest",
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.raw || 'N/A'} V`,
                    },
                  },
                  legend: {
                    display: true,
                  },
                },
              },
            });
          }
        } else {
          console.error("Report: Failed to get 2d context for cell voltage chart");
        }
      } else {
        console.warn("Report: cellVoltageChartRef.current is null, skipping cell voltage chart initialization");
      }

      // Issue chart
      if (issueChartRef.current) {
        const ctx = issueChartRef.current.getContext("2d");
        if (ctx) {
          const issueCounts = issues.reduce(
            (acc, issue) => {
              if (issue.status === "critical") acc.critical += 1;
              else if (issue.status === "warning") acc.warning += 1;
              else if (issue.status === "normal") acc.normal += 1;
              return acc;
            },
            { critical: 0, warning: 0, normal: 0 }
          );
          console.log("Report: Issue chart counts:", issueCounts);

          const datasets = [
            {
              label: "Issue Count",
              data: [issueCounts.critical, issueCounts.warning, issueCounts.normal],
              backgroundColor: [
                "rgba(255, 99, 132, 0.5)",
                "rgba(255, 206, 86, 0.5)",
                "rgba(75, 192, 192, 0.5)",
              ],
            },
          ];

          if (issueChartInstance.current) {
            console.log("Report: Updating existing issue chart");
            issueChartInstance.current.data.datasets = datasets;
            issueChartInstance.current.update();
          } else {
            console.log("Report: Creating new issue chart");
            issueChartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels: ["Critical", "Warning", "Normal"],
                datasets,
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Count" },
                  },
                },
              },
            });
          }
        } else {
          console.error("Report: Failed to get 2d context for issue chart");
        }
      } else {
        console.warn("Report: issueChartRef.current is null, skipping issue chart initialization");
      }
    };

    let rafId: number;
    const scheduleCharts = () => {
      console.log("Report: Scheduling chart initialization");
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (voltageChartRef.current && cellVoltageChartRef.current && issueChartRef.current) {
            initializeCharts();
          } else {
            console.warn("Report: Some canvas refs are still null, delaying initialization");
          }
        });
      });
    };

    if (uploadedData && selectedCycle && selectedCell) {
      scheduleCharts();
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (voltageChartInstance.current) {
        voltageChartInstance.current.destroy();
        voltageChartInstance.current = null;
      }
      if (cellVoltageChartInstance.current) {
        cellVoltageChartInstance.current.destroy();
        cellVoltageChartInstance.current = null;
      }
      if (issueChartInstance.current) {
        issueChartInstance.current.destroy();
        issueChartInstance.current = null;
      }
    };
  }, [voltageData, cellVoltageData, issues, selectedCycle, selectedVoltageSource, selectedCell, cycleNumbers]);

  // Generate PDF report with Cell Data for all cycles, split by type
// Generate PDF report with Cell Data for all cycles, including both CSU11 and CSU12 if data exists
  const generatePDF = () => {
    if (!uploadedData) {
      alert("Please upload a JSON file.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Battery Management System Report - All Cycles`, 20, 20);
    doc.setFontSize(12);
    doc.text(`CSU Card Number: ${csuCardNumber || 'N/A'}`, 20, 30);
    let finalY = 30;

    cycleNumbers.forEach((cycle) => {
      const cycleData = uploadedData[cycle] || {};
      const csu11Cells = cycleData.csu11 || [];
      const csu12Cells = cycleData.csu12 || [];
      const dcCsuCells = cycleData.dcCsu || [];

      // Create maps for easier lookup
      const csu11Map = new Map(csu11Cells.map((cell: any) => [cell.cell, cell]));
      const csu12Map = new Map(csu12Cells.map((cell: any) => [cell.cell, cell]));
      const dcCsuMap = new Map(dcCsuCells.map((cell: any) => [cell.cell, cell]));

      // Add cycle header
      doc.setFontSize(14);
      doc.text(`Cycle ${cycle}`, 20, finalY + 10);
      finalY += 15;

      // CSU11 Cells Table
      const csu11ValidCells = csu11Cells.filter((cell: any) => 
        cell.csu11Voltage !== null && cell.testerVoltage1 !== null
      );
      if (csu11ValidCells.length > 0) {
        doc.setFontSize(12);
        doc.text("CSU11 Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: csu11ValidCells.map((cell: any) => {
            const actualVoltage = cell.csu11Voltage;
            const expectedVoltage = cell.testerVoltage1;
            const variance = actualVoltage !== null && expectedVoltage !== null 
              ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
              : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              parseInt(cell.cell.replace("cell_", "")),
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status.charAt(0).toUpperCase() + status.slice(1),
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // CSU12 Cells Table
      const csu12ValidCells = csu12Cells.filter((cell: any) => 
        cell.csu12Voltage !== null && cell.testerVoltage2 !== null
      );
      if (csu12ValidCells.length > 0) {
        doc.setFontSize(12);
        doc.text("CSU12 Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: csu12ValidCells.map((cell: any) => {
            const actualVoltage = cell.csu12Voltage;
            const expectedVoltage = cell.testerVoltage2;
            const variance = actualVoltage !== null && expectedVoltage !== null 
              ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
              : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              parseInt(cell.cell.replace("cell_", "")),
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status.charAt(0).toUpperCase() + status.slice(1),
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

          const dcCsuValidCells = dcCsuCells.filter((cell: any) => 
      cell.dcCsuVoltage !== null && cell.testerVoltage !== null
    );
    if (dcCsuValidCells.length > 0) {
      doc.setFontSize(12);
      doc.text("DC CSU Cells", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
        body: dcCsuValidCells.map((cell: any) => {
          const actualVoltage = cell.dcCsuVoltage;
          const expectedVoltage = cell.testerVoltage;
          const variance = actualVoltage !== null && expectedVoltage !== null 
            ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
            : "N/A";
          const status = calculateStatus(actualVoltage, expectedVoltage);
          return [
            parseInt(cell.cell.replace("cell_", "")),
            actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
            expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
            variance,
            status.charAt(0).toUpperCase() + status.slice(1),
          ];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY + 10;
    }
    });


    

    doc.save(`BMS_Report_All_Cycles_${csuCardNumber || 'N/A'}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
  };

  // Generate Excel report with Cell Data for all cycles, including both CSU11 and CSU12 if data exists
  const generateExcel = () => {
    if (!uploadedData) {
      alert("Please upload a JSON file.");
      return;
    }

    const wb = XLSX.utils.book_new();

    cycleNumbers.forEach((cycle) => {
      const cycleData = uploadedData[cycle] || {};
      const csu11Cells = cycleData.csu11 || [];
      const csu12Cells = cycleData.csu12 || [];

      // CSU11 Cells Sheet
      const csu11ValidCells = csu11Cells.filter((cell: any) => 
        cell.csu11Voltage !== null && cell.testerVoltage1 !== null
      );
      if (csu11ValidCells.length > 0) {
        const wsData = [
          [`CSU Card Number: ${csuCardNumber || 'N/A'}`],
          [],
          ["CSU11 Cells - Cycle " + cycle],
          ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
          ...csu11ValidCells.map((cell: any) => {
            const actualVoltage = cell.csu11Voltage;
            const expectedVoltage = cell.testerVoltage1;
            const variance = actualVoltage !== null && expectedVoltage !== null 
              ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
              : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              parseInt(cell.cell.replace("cell_", "")),
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status.charAt(0).toUpperCase() + status.slice(1),
            ];
          }),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_CSU11`);
      }

      // CSU12 Cells Sheet
      const csu12ValidCells = csu12Cells.filter((cell: any) => 
        cell.csu12Voltage !== null && cell.testerVoltage2 !== null
      );
      if (csu12ValidCells.length > 0) {
        const wsData = [
          [`CSU Card Number: ${csuCardNumber || 'N/A'}`],
          [],
          ["CSU12 Cells - Cycle " + cycle],
          ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
          ...csu12ValidCells.map((cell: any) => {
            const actualVoltage = cell.csu12Voltage;
            const expectedVoltage = cell.testerVoltage2;
            const variance = actualVoltage !== null && expectedVoltage !== null 
              ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) 
              : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              parseInt(cell.cell.replace("cell_", "")),
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status.charAt(0).toUpperCase() + status.slice(1),
            ];
          }),
        ];
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_CSU12`);
      }
    });

    XLSX.writeFile(wb, `BMS_Report_All_Cycles_${csuCardNumber || 'N/A'}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`);
  };


  // Check chart visibility
  const hasVoltageData = useMemo(() => {
    return voltageData.some((d) => d.actualVoltage !== null || d.setVoltage !== null);
  }, [voltageData]);

  const hasCellVoltageData = useMemo(() => {
    return cellVoltageData.some((d) => d.actualVoltage !== null || d.expectedVoltage !== null);
  }, [cellVoltageData]);

  const hasIssueData = issues.length > 0;

  return (
    <div className="flex-1 bg-gray-100 h-screen overflow-auto">
      <CustomTitleBar />
      <div className="w-11/12 p-2 mx-auto space-y-6 mt-10 mb-10 shadow-lg">
        <div className="flex justify-between items-center p-2">
          <h1 className="text-2xl font-bold text-gray-900 font-inter">
            TEST SUMMARY
          </h1>
          <div className="flex gap-2 items-center">
           
            <input
              placeholder="Upload JSON"
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
            />
            {cycleNumbers.length > 0 && (
              <select
                title="Select Cycle"
                value={selectedCycle}
                onChange={handleCycleChange}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
              >
                {cycleNumbers.map((cycle) => (
                  <option key={cycle} value={cycle}>
                    Cycle {cycle}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={generatePDF}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
              disabled={!uploadedData}
            >
              📄 Generate PDF
            </button>
            <button
              onClick={generateExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
              disabled={!uploadedData}
            >
              📄 Generate Excel
            </button>
          </div>
           <input
              placeholder="Enter CSU Card Number"
              type="text"
              value={csuCardNumber}
              onChange={handleCsuCardNumberChange}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
            />
        </div>

        {!uploadedData && (
          <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            Please upload a JSON file to view the report.
          </div>
        )}

        {uploadedData && !selectedCycle && (
          <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
            Please select a cycle to view the report.
          </div>
        )}

        {uploadedData && selectedCycle && (
          <div className="space-y-6">
            {/* Voltage Trends Chart */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold font-inter text-gray-700"> Voltage Trends</h2>
                <select
                  title="Select Voltage Source"
                  value={selectedVoltageSource}
                  onChange={handleVoltageSourceChange}
                  className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
                >
                  <option value="csu11">CSU11</option>
                  <option value="csu12">CSU12</option>
                  <option value="dcCsu">DC CSU</option>
                </select>
              </div>
              <div style={{ display: hasVoltageData ? "block" : "none" }}>
                <canvas ref={voltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasVoltageData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No voltage data available for {selectedVoltageSource} source.
                </div>
              )}
            </div>

            {/* Cell Voltage Trends Chart */}
            <div>
              <div className="flex justify-between items-center mb-4 ">
                <h2 className="text-xl font-semibold font-inter text-gray-700">Cell Voltage Trends</h2>
                <div className="flex gap-2">
                  <select
                    title="Select Cell"
                    value={selectedCell}
                    onChange={handleCellChange}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
                  >
                    {cellIds.map((cellId) => (
                      <option key={cellId} value={cellId}>
                        Cell {cellId}
                      </option>
                    ))}
                  </select>
                  <select
                    title="Select Voltage Source"
                    value={selectedVoltageSource}
                    onChange={handleVoltageSourceChange}
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
                  >
                    <option value="csu11">CSU11</option>
                    <option value="csu12">CSU12</option>
                    <option value="dcCsu">DC CSU</option>
                  </select>
                </div>
              </div>
              <div className="" style={{ display: hasCellVoltageData ? "block" : "none" }}>
                <canvas ref={cellVoltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasCellVoltageData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No voltage data available for Cell {selectedCell} ({selectedVoltageSource} source).
                </div>
              )}
            </div>

            {/* Issue Distribution Chart */}
            <div>
              <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4"> Issue Distribution</h2>
              <div style={{ display: hasIssueData ? "block" : "none" }}>
                <canvas ref={issueChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasIssueData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No issue data available for chart.
                </div>
              )}
            </div>
{/* Cell Data */}
  {cells.some((cell) => cell.status !== "N/A") && (
    <div>
      <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
        Cell Data Status ({selectedVoltageSource.toUpperCase()})
        <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
          {cells.filter((cell) => cell.status !== "N/A").length}
        </span>
      </h2>
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-sm text-gray-800">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold">Cell ID</th>
              <th className="px-4 py-2 text-left font-semibold">Voltage (V)</th>
              <th className="px-4 py-2 text-left font-semibold">Expected Voltage (V)</th>
              <th className="px-4 py-2 text-left font-semibold">Variance (V)</th>
              <th className="px-4 py-2 text-left font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {cells.map((cell) => {
              const actualVoltage = selectedVoltageSource === "csu11" ? cell.csu11Voltage : cell.csu12Voltage;
              const expectedVoltage = cell.expectedVoltage;
              const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
              const status = calculateStatus(actualVoltage, expectedVoltage);

              if (status === "N/A") return null;

              return (
                <tr
                  key={`cell-${cell.id}`}
                  className={`border-t ${
                    status === "critical"
                      ? "bg-red-50 text-red-800"
                      : status === "warning"
                      ? "bg-yellow-50 text-yellow-800"
                      : "bg-green-50 text-green-800"
                  }`}
                >
                  <td className="px-4 py-2">Cell {cell.id}</td>
                  <td className="px-4 py-2">{actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A"}</td>
                  <td className="px-4 py-2">{expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A"}</td>
                  <td className="px-4 py-2">{variance}</td>
                  <td className="px-4 py-2">{status.charAt(0).toUpperCase() + status.slice(1)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  )}

            {/* Instructions Sent */}
            {[
              { title: "General Instructions", data: instructions },
              { title: "CSU1 Instructions", data: csu1Instructions },
              { title: "CSU2 Instructions", data: csu2Instructions },
              { title: "DC CSU Instructions", data: dcCsuInstructions },
            ].map(({ title, data }, index) => (
              data.length > 0 && (
                <div key={`instructions-${index}`}>
                  <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4">
                    {title}
                  </h2>
                  <ul className="space-y-3 overflow-y-auto max-h-100">
                    {data.map((instruction, i) => (
                      <li
                        key={`instruction-${i}`}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-800"
                      >
                        <strong>Instruction {instruction.id}</strong>:{" "}
                        {formatInstruction(instruction)}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Report;