// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const { csu1ResponseData, responseData, setCsu1Statuses, setCriticalState } = useBatteryContext();
//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const [cachedData, setCachedData] = useState<{
//     expectedVoltages: (number | null)[];
//     actualVoltages: (string | null)[];
//   }>({
//     expectedVoltages: Array(12).fill(null),
//     actualVoltages: Array(12).fill(null),
//   });
//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const prevResponseData = useRef(responseData);
//   const prevCsu1ResponseData = useRef(csu1ResponseData);

//   // Initialize warningStates for all cells
//   const warningStates = useRef<{ [key: number]: { responseDataInvalid: boolean; csu1DataInvalid: boolean } }>(
//     Array.from({ length: 12 }, (_, i) => ({
//       responseDataInvalid: false,
//       csu1DataInvalid: false,
//     }))
//   );

//   // Track previous cell states to log only when data changes
//   const prevCellStates = useRef(
//     Array.from({ length: 12 }, (_, i) => ({
//       expected: null as number | null,
//       actual: null as string | null,
//       status: null as string | null,
//     }))
//   );

//   // Memoized getCellStatus function
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;

//       if (voltage !== null && expectedVoltage !== null) {
//         const voltageGap = Math.abs(expectedVoltage - voltage);
//         if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//         if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       }
//       return dataItems.length === 0 ? 'N/A' : 'normal';
//     },
//     []
//   );

//   // Memoized getExpectedVoltage function with validation
//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId + 12; // CSU1 -> global 12–23
//       const cellData = responseData[globalCellId];
//       const prevInvalid = warningStates.current[cellId].responseDataInvalid;

//       if (!Array.isArray(cellData)) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId] ?? null;
//       }

//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId] ?? null;
//       }

//       const parsedVoltage = parseFloat(voltageData.value);
//       if (isNaN(parsedVoltage)) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId] ?? null;
//       }

//       warningStates.current[cellId].responseDataInvalid = false;
//       return parsedVoltage;
//     },
//     [responseData, cachedData.expectedVoltages]
//   );

//   // Memoized getActualVoltage function
//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       const prevInvalid = warningStates.current[cellId].csu1DataInvalid;
//       const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
//       if (voltageItem && voltageItem.value) {
//         warningStates.current[cellId].csu1DataInvalid = false;
//         return voltageItem.value;
//       }
//       if (!prevInvalid) {
//         console.warn(`[${new Date().toISOString()}] No get_11_csu_volt for cell ${cellId}:`, dataItems);
//         warningStates.current[cellId].csu1DataInvalid = true;
//       }
//       return cachedData.actualVoltages[cellId] ?? null;
//     },
//     [cachedData.actualVoltages]
//   );

//   // Effect for logging large payloads only when data changes
//   useEffect(() => {
//     if (
//       JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//       JSON.stringify(csu1ResponseData) !== JSON.stringify(prevCsu1ResponseData.current)
//     ) {
//       console.log(`[${new Date().toISOString()}] CSU1 Response Data:`, JSON.stringify(csu1ResponseData, null, 2));
//       console.log(`[${new Date().toISOString()}] Global Response Data:`, JSON.stringify(responseData, null, 2));
//       prevResponseData.current = responseData;
//       prevCsu1ResponseData.current = csu1ResponseData;
//     }
//   }, [responseData, csu1ResponseData]);

//   // Effect for updating statuses and cache
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       const newExpectedVoltages = [...cachedData.expectedVoltages];
//       const newActualVoltages = [...cachedData.actualVoltages];
//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const expectedVoltage = getExpectedVoltage(cellId);
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         // Update cache only if changed
//         newExpectedVoltages[cellId] =
//           expectedVoltage !== cachedData.expectedVoltages[cellId] ? expectedVoltage : cachedData.expectedVoltages[cellId];
//         newActualVoltages[cellId] =
//           actualVoltage !== cachedData.actualVoltages[cellId] ? actualVoltage : cachedData.actualVoltages[cellId];

//         // Log only when expected/actual/status changes and not N/A
//         const prev = prevCellStates.current[cellId];
//         if (prev.expected !== expectedVoltage || prev.actual !== actualVoltage || prev.status !== status) {
//           if (status !== 'N/A') {
//             console.log(
//               `[${new Date().toISOString()}] Cell ${cellId} - Expected Voltage: ${expectedVoltage ?? '-'}, Actual Voltage: ${actualVoltage ?? '-'}, Status: ${status}`
//             );
//           }
//           prevCellStates.current[cellId] = { expected: expectedVoltage, actual: actualVoltage, status };
//         }

//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : 'No expected voltage data',
//         };
//       });

//       setCachedData({
//         expectedVoltages: newExpectedVoltages,
//         actualVoltages: newActualVoltages,
//       });

//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) {
//         console.log(`[${new Date().toISOString()}] Critical state detected in CSU1`);
//         setCriticalState(true);
//       }
//     }, 500);

//     return () => clearTimeout(debounce);
//   }, [csu1ResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setCsu1Statuses, setCriticalState]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [
//     cellIds.slice(0, 3),
//     cellIds.slice(3, 6),
//     cellIds.slice(6, 9),
//     cellIds.slice(9, 12),
//   ];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
//                 const actualVoltage = cachedData.actualVoltages[cellId] ?? getActualVoltage(cellId, dataItems);
//                 const status = getCellStatus(dataItems, expectedVoltage);
//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const cellRef = cellRefs.current[cellId];
//                 const popupStyle: React.CSSProperties = cellRef
//                   ? {
//                       position: 'absolute',
//                       top: `${cellRef.offsetTop + cellRef.offsetHeight}px`,
//                       left: `${cellRef.offsetLeft}px`,
//                       zIndex: 10,
//                     }
//                   : {};

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span
//                           className={
//                             actualVoltage &&
//                             (parseFloat(actualVoltage) > 4.5 ||
//                               (parseFloat(actualVoltage) < 2.0 && actualVoltage !== '1'))
//                               ? 'text-red-600'
//                               : ''
//                           }
//                         >
//                           {actualVoltage ?? '-'}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                       </div>
//                     </div>
//                     {selectedCell === cellId && csu1ResponseData[selectedCell] && (
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
//                           {csu1ResponseData[selectedCell].map((item, idx) => (
//                             <div key={idx} className="flex justify-between items-center">
//                               <span className="text-xs font-medium capitalize">
//                                 {item.command
//                                   .replace('get_', '')
//                                   .replace('_11_csu_', 'CSU11 ')
//                                   .replace(/_/g, ' ')}
//                               </span>
//                               <span
//                                 className={`text-xs font-semibold ${
//                                   item.command.includes('volt')
//                                     ? parseFloat(item.value) > 4.5 ||
//                                       (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                       ? 'text-red-600'
//                                       : ''
//                                     : ''
//                                 }`}
//                               >
//                                 {item.value}
//                               </span>
//                             </div>
//                           ))}
//                           <div className="flex justify-between items-center">
//                             <span className="text-xs font-medium">Tester Volt:</span>
//                             <span className="text-xs font-semibold">
//                               {expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
//                             </span>
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//         {Object.keys(csu1ResponseData).length === 0 && (
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

// export default CSU1;

// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const {
//     csu1ResponseData,
//     responseData,
//     setCsu1Statuses,
//     setCriticalState,
//     resetStatus,
//     setCsu1ResponseData,
//   } = useBatteryContext();

//   const [selectedCell, setSelectedCell] = useState<number | null>(null);

//   // Cached expected voltages
//   const [cachedData, setCachedData] = useState<{ expectedVoltages: (number | null)[] }>({
//     expectedVoltages: Array(12).fill(null),
//   });

//   const [cellStates, setCellStates] = useState(
//     Array.from({ length: 12 }, () => ({
//       actual: { value: null as string | null, timestamp: 0 as number },
//       status: null as string | null,
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const prevResponseData = useRef(responseData);
//   const prevCsu1ResponseData = useRef(csu1ResponseData);

//   // ---- Helpers ----
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: parseFloat(item.value),
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
//       if (latestVoltage === null) return 'N/A';

//       const voltageGap = Math.abs(expectedVoltage - latestVoltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       return 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId + 12; // CSU1 -> global 12–23
//       const cellData = responseData[globalCellId];
//       if (!Array.isArray(cellData)) return null;
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       return voltageData ? parseFloat(voltageData.value) : null;
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   const getDisplayVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   // ---- Update effect ----
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       if (resetStatus) {
//         setCachedData({ expectedVoltages: Array(12).fill(null) });
//         setCellStates(Array.from({ length: 12 }, () => ({ actual: { value: null, timestamp: 0 }, status: null })));
//         setCsu1ResponseData({});
//         setCsu1Statuses([]);
//         console.log(`[${new Date().toISOString()}] CSU1 reset`);
//         return;
//       }

//       if (
//         JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//         JSON.stringify(csu1ResponseData) !== JSON.stringify(prevCsu1ResponseData.current)
//       ) {
//         console.log(`[${new Date().toISOString()}] CSU1 Response Data:`, csu1ResponseData);
//         prevResponseData.current = responseData;
//         prevCsu1ResponseData.current = csu1ResponseData;
//       }

//       const newExpectedVoltages = Array(12)
//         .fill(null)
//         .map((_, cellId) => cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId));

//       const updatedCellStates = [...cellStates];

//       for (let cellId = 0; cellId < 12; cellId++) {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const voltageItems = dataItems
//           .filter((item) => item.command === 'get_11_csu_volt')
//           .map(item => ({
//             value: item.value,
//             timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//           }))
//           .sort((a, b) => a.timestamp - b.timestamp);

//         const actualVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//         const prevActual = cellStates[cellId].actual;

//         // Update actual voltage
//         if (actualVoltage && (prevActual.value !== actualVoltage.value || prevActual.timestamp !== actualVoltage.timestamp)) {
//           console.log(
//             `[${new Date().toISOString()}] Actual voltage changed for cell ${cellId}: ${prevActual.value} -> ${actualVoltage.value}`
//           );
//           updatedCellStates[cellId] = { ...updatedCellStates[cellId], actual: actualVoltage };
//           // Reset tester voltage when new actual voltage comes
//           const newCached = [...newExpectedVoltages];
//           newCached[cellId] = null;
//           setCachedData({ expectedVoltages: newCached });
//         }
//       }

//       // Build statuses
//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : actualVoltage
//               ? `Voltage: ${actualVoltage} (No expected voltage data)`
//               : cellStates[cellId].actual.value
//               ? `Last Voltage: ${cellStates[cellId].actual.value} (No current data)`
//               : 'No voltage data available',
//         };
//       });

//       setCellStates(updatedCellStates);
//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) setCriticalState(true);
//     }, 1000);

//     return () => clearTimeout(debounce);
//   }, [
//     csu1ResponseData,
//     responseData,
//     resetStatus,
//     setCsu1Statuses,
//     setCriticalState,
//     setCsu1ResponseData,
//     getCellStatus,
//     getExpectedVoltage,
//     getActualVoltage,
//     cellStates,
//     cachedData,
//   ]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
//                 const displayVoltage = getDisplayVoltage(cellId, dataItems);
//                 const currentActualVoltage = getActualVoltage(cellId, dataItems);
//                 const status = getCellStatus(dataItems, expectedVoltage);
//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const cellRef = cellRefs.current[cellId];
//                 const popupStyle: React.CSSProperties = cellRef
//                   ? {
//                       position: 'absolute',
//                       top: `${cellRef.offsetTop + cellRef.offsetHeight}px`,
//                       left: `${cellRef.offsetLeft}px`,
//                       zIndex: 10,
//                     }
//                   : {};

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span
//                           className={
//                             displayVoltage &&
//                             displayVoltage !== '-' &&
//                             (parseFloat(displayVoltage) > 4.5 ||
//                               (parseFloat(displayVoltage) < 2.0 && displayVoltage !== '1'))
//                               ? 'text-red-600'
//                               : currentActualVoltage === null && displayVoltage !== '-'
//                               ? 'text-gray-500 italic'
//                               : ''
//                           }
//                         >
//                           {displayVoltage ?? '-'}
//                           {currentActualVoltage === null && displayVoltage !== '-' && ' (last)'}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">
//                           {status.charAt(0).toUpperCase() + status.slice(1)}
//                           {currentActualVoltage === null && status !== 'N/A' ? ' (last)' : ''}
//                         </span>
//                       </div>
//                     </div>

//                     {selectedCell === cellId &&
//                       csu1ResponseData[selectedCell] &&
//                       csu1ResponseData[selectedCell].length > 0 && (
//                         <div
//                           style={popupStyle}
//                           className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//                         >
//                           <div className="flex justify-between items-center mb-2">
//                             <h3 className="text-sm font-semibold text-gray-800">Cell {selectedCell} Details</h3>
//                             <button
//                               className="text-gray-500 hover:text-gray-700 text-sm"
//                               onClick={() => setSelectedCell(null)}
//                             >
//                               ✕
//                             </button>
//                           </div>
//                           <div className="space-y-1.5">
//                             {[...csu1ResponseData[selectedCell]
//                               .filter((item) => item.command === 'get_11_csu_volt')
//                               .map((item) => ({
//                                 ...item,
//                                 timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//                               }))
//                               .sort((a, b) => a.timestamp - b.timestamp)
//                             ].reverse().map((item, idx) => {
//                               const currentActual = cellStates[selectedCell]?.actual;
//                               const isLatest = currentActual && currentActual.timestamp === item.timestamp;
//                               return (
//                                 <div key={idx} className="flex justify-between items-center">
//                                   <span className="text-xs font-medium capitalize">
//                                     {item.command
//                                       .replace('get_', '')
//                                       .replace('_11_csu_', 'CSU11 ')
//                                       .replace(/_/g, ' ')}
//                                   </span>
//                                   <span
//                                     className={`text-xs font-semibold ${
//                                       isLatest
//                                         ? 'text-green-600 font-bold'
//                                         : parseFloat(item.value) > 4.5 ||
//                                           (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                         ? 'text-red-600'
//                                         : ''
//                                     }`}
//                                   >
//                                     {item.value} {isLatest && '(Latest)'}
//                                   </span>
//                                 </div>
//                               );
//                             })}
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs font-medium">Tester Volt:</span>
//                               <span className="text-xs font-semibold">
//                                 {expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
//                               </span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs font-medium">Data Status:</span>
//                               <span className="text-xs font-semibold">
//                                 {currentActualVoltage === null ? 'Last Known Value' : 'Current Value'}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>

//         {Object.keys(csu1ResponseData).length === 0 && (
//           <p className="text-center text-gray-500 mt-3">No data available.</p>
//         )}
//       </div>

//       <style>{`
//         @keyframes fade-in {
//           from { opacity: 0; transform: translateY(-10px); }
//           to { opacity: 1; transform: translateY(0); }
//         }
//         .animate-fade-in { animation: fade-in 0.2s ease-out; }
//       `}</style>
//     </div>
//   );
// };

// export default CSU1;










//something okay
/* eslint-disable */
/* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const {
//     csu1ResponseData,
//     responseData,
//     setCsu1Statuses,
//     setCriticalState,
//     resetStatus,
//     setCsu1ResponseData,
//   } = useBatteryContext();

//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const [cellStates, setCellStates] = useState(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: { value: null as string | null, timestamp: 0 as number },
//       status: null as string | null,
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const prevResponseData = useRef(responseData);
//   const prevCsu1ResponseData = useRef(csu1ResponseData);

//   // ---- Helpers ----
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: parseFloat(item.value),
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
//       if (latestVoltage === null) return 'N/A';

//       const voltageGap = Math.abs(expectedVoltage - latestVoltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       return 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId + 12; // CSU1 -> global 12–23
//       const cellData = responseData[globalCellId];
//       if (!Array.isArray(cellData)) {
//         console.warn(`[${new Date().toISOString()}] No valid cellData for globalCellId ${globalCellId}`);
//         return null;
//       }
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value || isNaN(parseFloat(voltageData.value))) {
//         console.warn(`[${new Date().toISOString()}] Invalid get_voltage for globalCellId ${globalCellId}:`, voltageData);
//         return null;
//       }
//       return parseFloat(voltageData.value);
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) {
//         console.warn(`[${new Date().toISOString()}] No valid dataItems for cell ${cellId}`);
//         return cellStates[cellId].actual.value;
//       }
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   const getDisplayVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   // Update effect
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       // Log data changes for debugging
//       if (
//         JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//         JSON.stringify(csu1ResponseData) !== JSON.stringify(prevCsu1ResponseData.current)
//       ) {
//         console.log(`[${new Date().toISOString()}] CSU1 Response Data:`, csu1ResponseData);
//         prevResponseData.current = responseData;
//         prevCsu1ResponseData.current = csu1ResponseData;
//       }

//       const updatedCellStates = [...cellStates];
//       for (let cellId = 0; cellId < 12; cellId++) {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const voltageItems = dataItems
//           .filter((item) => item.command === 'get_11_csu_volt')
//           .map(item => ({
//             value: item.value,
//             timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//           }))
//           .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//         const actualVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//         const prevActual = cellStates[cellId].actual;

//         // Detect new actual voltage and reset tester voltage
//         if (
//           actualVoltage &&
//           (prevActual.value !== actualVoltage.value || prevActual.timestamp !== actualVoltage.timestamp)
//         ) {
//           console.log(
//             `[${new Date().toISOString()}] New actual voltage for cell ${cellId}: ${prevActual.value || '-'} -> ${actualVoltage.value} (Timestamp: ${new Date(actualVoltage.timestamp).toISOString()}), resetting tester voltage`
//           );
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             expected: null, // Reset tester voltage
//             actual: actualVoltage,
//           };
//         } else if (!actualVoltage && prevActual.value) {
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: { value: null, timestamp: 0 },
//           };
//         }

//         // Fetch new expected voltage if not set
//         if (updatedCellStates[cellId].expected === null) {
//           const expectedVoltage = getExpectedVoltage(cellId);
//           if (expectedVoltage !== cellStates[cellId].expected) {
//             console.log(
//               `[${new Date().toISOString()}] Tester voltage updated for cell ${cellId}: ${cellStates[cellId].expected || '-'} -> ${expectedVoltage || '-'}`
//             );
//             updatedCellStates[cellId] = {
//               ...updatedCellStates[cellId],
//               expected: expectedVoltage,
//             };
//           }
//         }
//       }

//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const expectedVoltage = updatedCellStates[cellId].expected;
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : actualVoltage
//               ? `Voltage: ${actualVoltage} (No expected voltage data)`
//               : cellStates[cellId].actual.value
//               ? `Last Voltage: ${cellStates[cellId].actual.value} (No current data)`
//               : 'No voltage data available',
//         };
//       });

//       setCellStates(updatedCellStates);
//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) {
//         console.log(`[${new Date().toISOString()}] Critical state detected in CSU1`);
//         setCriticalState(true);
//       }
//     }, 1000); // Reduced debounce for faster UI updates

//     return () => clearTimeout(debounce);
//   }, [csu1ResponseData, responseData, setCsu1Statuses, setCriticalState, getCellStatus, getActualVoltage, cellStates]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [
//     cellIds.slice(0, 3),
//     cellIds.slice(3, 6),
//     cellIds.slice(6, 9),
//     cellIds.slice(9, 12),
//   ];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = cellStates[cellId].expected;
//                 const displayVoltage = getDisplayVoltage(cellId, dataItems);
//                 const currentActualVoltage = getActualVoltage(cellId, dataItems);
//                 const status = getCellStatus(dataItems, expectedVoltage);
//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const cellRef = cellRefs.current[cellId];
//                 const popupStyle: React.CSSProperties = cellRef
//                   ? {
//                       position: 'absolute',
//                       top: `${cellRef.offsetTop + cellRef.offsetHeight}px`,
//                       left: `${cellRef.offsetLeft}px`,
//                       zIndex: 10,
//                     }
//                   : {};

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span
//                           className={
//                             displayVoltage &&
//                             displayVoltage !== '-' &&
//                             (parseFloat(displayVoltage) > 4.5 ||
//                               (parseFloat(displayVoltage) < 2.0 && displayVoltage !== '1'))
//                               ? 'text-red-600'
//                               : currentActualVoltage === null && displayVoltage !== '-'
//                               ? 'text-gray-500 italic'
//                               : ''
//                           }
//                         >
//                           {displayVoltage ?? '-'}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">
//                           {status.charAt(0).toUpperCase() + status.slice(1)}
//                         </span>
//                       </div>
//                     </div>

//                     {selectedCell === cellId &&
//                       csu1ResponseData[selectedCell] &&
//                       csu1ResponseData[selectedCell].length > 0 && (
//                         <div
//                           style={popupStyle}
//                           className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//                         >
//                           <div className="flex justify-between items-center mb-2">
//                             <h3 className="text-sm font-semibold text-gray-800">Cell {selectedCell} Details</h3>
//                             <button
//                               className="text-gray-500 hover:text-gray-700 text-sm"
//                               onClick={() => setSelectedCell(null)}
//                             >
//                               ✕
//                             </button>
//                           </div>
//                           <div className="space-y-1.5">
//                             {[...csu1ResponseData[selectedCell]
//                               .filter((item) => item.command === 'get_11_csu_volt')
//                               .map((item) => ({
//                                 ...item,
//                                 timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//                               }))
//                               .sort((a, b) => a.timestamp - b.timestamp) // Sort ascending
//                             ].reverse().map((item, idx) => {
//                               const currentActual = cellStates[selectedCell]?.actual;
//                               const isLatest = currentActual && currentActual.timestamp === item.timestamp;
//                               return (
//                                 <div key={idx} className="flex justify-between items-center">
//                                   <span className="text-xs font-medium capitalize">
//                                     {item.command
//                                       .replace('get_', '')
//                                       .replace('_11_csu_', 'CSU11 ')
//                                       .replace(/_/g, ' ')}
//                                   </span>
//                                   <span
//                                     className={`text-xs font-semibold ${
//                                       isLatest
//                                         ? 'text-green-600 font-bold'
//                                         : parseFloat(item.value) > 4.5 ||
//                                           (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                         ? 'text-red-600'
//                                         : ''
//                                     }`}
//                                   >
//                                     {item.value} {isLatest && '(Latest)'}
//                                   </span>
//                                 </div>
//                               );
//                             })}
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs font-medium">Tester Volt:</span>
//                               <span className="text-xs font-semibold">
//                                 {expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
//                               </span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                               <span className="text-xs font-medium">Data Status:</span>
//                               <span className="text-xs font-semibold">
//                                 {currentActualVoltage === null ? 'Last Known Value' : 'Current Value'}
//                               </span>
//                             </div>
//                           </div>
//                         </div>
//                       )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>

//         {Object.keys(csu1ResponseData).length === 0 && (
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

// export default CSU1;

//verry good
/* eslint-disable */
/* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const {
//     csu1ResponseData,
//     responseData,
//     setCsu1Statuses,
//     setCriticalState,
//   } = useBatteryContext();

//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const [cellStates, setCellStates] = useState(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: { value: null as string | null, timestamp: 0 as number },
//       status: null as string | null,
//       hideTester: false, // hide flag for T.V.
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: parseFloat(item.value),
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
//       if (latestVoltage === null) return 'N/A';

//       const voltageGap = Math.abs(expectedVoltage - latestVoltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       return 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId + 12;
//       const cellData = responseData[globalCellId];
//       if (!Array.isArray(cellData)) return null;
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value || isNaN(parseFloat(voltageData.value))) return null;
//       return parseFloat(voltageData.value);
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       const updatedCellStates = [...cellStates];

//       for (let cellId = 0; cellId < 12; cellId++) {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const voltageItems = dataItems
//           .filter((item) => item.command === 'get_11_csu_volt')
//           .map((item) => ({
//             value: item.value,
//             timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//           }))
//           .sort((a, b) => a.timestamp - b.timestamp);

//         const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//         const prevActual = cellStates[cellId].actual;
//         const expectedVoltage = getExpectedVoltage(cellId);

//         // Update actual voltage
//         if (actualVoltageObj) {
//           const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: actualVoltageObj,
//             expected: expectedVoltage,
//             hideTester: diff > 1.0, // hide T.V. if difference > 1.0
//           };
//         } else if (prevActual.value) {
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: { value: null, timestamp: 0 },
//           };
//         }
//       }

//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const expectedVoltage = updatedCellStates[cellId].expected;
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : actualVoltage
//               ? `Voltage: ${actualVoltage} (No expected voltage data)`
//               : cellStates[cellId].actual.value
//               ? `Last Voltage: ${cellStates[cellId].actual.value} (No current data)`
//               : 'No voltage data available',
//         };
//       });

//       setCellStates(updatedCellStates);
//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) setCriticalState(true);
//     }, 0);

//     return () => clearTimeout(debounce);
//   }, [csu1ResponseData, responseData, getExpectedVoltage, getCellStatus, getActualVoltage, cellStates, setCsu1Statuses, setCriticalState]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = cellStates[cellId].expected;
//                 const displayVoltage = getActualVoltage(cellId, dataItems);
//                 const hideTester = cellStates[cellId].hideTester;

//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const status = getCellStatus(dataItems, expectedVoltage);

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span>{displayVoltage ?? '-'}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{!hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : ''}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CSU1;








//good code
/* eslint-disable */
/* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const {
//     csu1ResponseData,
//     responseData,
//     setCsu1Statuses,
//     setCriticalState,
//   } = useBatteryContext();

//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const [cellStates, setCellStates] = useState(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: { value: null as string | null, timestamp: 0 as number },
//       status: null as string | null,
//       hideTester: false,
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: parseFloat(item.value),
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
//       if (latestVoltage === null) return 'N/A';

//       const voltageGap = Math.abs(expectedVoltage - latestVoltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       return 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId + 12;
//       const cellData = responseData[globalCellId];
//       if (!Array.isArray(cellData)) return null;
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value || isNaN(parseFloat(voltageData.value))) return null;
//       return parseFloat(voltageData.value);
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp);
//       return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//     },
//     [cellStates]
//   );

//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       const updatedCellStates = [...cellStates];

//       // 1️⃣ First: process new actual voltages and hide tester immediately
//       for (let cellId = 0; cellId < 12; cellId++) {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const voltageItems = dataItems
//           .filter((item) => item.command === 'get_11_csu_volt')
//           .map((item) => ({
//             value: item.value,
//             timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//           }))
//           .sort((a, b) => a.timestamp - b.timestamp);

//         const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//         const expectedVoltage = getExpectedVoltage(cellId);

//         if (actualVoltageObj) {
//           const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: actualVoltageObj,
//             expected: expectedVoltage,
//             hideTester: diff > 1.0, // hide immediately
//             status: null,            // reset status immediately
//           };
//         } else {
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: { value: null, timestamp: 0 },
//             hideTester: false,
//             status: null,
//           };
//         }
//       }

//       // 2️⃣ Then: calculate statuses using updated values
//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const expectedVoltage = updatedCellStates[cellId].expected;
//         const status = getCellStatus(dataItems, expectedVoltage);
//         const actualVoltage = getActualVoltage(cellId, dataItems);

//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : actualVoltage
//               ? `Voltage: ${actualVoltage} (No expected voltage data)`
//               : updatedCellStates[cellId].actual.value
//               ? `Last Voltage: ${updatedCellStates[cellId].actual.value} (No current data)`
//               : 'No voltage data available',
//         };
//       });

//       setCellStates(updatedCellStates);
//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) setCriticalState(true);

//     }, 200);

//     return () => clearTimeout(debounce);
//   }, [csu1ResponseData, responseData, getExpectedVoltage, getCellStatus, getActualVoltage, cellStates, setCsu1Statuses, setCriticalState]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = cellStates[cellId].expected;
//                 const displayVoltage = getActualVoltage(cellId, dataItems);
//                 const hideTester = cellStates[cellId].hideTester;

//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const status = cellStates[cellId].status || getCellStatus(dataItems, expectedVoltage);

//                 return (
//                   <div
//                     key={cellId}
//                     ref={(el) => (cellRefs.current[cellId] = el)}
//                     className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
//                     onClick={() => handleCellClick(cellId)}
//                   >
//                     <div className="text-xs">
//                       <div className="flex justify-between">
//                         <span>V:</span>
//                         <span>{displayVoltage ?? '-'}</span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{!hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : ''}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                       </div>
//                     </div>
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CSU1;











/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const DIFF_HIDE_THRESHOLD = 0.01; // hide tester if diff > 0.0001

const CSU1: React.FC = () => {
  const {
    csu1ResponseData,
    responseData,
    setCsu1Statuses,
    setCriticalState,
  } = useBatteryContext();

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cellStates, setCellStates] = useState(
    Array.from({ length: 12 }, () => ({
      expected: null as number | null,
      actual: { value: null as string | null, timestamp: 0 as number },
      status: null as string | null,
      hideTester: false,
    }))
  );

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_11_csu_volt')
        .map((item) => ({
          value: parseFloat(item.value),
          timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
      if (latestVoltage === null) return 'N/A';

      const voltageGap = Math.abs(expectedVoltage - latestVoltage);
      if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
      if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
      return 'normal';
    },
    []
  );

  const getExpectedVoltage = useMemo(
    () => (cellId: number) => {
      const globalCellId = cellId + 12; // CSU1 -> global 12–23
      const cellData = responseData[globalCellId];
      if (!Array.isArray(cellData)) return null;
      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      if (!voltageData || !voltageData.value || isNaN(parseFloat(voltageData.value))) return null;
      return parseFloat(voltageData.value);
    },
    [responseData]
  );

  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_11_csu_volt')
        .map((item) => ({
          value: item.value,
          timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
    },
    [cellStates]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      // Work on a copy of cellStates so we can use the updated values to compute statuses.
      const updatedCellStates = [...cellStates];

      // 1) First pass: apply immediate updates (actual, expected, hideTester, reset status)
      for (let cellId = 0; cellId < 12; cellId++) {
        const dataItems = csu1ResponseData[cellId] || [];
        const voltageItems = dataItems
          .filter((item) => item.command === 'get_11_csu_volt')
          .map((item) => ({
            value: item.value,
            timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
        const expectedVoltage = getExpectedVoltage(cellId);

        if (actualVoltageObj) {
          const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;

          // IMMEDIATE: hide tester if diff > threshold and reset status to 'N/A'
          updatedCellStates[cellId] = {
            ...updatedCellStates[cellId],
            actual: actualVoltageObj,
            expected: expectedVoltage, // store expected but we may hide it in UI via hideTester
            hideTester: diff > DIFF_HIDE_THRESHOLD,
            status: 'N/A', // immediate reset (prevents showing old 'critical')
          };
        } else {
          // No current actual reading -> clear actual and reset flags
          updatedCellStates[cellId] = {
            ...updatedCellStates[cellId],
            actual: { value: null, timestamp: 0 },
            hideTester: false,
            status: 'N/A',
            expected: getExpectedVoltage(cellId),
          };
        }
      }

      // 2) Second pass: calculate statuses using the updatedCellStates (ensures hideTester honored)
      const statuses = Array.from({ length: 12 }, (_, cellId) => {
        const dataItems = csu1ResponseData[cellId] || [];
        const cellState = updatedCellStates[cellId];
        // If tester is hidden for this cell, force 'N/A' (do not compute warning/critical).
        const status = cellState.hideTester
          ? 'N/A'
          : getCellStatus(dataItems, cellState.expected);

        // store computed status back to the updated states so the component render can use it
        updatedCellStates[cellId] = {
          ...cellState,
          status,
        };

        const actualVoltageValue = updatedCellStates[cellId].actual?.value ?? null;
        return {
          label: `CSU1 - Cell ${cellId}`,
          status,
          details:
            actualVoltageValue && cellState.expected !== null && status !== 'N/A'
              ? `Voltage: ${actualVoltageValue} (Expected: ${cellState.expected}V)`
              : actualVoltageValue
              ? `Voltage: ${actualVoltageValue} (No expected voltage data)`
              : updatedCellStates[cellId].actual.value
              ? `Last Voltage: ${updatedCellStates[cellId].actual.value} (No current data)`
              : 'No voltage data available',
        };
      });

      // 3) Commit: update state & statuses (both updated in the same tick)
      setCellStates(updatedCellStates);
      setCsu1Statuses(statuses);

      // setCriticalState should be updated to true/false depending on whether any cell is critical
      const hasCritical = statuses.some((s) => s.status === 'critical');
      setCriticalState(hasCritical);
    }, 150); // small debounce to batch rapid incoming messages

    return () => clearTimeout(debounce);
  }, [
    csu1ResponseData,
    responseData,
    getExpectedVoltage,
    getCellStatus,
    getActualVoltage,
    cellStates,
    setCsu1Statuses,
    setCriticalState,
  ]);

  const handleCellClick = (cellId: number) => {
    setSelectedCell(selectedCell === cellId ? null : cellId);
  };

  const cellIds = Array.from({ length: 12 }, (_, i) => i);
  const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

  return (
    <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
      <div className="w-full max-w-6xl relative">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          CSU11
        </h2>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((cellId) => {
                const dataItems = csu1ResponseData[cellId] || [];
                const state = cellStates[cellId] ?? { expected: null, actual: { value: null }, hideTester: false, status: 'N/A' };
                const expectedVoltage = state.expected;
                const displayVoltage = getActualVoltage(cellId, dataItems);
                const hideTester = state.hideTester;

                const statusColors = {
                  normal: 'bg-green-100 text-green-800',
                  warning: 'bg-yellow-100 text-yellow-800',
                  critical: 'bg-red-100 text-red-800',
                  'N/A': 'bg-gray-100 text-gray-800',
                };

                // Prefer the stored state.status (was set by effect). Only fallback to computed when null.
                const status = state.status ?? getCellStatus(dataItems, expectedVoltage);

                return (
                  <div
                    key={cellId}
                    ref={(el) => (cellRefs.current[cellId] = el)}
                    className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
                    onClick={() => handleCellClick(cellId)}
                  >
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span>V:</span>
                        <span>{displayVoltage ?? '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>T.V:</span>
                        <span>{!hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : ''}</span>
                      </div>
                      <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
                        <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {Object.keys(csu1ResponseData).length === 0 && <p className="text-center text-gray-500 mt-3">No data available.</p>}
      </div>
    </div>
  );
};

export default CSU1;
