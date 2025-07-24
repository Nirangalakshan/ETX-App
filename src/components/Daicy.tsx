import React, { useEffect, useState } from "react";
import { ResponseData } from "./test";


const Daicy: React.FC = () => {
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
    <div className="p-4 bg-gray-50 flex justify-center h-120 shadow-md">
      <div className="w-50">
        <h2 className="text-xl font-inter text-gray-800 mb-4 text-center font-semibold py-2 rounded-md shadow-md">
          Daicy Chain
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                className="bg-white p-2 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200 border-l-2 border-indigo-500"
              >
                <h3 className="text-sm font-semibold text-gray-700 mb-1">
                  Cell {cellId}
                </h3>
                <div className="space-y-1">
                  {dataItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center p-1 rounded-sm"
                    >
                      <span className="text-xs font-medium capitalize">
                        {item.command
                          .replace("get_", "")
                          .replace("_12_csu_", "CSU12 ")
                          .replace(/_/g, " ")}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
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
                  className={`mt-2 p-1 text-center rounded-sm ${statusColors[status]}`}
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
          <p className="text-center text-gray-500 mt-4">No data available.</p>
        )}
      </div>
    </div>
  );
};

export default Daicy;
