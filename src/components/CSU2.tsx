// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const DIFF_RESET_THRESHOLD = 0.01; // Reset tester if diff > 0.01

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
//   const [cellStates, setCellStates] = useState(
//     Array.from({ length: 12 }, () => ({
//       expected: null as number | null,
//       actual: { value: null as string | null, timestamp: 0 as number },
//       status: null as string | null,
//       hideTester: false,
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
//   const prevResponseData = useRef(responseData);
//   const prevCsu2ResponseData = useRef(csu2ResponseData);

//   // ---- Helpers ----
//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_12_csu_volt')
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
//       const cellData = responseData[cellId];
//       if (!Array.isArray(cellData)) return null;
//       const voltageData = cellData.find((item) => item.command === 'get_voltage');
//       const voltage = voltageData && voltageData.value && !isNaN(parseFloat(voltageData.value)) ? parseFloat(voltageData.value) : null;
//       // console.log(`[${new Date().toISOString()}] Cell ${cellId} Expected Voltage: ${voltage}`);
//       return voltage;
//     },
//     [responseData]
//   );

//   const getActualVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_12_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       const voltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//       // console.log(`[${new Date().toISOString()}] Cell ${cellId} Actual Voltage: ${voltage}`);
//       return voltage;
//     },
//     [cellStates]
//   );

//   const getDisplayVoltage = useMemo(
//     () => (cellId: number, dataItems: ResponseData[]) => {
//       if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_12_csu_volt')
//         .map(item => ({
//           value: item.value,
//           timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//         }))
//         .sort((a, b) => a.timestamp - b.timestamp); // Sort ascending
//       const voltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
//       // console.log(`[${new Date().toISOString()}] Cell ${cellId} Display Voltage: ${voltage}`);
//       return voltage;
//     },
//     [cellStates]
//   );

//   // Effect for Actual Voltage Updates (1000ms timeout)
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       if (resetStatus) {
//         setCellStates(prev =>
//           Array.from({ length: 12 }, (_, cellId) => ({
//             ...prev[cellId],
//             actual: { value: null, timestamp: 0 },
//             status: null,
//             hideTester: false,
//           }))
//         );
//         setCsu2ResponseData({});
//         setCsu2Statuses([]);
//         // console.log(`[${new Date().toISOString()}] CSU2 reset (actual voltages)`);
//         return;
//       }

//       if (JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)) {
//         console.log(`[${new Date().toISOString()}] CSU2 Actual Voltage Data:`, csu2ResponseData);
//         prevCsu2ResponseData.current = csu2ResponseData;

//         setCellStates(prev => {
//           const updatedCellStates = prev.map((state, cellId) => {
//             const dataItems = csu2ResponseData[cellId] || [];
//             const sortedDataItems = dataItems
//               .map(item => ({
//                 ...item,
//                 timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//               }))
//               .sort((a, b) => a.timestamp - b.timestamp);

//             const latestItem = sortedDataItems.length > 0 ? sortedDataItems[sortedDataItems.length - 1] : null;

//             if (latestItem && latestItem.command === 'get_dc_csu_volt') {
//               const newState = {
//                 ...state,
//                 actual: { value: null, timestamp: 0 },
//                 expected: null,
//                 status: 'N/A',
//                 hideTester: true,
//               };
//               console.log(`[${new Date().toISOString()}] Cell ${cellId} Disconnect Detected - Resetting state`);
//               return newState;
//             } else {
//               const voltageItems = sortedDataItems.filter(item => item.command === 'get_12_csu_volt');

//               const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//               const expectedVoltage = state.expected;
//               const prevActual = state.actual;

//               if (actualVoltageObj && (prevActual.value !== actualVoltageObj.value || prevActual.timestamp !== actualVoltageObj.timestamp)) {
//                 const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;
//                 const newState = {
//                   ...state,
//                   actual: actualVoltageObj,
//                   expected: diff > DIFF_RESET_THRESHOLD ? null : expectedVoltage,
//                   status: diff > DIFF_RESET_THRESHOLD ? null : state.status,
//                   hideTester: diff > DIFF_RESET_THRESHOLD,
//                 };
//                 console.log(
//                   `[${new Date().toISOString()}] Cell ${cellId} Actual Voltage Updated - Actual: ${actualVoltageObj.value}, Expected: ${newState.expected}, Status: ${newState.status}, HideTester: ${newState.hideTester}`
//                 );
//                 return newState;
//               }

//               return state;
//             }
//           });

//           const statuses = updatedCellStates.map((cellState, cellId) => {
//             const dataItems = csu2ResponseData[cellId] || [];
//             const status = cellState.hideTester || cellState.expected === null
//               ? 'N/A'
//               : getCellStatus(dataItems, cellState.expected);
//             const actualVoltageValue = cellState.actual?.value ?? null;

//             return {
//               label: `CSU2 - Cell ${cellId}`,
//               status: status || 'N/A',
//               details:
//                 actualVoltageValue && cellState.expected !== null && status !== 'N/A'
//                   ? `Voltage: ${actualVoltageValue} (Expected: ${cellState.expected}V)`
//                   : actualVoltageValue
//                     ? `Voltage: ${actualVoltageValue} (No expected voltage data)`
//                     : cellState.actual.value
//                       ? `Last Voltage: ${cellState.actual.value} (No current data)`
//                       : 'No voltage data available',
//             };
//           });

//           setCsu2Statuses(statuses);
//           const hasCritical = statuses.some((s) => s.status === 'critical');
//           setCriticalState(hasCritical);
//           console.log(`[${new Date().toISOString()}] Updated Cell States (actual):`, updatedCellStates);

//           return updatedCellStates;
//         });
//       }
//     }, 1000); // 1000ms for actual voltages

//     return () => clearTimeout(debounce);
//   }, [csu2ResponseData, resetStatus, setCsu2Statuses, setCriticalState, setCsu2ResponseData, getCellStatus, cellStates]);

//   // Effect for Tester Voltage Updates (0ms timeout)
//   useEffect(() => {
//     const debounce = setTimeout(() => {
//       if (resetStatus) {
//         setCellStates(prev =>
//           Array.from({ length: 12 }, (_, cellId) => ({
//             ...prev[cellId],
//             expected: getExpectedVoltage(cellId),
//             status: null,
//             hideTester: false,
//           }))
//         );
//         // console.log(`[${new Date().toISOString()}] CSU2 reset (tester voltages)`);
//         return;
//       }

//       if (JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current)) {
//         console.log(`[${new Date().toISOString()}] CSU2 Tester Voltage Data:`, responseData);
//         prevResponseData.current = responseData;

//         setCellStates(prev => {
//           const updatedCellStates = prev.map((state, cellId) => {
//             const expectedVoltage = getExpectedVoltage(cellId);
//             const dataItems = csu2ResponseData[cellId] || [];
//             const status = state.hideTester || expectedVoltage === null
//               ? 'N/A'
//               : getCellStatus(dataItems, expectedVoltage);

//             const newState = {
//               ...state,
//               expected: expectedVoltage,
//               status,
//             };
//             console.log(
//               `[${new Date().toISOString()}] Cell ${cellId} Tester Voltage Updated - Expected: ${newState.expected}, Status: ${newState.status}, HideTester: ${newState.hideTester}`
//             );
//             return newState;
//           });

//           const statuses = updatedCellStates.map((cellState, cellId) => {
//             const dataItems = csu2ResponseData[cellId] || [];
//             const actualVoltageValue = cellState.actual?.value ?? null;

//             return {
//               label: `CSU2 - Cell ${cellId}`,
//               status: cellState.status || 'N/A',
//               details:
//                 actualVoltageValue && cellState.expected !== null && cellState.status !== 'N/A'
//                   ? `Voltage: ${actualVoltageValue} (Expected: ${cellState.expected}V)`
//                   : actualVoltageValue
//                     ? `Voltage: ${actualVoltageValue} (No expected voltage data)`
//                     : cellState.actual.value
//                       ? `Last Voltage: ${cellState.actual.value} (No current data)`
//                       : 'No voltage data available',
//             };
//           });

//           setCsu2Statuses(statuses);
//           const hasCritical = statuses.some((s) => s.status === 'critical');
//           setCriticalState(hasCritical);
//           console.log(`[${new Date().toISOString()}] Updated Cell States (tester):`, updatedCellStates);

//           return updatedCellStates;
//         });
//       }
//     }, 0); // 0ms for tester voltages

//     return () => clearTimeout(debounce);
//   }, [responseData, resetStatus, setCsu2Statuses, setCriticalState, getCellStatus, getExpectedVoltage, csu2ResponseData, cellStates]);

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
//                 const state = cellStates[cellId] ?? { expected: null, actual: { value: null }, status: 'N/A', hideTester: false };
//                 const expectedVoltage = state.expected;
//                 const displayVoltage = getDisplayVoltage(cellId, dataItems);
//                 const currentActualVoltage = getActualVoltage(cellId, dataItems);
//                 const status = state.status ?? getCellStatus(dataItems, expectedVoltage);
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
//                         </span>
//                       </div>
//                       <div className="flex justify-between">
//                         <span>T.V:</span>
//                         <span>{!state.hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
//                       </div>
//                       <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
//                         <span className="text-xs font-light">
//                           {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
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
//                             {[...csu2ResponseData[selectedCell]
//                               .filter(item => item.command === 'get_12_csu_volt')
//                               .map(item => ({
//                                 ...item,
//                                 timestamp: new Date(item.timestamp || '').getTime() || Date.now()
//                               }))
//                               .sort((a, b) => a.timestamp - b.timestamp)
//                             ].reverse().map((item, idx) => {
//                               const currentActual = cellStates[selectedCell]?.actual;
//                               const isLatest = currentActual && currentActual.timestamp === item.timestamp;
//                               return (
//                                 <div key={idx} className="flex justify-between items-center">
//                                   <span className="text-xs font-medium capitalize">
//                                     {item.command.replace('get_', '').replace('_12_csu_', 'CSU12 ').replace(/_/g, ' ')}
//                                   </span>
//                                   <span
//                                     className={`text-xs font-semibold ${
//                                       isLatest ? 'text-green-600 font-bold' : (parseFloat(item.value) > 4.5 || (parseFloat(item.value) < 2.0 && item.value !== '1') ? 'text-red-600' : '')
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
//                                 {!state.hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
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







/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const DIFF_RESET_THRESHOLD = 0.01;

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
  const [cellStates, setCellStates] = useState(
    Array.from({ length: 12 }, () => ({
      expected: null as number | null,
      actual: { value: null as string | null, timestamp: 0 as number },
      status: null as string | null,
      hideTester: false,
    }))
  );

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevResponseData = useRef(responseData);
  const prevCsu2ResponseData = useRef(csu2ResponseData);

  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_12_csu_volt')
        .map(item => ({
          value: parseFloat(item.value),
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
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
      const cellData = responseData[cellId];
      if (!Array.isArray(cellData)) return null;
      const voltageData = cellData.find((item) => item.command === 'get_voltage');
      const voltage = voltageData && voltageData.value && !isNaN(parseFloat(voltageData.value)) ? parseFloat(voltageData.value) : null;
      console.log(`[${new Date().toISOString()}] Cell ${cellId} Expected Voltage: ${voltage}`);
      return voltage;
    },
    [responseData]
  );

  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      if (!Array.isArray(dataItems)) return null; // Changed to return null if no dataItems
      const voltageItems = dataItems
        .filter((item) => item.command === 'get_12_csu_volt')
        .map(item => ({
          value: item.value,
          timestamp: new Date(item.timestamp || '').getTime() || Date.now()
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      const voltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : null;
      console.log(`[${new Date().toISOString()}] Cell ${cellId} Actual Voltage: ${voltage}`);
      return voltage;
    },
    []
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
        .sort((a, b) => a.timestamp - b.timestamp);
      const voltage = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1].value : cellStates[cellId].actual.value;
      console.log(`[${new Date().toISOString()}] Cell ${cellId} Display Voltage: ${voltage}`);
      return voltage;
    },
    [cellStates]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (resetStatus && Object.keys(csu2ResponseData).length === 0) {
        setCellStates(prev =>
          Array.from({ length: 12 }, (_, cellId) => ({
            ...prev[cellId],
            actual: { value: null, timestamp: 0 },
            status: null,
            hideTester: false,
          }))
        );
        setCsu2ResponseData({});
        setCsu2Statuses(
          Array.from({ length: 12 }, (_, cellId) => {
            const expectedVoltage = getExpectedVoltage(cellId);
            const dataItems = csu2ResponseData[cellId] || [];
            const actualVoltage = getActualVoltage(cellId, dataItems);
            const details = [
              actualVoltage !== null ? `Voltage: ${actualVoltage} V` : null,
              expectedVoltage !== null ? `Expected: ${expectedVoltage.toFixed(2)} V` : null,
            ]
              .filter(Boolean)
              .join(", ") || 'No voltage data available';
            return {
              label: `CSU2 - Cell ${cellId}`,
              status: 'N/A',
              details,
            };
          })
        );
        console.log(`[${new Date().toISOString()}] CSU2 reset (actual voltages)`);
        return;
      }

      if (JSON.stringify(csu2ResponseData) !== JSON.stringify(prevCsu2ResponseData.current)) {
        console.log(`[${new Date().toISOString()}] CSU2 Actual Voltage Data:`, csu2ResponseData);
        prevCsu2ResponseData.current = csu2ResponseData;

        setCellStates(prev => {
          const updatedCellStates = prev.map((state, cellId) => {
            const dataItems = csu2ResponseData[cellId] || [];
            const sortedDataItems = dataItems
              .map(item => ({
                ...item,
                timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
              }))
              .sort((a, b) => a.timestamp - b.timestamp);

            const latestItem = sortedDataItems.length > 0 ? sortedDataItems[sortedDataItems.length - 1] : null;

            if (latestItem && latestItem.command === 'get_dc_csu_volt') {
              const newState = {
                ...state,
                actual: { value: null, timestamp: 0 },
                expected: null,
                status: 'N/A',
                hideTester: true,
              };
              console.log(`[${new Date().toISOString()}] Cell ${cellId} Disconnect Detected - Resetting state`);
              return newState;
            } else {
              const voltageItems = sortedDataItems.filter(item => item.command === 'get_12_csu_volt');

              const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
              const expectedVoltage = state.expected;
              const prevActual = state.actual;

              if (actualVoltageObj && (prevActual.value !== actualVoltageObj.value || prevActual.timestamp !== actualVoltageObj.timestamp)) {
                const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;
                const newState = {
                  ...state,
                  actual: actualVoltageObj,
                  expected: diff > DIFF_RESET_THRESHOLD ? null : expectedVoltage,
                  status: diff > DIFF_RESET_THRESHOLD ? null : state.status,
                  hideTester: diff > DIFF_RESET_THRESHOLD,
                };
                console.log(
                  `[${new Date().toISOString()}] Cell ${cellId} Actual Voltage Updated - Actual: ${actualVoltageObj.value}, Expected: ${newState.expected}, Status: ${newState.status}, HideTester: ${newState.hideTester}`
                );
                return newState;
              }

              return state;
            }
          });

          const statuses = updatedCellStates.map((cellState, cellId) => {
            const dataItems = csu2ResponseData[cellId] || [];
            const status = cellState.hideTester || cellState.expected === null
              ? 'N/A'
              : getCellStatus(dataItems, cellState.expected);
            const actualVoltage = getActualVoltage(cellId, dataItems);
            const expectedVoltage = cellState.expected;

            const details = [
              actualVoltage !== null ? `Voltage: ${actualVoltage} V` : null,
              expectedVoltage !== null ? `Expected: ${expectedVoltage.toFixed(2)} V` : null,
            ]
              .filter(Boolean)
              .join(", ") || 'No voltage data available';

            return {
              label: `CSU2 - Cell ${cellId}`,
              status: status || 'N/A',
              details,
            };
          });

          setCsu2Statuses(statuses);
          console.log(`[${new Date().toISOString()}] Set csu2Statuses:`, statuses);
          const hasCritical = statuses.some((s) => s.status === 'critical');
          setCriticalState(hasCritical);
          console.log(`[${new Date().toISOString()}] Updated Cell States (actual):`, updatedCellStates);

          return updatedCellStates;
        });
      }
    }, 1000);

    return () => clearTimeout(debounce);
  }, [csu2ResponseData, resetStatus, setCsu2Statuses, setCriticalState, setCsu2ResponseData, getCellStatus]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (resetStatus && Object.keys(csu2ResponseData).length === 0) {
        setCellStates(prev =>
          Array.from({ length: 12 }, (_, cellId) => ({
            ...prev[cellId],
            expected: getExpectedVoltage(cellId),
            status: null,
            hideTester: false,
          }))
        );
        setCsu2Statuses(
          Array.from({ length: 12 }, (_, cellId) => {
            const expectedVoltage = getExpectedVoltage(cellId);
            const dataItems = csu2ResponseData[cellId] || [];
            const actualVoltage = getActualVoltage(cellId, dataItems);
            const details = [
              actualVoltage !== null ? `Voltage: ${actualVoltage} V` : null,
              expectedVoltage !== null ? `Expected: ${expectedVoltage.toFixed(2)} V` : null,
            ]
              .filter(Boolean)
              .join(", ") || 'No voltage data available';
            return {
              label: `CSU2 - Cell ${cellId}`,
              status: 'N/A',
              details,
            };
          })
        );
        console.log(`[${new Date().toISOString()}] CSU2 reset (tester voltages)`);
        return;
      }

      if (JSON.stringify(responseData) !== JSON.stringify(prevResponseData.current)) {
        console.log(`[${new Date().toISOString()}] CSU2 Tester Voltage Data:`, responseData);
        prevResponseData.current = responseData;

        setCellStates(prev => {
          const updatedCellStates = prev.map((state, cellId) => {
            const expectedVoltage = getExpectedVoltage(cellId);
            const dataItems = csu2ResponseData[cellId] || [];
            const status = state.hideTester || expectedVoltage === null
              ? 'N/A'
              : getCellStatus(dataItems, expectedVoltage);

            const newState = {
              ...state,
              expected: expectedVoltage,
              status,
            };
            console.log(
              `[${new Date().toISOString()}] Cell ${cellId} Tester Voltage Updated - Expected: ${newState.expected}, Status: ${newState.status}, HideTester: ${newState.hideTester}`
            );
            return newState;
          });

          const statuses = updatedCellStates.map((cellState, cellId) => {
            const dataItems = csu2ResponseData[cellId] || [];
            const actualVoltage = getActualVoltage(cellId, dataItems);
            const expectedVoltage = cellState.expected;

            const details = [
              actualVoltage !== null ? `Voltage: ${actualVoltage} V` : null,
              expectedVoltage !== null ? `Expected: ${expectedVoltage.toFixed(2)} V` : null,
            ]
              .filter(Boolean)
              .join(", ") || 'No voltage data available';

            return {
              label: `CSU2 - Cell ${cellId}`,
              status: cellState.status || 'N/A',
              details,
            };
          });

          setCsu2Statuses(statuses);
          console.log(`[${new Date().toISOString()}] Set csu2Statuses:`, statuses);
          const hasCritical = statuses.some((s) => s.status === 'critical');
          setCriticalState(hasCritical);
          console.log(`[${new Date().toISOString()}] Updated Cell States (tester):`, updatedCellStates);

          return updatedCellStates;
        });
      }
    }, 0);

    return () => clearTimeout(debounce);
  }, [responseData, resetStatus, setCsu2Statuses, setCriticalState, getCellStatus, getExpectedVoltage, csu2ResponseData]);

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
                const state = cellStates[cellId] ?? { expected: null, actual: { value: null }, status: 'N/A', hideTester: false };
                const expectedVoltage = state.expected;
                const displayVoltage = getDisplayVoltage(cellId, dataItems);
                const currentActualVoltage = getActualVoltage(cellId, dataItems);
                const status = state.status ?? getCellStatus(dataItems, expectedVoltage);
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
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>T.V:</span>
                        <span>{!state.hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : '-'}</span>
                      </div>
                      <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
                        <span className="text-xs font-light">
                          {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'N/A'}
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
                              .sort((a, b) => a.timestamp - b.timestamp)
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
                                {!state.hideTester && expectedVoltage !== null ? `${expectedVoltage}V` : 'N/A'}
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