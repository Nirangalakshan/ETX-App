
//update for reset when new set values
import React, { useEffect, useState, useRef } from "react";
import { useBatteryContext } from "../BatteryContext";

type CellStatus = "normal" | "warning" | "critical" | "N/A";

interface ErrorWarningItem {
  label: string;
  status: CellStatus;
  details?: string;
}

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

const ErrorWarningPanel: React.FC = () => {
  const {
    cellData,
    responseData,
    instructions,
    csu1Statuses,
    csu2Statuses,
    daisyStatuses,
    resetStatus, // 👈 pull in reset from BatteryContext
  } = useBatteryContext();

  const [localStatuses, setLocalStatuses] = useState<{
    csu1: ErrorWarningItem[];
    csu2: ErrorWarningItem[];
    daisy: ErrorWarningItem[];
  }>({ csu1: [], csu2: [], daisy: [] });

  const prevCellDataRef = useRef<(typeof cellData) | null>(null);

  // 🔄 Reset panel whenever a new test/expectedVoltage set
  useEffect(() => {
    if (
      prevCellDataRef.current &&
      cellData &&
      cellData.some(
        (cell, i) =>
          prevCellDataRef.current &&
          prevCellDataRef.current[i] &&
          cell.expectedVoltage !== null &&
          prevCellDataRef.current[i].expectedVoltage !== cell.expectedVoltage
      )
    ) {
      console.log("⚡ Reset statuses due to expectedVoltage change");
      resetStatus(); // use same reset as battery.tsx
      setLocalStatuses({ csu1: [], csu2: [], daisy: [] });
    }
    prevCellDataRef.current = cellData;
  }, [cellData, resetStatus]);

  // 🧮 Compute local statuses
  useEffect(() => {
    if (
      !responseData ||
      !Array.isArray(instructions) ||
      !cellData ||
      cellData.length === 0
    ) {
      setLocalStatuses({ csu1: [], csu2: [], daisy: [] });
      return;
    }

    const newCsu1: ErrorWarningItem[] = [];
    const newCsu2: ErrorWarningItem[] = [];
    const newDaisy: ErrorWarningItem[] = [];

    cellData.forEach((cell) => {
      const voltage: number | null = cell.voltage;
      const temperature: number | null = cell.temperature;
      const expectedVoltage: number | null = cell.expectedVoltage;
      let status: CellStatus = "N/A";

      if (voltage !== null && expectedVoltage !== null) {
        const gap = Math.abs(expectedVoltage - voltage);
        if (gap >= VOLTAGE_CRITICAL_THRESHOLD) status = "critical";
        else if (gap >= VOLTAGE_WARNING_THRESHOLD) status = "warning";
        else status = "normal";
      } else if (temperature !== null && cell.setTemperature !== null) {
        const gap = Math.abs(cell.setTemperature - temperature);
        if (gap >= TEMPERATURE_CRITICAL_THRESHOLD) status = "critical";
        else if (gap >= TEMPERATURE_WARNING_THRESHOLD) status = "warning";
        else status = "normal";
      }

      if (status !== "N/A") {
        const item: ErrorWarningItem = {
          label: `Tester Cell: ${cell.id}`,
          status,
          details: [
            voltage !== null ? `Voltage: ${voltage.toFixed(2)} V` : null,
            expectedVoltage !== null
              ? `Expected: ${expectedVoltage.toFixed(2)} V`
              : null,
            temperature !== null
              ? `Temp: ${temperature.toFixed(1)} °C`
              : null,
          ]
            .filter(Boolean)
            .join(", "),
        };

        if (cell.id < 12) newCsu1.push(item);
        else if (cell.id < 24) newCsu2.push(item);
        else newDaisy.push(item);
      }
    });

    setLocalStatuses({ csu1: newCsu1, csu2: newCsu2, daisy: newDaisy });
  }, [cellData, responseData, instructions]);

  // 🔀 Merge context + local
  const mergedCsu1 = [
    ...localStatuses.csu1,
    ...csu1Statuses.filter(
      (ctx) => !localStatuses.csu1.some((l) => l.label === ctx.label)
    ),
  ];
  const mergedCsu2 = [
    ...localStatuses.csu2,
    ...csu2Statuses.filter(
      (ctx) => !localStatuses.csu2.some((l) => l.label === ctx.label)
    ),
  ];
  const mergedDaisy = [
    ...localStatuses.daisy,
    ...daisyStatuses.filter(
      (ctx) => !localStatuses.daisy.some((l) => l.label === ctx.label)
    ),
  ];

  const errors = [
    ...mergedCsu1.filter((i) => i.status === "critical"),
    ...mergedCsu2.filter((i) => i.status === "critical"),
    ...mergedDaisy.filter((i) => i.status === "critical"),
  ];
  const warnings = [
    ...mergedCsu1.filter((i) => i.status === "warning"),
    ...mergedCsu2.filter((i) => i.status === "warning"),
    ...mergedDaisy.filter((i) => i.status === "warning"),
  ];
  const normals = [
    ...mergedCsu1.filter((i) => i.status === "normal"),
    ...mergedCsu2.filter((i) => i.status === "normal"),
    ...mergedDaisy.filter((i) => i.status === "normal"),
  ];

  const renderList = (items: ErrorWarningItem[], color: string, bg: string) => (
    <ul className="space-y-2">
      {items.map((item, idx) => (
        <li
          key={idx}
          className={`${bg} border rounded-lg p-3 text-sm shadow-sm ${color}`}
        >
          <strong>{item.label}</strong>
          {item.details && (
            <>
              <br />
              {item.details}
            </>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div
      className="w-full bg-white border border-gray-500 rounded-xl p-5 shadow-lg mt-4 space-y-4 overflow-y-auto"
      style={{ height: "calc(37vh - 20px)" }}
    >
      <h2 className="text-xl font-bold text-gray-800">Cell Status</h2>

      {errors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            🔴 Critical Errors
            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
              {errors.length}
            </span>
          </h3>
          {renderList(errors, "text-red-800", "bg-red-50 border-red-200")}
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600 mb-2 flex items-center gap-2">
            🟡 Warnings
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
              {warnings.length}
            </span>
          </h3>
          {renderList(warnings, "text-yellow-800", "bg-yellow-50 border-yellow-200")}
        </div>
      )}

      {normals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-2 flex items-center gap-2">
            🟢 Normal
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              {normals.length}
            </span>
          </h3>
          {renderList(normals, "text-green-800", "bg-green-50 border-green-200")}
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && normals.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          No cell status data available.
        </div>
      )}
    </div>
  );
};

export default ErrorWarningPanel;
