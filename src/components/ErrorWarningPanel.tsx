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










// import React, { useState, useEffect, useMemo } from 'react';

// type CellStatus = 'normal' | 'warning' | 'critical';

// interface BatteryCell {
//   id: number;
//   voltage: number | null;
//   temperature: number | null;
//   status: CellStatus;
//   setVoltage: number;
//   balancing: boolean;
//   openWire: boolean;
//   data: string | null;
//   voltageLimits: string | null;
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
//                 Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? '-'}V</span>, 
//                 Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? '-'}°C</span>
//                 {cell.balancing && <br />}
//                 {cell.balancing && <span>Balancing: On</span>}
//                 {cell.openWire && <br />}
//                 {cell.openWire && <span>Open Wire: Detected</span>}
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
//                 Voltage: <span className="font-medium">{cell.voltage?.toFixed(2) ?? '-'}V</span>, 
//                 Temp: <span className="font-medium">{cell.temperature?.toFixed(1) ?? '-'}°C</span>
//                 {cell.balancing && <br />}
//                 {cell.balancing && <span>Balancing: On</span>}
//                 {cell.openWire && <br />}
//                 {cell.openWire && <span>Open Wire: Detected</span>}
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
//       {allCells.length === 0 && (
//         <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
//           No cells data available.
//         </div>
//       )}
//     </div>
//   );
// };

// export default ErrorWarningPanel;









import React from "react";
import { BatteryCell, ResponseData } from "../pages/DashBoard";

interface ErrorWarningPanelProps {
  csu1Cells: BatteryCell[];
  csu2Cells: BatteryCell[];
  daisyChainData: Record<number, ResponseData[]> | null | undefined;
}

const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({
  csu1Cells,
  csu2Cells,
  daisyChainData,
}) => {
  // Get daisy chain status
  const getDaisyChainStatus = (dataItems: ResponseData[]): "normal" | "warning" => {
    const daisyChainItem = dataItems.find((item) => item.command === "daisy_chain");
    return daisyChainItem && daisyChainItem.value === "On" ? "warning" : "normal";
  };

  // Filter cells with warnings or errors
  const csu1Issues = csu1Cells.filter(
    (cell) => cell.status === "warning" || cell.status === "critical"
  );
  const csu2Issues = csu2Cells.filter(
    (cell) => cell.status === "warning" || cell.status === "critical"
  );

  // Filter daisy chain cells with warnings
  const daisyChainIssues = daisyChainData && typeof daisyChainData === "object" && !Array.isArray(daisyChainData)
    ? Object.entries(daisyChainData)
        .filter(([, dataItems]) => getDaisyChainStatus(dataItems) === "warning")
        .map(([cellId, dataItems]) => ({ cellId: parseInt(cellId), dataItems }))
    : [];

  // Combine all issues
  const allIssues = [
    ...csu1Issues.map((cell) => ({
      type: "CSU1",
      cellId: cell.id,
      status: cell.status,
      details: `Voltage: ${cell.voltage ?? "N/A"}V, Temperature: ${cell.temperature ?? "N/A"}°C`,
    })),
    ...csu2Issues.map((cell) => ({
      type: "CSU2",
      cellId: cell.id,
      status: cell.status,
      details: `Voltage: ${cell.voltage ?? "N/A"}V, Temperature: ${cell.temperature ?? "N/A"}°C`,
    })),
    ...daisyChainIssues.map((issue) => ({
      type: "Daisy Chain",
      cellId: issue.cellId,
      status: getDaisyChainStatus(issue.dataItems),
      details: `Daisy Chain: ${
        issue.dataItems.find((item) => item.command === "daisy_chain")?.value ?? "N/A"
      }`,
    })),
  ];

  const statusColors = {
    normal: "bg-green-100 text-green-800 border-green-300",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-300",
    critical: "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className="p-4 bg-white rounded-md shadow-md">
      <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
        Error & Warning Panel
      </h2>
      {allIssues.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allIssues.map((issue, index) => (
            <div
              key={`${issue.type}-${issue.cellId}`}
              className={`p-3 rounded-md shadow-sm border-l-4 ${
                statusColors[issue.status]
              }`}
            >
              <h3 className="text-sm font-medium text-gray-700">
                {issue.type} Cell {issue.cellId}
              </h3>
              <p className="text-xs text-gray-600 mt-1">{issue.details}</p>
              <p className="text-xs font-semibold mt-1 capitalize">
                Status: {issue.status}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500">No errors or warnings detected.</p>
      )}
    </div>
  );
};

export default ErrorWarningPanel;