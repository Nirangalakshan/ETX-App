// /* eslint-disable */
// /* @ts-nocheck */

// import React, { useMemo, useRef, useEffect, useState } from "react";
// import CustomTitleBar from "../components/MenuBar";
// import { useBatteryContext } from "../BatteryContext";
// import jsPDF from "jspdf";
// import autoTable from "jspdf-autotable";
// import Chart from "chart.js/auto";

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
//   const [selectedVoltageSource, setSelectedVoltageSource] = useState<string>("individual");
//   const [selectedCell, setSelectedCell] = useState<string>("");
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
//       Object.keys(cycleData).forEach((cellId) => {
//         const id = parseInt(cellId.replace("cell_", ""));
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
//             const firstCycleData = Object.keys(jsonData[Object.keys(jsonData)[0]]);
//             if (firstCycleData.length > 0) {
//               setSelectedCell(firstCycleData[0].replace("cell_", ""));
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

//   // Calculate cell status based on voltage difference
//   const calculateStatus = (actualVoltage: number | null, expectedVoltage: number | null): CellStatus => {
//     if (actualVoltage === null || expectedVoltage === null) return "N/A";
//     const difference = Math.abs(actualVoltage - expectedVoltage);
//     if (difference > 0.3) return "critical";
//     if (difference > 0.1) return "warning";
//     return "normal";
//   };

//   // Process cells
//   const cells = useMemo(() => {
//     if (!uploadedData || !selectedCycle) return [];

//     const cellData: CellData[] = [];
//     const cycleData = uploadedData[selectedCycle] || {};

//     Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
//       const id = parseInt(cellId.replace("cell_", ""));
//       const individualVoltage = data.individual?.receivedVoltage ?? null;
//       const expectedVoltage = data.individual?.expectedVoltage ?? null;
//       const csu11Voltage = data.csu11?.receivedVoltage ?? null;
//       const csu12Voltage = data.csu12?.receivedVoltage ?? null;
//       const dcCsuVoltage = data.dcCsu?.receivedVoltage ?? null;

//       // Determine status based on the selected voltage source
//       const actualVoltage =
//         selectedVoltageSource === "individual" ? individualVoltage :
//         selectedVoltageSource === "csu11" ? csu11Voltage :
//         selectedVoltageSource === "csu12" ? csu12Voltage :
//         dcCsuVoltage;

//       cellData.push({
//         id,
//         cycle: selectedCycle,
//         individualVoltage,
//         expectedVoltage,
//         csu11Voltage,
//         csu12Voltage,
//         dcCsuVoltage,
//         status: calculateStatus(actualVoltage, expectedVoltage),
//       });
//     });

//     // Fill in missing cells (up to 24 cells)
//     const maxCells = 24;
//     for (let id = 0; id < maxCells; id++) {
//       if (!cellData.find(c => c.id === id)) {
//         cellData.push({
//           id,
//           cycle: selectedCycle,
//           individualVoltage: null,
//           expectedVoltage: null,
//           csu11Voltage: null,
//           csu12Voltage: null,
//           dcCsuVoltage: null,
//           status: "N/A",
//         });
//       }
//     }

//     return cellData.sort((a, b) => a.id - b.id);
//   }, [uploadedData, selectedCycle, selectedVoltageSource]);

//   // Identify issues
//   const issues = useMemo(() => {
//     const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

//     cells.forEach((cell) => {
//       if (cell.status !== "N/A") {
//         const details = [
//           `Individual Voltage: ${cell.individualVoltage !== null ? cell.individualVoltage.toFixed(2) + " V" : "N/A"}`,
//           `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) + " V" : "N/A"}`,
//           `CSU11 Voltage: ${cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) + " V" : "N/A"}`,
//           `CSU12 Voltage: ${cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) + " V" : "N/A"}`,
//           `DC CSU Voltage: ${cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) + " V" : "N/A"}`,
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

//   // Voltage comparison
//   // const voltageComparisons = useMemo(() => {
//   //   const comparisons: {
//   //     cellId: number;
//   //     cycle: string;
//   //     setVoltage: number | null;
//   //     actualVoltage: number | null;
//   //     variance: number | null;
//   //     status: "Match" | "Mismatch" | "No Data";
//   //   }[] = [];

//   //   cells.forEach((cell) => {
//   //     const setVoltage = cell.expectedVoltage;
//   //     const actualVoltage = 
//   //       selectedVoltageSource === "individual" ? cell.individualVoltage :
//   //       selectedVoltageSource === "csu11" ? cell.csu11Voltage :
//   //       selectedVoltageSource === "csu12" ? cell.csu12Voltage :
//   //       cell.dcCsuVoltage;
//   //     if (setVoltage !== null && actualVoltage !== null) {
//   //       const variance = Math.abs(setVoltage - actualVoltage);
//   //       comparisons.push({
//   //         cellId: cell.id,
//   //         cycle: cell.cycle,
//   //         setVoltage,
//   //         actualVoltage,
//   //         variance,
//   //         status: variance <= 0.1 ? "Match" : "Mismatch",
//   //       });
//   //     } else if (setVoltage !== null || actualVoltage !== null) {
//   //       comparisons.push({
//   //         cellId: cell.id,
//   //         cycle: cell.cycle,
//   //         setVoltage,
//   //         actualVoltage,
//   //         variance: null,
//   //         status: "No Data",
//   //       });
//   //     }
//   //   });

//   //   return comparisons;
//   // }, [cells, selectedVoltageSource]);

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
//         selectedVoltageSource === "individual" ? cell.individualVoltage :
//         selectedVoltageSource === "csu11" ? cell.csu11Voltage :
//         selectedVoltageSource === "csu12" ? cell.csu12Voltage :
//         cell.dcCsuVoltage,
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
//       const cellData = cycleData[`cell_${selectedCell}`] || {};
//       const actualVoltage =
//         selectedVoltageSource === "individual" ? cellData.individual?.receivedVoltage ?? null :
//         selectedVoltageSource === "csu11" ? cellData.csu11?.receivedVoltage ?? null :
//         selectedVoltageSource === "csu12" ? cellData.csu12?.receivedVoltage ?? null :
//         cellData.dcCsu?.receivedVoltage ?? null;
//       const expectedVoltage = cellData.individual?.expectedVoltage ?? null;
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

//   // Generate PDF report
//   const generatePDF = () => {
//     if (!uploadedData || !selectedCycle || !selectedCell) {
//       alert("Please upload a JSON file, select a cycle, and select a cell.");
//       return;
//     }

//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const chartWidth = 140;
//     const xOffset = (pageWidth - chartWidth) / 2;

//     doc.setFontSize(16);
//     doc.text(`Battery Management System Report - Cycle ${selectedCycle}`, 20, 20);

//     let finalY = 20;

//     // Cells Table
//     if (cells.some((cell) => cell.status !== "N/A")) {
//       doc.setFontSize(12);
//       doc.text("Cell Data", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [["Cell ID", "Individual Voltage (V)", "Expected Voltage (V)", "CSU11 Voltage (V)", "CSU12 Voltage (V)", "DC CSU Voltage (V)", "Status"]],
//         body: cells.map((cell) => [
//           cell.id,
//           cell.individualVoltage !== null ? cell.individualVoltage.toFixed(2) : "N/A",
//           cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) : "N/A",
//           cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) : "N/A",
//           cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) : "N/A",
//           cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) : "N/A",
//           cell.status,
//         ]),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Error/Warning States Table
//     if (errorWarningStatuses.length > 0) {
//       doc.setFontSize(12);
//       doc.text("Error/Warning States", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [["Type", "Label", "Status", "Details"]],
//         body: errorWarningStatuses.map((status) => [
//           status.type,
//           status.label,
//           status.status,
//           status.details || "N/A",
//         ]),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Add charts to PDF
//     if (voltageChartRef.current && voltageChartInstance.current) {
//       try {
//         doc.setFontSize(12);
//         doc.text(`Voltage Trends (${selectedVoltageSource})`, xOffset, finalY + 10);
//         const imgData = voltageChartRef.current.toDataURL("image/png");
//         doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
//         finalY += 60;
//       } catch (e) {
//         console.error("Report: Error adding voltage chart to PDF:", e);
//       }
//     }

//     if (cellVoltageChartRef.current && cellVoltageChartInstance.current) {
//       try {
//         doc.setFontSize(12);
//         doc.text(`Cell Voltage Trends (Cell ${selectedCell}, ${selectedVoltageSource})`, xOffset, finalY + 10);
//         const imgData = cellVoltageChartRef.current.toDataURL("image/png");
//         doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
//         finalY += 60;
//       } catch (e) {
//         console.error("Report: Error adding cell voltage chart to PDF:", e);
//       }
//     }

//     doc.save(`BMS_Report_Cycle_${selectedCycle}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
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
//       <div className="max-w-7xl p-2 mx-auto space-y-6 mt-10 shadow-lg">
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
//               disabled={!uploadedData || !selectedCycle || !selectedCell}
//             >
//               📄 Generate PDF
//             </button>
//           </div>
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
//                   value={selectedVoltageSource}
//                   onChange={handleVoltageSourceChange}
//                   className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                 >
//                   <option value="individual">Individual</option>
//                   <option value="csu11">CSU11</option>
//                   <option value="csu12">CSU12</option>
//                   <option value="dcCsu">DC CSU</option>
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
//                     value={selectedVoltageSource}
//                     onChange={handleVoltageSourceChange}
//                     className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//                   >
//                     <option value="individual">Individual</option>
//                     <option value="csu11">CSU11</option>
//                     <option value="csu12">CSU12</option>
//                     <option value="dcCsu">DC CSU</option>
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

//             {/* Error/Warning States */}
//             {/* {errorWarningStatuses.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   ⚠️ Error/Warning States
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {errorWarningStatuses.length}
//                   </span>
//                 </h2>
//                 <div className="overflow-x-auto overflow-y-auto max-h-100">
//                   <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Type</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Label</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Details</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {errorWarningStatuses.map((status, index) => (
//                         <tr key={`error-warning-${index}`} className="border-t border-gray-200">
//                           <td className="px-4 py-2 text-sm text-gray-800">{status.type}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{status.label}</td>
//                           <td
//                             className={`px-4 py-2 text-sm ${
//                               status.status === "critical"
//                                 ? "text-red-600"
//                                 : status.status === "warning"
//                                 ? "text-yellow-600"
//                                 : status.status === "N/A"
//                                 ? "text-gray-600"
//                                 : "text-green-600"
//                             }`}
//                           >
//                             {status.status}
//                           </td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{status.details || "N/A"}</td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )} */}

// {/* Cell Data */}
//             {cells.some((cell) => cell.status !== "N/A") && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   🔋 Cell Data
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {cells.filter((cell) => cell.status !== "N/A").length}
//                   </span>
//                 </h2>
//                 <div className="space-y-6">
//                   {/* Individual Cells */}
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-600 mb-3">Individual Cells</h3>
//                     <div className="space-y-4 h-80 overflow-y-auto">
//                       {cells.map((cell) => {
//                         const actualVoltage = cell.individualVoltage;
//                         const expectedVoltage = cell.expectedVoltage;
//                         const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
//                         const status = calculateStatus(actualVoltage, expectedVoltage);

//                         if (status === "N/A") return null;

//                         return (
//                           <div
//                             key={`individual-cell-${cell.id}`}
//                             className={`border rounded-lg p-1 text-xs shadow-sm ${
//                               status === "critical"
//                                 ? "bg-red-50 border-red-200 text-red-800"
//                                 : status === "warning"
//                                 ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                                 : "bg-green-50 border-green-200 text-green-800"
//                             }`}
//                           >
//                             <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
//                             <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Variance:</strong> {variance} V</p>
//                             <p><strong>Status:</strong> {status}</p>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* CSU1 Cells */}
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-600 mb-3">CSU1 Cells</h3>
//                     <div className="space-y-4 h-80 overflow-y-auto">
//                       {cells.map((cell) => {
//                         const actualVoltage = cell.csu11Voltage;
//                         const expectedVoltage = cell.expectedVoltage;
//                         const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
//                         const status = calculateStatus(actualVoltage, expectedVoltage);

//                         if (status === "N/A") return null;

//                         return (
//                           <div
//                             key={`csu1-cell-${cell.id}`}
//                             className={`border rounded-lg p-1 text-xs shadow-sm ${
//                               status === "critical"
//                                 ? "bg-red-50 border-red-200 text-red-800"
//                                 : status === "warning"
//                                 ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                                 : "bg-green-50 border-green-200 text-green-800"
//                             }`}
//                           >
//                             <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
//                             <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Variance:</strong> {variance} V</p>
//                             <p><strong>Status:</strong> {status}</p>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* CSU2 Cells */}
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-600 mb-3">CSU2 Cells</h3>
//                     <div className="space-y-4 h-80 overflow-y-auto">
//                       {cells.map((cell) => {
//                         const actualVoltage = cell.csu12Voltage;
//                         const expectedVoltage = cell.expectedVoltage;
//                         const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
//                         const status = calculateStatus(actualVoltage, expectedVoltage);

//                         if (status === "N/A") return "";

//                         return (
//                           <div
//                             key={`csu2-cell-${cell.id}`}
//                             className={`border rounded-lg p-1 text-xs shadow-sm ${
//                               status === "critical"
//                                 ? "bg-red-50 border-red-200 text-red-800"
//                                 : status === "warning"
//                                 ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                                 : "bg-green-50 border-green-200 text-green-800"
//                             }`}
//                           >
//                             <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
//                             <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Variance:</strong> {variance} V</p>
//                             <p><strong>Status:</strong> {status}</p>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* Daisy Chain Cells */}
//                   <div>
//                     <h3 className="text-lg font-semibold text-gray-600 mb-3">Daisy Chain Cells</h3>
//                     <div className="space-y-4 h-80 overflow-y-auto">
//                       {cells.map((cell) => {
//                         const actualVoltage = cell.dcCsuVoltage;
//                         const expectedVoltage = cell.expectedVoltage;
//                         const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
//                         const status = calculateStatus(actualVoltage, expectedVoltage);

//                         if (status === "N/A") return null;

//                         return (
//                           <div
//                             key={`daisy-chain-cell-${cell.id}`}
//                             className={`border rounded-lg p-1 text-xs shadow-sm ${
//                               status === "critical"
//                                 ? "bg-red-50 border-red-200 text-red-800"
//                                 : status === "warning"
//                                 ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                                 : "bg-green-50 border-green-200 text-green-800"
//                             }`}
//                           >
//                             <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
//                             <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
//                             <p><strong>Variance:</strong> {variance} V</p>
//                             <p><strong>Status:</strong> {status}</p>
//                           </div>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             )}
//             {/* Issues Detected */}
//             {/* {issues.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                    Issues Detected
//                   <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
//                     {issues.length}
//                   </span>
//                 </h2>
//                 <ul className="space-y-3">
//                   {issues.map((item, index) => (
//                     <li
//                       key={`issue-${item.cycle}-${item.cellId}`}
//                       className={`border rounded-lg p-4 text-sm ${
//                         item.status === "critical"
//                           ? "bg-red-50 border-red-200 text-red-800"
//                           : item.status === "warning"
//                           ? "bg-yellow-50 border-yellow-200 text-yellow-800"
//                           : "bg-green-50 border-green-200 text-green-800"
//                       }`}
//                     >
//                       <strong>
//                         {item.type} Cell {item.cellId}
//                       </strong>
//                       <br />
//                       {item.details}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )} */}

//             {/* Voltage Comparison */}
//             {/* {voltageComparisons.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                    Voltage Comparison
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {voltageComparisons.length}
//                   </span>
//                 </h2>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Set Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actual Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Variance (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {voltageComparisons.map((comp, index) => (
//                         <tr key={`comp-${comp.cycle}-${comp.cellId}`} className="border-t border-gray-200">
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.cellId}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.setVoltage !== null ? comp.setVoltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.actualVoltage !== null ? comp.actualVoltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.variance !== null ? comp.variance.toFixed(2) : "N/A"}</td>
//                           <td
//                             className={`px-4 py-2 text-sm ${
//                               comp.status === "Match"
//                                 ? "text-green-600"
//                                 : comp.status === "Mismatch"
//                                 ? "text-red-600"
//                                 : "text-gray-600"
//                             }`}
//                           >
//                             {comp.status}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )} */}

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
  const [selectedVoltageSource, setSelectedVoltageSource] = useState<string>("individual");
  const [selectedCell, setSelectedCell] = useState<string>("");
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
      Object.keys(cycleData).forEach((cellId) => {
        const id = parseInt(cellId.replace("cell_", ""));
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
            const firstCycleData = Object.keys(jsonData[Object.keys(jsonData)[0]]);
            if (firstCycleData.length > 0) {
              setSelectedCell(firstCycleData[0].replace("cell_", ""));
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

    Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
      const id = parseInt(cellId.replace("cell_", ""));
      const individualVoltage = data.individual?.receivedVoltage ?? null;
      const expectedVoltage = data.individual?.expectedVoltage ?? null;
      const csu11Voltage = data.csu11?.receivedVoltage ?? null;
      const csu12Voltage = data.csu12?.receivedVoltage ?? null;
      const dcCsuVoltage = data.dcCsu?.receivedVoltage ?? null;

      // Determine status based on the selected voltage source
      const actualVoltage =
        selectedVoltageSource === "individual" ? individualVoltage :
        selectedVoltageSource === "csu11" ? csu11Voltage :
        selectedVoltageSource === "csu12" ? csu12Voltage :
        dcCsuVoltage;

      cellData.push({
        id,
        cycle,
        individualVoltage,
        expectedVoltage,
        csu11Voltage,
        csu12Voltage,
        dcCsuVoltage,
        status: calculateStatus(actualVoltage, expectedVoltage),
      });
    });

    // Fill in missing cells (up to 24 cells)
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      if (!cellData.find(c => c.id === id)) {
        cellData.push({
          id,
          cycle,
          individualVoltage: null,
          expectedVoltage: null,
          csu11Voltage: null,
          csu12Voltage: null,
          dcCsuVoltage: null,
          status: "N/A",
        });
      }
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
          `Individual Voltage: ${cell.individualVoltage !== null ? cell.individualVoltage.toFixed(2) + " V" : "N/A"}`,
          `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) + " V" : "N/A"}`,
          `CSU11 Voltage: ${cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) + " V" : "N/A"}`,
          `CSU12 Voltage: ${cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) + " V" : "N/A"}`,
          `DC CSU Voltage: ${cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) + " V" : "N/A"}`,
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
        selectedVoltageSource === "individual" ? cell.individualVoltage :
        selectedVoltageSource === "csu11" ? cell.csu11Voltage :
        selectedVoltageSource === "csu12" ? cell.csu12Voltage :
        cell.dcCsuVoltage,
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
      const cellData = cycleData[`cell_${selectedCell}`] || {};
      const actualVoltage =
        selectedVoltageSource === "individual" ? cellData.individual?.receivedVoltage ?? null :
        selectedVoltageSource === "csu11" ? cellData.csu11?.receivedVoltage ?? null :
        selectedVoltageSource === "csu12" ? cellData.csu12?.receivedVoltage ?? null :
        cellData.dcCsu?.receivedVoltage ?? null;
      const expectedVoltage = cellData.individual?.expectedVoltage ?? null;
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
  const generatePDF = () => {
    if (!uploadedData) {
      alert("Please upload a JSON file.");
      return;
    }

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Battery Management System Report - All Cycles`, 20, 20);
    let finalY = 20;

    cycleNumbers.forEach((cycle) => {
      const cellsForCycle = getCellsForCycle(cycle);

      // Add cycle header
      doc.setFontSize(14);
      doc.text(`Cycle ${cycle}`, 20, finalY + 10);
      finalY += 15;

      // Individual Cells Table
      const individualCells = cellsForCycle.filter(cell => calculateStatus(cell.individualVoltage, cell.expectedVoltage) !== "N/A");
      if (individualCells.length > 0) {
        doc.setFontSize(12);
        doc.text("Individual Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: individualCells.map(cell => {
            const actualVoltage = cell.individualVoltage;
            const expectedVoltage = cell.expectedVoltage;
            const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              cell.id,
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status,
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // CSU1 Cells Table
      const csu1Cells = cellsForCycle.filter(cell => calculateStatus(cell.csu11Voltage, cell.expectedVoltage) !== "N/A");
      if (csu1Cells.length > 0) {
        doc.setFontSize(12);
        doc.text("CSU1 Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: csu1Cells.map(cell => {
            const actualVoltage = cell.csu11Voltage;
            const expectedVoltage = cell.expectedVoltage;
            const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              cell.id,
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status,
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // CSU2 Cells Table
      const csu2Cells = cellsForCycle.filter(cell => calculateStatus(cell.csu12Voltage, cell.expectedVoltage) !== "N/A");
      if (csu2Cells.length > 0) {
        doc.setFontSize(12);
        doc.text("CSU2 Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: csu2Cells.map(cell => {
            const actualVoltage = cell.csu12Voltage;
            const expectedVoltage = cell.expectedVoltage;
            const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              cell.id,
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status,
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }

      // Daisy Chain Cells Table
      const daisyCells = cellsForCycle.filter(cell => calculateStatus(cell.dcCsuVoltage, cell.expectedVoltage) !== "N/A");
      if (daisyCells.length > 0) {
        doc.setFontSize(12);
        doc.text("Daisy Chain Cells", 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["Cell ID", "Voltage (V)", "Expected Voltage (V)", "Variance (V)", "Status"]],
          body: daisyCells.map(cell => {
            const actualVoltage = cell.dcCsuVoltage;
            const expectedVoltage = cell.expectedVoltage;
            const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : "N/A";
            const status = calculateStatus(actualVoltage, expectedVoltage);
            return [
              cell.id,
              actualVoltage !== null ? actualVoltage.toFixed(2) : "N/A",
              expectedVoltage !== null ? expectedVoltage.toFixed(2) : "N/A",
              variance,
              status,
            ];
          }),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY + 10;
      }
    });

    doc.save(`BMS_Report_All_Cycles_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
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
          </div>
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
                  <option value="individual">Individual</option>
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
                    <option value="individual">Individual</option>
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
                   Cell Data Status
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {cells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="space-y-6">
                  {/* Individual Cells */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">Individual Cells</h3>
                    <div className="space-y-4 h-80 overflow-y-auto">
                      {cells.map((cell) => {
                        const actualVoltage = cell.individualVoltage;
                        const expectedVoltage = cell.expectedVoltage;
                        const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
                        const status = calculateStatus(actualVoltage, expectedVoltage);

                        if (status === "N/A") return null;

                        return (
                          <div
                            key={`individual-cell-${cell.id}`}
                            className={`border rounded-lg p-1 text-xs shadow-sm ${
                              status === "critical"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : status === "warning"
                                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                                : "bg-green-50 border-green-200 text-green-800"
                            }`}
                          >
                            <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
                            <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Variance:</strong> {variance} V</p>
                            <p><strong>Status:</strong> {status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CSU1 Cells */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">CSU1 Cells</h3>
                    <div className="space-y-4 h-80 overflow-y-auto">
                      {cells.map((cell) => {
                        const actualVoltage = cell.csu11Voltage;
                        const expectedVoltage = cell.expectedVoltage;
                        const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
                        const status = calculateStatus(actualVoltage, expectedVoltage);

                        if (status === "N/A") return null;

                        return (
                          <div
                            key={`csu1-cell-${cell.id}`}
                            className={`border rounded-lg p-1 text-xs shadow-sm ${
                              status === "critical"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : status === "warning"
                                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                                : "bg-green-50 border-green-200 text-green-800"
                            }`}
                          >
                            <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
                            <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Variance:</strong> {variance} V</p>
                            <p><strong>Status:</strong> {status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* CSU2 Cells */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">CSU2 Cells</h3>
                    <div className="space-y-4 h-80 overflow-y-auto">
                      {cells.map((cell) => {
                        const actualVoltage = cell.csu12Voltage;
                        const expectedVoltage = cell.expectedVoltage;
                        const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
                        const status = calculateStatus(actualVoltage, expectedVoltage);

                        if (status === "N/A") return null;

                        return (
                          <div
                            key={`csu2-cell-${cell.id}`}
                            className={`border rounded-lg p-1 text-xs shadow-sm ${
                              status === "critical"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : status === "warning"
                                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                                : "bg-green-50 border-green-200 text-green-800"
                            }`}
                          >
                            <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
                            <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Variance:</strong> {variance} V</p>
                            <p><strong>Status:</strong> {status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Daisy Chain Cells */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-3">Daisy Chain Cells</h3>
                    <div className="space-y-4 h-80 overflow-y-auto">
                      {cells.map((cell) => {
                        const actualVoltage = cell.dcCsuVoltage;
                        const expectedVoltage = cell.expectedVoltage;
                        const variance = actualVoltage !== null && expectedVoltage !== null ? Math.abs(actualVoltage - expectedVoltage).toFixed(2) : 'N/A';
                        const status = calculateStatus(actualVoltage, expectedVoltage);

                        if (status === "N/A") return null;

                        return (
                          <div
                            key={`daisy-chain-cell-${cell.id}`}
                            className={`border rounded-lg p-1 text-xs shadow-sm ${
                              status === "critical"
                                ? "bg-red-50 border-red-200 text-red-800"
                                : status === "warning"
                                ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                                : "bg-green-50 border-green-200 text-green-800"
                            }`}
                          >
                            <h4 className="text-base font-semibold mb-2">Cell {cell.id}</h4>
                            <p><strong>Voltage:</strong> {actualVoltage !== null ? actualVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Expected Voltage:</strong> {expectedVoltage !== null ? expectedVoltage.toFixed(2) : 'N/A'} V</p>
                            <p><strong>Variance:</strong> {variance} V</p>
                            <p><strong>Status:</strong> {status}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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