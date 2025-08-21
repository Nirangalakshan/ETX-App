import React, { useMemo, useRef, useEffect } from "react";
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

const Report: React.FC = () => {
  const {
    cellData,
    csu1ResponseData,
    csu2ResponseData,
    dcCsuResponseData,
    daisyChainData,
    instructions,
    aiAnalysis,
    dcCsuInstructions,
    csu1Instructions,
    csu2Instructions,
    csu1Statuses,
    csu2Statuses,
    daisyStatuses,
  } = useBatteryContext();

  const voltageChartRef = useRef<HTMLCanvasElement | null>(null);
  const tempChartRef = useRef<HTMLCanvasElement | null>(null);
  const issueChartRef = useRef<HTMLCanvasElement | null>(null);
  const voltageChartInstance = useRef<Chart | null>(null);
  const tempChartInstance = useRef<Chart | null>(null);
  const issueChartInstance = useRef<Chart | null>(null);

  // Calculate cell statuses
  const calculateStatus = (
    cell: {
      voltage: number | null;
      temperature: number | null;
      csu11Voltage: number | null;
      csu11Temperature: number | null;
      csu11Balance: boolean;
      csu11OpenWire: boolean;
      csu12Voltage: number | null;
      csu12Temperature: number | null;
      csu12Balance: boolean;
      csu12OpenWire: boolean;
      dcCsuVoltage: number | null;
      dcCsuTemperature: number | null;
      dcCsuBalance: boolean;
      dcCsuOpenWire: boolean;
      daisyChain: string | null;
    }
  ): CellStatus => {
    if (
      cell.voltage === null &&
      cell.temperature === null &&
      cell.csu11Voltage === null &&
      cell.csu11Temperature === null &&
      !cell.csu11Balance &&
      !cell.csu11OpenWire &&
      cell.csu12Voltage === null &&
      cell.csu12Temperature === null &&
      !cell.csu12Balance &&
      !cell.csu12OpenWire &&
      cell.dcCsuVoltage === null &&
      cell.dcCsuTemperature === null &&
      !cell.dcCsuBalance &&
      !cell.dcCsuOpenWire &&
      cell.daisyChain === null
    ) {
      return "N/A";
    }

    let status: CellStatus = "normal";

    [cell.voltage, cell.csu11Voltage, cell.csu12Voltage, cell.dcCsuVoltage].forEach((voltage) => {
      if (voltage !== null) {
        if (voltage > 4.2) {
          status = "critical";
        } else if (voltage < 3.0 && status !== "critical") {
          status = "warning";
        }
      }
    });

    [cell.temperature, cell.csu11Temperature, cell.csu12Temperature, cell.dcCsuTemperature].forEach((temp) => {
      if (temp !== null) {
        if (temp > 60) {
          status = "critical";
        } else if (temp > 45 && status !== "critical") {
          status = "warning";
        }
      }
    });

    if (cell.csu11OpenWire || cell.csu12OpenWire || cell.dcCsuOpenWire) {
      status = "critical";
    } else if (
      (cell.csu11Balance || cell.csu12Balance || cell.dcCsuBalance) &&
      status !== "critical"
    ) {
      status = "warning";
    }

    return status;
  };

  // Process cell data
  const cells = useMemo(() => {
    const safeCellData = Array.isArray(cellData)
      ? cellData
      : Array.from({ length: 24 }, (_, i) => ({
          id: i,
          voltage: null,
          temperature: null,
          setVoltage: null,
          setTemperature: null,
          balancing: false,
          openWire: false,
          delay: null,
          cellLed: false,
          automaticSequence: false,
          voltageLimits: null,
          csu11Voltage: null,
          csu11Temperature: null,
          csu11Balance: false,
          csu11OpenWire: false,
          csu12Voltage: null,
          csu12Temperature: null,
          csu12Balance: false,
          csu12OpenWire: false,
          dcCsuVoltage: null,
          dcCsuTemperature: null,
          dcCsuBalance: false,
          dcCsuOpenWire: false,
          daisyChain: null,
        }));

    return safeCellData.map((cell) => ({
      ...cell,
      status: calculateStatus(cell),
    }));
  }, [cellData]);

  // Identify issues
  const issues = useMemo(() => {
    const issuesList: { type: string; cellId: number; status: CellStatus; details: string }[] = [];

    cells.forEach((cell) => {
      if (cell.status !== "N/A") {
        const details = [
          `Voltage: ${cell.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}`,
          `Temperature: ${cell.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`,
          `CSU11 Voltage: ${cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) + " V" : "N/A"}`,
          `CSU11 Temperature: ${cell.csu11Temperature !== null ? cell.csu11Temperature.toFixed(2) + " °C" : "N/A"}`,
          `CSU11 Balance: ${cell.csu11Balance ? "On" : "Off"}`,
          `CSU11 Open Wire: ${cell.csu11OpenWire ? "On" : "Off"}`,
          `CSU12 Voltage: ${cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) + " V" : "N/A"}`,
          `CSU12 Temperature: ${cell.csu12Temperature !== null ? cell.csu12Temperature.toFixed(2) + " °C" : "N/A"}`,
          `CSU12 Balance: ${cell.csu12Balance ? "On" : "Off"}`,
          `CSU12 Open Wire: ${cell.csu12OpenWire ? "On" : "Off"}`,
          `DC CSU Voltage: ${cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) + " V" : "N/A"}`,
          `DC CSU Temperature: ${cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) + " °C" : "N/A"}`,
          `DC CSU Balance: ${cell.dcCsuBalance ? "On" : "Off"}`,
          `DC CSU Open Wire: ${cell.dcCsuOpenWire ? "On" : "Off"}`,
          `Daisy Chain: ${cell.daisyChain !== null ? cell.daisyChain : "N/A"}`,
        ].join(", ");
        issuesList.push({
          type: cell.id < 12 ? "CSU1" : "CSU2",
          cellId: cell.id,
          status: cell.status,
          details,
        });
      }
    });

    Object.entries(daisyChainData).forEach(([cellNo, dataItems]) => {
      const cellId = parseInt(cellNo);
      const daisyChainItem = dataItems.find((item) => item.command === "daisy_chain");
      if (daisyChainItem && daisyChainItem.value === "On") {
        const cell = cells.find((c) => c.id === cellId);
        const details = `Daisy Chain: ${daisyChainItem.value}, Voltage: ${cell?.voltage !== null ? cell.voltage.toFixed(2) + " V" : "N/A"}, Temperature: ${cell?.temperature !== null ? cell.temperature.toFixed(2) + " °C" : "N/A"}`;
        issuesList.push({
          type: "Daisy Chain",
          cellId,
          status: cell?.status || "warning",
          details,
        });
      }
    });

    return issuesList;
  }, [cells, daisyChainData]);

  // Voltage comparison
  const voltageComparisons = useMemo(() => {
    const comparisons: {
      cellId: number;
      setVoltage: number | null;
      actualVoltage: number | null;
      variance: number | null;
      status: "Match" | "Mismatch" | "No Data";
    }[] = [];

    cells.forEach((cell) => {
      const setVoltage = cell.setVoltage;
      const actualVoltage = cell.voltage || cell.csu11Voltage || cell.csu12Voltage || cell.dcCsuVoltage;
      if (setVoltage !== null && actualVoltage !== null) {
        const variance = Math.abs(setVoltage - actualVoltage);
        comparisons.push({
          cellId: cell.id,
          setVoltage,
          actualVoltage,
          variance,
          status: variance <= 0.1 ? "Match" : "Mismatch",
        });
      } else if (setVoltage !== null || actualVoltage !== null) {
        comparisons.push({
          cellId: cell.id,
          setVoltage,
          actualVoltage,
          variance: null,
          status: "No Data",
        });
      }
    });

    return comparisons;
  }, [cells]);

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
      // Match actual voltage (e.g., "Voltage: 3.581")
      const actualMatch = details.match(/Voltage:\s*(\d+\.\d+)/);
      if (actualMatch) {
        console.log(`Report: Parsed actual voltage from "${details}": ${actualMatch[1]}`);
        actual = parseFloat(actualMatch[1]);
      }
      // Match expected voltage (e.g., "(Expected: 3.6V)")
      const expectedMatch = details.match(/\(Expected:\s*(\d+\.\d+)\s*V\)/);
      if (expectedMatch) {
        console.log(`Report: Parsed expected voltage from "${details}": ${expectedMatch[1]}`);
        expected = parseFloat(expectedMatch[1]);
      }
    } else if (type === "temperature") {
      // Match temperature (e.g., "Temperature: 25.0 °C")
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
    console.log("Report: Generating voltageData from allStatuses:", allStatuses);
    return allStatuses
      .filter((status) => status.type === "CSU1" || status.type === "CSU2" || status.type === "Daisy Chain")
      .map((status) => {
        const parsedVoltages = parseValue(status.details, "voltage");
        console.log(`Report: Voltage data for ${status.type} ${status.label}: actual=${parsedVoltages.actual}, expected=${parsedVoltages.expected}`);
        return {
          label: status.label.startsWith("Cell ") ? status.label : `Cell ${status.label}`,
          actualVoltage: parsedVoltages.actual !== null ? parseFloat(parsedVoltages.actual.toFixed(2)) : null,
          setVoltage: parsedVoltages.expected !== null ? parseFloat(parsedVoltages.expected.toFixed(2)) : null,
          status: status.status,
        };
      });
  }, [allStatuses]);

  // Define temperatureData using useMemo
  const temperatureData = useMemo(() => {
    return cells.map((cell) => {
      const temp = cell.temperature || cell.csu11Temperature || cell.csu12Temperature || cell.dcCsuTemperature;
      const statusDetails = allStatuses.find((s) => s.label === cell.id.toString() || s.label === `Cell ${cell.id}`)?.details;
      const parsedTemp = parseValue(statusDetails, "temperature");
      return {
        label: `Cell ${cell.id}`,
        temperature: temp !== null ? parseFloat(temp.toFixed(2)) : parsedTemp.actual,
      };
    });
  }, [cells, allStatuses]);

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
                    suggestedMax: 5,
                  },
                  x: {
                    title: { display: true, text: "Cell ID" },
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
                    title: { display: true, text: "Cell Label" },
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
          const issueCounts = allStatuses.reduce(
            (acc, status) => {
              if (status.status === "critical") acc.critical += 1;
              else if (status.status === "warning") acc.warning += 1;
              else if (status.status === "normal") acc.normal += 1;
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

    // Double requestAnimationFrame to ensure DOM is updated
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

    scheduleCharts();

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
  }, [voltageData, temperatureData]);

  // Generate PDF report
  const generatePDF = () => {
    console.log("Report: Generating PDF with refs:", {
      voltageChartRef: voltageChartRef.current,
      tempChartRef: tempChartRef.current,
      issueChartRef: issueChartRef.current,
    });

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const chartWidth = 140; // Reduced from 170
    const xOffset = (pageWidth - chartWidth) / 2; // Center the chart

    doc.setFontSize(16);
    doc.text("Battery Management System Report", 20, 20);

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

    // Cell Data Table
    if (cells.some((cell) => cell.status !== "N/A")) {
      doc.setFontSize(12);
      doc.text("Cell Status", 20, finalY + 10);
      autoTable(doc, {
        startY: finalY + 15,
        head: [
          [
            "Cell ID",
            "CSU",
            "Voltage (V)",
            "Temperature (°C)",
            "CSU11 Voltage (V)",
            "CSU11 Temp (°C)",
            "CSU11 Balance",
            "CSU11 Open Wire",
            "CSU12 Voltage (V)",
            "CSU12 Temp (°C)",
            "CSU12 Balance",
            "CSU12 Open Wire",
            "DC CSU Voltage (V)",
            "DC CSU Temp (°C)",
            "DC CSU Balance",
            "DC CSU Open Wire",
            "Daisy Chain",
            "Status",
          ],
        ],
        body: cells.map((cell) => [
          cell.id,
          cell.id < 12 ? "CSU1" : "CSU2",
          cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A",
          cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A",
          cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) : "N/A",
          cell.csu11Temperature !== null ? cell.csu11Temperature.toFixed(2) : "N/A",
          cell.csu11Balance ? "On" : "Off",
          cell.csu11OpenWire ? "On" : "Off",
          cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) : "N/A",
          cell.csu12Temperature !== null ? cell.csu12Temperature.toFixed(2) : "N/A",
          cell.csu12Balance ? "On" : "Off",
          cell.csu12OpenWire ? "On" : "Off",
          cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) : "N/A",
          cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) : "N/A",
          cell.dcCsuBalance ? "On" : "Off",
          cell.dcCsuOpenWire ? "On" : "Off",
          cell.daisyChain !== null ? cell.daisyChain : "N/A",
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
          `${comp.cellId} (CSU ${comp.cellId < 12 ? 1 : 2})`,
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

    // Add charts to PDF with checks
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

    doc.save(`BMS_Report_${new Date().toISOString().replace(/[:.]/g, "-")}.pdf`);
  };

  // Check chart visibility
  const hasVoltageData = useMemo(() => {
    return voltageData.some((d) => d.actualVoltage !== null || d.setVoltage !== null);
  }, [voltageData]);
  const hasTemperatureData = useMemo(() => {
    return temperatureData.some((d) => d.temperature !== null);
  }, [temperatureData]);
  const hasIssueData = allStatuses.some((status) => status.status !== "N/A");
  console.log("Report: hasVoltageData:", hasVoltageData);
  console.log("Report: hasTemperatureData:", hasTemperatureData);
  console.log("Report: hasIssueData:", hasIssueData);
  console.log("Report: allStatuses:", allStatuses);

  return (
    <div className="flex-1 bg-gray-100 h-screen overflow-auto">
      <CustomTitleBar />
      <div className="max-w-7xl p-2 mx-auto space-y-6 mt-10 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 font-inter">
            📊 BMS Test Run Summary
          </h1>
          <button
            onClick={generatePDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm text-sm transition-colors"
          >
            📄 Generate PDF
          </button>
        </div>

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

          {/* Cell Status */}
          {cells.some((cell) => cell.status !== "N/A") && (
            <div>
              <h2 className="text-xl font-inter font-semibold text-gray-700 mb-4 flex items-center gap-2">
                🔋 Cell Status
                <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {cells.filter((cell) => cell.status !== "N/A").length}
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-gray-50 rounded-lg border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Cell ID</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Voltage (V)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Temperature (°C)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU11 Voltage (V)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU11 Temp (°C)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU11 Balance</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU11 Open Wire</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU12 Voltage (V)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU12 Temp (°C)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU12 Balance</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">CSU12 Open Wire</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Voltage (V)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Temp (°C)</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Balance</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">DC CSU Open Wire</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Daisy Chain</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cells.map((cell) => (
                      <tr key={`cell-${cell.id}`} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.id}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.id < 12 ? "CSU1" : "CSU2"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.voltage !== null ? cell.voltage.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.temperature !== null ? cell.temperature.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu11Voltage !== null ? cell.csu11Voltage.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu11Temperature !== null ? cell.csu11Temperature.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu11Balance ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu11OpenWire ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu12Voltage !== null ? cell.csu12Voltage.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu12Temperature !== null ? cell.csu12Temperature.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu12Balance ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.csu12OpenWire ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuVoltage !== null ? cell.dcCsuVoltage.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuTemperature !== null ? cell.dcCsuTemperature.toFixed(2) : "N/A"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuBalance ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.dcCsuOpenWire ? "On" : "Off"}</td>
                        <td className="px-4 py-2 text-sm text-gray-800">{cell.daisyChain !== null ? cell.daisyChain : "N/A"}</td>
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
                    key={`issue-${index}`}
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
                      <tr key={`comp-${index}`} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-800">{comp.cellId} (CSU {comp.cellId < 12 ? 1 : 2})</td>
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

          {/* No Data */}
          {cells.every((cell) => cell.status === "N/A") &&
            issues.length === 0 &&
            voltageComparisons.length === 0 &&
            allStatuses.length === 0 &&
            instructions.length === 0 &&
            csu1Instructions.length === 0 &&
            csu2Instructions.length === 0 &&
            dcCsuInstructions.length === 0 &&
            !aiAnalysis.summary &&
            aiAnalysis.recommendations.length === 0 && (
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