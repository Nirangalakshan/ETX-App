import React, { useState, useEffect } from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

interface BatteryCell {
  id: number;
  voltage: number;
  temperature: number;
  status: CellStatus;
}

interface ErrorWarningPanelProps {
  csu1Cells: BatteryCell[];
  csu2Cells: BatteryCell[];
}

const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({ csu1Cells, csu2Cells }) => {
  const [errors, setErrors] = useState<BatteryCell[]>([]);
  const [warnings, setWarnings] = useState<BatteryCell[]>([]);

  useEffect(() => {
    const allCells = [...csu1Cells, ...csu2Cells];
    setErrors(allCells.filter(cell => cell.status === 'critical'));
    setWarnings(allCells.filter(cell => cell.status === 'warning'));
  }, [csu1Cells, csu2Cells]);

  return (
    <div className="w-full bg-gray-200 p-4 mt-4 rounded-lg shadow-lg overflow-y-auto" style={{ height: 'calc(20vh - 20px)' }}>
      <h2 className="text-xl font-bold mb-2">Errors and Warnings</h2>
      {errors.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-red-600">Errors (Critical):</h3>
          <ul className="list-disc pl-5 text-sm">
            {errors.map((cell) => (
              <li key={cell.id}>Cell {cell.id} (CSU {cell.id < 12 ? 1 : 2}): {cell.voltage.toFixed(2)}V, {cell.temperature}°C</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600">Warnings:</h3>
          <ul className="list-disc pl-5 text-sm">
            {warnings.map((cell) => (
              <li key={cell.id}>Cell {cell.id} (CSU {cell.id < 12 ? 1 : 2}): {cell.voltage.toFixed(2)}V, {cell.temperature}°C</li>
            ))}
          </ul>
        </div>
      )}
      {errors.length === 0 && warnings.length === 0 && (
        <p className="text-gray-500 text-sm">No errors or warnings detected.</p>
      )}
    </div>
  );
};

export default ErrorWarningPanel;