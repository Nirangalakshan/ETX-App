
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
//   }, []); // Empty dependency array to prevent infinite loops

//   // Render logic using csu2Data
//   return (
//     <div className="relative p-3 ml-4">
//       <h2>CSU2 Data</h2>
//       {Object.entries(csu2Data).map(([cellId, dataItems]) => (
//         <div key={cellId}>
//           Cell {cellId}: {dataItems.map((item) => `${item.command}: ${item.value}`).join(", ")}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default CSU2;









import React, { useEffect, useState } from "react";
import { ResponseData } from "./test";

const CSU2: React.FC = () => {
  const [csu2Data, setCsu2Data] = useState<Record<number, ResponseData[]>>({});

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

  // Determine status based on voltage and temperature
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

  return (
    <div className="p-3 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-6 text-center bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg shadow-lg">
        CSU2 Dashboard
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(csu2Data).map(([cellId, dataItems]) => {
          const status = getCellStatus(dataItems);
          const statusColors = {
            normal: "bg-green-100 text-green-800",
            warning: "bg-yellow-100 text-yellow-800",
            critical: "bg-red-100 text-red-800",
          };

          return (
            <div
              key={cellId}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 border-l-4 border-indigo-500"
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
                        .replace("_12_csu_", "CSU12 ")
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
      {Object.keys(csu2Data).length === 0 && (
        <p className="text-center text-gray-500 mt-6">No data available.</p>
      )}
    </div>
  );
};

export default CSU2;