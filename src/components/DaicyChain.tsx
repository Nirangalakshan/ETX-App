// import React, { useEffect, useState, useRef } from "react";

// type CellStatus = "normal" | "warning" | "critical";

// interface DaisyCell {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: CellStatus;
// }

// const CELL_COUNT = 24;

// const DaisyCellComponent: React.FC<{
//   cell: DaisyCell;
//   onClick: (event: React.MouseEvent, cell: DaisyCell) => void;
// }> = ({ cell, onClick }) => {
//   let statusColor = "bg-green-500";
//   if (cell.status === "warning") statusColor = "bg-yellow-500";
//   else if (cell.status === "critical") statusColor = "bg-red-500";

//   return (
//     <div
//       onClick={(e) => onClick(e, cell)}
//       className={`w-[120px] h-[50px] m-[3px] border border-black p-1 rounded shadow text-center text-white text-xs cursor-pointer ${statusColor}`}
//     >
//       <div>V: {cell.voltage}V</div>
//       <div>T: {cell.temperature}°C</div>
//       <div className="italic">{cell.status}</div>
//     </div>
//   );
// };

// const DaicyChain: React.FC = () => {
//   const [cells, setCells] = useState<DaisyCell[]>(
//     Array.from({ length: CELL_COUNT }, (_, i) => ({
//       id: i + 1,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: "normal" as CellStatus,
//     }))
//   );

//   // Simulate reading from main controller
//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
//           return { ...cell, voltage, temperature, status };
//         })
//       );
//     }, 3000);

//     return () => clearInterval(interval);
//   }, []);

//   // Optional: handle cell click for popup/details
//   const handleCellClick = (e: React.MouseEvent, cell: DaisyCell) => {
//     alert(`Cell ${cell.id}\nVoltage: ${cell.voltage}V\nTemperature: ${cell.temperature}°C`);
//   };

//   const column1 = cells.slice(0, 12);
//   const column2 = cells.slice(12, 24);

//   return (
//     <div className="flex gap-4 p-4 border-1 border-black rounded shadow-lg w-75">
//       <div className="flex flex-col w-30">
//         {column1.map((cell) => (
//           <DaisyCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
//         ))}
//       </div>
//       <div className="flex flex-col w-36">
//         {column2.map((cell) => (
//           <DaisyCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default DaicyChain;



import React, { useEffect, useState } from "react";

type CellStatus = "normal" | "warning" | "critical";

interface DaisyCell {
  id: number;
  voltage: number;
  temperature: number;
  status: CellStatus;
}

const CELL_COUNT = 24;

const DaisyCellComponent: React.FC<{
  cell: DaisyCell;
  onClick: (event: React.MouseEvent, cell: DaisyCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = "bg-green-500";
  if (cell.status === "warning") statusColor = "bg-yellow-500";
  else if (cell.status === "critical") statusColor = "bg-red-500";

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[110px] h-[48px] m-[3px] border border-black p-1 rounded shadow text-center text-white text-xs cursor-pointer ${statusColor}`}
    >
      <div>V: {cell.voltage}V</div>
      <div>T: {cell.temperature}°C</div>
      <div className="italic">{cell.status}</div>
    </div>
  );
};

const DaicyChain: React.FC = () => {
  const [enabled, setEnabled] = useState(false);
  const [cells, setCells] = useState<DaisyCell[]>(
    Array.from({ length: CELL_COUNT }, (_, i) => ({
      id: i + 1,
      voltage: 3.6,
      temperature: 25.0,
      status: "normal" as CellStatus,
    }))
  );

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (enabled) {
      interval = setInterval(() => {
        setCells((prev) =>
          prev.map((cell) => {
            const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
            const temperature = +(Math.random() * 20 + 20).toFixed(1);
            const status: CellStatus =
              voltage < 3.3 ? "critical" : voltage < 3.5 ? "warning" : "normal";
            return { ...cell, voltage, temperature, status };
          })
        );
      }, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [enabled]);

  const handleCellClick = (e: React.MouseEvent, cell: DaisyCell) => {
    alert(`Cell ${cell.id}\nVoltage: ${cell.voltage}V\nTemperature: ${cell.temperature}°C`);
  };

  const column1 = cells.slice(0, 12);
  const column2 = cells.slice(12, 24);

  return (
    <div className="p-4">
      <button
        onClick={() => setEnabled((prev) => !prev)}
        className={`mb-4 px-6 py-2 rounded text-white ${
          enabled ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {enabled ? "Stop Daisy Chain" : "Start Daisy Chain"}
      </button>
      {enabled && (
        <div className="flex gap-3.5 border-1 border-black rounded w-60">
          <div className="flex flex-col w-27">
            {column1.map((cell) => (
              <DaisyCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
            ))}
          </div>
          <div className="flex flex-col w-27">
            {column2.map((cell) => (
              <DaisyCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DaicyChain;