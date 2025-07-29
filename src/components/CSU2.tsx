// import React, { useEffect, useState, useRef } from "react";
// import { ResponseData } from "./test";

// const CSU2: React.FC = () => {
//   const [csu2Data, setCsu2Data] = useState<Record<number, ResponseData[]>>({});
//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   useEffect(() => {
//     const handleUpdate = (event: Event) => {
//       const data = (event as CustomEvent).detail;
//       if (data && typeof data === "object" && !Array.isArray(data)) {
//         setCsu2Data(data as Record<number, ResponseData[]>);
//       } else {
//         console.warn("CSU2: Invalid responseData format received:", data);
//       }
//     };

//     window.addEventListener("csu2CellsUpdate", handleUpdate);
//     return () => window.removeEventListener("csu2CellsUpdate", handleUpdate);
//   }, []);

//   const getCellStatus = (dataItems: ResponseData[]) => {
//     const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
//     const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");
//     const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//     const temp = tempItem ? parseFloat(tempItem.value) : null;

//     if (voltage !== null && voltage < 3.3) return "critical";
//     if (voltage !== null && voltage < 3.5) return "warning";
//     if (temp !== null && temp > 60) return "critical";
//     if (temp !== null && temp > 45) return "warning";
//     if (dataItems == null || dataItems.length === 0) return "N/A";
//     return "normal";
//   };

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   // Generate 12 cells with IDs from 0 to 11
//   const cellIds = Array.from({ length: 12 }, (_, i) => i);

//   // Split into 4 rows of 3 cells each
//   const rows = [
//     cellIds.slice(0, 3),
//     cellIds.slice(3, 6),
//     cellIds.slice(6, 9),
//     cellIds.slice(9, 12),
//   ];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-gray-200 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU2
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu2Data[cellId] || [];
//                 const status = getCellStatus(dataItems);
//                 const statusColors = {
//                   normal: "bg-green-100 text-green-800",
//                   warning: "bg-yellow-100 text-yellow-800",
//                   critical: "bg-red-100 text-red-800",
//                   "N/A": "bg-gray-100 text-gray-800",
//                 };
//                 const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
//                 const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");

//                 // Calculate popup position
//                 const cellRef = cellRefs.current[cellId];
//                 const popupStyle: React.CSSProperties = cellRef
//                   ? {
//                       position: "absolute",
//                       top: `${cellRef.offsetTop + cellRef.offsetHeight}px`,
//                       left: `${cellRef.offsetLeft}px`,
//                       zIndex: 10,
//                     }
//                   : {};

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span
//                           className={
//                             voltageItem &&
//                             (parseFloat(voltageItem.value) > 4.5 ||
//                               (parseFloat(voltageItem.value) < 2.0 && voltageItem.value !== "1"))
//                               ? "text-red-600"
//                               : ""
//                           }
//                         >
//                           {voltageItem ? voltageItem.value : "-"}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T:</span>
//                         <span>{tempItem ? tempItem.value : "-"}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                       </div>
//                     </div>
//                     {selectedCell === cellId && csu2Data[selectedCell] && (
//                       <div
//                         style={popupStyle}
//                         className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//                       >
//                         <div className="flex justify-between items-center mb-2">
//                           <h3 className="text-sm font-semibold text-gray-800">Cell {selectedCell} Details</h3>
//                           <button
//                             className="text-gray-500 hover:text-gray-700 text-sm"
//                             onClick={() => setSelectedCell(null)}
//                           >
//                             ✕
//                           </button>
//                         </div>
//                         <div className="space-y-1.5">
//                           {csu2Data[selectedCell].map((item, idx) => (
//                             <div key={idx} className="flex justify-between items-center">
//                               <span className="text-xs font-medium capitalize">
//                                 {item.command
//                                   .replace("get_", "")
//                                   .replace("_12_csu_", "CSU12 ")
//                                   .replace(/_/g, " ")}
//                               </span>
//                               <span
//                                 className={`text-xs font-semibold ${
//                                   item.command.includes("volt")
//                                     ? parseFloat(item.value) > 4.5 ||
//                                       (parseFloat(item.value) < 2.0 && item.value !== "1")
//                                       ? "text-red-600"
//                                       : ""
//                                     : ""
//                                 }`}
//                               >
//                                 {item.value}
//                               </span>
//                             </div>
//                           ))}
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//         {Object.keys(csu2Data).length === 0 && (
//           <p className="text-center text-gray-500 mt-3">No data available.</p>
//         )}
//       </div>
//       <style>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(-10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in {
//           animation: fade-in 0.2s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CSU2;












//update with dc data
import React, { useState, useRef } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const CSU2: React.FC = () => {
  const { csu2ResponseData } = useBatteryContext();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getCellStatus = (dataItems: ResponseData[]) => {
    const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
    const tempItem = dataItems.find((item) => item.command === 'get_12_csu_temp');
    const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
    const temp = tempItem ? parseFloat(tempItem.value.replace(' °C', '')) : null;

    if (voltage !== null && voltage < 3.3) return 'critical';
    if (voltage !== null && voltage < 3.5) return 'warning';
    if (temp !== null && temp > 60) return 'critical';
    if (temp !== null && temp > 45) return 'warning';
    if (dataItems.length === 0) return 'N/A';
    return 'normal';
  };

  const handleCellClick = (cellId: number) => {
    setSelectedCell(selectedCell === cellId ? null : cellId);
  };

  const cellIds = Array.from({ length: 12 }, (_, i) => i);
  const rows = [
    cellIds.slice(0, 3),
    cellIds.slice(3, 6),
    cellIds.slice(6, 9),
    cellIds.slice(9, 12),
  ];

  return (
    <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-gray-200 rounded-md">
      <div className="w-full max-w-6xl relative">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          CSU2
        </h2>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((cellId) => {
                const dataItems = csu2ResponseData[cellId] || [];
                const status = getCellStatus(dataItems);
                const statusColors = {
                  normal: 'bg-green-100 text-green-800',
                  warning: 'bg-yellow-100 text-yellow-800',
                  critical: 'bg-red-100 text-red-800',
                  'N/A': 'bg-gray-100 text-gray-800',
                };
                const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
                const tempItem = dataItems.find((item) => item.command === 'get_12_csu_temp');

                const cellRef = cellRefs.current[cellId];
                const popupStyle: React.CSSProperties = cellRef
                  ? {
                      position: 'absolute',
                      top: `${cellRef.offsetTop + cellRef.offsetHeight}px`,
                      left: `${cellRef.offsetLeft}px`,
                      zIndex: 10,
                    }
                  : {};

                return (
                  <div
                    key={cellId}
                    ref={(el) => (cellRefs.current[cellId] = el)}
                    className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
                    onClick={() => handleCellClick(cellId)}
                  >
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span>V:</span>
                        <span
                          className={
                            voltageItem &&
                            (parseFloat(voltageItem.value) > 4.5 ||
                              (parseFloat(voltageItem.value) < 2.0 && voltageItem.value !== '1'))
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {voltageItem ? voltageItem.value : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>T:</span>
                        <span>{tempItem ? tempItem.value : '-'}</span>
                      </div>
                      <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
                        <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </div>
                    </div>
                    {selectedCell === cellId && csu2ResponseData[selectedCell] && (
                      <div
                        style={popupStyle}
                        className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-semibold text-gray-800">Cell {selectedCell} Details</h3>
                          <button
                            className="text-gray-500 hover:text-gray-700 text-sm"
                            onClick={() => setSelectedCell(null)}
                          >
                            ✕
                          </button>
                        </div>
                        <div className="space-y-1.5">
                          {csu2ResponseData[selectedCell].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-xs font-medium capitalize">
                                {item.command
                                  .replace('get_', '')
                                  .replace('_12_csu_', 'CSU12 ')
                                  .replace(/_/g, ' ')}
                              </span>
                              <span
                                className={`text-xs font-semibold ${
                                  item.command.includes('volt')
                                    ? parseFloat(item.value) > 4.5 ||
                                      (parseFloat(item.value) < 2.0 && item.value !== '1')
                                      ? 'text-red-600'
                                      : ''
                                    : ''
                                }`}
                              >
                                {item.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {Object.keys(csu2ResponseData).length === 0 && (
          <p className="text-center text-gray-500 mt-3">No data available.</p>
        )}
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CSU2;