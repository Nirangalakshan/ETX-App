// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
//   1: 2.0,
//   2: 2.5,
//   3: 2.8,
//   4: 3.3,
//   5: 3.4,
//   6: 3.6,
//   7: 4.0,
//   8: 4.2,
// };

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const TEMPERATURE_WARNING_THRESHOLD = 5;
// const TEMPERATURE_CRITICAL_THRESHOLD = 10;

// const CSU2: React.FC = () => {
//   const { csu2ResponseData, instructions, setCsu2Statuses, setCriticalState } = useBatteryContext();
//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const getCellStatus = (dataItems: ResponseData[], setVoltage: number | null, setTemperature: number | null) => {
//     const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//     const tempItem = dataItems.find((item) => item.command === 'get_12_csu_temp');
//     const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
//     const temp = tempItem ? parseFloat(tempItem.value.replace(' °C', '')) : null;

//     if (voltage !== null && setVoltage !== null && setVoltage in EXPECTED_SENT_VOLTAGES) {
//       const expectedVoltage = EXPECTED_SENT_VOLTAGES[setVoltage];
//       const voltageGap = Math.abs(expectedVoltage - voltage);
//       if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
//       if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
//     }
//     if (temp !== null && setTemperature !== null) {
//       const tempGap = Math.abs(setTemperature - temp);
//       if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) return 'critical';
//       if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) return 'warning';
//     }
//     return dataItems.length === 0 ? 'N/A' : 'normal';
//   };

//   const getSetVoltage = (cellId: number) => {
//   const globalCellId = cellId; // CSU2 -> global 0–11
//   const cellInstructions = instructions.filter(
//     (instr) => parseInt(instr.cellNo) === globalCellId
//   );
//   const setVoltageInstruction = cellInstructions.find((instr) => instr.command === 'set_voltage');
//   if (setVoltageInstruction && setVoltageInstruction.voltage) {
//     const parsedSetVoltage = parseInt(setVoltageInstruction.voltage);
//     return !isNaN(parsedSetVoltage) && parsedSetVoltage >= 1 && parsedSetVoltage <= 8
//       ? parsedSetVoltage
//       : null;
//   }
//   return null;
// };

// const getSetTemperature = (cellId: number) => {
//   const globalCellId = cellId; // CSU2 -> global 0–11
//   const cellInstructions = instructions.filter(
//     (instr) => parseInt(instr.cellNo) === globalCellId
//   );
//   const setTempInstruction = cellInstructions.find((instr) => instr.command === 'set_temp');
//   if (setTempInstruction && setTempInstruction.temperature) {
//     const parsedSetTemp = parseFloat(setTempInstruction.temperature);
//     return !isNaN(parsedSetTemp) ? parsedSetTemp : null;
//   }
//   return null;
// };

//   useEffect(() => {
//     const statuses = Array.from({ length: 12 }, (_, cellId) => {
//       const dataItems = csu2ResponseData[cellId] || [];
//       const setVoltage = getSetVoltage(cellId);
//       const setTemperature = getSetTemperature(cellId);
//       const status = getCellStatus(dataItems, setVoltage, setTemperature);
//       return {
//         label: `CSU2 - Cell ${cellId}`,
//         status,
//         details: setVoltage != null && status !== 'N/A'
//           ? `Voltage: ${dataItems.find(item => item.command === 'get_12_csu_volt')?.value || '-'} (Expected: ${EXPECTED_SENT_VOLTAGES[setVoltage] || '-'}V)`
//           : setTemperature != null
//           ? `Temperature: ${dataItems.find(item => item.command === 'get_12_csu_temp')?.value || '-'} (Expected: ${setTemperature?.toFixed(1) || '-'}°C)`
//           : 'No data'
//       };
//     });
//     setCsu2Statuses(statuses);
    
//     // Check for critical state and update context
//     const hasCritical = statuses.some(status => status.status === 'critical');
//     if (hasCritical) {
//       setCriticalState(true);
//     }
//   }, [csu2ResponseData, instructions, setCsu2Statuses, setCriticalState]);

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
//           CSU12
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = csu2ResponseData[cellId] || [];
//                 const setVoltage = getSetVoltage(cellId);
//                 const setTemperature = getSetTemperature(cellId);
//                 const status = getCellStatus(dataItems, setVoltage, setTemperature);
//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };
//                 const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
//                 const tempItem = dataItems.find((item) => item.command === 'get_12_csu_temp');

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
//                         <span>T:</span>
//                         <span>{tempItem ? tempItem.value : '-'}</span>
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
//                             <span className="text-xs font-medium">Sent Voltage Command:</span>
//                             <span className="text-xs font-semibold">
//                               {setVoltage != null ? setVoltage.toString() : 'N/A'}
//                             </span>
//                           </div>
//                           <div className="flex justify-between items-center">
//                             <span className="text-xs font-medium">Expected Voltage:</span>
//                             <span className="text-xs font-semibold">
//                               {setVoltage != null && setVoltage in EXPECTED_SENT_VOLTAGES
//                                 ? `${EXPECTED_SENT_VOLTAGES[setVoltage]}V`
//                                 : 'N/A'}
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
//         .animate-fade-in {
//           animation: fade-in 0.2s ease-out;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default CSU2;











/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;

const CSU2: React.FC = () => {
  const { csu2ResponseData, responseData, setCsu2Statuses, setCriticalState } = useBatteryContext();
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
  const prevCsu2ResponseData = useRef(csu2ResponseData);

  // To avoid repeating the same warnings over and over
  const warningStates = useRef<{ [key: number]: { responseDataInvalid: boolean; csu2DataInvalid: boolean } }>(
    Array.from({ length: 12 }, () => ({
      responseDataInvalid: false,
      csu2DataInvalid: false,
    }))
  );

  // ✅ Track last logged values to prevent spam logs
  const prevCellStates = useRef(
    Array.from({ length: 12 }, () => ({
      expected: null as number | null,
      actual: null as string | null,
      status: null as string | null,
    }))
  );

  // ---- Helpers kept INSIDE the component ----
  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
      const voltage = voltageItem ? parseFloat(voltageItem.value) : null;

      if (voltage !== null && expectedVoltage !== null) {
        const voltageGap = Math.abs(expectedVoltage - voltage);
        if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
        if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
      }
      // If there is simply no data, mark N/A; otherwise normal
      return dataItems.length === 0 ? 'N/A' : 'normal';
    },
    []
  );

  const getExpectedVoltage = useMemo(
    () => (cellId: number) => {
      const globalCellId = cellId; // CSU2 -> global 0–11
      const cellData = responseData[globalCellId];
      const prevInvalid = warningStates.current[cellId].responseDataInvalid;

      if (!Array.isArray(cellData)) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] responseData[${globalCellId}] is not an array:`, cellData);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId];
      }

      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      if (!voltageData || !voltageData.value) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] No valid get_voltage for cell ${globalCellId}:`, voltageData);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId];
      }

      const parsedVoltage = parseFloat(voltageData.value);
      if (isNaN(parsedVoltage)) {
        if (!prevInvalid) {
          console.warn(`[${new Date().toISOString()}] Invalid get_voltage value for cell ${globalCellId}:`, voltageData.value);
          warningStates.current[cellId].responseDataInvalid = true;
        }
        return cachedData.expectedVoltages[cellId];
      }

      warningStates.current[cellId].responseDataInvalid = false;
      return parsedVoltage;
    },
    [responseData, cachedData.expectedVoltages]
  );

  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      const prevInvalid = warningStates.current[cellId].csu2DataInvalid;
      const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
      if (voltageItem && voltageItem.value) {
        warningStates.current[cellId].csu2DataInvalid = false;
        return voltageItem.value; // keep as string to match incoming data
      }
      if (!prevInvalid) {
        console.warn(`[${new Date().toISOString()}] No get_12_csu_volt for cell ${cellId}:`, dataItems);
        warningStates.current[cellId].csu2DataInvalid = true;
      }
      return cachedData.actualVoltages[cellId];
    },
    [cachedData.actualVoltages]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      // Log the big payloads only when changed
      if (
        JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current) ||
        JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)
      ) {
        console.log(`[${new Date().toISOString()}] CSU2 Response Data:`, JSON.stringify(csu2ResponseData, null, 2));
        console.log(`[${new Date().toISOString()}] Global Response Data:`, JSON.stringify(responseData, null, 2));
        prevResponseData.current = responseData;
        prevCsu2ResponseData.current = csu2ResponseData;
      }

      // Update cache and statuses
      const newExpectedVoltages = [...cachedData.expectedVoltages];
      const newActualVoltages = [...cachedData.actualVoltages];

      const statuses = Array.from({ length: 12 }, (_, cellId) => {
        const dataItems = csu2ResponseData[cellId] || [];
        const expectedVoltage = getExpectedVoltage(cellId);
        const actualVoltage = getActualVoltage(cellId, dataItems);
        const status = getCellStatus(dataItems, expectedVoltage);

        // Update cache only if changed
        newExpectedVoltages[cellId] =
          expectedVoltage !== cachedData.expectedVoltages[cellId] ? expectedVoltage : cachedData.expectedVoltages[cellId];
        newActualVoltages[cellId] =
          actualVoltage !== cachedData.actualVoltages[cellId] ? actualVoltage : cachedData.actualVoltages[cellId];

        // ✅ Only log when expected/actual/status actually changed (and not N/A)
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
          label: `CSU2 - Cell ${cellId}`,
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

      setCsu2Statuses(statuses);

      const hasCritical = statuses.some((s) => s.status === 'critical');
      if (hasCritical) {
        console.log(`[${new Date().toISOString()}] Critical state detected in CSU2`);
        setCriticalState(true);
      }
    }, 500); // debounce

    return () => clearTimeout(debounce);
  }, [csu2ResponseData, responseData, getCellStatus, getExpectedVoltage, getActualVoltage, setCsu2Statuses, setCriticalState, cachedData]);

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
