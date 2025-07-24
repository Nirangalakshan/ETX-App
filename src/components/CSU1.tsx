// import React, { useEffect, useState } from "react";
// import { ResponseData } from "./test";

// const CSU1: React.FC = () => {
//   const [csu1Data, setCsu1Data] = useState<Record<number, ResponseData[]>>({});

//   useEffect(() => {
//     const handleUpdate = (event: Event) => {
//       const data = (event as CustomEvent).detail;
//       if (data && typeof data === "object" && !Array.isArray(data)) {
//         setCsu1Data(data as Record<number, ResponseData[]>);
//       } else {
//         console.warn("CSU1: Invalid responseData format received:", data);
//       }
//     };

//     window.addEventListener("csu1CellsUpdate", handleUpdate);
//     return () => window.removeEventListener("csu1CellsUpdate", handleUpdate);
//   }, []); // Empty dependency array to prevent infinite loops

//   // Render logic using csu1Data
//   return (
//     <div className="relative ml-4">
//       <h2>CSU1 Data</h2>
//       {Object.entries(csu1Data).map(([cellId, dataItems]) => (
//         <div key={cellId}>
//           Cell {cellId}: {dataItems.map((item) => `${item.command}: ${item.value}`).join(", ")}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default CSU1;






import React, { useEffect, useState } from "react";
import { ResponseData } from "./test";

const CSU1: React.FC = () => {
  const [csu1Data, setCsu1Data] = useState<Record<number, ResponseData[]>>({});

  useEffect(() => {
    const handleUpdate = (event: Event) => {
      const data = (event as CustomEvent).detail;
      if (data && typeof data === "object" && !Array.isArray(data)) {
        setCsu1Data(data as Record<number, ResponseData[]>);
      } else {
        console.warn("CSU1: Invalid responseData format received:", data);
      }
    };

    window.addEventListener("csu1CellsUpdate", handleUpdate);
    return () => window.removeEventListener("csu1CellsUpdate", handleUpdate);
  }, []);

  // Determine status based on voltage and temperature
  const getCellStatus = (dataItems: ResponseData[]) => {
    const voltageItem = dataItems.find((item) => item.command === "get_11_csu_volt");
    const tempItem = dataItems.find((item) => item.command === "get_11_csu_temp");
    const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
    const temp = tempItem ? parseFloat(tempItem.value) : null;

    if (voltage !== null && voltage < 3.3) return "critical";
    if (voltage !== null && voltage < 3.5) return "warning";
    if (temp !== null && temp > 60) return "critical";
    if (temp !== null && temp > 45) return "warning";
    return "normal";
  };

  return (
    <div className="p-3 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg shadow-lg">
        CSU1 Dashboard
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(csu1Data).map(([cellId, dataItems]) => {
          const status = getCellStatus(dataItems);
          const statusColors = {
            normal: "bg-green-100 text-green-800",
            warning: "bg-yellow-100 text-yellow-800",
            critical: "bg-red-100 text-red-800",
          };

          return (
            <div
              key={cellId}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-blue-500"
            >
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Cell {cellId}
              </h3>
              <div className="space-y-2">
                {dataItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-2 rounded-md"
                  >
                    <span className="text-sm font-medium capitalize">
                      {item.command
                        .replace("get_", "")
                        .replace("_11_csu_", "CSU11 ")
                        .replace(/_/g, " ")}
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        item.command.includes("volt")
                          ? parseFloat(item.value) > 4.5 ||
                            (parseFloat(item.value) < 2.0 && item.value !== "1")
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
              <div
                className={`mt-4 p-2 text-center rounded-md ${statusColors[status]}`}
              >
                <span className="text-xs font-medium">
                  Status: {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {Object.keys(csu1Data).length === 0 && (
        <p className="text-center text-gray-500 mt-6">No data available.</p>
      )}
    </div>
  );
};

export default CSU1;