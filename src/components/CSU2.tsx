// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU2: React.FC = () => {
//   const { csu2ResponseData, responseData, setCsu2Statuses, setCriticalState } = useBatteryContext();
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
//   const prevCsu2ResponseData = useRef(csu2ResponseData);

//   // To avoid repeating the same warnings over and over
//   const warningStates = useRef<{ [key: number]: { responseDataInvalid: boolean; csu2DataInvalid: boolean } }>(
//     Array.from({ length: 12 }, () => ({
//       responseDataInvalid: false,
//       csu2DataInvalid: false,
//     }))
//   );

//   // ✅ Track last logged values to prevent spam logs
//   const prevCellStates = useRef(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: null as string | null,
//       status: null as string | null,
//     }))
//   );

//   // ---- Helpers kept INSIDE the component ----
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;

//       if (voltage !== null && expectedVoltage !== null) {
//         const voltageGap = Math.abs(expectedVoltage - voltage);
//         if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//         if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       }
//       // If there is simply no data, mark N/A; otherwise normal
//       return dataItems.length === 0 ? 'N/A' : 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const globalCellId = cellId; // CSU2 -> global 0–11
//       const cellData = responseData[globalCellId];
//       const prevInvalid = warningStates.current[cellId].responseDataInvalid;

//       if (!Array.isArray(cellData)) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId];
//       }

//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId];
//       }

//       const parsedVoltage = parseFloat(voltageData.value);
//       if (isNaN(parsedVoltage)) {
//         if (!prevInvalid) {
//           console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
//           warningStates.current[cellId].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellId];
//       }

//       warningStates.current[cellId].responseDataInvalid = false;
//       return parsedVoltage;
//     },
//     [responseData, cachedData.expectedVoltages]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       const prevInvalid = warningStates.current[cellId].csu2DataInvalid;
//       const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//       if (voltageItem && voltageItem.value) {
//         warningStates.current[cellId].csu2DataInvalid = false;
//         return voltageItem.value; // keep as string to match incoming data
//       }
//       if (!prevInvalid) {
//         console.warn(`[${new Date().toISOString()}] No get_12_csu_volt for cell ${cellId}:`, dataItems);
//         warningStates.current[cellId].csu2DataInvalid = true;
//       }
//       return cachedData.actualVoltages[cellId];
//     },
//     [cachedData.actualVoltages]
//   );

//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       // Log the big payloads only when changed
//       if (
//         JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//         JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)
//       ) {
//         console.log(`[${new Date().toISOString()}] CSU2 Response Data:`, JSON.stringify(csu2ResponseData, null, 2));
//         console.log(`[${new Date().toISOString()}] Global Response Data:`, JSON.stringify(responseData, null, 2));
//         prevResponseData.current = responseData;
//         prevCsu2ResponseData.current = csu2ResponseData;
//       }

//       // Update cache and statuses
//       const newExpectedVoltages = [...cachedData.expectedVoltages];
//       const newActualVoltages = [...cachedData.actualVoltages];

//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu2ResponseData[cellId] || [];
//         const expectedVoltage = getExpectedVoltage(cellId);
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         // Update cache only if changed
//         newExpectedVoltages[cellId] =
//           expectedVoltage !== cachedData.expectedVoltages[cellId] ? expectedVoltage : cachedData.expectedVoltages[cellId];
//         newActualVoltages[cellId] =
//           actualVoltage !== cachedData.actualVoltages[cellId] ? actualVoltage : cachedData.actualVoltages[cellId];

//         // ✅ Only log when expected/actual/status actually changed (and not N/A)
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
//           label: `CSU2 - Cell ${cellId}`,
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

//       setCsu2Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) {
//         console.log(`[${new Date().toISOString()}] Critical state detected in CSU2`);
//         setCriticalState(true);
//       }
//     }, 500); // debounce

//     return () => clearTimeout(debounce);
//   }, [csu2ResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setCsu2Statuses, setCriticalState, cachedData]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU12
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu2ResponseData[cellId] || [];
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

//                     {selectedCell === cellId && csu2ResponseData[selectedCell] && (
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
//                           {csu2ResponseData[selectedCell].map((item, idx) => (
//                             <div key={idx} className="flex justify-between items-center">
//                               <span className="text-xs font-medium capitalize">
//                                 {item.command
//                                   .replace('get_', '')
//                                   .replace('_12_csu_', 'CSU12 ')
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

//         {Object.keys(csu2ResponseData).length === 0 && (
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

// export default CSU2;





//something okay
/* eslint-disable */
/* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU2: React.FC = () => {
//   const {
//     csu2ResponseData,
//     responseData,
//     setCsu2Statuses,
//     setCriticalState,
//     resetStatus,
//     setCsu2ResponseData,
//   } = useBatteryContext();

//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const [cachedData, setCachedData] = useState<{
//     expectedVoltages: (number | null)[];
//   }>({
//     expectedVoltages: Array(12).fill(null),
//   });

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const prevResponseData = useRef(responseData);
//   const prevCsu2ResponseData = useRef(csu2ResponseData);

//   // Prevent spam logs and preserve last known values
//   const prevCellStates = useRef(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: null as string | null,
//       status: null as string | null,
//     }))
//   );

//   // ---- Helpers ----
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
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

//   const getExpectedVoltage = useMemo(
//     () => (cellId: number) => {
//       const cellData = responseData[cellId];
//       if (!Array.isArray(cellData)) return null;
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       return voltageData ? parseFloat(voltageData.value) : null;
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//       return voltageItem ? voltageItem.value : null;
//     },
//     []
//   );

//   // Helper to get display voltage (preserves last known value)
//   const getDisplayVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//       const currentVoltage = voltageItem ? voltageItem.value : null;
      
//       // If no current voltage, return last known value from previous state
//       if (currentVoltage === null && prevCellStates.current[cellId]?.actual) {
//         return prevCellStates.current[cellId].actual;
//       }
      
//       return currentVoltage;
//     },
//     []
//   );

//   // Update effect
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       if (resetStatus) {
//         setCachedData({ expectedVoltages: Array(12).fill(null) });
//         setCsu2ResponseData({});
//         prevCellStates.current = Array.from({ length: 12 }, (_, cellId) => ({
//           expected: getExpectedVoltage(cellId),
//           actual: null,
//           status: null,
//         }));
//         setCsu2Statuses([]);
//         console.log(`[${new Date().toISOString()}] CSU2 reset`);
//         return;
//       }

//       // Log changes only when data actually changes
//       if (
//         JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//         JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)
//       ) {
//         console.log(`[${new Date().toISOString()}] CSU2 Response Data:`, csu2ResponseData);
//         prevResponseData.current = responseData;
//         prevCsu2ResponseData.current = csu2ResponseData;
//       }

//       const newExpectedVoltages = Array(12).fill(null).map((_, cellId) => getExpectedVoltage(cellId));
      
//       // Only update expected voltages, don't reset actual voltage data
//       for (let cellId = 0; cellId < 12; cellId++) {
//         const expectedVoltage = newExpectedVoltages[cellId];
//         const prevExpected = prevCellStates.current[cellId].expected;

//         if (expectedVoltage !== prevExpected) {
//           console.log(
//             `[${new Date().toISOString()}] Tester voltage changed for cell ${cellId}: ${prevExpected} -> ${expectedVoltage}`
//           );
//           // Only update the expected voltage, don't reset actual data
//           prevCellStates.current[cellId].expected = expectedVoltage;
//         }
//       }

//       // Calculate statuses with current data
//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu2ResponseData[cellId] || [];
//         const expectedVoltage = newExpectedVoltages[cellId];
//         const actualVoltage = getActualVoltage(cellId, dataItems);
//         const status = getCellStatus(dataItems, expectedVoltage);

//         // Update previous state with current values (preserve actual voltage even if null)
//         const updatedActualVoltage = actualVoltage !== null ? actualVoltage : prevCellStates.current[cellId]?.actual;
        
//         prevCellStates.current[cellId] = { 
//           expected: expectedVoltage, 
//           actual: updatedActualVoltage, 
//           status 
//         };

//         return {
//           label: `CSU2 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltage && expectedVoltage !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
//               : actualVoltage 
//                 ? `Voltage: ${actualVoltage} (No expected voltage data)`
//                 : updatedActualVoltage
//                   ? `Last Voltage: ${updatedActualVoltage} (No current data)`
//                   : 'No voltage data available',
//         };
//       });

//       // Update cached expected voltages
//       setCachedData({ expectedVoltages: newExpectedVoltages });
//       setCsu2Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       if (hasCritical) {
//         setCriticalState(true);
//       }
//     }, 1000);

//     return () => clearTimeout(debounce);
//   }, [csu2ResponseData, responseData, resetStatus, setCsu2Statuses, setCriticalState, setCsu2ResponseData, getCellStatus, getExpectedVoltage, getActualVoltage]);

//   const handleCellClick = (cellId: number) => {
//     setSelectedCell(selectedCell === cellId ? null : cellId);
//   };

//   const cellIds = Array.from({ length: 12 }, (_, i) => i);
//   const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

//   return (
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU12
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu2ResponseData[cellId] || [];
//                 const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
                
//                 // Use display voltage that preserves last known value
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
//                             displayVoltage && displayVoltage !== '-' &&
//                             (parseFloat(displayVoltage) > 4.5 ||
//                               (parseFloat(displayVoltage) < 2.0 && displayVoltage !== '1'))
//                               ? 'text-red-600'
//                               : currentActualVoltage === null && displayVoltage !== '-'
//                                 ? 'text-gray-500 italic'
//                                 : ''
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
//                       csu2ResponseData[selectedCell] &&
//                       csu2ResponseData[selectedCell].length > 0 && (
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
//                             {csu2ResponseData[selectedCell].map((item, idx) => (
//                               <div key={idx} className="flex justify-between items-center">
//                                 <span className="text-xs font-medium capitalize">
//                                   {item.command
//                                     .replace('get_', '')
//                                     .replace('_12_csu_', 'CSU12 ')
//                                     .replace(/_/g, ' ')}
//                                 </span>
//                                 <span
//                                   className={`text-xs font-semibold ${
//                                     item.command.includes('volt')
//                                       ? parseFloat(item.value) > 4.5 ||
//                                         (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                         ? 'text-red-600'
//                                         : ''
//                                       : ''
//                                   }`}
//                                 >
//                                   {item.value}
//                                 </span>
//                               </div>
//                             ))}
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

//         {Object.keys(csu2ResponseData).length === 0 && (
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

// export default CSU2;








//most okay
/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

const CSU2: React.FC = () => {
  const {
    csu2ResponseData,
    responseData,
    setCsu2Statuses,
    setCriticalState,
    resetStatus,
    setCsu2ResponseData,
  } = useBatteryContext();

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cachedData, setCachedData] = useState<{
    expectedVoltages: (number | null)[];
  }>({
    expectedVoltages: Array(12).fill(null),
  });
  const [cellStates, setCellStates] = useState(
    Array.from({ length: 12 }, () => ({
      expected: null as number | null,
      actual: { value: null as string | null, timestamp: 0 as number },
      status: null as string | null,
    }))
  );

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevResponseData = useRef(responseData);
  const prevCsu2ResponseData = useRef(csu2ResponseData);

  // ---- Helpers ----
  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_12_csu_volt')
        .map(item => ({
          value: parseFloat(item.value),
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
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
      const cellData = responseData[cellId];
      if (!Array.isArray(cellData)) return null;
      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      return voltageData ? parseFloat(voltageData.value) : null;
    },
    [responseData]
  );

  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_12_csu_volt')
        .map(item => ({
          value: item.value,
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
      return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
    },
    [cellStates]
  );

  const getDisplayVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_12_csu_volt')
        .map(item => ({
          value: item.value,
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
      return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
    },
    [cellStates]
  );

  // Update effect
  useEffect(() => {
    const debounce = setTimeout(() => {
      if (resetStatus) {
        setCachedData({ expectedVoltages: Array(12).fill(null) });
        setCsu2ResponseData({});
        setCellStates(Array.from({ length: 12 }, (_, cellId) => ({
          expected: getExpectedVoltage(cellId),
          actual: { value: null, timestamp: 0 },
          status: null,
        })));
        setCsu2Statuses([]);
        console.log(`[${new Date().toISOString()}] CSU2 reset`);
        return;
      }

      if (
        JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
        JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)
      ) {
        console.log(`[${new Date().toISOString()}] CSU2 Response Data:`, csu2ResponseData);
        prevResponseData.current = responseData;
        prevCsu2ResponseData.current = csu2ResponseData;
      }

      const newExpectedVoltages = Array(12).fill(null).map((_, cellId) => getExpectedVoltage(cellId));
      const newActualVoltages = Array(12).fill(null).map((_, cellId) => {
        const dataItems = csu2ResponseData[cellId] || [];
        const voltageItems = dataItems
          .filter((item) => item.command === 'get_12_csu_volt')
          .map(item => ({
            value: item.value,
            timestamp: new Date(item.timestamp || '').getTime() || Date.now()
          }))
          .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
        return voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
      });
      
      const updatedCellStates = [...cellStates];
      for (let cellId = 0; cellId < 12; cellId++) {
        const expectedVoltage = newExpectedVoltages[cellId];
        const prevExpected = cellStates[cellId].expected;
        const actualVoltage = newActualVoltages[cellId];
        const prevActual = cellStates[cellId].actual;

        if (expectedVoltage !== prevExpected) {
          console.log(
            `[${new Date().toISOString()}] Tester voltage changed for cell ${cellId}: ${prevExpected} -> ${expectedVoltage}`
          );
          updatedCellStates[cellId] = { ...updatedCellStates[cellId], expected: expectedVoltage };
        }

        if (actualVoltage && (prevActual.value !== actualVoltage.value || prevActual.timestamp !== actualVoltage.timestamp)) {
          console.log(
            `[${new Date().toISOString()}] Actual voltage changed for cell ${cellId}: ${prevActual.value} -> ${actualVoltage.value} (Timestamp: ${new Date(actualVoltage.timestamp).toISOString()})`
          );
          updatedCellStates[cellId] = { ...updatedCellStates[cellId], actual: actualVoltage };
        } else if (!actualVoltage && prevActual.value) {
          updatedCellStates[cellId] = { ...updatedCellStates[cellId], actual: { value: null, timestamp: 0 } };
        }
      }

      const statuses = Array.from({ length: 12 }, (_, cellId) => {
        const dataItems = csu2ResponseData[cellId] || [];
        const expectedVoltage = newExpectedVoltages[cellId];
        const actualVoltage = getActualVoltage(cellId, dataItems);
        const status = getCellStatus(dataItems, expectedVoltage);

        return {
          label: `CSU2 - Cell ${cellId}`,
          status,
          details:
            actualVoltage && expectedVoltage !== null && status !== 'N/A'
              ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
              : actualVoltage
                ? `Voltage: ${actualVoltage} (No expected voltage data)`
                : cellStates[cellId].actual.value
                  ? `Last Voltage: ${cellStates[cellId].actual.value} (No current data)`
                  : 'No voltage data available',
        };
      });

      setCachedData({ expectedVoltages: newExpectedVoltages });
      setCellStates(updatedCellStates);
      setCsu2Statuses(statuses);

      const hasCritical = statuses.some((s) => s.status === 'critical');
      if (hasCritical) {
        setCriticalState(true);
      }
    }, 1000);

    return () => clearTimeout(debounce);
  }, [csu2ResponseData, responseData, resetStatus, setCsu2Statuses, setCriticalState, setCsu2ResponseData, getCellStatus, getExpectedVoltage, getActualVoltage, cellStates]);

  const handleCellClick = (cellId: number) => {
    setSelectedCell(selectedCell === cellId ? null : cellId);
  };

  const cellIds = Array.from({ length: 12 }, (_, i) => i);
  const rows = [cellIds.slice(0, 3), cellIds.slice(3, 6), cellIds.slice(6, 9), cellIds.slice(9, 12)];

  return (
    <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md">
      <div className="w-full max-w-6xl relative">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          CSU12
        </h2>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((cellId) => {
                const dataItems = csu2ResponseData[cellId] || [];
                const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
                const displayVoltage = getDisplayVoltage(cellId, dataItems);
                const currentActualVoltage = getActualVoltage(cellId, dataItems);
                const status = getCellStatus(dataItems, expectedVoltage);
                const statusColors = {
                  normal: 'bg-green-100 text-green-800',
                  warning: 'bg-yellow-100 text-yellow-800',
                  critical: 'bg-red-100 text-red-800',
                  'N/A': 'bg-gray-100 text-gray-800',
                };

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
                    className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
                    onClick={() => handleCellClick(cellId)}
                  >
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span>V:</span>
                        <span
                          className={
                            displayVoltage && displayVoltage !== '-' &&
                            (parseFloat(displayVoltage) > 4.5 ||
                              (parseFloat(displayVoltage) < 2.0 && displayVoltage !== '1'))
                              ? 'text-red-600'
                              : currentActualVoltage === null && displayVoltage !== '-'
                                ? 'text-gray-500 italic'
                                : ''
                          }
                        >
                          {displayVoltage ?? '-'}
                          {currentActualVoltage === null && displayVoltage !== '-' && ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>T.V:</span>
                        <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
                      </div>
                      <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
                        <span className="text-xs font-light">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                          {currentActualVoltage === null && status !== 'N/A' ? '' : ''}
                        </span>
                      </div>
                    </div>

                    {selectedCell === cellId &&
                      csu2ResponseData[selectedCell] &&
                      csu2ResponseData[selectedCell].length > 0 && (
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
                            {[...csu2ResponseData[selectedCell]
                              .filter(item => item.command === 'get_12_csu_volt')
                              .map(item => ({
                                ...item,
                                timestamp: new Date(item.timestamp || '').getTime() || Date.now()
                              }))
                              .sort((a, b) => a.timestamp - b.timestamp) // Sort ascending
                            ].reverse().map((item, idx) => {
                              const currentActual = cellStates[selectedCell]?.actual;
                              const isLatest = currentActual && currentActual.timestamp === item.timestamp;
                              return (
                                <div key={idx} className="flex justify-between items-center">
                                  <span className="text-xs font-medium capitalize">
                                    {item.command.replace('get_', '').replace('_12_csu_', 'CSU12 ').replace(/_/g, ' ')}
                                  </span>
                                  <span
                                    className={`text-xs font-semibold ${
                                      isLatest ? 'text-green-600 font-bold' : (parseFloat(item.value) > 4.5 || (parseFloat(item.value) < 2.0 && item.value !== '1') ? 'text-red-600' : '')
                                    }`}
                                  >
                                    {item.value} {isLatest && '(Latest)'}
                                  </span>
                                </div>
                              );
                            })}
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">Tester Volt:</span>
                              <span className="text-xs font-semibold">
                                {expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium">Data Status:</span>
                              <span className="text-xs font-semibold">
                                {currentActualVoltage === null ? 'Last Known Value' : 'Current Value'}
                              </span>
                            </div>
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
        .animate-fade-in { animation: fade-in 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default CSU2;