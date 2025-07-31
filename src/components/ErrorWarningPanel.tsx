// import React, { useState, useEffect, useMemo } from 'react';

// type CellStatus = 'normal' | 'warning' | 'critical';

// interface BatteryCell {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: CellStatus;
// }

// interface ErrorWarningPanelProps {
//   csu1Cells: BatteryCell[];
//   csu2Cells: BatteryCell[];
// }

// const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({ csu1Cells, csu2Cells }) => {
//   const [errors, setErrors] = useState<BatteryCell[]>([]);
//   const [warnings, setWarnings] = useState<BatteryCell[]>([]);

//   const allCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

//   useEffect(() => {
//     console.log('ErrorWarningPanel: useEffect triggered', { csu1Cells, csu2Cells });
//     const newErrors = allCells.filter(cell => cell.status === 'critical');
//     const newWarnings = allCells.filter(cell => cell.status === 'warning');

//     // Only update state if the errors or warnings have changed
//     if (
//       newErrors.length !== errors.length ||
//       newErrors.some((cell, i) => cell !== errors[i])
//     ) {
//       console.log('ErrorWarningPanel: Updating errors', newErrors);
//       setErrors(newErrors);
//     }

//     if (
//       newWarnings.length !== warnings.length ||
//       newWarnings.some((cell, i) => cell !== warnings[i])
//     ) {
//       console.log('ErrorWarningPanel: Updating warnings', newWarnings);
//       setWarnings(newWarnings);
//     }
//   }, [allCells, errors, warnings]);

//   return (
//     <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-md mt-4 space-y-4 overflow-y-auto" style={{ height: 'calc(22vh - 20px)' }}>
//       <h2 className="text-xl font-bold text-gray-800">⚠️ Errors and Warnings</h2>

//       {errors.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
//             🔴 Critical Errors <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{errors.length}</span>
//           </h3>
//           <ul className="space-y-2">
//             {errors.map((cell) => (
//               <li
//                 key={cell.id}
//                 className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 shadow-sm"
//               >
//                 <strong>Cell {cell.id}</strong> (CSU {cell.id < 12 ? 1 : 2})<br />
//                 Voltage: <span className="font-medium">{cell.voltage}V</span>, Temp: <span className="font-medium">{cell.temperature}°C</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {warnings.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-yellow-600 mb-2 flex items-center gap-2">
//             🟡 Warnings <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{warnings.length}</span>
//           </h3>
//           <ul className="space-y-2">
//             {warnings.map((cell) => (
//               <li
//                 key={cell.id}
//                 className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 shadow-sm"
//               >
//                 <strong>Cell {cell.id}</strong> (CSU {cell.id < 12 ? 1 : 2})<br />
//                 Voltage: <span className="font-medium">{cell.voltage}V</span>, Temp: <span className="font-medium">{cell.temperature}°C</span>
//               </li>
//             ))}
//           </ul>
//         </div>
//       )}

//       {errors.length === 0 && warnings.length === 0 && (
//         <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
//           ✅ All cells operating normally.
//         </div>
//       )}
//     </div>
//   );
// };

// export default ErrorWarningPanel;









import React, { useState, useEffect, useMemo } from 'react';
import { ResponseData } from './test';

type CellStatus = 'normal' | 'warning' | 'critical';

interface BatteryCell {
  id: number;
  voltage: number | null;
  temperature: number | null;
  status: CellStatus;
  setVoltage: number;
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

const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({ csu1Cells, csu2Cells, daisyChainData }) => {
  const [errors, setErrors] = useState<(BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[]>([]);
  const [warnings, setWarnings] = useState<(BatteryCell | { type: string; cellId: number; status: CellStatus; details: string })[]>([]);

  const allCells = useMemo(() => [...csu1Cells, ...csu2Cells], [csu1Cells, csu2Cells]);

  // Helper function to get daisy chain status
  const getDaisyChainStatus = (dataItems: ResponseData[]): CellStatus => {
    const daisyChainItem = dataItems.find((item) => item.command === 'get_dc_csu_ow');
    return daisyChainItem && daisyChainItem.value === 'On' ? 'warning' : 'normal';
  };

  useEffect(() => {
    console.log('ErrorWarningPanel: useEffect triggered', { csu1Cells, csu2Cells, daisyChainData });

    // Process CSU1 and CSU2 cells
    const newErrors = allCells.filter(cell => cell.status === 'critical');
    const newWarnings = allCells.filter(cell => cell.status === 'warning');

    // Process daisy chain data
    const daisyChainIssues: { type: string; cellId: number; status: CellStatus; details: string }[] = [];
    if (daisyChainData && typeof daisyChainData === 'object' && !Array.isArray(daisyChainData)) {
      Object.entries(daisyChainData).forEach(([dcIc, cellData]) => {
        Object.entries(cellData).forEach(([cellNo, dataItems]) => {
          const cellId = parseInt(cellNo);
          const status = getDaisyChainStatus(dataItems);
          if (status === 'warning' || status === 'critical') {
            const voltageItem = dataItems.find(item => item.command === 'get_dc_csu_volt');
            const tempItem = dataItems.find(item => item.command === 'get_dc_csu_temp');
            const details = `Voltage: ${voltageItem ? voltageItem.value : 'N/A'}V, Temperature: ${tempItem ? tempItem.value : 'N/A'}, Daisy Chain: ${dataItems.find(item => item.command === 'get_dc_csu_ow')?.value ?? 'N/A'}`;
            daisyChainIssues.push({
              type: `Daisy Chain (IC ${dcIc})`,
              cellId,
              status,
              details,
            });
          }
        });
      });
    }

    // Combine errors and warnings
    const combinedErrors = [
      ...newErrors,
      ...daisyChainIssues.filter(issue => issue.status === 'critical'),
    ];
    const combinedWarnings = [
      ...newWarnings,
      ...daisyChainIssues.filter(issue => issue.status === 'warning'),
    ];

    // Update state only if necessary
    if (
      combinedErrors.length !== errors.length ||
      combinedErrors.some((item, i) => item !== errors[i])
    ) {
      console.log('ErrorWarningPanel: Updating errors', combinedErrors);
      setErrors(combinedErrors);
    }

    if (
      combinedWarnings.length !== warnings.length ||
      combinedWarnings.some((item, i) => item !== warnings[i])
    ) {
      console.log('ErrorWarningPanel: Updating warnings', combinedWarnings);
      setWarnings(combinedWarnings);
    }
  }, [allCells, daisyChainData, errors, warnings]);

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
                    Voltage: <span className="font-medium">{item.voltage?.toFixed(2) ?? '-'}</span>,
                    Temp: <span className="font-medium">{item.temperature?.toFixed(1) ?? '-'}</span>
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
                    Voltage: <span className="font-medium">{item.voltage?.toFixed(2) ?? '-'}</span>,
                    Temp: <span className="font-medium">{item.temperature?.toFixed(1) ?? '-'}</span>
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

      {/* {errors.length === 0 && warnings.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          ✅ All cells operating normally.
        </div>
      )} */}
      {allCells.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          No cells data available.
        </div>
      )}
    </div>
  );
};

export default ErrorWarningPanel;









