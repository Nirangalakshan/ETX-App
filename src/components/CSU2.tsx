// // CSU2.tsx
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
//   const { csu2ResponseData, instructions, setCsu2Statuses } = useBatteryContext();
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
//     const cellInstructions = instructions.filter((instr) => parseInt(instr.cellNo) === cellId);
//     const setVoltageInstruction = cellInstructions.find((instr) => instr.command === 'set_voltage');
//     if (setVoltageInstruction && setVoltageInstruction.voltage) {
//       const parsedSetVoltage = parseInt(setVoltageInstruction.voltage);
//       return !isNaN(parsedSetVoltage) && parsedSetVoltage >= 1 && parsedSetVoltage <= 8 ? parsedSetVoltage : null;
//     }
//     return null;
//   };

//   const getSetTemperature = (cellId: number) => {
//     const cellInstructions = instructions.filter((instr) => parseInt(instr.cellNo) === cellId);
//     const setTempInstruction = cellInstructions.find((instr) => instr.command === 'set_temp');
//     if (setTempInstruction && setTempInstruction.temperature) {
//       const parsedSetTemp = parseFloat(setTempInstruction.temperature);
//       return !isNaN(parsedSetTemp) ? parsedSetTemp : null;
//     }
//     return null;
//   };

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
//   }, [csu2ResponseData, instructions, setCsu2Statuses]);

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
//           CSU2
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
import React, { useState, useRef, useEffect } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

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

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

const CSU2: React.FC = () => {
  const { csu2ResponseData, instructions, setCsu2Statuses, setCriticalState } = useBatteryContext();
  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getCellStatus = (dataItems: ResponseData[], setVoltage: number | null, setTemperature: number | null) => {
    const voltageItem = dataItems.find((item) => item.command === 'get_12_csu_volt');
    const tempItem = dataItems.find((item) => item.command === 'get_12_csu_temp');
    const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
    const temp = tempItem ? parseFloat(tempItem.value.replace(' °C', '')) : null;

    if (voltage !== null && setVoltage !== null && setVoltage in EXPECTED_SENT_VOLTAGES) {
      const expectedVoltage = EXPECTED_SENT_VOLTAGES[setVoltage];
      const voltageGap = Math.abs(expectedVoltage - voltage);
      if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return 'critical';
      if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return 'warning';
    }
    if (temp !== null && setTemperature !== null) {
      const tempGap = Math.abs(setTemperature - temp);
      if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) return 'critical';
      if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) return 'warning';
    }
    return dataItems.length === 0 ? 'N/A' : 'normal';
  };

  const getSetVoltage = (cellId: number) => {
  const globalCellId = cellId + 12; // shift to 12–23
  const cellInstructions = instructions.filter(
    (instr) => parseInt(instr.cellNo) === globalCellId
  );
  const setVoltageInstruction = cellInstructions.find((instr) => instr.command === 'set_voltage');
  if (setVoltageInstruction && setVoltageInstruction.voltage) {
    const parsedSetVoltage = parseInt(setVoltageInstruction.voltage);
    return !isNaN(parsedSetVoltage) && parsedSetVoltage >= 1 && parsedSetVoltage <= 8
      ? parsedSetVoltage
      : null;
  }
  return null;
};

const getSetTemperature = (cellId: number) => {
  const globalCellId = cellId + 12; // shift to 12–23
  const cellInstructions = instructions.filter(
    (instr) => parseInt(instr.cellNo) === globalCellId
  );
  const setTempInstruction = cellInstructions.find((instr) => instr.command === 'set_temp');
  if (setTempInstruction && setTempInstruction.temperature) {
    const parsedSetTemp = parseFloat(setTempInstruction.temperature);
    return !isNaN(parsedSetTemp) ? parsedSetTemp : null;
  }
  return null;
};
  useEffect(() => {
    const statuses = Array.from({ length: 12 }, (_, cellId) => {
      const dataItems = csu2ResponseData[cellId] || [];
      const setVoltage = getSetVoltage(cellId);
      const setTemperature = getSetTemperature(cellId);
      const status = getCellStatus(dataItems, setVoltage, setTemperature);
      return {
        label: `CSU2 - Cell ${cellId}`,
        status,
        details: setVoltage != null && status !== 'N/A'
          ? `Voltage: ${dataItems.find(item => item.command === 'get_12_csu_volt')?.value || '-'} (Expected: ${EXPECTED_SENT_VOLTAGES[setVoltage] || '-'}V)`
          : setTemperature != null
          ? `Temperature: ${dataItems.find(item => item.command === 'get_12_csu_temp')?.value || '-'} (Expected: ${setTemperature?.toFixed(1) || '-'}°C)`
          : 'No data'
      };
    });
    setCsu2Statuses(statuses);
    
    // Check for critical state and update context
    const hasCritical = statuses.some(status => status.status === 'critical');
    if (hasCritical) {
      setCriticalState(true);
    }
  }, [csu2ResponseData, instructions, setCsu2Statuses, setCriticalState]);

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
                const setVoltage = getSetVoltage(cellId);
                const setTemperature = getSetTemperature(cellId);
                const status = getCellStatus(dataItems, setVoltage, setTemperature);
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
                    className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative"
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
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">Sent Voltage Command:</span>
                            <span className="text-xs font-semibold">
                              {setVoltage != null ? setVoltage.toString() : 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium">Expected Voltage:</span>
                            <span className="text-xs font-semibold">
                              {setVoltage != null && setVoltage in EXPECTED_SENT_VOLTAGES
                                ? `${EXPECTED_SENT_VOLTAGES[setVoltage]}V`
                                : 'N/A'}
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
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default CSU2;