// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const MAX_DAISY_ICS = 2; // Exactly 2 ICs (0 and 1)
// const CELLS_PER_IC = 12;

// const Daicy: React.FC = () => {
//   const { dcCsuResponseData, responseData, setDaisyStatuses, setCriticalState } = useBatteryContext();
//   const [selectedCell, setSelectedCell] = useState<{ dcIc: number; cellNo: number } | null>(null);
//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
//   const dcIcs = [0, 1]; // Fixed ICs: 0 and 1

//   // Initialize cachedData
//   const initialCachedData = useMemo(() => {
//     const expectedVoltages: { [key: string]: number | null } = {};
//     const actualVoltages: { [key: string]: string | null } = {};
//     for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
//       for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//         const cellKey = `${dcIc}-${cellNo}`;
//         expectedVoltages[cellKey] = null;
//         actualVoltages[cellKey] = null;
//       }
//     }
//     return { expectedVoltages, actualVoltages };
//   }, []);

//   const [cachedData, setCachedData] = useState(initialCachedData);
//   const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
//   const prevResponseData = useRef(responseData);
//   const prevDcCsuResponseData = useRef(dcCsuResponseData);
//   const loggedWarnings = useRef<Set<string>>(new Set());

//   // Warning states
//   const warningStates = useRef<{ [key: string]: { responseDataInvalid: boolean; dcCsuDataInvalid: boolean } }>({});
//   for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
//     for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//       const cellKey = `${dcIc}-${cellNo}`;
//       warningStates.current[cellKey] = { responseDataInvalid: false, dcCsuDataInvalid: false };
//     }
//   }

//   // Previous cell states
//   const prevCellStates = useRef<{ [key: string]: { expected: number | null; actual: string | null; status: string | null } }>({});

//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_dc_csu_volt');
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//       if (voltage !== null && expectedVoltage !== null) {
//         const gap = Math.abs(expectedVoltage - voltage);
//         if (gap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//         if (gap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       }
//       return dataItems.length === 0 ? 'N/A' : 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellNo: number, dcIc: number) => {
//       const cellKey = `${dcIc}-${cellNo}`;
//       const globalCellId = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//       const warningKey = `responseData-${globalCellId}`;
//       const prevInvalid = warningStates.current[cellKey]?.responseDataInvalid ?? false;
//       const cellData = responseData[globalCellId];

//       if (!Array.isArray(cellData)) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellKey] ?? null;
//       }

//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellKey] ?? null;
//       }

//       const parsed = parseFloat(voltageData.value);
//       if (isNaN(parsed)) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return cachedData.expectedVoltages[cellKey] ?? null;
//       }

//       warningStates.current[cellKey].responseDataInvalid = false;
//       loggedWarnings.current.delete(warningKey);
//       return parsed;
//     },
//     [responseData, cachedData.expectedVoltages]
//   );

//   const getActualVoltage = useMemo(
//     () => (dcIc: number, cellNo: number) => {
//       const cellKey = `${dcIc}-${cellNo}`;
//       const warningKey = `dcCsuData-${cellKey}`;
//       const prevInvalid = warningStates.current[cellKey]?.dcCsuDataInvalid ?? false;
      
//       // For IC 0: use cellNo directly (0-11)
//       // For IC 1: map cellNo (0-11) to actual data index (12-23)
//       const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//       const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
      
//       const voltageItem = dataItems.find((item) => item.command === 'get_dc_csu_volt');
//       if (voltageItem && voltageItem.value) {
//         warningStates.current[cellKey].dcCsuDataInvalid = false;
//         loggedWarnings.current.delete(warningKey);
//         return voltageItem.value;
//       }
//       if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//         console.warn(`[${new Date().toISOString()}] No get_dc_csu_volt for cell ${cellKey} (data index: ${dataCellIndex}):`, dataItems);
//         loggedWarnings.current.add(warningKey);
//         warningStates.current[cellKey].dcCsuDataInvalid = true;
//       }
//       return cachedData.actualVoltages[cellKey] ?? null;
//     },
//     [dcCsuResponseData, cachedData.actualVoltages]
//   );

//   useEffect(() => {
//     if (
//       JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//       JSON.stringify(dcCsuResponseData) !== JSON.stringify(prevDcCsuResponseData.current)
//     ) {
//       prevResponseData.current = responseData;
//       prevDcCsuResponseData.current = dcCsuResponseData;
//       loggedWarnings.current.clear();
//     }
//   }, [responseData, dcCsuResponseData]);

//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       const newExpected = { ...cachedData.expectedVoltages };
//       const newActual = { ...cachedData.actualVoltages };
//       const statuses: { label: string; status: string; details?: string }[] = [];

//       dcIcs.forEach((dcIc) => {
//         for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//           const cellKey = `${dcIc}-${cellNo}`;
          
//           // For IC 0: use cellNo directly (0-11)
//           // For IC 1: map cellNo (0-11) to actual data index (12-23)
//           const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//           const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
          
//           const expected = getExpectedVoltage(cellNo, dcIc);
//           const actual = getActualVoltage(dcIc, cellNo);
//           const status = getCellStatus(dataItems, expected);

//           newExpected[cellKey] = expected;
//           newActual[cellKey] = actual;

//           prevCellStates.current[cellKey] = { expected, actual, status };
//           statuses.push({
//             label: `Daisy Chain IC${dcIc} - Cell ${cellNo}`,
//             status,
//             details: actual && expected !== null ? `Voltage: ${actual} (Expected: ${expected}V)` : 'No expected voltage data',
//           });
//         }
//       });

//       setCachedData({ expectedVoltages: newExpected, actualVoltages: newActual });
//       setDaisyStatuses(statuses);

//       if (statuses.some((s) => s.status === 'critical')) {
//         setCriticalState(true);
//       }
//     }, 500);

//     return () => clearTimeout(debounce);
//   }, [dcCsuResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setDaisyStatuses, setCriticalState]);

//   const handleCellClick = (dcIc: number, cellNo: number) => {
//     const cellKey = `${dcIc}-${cellNo}`;
//     const cellElement = cellRefs.current.get(cellKey);
    
//     if (cellElement) {
//       const rect = cellElement.getBoundingClientRect();
//       const containerRect = cellElement.closest('.daicy-container')?.getBoundingClientRect() || { left: 0, top: 0 };
      
//       setPopupPosition({
//         top: rect.bottom - containerRect.top,
//         left: rect.left - containerRect.left
//       });
//     }
    
//     setSelectedCell(selectedCell?.dcIc === dcIc && selectedCell?.cellNo === cellNo ? null : { dcIc, cellNo });
//   };

//   // Generate cell layout for each IC (0-11 cells for both ICs)
//   const generateCellLayout = () => {
//     return [
//       [0, 1, 2],
//       [3, 4, 5],
//       [6, 7, 8],
//       [9, 10, 11]
//     ];
//   };

//   const statusColors = {
//     normal: 'bg-green-100 text-green-800',
//     warning: 'bg-yellow-100 text-yellow-800',
//     critical: 'bg-red-100 text-red-800',
//     'N/A': 'bg-gray-100 text-gray-800',
//   };

//   return (
//     <div className="daicy-container p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md overflow-y-auto relative">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           DAISY CHAIN
//         </h2>
//         {dcIcs.map((dcIc) => (
//           <div key={dcIc} className="mb-4">
//             <h3 className="text-md font-semibold text-gray-700 mb-2">DC IC {dcIc}</h3>
//             <div className="space-y-2">
//               {generateCellLayout().map((row, rowIndex) => (
//                 <div key={rowIndex} className="grid grid-cols-3 gap-2">
//                   {row.map((cellNo) => {
//                     const cellKey = `${dcIc}-${cellNo}`;
                    
//                     // For IC 0: use cellNo directly (0-11)
//                     // For IC 1: map cellNo (0-11) to actual data index (12-23)
//                     const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//                     const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
                    
//                     const expectedVoltage = cachedData.expectedVoltages[cellKey] ?? getExpectedVoltage(cellNo, dcIc);
//                     const actualVoltage = cachedData.actualVoltages[cellKey] ?? getActualVoltage(dcIc, cellNo);
//                     const status = getCellStatus(dataItems, expectedVoltage);

//                     return (
//                       <div
//                         key={cellNo}
//                         ref={(el) => cellRefs.current.set(cellKey, el)}
//                         className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
//                         onClick={() => handleCellClick(dcIc, cellNo)}
//                       >
//                         <div className="text-xs">
//                           <div className="flex justify-between">
//                             <span>V:</span>
//                             <span
//                               className={
//                                 actualVoltage &&
//                                 (parseFloat(actualVoltage) > 4.5 ||
//                                   (parseFloat(actualVoltage) < 2.0 && actualVoltage !== '1'))
//                                   ? 'text-red-600'
//                                   : ''
//                               }
//                             >
//                               {actualVoltage ?? '-'}V
//                             </span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span>T.V:</span>
//                             <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                           </div>
//                           <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                             <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ))}
//             </div>
//             {Object.keys(dcCsuResponseData[dcIc] || {}).length === 0 && (
//               <p className="text-center text-gray-500 mt-3">No data available for DC IC {dcIc}.</p>
//             )}
//           </div>
//         ))}
        
//         {/* Popup rendered outside the grid for proper positioning */}
//         {selectedCell && popupPosition && (
//           <div
//             style={{
//               position: 'absolute',
//               top: `${popupPosition.top}px`,
//               left: `${popupPosition.left}px`,
//               zIndex: 50
//             }}
//             className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//           >
//             <div className="flex justify-between items-center mb-2">
//               <h3 className="text-sm font-semibold text-gray-800">
//                 DC IC {selectedCell.dcIc} Cell {selectedCell.cellNo} Details
//               </h3>
//               <button
//                 className="text-gray-500 hover:text-gray-700 text-sm"
//                 onClick={() => {
//                   setSelectedCell(null);
//                   setPopupPosition(null);
//                 }}
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-1.5">
//               {(() => {
//                 const dataCellIndex = selectedCell.dcIc === 0 ? selectedCell.cellNo : selectedCell.cellNo + CELLS_PER_IC;
//                 const dataItems = dcCsuResponseData[selectedCell.dcIc]?.[dataCellIndex] || [];
//                 const expectedVoltage = cachedData.expectedVoltages[`${selectedCell.dcIc}-${selectedCell.cellNo}`] ?? 
//                   getExpectedVoltage(selectedCell.cellNo, selectedCell.dcIc);
                
//                 return dataItems.length > 0 ? (
//                   <>
//                     {dataItems.map((item, idx) => (
//                       <div key={idx} className="flex justify-between items-center">
//                         <span className="text-xs font-medium capitalize">
//                           {item.command.replace('get_', '').replace('dc_csu_', 'Daisy ').replace(/_/g, ' ')}
//                         </span>
//                         <span
//                           className={`text-xs font-semibold ${
//                             item.command.includes('volt')
//                               ? parseFloat(item.value) > 4.5 ||
//                                 (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                 ? 'text-red-600'
//                                 : ''
//                               : ''
//                           }`}
//                         >
//                           {item.value}
//                         </span>
//                       </div>
//                     ))}
//                     <div className="flex justify-between items-center">
//                       <span className="text-xs font-medium">Tester Volt:</span>
//                       <span className="text-xs font-semibold">{expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}</span>
//                     </div>
//                     <div className="text-xs text-gray-500 mt-2">
//                       Data index: {dataCellIndex}
//                     </div>
//                   </>
//                 ) : (
//                   <div className="text-xs text-gray-500">No data available</div>
//                 );
//               })()}
//             </div>
//           </div>
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

// export default Daicy;










//almost okay
/* eslint-disable */
/* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const MAX_DAISY_ICS = 2; // Exactly 2 ICs (0 and 1)
// const CELLS_PER_IC = 12;

// const Daicy: React.FC = () => {
//   const { dcCsuResponseData, responseData, setDaisyStatuses, setCriticalState, csu1TesterVoltages, setCsu1TesterVoltages } = useBatteryContext();
//   const [selectedCell, setSelectedCell] = useState<{ dcIc: number; cellNo: number } | null>(null);
//   const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
//   const dcIcs = [0, 1]; // Fixed ICs: 0 and 1

//   // Initialize cachedData
//   const initialCachedData = useMemo(() => {
//     const expectedVoltages: { [key: string]: number | null } = {};
//     const actualVoltages: { [key: string]: string | null } = {};
//     for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
//       for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//         const cellKey = `${dcIc}-${cellNo}`;
//         expectedVoltages[cellKey] = null;
//         actualVoltages[cellKey] = null;
//       }
//     }
//     return { expectedVoltages, actualVoltages };
//   }, []);

//   const [cachedData, setCachedData] = useState(initialCachedData);
//   const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
//   const prevResponseData = useRef(responseData);
//   const prevDcCsuResponseData = useRef(dcCsuResponseData);
//   const loggedWarnings = useRef<Set<string>>(new Set());
//   const lastResetTimestamps = useRef<{ [key: string]: number }>({}); // Track reset timestamps per cell

//   // Warning states
//   const warningStates = useRef<{ [key: string]: { responseDataInvalid: boolean; dcCsuDataInvalid: boolean } }>({});
//   for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
//     for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//       const cellKey = `${dcIc}-${cellNo}`;
//       warningStates.current[cellKey] = { responseDataInvalid: false, dcCsuDataInvalid: false };
//     }
//   }

//   // Previous cell states
//   const prevCellStates = useRef<{ [key: string]: { expected: number | null; actual: string | null; status: string | null } }>({});

//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       const voltageItem = dataItems.find((item) => item.command === 'get_dc_csu_volt');
//       const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//       if (voltage !== null && expectedVoltage !== null) {
//         const gap = Math.abs(expectedVoltage - voltage);
//         if (gap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//         if (gap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//       }
//       return dataItems.length === 0 ? 'N/A' : 'normal';
//     },
//     []
//   );

//   const getExpectedVoltage = useMemo(
//     () => (cellNo: number, dcIc: number) => {
//       const cellKey = `${dcIc}-${cellNo}`;
//       const globalCellId = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//       const warningKey = `responseData-${globalCellId}`;
//       const prevInvalid = warningStates.current[cellKey]?.responseDataInvalid ?? false;
//       const cellData = responseData[globalCellId];

//       // If cell was recently reset and no valid new voltage data exists, return null
//       if (lastResetTimestamps.current[cellKey] && (!cellData || !Array.isArray(cellData) || !cellData.some(item => item.command === 'get_voltage'))) {
//         return null;
//       }

//       if (!Array.isArray(cellData)) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return null;
//       }

//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       if (!voltageData || !voltageData.value) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return null;
//       }

//       const parsed = parseFloat(voltageData.value);
//       if (isNaN(parsed)) {
//         if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//           console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
//           loggedWarnings.current.add(warningKey);
//           warningStates.current[cellKey].responseDataInvalid = true;
//         }
//         return null;
//       }

//       warningStates.current[cellKey].responseDataInvalid = false;
//       loggedWarnings.current.delete(warningKey);
//       return parsed;
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (dcIc: number, cellNo: number) => {
//       const cellKey = `${dcIc}-${cellNo}`;
//       const warningKey = `dcCsuData-${cellKey}`;
//       const prevInvalid = warningStates.current[cellKey]?.dcCsuDataInvalid ?? false;
      
//       const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//       const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
      
//       const voltageItem = dataItems.find((item) => item.command === 'get_dc_csu_volt');
//       if (voltageItem && voltageItem.value) {
//         warningStates.current[cellKey].dcCsuDataInvalid = false;
//         loggedWarnings.current.delete(warningKey);
//         return voltageItem.value;
//       }
//       if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
//         console.warn(`[${new Date().toISOString()}] No get_dc_csu_volt for cell ${cellKey} (data index: ${dataCellIndex}):`, dataItems);
//         loggedWarnings.current.add(warningKey);
//         warningStates.current[cellKey].dcCsuDataInvalid = true;
//       }
//       return cachedData.actualVoltages[cellKey] ?? null;
//     },
//     [dcCsuResponseData, cachedData.actualVoltages]
//   );

//   useEffect(() => {
//     if (
//       JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
//       JSON.stringify(dcCsuResponseData) !== JSON.stringify(prevDcCsuResponseData.current)
//     ) {
//       prevResponseData.current = responseData;
//       prevDcCsuResponseData.current = dcCsuResponseData;
//       loggedWarnings.current.clear();
//     }
//   }, [responseData, dcCsuResponseData]);

//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       const newExpected = { ...cachedData.expectedVoltages };
//       const newActual = { ...cachedData.actualVoltages };
//       const newCsu1TesterVoltages = [...csu1TesterVoltages];
//       const statuses: { label: string; status: string; details?: string }[] = [];
//       const currentTime = Date.now();

//       dcIcs.forEach((dcIc) => {
//         for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
//           const cellKey = `${dcIc}-${cellNo}`;
          
//           const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//           const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
          
//           const expected = getExpectedVoltage(cellNo, dcIc);
//           const actual = getActualVoltage(dcIc, cellNo);
//           const status = getCellStatus(dataItems, expected);

//           // If actual voltage is updated, reset expected voltage and set timestamp
//           if (actual !== cachedData.actualVoltages[cellKey] && actual !== null) {
//             newExpected[cellKey] = null;
//             lastResetTimestamps.current[cellKey] = currentTime;
//             if (dcIc === 0) {
//               newCsu1TesterVoltages[cellNo] = null;
//             }
//           } else {
//             newExpected[cellKey] = expected;
//           }

//           newActual[cellKey] = actual;

//           prevCellStates.current[cellKey] = { expected, actual, status };
//           statuses.push({
//             label: `Daisy Chain IC${dcIc} - Cell ${cellNo}`,
//             status,
//             details: actual && expected !== null ? `Voltage: ${actual} (Expected: ${expected}V)` : 'No expected voltage data',
//           });
//         }
//       });

//       setCachedData({ expectedVoltages: newExpected, actualVoltages: newActual });
//       setCsu1TesterVoltages(newCsu1TesterVoltages);
//       setDaisyStatuses(statuses);

//       if (statuses.some((s) => s.status === 'critical')) {
//         setCriticalState(true);
//       }
//     }, 500);

//     return () => clearTimeout(debounce);
//   }, [dcCsuResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setDaisyStatuses, setCriticalState, csu1TesterVoltages, setCsu1TesterVoltages, cachedData.actualVoltages]);

//   const handleCellClick = (dcIc: number, cellNo: number) => {
//     const cellKey = `${dcIc}-${cellNo}`;
//     const cellElement = cellRefs.current.get(cellKey);
    
//     if (cellElement) {
//       const rect = cellElement.getBoundingClientRect();
//       const containerRect = cellElement.closest('.daicy-container')?.getBoundingClientRect() || { left: 0, top: 0 };
      
//       setPopupPosition({
//         top: rect.bottom - containerRect.top,
//         left: rect.left - containerRect.left
//       });
//     }
    
//     setSelectedCell(selectedCell?.dcIc === dcIc && selectedCell?.cellNo === cellNo ? null : { dcIc, cellNo });
//   };

//   const generateCellLayout = () => {
//     return [
//       [0, 1, 2],
//       [3, 4, 5],
//       [6, 7, 8],
//       [9, 10, 11]
//     ];
//   };

//   const statusColors = {
//     normal: 'bg-green-100 text-green-800',
//     warning: 'bg-yellow-100 text-yellow-800',
//     critical: 'bg-red-100 text-red-800',
//     'N/A': 'bg-gray-100 text-gray-800',
//   };

//   return (
//     <div className="daicy-container p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md overflow-y-auto relative">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           DAISY CHAIN
//         </h2>
//         {dcIcs.map((dcIc) => (
//           <div key={dcIc} className="mb-4">
//             <h3 className="text-md font-semibold text-gray-700 mb-2">DC IC {dcIc}</h3>
//             <div className="space-y-2">
//               {generateCellLayout().map((row, rowIndex) => (
//                 <div key={rowIndex} className="grid grid-cols-3 gap-2">
//                   {row.map((cellNo) => {
//                     const cellKey = `${dcIc}-${cellNo}`;
                    
//                     const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
//                     const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
                    
//                     const expectedVoltage = cachedData.expectedVoltages[cellKey] ?? getExpectedVoltage(cellNo, dcIc);
//                     const actualVoltage = cachedData.actualVoltages[cellKey] ?? getActualVoltage(dcIc, cellNo);
//                     const status = getCellStatus(dataItems, expectedVoltage);

//                     return (
//                       <div
//                         key={cellNo}
//                         ref={(el) => cellRefs.current.set(cellKey, el)}
//                         className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
//                         onClick={() => handleCellClick(dcIc, cellNo)}
//                       >
//                         <div className="text-xs">
//                           <div className="flex justify-between">
//                             <span>V:</span>
//                             <span
//                               className={
//                                 actualVoltage &&
//                                 (parseFloat(actualVoltage) > 4.5 ||
//                                   (parseFloat(actualVoltage) < 2.0 && actualVoltage !== '1'))
//                                   ? 'text-red-600'
//                                   : ''
//                               }
//                             >
//                               {actualVoltage ?? '-'}V
//                             </span>
//                           </div>
//                           <div className="flex justify-between">
//                             <span>T.V:</span>
//                             <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                           </div>
//                           <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                             <span className="text-xs font-light">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ))}
//             </div>
//             {Object.keys(dcCsuResponseData[dcIc] || {}).length === 0 && (
//               <p className="text-center text-gray-500 mt-3">No data available for DC IC {dcIc}.</p>
//             )}
//           </div>
//         ))}
        
//         {selectedCell && popupPosition && (
//           <div
//             style={{
//               position: 'absolute',
//               top: `${popupPosition.top}px`,
//               left: `${popupPosition.left}px`,
//               zIndex: 50
//             }}
//             className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//           >
//             <div className="flex justify-between items-center mb-2">
//               <h3 className="text-sm font-semibold text-gray-800">
//                 DC IC {selectedCell.dcIc} Cell {selectedCell.cellNo} Details
//               </h3>
//               <button
//                 className="text-gray-500 hover:text-gray-700 text-sm"
//                 onClick={() => {
//                   setSelectedCell(null);
//                   setPopupPosition(null);
//                 }}
//               >
//                 ✕
//               </button>
//             </div>
//             <div className="space-y-1.5">
//               {(() => {
//                 const dataCellIndex = selectedCell.dcIc === 0 ? selectedCell.cellNo : selectedCell.cellNo + CELLS_PER_IC;
//                 const dataItems = dcCsuResponseData[selectedCell.dcIc]?.[dataCellIndex] || [];
//                 const expectedVoltage = cachedData.expectedVoltages[`${selectedCell.dcIc}-${selectedCell.cellNo}`] ?? 
//                   getExpectedVoltage(selectedCell.cellNo, selectedCell.dcIc);
                
//                 return dataItems.length > 0 ? (
//                   <>
//                     {dataItems.map((item, idx) => (
//                       <div key={idx} className="flex justify-between items-center">
//                         <span className="text-xs font-medium capitalize">
//                           {item.command.replace('get_', '').replace('dc_csu_', 'Daisy ').replace(/_/g, ' ')}
//                         </span>
//                         <span
//                           className={`text-xs font-semibold ${
//                             item.command.includes('volt')
//                               ? parseFloat(item.value) > 4.5 ||
//                                 (parseFloat(item.value) < 2.0 && item.value !== '1')
//                                 ? 'text-red-600'
//                                 : ''
//                               : ''
//                           }`}
//                         >
//                           {item.value}
//                         </span>
//                       </div>
//                     ))}
//                     <div className="flex justify-between items-center">
//                       <span className="text-xs font-medium">Tester Volt:</span>
//                       <span className="text-xs font-semibold">{expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}</span>
//                     </div>
//                     <div className="text-xs text-gray-500 mt-2">
//                       Data index: {dataCellIndex}
//                     </div>
//                   </>
//                 ) : (
//                   <div className="text-xs text-gray-500">No data available</div>
//                 );
//               })()}
//             </div>
//           </div>
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

// export default Daicy;











/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const MAX_DAISY_ICS = 2; // Exactly 2 ICs (0 and 1)
const CELLS_PER_IC = 12;

const Daicy: React.FC = () => {
  const { dcCsuResponseData, responseData, setDaisyStatuses, setCriticalState, csu1TesterVoltages, setCsu1TesterVoltages, csu2TesterVoltages, setCsu2TesterVoltages } = useBatteryContext();
  const [selectedCell, setSelectedCell] = useState<{ dcIc: number; cellNo: number } | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ top: number; left: number } | null>(null);
  const dcIcs = [0, 1]; // Fixed ICs: 0 and 1

  // Initialize cachedData
  const initialCachedData = useMemo(() => {
    const expectedVoltages: { [key: string]: number | null } = {};
    const actualVoltages: { [key: string]: string | null } = {};
    for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
      for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
        const cellKey = `${dcIc}-${cellNo}`;
        expectedVoltages[cellKey] = null;
        actualVoltages[cellKey] = null;
      }
    }
    return { expectedVoltages, actualVoltages };
  }, []);

  const [cachedData, setCachedData] = useState(initialCachedData);
  const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());
  const prevResponseData = useRef(responseData);
  const prevDcCsuResponseData = useRef(dcCsuResponseData);
  const loggedWarnings = useRef<Set<string>>(new Set());
  const lastResetTimestamps = useRef<{ [key: string]: number }>({}); // Track reset timestamps for tester voltages
  const actualVoltageTimestamps = useRef<{ [key: string]: number }>({}); // Track timestamps for actual voltage updates

  // Warning states
  const warningStates = useRef<{ [key: string]: { responseDataInvalid: boolean; dcCsuDataInvalid: boolean } }>({});
  for (let dcIc = 0; dcIc < MAX_DAISY_ICS; dcIc++) {
    for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
      const cellKey = `${dcIc}-${cellNo}`;
      warningStates.current[cellKey] = { responseDataInvalid: false, dcCsuDataInvalid: false };
    }
  }

  // Previous cell states
  const prevCellStates = useRef<{ [key: string]: { expected: number | null; actual: string | null; status: string | null } }>({});

  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_dc_csu_volt')
        .map(item => ({
          value: parseFloat(item.value),
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
      const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;

      if (latestVoltage !== null && expectedVoltage !== null) {
        const voltageGap = Math.abs(expectedVoltage - latestVoltage);
        if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
        if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
      }
      return dataItems.length === 0 ? 'N/A' : 'normal';
    },
    []
  );

  const getExpectedVoltage = useMemo(
    () => (cellNo: number, dcIc: number) => {
      const cellKey = `${dcIc}-${cellNo}`;
      const globalCellId = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
      const warningKey = `responseData-${globalCellId}`;
      const prevInvalid = warningStates.current[cellKey]?.responseDataInvalid ?? false;
      const cellData = responseData[globalCellId];

      // If cell was recently reset and no valid new voltage data exists, return null
      if (lastResetTimestamps.current[cellKey] && (!cellData || !Array.isArray(cellData) || !cellData.some(item => item.command === 'get_voltage'))) {
        return null;
      }

      if (!Array.isArray(cellData)) {
        if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
          console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
          loggedWarnings.current.add(warningKey);
          warningStates.current[cellKey].responseDataInvalid = true;
        }
        return null;
      }

      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      if (!voltageData || !voltageData.value) {
        if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
          console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
          loggedWarnings.current.add(warningKey);
          warningStates.current[cellKey].responseDataInvalid = true;
        }
        return null;
      }

      const parsed = parseFloat(voltageData.value);
      if (isNaN(parsed)) {
        if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
          console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
          loggedWarnings.current.add(warningKey);
          warningStates.current[cellKey].responseDataInvalid = true;
        }
        return null;
      }

      warningStates.current[cellKey].responseDataInvalid = false;
      loggedWarnings.current.delete(warningKey);
      return parsed;
    },
    [responseData]
  );

  const getActualVoltage = useMemo(
    () => (dcIc: number, cellNo: number) => {
      const cellKey = `${dcIc}-${cellNo}`;
      const warningKey = `dcCsuData-${cellKey}`;
      const prevInvalid = warningStates.current[cellKey]?.dcCsuDataInvalid ?? false;
      
      const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
      const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
      
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_dc_csu_volt')
        .map(item => ({
          value: item.value,
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
      const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;

      if (latestVoltage) {
        warningStates.current[cellKey].dcCsuDataInvalid = false;
        loggedWarnings.current.delete(warningKey);
        return latestVoltage;
      }
      if (!prevInvalid && !loggedWarnings.current.has(warningKey)) {
        console.warn(`[${new Date().toISOString()}] No get_dc_csu_volt for cell ${cellKey} (data index: ${dataCellIndex}):`, dataItems);
        loggedWarnings.current.add(warningKey);
        warningStates.current[cellKey].dcCsuDataInvalid = true;
      }
      return cachedData.actualVoltages[cellKey] ?? null;
    },
    [dcCsuResponseData, cachedData.actualVoltages]
  );

  useEffect(() => {
    if (
      JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
      JSON.stringify(dcCsuResponseData) !== JSON.stringify(prevDcCsuResponseData.current)
    ) {
      prevResponseData.current = responseData;
      prevDcCsuResponseData.current = dcCsuResponseData;
      loggedWarnings.current.clear();
    }
  }, [responseData, dcCsuResponseData]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      const newExpected = { ...cachedData.expectedVoltages };
      const newActual = { ...cachedData.actualVoltages };
      const newCsu1TesterVoltages = [...csu1TesterVoltages];
      const newCsu2TesterVoltages = [...csu2TesterVoltages];
      const statuses: { label: string; status: string; details?: string }[] = [];
      const currentTime = Date.now();

      dcIcs.forEach((dcIc) => {
        for (let cellNo = 0; cellNo < CELLS_PER_IC; cellNo++) {
          const cellKey = `${dcIc}-${cellNo}`;
          
          const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
          const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
          
          const expected = getExpectedVoltage(cellNo, dcIc);
          const actual = getActualVoltage(dcIc, cellNo);
          const status = getCellStatus(dataItems, expected);

          // If actual voltage is updated, reset expected voltage and set timestamps
          if (actual !== cachedData.actualVoltages[cellKey] && actual !== null) {
            newExpected[cellKey] = null;
            lastResetTimestamps.current[cellKey] = currentTime;
            actualVoltageTimestamps.current[cellKey] = currentTime; // Track actual voltage update time
            // if (dcIc === 1) {
            //   newCsu1TesterVoltages[cellNo] = null;
            // }
            // if (dcIc === 0) {
            //   newCsu2TesterVoltages[cellNo] = null;
            // }
          } else {
            newExpected[cellKey] = expected;
          }

          newActual[cellKey] = actual;

          prevCellStates.current[cellKey] = { expected, actual, status };
          statuses.push({
            label: `Daisy Chain IC${dcIc} - Cell ${cellNo}`,
            status,
            details: actual && expected !== null ? `Voltage: ${actual} (Expected: ${expected}V)` : 'No expected voltage data',
          });
        }
      });

      setCachedData({ expectedVoltages: newExpected, actualVoltages: newActual });
      setCsu2TesterVoltages(newCsu2TesterVoltages);
      setCsu1TesterVoltages(newCsu1TesterVoltages);

      

      setDaisyStatuses(statuses);

      if (statuses.some((s) => s.status === 'critical')) {
        setCriticalState(true);
      }
    }, 10);

    return () => clearTimeout(debounce);
  }, [dcCsuResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setDaisyStatuses, setCriticalState, csu1TesterVoltages, setCsu1TesterVoltages, csu2TesterVoltages, setCsu2TesterVoltages, cachedData.actualVoltages]);

  const handleCellClick = (dcIc: number, cellNo: number) => {
    const cellKey = `${dcIc}-${cellNo}`;
    const cellElement = cellRefs.current.get(cellKey);
    
    if (cellElement) {
      const rect = cellElement.getBoundingClientRect();
      const containerRect = cellElement.closest('.daicy-container')?.getBoundingClientRect() || { left: 0, top: 0 };
      
      setPopupPosition({
        top: rect.bottom - containerRect.top,
        left: rect.left - containerRect.left
      });
    }
    
    setSelectedCell(selectedCell?.dcIc === dcIc && selectedCell?.cellNo === cellNo ? null : { dcIc, cellNo });
  };

  const generateCellLayout = () => {
    return [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [9, 10, 11]
    ];
  };

  const statusColors = {
    normal: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    critical: 'bg-red-100 text-red-800',
    'N/A': 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="daicy-container p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-cyan-100 rounded-md overflow-y-auto relative">
      <div className="w-full max-w-6xl relative">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          DAISY CHAIN
        </h2>
        {dcIcs.map((dcIc) => (
          <div key={dcIc} className="mb-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2">DC IC {dcIc}</h3>
            <div className="space-y-2">
              {generateCellLayout().map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-2">
                  {row.map((cellNo) => {
                    const cellKey = `${dcIc}-${cellNo}`;
                    
                    const dataCellIndex = dcIc === 0 ? cellNo : cellNo + CELLS_PER_IC;
                    const dataItems = dcCsuResponseData[dcIc]?.[dataCellIndex] || [];
                    
                    const expectedVoltage = cachedData.expectedVoltages[cellKey] ?? getExpectedVoltage(cellNo, dcIc);
                    const actualVoltage = cachedData.actualVoltages[cellKey] ?? getActualVoltage(dcIc, cellNo);
                    const status = getCellStatus(dataItems, expectedVoltage);

                    return (
                      <div
                        key={cellNo}
                        ref={(el) => cellRefs.current.set(cellKey, el)}
                        className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
                        onClick={() => handleCellClick(dcIc, cellNo)}
                      >
                        <div className="text-xs">
                          <div className="flex justify-between">
                            <span>V:</span>
                            <span
                              className={
                                actualVoltage &&
                                (parseFloat(actualVoltage) > 4.5 ||
                                  (parseFloat(actualVoltage) < 2.0 && actualVoltage !== '1'))
                                  ? 'text-red-600'
                                  : ''
                              }
                            >
                              {actualVoltage ?? '-'}V
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>T.V:</span>
                            <span>{expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
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
            {Object.keys(dcCsuResponseData[dcIc] || {}).length === 0 && (
              <p className="text-center text-gray-500 mt-3">No data available for DC IC {dcIc}.</p>
            )}
          </div>
        ))}
        
        {selectedCell && popupPosition && (
          <div
            style={{
              position: 'absolute',
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
              zIndex: 50
            }}
            className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
          >
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-semibold text-gray-800">
                DC IC {selectedCell.dcIc} Cell {selectedCell.cellNo} Details
              </h3>
              <button
                className="text-gray-500 hover:text-gray-700 text-sm"
                onClick={() => {
                  setSelectedCell(null);
                  setPopupPosition(null);
                }}
              >
                ✕
              </button>
            </div>
            <div className="space-y-1.5">
              {(() => {
                const cellKey = `${selectedCell.dcIc}-${selectedCell.cellNo}`;
                const dataCellIndex = selectedCell.dcIc === 0 ? selectedCell.cellNo : selectedCell.cellNo + CELLS_PER_IC;
                const dataItems = dcCsuResponseData[selectedCell.dcIc]?.[dataCellIndex] || [];
                const expectedVoltage = cachedData.expectedVoltages[cellKey] ?? getExpectedVoltage(selectedCell.cellNo, selectedCell.dcIc);
                const voltageItems = dataItems
                  .filter((item) => item.command === 'get_dc_csu_volt')
                  .map(item => ({
                    value: item.value,
                    timestamp: new Date(item.timestamp || '').getTime() || Date.now()
                  }))
                  .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
                const latestVoltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
                const hasRecentVoltage = latestVoltage && actualVoltageTimestamps.current[cellKey];

                return (
                  <>
                    <div className="flex justify-between items-center border-b border-gray-200 pb-1.5">
                      <span className="text-xs font-medium">Most Recent Voltage:</span>
                      <span
                        className={`text-xs font-semibold ${
                          latestVoltage?.value &&
                          (parseFloat(latestVoltage.value) > 4.5 ||
                            (parseFloat(latestVoltage.value) < 2.0 && latestVoltage.value !== '1'))
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {hasRecentVoltage ? `${latestVoltage.value}V` : 'No recent voltage data'}
                      </span>
                    </div>
                    {voltageItems.length > 0 && (
                      <>
                        {voltageItems
                          .reverse() // Show latest first in the list
                          .map((item, idx) => {
                            const isLatest = idx === voltageItems.length - 1;
                            return (
                              <div key={idx} className="flex justify-between items-center">
                                <span className="text-xs font-medium">Voltage History:</span>
                                <span
                                  className={`text-xs font-semibold ${
                                    isLatest ? 'text-green-600 font-bold' : (parseFloat(item.value) > 4.5 || (parseFloat(item.value) < 2.0 && item.value !== '1') ? 'text-red-600' : '')
                                  }`}
                                >
                                  {item.value}V {isLatest && '(Latest)'}
                                </span>
                              </div>
                            );
                          })}
                      </>
                    )}
                    {dataItems
                      .filter((item) => item.command !== 'get_dc_csu_volt')
                      .map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-xs font-medium capitalize">
                            {item.command.replace('get_', '').replace('dc_csu_', 'Daisy ').replace(/_/g, ' ')}
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
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium">Tester Volt:</span>
                      <span className="text-xs font-semibold">{expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      Data index: {dataCellIndex}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
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

export default Daicy;