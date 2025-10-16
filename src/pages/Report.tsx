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
//   type: string;
//   actualVoltage: number | null;
//   expectedVoltage: number | null;
//   setVoltage: number | null;
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

//   const [uploadedData, setUploadedData] = useState<any[]>([]);
//   const [selectedCycle, setSelectedCycle] = useState<string>("");
//   const [selectedType, setSelectedType] = useState<string>("");
//   const [selectedCell, setSelectedCell] = useState<string>("");
//   const [selectedSetVoltage, setSelectedSetVoltage] = useState<string>("");
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
//     return Array.from(new Set(uploadedData.map((item) => item.cycleNo.toString()))).sort();
//   }, [uploadedData]);

//   // Extract cell IDs
//   const cellIds = useMemo(() => {
//     return Array.from(new Set(uploadedData.map((item) => item.cellNo))).sort((a, b) => a - b);
//   }, [uploadedData]);

//   // Extract types
//   const types = useMemo(() => {
//     return Array.from(new Set(uploadedData.map((item) => item.type))).sort();
//   }, [uploadedData]);

//   // Extract set voltages with mapping
//   const voltageMap = {
//     1: "2.0",
//     2: "2.5",
//     3: "2.8",
//     4: "3.0",
//     5: "3.3",
//     6: "3.6",
//     7: "3.9",
//     8: "4.2",
//   };

//   const setVoltages = useMemo(() => {
//     return Array.from(new Set(uploadedData.map((item) => item.setVoltage.toString()))).sort();
//   }, [uploadedData]);

//   // Handle file upload
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file && file.type === "application/json") {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const jsonData = JSON.parse(e.target?.result as string);
//           if (Array.isArray(jsonData)) {
//             setUploadedData(jsonData);
//             if (jsonData.length > 0) {
//               setSelectedCycle(jsonData[0].cycleNo.toString());
//               setSelectedType(jsonData[0].type);
//               setSelectedCell(jsonData[0].cellNo.toString());
//               setSelectedSetVoltage(jsonData[0].setVoltage.toString());
//             }
//           } else {
//             alert("JSON file must contain an array of cell state objects.");
//           }
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

//   // Handle type selection
//   const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedType(event.target.value);
//   };

//   // Handle cell selection
//   const handleCellChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedCell(event.target.value);
//   };

//   // Handle set voltage selection
//   const handleSetVoltageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
//     setSelectedSetVoltage(event.target.value);
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

//   // Process cells for a given cycle and type
//   const getCellsForCycle = (cycle: string, type: string, setVoltage: string) => {
//     if (!uploadedData) return [];

//     const cellData: CellData[] = [];
//     const filteredData = uploadedData.filter(
//       (item) =>
//         item.cycleNo.toString() === cycle &&
//         item.type === type &&
//         (setVoltage === "" || item.setVoltage.toString() === setVoltage)
//     );

//     const individualData = uploadedData.filter(
//       (item) =>
//         item.cycleNo.toString() === cycle &&
//         item.type === "individual" &&
//         (setVoltage === "" || item.setVoltage.toString() === setVoltage)
//     );

//     const individualMap = new Map<number, any>();
//     individualData.forEach((item) => {
//       individualMap.set(item.cellNo, item);
//     });

//     const cellMap = new Map<number, any>();
//     filteredData.forEach((item) => {
//       cellMap.set(item.cellNo, item);
//     });

//     const maxCells = Math.max(...cellIds, 0);
//     for (let id = 0; id <= maxCells; id++) {
//       const cell = cellMap.get(id);
//       let effectiveExpectedVoltage = cell ? cell.setVoltage : null;

//       // Map actualVoltage from individual type to expectedVoltage for specific types
//       if (type === "dccsu") {
//         const individualCell = individualMap.get(id);
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
//       } else if (type === "csu12" && id >= 0 && id <= 11) {
//         const individualCell = individualMap.get(id);
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
//       } else if (type === "csu11" && id >= 0 && id <= 11) {
//         const individualCell = individualMap.get(id + 12);
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
//       }

//       if (cell) {
//         cellData.push({
//           id,
//           cycle,
//           type,
//           actualVoltage: cell.actualVoltage,
//           expectedVoltage: effectiveExpectedVoltage,
//           setVoltage: cell.setVoltage,
//           status: calculateStatus(cell.actualVoltage, effectiveExpectedVoltage),
//         });
//       } else {
//         cellData.push({
//           id,
//           cycle,
//           type,
//           actualVoltage: null,
//           expectedVoltage: null,
//           setVoltage: null,
//           status: "N/A",
//         });
//       }
//     }

//     return cellData.sort((a, b) => a.id - b.id);
//   };

//   // Process cells for the selected cycle, type, and set voltage
//   const cells = useMemo(() => {
//     return getCellsForCycle(selectedCycle, selectedType, selectedSetVoltage);
//   }, [uploadedData, selectedCycle, selectedType, selectedSetVoltage]);

//   // Identify issues
//   const issues = useMemo(() => {
//     const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

//     cells.forEach((cell) => {
//       if (cell.status !== "N/A") {
//         const details = [
//           `Actual Voltage: ${cell.actualVoltage !== null ? cell.actualVoltage.toFixed(3) + " V" : "N/A"}`,
//           `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(3) + " V" : "N/A"}`,
//           `Set Voltage: ${cell.setVoltage !== null ? cell.setVoltage.toFixed(3) + " V" : "N/A"}`,
//         ].filter((d) => !d.includes("N/A")).join(", ");
//         issuesList.push({
//           type: cell.type,
//           cellId: cell.id,
//           cycle: cell.cycle,
//           status: cell.status,
//           details,
//         });
//       }
//     });

//     return issuesList;
//   }, [cells]);

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
//     return cells.map((cell) => ({
//       label: `Cell ${cell.id}`,
//       actualVoltage: cell.actualVoltage,
//       expectedVoltage: cell.expectedVoltage,
//       status: cell.status,
//     }));
//   }, [cells]);

//   // Voltage data for Cell Voltage Trends chart
//   const cellVoltageData = useMemo(() => {
//     if (!uploadedData || !selectedCell) return [];
//     return cycleNumbers.map((cycle) => {
//       const cellData = uploadedData.find(
//         (item) =>
//           item.cycleNo.toString() === cycle &&
//           item.cellNo.toString() === selectedCell &&
//           item.type === selectedType &&
//           (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//       );
//       let effectiveExpectedVoltage = cellData ? cellData.setVoltage : null;

//       // Map actualVoltage from individual type to expectedVoltage for specific types
//       if (selectedType === "dccsu") {
//         const cellId = parseInt(selectedCell);
//         const individualCell = uploadedData.find(
//           (item) =>
//             item.cycleNo.toString() === cycle &&
//             item.cellNo === cellId &&
//             item.type === "individual" &&
//             (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//         );
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
//       } else if (selectedType === "csu12" && parseInt(selectedCell) >= 0 && parseInt(selectedCell) <= 11) {
//         const cellId = parseInt(selectedCell);
//         const individualCell = uploadedData.find(
//           (item) =>
//             item.cycleNo.toString() === cycle &&
//             item.cellNo === cellId &&
//             item.type === "individual" &&
//             (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//         );
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
//       } else if (selectedType === "csu11" && parseInt(selectedCell) >= 0 && parseInt(selectedCell) <= 11) {
//         const cellId = parseInt(selectedCell) + 12;
//         const individualCell = uploadedData.find(
//           (item) =>
//             item.cycleNo.toString() === cycle &&
//             item.cellNo === cellId &&
//             item.type === "individual" &&
//             (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//         );
//         effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
//       }

//       return {
//         cycle,
//         actualVoltage: cellData ? cellData.actualVoltage : null,
//         expectedVoltage: effectiveExpectedVoltage,
//       };
//     });
//   }, [uploadedData, selectedCell, selectedType, selectedSetVoltage, cycleNumbers]);

//   // Initialize and update charts
//   useEffect(() => {
//     const initializeCharts = () => {
//       // Voltage Trends chart
//       if (voltageChartRef.current) {
//         const ctx = voltageChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: `${selectedType} Voltage (V)`,
//               data: voltageData.map((d) => (d.actualVoltage !== null ? parseFloat(d.actualVoltage.toFixed(3)) : null)),
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
//               data: voltageData.map((d) => (d.expectedVoltage !== null ? parseFloat(d.expectedVoltage.toFixed(3)) : null)),
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
//             voltageChartInstance.current.data.labels = voltageData.map((d) => d.label);
//             voltageChartInstance.current.data.datasets = datasets;
//             voltageChartInstance.current.update();
//           } else {
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
//                     title: {
//                       display: true,
//                       text: `Cell ID (Cycle: ${selectedCycle || "N/A"}, Type: ${selectedType}, Set Voltage: ${selectedSetVoltage || "N/A"})`,
//                     },
//                   },
//                 },
//                 plugins: {
//                   tooltip: {
//                     enabled: true,
//                     mode: "nearest",
//                     callbacks: {
//                       label: (context) => `${context.dataset.label}: ${context.raw || "N/A"} V`,
//                     },
//                   },
//                   legend: {
//                     display: true,
//                   },
//                 },
//               },
//             });
//           }
//         }
//       }

//       // Cell Voltage Trends chart
//       if (cellVoltageChartRef.current) {
//         const ctx = cellVoltageChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: `${selectedType} Voltage (V)`,
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
//             cellVoltageChartInstance.current.data.labels = cycleNumbers;
//             cellVoltageChartInstance.current.data.datasets = datasets;
//             cellVoltageChartInstance.current.update();
//           } else {
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
//                     suggestedMin: 0,
//                     suggestedMax: 10,
//                   },
//                   x: {
//                     title: {
//                       display: true,
//                       text: `Cycle Number (Cell: ${selectedCell || "N/A"}, Type: ${selectedType}, Set Voltage: ${selectedSetVoltage || "N/A"})`,
//                     },
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
//                       label: (context) => `${context.dataset.label}: ${context.raw || "N/A"} V`,
//                     },
//                   },
//                   legend: {
//                     display: true,
//                   },
//                 },
//               },
//             });
//           }
//         }
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
//             issueChartInstance.current.data.datasets = datasets;
//             issueChartInstance.current.update();
//           } else {
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
//         }
//       }
//     };

//     let rafId: number;
//     const scheduleCharts = () => {
//       rafId = requestAnimationFrame(() => {
//         requestAnimationFrame(() => {
//           if (voltageChartRef.current && cellVoltageChartRef.current && issueChartRef.current) {
//             initializeCharts();
//           }
//         });
//       });
//     };

//     if (uploadedData.length > 0 && selectedCycle && selectedType && selectedCell) {
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
//   }, [voltageData, cellVoltageData, issues, selectedCycle, selectedType, selectedCell, selectedSetVoltage, cycleNumbers]);

//   // Generate PDF report with Cell Data for all cycles
//   const generatePDF = () => {
//     if (uploadedData.length === 0) {
//       alert("Please upload a JSON file.");
//       return;
//     }

//     const doc = new jsPDF();
//     doc.setFontSize(16);
//     doc.text(`Battery Management System Report - All Cycles`, 20, 20);
//     doc.setFontSize(12);
//     doc.text(`CSU Card Number: ${csuCardNumber || "N/A"}`, 20, 30);
//     let finalY = 30;

//     cycleNumbers.forEach((cycle) => {
//       types.forEach((type) => {
//         const filteredData = uploadedData.filter((item) => item.cycleNo.toString() === cycle && item.type === type);
//         const individualData = uploadedData.filter(
//           (item) =>
//             item.cycleNo.toString() === cycle &&
//             item.type === "individual" &&
//             (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//         );
//         const individualMap = new Map<number, any>();
//         individualData.forEach((item) => {
//           individualMap.set(item.cellNo, item);
//         });

//         const validCells = filteredData.filter(
//           (cell) => cell.actualVoltage !== null && (
//             (type === "dccsu" || (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) || (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11)) ?
//               (individualMap.get(type === "csu11" ? cell.cellNo + 12 : cell.cellNo)?.actualVoltage !== null || cell.setVoltage !== null) :
//               cell.setVoltage !== null
//           )
//         );

//         if (validCells.length > 0) {
//           doc.setFontSize(14);
//           doc.text(`Cycle ${cycle} - ${type.toUpperCase()}`, 20, finalY + 10);
//           finalY += 15;

//           autoTable(doc, {
//             startY: finalY + 15,
//             head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
//             body: validCells.map((cell) => {
//               let effectiveExpectedVoltage = cell.setVoltage;
//               if (type === "dccsu") {
//                 const individualCell = individualMap.get(cell.cellNo);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               } else if (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) {
//                 const individualCell = individualMap.get(cell.cellNo);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               } else if (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11) {
//                 const individualCell = individualMap.get(cell.cellNo + 12);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               }
//               const actualVoltage = cell.actualVoltage;
//               const variance =
//                 actualVoltage !== null && effectiveExpectedVoltage !== null
//                   ? Math.abs(actualVoltage - effectiveExpectedVoltage).toFixed(3)
//                   : "N/A";
//               const status = calculateStatus(actualVoltage, effectiveExpectedVoltage);
//               return [
//                 cell.cellNo,
//                 actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A",
//                 effectiveExpectedVoltage !== null ? effectiveExpectedVoltage.toFixed(3) : "N/A",
//                 variance,
//                 status.charAt(0).toUpperCase() + status.slice(1),
//               ];
//             }),
//             styles: { fontSize: 8 },
//             headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//             alternateRowStyles: { fillColor: [240, 240, 240] },
//           });
//           finalY = (doc as any).lastAutoTable.finalY + 10;
//         }
//       });
//     });

//     doc.save(`BMS_Report_All_Cycles_${csuCardNumber || "N/A"}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
//   };

//   // Generate Excel report with Cell Data for all cycles
//   const generateExcel = () => {
//     if (uploadedData.length === 0) {
//       alert("Please upload a JSON file.");
//       return;
//     }

//     const wb = XLSX.utils.book_new();

//     cycleNumbers.forEach((cycle) => {
//       types.forEach((type) => {
//         const filteredData = uploadedData.filter((item) => item.cycleNo.toString() === cycle && item.type === type);
//         const individualData = uploadedData.filter(
//           (item) =>
//             item.cycleNo.toString() === cycle &&
//             item.type === "individual" &&
//             (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
//         );
//         const individualMap = new Map<number, any>();
//         individualData.forEach((item) => {
//           individualMap.set(item.cellNo, item);
//         });

//         const validCells = filteredData.filter(
//           (cell) => cell.actualVoltage !== null && (
//             (type === "dccsu" || (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) || (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11)) ?
//               (individualMap.get(type === "csu11" ? cell.cellNo + 12 : cell.cellNo)?.actualVoltage !== null || cell.setVoltage !== null) :
//               cell.setVoltage !== null
//           )
//         );

//         if (validCells.length > 0) {
//           const wsData = [
//             [`CSU Card Number: ${csuCardNumber || "N/A"}`],
//             [],
//             [`${type.toUpperCase()} Cells - Cycle ${cycle}`],
//             ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
//             ...validCells.map((cell) => {
//               let effectiveExpectedVoltage = cell.setVoltage;
//               if (type === "dccsu") {
//                 const individualCell = individualMap.get(cell.cellNo);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               } else if (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) {
//                 const individualCell = individualMap.get(cell.cellNo);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               } else if (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11) {
//                 const individualCell = individualMap.get(cell.cellNo + 12);
//                 effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
//               }
//               const actualVoltage = cell.actualVoltage;
//               const variance =
//                 actualVoltage !== null && effectiveExpectedVoltage !== null
//                   ? Math.abs(actualVoltage - effectiveExpectedVoltage).toFixed(3)
//                   : "N/A";
//               const status = calculateStatus(actualVoltage, effectiveExpectedVoltage);
//               return [
//                 cell.cellNo,
//                 actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A",
//                 effectiveExpectedVoltage !== null ? effectiveExpectedVoltage.toFixed(3) : "N/A",
//                 variance,
//                 status.charAt(0).toUpperCase() + status.slice(1),
//               ];
//             }),
//           ];
//           const ws = XLSX.utils.aoa_to_sheet(wsData);
//           XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_${type}`);
//         }
//       });
//     });

//     XLSX.writeFile(wb, `BMS_Report_All_Cycles_${csuCardNumber || "N/A"}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`);
//   };

//   // Check chart visibility
//   const hasVoltageData = useMemo(() => {
//     return voltageData.some((d) => d.actualVoltage !== null || d.expectedVoltage !== null);
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
//                 <option value="">Select Cycle</option>
//                 {cycleNumbers.map((cycle) => (
//                   <option key={cycle} value={cycle}>
//                     Cycle {cycle}
//                   </option>
//                 ))}
//               </select>
//             )}
//             {types.length > 0 && (
//               <select
//                 title="Select Type"
//                 value={selectedType}
//                 onChange={handleTypeChange}
//                 className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               >
//                 <option value="">Select Type</option>
//                 {types.map((type) => (
//                   <option key={type} value={type}>
//                     {type.toUpperCase()}
//                   </option>
//                 ))}
//               </select>
//             )}
//             {setVoltages.length > 0 && (
//               <select
//                 title="Select Set Voltage"
//                 value={selectedSetVoltage}
//                 onChange={handleSetVoltageChange}
//                 className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               >
//                 <option value="">All Set Voltages</option>
//                 {setVoltages.map((voltage) => {
//                   const numericVoltage = parseInt(voltage);
//                   const mappedVoltage = voltageMap[numericVoltage] || voltage;
//                   return (
//                     <option key={voltage} value={voltage}>
//                       {mappedVoltage} V
//                     </option>
//                   );
//                 })}
//               </select>
//             )}
//             <button
//               onClick={generatePDF}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               disabled={uploadedData.length === 0}
//             >
//               📄 Generate PDF
//             </button>
//             <button
//               onClick={generateExcel}
//               className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               disabled={uploadedData.length === 0}
//             >
//               📄 Generate Excel
//             </button>
//           </div>
//           <input
//             placeholder="Enter CSU Card Number"
//             type="text"
//             value={csuCardNumber}
//             onChange={handleCsuCardNumberChange}
//             className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//           />
//         </div>

//         {!uploadedData.length && (
//           <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//             Please upload a JSON file to view the report.
//           </div>
//         )}

//         {uploadedData.length > 0 && !selectedCycle && (
//           <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//             Please select a cycle to view the report.
//           </div>
//         )}

//         {uploadedData.length > 0 && selectedCycle && (
//           <div className="space-y-6">
//             {/* Voltage Trends Chart */}
//             <div>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold font-inter text-gray-700">Voltage Trends</h2>
//                 <select
//                   title="Select Type"
//                   value={selectedType}
//                   onChange={handleTypeChange}
//                   className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                 >
//                   <option value="">Select Type</option>
//                   {types.map((type) => (
//                     <option key={type} value={type}>
//                       {type.toUpperCase()}
//                     </option>
//                   ))}
//                 </select>
//               </div>
//               <div style={{ display: hasVoltageData ? "block" : "none" }}>
//                 <canvas ref={voltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasVoltageData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No voltage data available for {selectedType} type.
//                 </div>
//               )}
//             </div>

//             {/* Cell Voltage Trends Chart */}
//             <div>
//               <div className="flex justify-between items-center mb-4">
//                 <h2 className="text-xl font-semibold font-inter text-gray-700">Cell Voltage Trends</h2>
//                 <div className="flex gap-2">
//                   <select
//                     title="Select Cell"
//                     value={selectedCell}
//                     onChange={handleCellChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     <option value="">Select Cell</option>
//                     {cellIds.map((cellId) => (
//                       <option key={cellId} value={cellId}>
//                         Cell {cellId}
//                       </option>
//                     ))}
//                   </select>
//                   <select
//                     title="Select Type"
//                     value={selectedType}
//                     onChange={handleTypeChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     <option value="">Select Type</option>
//                     {types.map((type) => (
//                       <option key={type} value={type}>
//                         {type.toUpperCase()}
//                       </option>
//                     ))}
//                   </select>
//                   <select
//                     title="Select Set Voltage"
//                     value={selectedSetVoltage}
//                     onChange={handleSetVoltageChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     <option value="">All Set Voltages</option>
//                     {setVoltages.map((voltage) => {
//                       const numericVoltage = parseInt(voltage);
//                       const mappedVoltage = voltageMap[numericVoltage] || voltage;
//                       return (
//                         <option key={voltage} value={voltage}>
//                           {mappedVoltage} V
//                         </option>
//                       );
//                     })}
//                   </select>
//                 </div>
//               </div>
//               <div style={{ display: hasCellVoltageData ? "block" : "none" }}>
//                 <canvas ref={cellVoltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasCellVoltageData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No voltage data available for Cell {selectedCell} ({selectedType} type, Set Voltage: {selectedSetVoltage || "N/A"}).
//                 </div>
//               )}
//             </div>

//             {/* Issue Distribution Chart */}
//             <div>
//               <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4">Issue Distribution</h2>
//               <div style={{ display: hasIssueData ? "block" : "none" }}>
//                 <canvas ref={issueChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasIssueData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No issue data available for chart.
//                 </div>
//               )}
//             </div>

//             {/* Cell Data */}
//             {cells.some((cell) => cell.status !== "N/A") && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   Cell Data Status ({selectedType.toUpperCase()})
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {cells.filter((cell) => cell.status !== "N/A").length}
//                   </span>
//                 </h2>
//                 <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-x-auto">
//                   <table className="w-full text-sm text-gray-800">
//                     <thead className="bg-gray-100">
//                       <tr>
//                         <th className="px-4 py-2 text-left font-semibold">Cell ID</th>
//                         <th className="px-4 py-2 text-left font-semibold">Voltage (V)</th>
//                         <th className="px-4 py-2 text-left font-semibold">Expected Voltage (V)</th>
//                         <th className="px-4 py-2 text-left font-semibold">Variance (V)</th>
//                         <th className="px-4 py-2 text-left font-semibold">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {cells.map((cell) => {
//                         const actualVoltage = cell.actualVoltage;
//                         const expectedVoltage = cell.expectedVoltage;
//                         const variance =
//                           actualVoltage !== null && expectedVoltage !== null
//                             ? Math.abs(actualVoltage - expectedVoltage).toFixed(3)
//                             : "N/A";
//                         const status = calculateStatus(actualVoltage, expectedVoltage);

//                         if (status === "N/A") return null;

//                         return (
//                           <tr
//                             key={`cell-${cell.id}`}
//                             className={`border-t ${
//                               status === "critical"
//                                 ? "bg-red-50 text-red-800"
//                                 : status === "warning"
//                                 ? "bg-yellow-50 text-yellow-800"
//                                 : "bg-green-50 text-green-800"
//                             }`}
//                           >
//                             <td className="px-4 py-2">Cell {cell.id}</td>
//                             <td className="px-4 py-2">{actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A"}</td>
//                             <td className="px-4 py-2">{expectedVoltage !== null ? expectedVoltage.toFixed(3) : "N/A"}</td>
//                             <td className="px-4 py-2">{variance}</td>
//                             <td className="px-4 py-2">{status.charAt(0).toUpperCase() + status.slice(1)}</td>
//                           </tr>
//                         );
//                       })}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

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
//                         <strong>Instruction {instruction.id}</strong>: {formatInstruction(instruction)}
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
  type: string;
  actualVoltage: number | null;
  expectedVoltage: number | null;
  setVoltage: number | null;
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

  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [selectedCell, setSelectedCell] = useState<string>("");
  const [selectedSetVoltage, setSelectedSetVoltage] = useState<string>("");
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
    return Array.from(new Set(uploadedData.map((item) => item.cycleNo.toString()))).sort();
  }, [uploadedData]);

  // Extract cell IDs
  const cellIds = useMemo(() => {
    return Array.from(new Set(uploadedData.map((item) => item.cellNo))).sort((a, b) => a - b);
  }, [uploadedData]);

  // Extract types
  const types = useMemo(() => {
    return Array.from(new Set(uploadedData.map((item) => item.type))).sort();
  }, [uploadedData]);

  // Extract set voltages with mapping
  const voltageMap = {
    1: "2.0",
    2: "2.5",
    3: "2.8",
    4: "3.0",
    5: "3.3",
    6: "3.6",
    7: "3.9",
    8: "4.2",
  };

  const setVoltages = useMemo(() => {
    return Array.from(new Set(uploadedData.map((item) => item.setVoltage.toString()))).sort();
  }, [uploadedData]);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/json") {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = JSON.parse(e.target?.result as string);
          if (Array.isArray(jsonData)) {
            setUploadedData(jsonData);
            if (jsonData.length > 0) {
              setSelectedCycle(jsonData[0].cycleNo.toString());
              setSelectedType(jsonData[0].type);
              setSelectedCell(jsonData[0].cellNo.toString());
              setSelectedSetVoltage(jsonData[0].setVoltage.toString());
            }
          } else {
            alert("JSON file must contain an array of cell state objects.");
          }
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

  // Handle type selection
  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(event.target.value);
  };

  // Handle cell selection
  const handleCellChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCell(event.target.value);
  };

  // Handle set voltage selection
  const handleSetVoltageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSetVoltage(event.target.value);
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

  // Process cells for a given cycle and type
  const getCellsForCycle = (cycle: string, type: string, setVoltage: string) => {
    if (!uploadedData) return [];

    const cellData: CellData[] = [];
    const filteredData = uploadedData.filter(
      (item) =>
        item.cycleNo.toString() === cycle &&
        item.type === type &&
        (setVoltage === "" || item.setVoltage.toString() === setVoltage)
    );

    const individualData = uploadedData.filter(
      (item) =>
        item.cycleNo.toString() === cycle &&
        item.type === "individual" &&
        (setVoltage === "" || item.setVoltage.toString() === setVoltage)
    );

    const individualMap = new Map<number, any>();
    individualData.forEach((item) => {
      individualMap.set(item.cellNo, item);
    });

    const cellMap = new Map<number, any>();
    filteredData.forEach((item) => {
      cellMap.set(item.cellNo, item);
    });

    const maxCells = Math.max(...cellIds, 0);
    for (let id = 0; id <= maxCells; id++) {
      const cell = cellMap.get(id);
      let effectiveExpectedVoltage = cell ? cell.setVoltage : null;

      // Map actualVoltage from individual type to expectedVoltage for specific types
      if (type === "dccsu") {
        const individualCell = individualMap.get(id);
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
      } else if (type === "csu12" && id >= 0 && id <= 11) {
        const individualCell = individualMap.get(id);
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
      } else if (type === "csu11" && id >= 0 && id <= 11) {
        const individualCell = individualMap.get(id + 12);
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cell ? cell.setVoltage : null);
      }

      if (cell) {
        cellData.push({
          id,
          cycle,
          type,
          actualVoltage: cell.actualVoltage,
          expectedVoltage: effectiveExpectedVoltage,
          setVoltage: cell.setVoltage,
          status: calculateStatus(cell.actualVoltage, effectiveExpectedVoltage),
        });
      } else {
        cellData.push({
          id,
          cycle,
          type,
          actualVoltage: null,
          expectedVoltage: null,
          setVoltage: null,
          status: "N/A",
        });
      }
    }

    return cellData.sort((a, b) => a.id - b.id);
  };

  // Process cells for the selected cycle, type, and set voltage
  const cells = useMemo(() => {
    return getCellsForCycle(selectedCycle, selectedType, selectedSetVoltage);
  }, [uploadedData, selectedCycle, selectedType, selectedSetVoltage]);

  // Identify issues
  const issues = useMemo(() => {
    const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

    cells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `Actual Voltage: ${cell.actualVoltage !== null ? cell.actualVoltage.toFixed(3) + " V" : "N/A"}`,
          `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(3) + " V" : "N/A"}`,
          `Set Voltage: ${cell.setVoltage !== null ? cell.setVoltage.toFixed(3) + " V" : "N/A"}`,
        ].filter((d) => !d.includes("N/A")).join(", ");
        issuesList.push({
          type: cell.type,
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    return issuesList;
  }, [cells]);

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
    return cells.map((cell) => ({
      label: `Cell ${cell.id}`,
      actualVoltage: cell.actualVoltage,
      expectedVoltage: cell.expectedVoltage,
      status: cell.status,
    }));
  }, [cells]);

  // Voltage data for Cell Voltage Trends chart
  const cellVoltageData = useMemo(() => {
    if (!uploadedData || !selectedCell) return [];
    return cycleNumbers.map((cycle) => {
      const cellData = uploadedData.find(
        (item) =>
          item.cycleNo.toString() === cycle &&
          item.cellNo.toString() === selectedCell &&
          item.type === selectedType &&
          (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
      );
      let effectiveExpectedVoltage = cellData ? cellData.setVoltage : null;

      // Map actualVoltage from individual type to expectedVoltage for specific types
      if (selectedType === "dccsu") {
        const cellId = parseInt(selectedCell);
        const individualCell = uploadedData.find(
          (item) =>
            item.cycleNo.toString() === cycle &&
            item.cellNo === cellId &&
            item.type === "individual" &&
            (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
        );
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
      } else if (selectedType === "csu12" && parseInt(selectedCell) >= 0 && parseInt(selectedCell) <= 11) {
        const cellId = parseInt(selectedCell);
        const individualCell = uploadedData.find(
          (item) =>
            item.cycleNo.toString() === cycle &&
            item.cellNo === cellId &&
            item.type === "individual" &&
            (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
        );
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
      } else if (selectedType === "csu11" && parseInt(selectedCell) >= 0 && parseInt(selectedCell) <= 11) {
        const cellId = parseInt(selectedCell) + 12;
        const individualCell = uploadedData.find(
          (item) =>
            item.cycleNo.toString() === cycle &&
            item.cellNo === cellId &&
            item.type === "individual" &&
            (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
        );
        effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : (cellData ? cellData.setVoltage : null);
      }

      return {
        cycle,
        actualVoltage: cellData ? cellData.actualVoltage : null,
        expectedVoltage: effectiveExpectedVoltage,
      };
    });
  }, [uploadedData, selectedCell, selectedType, selectedSetVoltage, cycleNumbers]);

  // Initialize and update charts
  useEffect(() => {
    const initializeCharts = () => {
      // Voltage Trends chart
      if (voltageChartRef.current) {
        const ctx = voltageChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: `${selectedType} Voltage (V)`,
              data: voltageData.map((d) => (d.actualVoltage !== null ? parseFloat(d.actualVoltage.toFixed(3)) : null)),
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
              data: voltageData.map((d) => (d.expectedVoltage !== null ? parseFloat(d.expectedVoltage.toFixed(3)) : null)),
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
            voltageChartInstance.current.data.labels = voltageData.map((d) => d.label);
            voltageChartInstance.current.data.datasets = datasets;
            voltageChartInstance.current.update();
          } else {
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
                    suggestedMax: 5,
                  },
                  x: {
                    title: {
                      display: true,
                      text: `Cell ID (Cycle: ${selectedCycle || "N/A"}, Type: ${selectedType}, Set Voltage: ${selectedSetVoltage || "N/A"})`,
                    },
                  },
                },
                plugins: {
                  tooltip: {
                    enabled: true,
                    mode: "nearest",
                    callbacks: {
                      label: (context) => `${context.dataset.label}: ${context.raw || "N/A"} V`,
                    },
                  },
                  legend: {
                    display: true,
                  },
                },
              },
            });
          }
        }
      }

      // Cell Voltage Trends chart
      if (cellVoltageChartRef.current) {
        const ctx = cellVoltageChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: `${selectedType} Voltage (V)`,
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
            cellVoltageChartInstance.current.data.labels = cycleNumbers;
            cellVoltageChartInstance.current.data.datasets = datasets;
            cellVoltageChartInstance.current.update();
          } else {
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
                    suggestedMin: 0,
                    suggestedMax: 5,
                  },
                  x: {
                    title: {
                      display: true,
                      text: `Cycle Number (Cell: ${selectedCell || "N/A"}, Type: ${selectedType}, Set Voltage: ${selectedSetVoltage || "N/A"})`,
                    },
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
                      label: (context) => `${context.dataset.label}: ${context.raw || "N/A"} V`,
                    },
                  },
                  legend: {
                    display: true,
                  },
                },
              },
            });
          }
        }
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
            issueChartInstance.current.data.datasets = datasets;
            issueChartInstance.current.update();
          } else {
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
        }
      }
    };

    let rafId: number;
    const scheduleCharts = () => {
      rafId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (voltageChartRef.current && cellVoltageChartRef.current && issueChartRef.current) {
            initializeCharts();
          }
        });
      });
    };

    if (uploadedData.length > 0 && selectedCycle && selectedType && selectedCell) {
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
  }, [voltageData, cellVoltageData, issues, selectedCycle, selectedType, selectedCell, selectedSetVoltage, cycleNumbers]);

  // Generate PDF report with Cell Data for all cycles
  // const generatePDF = () => {
  //   if (uploadedData.length === 0) {
  //     alert("Please upload a JSON file.");
  //     return;
  //   }

  //   const doc = new jsPDF();
  //   doc.setFontSize(16);
  //   doc.text(`Battery Management System Report - All Cycles`, 20, 20);
  //   doc.setFontSize(12);
  //   doc.text(`CSU Card Number: ${csuCardNumber || "N/A"}`, 20, 30);
  //   let finalY = 30;

  //   cycleNumbers.forEach((cycle) => {
  //     types.forEach((type) => {
  //       const filteredData = uploadedData.filter((item) => item.cycleNo.toString() === cycle && item.type === type);
  //       const individualData = uploadedData.filter(
  //         (item) =>
  //           item.cycleNo.toString() === cycle &&
  //           item.type === "individual" &&
  //           (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
  //       );
  //       const individualMap = new Map<number, any>();
  //       individualData.forEach((item) => {
  //         individualMap.set(item.cellNo, item);
  //       });

  //       const validCells = filteredData.filter(
  //         (cell) => cell.actualVoltage !== null && (
  //           (type === "dccsu" || (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) || (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11)) ?
  //             (individualMap.get(type === "csu11" ? cell.cellNo + 12 : cell.cellNo)?.actualVoltage !== null || cell.setVoltage !== null) :
  //             cell.setVoltage !== null
  //         )
  //       );

  //       if (validCells.length > 0) {
  //         doc.setFontSize(14);
  //         doc.text(`Cycle ${cycle} - ${type.toUpperCase()}`, 20, finalY + 10);
  //         finalY += 15;

  //         autoTable(doc, {
  //           startY: finalY + 15,
  //           head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
  //           body: validCells.map((cell) => {
  //             let effectiveExpectedVoltage = cell.setVoltage;
  //             if (type === "dccsu") {
  //               const individualCell = individualMap.get(cell.cellNo);
  //               effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
  //             } else if (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) {
  //               const individualCell = individualMap.get(cell.cellNo);
  //               effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
  //             } else if (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11) {
  //               const individualCell = individualMap.get(cell.cellNo + 12);
  //               effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
  //             }
  //             const actualVoltage = cell.actualVoltage;
  //             const variance =
  //               actualVoltage !== null && effectiveExpectedVoltage !== null
  //                 ? Math.abs(actualVoltage - effectiveExpectedVoltage).toFixed(3)
  //                 : "N/A";
  //             const status = calculateStatus(actualVoltage, effectiveExpectedVoltage);
  //             return [
  //               cell.cellNo,
  //               actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A",
  //               effectiveExpectedVoltage !== null ? effectiveExpectedVoltage.toFixed(3) : "N/A",
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
  //   });

  //   doc.save(`BMS_Report_All_Cycles_${csuCardNumber || "N/A"}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
  // };
  




  const generatePDF = () => {
  if (uploadedData.length === 0 || !selectedCycle || !selectedType) {
    alert("Please upload a JSON file and select a cycle and type.");
    return;
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const currentDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  // Header with title and CSU card number
  doc.setFillColor(0, 102, 204); // Corporate blue
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255); // White text
  doc.addImage("/vegalogo1.png", "PNG", pageWidth - 10 - margin, 5, 30, 30); // Adjust logo position and size as needed
  doc.setFontSize(15);
  doc.text("Battery Management System Report", margin, 20);
  doc.setFontSize(12);
  doc.text(`CSU Card Number: ${csuCardNumber || "N/A"}`, margin, 27);

  let finalY = 40;

  // Voltage map for set voltages
  const voltageMap = {
    1: "2.0",
    2: "2.5",
    3: "2.8",
    4: "3.0",
    5: "3.3",
    6: "3.6",
    7: "3.9",
    8: "4.2",
  };

  // Generate a table for each set voltage
  setVoltages.forEach((voltage) => {
    const numericVoltage = parseInt(voltage);
    const voltageLabel = voltageMap[numericVoltage] || voltage;
    const cellsForVoltage = getCellsForCycle(selectedCycle, selectedType, voltage);

    const validCells = cellsForVoltage.filter(
      (cell) => cell.actualVoltage !== null && cell.expectedVoltage !== null
    );

    if (validCells.length > 0) {
      doc.setTextColor(0, 0, 0); // Black text
      doc.setFontSize(14);
      doc.text(`Cell Data Status - Cycle ${selectedCycle} - ${selectedType.toUpperCase()} - ${voltageLabel}V`, margin, finalY);
      finalY += 10;

      autoTable(doc, {
        startY: finalY,
        head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
        body: validCells.map((cell) => [
          `Cell ${cell.id}`,
          cell.actualVoltage !== null ? cell.actualVoltage.toFixed(3) : "N/A",
          cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(3) : "N/A",
          cell.status !== "N/A" ? Math.abs(cell.actualVoltage - cell.expectedVoltage).toFixed(3) : "N/A",
          cell.status.charAt(0).toUpperCase() + cell.status.slice(1),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: [0, 102, 204], // Blue header
          textColor: [255, 255, 255], // White text
          fontSize: 10,
          halign: "center",
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50], // Dark gray
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245], // Light gray alternate rows
        },
        margin: { left: margin, right: margin },
        tableWidth: "auto",
        styles: {
          cellPadding: 2,
          lineWidth: 0.1,
          lineColor: [200, 200, 200],
        },
      });
      finalY = (doc as any).lastAutoTable.finalY + 20; // Extra space between tables

      // Check for page break
      if (finalY > pageHeight - 30) {
        doc.addPage();
        finalY = margin;
      }
    } else {
      doc.setFontSize(12);
      doc.text(`No valid cell data for ${voltageLabel}V.`, margin, finalY + 10);
      finalY += 20;

      if (finalY > pageHeight - 30) {
        doc.addPage();
        finalY = margin;
      }
    }
  });

  // Footer with page number and timestamp
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100); // Gray text
    doc.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10, { align: "right" });
    doc.text(`Generated: ${currentDate} IST`, margin, pageHeight - 10);
  }

  doc.save(`BMS_Report_Cycle_${selectedCycle}_${selectedType}_${csuCardNumber || "N/A"}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
};


  




  // Generate Excel report with Cell Data for all cycles
  const generateExcel = () => {
    if (uploadedData.length === 0) {
      alert("Please upload a JSON file.");
      return;
    }

    const wb = XLSX.utils.book_new();

    cycleNumbers.forEach((cycle) => {
      types.forEach((type) => {
        const filteredData = uploadedData.filter((item) => item.cycleNo.toString() === cycle && item.type === type);
        const individualData = uploadedData.filter(
          (item) =>
            item.cycleNo.toString() === cycle &&
            item.type === "individual" &&
            (selectedSetVoltage === "" || item.setVoltage.toString() === selectedSetVoltage)
        );
        const individualMap = new Map<number, any>();
        individualData.forEach((item) => {
          individualMap.set(item.cellNo, item);
        });

        const validCells = filteredData.filter(
          (cell) => cell.actualVoltage !== null && (
            (type === "dccsu" || (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) || (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11)) ?
              (individualMap.get(type === "csu11" ? cell.cellNo + 12 : cell.cellNo)?.actualVoltage !== null || cell.setVoltage !== null) :
              cell.setVoltage !== null
          )
        );

        if (validCells.length > 0) {
          const wsData = [
            [`CSU Card Number: ${csuCardNumber || "N/A"}`],
            [],
            [`${type.toUpperCase()} Cells - Cycle ${cycle}`],
            ["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"],
            ...validCells.map((cell) => {
              let effectiveExpectedVoltage = cell.setVoltage;
              if (type === "dccsu") {
                const individualCell = individualMap.get(cell.cellNo);
                effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
              } else if (type === "csu12" && cell.cellNo >= 0 && cell.cellNo <= 11) {
                const individualCell = individualMap.get(cell.cellNo);
                effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
              } else if (type === "csu11" && cell.cellNo >= 0 && cell.cellNo <= 11) {
                const individualCell = individualMap.get(cell.cellNo + 12);
                effectiveExpectedVoltage = individualCell ? individualCell.actualVoltage : cell.setVoltage;
              }
              const actualVoltage = cell.actualVoltage;
              const variance =
                actualVoltage !== null && effectiveExpectedVoltage !== null
                  ? Math.abs(actualVoltage - effectiveExpectedVoltage).toFixed(3)
                  : "N/A";
              const status = calculateStatus(actualVoltage, effectiveExpectedVoltage);
              return [
                cell.cellNo,
                actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A",
                effectiveExpectedVoltage !== null ? effectiveExpectedVoltage.toFixed(3) : "N/A",
                variance,
                status.charAt(0).toUpperCase() + status.slice(1),
              ];
            }),
          ];
          const ws = XLSX.utils.aoa_to_sheet(wsData);
          XLSX.utils.book_append_sheet(wb, ws, `Cycle_${cycle}_${type}`);
        }
      });
    });

    XLSX.writeFile(wb, `BMS_Report_All_Cycles_${csuCardNumber || "N/A"}_${new Date().toISOString().replace(/[:.]/g, "-")}.xlsx`);
  };

  // Check chart visibility
  const hasVoltageData = useMemo(() => {
    return voltageData.some((d) => d.actualVoltage !== null || d.expectedVoltage !== null);
  }, [voltageData]);

  const hasCellVoltageData = useMemo(() => {
    return cellVoltageData.some((d) => d.actualVoltage !== null || d.expectedVoltage !== null);
  }, [cellVoltageData]);

  const hasIssueData = issues.length > 0;

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      <CustomTitleBar />
      <div className="max-w-8xl mx-auto p-6">
        <div className="bg-white shadow-lg rounded-lg p-6 mb-6 border border-gray-200">
          <h1 className="text-3xl font-semibold text-gray-800 mb-4">Battery Management System Report</h1>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept=".json"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="block w-full md:w-auto text-sm text-gray-700 bg-white border border-gray-300 rounded-lg cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                placeholder="Upload JSON"
              />
              {cycleNumbers.length > 0 && (
                <select
                  title="Select Cycle"
                  value={selectedCycle}
                  onChange={handleCycleChange}
                  className="w-full md:w-auto p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Cycle</option>
                  {cycleNumbers.map((cycle) => (
                    <option key={cycle} value={cycle}>
                      Cycle {cycle}
                    </option>
                  ))}
                </select>
              )}
              {types.length > 0 && (
                <select
                  title="Select Type"
                  value={selectedType}
                  onChange={handleTypeChange}
                  className="w-full md:w-auto p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Type</option>
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type.toUpperCase()}
                    </option>
                  ))}
                </select>
              )}
              {setVoltages.length > 0 && (
                <select
                  title="Select Set Voltage"
                  value={selectedSetVoltage}
                  onChange={handleSetVoltageChange}
                  className="w-full md:w-auto p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Set Voltages</option>
                  {setVoltages.map((voltage) => {
                    const numericVoltage = parseInt(voltage);
                    const mappedVoltage = voltageMap[numericVoltage] || voltage;
                    return (
                      <option key={voltage} value={voltage}>
                        {mappedVoltage} V
                      </option>
                    );
                  })}
                </select>
              )}
            </div>
            <div className="flex flex-col md:flex-row gap-4">
              <button
                onClick={generatePDF}
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                disabled={uploadedData.length === 0}
              >
                Generate PDF
              </button>
              <button
                onClick={generateExcel}
                className="w-full md:w-auto px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                disabled={uploadedData.length === 0}
              >
                Generate Excel
              </button>
              <input
                type="text"
                value={csuCardNumber}
                onChange={handleCsuCardNumberChange}
                placeholder="Enter CSU Card Number"
                className="w-full md:w-auto p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {!uploadedData.length && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            Please upload a JSON file to view the report.
          </div>
        )}

        {uploadedData.length > 0 && !selectedCycle && (
          <div className="bg-white border border-gray-200 rounded-lg p-6 text-center text-gray-600">
            Please select a cycle to view the report.
          </div>
        )}

        {uploadedData.length > 0 && selectedCycle && (
          <div className="space-y-6">
            {/* Voltage Trends Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Voltage Trends</h2>
                {types.length > 0 && (
                  <select
                    title="Select Type"
                    value={selectedType}
                    onChange={handleTypeChange}
                    className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    {types.map((type) => (
                      <option key={type} value={type}>
                        {type.toUpperCase()}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div style={{ display: hasVoltageData ? "block" : "none" }}>
                <canvas ref={voltageChartRef} className="w-full h-64"></canvas>
              </div>
              {!hasVoltageData && (
                <div className="text-center text-gray-600 py-4">
                  No voltage data available for {selectedType} type.
                </div>
              )}
            </div>

            {/* Cell Voltage Trends Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Cell Voltage Trends</h2>
                <div className="flex gap-4">
                  {cellIds.length > 0 && (
                    <select
                      title="Select Cell"
                      value={selectedCell}
                      onChange={handleCellChange}
                      className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Cell</option>
                      {cellIds.map((cellId) => (
                        <option key={cellId} value={cellId}>
                          Cell {cellId}
                        </option>
                      ))}
                    </select>
                  )}
                  {types.length > 0 && (
                    <select
                      title="Select Type"
                      value={selectedType}
                      onChange={handleTypeChange}
                      className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Type</option>
                      {types.map((type) => (
                        <option key={type} value={type}>
                          {type.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  )}
                  {setVoltages.length > 0 && (
                    <select
                      title="Select Set Voltage"
                      value={selectedSetVoltage}
                      onChange={handleSetVoltageChange}
                      className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Set Voltages</option>
                      {setVoltages.map((voltage) => {
                        const numericVoltage = parseInt(voltage);
                        const mappedVoltage = voltageMap[numericVoltage] || voltage;
                        return (
                          <option key={voltage} value={voltage}>
                            {mappedVoltage} V
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>
              </div>
              <div style={{ display: hasCellVoltageData ? "block" : "none" }}>
                <canvas ref={cellVoltageChartRef} className="w-full h-64"></canvas>
              </div>
              {!hasCellVoltageData && (
                <div className="text-center text-gray-600 py-4">
                  No voltage data available for Cell {selectedCell} ({selectedType} type, Set Voltage: {selectedSetVoltage || "N/A"}).
                </div>
              )}
            </div>

            {/* Issue Distribution Chart */}
            <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Issue Distribution</h2>
              <div style={{ display: hasIssueData ? "block" : "none" }}>
                <canvas ref={issueChartRef} className="w-full h-64"></canvas>
              </div>
              {!hasIssueData && (
                <div className="text-center text-gray-600 py-4">
                  No issue data available for chart.
                </div>
              )}
            </div>

            {/* Cell Data */}
            {cells.some((cell) => cell.status !== "N/A") && (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  Cell Data Status ({selectedType.toUpperCase()})
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {cells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-gray-700">
                    <thead className="bg-gray-100 text-left">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Cell ID</th>
                        <th className="px-4 py-2 font-semibold">Voltage (V)</th>
                        <th className="px-4 py-2 font-semibold">Expected Voltage (V)</th>
                        <th className="px-4 py-2 font-semibold">Variance (V)</th>
                        <th className="px-4 py-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cells.map((cell) => {
                        const actualVoltage = cell.actualVoltage;
                        const expectedVoltage = cell.expectedVoltage;
                        const variance =
                          actualVoltage !== null && expectedVoltage !== null
                            ? Math.abs(actualVoltage - expectedVoltage).toFixed(3)
                            : "N/A";
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
                            <td className="px-4 py-2">{actualVoltage !== null ? actualVoltage.toFixed(3) : "N/A"}</td>
                            <td className="px-4 py-2">{expectedVoltage !== null ? expectedVoltage.toFixed(3) : "N/A"}</td>
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
                <div key={`instructions-${index}`} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
                  <ul className="space-y-3 max-h-60 overflow-y-auto">
                    {data.map((instruction, i) => (
                      <li
                        key={`instruction-${i}`}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700"
                      >
                        <strong className="font-medium">Instruction {instruction.id}</strong>: {formatInstruction(instruction)}
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