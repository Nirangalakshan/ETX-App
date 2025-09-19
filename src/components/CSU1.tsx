// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

// const CSU1: React.FC = () => {
//   const { csu1ResponseData, responseData, setCsu1Statuses, setCriticalState } = useBatteryContext();
//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const getCellStatus = (dataItems: ResponseData[], expectedVoltage: number | null) => {
//     const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
//     const voltage = voltageItem ? parseFloat(voltageItem.value) : null;

//     if (voltage !== null && expectedVoltage !== null) {
//       const voltageGap = Math.abs(expectedVoltage - voltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//     }
//     return dataItems.length === 0 ? 'N/A' : 'normal';
//   };

//   const getExpectedVoltage = (cellId: number) => {
//     const globalCellId = cellId + 12; // CSU1 -> global 12–23
//     const cellData = responseData[globalCellId] || [];
//     const voltageData = cellData.find((item) => item.command === 'get_voltage');
//     if (voltageData && voltageData.value) {
//       const parsedVoltage = parseFloat(voltageData.value);
//       return isNaN(parsedVoltage) ? null : parsedVoltage;
//     }
//     return null;
//   };

//   useEffect(() => {
//     console.log('CSU1 Response Data:', csu1ResponseData);
//     console.log('Global Response Data:', responseData);
//     const statuses = Array.from({ length: 12 }, (_, cellId) => {
//       const dataItems = csu1ResponseData[cellId] || [];
//       const expectedVoltage = getExpectedVoltage(cellId);
//       const status = getCellStatus(dataItems, expectedVoltage);
//       const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
//       return {
//         label: `CSU1 - Cell ${cellId}`,
//         status,
//         details: voltageItem && expectedVoltage !== null && status !== 'N/A'
//           ? `Voltage: ${voltageItem.value} (Expected: ${expectedVoltage}V)`
//           : 'No expected voltage data'
//       };
//     });
//     setCsu1Statuses(statuses);
    
//     // Check for critical state and update context
//     const hasCritical = statuses.some(status => status.status === 'critical');
//     if (hasCritical) {
//       setCriticalState(true);
//     }
//   }, [csu1ResponseData, responseData, setCsu1Statuses, setCriticalState]);

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
//     <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-gray-200 rounded-md">
//       <div className="w-full max-w-6xl relative">
//         <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//           CSU11
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu1ResponseData[cellId] || [];
//                 const expectedVoltage = getExpectedVoltage(cellId);
//                 const status = getCellStatus(dataItems, expectedVoltage);
//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };
//                 const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');

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
//                             voltageItem &&
//                             (parseFloat(voltageItem.value) > 4.5 ||
//                               (parseFloat(voltageItem.value) < 2.0 && voltageItem.value !== '1'))
//                               ? 'text-red-600'
//                               : ''
//                           }
//                         >
//                           {voltageItem ? voltageItem.value : '-'}
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>
//                           {expectedVoltage !== null ? `${expectedVoltage}V` : '-'}
//                         </span>
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







/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

const CSU1: React.FC = () => {
  const { csu1ResponseData, responseData, setCsu1Statuses, setCriticalState } = useBatteryContext();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cachedData, setCachedData] = useState<{
    expectedVoltages: (number | null)[];
    actualVoltages: (string | null)[];
  }>({
    expectedVoltages: Array(12).fill(null),
    actualVoltages: Array(12).fill(null),
  });
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevResponseData = useRef(responseData);
  const prevCsu1ResponseData = useRef(csu1ResponseData);

  // Initialize warningStates for all cells
  const warningStates = useRef<{ [key: number]: { responseDataInvalid: boolean; csu1DataInvalid: boolean } }>(
    Array.from({ length: 12 }, (_, i) => ({
      responseDataInvalid: false,
      csu1DataInvalid: false,
    }))
  );

  // Track previous cell states to log only when data changes
  const prevCellStates = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      expected: null as number | null,
      actual: null as string | null,
      status: null as string | null,
    }))
  );

  // Memoized getCellStatus function
  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
      const voltage = voltageItem ? parseFloat(voltageItem.value) : null;

      if (voltage !== null && expectedVoltage !== null) {
        const voltageGap = Math.abs(expectedVoltage - voltage);
        if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
        if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
      }
      return dataItems.length === 0 ? 'N/A' : 'normal';
    },
    []
  );

  // Memoized getExpectedVoltage function with validation
  const getExpectedVoltage = useMemo(
    () => (cellId: number) => {
      const globalCellId = cellId + 12; // CSU1 -> global 12–23
      const cellData = responseData[globalCellId];
      const prevInvalid = warningStates.current[cellId].responseDataInvalid;

      if (!Array.isArray(cellData)) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId] ?? null;
      }

      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      if (!voltageData || !voltageData.value) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId] ?? null;
      }

      const parsedVoltage = parseFloat(voltageData.value);
      if (isNaN(parsedVoltage)) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId] ?? null;
      }

      warningStates.current[cellId].responseDataInvalid = false;
      return parsedVoltage;
    },
    [responseData, cachedData.expectedVoltages]
  );

  // Memoized getActualVoltage function
  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      const prevInvalid = warningStates.current[cellId].csu1DataInvalid;
      const voltageItem = dataItems.find((item) => item.command === 'get_11_csu_volt');
      if (voltageItem && voltageItem.value) {
        warningStates.current[cellId].csu1DataInvalid = false;
        return voltageItem.value;
      }
      if (!prevInvalid) {
        console.warn(`[${new Date().toISOString()}] No get_11_csu_volt for cell ${cellId}:`, dataItems);
        warningStates.current[cellId].csu1DataInvalid = true;
      }
      return cachedData.actualVoltages[cellId] ?? null;
    },
    [cachedData.actualVoltages]
  );

  // Effect for logging large payloads only when data changes
  useEffect(() => {
    if (
      JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
      JSON.stringify(csu1ResponseData) !== JSON.stringify(prevCsu1ResponseData.current)
    ) {
      console.log(`[${new Date().toISOString()}] CSU1 Response Data:`, JSON.stringify(csu1ResponseData, null, 2));
      console.log(`[${new Date().toISOString()}] Global Response Data:`, JSON.stringify(responseData, null, 2));
      prevResponseData.current = responseData;
      prevCsu1ResponseData.current = csu1ResponseData;
    }
  }, [responseData, csu1ResponseData]);

  // Effect for updating statuses and cache
  useEffect(() => {
    const debounce = setTimeout(() => {
      const newExpectedVoltages = [...cachedData.expectedVoltages];
      const newActualVoltages = [...cachedData.actualVoltages];
      const statuses = Array.from({ length: 12 }, (_, cellId) => {
        const dataItems = csu1ResponseData[cellId] || [];
        const expectedVoltage = getExpectedVoltage(cellId);
        const actualVoltage = getActualVoltage(cellId, dataItems);
        const status = getCellStatus(dataItems, expectedVoltage);

        // Update cache only if changed
        newExpectedVoltages[cellId] =
          expectedVoltage !== cachedData.expectedVoltages[cellId] ? expectedVoltage : cachedData.expectedVoltages[cellId];
        newActualVoltages[cellId] =
          actualVoltage !== cachedData.actualVoltages[cellId] ? actualVoltage : cachedData.actualVoltages[cellId];

        // Log only when expected/actual/status changes and not N/A
        const prev = prevCellStates.current[cellId];
        if (prev.expected !== expectedVoltage || prev.actual !== actualVoltage || prev.status !== status) {
          if (status !== 'N/A') {
            console.log(
              `[${new Date().toISOString()}] Cell ${cellId} - Expected Voltage: ${expectedVoltage ?? '-'}, Actual Voltage: ${actualVoltage ?? '-'}, Status: ${status}`
            );
          }
          prevCellStates.current[cellId] = { expected: expectedVoltage, actual: actualVoltage, status };
        }

        return {
          label: `CSU1 - Cell ${cellId}`,
          status,
          details:
            actualVoltage && expectedVoltage !== null && status !== 'N/A'
              ? `Voltage: ${actualVoltage} (Expected: ${expectedVoltage}V)`
              : 'No expected voltage data',
        };
      });

      setCachedData({
        expectedVoltages: newExpectedVoltages,
        actualVoltages: newActualVoltages,
      });

      setCsu1Statuses(statuses);

      const hasCritical = statuses.some((s) => s.status === 'critical');
      if (hasCritical) {
        console.log(`[${new Date().toISOString()}] Critical state detected in CSU1`);
        setCriticalState(true);
      }
    }, 500);

    return () => clearTimeout(debounce);
  }, [csu1ResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setCsu1Statuses, setCriticalState]);

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
                const expectedVoltage = cachedData.expectedVoltages[cellId] ?? getExpectedVoltage(cellId);
                const actualVoltage = cachedData.actualVoltages[cellId] ?? getActualVoltage(cellId, dataItems);
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
                            actualVoltage &&
                            (parseFloat(actualVoltage) > 4.5 ||
                              (parseFloat(actualVoltage) < 2.0 && actualVoltage !== '1'))
                              ? 'text-red-600'
                              : ''
                          }
                        >
                          {actualVoltage ?? '-'}
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
                    {selectedCell === cellId && csu1ResponseData[selectedCell] && (
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
                          {csu1ResponseData[selectedCell].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-xs font-medium capitalize">
                                {item.command
                                  .replace('get_', '')
                                  .replace('_11_csu_', 'CSU11 ')
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
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">Tester Volt:</span>
                            <span className="text-xs font-semibold">
                              {expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
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
        {Object.keys(csu1ResponseData).length === 0 && (
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

export default CSU1;