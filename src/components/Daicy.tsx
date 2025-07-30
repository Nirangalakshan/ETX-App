// import React from "react";
// import { ResponseData } from "./test";

// interface DaicyProps {
//   daisyChainData: Record<number, ResponseData[]> | null | undefined;
// }

// const Daicy: React.FC<DaicyProps> = ({ daisyChainData }) => {
//   console.log("Daicy: Received daisyChainData:", daisyChainData);

//   const isValidData = daisyChainData && typeof daisyChainData === "object" && !Array.isArray(daisyChainData);

//   return (
//     <div className="p-4 bg-gray-50 w-70 flex justify-center h-120 shadow-md rounded-md">
//       <div className="w-50">
//         <h2 className="text-xl font-inter text-gray-800 mb-4 text-center font-semibold py-2 rounded-md shadow-md">
//           Daisy Chain Data
//         </h2>
//         {isValidData ? (
//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//             {Object.entries(daisyChainData).map(([cellId, dataItems]) => (
//               <div
//                 key={cellId}
//                 className="bg-white p-2 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500"
//               >
//                 <h3 className="text-sm font-semibold text-gray-700 mb-1">
//                   Cell {cellId}
//                 </h3>
//                 <div className="space-y-1">
//                   {dataItems.map((item, idx) => (
//                     <div
//                       key={idx}
//                       className="flex justify-between items-center p-1 rounded-sm"
//                     >
//                       <span className="text-xs font-medium text-gray-600 capitalize">
//                         {item.command.replace(/_/g, " ")}
//                       </span>
//                       <span className="text-xs font-semibold text-gray-800">
//                         {item.value}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             ))}
//           </div>
//         ) : (
//           <p className="text-center text-gray-500 mt-4">No daisy chain data available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Daicy;









//recived data but not rendering

// import React, { useEffect, useState, useRef } from "react";
// import { ResponseData } from "./test";

// const Daicy: React.FC = () => {
//   const [daisyChainData, setDaisyChainData] = useState<
//     Record<number, ResponseData[]>
//   >({});
//   const [selectedCell, setSelectedCell] = useState<number | null>(null);
//   const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

//   useEffect(() => {
//     const handleUpdate = (event: Event) => {
//       const data = (event as CustomEvent).detail;
//       if (data && typeof data === "object" && !Array.isArray(data)) {
//         setDaisyChainData(data as Record<number, ResponseData[]>);
//       } else {
//         console.warn("Daicy: Invalid responseData format received:", data);
//       }
//     };

//     window.addEventListener("dcCsuCellsUpdate", handleUpdate);
//     return () => window.removeEventListener("dcCsuCellsUpdate", handleUpdate);
//   }, []);

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
//           Daisy Chain
//         </h2>
//         <div className="space-y-2">
//           {rows.map((row, rowIndex) => (
//             <div key={rowIndex} className="grid grid-cols-3 gap-2">
//               {row.map((cellId) => {
//                 const dataItems = daisyChainData[cellId];
//                 if (!Array.isArray(dataItems)) return null;

//                 const voltageItem = Array.isArray(dataItems)
//                   ? dataItems.find((item) => item.command === "get_dc_csu_volt")
//                   : undefined;

//                 const tempItem = Array.isArray(dataItems)
//                   ? dataItems.find((item) => item.command === "get_dc_csu_temp")
//                   : undefined;

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
//                               (parseFloat(voltageItem.value) < 2.0 &&
//                                 voltageItem.value !== "1"))
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
//                     </div>
//                     {selectedCell === cellId &&
//                       daisyChainData[selectedCell] && (
//                         <div
//                           style={popupStyle}
//                           className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
//                         >
//                           <div className="flex justify-between items-center mb-2">
//                             <h3 className="text-sm font-semibold text-gray-800">
//                               Cell {selectedCell} Details
//                             </h3>
//                             <button
//                               className="text-gray-500 hover:text-gray-700 text-sm"
//                               onClick={() => setSelectedCell(null)}
//                             >
//                               ✕
//                             </button>
//                           </div>
//                           <div className="space-y-1.5">
//                             {daisyChainData[selectedCell].map((item, idx) => (
//                               <div
//                                 key={idx}
//                                 className="flex justify-between items-center"
//                               >
//                                 <span className="text-xs font-medium capitalize">
//                                   {item.command
//                                     .replace("get_", "")
//                                     .replace("dc_csu_", "Daisy ")
//                                     .replace(/_/g, " ")}
//                                 </span>
//                                 <span
//                                   className={`text-xs font-semibold ${
//                                     item.command.includes("volt")
//                                       ? parseFloat(item.value) > 4.5 ||
//                                         (parseFloat(item.value) < 2.0 &&
//                                           item.value !== "1")
//                                         ? "text-red-600"
//                                         : ""
//                                       : ""
//                                   }`}
//                                 >
//                                   {item.value}
//                                 </span>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}
//                   </div>
//                 );
//               })}
//             </div>
//           ))}
//         </div>
//         {Object.keys(daisyChainData).length === 0 && (
//           <p className="text-center text-gray-500 mt-3">
//             No daisy chain data available.
//           </p>
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

// export default Daicy;








//update dc data correctly
import React, { useState, useRef } from "react";

import { useBatteryContext } from "../BatteryContext";

const Daicy: React.FC = () => {
  const { dcCsuResponseData } = useBatteryContext();
  const [selectedCell, setSelectedCell] = useState<{
    dcIc: number;
    cellNo: number;
  } | null>(null);
  const cellRefs = useRef<Map<string, HTMLDivElement | null>>(new Map());

  const handleCellClick = (dcIc: number, cellNo: number) => {
    const key = `${dcIc}-${cellNo}`;
    setSelectedCell(
      selectedCell && selectedCell.dcIc === dcIc && selectedCell.cellNo === cellNo
        ? null
        : { dcIc, cellNo }
    );
  };

  const cellIds = Array.from({ length: 24 }, (_, i) => i);
  const dcIcs = [0, 1]; // Assuming DC ICs are 00 and 01
  const rows = [
    cellIds.slice(0, 3),
    cellIds.slice(3, 6),
    cellIds.slice(6, 9),
    cellIds.slice(9, 12),
    cellIds.slice(12, 15),
    cellIds.slice(15, 18),
    cellIds.slice(18, 21),
    cellIds.slice(21, 24),
  ];

  return (
    <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center border border-gray-200 rounded-md">
      <div className="w-full max-w-6xl relative">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          Daisy Chain
        </h2>
        {dcIcs.map((dcIc) => (
          <div key={dcIc} className="mb-4">
            <h3 className="text-md font-semibold text-gray-700 mb-2">
              DC IC {dcIc}
            </h3>
            <div className="space-y-2">
              {rows.map((row, rowIndex) => (
                <div key={rowIndex} className="grid grid-cols-3 gap-2">
                  {row.map((cellId) => {
                    const dataItems = dcCsuResponseData[dcIc]?.[cellId] || [];
                    if (!dataItems.length) return null;

                    const voltageItem = dataItems.find(
                      (item) => item.command === "get_dc_csu_volt"
                    );
                    const tempItem = dataItems.find(
                      (item) => item.command === "get_dc_csu_temp"
                    );

                    const cellKey = `${dcIc}-${cellId}`;
                    const cellRef = cellRefs.current.get(cellKey);
                    const popupStyle: React.CSSProperties = cellRef
                      ? {
                          position: "absolute",
                          top: `${
                            cellRef.offsetTop + cellRef.offsetHeight
                          }px`,
                          left: `${cellRef.offsetLeft}px`,
                          zIndex: 10,
                        }
                      : {};

                    return (
                      <div
                        key={cellId}
                        ref={(el) => cellRefs.current.set(cellKey, el)}
                        className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500 cursor-pointer relative"
                        onClick={() => handleCellClick(dcIc, cellId)}
                      >
                        <div className="text-xs">
                          <div className="flex justify-between">
                            <span>V:</span>
                            <span
                              className={
                                voltageItem &&
                                (parseFloat(voltageItem.value) > 4.5 ||
                                  (parseFloat(voltageItem.value) < 3.0 &&
                                    voltageItem.value !== "1"))
                                  ? "text-red-600"
                                  : ""
                              }
                            >
                              {voltageItem ? voltageItem.value : "-"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>T:</span>
                            <span>{tempItem ? tempItem.value : "-"}</span>
                          </div>
                        </div>
                        {selectedCell &&
                          selectedCell.dcIc === dcIc &&
                          selectedCell.cellNo === cellId &&
                          dataItems.length > 0 && (
                            <div
                              style={popupStyle}
                              className="bg-white p-3 rounded-lg shadow-xl border border-gray-200 w-64 animate-fade-in"
                            >
                              <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-semibold text-gray-800">
                                  DC IC {dcIc} Cell {cellId} Details
                                </h3>
                                <button
                                  className="text-gray-500 hover:text-gray-700 text-sm"
                                  onClick={() => setSelectedCell(null)}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="space-y-1.5">
                                {dataItems.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex justify-between items-center"
                                  >
                                    <span className="text-xs font-medium capitalize">
                                      {item.command
                                        .replace("get_", "")
                                        .replace("dc_csu_", "Daisy ")
                                        .replace(/_/g, " ")}
                                    </span>
                                    <span
                                      className={`text-xs font-semibold ${
                                        item.command.includes("volt")
                                          ? parseFloat(item.value) > 4.5 ||
                                            (parseFloat(item.value) < 2.0 &&
                                              item.value !== "1")
                                            ? "text-red-600"
                                            : ""
                                          : ""
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
          </div>
        ))}
        {Object.keys(dcCsuResponseData).length === 0 && (
          <p className="text-center text-gray-500 mt-3">
            No daisy chain data available.
          </p>
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

export default Daicy;