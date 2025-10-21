// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useState, useRef, useEffect, useMemo } from 'react';
// import { useBatteryContext } from '../BatteryContext';
// import { ResponseData } from './test';

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const DIFF_RESET_THRESHOLD = 0.01; // reset tester if diff > 0.01

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
//     }))
//   );

//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   const getCellStatus = useMemo(
//     () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
//       if (!Array.isArray(dataItems) || dataItems.length === 0 || expectedVoltage === null) return 'N/A';
//       const voltageItems = dataItems
//         .filter((item) => item.command === 'get_11_csu_volt')
//         .map((item) => ({
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
//       const globalCellId = cellId + 12; // CSU1 -> global 12–23
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
//         .map((item) => ({
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

//       // First pass: immediate updates
//       for (let cellId = 0; cellId < 12; cellId++) {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const sortedDataItems = dataItems
//           .map((item) => ({
//             ...item,
//             timestamp: new Date(item.timestamp || '').getTime() || Date.now(),
//           }))
//           .sort((a, b) => a.timestamp - b.timestamp);

//         const latestItem = sortedDataItems.length > 0 ? sortedDataItems[sortedDataItems.length - 1] : null;

//         if (latestItem && latestItem.command === 'get_dc_csu_volt') {
//           updatedCellStates[cellId] = {
//             ...updatedCellStates[cellId],
//             actual: { value: null },
//             expected: null,
//             status: 'N/A',
//           };
//         } else {
//           const voltageItems = sortedDataItems
//             .filter((item) => item.command === 'get_11_csu_volt');

//           const actualVoltageObj = voltageItems.length > 0 ? voltageItems[voltageItems.length - 1] : null;
//           const expectedVoltage = getExpectedVoltage(cellId);

//           if (actualVoltageObj) {
//             const diff = expectedVoltage !== null ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage) : 0;

//             updatedCellStates[cellId] = {
//               ...updatedCellStates[cellId],
//               actual: actualVoltageObj,
//               expected: diff > DIFF_RESET_THRESHOLD ? null : expectedVoltage, // RESET instead of hide
//               status: diff > DIFF_RESET_THRESHOLD ? 'N/A' : 'N/A', // reset status too
//             };
//           } else {
//             updatedCellStates[cellId] = {
//               ...updatedCellStates[cellId],
//               actual: { value: null, timestamp: 0 },
//               expected: getExpectedVoltage(cellId),
//               status: 'N/A',
//             };
//           }
//         }
//       }

//       // Second pass: calculate statuses
//       const statuses = Array.from({ length: 12 }, (_, cellId) => {
//         const dataItems = csu1ResponseData[cellId] || [];
//         const cellState = updatedCellStates[cellId];
//         const status = cellState.expected === null
//           ? 'N/A'
//           : getCellStatus(dataItems, cellState.expected);

//         updatedCellStates[cellId] = {
//           ...cellState,
//           status,
//         };

//         const actualVoltageValue = updatedCellStates[cellId].actual?.value ?? null;
//         return {
//           label: `CSU1 - Cell ${cellId}`,
//           status,
//           details:
//             actualVoltageValue && cellState.expected !== null && status !== 'N/A'
//               ? `Voltage: ${actualVoltageValue} (Expected: ${cellState.expected}V)`
//               : actualVoltageValue
//               ? `Voltage: ${actualVoltageValue} (No expected voltage data)`
//               : 'No voltage data available',
//         };
//       });

//       setCellStates(updatedCellStates);
//       setCsu1Statuses(statuses);

//       const hasCritical = statuses.some((s) => s.status === 'critical');
//       setCriticalState(hasCritical);
//     }, 0);

//     return () => clearTimeout(debounce);
//   }, [
//     csu1ResponseData,
//     responseData,
//     getExpectedVoltage,
//     getCellStatus,
//     getActualVoltage,
//     cellStates,
//     setCsu1Statuses,
//     setCriticalState,
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
//                 const state = cellStates[cellId] ?? { expected: null, actual: { value: null }, status: 'N/A' };
//                 const expectedVoltage = state.expected;
//                 const displayVoltage = getActualVoltage(cellId, dataItems);

//                 const statusColors = {
//                   normal: 'bg-green-100 text-green-800',
//                   warning: 'bg-yellow-100 text-yellow-800',
//                   critical: 'bg-red-100 text-red-800',
//                   'N/A': 'bg-gray-100 text-gray-800',
//                 };

//                 const status = state.status ?? getCellStatus(dataItems, expectedVoltage);

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
//                         <span>{expectedVoltage !== null ? `${expectedVoltage}V` : ''}</span>
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

//         {Object.keys(csu1ResponseData).length === 0 && <p className="text-center text-gray-500 mt-3">No data available.</p>}
//       </div>
//     </div>
//   );
// };

// export default CSU1;











/* eslint-disable */
/* @ts-nocheck */
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useBatteryContext } from "../BatteryContext";
import { ResponseData } from "./test";

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const DIFF_RESET_THRESHOLD = 0.01; // reset tester if diff > 0.01

const CSU1: React.FC = () => {
  const { csu1ResponseData, responseData, setCsu1Statuses, setCriticalState } =
    useBatteryContext();

  const [selectedCell, setSelectedCell] = useState<number | null>(null);
  const [cellStates, setCellStates] = useState(
    Array.from({ length: 12 }, () => ({
      expected: null as number | null,
      actual: { value: null as string | null, timestamp: 0 as number },
      status: null as string | null,
    }))
  );

  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  const getCellStatus = useMemo(
    () => (dataItems: ResponseData[], expectedVoltage: number | null) => {
      if (
        !Array.isArray(dataItems) ||
        dataItems.length === 0 ||
        expectedVoltage === null
      )
        return "N/A";
      const voltageItems = dataItems
        .filter((item) => item.command === "get_11_csu_volt")
        .map((item) => ({
          value: parseFloat(item.value),
          timestamp: new Date(item.timestamp || "").getTime() || Date.now(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      const latestVoltage =
        voltageItems.length > 0
          ? voltageItems[voltageItems.length - 1].value
          : null;
      if (latestVoltage === null) return "N/A";

      const voltageGap = Math.abs(expectedVoltage - latestVoltage);
      if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) return "critical";
      if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) return "warning";
      return "normal";
    },
    []
  );

  const getExpectedVoltage = useMemo(
    () => (cellId: number) => {
      const globalCellId = cellId + 12; // CSU1 -> global 12–23
      const cellData = responseData[globalCellId];
      if (!Array.isArray(cellData)) return null;
      const voltageData = cellData.find(
        (item) => item.command === "get_voltage"
      );
      if (
        !voltageData ||
        !voltageData.value ||
        isNaN(parseFloat(voltageData.value))
      )
        return null;
      return parseFloat(voltageData.value);
    },
    [responseData]
  );

  const getActualVoltage = useMemo(
    () => (cellId: number, dataItems: ResponseData[]) => {
      if (!Array.isArray(dataItems)) return cellStates[cellId].actual.value;
      const voltageItems = dataItems
        .filter((item) => item.command === "get_11_csu_volt")
        .map((item) => ({
          value: item.value,
          timestamp: new Date(item.timestamp || "").getTime() || Date.now(),
        }))
        .sort((a, b) => a.timestamp - b.timestamp);
      return voltageItems.length > 0
        ? voltageItems[voltageItems.length - 1].value
        : cellStates[cellId].actual.value;
    },
    [cellStates]
  );

  useEffect(() => {
    const debounce = setTimeout(() => {
      const updatedCellStates = [...cellStates];

      // First pass: immediate updates
      for (let cellId = 0; cellId < 12; cellId++) {
        const dataItems = csu1ResponseData[cellId] || [];
        const sortedDataItems = dataItems
          .map((item) => ({
            ...item,
            timestamp: new Date(item.timestamp || "").getTime() || Date.now(),
          }))
          .sort((a, b) => a.timestamp - b.timestamp);

        const latestItem =
          sortedDataItems.length > 0
            ? sortedDataItems[sortedDataItems.length - 1]
            : null;

        if (latestItem && latestItem.command === "get_dc_csu_volt") {
          updatedCellStates[cellId] = {
            ...updatedCellStates[cellId],
            actual: { value: null },
            expected: null,
            status: "N/A",
          };
        } else {
          const voltageItems = sortedDataItems.filter(
            (item) => item.command === "get_11_csu_volt"
          );

          const actualVoltageObj =
            voltageItems.length > 0
              ? voltageItems[voltageItems.length - 1]
              : null;
          const expectedVoltage = getExpectedVoltage(cellId);

          if (actualVoltageObj) {
            const diff =
              expectedVoltage !== null
                ? Math.abs(parseFloat(actualVoltageObj.value) - expectedVoltage)
                : 0;

            updatedCellStates[cellId] = {
              ...updatedCellStates[cellId],
              actual: actualVoltageObj,
              expected: diff > DIFF_RESET_THRESHOLD ? null : expectedVoltage, // RESET instead of hide
              status: diff > DIFF_RESET_THRESHOLD ? "N/A" : "N/A", // reset status too
            };
          } else {
            updatedCellStates[cellId] = {
              ...updatedCellStates[cellId],
              actual: { value: null, timestamp: 0 },
              expected: getExpectedVoltage(cellId),
              status: "N/A",
            };
          }
        }
      }

      // Second pass: calculate statuses
      const statuses = Array.from({ length: 12 }, (_, cellId) => {
        const dataItems = csu1ResponseData[cellId] || [];
        const cellState = updatedCellStates[cellId];
        const status =
          cellState.expected === null
            ? "N/A"
            : getCellStatus(dataItems, cellState.expected);

        updatedCellStates[cellId] = {
          ...cellState,
          status,
        };

        const actualVoltageValue =
          updatedCellStates[cellId].actual?.value ?? null;
        return {
          label: `CSU1 - Cell ${cellId}`,
          status,
          details:
            actualVoltageValue &&
            cellState.expected !== null &&
            status !== "N/A"
              ? `Voltage: ${actualVoltageValue} (Expected: ${cellState.expected}V)`
              : actualVoltageValue
              ? `Voltage: ${actualVoltageValue} (No expected voltage data)`
              : "No voltage data available",
        };
      });

      setCellStates(updatedCellStates);
      setCsu1Statuses(statuses);

      const hasCritical = statuses.some((s) => s.status === "critical");
      setCriticalState(hasCritical);
    }, 0);

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
  const rows = [
    cellIds.slice(0, 3),
    cellIds.slice(3, 6),
    cellIds.slice(6, 9),
    cellIds.slice(9, 12),
  ];

  return (
    <div className="p-3 sm:p-4 bg-gray-50 h-full w-full lg:w-[17vw]  max-w-5xl mx-auto shadow-md flex justify-center border border-cyan-100 rounded-lg overflow-y-auto max-h-[59vh]">
      <div className="w-full  max-w-6xl relative">
        <h2 className="text-base sm:text-lg md:text-xl font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          CSU11
        </h2>

        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className="grid grid-cols-2 sm:grid-cols-3 gap-2"
            >
              {row.map((cellId) => {
                const dataItems = csu1ResponseData[cellId] || [];
                const state = cellStates[cellId] ?? {
                  expected: null,
                  actual: { value: null },
                  status: "N/A",
                };
                const expectedVoltage = state.expected;
                const displayVoltage = getActualVoltage(cellId, dataItems);

                const statusColors = {
                  normal: "bg-green-100 text-green-800",
                  warning: "bg-yellow-100 text-yellow-800",
                  critical: "bg-red-100 text-red-800",
                  "N/A": "bg-gray-100 text-gray-800",
                };

                const status =
                  state.status ?? getCellStatus(dataItems, expectedVoltage);

                return (
                  <div
                    key={cellId}
                    ref={(el) => (cellRefs.current[cellId] = el)}
                    className="bg-white p-2 sm:p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer relative text-[10px] sm:text-xs"
                    onClick={() => handleCellClick(cellId)}
                  >
                    <div className="text-[10px] sm:text-xs break-words">
                      <div className="flex justify-between">
                        <span>V:</span>
                        <span>{displayVoltage ?? "-"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>T.V:</span>
                        <span>
                          {expectedVoltage !== null
                            ? `${expectedVoltage}V`
                            : ""}
                        </span>
                      </div>
                      <div
                        className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}
                      >
                        <span className="text-xs font-light">
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {Object.keys(csu1ResponseData).length === 0 && (
          <p className="text-center text-gray-500 mt-3 text-xs sm:text-sm">
            No data available.
          </p>
        )}
      </div>
    </div>
  );
};

export default CSU1;
