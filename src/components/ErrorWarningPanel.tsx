import React, { useState, useEffect, useMemo } from 'react';
import { ResponseData } from './test';

type CellStatus = 'normal' | 'warning' | 'critical';

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
  voltageLimits: string | null;
}

interface ErrorWarningPanelProps {
  csu1Cells: BatteryCell[];
  csu2Cells: BatteryCell[];
  daisyChainData: Record<number, Record<number, ResponseData[]>> | null | undefined;
}

// Thresholds for voltage and temperature gaps
const VOLTAGE_WARNING_THRESHOLD = 0.1; // 0.1V difference triggers warning
const VOLTAGE_CRITICAL_THRESHOLD = 0.2; // 0.2V difference triggers critical error
const TEMPERATURE_WARNING_THRESHOLD = 5; // 5°C difference triggers warning
const TEMPERATURE_CRITICAL_THRESHOLD = 10; // 10°C difference triggers critical error

// Expected sent voltage values for each cell
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

const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({ csu1Cells, csu2Cells, daisyChainData }) => {
  const [errors, setErrors] = useState<(BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[]>([]);
  const [warnings, setWarnings] = useState<(BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[]>([]);

  const allCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

  // Helper function to check voltage gap
  const checkVoltageGap = (cell: BatteryCell): { status: CellStatus; details?: string } => {
    const expectedVoltage = EXPECTED_SENT_VOLTAGES[cell.id];
    const sentVoltage = expectedVoltage !== undefined ? expectedVoltage : cell.voltage;
    
    if (sentVoltage !== null && sentVoltage !== undefined && cell.voltage !== null) {
      const gap = Math.abs(sentVoltage - cell.voltage);
      if (gap >= VOLTAGE_CRITICAL_THRESHOLD) {
        return {
          status: 'critical',
          details: `Voltage gap: ${gap.toFixed(3)}V (Expected: ${sentVoltage.toFixed(3)}V, Actual: ${cell.voltage.toFixed(3)}V)`,
        };
      } else if (gap >= VOLTAGE_WARNING_THRESHOLD) {
        return {
          status: 'warning',
          details: `Voltage gap: ${gap.toFixed(3)}V (Expected: ${sentVoltage.toFixed(3)}V, Actual: ${cell.voltage.toFixed(3)}V)`,
        };
      }
    }
    return { status: 'normal' };
  };

  // Helper function to check temperature gap
  const checkTemperatureGap = (cell: BatteryCell): { status: CellStatus; details?: string } => {
    if (cell.setTemperature !== null && cell.temperature !== null) {
      const gap = Math.abs(cell.setTemperature - cell.temperature);
      if (gap >= TEMPERATURE_CRITICAL_THRESHOLD) {
        return {
          status: 'critical',
          details: `Temperature gap: ${gap.toFixed(1)}°C (Set: ${cell.setTemperature.toFixed(1)}°C, Actual: ${cell.temperature.toFixed(1)}°C)`,
        };
      } else if (gap >= TEMPERATURE_WARNING_THRESHOLD) {
        return {
          status: 'warning',
          details: `Temperature gap: ${gap.toFixed(1)}°C (Set: ${cell.setTemperature.toFixed(1)}°C, Actual: ${cell.temperature.toFixed(1)}°C)`,
        };
      }
    }
    return { status: 'normal' };
  };

  // Helper function to get daisy chain status
  const getDaisyChainStatus = (dataItems: ResponseData[]): CellStatus => {
    const daisyChainItem = dataItems.find((item) => item.command === 'get_dc_csu_ow');
    return daisyChainItem && daisyChainItem.value === 'On' ? 'warning' : 'normal';
  };

  useEffect(() => {
    console.log('ErrorWarningPanel: useEffect triggered', { csu1Cells, csu2Cells, daisyChainData });

    // Process cells for errors and warnings
    const newErrors: (BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[] = [];
    const newWarnings: (BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[] = [];

    // Check cell status and gaps
    allCells.forEach((cell) => {
      if (cell.status === 'critical') {
        newErrors.push(cell);
      } else if (cell.status === 'warning') {
        newWarnings.push(cell);
      }

      // Check voltage gap only if expected voltage is available
      const voltageGapResult = checkVoltageGap(cell);
      if (voltageGapResult.status !== 'normal') {
        (voltageGapResult.status === 'critical' ? newErrors : newWarnings).push({
          type: 'Voltage Gap',
          cellId: cell.id,
          status: voltageGapResult.status,
          details: voltageGapResult.details || '',
        });
      }

      // Check temperature gap only if set temperature is available
      const temperatureGapResult = checkTemperatureGap(cell);
      if (temperatureGapResult.status !== 'normal') {
        (temperatureGapResult.status === 'critical' ? newErrors : newWarnings).push({
          type: 'Temperature Gap',
          cellId: cell.id,
          status: temperatureGapResult.status,
          details: temperatureGapResult.details || '',
        });
      }
    });

    // Process daisy chain data
    if (daisyChainData && typeof daisyChainData === 'object' && !Array.isArray(daisyChainData)) {
      Object.entries(daisyChainData).forEach(([dcIc, cellData]) => {
        Object.entries(cellData).forEach(([cellNo, dataItems]) => {
          const cellId = parseInt(cellNo);
          const status = getDaisyChainStatus(dataItems);
          if (status !== 'normal') {
            const voltageItem = dataItems.find((item) => item.command === 'get_dc_csu_volt');
            const tempItem = dataItems.find((item) => item.command === 'get_dc_csu_temp');
            const details = `Voltage: ${voltageItem ? voltageItem.value : 'N/A'}V, Temperature: ${tempItem ? tempItem.value : 'N/A'}, Daisy Chain: ${dataItems.find((item) => item.command === 'get_dc_csu_ow')?.value ?? 'N/A'}`;
            (status === 'critical' ? newErrors : newWarnings).push({
              type: `Daisy Chain (IC ${dcIc})`,
              cellId,
              status,
              details,
            });
          }
        });
      });
    }

    // Update state
    setErrors(newErrors);
    setWarnings(newWarnings);
  }, [allCells, daisyChainData]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-md mt-4 space-y-4 overflow-y-auto" style={{ height: 'calc(22vh - 20px)' }}>
      <h2 className="text-xl font-bold text-gray-800">⚠️ Errors and Warnings</h2>

      {errors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            🔴 Critical Errors <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{errors.length}</span>
          </h3>
          <ul className="space-y-2">
            {errors.map((item, index) => (
              <li
                key={`error-${index}`}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 shadow-sm"
              >
                {'id' in item ? (
                  <>
                    <strong>Cell {item.id}</strong> (CSU {item.id < 12 ? 1 : 2})<br />
                    Voltage: <span className="font-medium">{item.voltage !== null ? item.voltage.toFixed(2) : '-'}</span>,
                    Temp: <span className="font-medium">{item.temperature !== null ? item.temperature.toFixed(1) : '-'}</span>
                    {item.balancing && <><br />Balancing: On</>}
                    {item.openWire && <><br />Open Wire: Detected</>}
                  </>
                ) : (
                  <>
                    <strong>{item.type} Cell {item.cellId}</strong><br />
                    {item.details}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600 mb-2 flex items-center gap-2">
            🟡 Warnings <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{warnings.length}</span>
          </h3>
          <ul className="space-y-2">
            {warnings.map((item, index) => (
              <li
                key={`warning-${index}`}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 shadow-sm"
              >
                {'id' in item ? (
                  <>
                    <strong>Cell {item.id}</strong> (CSU {item.id < 12 ? 1 : 2})<br />
                    Voltage: <span className="font-medium">{item.voltage !== null ? item.voltage.toFixed(2) : '-'}</span>,
                    Temp: <span className="font-medium">{item.temperature !== null ? item.temperature.toFixed(1) : '-'}</span>
                    {item.balancing && <><br />Balancing: On</>}
                    {item.openWire && <><br />Open Wire: Detected</>}
                  </>
                ) : (
                  <>
                    <strong>{item.type} Cell {item.cellId}</strong><br />
                    {item.details}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {allCells.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          No cells data available.
        </div>
      )}
    </div>
  );
};

export default ErrorWarningPanel;











