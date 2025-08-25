
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

// interface CellDataPoint {
//   id: number;
//   cycle: string;
//   voltage: number | null;
//   temperature: number | null;
//   setVoltage: number | null;
//   setTemperature: number | null;
//   balancing: boolean;
//   openWire: boolean;
//   delay: number | null;
//   cellLed: boolean;
//   automaticSequence: boolean;
//   voltageLimits: number | null;
//   csu1Voltage: number | null;
//   csu1Temperature: number | null;
//   csu1Balance: boolean;
//   csu1OpenWire: boolean;
//   csu2Voltage: number | null;
//   csu2Temperature: number | null;
//   csu2Balance: boolean;
//   csu2OpenWire: boolean;
//   dcCsuVoltage: number | null;
//   dcCsuTemperature: number | null;
//   dcCsuBalance: boolean;
//   dcCsuOpenWire: boolean;
//   daisyChain: string | null;
// }

// const Report: React.FC = () => {
//   const {
//     instructions,
//     aiAnalysis,
//     dcCsuInstructions,
//     csu1Instructions,
//     csu2Instructions,
//     csu1Statuses,
//     csu2Statuses,
//     daisyStatuses,
//   } = useBatteryContext();

//   const [uploadedData, setUploadedData] = useState<any>(null);
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const voltageChartRef = useRef<HTMLCanvasElement | null>(null);
//   const tempChartRef = useRef<HTMLCanvasElement | null>(null);
//   const issueChartRef = useRef<HTMLCanvasElement | null>(null);
//   const voltageChartInstance = useRef<Chart | null>(null);
//   const tempChartInstance = useRef<Chart | null>(null);
//   const issueChartInstance = useRef<Chart | null>(null);

//   // Handle file upload
//   const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file && file.type === "application/json") {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const jsonData = JSON.parse(e.target?.result as string);
//           setUploadedData(jsonData);
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

//   // Calculate cell statuses
//   const calculateStatus = (
//     cell: {
//       voltage: number | null;
//       temperature: number | null;
//       csu1Voltage: number | null;
//       csu1Temperature: number | null;
//       csu1Balance: boolean;
//       csu1OpenWire: boolean;
//       csu2Voltage: number | null;
//       csu2Temperature: number | null;
//       csu2Balance: boolean;
//       csu2OpenWire: boolean;
//       dcCsuVoltage: number | null;
//       dcCsuTemperature: number | null;
//       dcCsuBalance: boolean;
//       dcCsuOpenWire: boolean;
//       daisyChain: string | null;
//     }
//   ): CellStatus => {
//     if (
//       cell.voltage === null &&
//       cell.temperature === null &&
//       cell.csu1Voltage === null &&
//       cell.csu1Temperature === null &&
//       !cell.csu1Balance &&
//       !cell.csu1OpenWire &&
//       cell.csu2Voltage === null &&
//       cell.csu2Temperature === null &&
//       !cell.csu2Balance &&
//       !cell.csu2OpenWire &&
//       cell.dcCsuVoltage === null &&
//       cell.dcCsuTemperature === null &&
//       !cell.dcCsuBalance &&
//       !cell.dcCsuOpenWire &&
//       cell.daisyChain === null
//     ) {
//       return "N/A";
//     }

//     let status: CellStatus = "normal";

//     [cell.voltage, cell.csu1Voltage, cell.csu2Voltage, cell.dcCsuVoltage].forEach((voltage) => {
//       if (voltage !== null) {
//         if (voltage > 4.2) {
//           status = "critical";
//         } else if (voltage < 3.0 && status !== "critical") {
//           status = "warning";
//         }
//       }
//     });

//     [cell.temperature, cell.csu1Temperature, cell.csu2Temperature, cell.dcCsuTemperature].forEach((temp) => {
//       if (temp !== null) {
//         if (temp > 60) {
//           status = "critical";
//         } else if (temp > 45 && status !== "critical") {
//           status = "warning";
//         }
//       }
//     });

//     if (cell.csu1OpenWire || cell.csu2OpenWire || cell.dcCsuOpenWire) {
//       status = "critical";
//     } else if (
//       (cell.csu1Balance || cell.csu2Balance || cell.dcCsuBalance) &&
//       status !== "critical"
//     ) {
//       status = "warning";
//     }

//     return status;
//   };

//   // Process cell data cycle-wise
//   const cells = useMemo(() => {
//     if (!uploadedData) {
//       return [];
//     }

//     const processedCells: CellDataPoint[] = [];

//     Object.entries(uploadedData).forEach(([cycle, cycleData]: [string, any]) => {
//       // Process individual cells
//       if (cycleData.individual) {
//         Object.entries(cycleData.individual).forEach(([cellId, data]: [string, any]) => {
//           const id = parseInt(cellId.replace("cell_", ""));
//           processedCells.push({
//             id,
//             cycle,
//             voltage: data.receivedVoltage ?? null,
//             temperature: null,
//             setVoltage: data.expectedVoltage ?? null,
//             setTemperature: null,
//             balancing: false,
//             openWire: false,
//             delay: null,
//             cellLed: false,
//             automaticSequence: false,
//             voltageLimits: null,
//             csu1Voltage: null,
//             csu1Temperature: null,
//             csu1Balance: false,
//             csu1OpenWire: false,
//             csu2Voltage: null,
//             csu2Temperature: null,
//             csu2Balance: false,
//             csu2OpenWire: false,
//             dcCsuVoltage: null,
//             dcCsuTemperature: null,
//             dcCsuBalance: false,
//             dcCsuOpenWire: false,
//             daisyChain: null,
//           });
//         });
//       }

//       // Process csu1 cells
//       if (cycleData.csu1) {
//         Object.entries(cycleData.csu1).forEach(([cellId, data]: [string, any]) => {
//           const id = parseInt(cellId.replace("cell_", ""));
//           const existingCell = processedCells.find(c => c.id === id && c.cycle === cycle);
//           if (existingCell) {
//             existingCell.csu1Voltage = data.voltage ?? null;
//             existingCell.csu1Temperature = data.temperature ?? null;
//             existingCell.csu1Balance = data.balance ?? false;
//             existingCell.csu1OpenWire = data.openWire ?? false;
//           } else {
//             processedCells.push({
//               id,
//               cycle,
//               voltage: null,
//               temperature: null,
//               setVoltage: null,
//               setTemperature: null,
//               balancing: false,
//               openWire: false,
//               delay: null,
//               cellLed: false,
//               automaticSequence: false,
//               voltageLimits: null,
//               csu1Voltage: data.voltage ?? null,
//               csu1Temperature: data.temperature ?? null,
//               csu1Balance: data.balance ?? false,
//               csu1OpenWire: data.openWire ?? false,
//               csu2Voltage: null,
//               csu2Temperature: null,
//               csu2Balance: false,
//               csu2OpenWire: false,
//               dcCsuVoltage: null,
//               dcCsuTemperature: null,
//               dcCsuBalance: false,
//               dcCsuOpenWire: false,
//               daisyChain: null,
//             });
//           }
//         });
//       }

//       // Process csu2 cells
//       if (cycleData.csu2) {
//         Object.entries(cycleData.csu2).forEach(([cellId, data]: [string, any]) => {
//           const id = parseInt(cellId.replace("cell_", ""));
//           const existingCell = processedCells.find(c => c.id === id && c.cycle === cycle);
//           if (existingCell) {
//             existingCell.csu2Voltage = data.voltage ?? null;
//             existingCell.csu2Temperature = data.temperature ?? null;
//             existingCell.csu2Balance = data.balance ?? false;
//             existingCell.csu2OpenWire = data.openWire ?? false;
//           } else {
//             processedCells.push({
//               id,
//               cycle,
//               voltage: null,
//               temperature: null,
//               setVoltage: null,
//               setTemperature: null,
//               balancing: false,
//               openWire: false,
//               delay: null,
//               cellLed: false,
//               automaticSequence: false,
//               voltageLimits: null,
//               csu1Voltage: null,
//               csu1Temperature: null,
//               csu1Balance: false,
//               csu1OpenWire: false,
//               csu2Voltage: data.voltage ?? null,
//               csu2Temperature: data.temperature ?? null,
//               csu2Balance: data.balance ?? false,
//               csu2OpenWire: data.openWire ?? false,
//               dcCsuVoltage: null,
//               dcCsuTemperature: null,
//               dcCsuBalance: false,
//               dcCsuOpenWire: false,
//               daisyChain: null,
//             });
//           }
//         });
//       }

//       // Process daisyChain
//       if (cycleData.daisyChain) {
//         Object.entries(cycleData.daisyChain).forEach(([cellId, data]: [string, any]) => {
//           const id = parseInt(cellId.replace("cell_", ""));
//           const existingCell = processedCells.find(c => c.id === id && c.cycle === cycle);
//           if (existingCell) {
//             existingCell.daisyChain = data.value ?? null;
//           } else {
//             processedCells.push({
//               id,
//               cycle,
//               voltage: null,
//               temperature: null,
//               setVoltage: null,
//               setTemperature: null,
//               balancing: false,
//               openWire: false,
//               delay: null,
//               cellLed: false,
//               automaticSequence: false,
//               voltageLimits: null,
//               csu1Voltage: null,
//               csu1Temperature: null,
//               csu1Balance: false,
//               csu1OpenWire: false,
//               csu2Voltage: null,
//               csu2Temperature: null,
//               csu2Balance: false,
//               csu2OpenWire: false,
//               dcCsuVoltage: null,
//               dcCsuTemperature: null,
//               dcCsuBalance: false,
//               dcCsuOpenWire: false,
//               daisyChain: data.value ?? null,
//             });
//           }
//         });
//       }
//     });

//     // Fill in missing cells for each cycle
//     const cycles = uploadedData ? Object.keys(uploadedData) : [];
//     const maxCells = 24;
//     const allCells: CellDataPoint[] = [];

//     cycles.forEach(cycle => {
//       for (let id = 0; id < maxCells; id++) {
//         const existingCell = processedCells.find(c => c.id === id && c.cycle === cycle);
//         if (!existingCell) {
//           allCells.push({
//             id,
//             cycle,
//             voltage: null,
//             temperature: null,
//             setVoltage: null,
//             setTemperature: null,
//             balancing: false,
//             openWire: false,
//             delay: null,
//             cellLed: false,
//             automaticSequence: false,
//             voltageLimits: null,
//             csu1Voltage: null,
//             csu1Temperature: null,
//             csu1Balance: false,
//             csu1OpenWire: false,
//             csu2Voltage: null,
//             csu2Temperature: null,
//             csu2Balance: false,
//             csu2OpenWire: false,
//             dcCsuVoltage: null,
//             dcCsuTemperature: null,
//             dcCsuBalance: false,
//             dcCsuOpenWire: false,
//             daisyChain: null,
//           });
//         } else {
//           allCells.push(existingCell);
//         }
//       }
//     });

//     return allCells.map(cell => ({
//       ...cell,
//       status: calculateStatus(cell),
//     }));
//   }, [uploadedData]);

//   // Identify issues
//   const issues = useMemo(() => {
//     const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

//     cells.forEach((cell) => {
//       if (cell.status !== "N/A") {
//         const details = [
//           `Cycle: ${cell.cycle}`,
//           `Voltage: ${cell.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}`,
//           `Temperature: ${cell.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`,
//           `CSU1 Voltage: ${cell.csu1Voltage !== null ? cell.csu1Voltage.toFixed(2) + " V" : "N/A"}`,
//           `CSU1 Temperature: ${cell.csu1Temperature !== null ? cell.csu1Temperature.toFixed(2) + " °C" : "N/A"}`,
//           `CSU1 Balance: ${cell.csu1Balance ? "On" : "Off"}`,
//           `CSU1 Open Wire: ${cell.csu1OpenWire ? "On" : "Off"}`,
//           `CSU2 Voltage: ${cell.csu2Voltage !== null ? cell.csu2Voltage.toFixed(2) + " V" : "N/A"}`,
//           `CSU2 Temperature: ${cell.csu2Temperature !== null ? cell.csu2Temperature.toFixed(2) + " °C" : "N/A"}`,
//           `CSU2 Balance: ${cell.csu2Balance ? "On" : "Off"}`,
//           `CSU2 Open Wire: ${cell.csu2OpenWire ? "On" : "Off"}`,
//           `DC CSU Voltage: ${cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) + " V" : "N/A"}`,
//           `DC CSU Temperature: ${cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) + " °C" : "N/A"}`,
//           `DC CSU Balance: ${cell.dcCsuBalance ? "On" : "Off"}`,
//           `DC CSU Open Wire: ${cell.dcCsuOpenWire ? "On" : "Off"}`,
//           `Daisy Chain: ${cell.daisyChain !== null ? cell.daisyChain : "N/A"}`,
//         ].join(", ");
//         issuesList.push({
//           type: cell.id < 12 ? "CSU1" : "CSU2",
//           cellId: cell.id,
//           cycle: cell.cycle,
//           status: cell.status,
//           details,
//         });
//       }
//     });

//     if (uploadedData) {
//       Object.entries(uploadedData).forEach(([cycle, cycleData]: [string, any]) => {
//         if (cycleData.daisyChain) {
//           Object.entries(cycleData.daisyChain).forEach(([cellNo, dataItems]) => {
//             const cellId = parseInt(cellNo.replace("cell_", ""));
//             if (dataItems?.value === "On") {
//               const cell = cells.find((c) => c.id === cellId && c.cycle === cycle);
//               const details = `Cycle: ${cycle}, Daisy Chain: On, Voltage: ${cell?.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}, Temperature: ${cell?.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`;
//               issuesList.push({
//                 type: "Daisy Chain",
//                 cellId,
//                 cycle,
//                 status: cell?.status || "warning",
//                 details,
//               });
//             }
//           });
//         }
//       });
//     }

//     return issuesList;
//   }, [cells, uploadedData]);

//   // Voltage comparison
//   const voltageComparisons = useMemo(() => {
//     const comparisons: {
//       cellId: number;
//       cycle: string;
//       setVoltage: number | null;
//       actualVoltage: number | null;
//       variance: number | null;
//       status: "Match" | "Mismatch" | "No Data";
//     }[] = [];

//     cells.forEach((cell) => {
//       const setVoltage = cell.setVoltage;
//       const actualVoltage = cell.voltage || cell.csu1Voltage || cell.csu2Voltage || cell.dcCsuVoltage;
//       if (setVoltage !== null && actualVoltage !== null) {
//         const variance = Math.abs(setVoltage - actualVoltage);
//         comparisons.push({
//           cellId: cell.id,
//           cycle: cell.cycle,
//           setVoltage,
//           actualVoltage,
//           variance,
//           status: variance <= 0.1 ? "Match" : "Mismatch",
//         });
//       } else if (setVoltage !== null || actualVoltage !== null) {
//         comparisons.push({
//           cellId: cell.id,
//           cycle: cell.cycle,
//           setVoltage,
//           actualVoltage,
//           variance: null,
//           status: "No Data",
//         });
//       }
//     });

//     return comparisons;
//   }, [cells]);

//   // Combined statuses
//   const allStatuses = useMemo(() => {
//     return [
//       ...csu1Statuses.map((s) => ({ ...s, type: "CSU1" })),
//       ...csu2Statuses.map((s) => ({ ...s, type: "CSU2" })),
//       ...daisyStatuses.map((s) => ({ ...s, type: "Daisy Chain" })),
//     ];
//   }, [csu1Statuses, csu2Statuses, daisyStatuses]);

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

//   // Parse value function for voltage and temperature
//   const parseValue = (details: string | undefined, type: "voltage" | "temperature"): { actual: number | null; expected: number | null } => {
//     if (!details || details === "No data") {
//       console.log(`Report: No details available for parsing ${type} or 'No data'`);
//       return { actual: null, expected: null };
//     }

//     let actual: number | null = null;
//     let expected: number | null = null;

//     if (type === "voltage") {
//       const actualMatch = details.match(/Voltage:\s*(\d+\.\d+)/);
//       if (actualMatch) {
//         console.log(`Report: Parsed actual voltage from "${details}": ${actualMatch[1]}`);
//         actual = parseFloat(actualMatch[1]);
//       }
//       const expectedMatch = details.match(/\(Expected:\s*(\d+\.\d+)\s*V\)/);
//       if (expectedMatch) {
//         console.log(`Report: Parsed expected voltage from "${details}": ${expectedMatch[1]}`);
//         expected = parseFloat(expectedMatch[1]);
//       }
//     } else if (type === "temperature") {
//       const tempMatch = details.match(/Temperature:\s*(\d+\.\d+)\s*°C/);
//       if (tempMatch) {
//         console.log(`Report: Parsed temperature from "${details}": ${tempMatch[1]}`);
//         actual = parseFloat(tempMatch[1]);
//       }
//     }

//     if (actual === null && expected === null) {
//       console.log(`Report: No match for ${type} in "${details}"`);
//     }
//     return { actual, expected };
//   };

//   // Define voltageData using useMemo
//   const voltageData = useMemo(() => {
//     console.log("Report: Generating voltageData from cells:", cells);
//     return cells
//       .filter(cell => cell.cycle === "cycle_1")
//       .map(cell => ({
//         label: `Cell ${cell.id} (${cell.cycle})`,
//         actualVoltage: cell.voltage !== null ? parseFloat(cell.voltage.toFixed(2)) :
//                       cell.csu1Voltage !== null ? parseFloat(cell.csu1Voltage.toFixed(2)) :
//                       cell.csu2Voltage !== null ? parseFloat(cell.csu2Voltage.toFixed(2)) :
//                       cell.dcCsuVoltage !== null ? parseFloat(cell.dcCsuVoltage.toFixed(2)) : null,
//         setVoltage: cell.setVoltage !== null ? parseFloat(cell.setVoltage.toFixed(2)) : null,
//         status: cell.status,
//       }));
//   }, [cells]);

//   // Define temperatureData using useMemo
//   const temperatureData = useMemo(() => {
//     return cells
//       .filter(cell => cell.cycle === "cycle_1")
//       .map(cell => ({
//         label: `Cell ${cell.id} (${cell.cycle})`,
//         temperature: cell.temperature !== null ? parseFloat(cell.temperature.toFixed(2)) :
//                     cell.csu1Temperature !== null ? parseFloat(cell.csu1Temperature.toFixed(2)) :
//                     cell.csu2Temperature !== null ? parseFloat(cell.csu2Temperature.toFixed(2)) :
//                     cell.dcCsuTemperature !== null ? parseFloat(cell.dcCsuTemperature.toFixed(2)) : null,
//       }));
//   }, [cells]);

//   // Initialize and update charts
//   useEffect(() => {
//     console.log("Report: Updating charts with voltageData:", voltageData);
//     console.log("Report: Updating charts with temperatureData:", temperatureData);

//     const labels = voltageData.map((d) => d.label);

//     const initializeCharts = () => {
//       // Voltage chart
//       if (voltageChartRef.current) {
//         const ctx = voltageChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: "Actual Voltage (V)",
//               data: voltageData.map((d) => d.actualVoltage || null),
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
//               data: voltageData.map((d) => d.setVoltage || null),
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
//             voltageChartInstance.current.data.labels = labels;
//             voltageChartInstance.current.data.datasets = datasets;
//             voltageChartInstance.current.update();
//           } else {
//             console.log("Report: Creating new voltage chart");
//             voltageChartInstance.current = new Chart(ctx, {
//               type: "bar",
//               data: {
//                 labels,
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
//                     title: { display: true, text: "Cell ID (Cycle)" },
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

//       // Temperature chart
//       if (tempChartRef.current) {
//         const ctx = tempChartRef.current.getContext("2d");
//         if (ctx) {
//           const datasets = [
//             {
//               label: "Temperature (°C)",
//               data: temperatureData.map((d) => d.temperature || null),
//               borderColor: "rgba(75, 192, 192, 1)",
//               backgroundColor: "rgba(75, 192, 192, 0.2)",
//               fill: false,
//               skipNull: true,
//             },
//           ];
//           console.log("Report: Temperature chart datasets:", datasets);

//           if (tempChartInstance.current) {
//             console.log("Report: Updating existing temperature chart");
//             tempChartInstance.current.data.labels = labels;
//             tempChartInstance.current.data.datasets = datasets;
//             tempChartInstance.current.update();
//           } else {
//             console.log("Report: Creating new temperature chart");
//             tempChartInstance.current = new Chart(ctx, {
//               type: "line",
//               data: {
//                 labels,
//                 datasets,
//               },
//               options: {
//                 responsive: true,
//                 scales: {
//                   y: {
//                     beginAtZero: true,
//                     title: { display: true, text: "Temperature (°C)" },
//                   },
//                   x: {
//                     title: { display: true, text: "Cell Label (Cycle)" },
//                   },
//                 },
//               },
//             });
//           }
//         } else {
//           console.error("Report: Failed to get 2d context for temperature chart");
//         }
//       } else {
//         console.warn("Report: tempChartRef.current is null, skipping temperature chart initialization");
//       }

//       // Issue chart
//       if (issueChartRef.current) {
//         const ctx = issueChartRef.current.getContext("2d");
//         if (ctx) {
//           const issueCounts = cells.reduce(
//             (acc, cell) => {
//               if (cell.status === "critical") acc.critical += 1;
//               else if (cell.status === "warning") acc.warning += 1;
//               else if (cell.status === "normal") acc.normal += 1;
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
//           console.log("Report: Issue chart datasets:", datasets);

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
//           if (
//             voltageChartRef.current &&
//             tempChartRef.current &&
//             issueChartRef.current
//           ) {
//             initializeCharts();
//           } else {
//             console.warn("Report: Some canvas refs are still null, delaying initialization");
//           }
//         });
//       });
//     };

//     if (uploadedData) {
//       scheduleCharts();
//     }

//     return () => {
//       cancelAnimationFrame(rafId);
//       if (voltageChartInstance.current) {
//         voltageChartInstance.current.destroy();
//         voltageChartInstance.current = null;
//       }
//       if (tempChartInstance.current) {
//         tempChartInstance.current.destroy();
//         tempChartInstance.current = null;
//       }
//       if (issueChartInstance.current) {
//         issueChartInstance.current.destroy();
//         issueChartInstance.current = null;
//       }
//     };
//   }, [voltageData, temperatureData, uploadedData]);

//   // Generate PDF report
//   const generatePDF = () => {
//     if (!uploadedData) {
//       alert("Please upload a JSON file first.");
//       return;
//     }

//     console.log("Report: Generating PDF with refs:", {
//       voltageChartRef: voltageChartRef.current,
//       tempChartRef: tempChartRef.current,
//       issueChartRef: issueChartRef.current,
//     });

//     const doc = new jsPDF();
//     const pageWidth = doc.internal.pageSize.getWidth();
//     const chartWidth = 140;
//     const xOffset = (pageWidth - chartWidth) / 2;

//     doc.setFontSize(16);
//     doc.text("Battery Management System Report", 20, 20);

//     let finalY = 20;

//     // AI Analysis
//     if (aiAnalysis.summary || aiAnalysis.recommendations.length > 0) {
//       doc.setFontSize(12);
//       doc.text("AI Analysis", 20, finalY + 10);
//       finalY += 15;
//       if (aiAnalysis.summary) {
//         doc.setFontSize(10);
//         doc.text("Summary:", 20, finalY);
//         doc.text(aiAnalysis.summary, 20, finalY + 5, { maxWidth: 170 });
//         finalY += doc.getTextDimensions(aiAnalysis.summary, { maxWidth: 170 }).h + 10;
//       }
//       if (aiAnalysis.recommendations.length > 0) {
//         doc.setFontSize(10);
//         doc.text("Recommendations:", 20, finalY);
//         autoTable(doc, {
//           startY: finalY + 5,
//           head: [["Recommendation"]],
//           body: aiAnalysis.recommendations.map((rec) => [rec]),
//           styles: { fontSize: 8 },
//           headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//           alternateRowStyles: { fillColor: [240, 240, 240] },
//         });
//         finalY = (doc as any).lastAutoTable.finalY;
//       }
//     }

//     // Cell Data Table
//     if (cells.some((cell) => cell.status !== "N/A")) {
//       doc.setFontSize(12);
//       doc.text("Cell Status", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [
//           [
//             "Cycle",
//             "Cell ID",
//             "CSU",
//             "Voltage (V)",
//             "Temperature (°C)",
//             "CSU1 Voltage (V)",
//             "CSU1 Temp (°C)",
//             "CSU1 Balance",
//             "CSU1 Open Wire",
//             "CSU2 Voltage (V)",
//             "CSU2 Temp (°C)",
//             "CSU2 Balance",
//             "CSU2 Open Wire",
//             "DC CSU Voltage (V)",
//             "DC CSU Temp (°C)",
//             "DC CSU Balance",
//             "DC CSU Open Wire",
//             "Daisy Chain",
//             "Status",
//           ],
//         ],
//         body: cells.map((cell) => [
//           cell.cycle,
//           cell.id,
//           cell.id < 12 ? "CSU1" : "CSU2",
//           cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A",
//           cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A",
//           cell.csu1Voltage !== null ? cell.csu1Voltage.toFixed(2) : "N/A",
//           cell.csu1Temperature !== null ? cell.csu1Temperature.toFixed(2) : "N/A",
//           cell.csu1Balance ? "On" : "Off",
//           cell.csu1OpenWire ? "On" : "Off",
//           cell.csu2Voltage !== null ? cell.csu2Voltage.toFixed(2) : "N/A",
//           cell.csu2Temperature !== null ? cell.csu2Temperature.toFixed(2) : "N/A",
//           cell.csu2Balance ? "On" : "Off",
//           cell.csu2OpenWire ? "On" : "Off",
//           cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) : "N/A",
//           cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) : "N/A",
//           cell.dcCsuBalance ? "On" : "Off",
//           cell.dcCsuOpenWire ? "On" : "Off",
//           cell.daisyChain !== null ? cell.daisyChain : "N/A",
//           cell.status,
//         ]),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Issues Table
//     if (issues.length > 0) {
//       doc.setFontSize(12);
//       doc.text("Issues Detected", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [["Cycle", "Type", "Cell ID", "Status", "Details"]],
//         body: issues.map((issue) => [
//           issue.cycle,
//           issue.type,
//           issue.cellId,
//           issue.status,
//           issue.details,
//         ]),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Voltage Comparison Table
//     if (voltageComparisons.length > 0) {
//       doc.setFontSize(12);
//       doc.text("Voltage Comparison", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [["Cycle", "Cell ID", "Set Voltage (V)", "Actual Voltage (V)", "Variance (V)", "Status"]],
//         body: voltageComparisons.map((comp) => [
//           comp.cycle,
//           `${comp.cellId} (CSU ${comp.cellId < 12 ? 1 : 2})`,
//           comp.setVoltage !== null ? comp.setVoltage.toFixed(2) : "N/A",
//           comp.actualVoltage !== null ? comp.actualVoltage.toFixed(2) : "N/A",
//           comp.variance !== null ? comp.variance.toFixed(2) : "N/A",
//           comp.status,
//         ]),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Status Summary
//     if (allStatuses.length > 0) {
//       doc.setFontSize(12);
//       doc.text("Status Summary", 20, finalY + 10);
//       autoTable(doc, {
//         startY: finalY + 15,
//         head: [["Type", "Label", "Status", "Details"]],
//         body: allStatuses.map((status) => {
//           const parsedVoltages = parseValue(status.details, "voltage");
//           const detailsText =
//             status.type === "CSU1" || status.type === "CSU2"
//               ? `Actual Voltage: ${parsedVoltages.actual !== null ? parsedVoltages.actual.toFixed(2) + " V" : "N/A"}, Expected Voltage: ${parsedVoltages.expected !== null ? parsedVoltages.expected.toFixed(2) + " V" : "N/A"}, ${status.details || "N/A"}`
//               : status.details || "N/A";
//           console.log(`Report: Status Summary for ${status.type} ${status.label}: ${detailsText}`);
//           return [status.type, status.label, status.status, detailsText];
//         }),
//         styles: { fontSize: 8 },
//         headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//         alternateRowStyles: { fillColor: [240, 240, 240] },
//       });
//       finalY = (doc as any).lastAutoTable.finalY;
//     }

//     // Instructions Tables
//     const instructionSets = [
//       { title: "General Instructions", data: instructions },
//       { title: "CSU1 Instructions", data: csu1Instructions },
//       { title: "CSU2 Instructions", data: csu2Instructions },
//       { title: "DC CSU Instructions", data: dcCsuInstructions },
//     ];

//     instructionSets.forEach(({ title, data }) => {
//       if (data.length > 0) {
//         doc.setFontSize(12);
//         doc.text(title, 20, finalY + 10);
//         autoTable(doc, {
//           startY: finalY + 15,
//           head: [["ID", "Instruction"]],
//           body: data.map((instruction) => [
//             instruction.id,
//             formatInstruction(instruction),
//           ]),
//           styles: { fontSize: 8 },
//           headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
//           alternateRowStyles: { fillColor: [240, 240, 240] },
//         });
//         finalY = (doc as any).lastAutoTable.finalY;
//       }
//     });

//     // Add charts to PDF
//     if (voltageChartRef.current && voltageChartInstance.current) {
//       try {
//         doc.setFontSize(12);
//         doc.text("Voltage Trends", xOffset, finalY + 10);
//         const imgData = voltageChartRef.current.toDataURL("image/png");
//         doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
//         finalY += 60;
//       } catch (e) {
//         console.error("Report: Error adding voltage chart to PDF:", e);
//       }
//     }

//     if (tempChartRef.current && tempChartInstance.current) {
//       try {
//         doc.setFontSize(12);
//         doc.text("Temperature Trends", xOffset, finalY + 10);
//         const imgData = tempChartRef.current.toDataURL("image/png");
//         doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
//         finalY += 60;
//       } catch (e) {
//         console.error("Report: Error adding temperature chart to PDF:", e);
//       }
//     }

//     if (issueChartRef.current && issueChartInstance.current) {
//       try {
//         doc.setFontSize(12);
//         doc.text("Issue Distribution", xOffset, finalY + 10);
//         const imgData = issueChartRef.current.toDataURL("image/png");
//         doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
//         finalY += 60;
//       } catch (e) {
//         console.error("Report: Error adding issue chart to PDF:", e);
//       }
//     }

//     doc.save(`BMS_Report_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
//   };

//   // Check chart visibility
//   const hasVoltageData = useMemo(() => {
//     return voltageData.some((d) => d.actualVoltage !== null || d.setVoltage !== null);
//   }, [voltageData]);
//   const hasTemperatureData = useMemo(() => {
//     return temperatureData.some((d) => d.temperature !== null);
//   }, [temperatureData]);
//   const hasIssueData = cells.some((cell) => cell.status !== "N/A");
//   console.log("Report: hasVoltageData:", hasVoltageData);
//   console.log("Report: hasTemperatureData:", hasTemperatureData);
//   console.log("Report: hasIssueData:", hasIssueData);

//   return (
//     <div className="flex-1 bg-gray-100 h-screen overflow-auto">
//       <CustomTitleBar />
//       <div className="max-w-7xl p-2 mx-auto space-y-6 mt-10 shadow-lg">
//         <div className="flex justify-between items-center">
//           <h1 className="text-3xl font-bold text-gray-900 font-inter">
//             📊 BMS Test Run Summary
//           </h1>
//           <div className="flex gap-2">
//             <input
//               type="file"
//               accept=".json"
//               ref={fileInputRef}
//               onChange={handleFileUpload}
//               className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//             />
//             <button
//               onClick={generatePDF}
//               className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
//               disabled={!uploadedData}
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

//         {uploadedData && (
//           <div className="space-y-6">
//             {/* AI Analysis */}
//             {aiAnalysis.summary || aiAnalysis.recommendations.length > 0 ? (
//               <div>
//                 <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4 flex items-center gap-2">
//                   🤖 AI Analysis
//                 </h2>
//                 {aiAnalysis.isLoading ? (
//                   <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                     Loading AI analysis...
//                   </div>
//                 ) : aiAnalysis.error ? (
//                   <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-4 text-center">
//                     Error in AI analysis: {aiAnalysis.error}
//                   </div>
//                 ) : (
//                   <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//                     {aiAnalysis.summary && (
//                       <div className="mb-4">
//                         <h3 className="text-lg font-semibold text-gray-700">Summary</h3>
//                         <p className="text-sm text-gray-800">{aiAnalysis.summary}</p>
//                       </div>
//                     )}
//                     {aiAnalysis.recommendations.length > 0 && (
//                       <div>
//                         <h3 className="text-lg font-semibold text-gray-700">Recommendations</h3>
//                         <ul className="list-disc list-inside text-sm text-gray-800">
//                           {aiAnalysis.recommendations.map((rec, index) => (
//                             <li key={`rec-${index}`}>{rec}</li>
//                           ))}
//                         </ul>
//                       </div>
//                     )}
//                   </div>
//                 )}
//               </div>
//             ) : null}

//             {/* Voltage Trends Chart */}
//             <div>
//               <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4">📈 Voltage Trends</h2>
//               <div style={{ display: hasVoltageData ? "block" : "none" }}>
//                 <canvas ref={voltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasVoltageData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No voltage data available for chart.
//                 </div>
//               )}
//             </div>

//             {/* Temperature Trends Chart */}
//             <div>
//               <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4">🌡️ Temperature Trends</h2>
//               <div style={{ display: hasTemperatureData ? "block" : "none" }}>
//                 <canvas ref={tempChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasTemperatureData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No temperature data available for chart.
//                 </div>
//               )}
//             </div>

//             {/* Issue Distribution Chart */}
//             <div>
//               <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4">⚠️ Issue Distribution</h2>
//               <div style={{ display: hasIssueData ? "block" : "none" }}>
//                 <canvas ref={issueChartRef} className="w-3/4 h-40 mx-auto"></canvas>
//               </div>
//               {!hasIssueData && (
//                 <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
//                   No issue data available for chart.
//                 </div>
//               )}
//             </div>

//             {/* Cell Status */}
//             {cells.some((cell) => cell.status !== "N/A") && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   🔋 Cell Status
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {cells.filter((cell) => cell.status !== "N/A").length}
//                   </span>
//                 </h2>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cycle</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Temperature (°C)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU1 Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU1 Temp (°C)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU1 Balance</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU1 Open Wire</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU2 Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU2 Temp (°C)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU2 Balance</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU2 Open Wire</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Voltage (V)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Temp (°C)</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Balance</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Open Wire</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Daisy Chain</th>
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
//                       </tr>
//                     </thead>
//                     <tbody>
//                       {cells.map((cell) => (
//                         <tr key={`cell-${cell.cycle}-${cell.id}`} className="border-t border-gray-200">
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.cycle}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.id < 12 ? "CSU1" : "CSU2"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu1Voltage !== null ? cell.csu1Voltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu1Temperature !== null ? cell.csu1Temperature.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu1Balance ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu1OpenWire ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu2Voltage !== null ? cell.csu2Voltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu2Temperature !== null ? cell.csu2Temperature.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu2Balance ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.csu2OpenWire ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) : "N/A"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuBalance ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuOpenWire ? "On" : "Off"}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{cell.daisyChain !== null ? cell.daisyChain : "N/A"}</td>
//                           <td
//                             className={`px-4 py-2 text-sm ${
//                               cell.status === "critical"
//                                 ? "text-red-600"
//                                 : cell.status === "warning"
//                                 ? "text-yellow-600"
//                                 : cell.status === "N/A"
//                                 ? "text-gray-600"
//                                 : "text-green-600"
//                             }`}
//                           >
//                             {cell.status}
//                           </td>
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                 </div>
//               </div>
//             )}

//             {/* Issues Detected */}
//             {issues.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   ⚠️ Issues Detected
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
//                         {item.type} Cell {item.cellId} (Cycle {item.cycle})
//                       </strong>
//                       <br />
//                       {item.details}
//                     </li>
//                   ))}
//                 </ul>
//               </div>
//             )}

//             {/* Voltage Comparison */}
//             {voltageComparisons.length > 0 && (
//               <div>
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   ⚡ Voltage Comparison
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {voltageComparisons.length}
//                   </span>
//                 </h2>
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
//                     <thead>
//                       <tr className="bg-gray-100">
//                         <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cycle</th>
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
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.cycle}</td>
//                           <td className="px-4 py-2 text-sm text-gray-800">{comp.cellId} (CSU {comp.cellId < 12 ? 1 : 2})</td>
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
//             )}

//             {/* Status Summary */}
//             {allStatuses.length > 0 && (
//               <div className="">
//                 <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   📋 Status Summary
//                   <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
//                     {allStatuses.length}
//                   </span>
//                 </h2>
//                 <div className="overflow-x-auto overflow-y-auto h-100">
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
//                       {allStatuses.map((status, index) => {
//                         const parsedVoltages = parseValue(status.details, "voltage");
//                         const detailsText =
//                           status.type === "CSU1" || status.type === "CSU2"
//                             ? `Actual Voltage: ${parsedVoltages.actual !== null ? parsedVoltages.actual.toFixed(2) + " V" : "N/A"}, Expected Voltage: ${parsedVoltages.expected !== null ? parsedVoltages.expected.toFixed(2) + " V" : "N/A"}, ${status.details || "N/A"}`
//                             : status.details || "N/A";
//                         console.log(`Report: Status Summary for ${status.type} ${status.label}: ${detailsText}`);
//                         return (
//                           <tr key={`status-${index}`} className="border-t border-gray-200">
//                             <td className="px-4 py-2 text-sm text-gray-800">{status.type}</td>
//                             <td className="px-4 py-2 text-sm text-gray-800">{status.label}</td>
//                             <td
//                               className={`px-4 py-2 text-sm ${
//                                 status.status === "critical"
//                                   ? "text-red-600"
//                                   : status.status === "warning"
//                                   ? "text-yellow-600"
//                                   : status.status === "N/A"
//                                   ? "text-gray-600"
//                                   : "text-green-600"
//                               }`}
//                             >
//                               {status.status}
//                             </td>
//                             <td className="px-4 py-2 text-sm text-gray-800">{detailsText}</td>
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
//                   <ul className="space-y-3 overflow-y-auto h-100">
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

interface IndividualCell {
  id: number;
  cycle: string;
  receivedVoltage: number | null;
  expectedVoltage: number | null;
  status: CellStatus;
}

interface CsuCell {
  id: number;
  cycle: string;
  voltage: number | null;
  temperature: number | null;
  balance: boolean;
  openWire: boolean;
  status: CellStatus;
}

interface DaisyChainCell {
  id: number;
  cycle: string;
  value: string | null;
  status: CellStatus;
}

const Report: React.FC = () => {
  const {
    instructions,
    aiAnalysis,
    dcCsuInstructions,
    csu1Instructions,
    csu2Instructions,
    csu1Statuses,
    csu2Statuses,
    daisyStatuses,
  } = useBatteryContext();

  const [uploadedData, setUploadedData] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const voltageChartRef = useRef<HTMLCanvasElement | null>(null);
  const tempChartRef = useRef<HTMLCanvasElement | null>(null);
  const issueChartRef = useRef<HTMLCanvasElement | null>(null);
  const voltageChartInstance = useRef<Chart | null>(null);
  const tempChartInstance = useRef<Chart | null>(null);
  const issueChartInstance = useRef<Chart | null>(null);

  // Extract cycle numbers
  const cycleNumbers = useMemo(() => {
    if (!uploadedData) return [];
    return Object.keys(uploadedData).sort();
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
            setSelectedCycle(Object.keys(jsonData)[0]); // Set default to first cycle
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

  // Calculate cell status
  const calculateStatus = (
    cell: {
      voltage?: number | null;
      temperature?: number | null;
      balance?: boolean;
      openWire?: boolean;
      value?: string | null;
    }
  ): CellStatus => {
    if (
      (!cell.voltage && !cell.temperature && cell.balance === undefined && cell.openWire === undefined && !cell.value) ||
      (cell.voltage === null && cell.temperature === null && !cell.balance && !cell.openWire && cell.value === null)
    ) {
      return "N/A";
    }

    let status: CellStatus = "normal";

    if (cell.voltage !== undefined && cell.voltage !== null) {
      if (cell.voltage > 4.2) {
        status = "critical";
      } else if (cell.voltage < 3.0 && status !== "critical") {
        status = "warning";
      }
    }

    if (cell.temperature !== undefined && cell.temperature !== null) {
      if (cell.temperature > 60) {
        status = "critical";
      } else if (cell.temperature > 45 && status !== "critical") {
        status = "warning";
      }
    }

    if (cell.openWire) {
      status = "critical";
    } else if (cell.balance && status !== "critical") {
      status = "warning";
    }

    if (cell.value === "On") {
      status = status === "critical" ? status : "warning";
    }

    return status;
  };

  // Process individual cells
  const individualCells = useMemo(() => {
    if (!uploadedData || !selectedCycle) return [];

    const cells: IndividualCell[] = [];
    const cycleData = uploadedData[selectedCycle]?.individual || {};

    Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
      const id = parseInt(cellId.replace("cell_", ""));
      cells.push({
        id,
        cycle: selectedCycle,
        receivedVoltage: data.receivedVoltage ?? null,
        expectedVoltage: data.expectedVoltage ?? null,
        status: calculateStatus({
          voltage: data.receivedVoltage ?? null,
        }),
      });
    });

    // Fill in missing cells
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      if (!cells.find(c => c.id === id)) {
        cells.push({
          id,
          cycle: selectedCycle,
          receivedVoltage: null,
          expectedVoltage: null,
          status: "N/A",
        });
      }
    }

    return cells.sort((a, b) => a.id - b.id);
  }, [uploadedData, selectedCycle]);

  // Process csu1 cells
  const csu1Cells = useMemo(() => {
    if (!uploadedData || !selectedCycle) return [];

    const cells: CsuCell[] = [];
    const cycleData = uploadedData[selectedCycle]?.csu1 || {};

    Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
      const id = parseInt(cellId.replace("cell_", ""));
      cells.push({
        id,
        cycle: selectedCycle,
        voltage: data.voltage ?? null,
        temperature: data.temperature ?? null,
        balance: data.balance ?? false,
        openWire: data.openWire ?? false,
        status: calculateStatus({
          voltage: data.voltage ?? null,
          temperature: data.temperature ?? null,
          balance: data.balance ?? false,
          openWire: data.openWire ?? false,
        }),
      });
    });

    // Fill in missing cells
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      if (!cells.find(c => c.id === id)) {
        cells.push({
          id,
          cycle: selectedCycle,
          voltage: null,
          temperature: null,
          balance: false,
          openWire: false,
          status: "N/A",
        });
      }
    }

    return cells.sort((a, b) => a.id - b.id);
  }, [uploadedData, selectedCycle]);

  // Process csu2 cells
  const csu2Cells = useMemo(() => {
    if (!uploadedData || !selectedCycle) return [];

    const cells: CsuCell[] = [];
    const cycleData = uploadedData[selectedCycle]?.csu2 || {};

    Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
      const id = parseInt(cellId.replace("cell_", ""));
      cells.push({
        id,
        cycle: selectedCycle,
        voltage: data.voltage ?? null,
        temperature: data.temperature ?? null,
        balance: data.balance ?? false,
        openWire: data.openWire ?? false,
        status: calculateStatus({
          voltage: data.voltage ?? null,
          temperature: data.temperature ?? null,
          balance: data.balance ?? false,
          openWire: data.openWire ?? false,
        }),
      });
    });

    // Fill in missing cells
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      if (!cells.find(c => c.id === id)) {
        cells.push({
          id,
          cycle: selectedCycle,
          voltage: null,
          temperature: null,
          balance: false,
          openWire: false,
          status: "N/A",
        });
      }
    }

    return cells.sort((a, b) => a.id - b.id);
  }, [uploadedData, selectedCycle]);

  // Process daisyChain cells
  const daisyChainCells = useMemo(() => {
    if (!uploadedData || !selectedCycle) return [];

    const cells: DaisyChainCell[] = [];
    const cycleData = uploadedData[selectedCycle]?.daisyChain || {};

    Object.entries(cycleData).forEach(([cellId, data]: [string, any]) => {
      const id = parseInt(cellId.replace("cell_", ""));
      cells.push({
        id,
        cycle: selectedCycle,
        value: data.value ?? null,
        status: calculateStatus({
          value: data.value ?? null,
        }),
      });
    });

    // Fill in missing cells
    const maxCells = 24;
    for (let id = 0; id < maxCells; id++) {
      if (!cells.find(c => c.id === id)) {
        cells.push({
          id,
          cycle: selectedCycle,
          value: null,
          status: "N/A",
        });
      }
    }

    return cells.sort((a, b) => a.id - b.id);
  }, [uploadedData, selectedCycle]);

  // Identify issues
  const issues = useMemo(() => {
    const issuesList: { type: string; cellId: number; cycle: string; status: CellStatus; details: string }[] = [];

    // Individual issues
    individualCells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `Received Voltage: ${cell.receivedVoltage !== null ? cell.receivedVoltage.toFixed(2) + " V" : "N/A"}`,
          `Expected Voltage: ${cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) + " V" : "N/A"}`,
        ].join(", ");
        issuesList.push({
          type: "Individual",
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    // CSU1 issues
    csu1Cells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `Voltage: ${cell.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}`,
          `Temperature: ${cell.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`,
          `Balance: ${cell.balance ? "On" : "Off"}`,
          `Open Wire: ${cell.openWire ? "On" : "Off"}`,
        ].join(", ");
        issuesList.push({
          type: "CSU1",
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    // CSU2 issues
    csu2Cells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `Voltage: ${cell.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}`,
          `Temperature: ${cell.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`,
          `Balance: ${cell.balance ? "On" : "Off"}`,
          `Open Wire: ${cell.openWire ? "On" : "Off"}`,
        ].join(", ");
        issuesList.push({
          type: "CSU2",
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    // DaisyChain issues
    daisyChainCells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = `Daisy Chain: ${cell.value !== null ? cell.value : "N/A"}`;
        issuesList.push({
          type: "Daisy Chain",
          cellId: cell.id,
          cycle: cell.cycle,
          status: cell.status,
          details,
        });
      }
    });

    return issuesList;
  }, [individualCells, csu1Cells, csu2Cells, daisyChainCells]);

  // Voltage comparison
  const voltageComparisons = useMemo(() => {
    const comparisons: {
      cellId: number;
      cycle: string;
      setVoltage: number | null;
      actualVoltage: number | null;
      variance: number | null;
      status: "Match" | "Mismatch" | "No Data";
    }[] = [];

    individualCells.forEach((cell) => {
      const setVoltage = cell.expectedVoltage;
      const actualVoltage = cell.receivedVoltage;
      if (setVoltage !== null && actualVoltage !== null) {
        const variance = Math.abs(setVoltage - actualVoltage);
        comparisons.push({
          cellId: cell.id,
          cycle: cell.cycle,
          setVoltage,
          actualVoltage,
          variance,
          status: variance <= 0.1 ? "Match" : "Mismatch",
        });
      } else if (setVoltage !== null || actualVoltage !== null) {
        comparisons.push({
          cellId: cell.id,
          cycle: cell.cycle,
          setVoltage,
          actualVoltage,
          variance: null,
          status: "No Data",
        });
      }
    });

    return comparisons;
  }, [individualCells]);

  // Combined statuses
  const allStatuses = useMemo(() => {
    return [
      ...csu1Statuses.map((s) => ({ ...s, type: "CSU1" })),
      ...csu2Statuses.map((s) => ({ ...s, type: "CSU2" })),
      ...daisyStatuses.map((s) => ({ ...s, type: "Daisy Chain" })),
    ];
  }, [csu1Statuses, csu2Statuses, daisyStatuses]);

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

  // Parse value function for voltage and temperature
  const parseValue = (details: string | undefined, type: "voltage" | "temperature"): { actual: number | null; expected: number | null } => {
    if (!details || details === "No data") {
      console.log(`Report: No details available for parsing ${type} or 'No data'`);
      return { actual: null, expected: null };
    }

    let actual: number | null = null;
    let expected: number | null = null;

    if (type === "voltage") {
      const actualMatch = details.match(/Voltage:\s*(\d+\.\d+)/);
      if (actualMatch) {
        console.log(`Report: Parsed actual voltage from "${details}": ${actualMatch[1]}`);
        actual = parseFloat(actualMatch[1]);
      }
      const expectedMatch = details.match(/\(Expected:\s*(\d+\.\d+)\s*V\)/);
      if (expectedMatch) {
        console.log(`Report: Parsed expected voltage from "${details}": ${expectedMatch[1]}`);
        expected = parseFloat(expectedMatch[1]);
      }
    } else if (type === "temperature") {
      const tempMatch = details.match(/Temperature:\s*(\d+\.\d+)\s*°C/);
      if (tempMatch) {
        console.log(`Report: Parsed temperature from "${details}": ${tempMatch[1]}`);
        actual = parseFloat(tempMatch[1]);
      }
    }

    if (actual === null && expected === null) {
      console.log(`Report: No match for ${type} in "${details}"`);
    }
    return { actual, expected };
  };

  // Define voltageData using useMemo
  const voltageData = useMemo(() => {
    console.log("Report: Generating voltageData from individualCells:", individualCells);
    return individualCells.map(cell => ({
      label: `Cell ${cell.id}`,
      actualVoltage: cell.receivedVoltage !== null ? parseFloat(cell.receivedVoltage.toFixed(2)) : null,
      setVoltage: cell.expectedVoltage !== null ? parseFloat(cell.expectedVoltage.toFixed(2)) : null,
      status: cell.status,
    }));
  }, [individualCells]);

  // Define temperatureData using useMemo
  const temperatureData = useMemo(() => {
    return csu1Cells.map((cell, index) => ({
      label: `Cell ${cell.id}`,
      temperature: cell.temperature !== null ? parseFloat(cell.temperature.toFixed(2)) :
                  csu2Cells[index]?.temperature !== null ? parseFloat(csu2Cells[index].temperature.toFixed(2)) : null,
    }));
  }, [csu1Cells, csu2Cells]);

  // Initialize and update charts
  useEffect(() => {
    console.log("Report: Updating charts with voltageData:", voltageData);
    console.log("Report: Updating charts with temperatureData:", temperatureData);

    const labels = voltageData.map((d) => d.label);

    const initializeCharts = () => {
      // Voltage chart
      if (voltageChartRef.current) {
        const ctx = voltageChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: "Actual Voltage (V)",
              data: voltageData.map((d) => d.actualVoltage || null),
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
              data: voltageData.map((d) => d.setVoltage || null),
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
            voltageChartInstance.current.data.labels = labels;
            voltageChartInstance.current.data.datasets = datasets;
            voltageChartInstance.current.update();
          } else {
            console.log("Report: Creating new voltage chart");
            voltageChartInstance.current = new Chart(ctx, {
              type: "bar",
              data: {
                labels,
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
                    title: { display: true, text: `Cell ID (Cycle: ${selectedCycle || 'N/A'})` },
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

      // Temperature chart
      if (tempChartRef.current) {
        const ctx = tempChartRef.current.getContext("2d");
        if (ctx) {
          const datasets = [
            {
              label: "Temperature (°C)",
              data: temperatureData.map((d) => d.temperature || null),
              borderColor: "rgba(75, 192, 192, 1)",
              backgroundColor: "rgba(75, 192, 192, 0.2)",
              fill: false,
              skipNull: true,
            },
          ];
          console.log("Report: Temperature chart datasets:", datasets);

          if (tempChartInstance.current) {
            console.log("Report: Updating existing temperature chart");
            tempChartInstance.current.data.labels = labels;
            tempChartInstance.current.data.datasets = datasets;
            tempChartInstance.current.update();
          } else {
            console.log("Report: Creating new temperature chart");
            tempChartInstance.current = new Chart(ctx, {
              type: "line",
              data: {
                labels,
                datasets,
              },
              options: {
                responsive: true,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: "Temperature (°C)" },
                  },
                  x: {
                    title: { display: true, text: `Cell Label (Cycle: ${selectedCycle || 'N/A'})` },
                  },
                },
              },
            });
          }
        } else {
          console.error("Report: Failed to get 2d context for temperature chart");
        }
      } else {
        console.warn("Report: tempChartRef.current is null, skipping temperature chart initialization");
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
          console.log("Report: Issue chart datasets:", datasets);

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
          if (
            voltageChartRef.current &&
            tempChartRef.current &&
            issueChartRef.current
          ) {
            initializeCharts();
          } else {
            console.warn("Report: Some canvas refs are still null, delaying initialization");
          }
        });
      });
    };

    if (uploadedData && selectedCycle) {
      scheduleCharts();
    }

    return () => {
      cancelAnimationFrame(rafId);
      if (voltageChartInstance.current) {
        voltageChartInstance.current.destroy();
        voltageChartInstance.current = null;
      }
      if (tempChartInstance.current) {
        tempChartInstance.current.destroy();
        tempChartInstance.current = null;
      }
      if (issueChartInstance.current) {
        issueChartInstance.current.destroy();
        issueChartInstance.current = null;
      }
    };
  }, [voltageData, temperatureData, uploadedData, selectedCycle]);

  // Generate PDF report
  const generatePDF = () => {
    if (!uploadedData || !selectedCycle) {
      alert("Please upload a JSON file and select a cycle.");
      return;
    }

    console.log("Report: Generating PDF with refs:", {
      voltageChartRef: voltageChartRef.current,
      tempChartRef: tempChartRef.current,
      issueChartRef: issueChartRef.current,
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const chartWidth = 140;
    const xOffset = (pageWidth - chartWidth) / 2;

    doc.setFontSize(16);
    doc.text(`Battery Management System Report - Cycle ${selectedCycle}`, 20, 20);

    let finalY = 20;

    // AI Analysis
    if (aiAnalysis.summary || aiAnalysis.recommendations.length > 0) {
      doc.setFontSize(12);
      doc.text("AI Analysis", 20, finalY + 10);
      finalY += 15;
      if (aiAnalysis.summary) {
        doc.setFontSize(10);
        doc.text("Summary:", 20, finalY);
        doc.text(aiAnalysis.summary, 20, finalY + 5, { maxWidth: 170 });
        finalY += doc.getTextDimensions(aiAnalysis.summary, { maxWidth: 170 }).h + 10;
      }
      if (aiAnalysis.recommendations.length > 0) {
        doc.setFontSize(10);
        doc.text("Recommendations:", 20, finalY);
        autoTable(doc, {
          startY: finalY + 5,
          head: [["Recommendation"]],
          body: aiAnalysis.recommendations.map((rec) => [rec]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY;
      }
    }

    // Individual Cells Table
    if (individualCells.some((cell) => cell.status !== "N/A")) {
      doc.setFontSize(12);
      doc.text("Individual Cells", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Received Voltage (V)", "Expected Voltage (V)", "Status"]],
        body: individualCells.map((cell) => [
          cell.id,
          cell.receivedVoltage !== null ? cell.receivedVoltage.toFixed(2) : "N/A",
          cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) : "N/A",
          cell.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // CSU1 Cells Table
    if (csu1Cells.some((cell) => cell.status !== "N/A")) {
      doc.setFontSize(12);
      doc.text("CSU1 Cells", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Voltage (V)", "Temperature (°C)", "Balance", "Open Wire", "Status"]],
        body: csu1Cells.map((cell) => [
          cell.id,
          cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A",
          cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A",
          cell.balance ? "On" : "Off",
          cell.openWire ? "On" : "Off",
          cell.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // CSU2 Cells Table
    if (csu2Cells.some((cell) => cell.status !== "N/A")) {
      doc.setFontSize(12);
      doc.text("CSU2 Cells", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Voltage (V)", "Temperature (°C)", "Balance", "Open Wire", "Status"]],
        body: csu2Cells.map((cell) => [
          cell.id,
          cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A",
          cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A",
          cell.balance ? "On" : "Off",
          cell.openWire ? "On" : "Off",
          cell.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // DaisyChain Cells Table
    if (daisyChainCells.some((cell) => cell.status !== "N/A")) {
      doc.setFontSize(12);
      doc.text("Daisy Chain Cells", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Value", "Status"]],
        body: daisyChainCells.map((cell) => [
          cell.id,
          cell.value !== null ? cell.value : "N/A",
          cell.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // Issues Table
    if (issues.length > 0) {
      doc.setFontSize(12);
      doc.text("Issues Detected", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Type", "Cell ID", "Status", "Details"]],
        body: issues.map((issue) => [
          issue.type,
          issue.cellId,
          issue.status,
          issue.details,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // Voltage Comparison Table
    if (voltageComparisons.length > 0) {
      doc.setFontSize(12);
      doc.text("Voltage Comparison", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Cell ID", "Set Voltage (V)", "Actual Voltage (V)", "Variance (V)", "Status"]],
        body: voltageComparisons.map((comp) => [
          comp.cellId,
          comp.setVoltage !== null ? comp.setVoltage.toFixed(2) : "N/A",
          comp.actualVoltage !== null ? comp.actualVoltage.toFixed(2) : "N/A",
          comp.variance !== null ? comp.variance.toFixed(2) : "N/A",
          comp.status,
        ]),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // Status Summary
    if (allStatuses.length > 0) {
      doc.setFontSize(12);
      doc.text("Status Summary", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [["Type", "Label", "Status", "Details"]],
        body: allStatuses.map((status) => {
          const parsedVoltages = parseValue(status.details, "voltage");
          const detailsText =
            status.type === "CSU1" || status.type === "CSU2"
              ? `Actual Voltage: ${parsedVoltages.actual !== null ? parsedVoltages.actual.toFixed(2) + " V" : "N/A"}, Expected Voltage: ${parsedVoltages.expected !== null ? parsedVoltages.expected.toFixed(2) + " V" : "N/A"}, ${status.details || "N/A"}`
              : status.details || "N/A";
          console.log(`Report: Status Summary for ${status.type} ${status.label}: ${detailsText}`);
          return [status.type, status.label, status.status, detailsText];
        }),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [240, 240, 240] },
      });
      finalY = (doc as any).lastAutoTable.finalY;
    }

    // Instructions Tables
    const instructionSets = [
      { title: "General Instructions", data: instructions },
      { title: "CSU1 Instructions", data: csu1Instructions },
      { title: "CSU2 Instructions", data: csu2Instructions },
      { title: "DC CSU Instructions", data: dcCsuInstructions },
    ];

    instructionSets.forEach(({ title, data }) => {
      if (data.length > 0) {
        doc.setFontSize(12);
        doc.text(title, 20, finalY + 10);
        autoTable(doc, {
          startY: finalY + 15,
          head: [["ID", "Instruction"]],
          body: data.map((instruction) => [
            instruction.id,
            formatInstruction(instruction),
          ]),
          styles: { fontSize: 8 },
          headStyles: { fillColor: [200, 200, 200], textColor: [0, 0, 0] },
          alternateRowStyles: { fillColor: [240, 240, 240] },
        });
        finalY = (doc as any).lastAutoTable.finalY;
      }
    });

    // Add charts to PDF
    if (voltageChartRef.current && voltageChartInstance.current) {
      try {
        doc.setFontSize(12);
        doc.text("Voltage Trends", xOffset, finalY + 10);
        const imgData = voltageChartRef.current.toDataURL("image/png");
        doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
        finalY += 60;
      } catch (e) {
        console.error("Report: Error adding voltage chart to PDF:", e);
      }
    }

    if (tempChartRef.current && tempChartInstance.current) {
      try {
        doc.setFontSize(12);
        doc.text("Temperature Trends", xOffset, finalY + 10);
        const imgData = tempChartRef.current.toDataURL("image/png");
        doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
        finalY += 60;
      } catch (e) {
        console.error("Report: Error adding temperature chart to PDF:", e);
      }
    }

    if (issueChartRef.current && issueChartInstance.current) {
      try {
        doc.setFontSize(12);
        doc.text("Issue Distribution", xOffset, finalY + 10);
        const imgData = issueChartRef.current.toDataURL("image/png");
        doc.addImage(imgData, "PNG", xOffset, finalY + 15, chartWidth, 50);
        finalY += 60;
      } catch (e) {
        console.error("Report: Error adding issue chart to PDF:", e);
      }
    }

    doc.save(`BMS_Report_Cycle_${selectedCycle}_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
  };

  // Check chart visibility
  const hasVoltageData = useMemo(() => {
    return voltageData.some((d) => d.actualVoltage !== null || d.setVoltage !== null);
  }, [voltageData]);
  const hasTemperatureData = useMemo(() => {
    return temperatureData.some((d) => d.temperature !== null);
  }, [temperatureData]);
  const hasIssueData = issues.length > 0;
  console.log("Report: hasVoltageData:", hasVoltageData);
  console.log("Report: hasTemperatureData:", hasTemperatureData);
  console.log("Report: hasIssueData:", hasIssueData);

  return (
    <div className="flex-1 bg-gray-100 h-screen overflow-auto">
      <CustomTitleBar />
      <div className="max-w-7xl p-2 mx-auto space-y-6 mt-10 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 font-inter">
            📊 BMS Test Run Summary
          </h1>
          <div className="flex gap-2 items-center">
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
            />
            {cycleNumbers.length > 0 && (
              <select
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
              disabled={!uploadedData || !selectedCycle}
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
            {/* AI Analysis */}
            {aiAnalysis.summary || aiAnalysis.recommendations.length > 0 ? (
              <div>
                <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4 flex items-center gap-2">
                  🤖 AI Analysis
                </h2>
                {aiAnalysis.isLoading ? (
                  <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                    Loading AI analysis...
                  </div>
                ) : aiAnalysis.error ? (
                  <div className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                    Error in AI analysis: {aiAnalysis.error}
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    {aiAnalysis.summary && (
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-700">Summary</h3>
                        <p className="text-sm text-gray-800">{aiAnalysis.summary}</p>
                      </div>
                    )}
                    {aiAnalysis.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-700">Recommendations</h3>
                        <ul className="list-disc list-inside text-sm text-gray-800">
                          {aiAnalysis.recommendations.map((rec, index) => (
                            <li key={`rec-${index}`}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* Individual Cells */}
            {individualCells.some((cell) => cell.status !== "N/A") && (
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🔋 Individual Cells
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {individualCells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Received Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Expected Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {individualCells.map((cell) => (
                        <tr key={`individual-${cell.cycle}-${cell.id}`} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.receivedVoltage !== null ? cell.receivedVoltage.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.expectedVoltage !== null ? cell.expectedVoltage.toFixed(2) : "N/A"}</td>
                          <td
                            className={`px-4 py-2 text-sm ${
                              cell.status === "critical"
                                ? "text-red-600"
                                : cell.status === "warning"
                                ? "text-yellow-600"
                                : cell.status === "N/A"
                                ? "text-gray-600"
                                : "text-green-600"
                            }`}
                          >
                            {cell.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CSU1 Cells */}
            {csu1Cells.some((cell) => cell.status !== "N/A") && (
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🔋 CSU1 Cells
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {csu1Cells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Temperature (°C)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Balance</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Open Wire</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csu1Cells.map((cell) => (
                        <tr key={`csu1-${cell.cycle}-${cell.id}`} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.balance ? "On" : "Off"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.openWire ? "On" : "Off"}</td>
                          <td
                            className={`px-4 py-2 text-sm ${
                              cell.status === "critical"
                                ? "text-red-600"
                                : cell.status === "warning"
                                ? "text-yellow-600"
                                : cell.status === "N/A"
                                ? "text-gray-600"
                                : "text-green-600"
                            }`}
                          >
                            {cell.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* CSU2 Cells */}
            {csu2Cells.some((cell) => cell.status !== "N/A") && (
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🔋 CSU2 Cells
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {csu2Cells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Temperature (°C)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Balance</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Open Wire</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csu2Cells.map((cell) => (
                        <tr key={`csu2-${cell.cycle}-${cell.id}`} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.balance ? "On" : "Off"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.openWire ? "On" : "Off"}</td>
                          <td
                            className={`px-4 py-2 text-sm ${
                              cell.status === "critical"
                                ? "text-red-600"
                                : cell.status === "warning"
                                ? "text-yellow-600"
                                : cell.status === "N/A"
                                ? "text-gray-600"
                                : "text-green-600"
                            }`}
                          >
                            {cell.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daisy Chain Cells */}
            {daisyChainCells.some((cell) => cell.status !== "N/A") && (
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  🔗 Daisy Chain Cells
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {daisyChainCells.filter((cell) => cell.status !== "N/A").length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Value</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daisyChainCells.map((cell) => (
                        <tr key={`daisy-${cell.cycle}-${cell.id}`} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{cell.value !== null ? cell.value : "N/A"}</td>
                          <td
                            className={`px-4 py-2 text-sm ${
                              cell.status === "critical"
                                ? "text-red-600"
                                : cell.status === "warning"
                                ? "text-yellow-600"
                                : cell.status === "N/A"
                                ? "text-gray-600"
                                : "text-green-600"
                            }`}
                          >
                            {cell.status}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Voltage Trends Chart */}
            <div>
              <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4">📈 Voltage Trends</h2>
              <div style={{ display: hasVoltageData ? "block" : "none" }}>
                <canvas ref={voltageChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasVoltageData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No voltage data available for chart.
                </div>
              )}
            </div>

            {/* Temperature Trends Chart */}
            <div>
              <h2 className="text-xl font-semibold font-inter text-gray-700 mb-4">🌡️ Temperature Trends</h2>
              <div style={{ display: hasTemperatureData ? "block" : "none" }}>
                <canvas ref={tempChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasTemperatureData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No temperature data available for chart.
                </div>
              )}
            </div>

            {/* Issue Distribution Chart */}
            <div>
              <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4">⚠️ Issue Distribution</h2>
              <div style={{ display: hasIssueData ? "block" : "none" }}>
                <canvas ref={issueChartRef} className="w-3/4 h-40 mx-auto"></canvas>
              </div>
              {!hasIssueData && (
                <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  No issue data available for chart.
                </div>
              )}
            </div>

            {/* Issues Detected */}
            {issues.length > 0 && (
              <div>
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  ⚠️ Issues Detected
                  <span className="text-sm bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                    {issues.length}
                  </span>
                </h2>
                <ul className="space-y-3">
                  {issues.map((item, index) => (
                    <li
                      key={`issue-${item.cycle}-${item.cellId}`}
                      className={`border rounded-lg p-4 text-sm ${
                        item.status === "critical"
                          ? "bg-red-50 border-red-200 text-red-800"
                          : item.status === "warning"
                          ? "bg-yellow-50 border-yellow-200 text-yellow-800"
                          : "bg-green-50 border-green-200 text-green-800"
                      }`}
                    >
                      <strong>
                        {item.type} Cell {item.cellId}
                      </strong>
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
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  ⚡ Voltage Comparison
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {voltageComparisons.length}
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Set Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Actual Voltage (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Variance (V)</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voltageComparisons.map((comp, index) => (
                        <tr key={`comp-${comp.cycle}-${comp.cellId}`} className="border-t border-gray-200">
                          <td className="px-4 py-2 text-sm text-gray-800">{comp.cellId}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{comp.setVoltage !== null ? comp.setVoltage.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{comp.actualVoltage !== null ? comp.actualVoltage.toFixed(2) : "N/A"}</td>
                          <td className="px-4 py-2 text-sm text-gray-800">{comp.variance !== null ? comp.variance.toFixed(2) : "N/A"}</td>
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

            {/* Status Summary */}
            {allStatuses.length > 0 && (
              <div className="">
                <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  📋 Status Summary
                  <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                    {allStatuses.length}
                  </span>
                </h2>
                <div className="overflow-x-auto overflow-y-auto h-100">
                  <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Type</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Label</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStatuses.map((status, index) => {
                        const parsedVoltages = parseValue(status.details, "voltage");
                        const detailsText =
                          status.type === "CSU1" || status.type === "CSU2"
                            ? `Actual Voltage: ${parsedVoltages.actual !== null ? parsedVoltages.actual.toFixed(2) + " V" : "N/A"}, Expected Voltage: ${parsedVoltages.expected !== null ? parsedVoltages.expected.toFixed(2) + " V" : "N/A"}, ${status.details || "N/A"}`
                            : status.details || "N/A";
                        console.log(`Report: Status Summary for ${status.type} ${status.label}: ${detailsText}`);
                        return (
                          <tr key={`status-${index}`} className="border-t border-gray-200">
                            <td className="px-4 py-2 text-sm text-gray-800">{status.type}</td>
                            <td className="px-4 py-2 text-sm text-gray-800">{status.label}</td>
                            <td
                              className={`px-4 py-2 text-sm ${
                                status.status === "critical"
                                  ? "text-red-600"
                                  : status.status === "warning"
                                  ? "text-yellow-600"
                                  : status.status === "N/A"
                                  ? "text-gray-600"
                                  : "text-green-600"
                              }`}
                            >
                              {status.status}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-800">{detailsText}</td>
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
                  <ul className="space-y-3 overflow-y-auto h-100">
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
