// import React, { useState, useEffect } from 'react';

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

//   useEffect(() => {
//     const allCells = [...csu1Cells, ...csu2Cells];
//     setErrors(allCells.filter(cell => cell.status === 'critical'));
//     setWarnings(allCells.filter(cell => cell.status === 'warning'));
//   }, [csu1Cells, csu2Cells]);

//   return (
//     <div className="w-full bg-gray-200 p-4 mt-4 rounded-lg shadow-lg overflow-y-auto" style={{ height: 'calc(20vh - 20px)' }}>
//       <h2 className="text-xl font-bold mb-2">Errors and Warnings</h2>
//       {errors.length > 0 && (
//         <div className="mb-4">
//           <h3 className="text-lg font-semibold text-red-600">Errors (Critical):</h3>
//           <ul className="list-disc pl-5 text-sm">
//             {errors.map((cell) => (
//               <li key={cell.id}>Cell {cell.id} (CSU {cell.id < 12 ? 1 : 2}): {cell.voltage.toFixed(2)}V, {cell.temperature}°C</li>
//             ))}
//           </ul>
//         </div>
//       )}
//       {warnings.length > 0 && (
//         <div>
//           <h3 className="text-lg font-semibold text-yellow-600">Warnings:</h3>
//           <ul className="list-disc pl-5 text-sm">
//             {warnings.map((cell) => (
//               <li key={cell.id}>Cell {cell.id} (CSU {cell.id < 12 ? 1 : 2}): {cell.voltage.toFixed(2)}V, {cell.temperature}°C</li>
//             ))}
//           </ul>
//         </div>
//       )}
//       {errors.length === 0 && warnings.length === 0 && (
//         <p className="text-gray-500 text-sm">No errors or warnings detected.</p>
//       )}
//     </div>
//   );
// };

// export default ErrorWarningPanel;



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
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-md mt-4 space-y-4 overflow-y-auto" style={{ height: 'calc(22vh - 20px)' }}>
      <h2 className="text-xl font-bold text-gray-800">⚠️ Errors and Warnings</h2>

      {errors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            🔴 Critical Errors <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{errors.length}</span>
          </h3>
          <ul className="space-y-2">
            {errors.map((cell) => (
              <li
                key={cell.id}
                className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 shadow-sm"
              >
                <strong>Cell {cell.id}</strong> (CSU {cell.id < 12 ? 1 : 2})<br />
                Voltage: <span className="font-medium">{cell.voltage.toFixed(2)}V</span>, Temp: <span className="font-medium">{cell.temperature}°C</span>
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
            {warnings.map((cell) => (
              <li
                key={cell.id}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 shadow-sm"
              >
                <strong>Cell {cell.id}</strong> (CSU {cell.id < 12 ? 1 : 2})<br />
                Voltage: <span className="font-medium">{cell.voltage.toFixed(2)}V</span>, Temp: <span className="font-medium">{cell.temperature}°C</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          ✅ All cells operating normally.
        </div>
      )}
    </div>
  );
};

export default ErrorWarningPanel;
