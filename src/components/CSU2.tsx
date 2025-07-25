// import React, { useEffect, useState } from "react";
// import { ResponseData } from "./test";

// const CSU2: React.FC = () => {
//   const [csu2Data, setCsu2Data] = useState<Record<number, ResponseData[]>>({});

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
//     return "normal";
//   };

//   return (
//     <div className="p-4 bg-gray-50 flex justify-center h-120 shadow-md">
//       <div className="w-50">
//         <h2 className="text-xl font-inter text-gray-800 mb-4 text-center font-semibold py-2 rounded-md shadow-md">
//           CSU2
//         </h2>
//         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//           {Object.entries(csu2Data).map(([cellId, dataItems]) => {
//             const status = getCellStatus(dataItems);
//             const statusColors = {
//               normal: "bg-green-100 text-green-800",
//               warning: "bg-yellow-100 text-yellow-800",
//               critical: "bg-red-100 text-red-800",
//             };

//             return (
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
//                       <span className="text-xs font-medium capitalize">
//                         {item.command
//                           .replace("get_", "")
//                           .replace("_12_csu_", "CSU12 ")
//                           .replace(/_/g, " ")}
//                       </span>
//                       <span
//                         className={`text-xs font-semibold ${
//                           item.command.includes("volt")
//                             ? parseFloat(item.value) > 4.5 ||
//                               (parseFloat(item.value) < 2.0 && item.value !== "1")
//                               ? "text-red-600"
//                               : ""
//                             : ""
//                         }`}
//                       >
//                         {item.value}
//                       </span>
//                     </div>
//                   ))}
//                 </div>
//                 <div
//                   className={`mt-2 p-1 text-center rounded-sm ${statusColors[status]}`}
//                 >
//                   <span className="text-xs font-medium">
//                     Status: {status.charAt(0).toUpperCase() + status.slice(1)}
//                   </span>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//         {Object.keys(csu2Data).length === 0 && (
//           <p className="text-center text-gray-500 mt-4">No data available.</p>
//         )}
//       </div>
//     </div>
//   );
// };

// export default CSU2;










import React, { useEffect, useState } from "react";
import { ResponseData } from "./test";

const CSU2: React.FC = () => {
  const [csu2Data, setCsu2Data] = useState<Record<number, ResponseData[]>>({});
  const [selectedCell, setSelectedCell] = useState<number | null>(null);

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setCsu2Data(data as Record<number, ResponseData[]>);
      } else {
        console.warn("CSU2: Invalid responseData format received:", data);
      }
    };

    window.addEventListener("csu2CellsUpdate", handleUpdate);
    return () => window.removeEventListener("csu2CellsUpdate", handleUpdate);
  }, []);

  const getCellStatus = (dataItems: ResponseData[]) => {
    const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
    const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");
    const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
    const temp = tempItem ? parseFloat(tempItem.value) : null;

    if (voltage !== null && voltage < 3.3) return "critical";
    if (voltage !== null && voltage < 3.5) return "warning";
    if (temp !== null && temp > 60) return "critical";
    if (temp !== null && temp > 45) return "warning";
    return "normal";
  };

  const handleCellClick = (cellId: number) => {
    setSelectedCell(cellId);
  };

  const closeModal = () => {
    setSelectedCell(null);
  };

  // Generate 12 cells with IDs from 0 to 11
  const cellIds = Array.from({ length: 12 }, (_, i) => i);

  // Split into 4 rows of 3 cells each
  const rows = [
    cellIds.slice(0, 3),
    cellIds.slice(3, 6),
    cellIds.slice(6, 9),
    cellIds.slice(9, 12),
  ];

  return (
    <div className="p-3 bg-gray-50 h-120 w-70 shadow-md flex justify-center">
      <div className="w-full max-w-6xl">
        <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
          CSU2
        </h2>
        <div className="space-y-2">
          {rows.map((row, rowIndex) => (
            <div key={rowIndex} className="grid grid-cols-3 gap-2">
              {row.map((cellId) => {
                const dataItems = csu2Data[cellId] || [];
                const status = getCellStatus(dataItems);
                const statusColors = {
                  normal: "bg-green-100 text-green-800",
                  warning: "bg-yellow-100 text-yellow-800",
                  critical: "bg-red-100 text-red-800",
                };
                const voltageItem = dataItems.find((item) => item.command === "get_12_csu_volt");
                const tempItem = dataItems.find((item) => item.command === "get_12_csu_temp");

                return (
                  <div
                    key={cellId}
                    className="bg-white p-1.5 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-blue-500 cursor-pointer"
                    onClick={() => handleCellClick(cellId)}
                  >
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span>V:</span>
                        <span className={voltageItem && (parseFloat(voltageItem.value) > 4.5 || (parseFloat(voltageItem.value) < 2.0 && voltageItem.value !== "1")) ? "text-red-600" : ""}>
                          {voltageItem ? voltageItem.value : "-"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>T:</span>
                        <span>{tempItem ? tempItem.value : "-"}</span>
                      </div>
                      <div className={`mt-1 p-1 text-center rounded-sm ${statusColors[status]}`}>
                        <span className="text-xs font-light"> {status.charAt(0).toUpperCase() + status.slice(1)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {Object.keys(csu2Data).length === 0 && (
          <p className="text-center text-gray-500 mt-3">No data available.</p>
        )}

        {selectedCell !== null && csu2Data[selectedCell] && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-md shadow-lg max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Cell {selectedCell} Details</h3>
              <div className="space-y-2">
                {csu2Data[selectedCell].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium capitalize">
                      {item.command
                        .replace("get_", "")
                        .replace("_11_csu_", "CSU11 ")
                        .replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        item.command.includes("volt")
                          ? parseFloat(item.value) > 4.5 || (parseFloat(item.value) < 2.0 && item.value !== "1")
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
              <button
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSU2;