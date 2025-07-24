// import React, { useEffect, useState, useRef } from 'react';

// type CellStatus = 'normal' | 'warning' | 'critical';

// interface BatteryCell {
//   id: number;
//   voltage: number;
//   temperature: number;
//   status: CellStatus;
// }

// interface PopupInfo {
//   cell: BatteryCell;
//   position: { top: number; left: number };
// }

// const BatteryCellComponent: React.FC<{
//   cell: BatteryCell;
//   onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
// }> = ({ cell, onClick }) => {
//   let statusColor = 'bg-green-300/20 border-green-400 text-green-800';
//   if (cell.status === 'warning') statusColor = 'bg-yellow-200/20 border-yellow-500 text-yellow-700';
//   else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-500 text-red-700';

//   return (
//     <div
//       onClick={(e) => onClick(e, cell)}
//       className={`w-[120px] h-[50px] m-[4px] border p-1 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs hover:scale-[1.03] transition-transform duration-200`}
//     >
//       <div>V: {cell.voltage}V</div>
//       <div>T: {cell.temperature}°C</div>
//       <div className="italic">{cell.status}</div>
//     </div>
//   );
// };

// const CSU2: React.FC = () => {
//   const [cells, setCells] = useState<BatteryCell[]>([]);
//   const [popup, setPopup] = useState<PopupInfo | null>(null);
//   const [popupHeight, setPopupHeight] = useState(150);
//   const popupRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const initialCells = Array.from({ length: 12 }, (_, i) => ({
//       id: i,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: 'normal' as CellStatus,
//     }));
//     setCells(initialCells);

//     const interval = setInterval(() => {
//       setCells((prev) =>
//         prev.map((cell) => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status: CellStatus =
//             voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';
//           return { ...cell, voltage, temperature, status };
//         })
//       );
//     }, 3000);
//     return () => clearInterval(interval);
//   }, []);

//   useEffect(() => {
//     window.dispatchEvent(new CustomEvent('csu2CellsUpdate', { detail: cells }));
//   }, [cells]);

//   useEffect(() => {
//     if (popupRef.current) {
//       setPopupHeight(popupRef.current.offsetHeight);
//     }
//   }, [popup]);

//   const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
//     const targetRect = (e.target as HTMLElement).getBoundingClientRect();
//     const popupWidth = 200;
//     const padding = 10;

//     const container = e.currentTarget.closest('.csu-grid') as HTMLElement;
//     if (!container) return;
//     const containerRect = container.getBoundingClientRect();
//     const containerTop = containerRect.top + window.scrollY;
//     const containerLeft = containerRect.left + window.scrollX;
//     const containerWidth = container.clientWidth;
//     const containerHeight = container.offsetHeight;

//     let top = targetRect.top - containerTop + (targetRect.height - popupHeight) / 2;
//     let left = targetRect.left - containerLeft + targetRect.width + padding;

//     if (left + popupWidth > containerWidth) {
//       left = targetRect.left - containerLeft - popupWidth - padding;
//     }

//     if (top < 0) top = 0;
//     if (top + popupHeight > containerHeight) {
//       top = containerHeight - popupHeight;
//     }

//     if (left < 0) left = padding;

//     setPopup({ cell, position: { top, left } });
//   };

//   return (
//     <div className="relative p-4">
//       <h1 className="text-2xl font-semibold mb-3 text-gray-800">CSU2</h1>
//       <div
//         className="csu-grid grid grid-cols-2 grid-rows-6 gap-1 bg-white/60 border border-gray-300 p-2 rounded-lg shadow-lg backdrop-blur-md"
//         style={{
//           height: 'auto',
//           minHeight: 'calc(300px + 4rem)',
//           overflow: 'hidden',
//           position: 'relative',
//         }}
//       >
//         {cells.map((cell) => (
//           <BatteryCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
//         ))}
//       </div>

//       {popup && (
//         <div
//           ref={popupRef}
//           className="absolute z-50 bg-white/90 backdrop-blur-md border border-gray-300 rounded-lg shadow-xl p-4"
//           style={{
//             top: popup.position.top,
//             left: popup.position.left,
//             minWidth: 220,
//           }}
//         >
//           <div className="mb-2 text-sm font-bold text-gray-700">
//             Feedback for Cell <span className="text-blue-600">{popup.cell.id}</span> (CSU2)
//           </div>
//           <div className="text-sm text-gray-800 space-y-1">
//             <p>
//               <strong>Voltage:</strong> {popup.cell.voltage.toFixed(2)} V
//             </p>
//             <p>
//               <strong>Temperature:</strong> {popup.cell.temperature.toFixed(1)}°C
//             </p>
//             <p>
//               <strong>Status:</strong>{' '}
//               <span
//                 className={
//                   popup.cell.status === 'critical'
//                     ? 'text-red-600'
//                     : popup.cell.status === 'warning'
//                     ? 'text-yellow-600'
//                     : 'text-green-600'
//                 }
//               >
//                 {popup.cell.status}
//               </span>
//             </p>
//           </div>
//           <button
//             onClick={() => setPopup(null)}
//             className="mt-3 text-xs text-blue-600 hover:underline"
//           >
//             Close
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default CSU2;







import React, { useEffect, useState, useRef } from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

export interface BatteryCell {
  id: number;
  voltage: number | null; // Allow null for real data
  temperature: number | null; // Allow null for real data
  status: CellStatus;
}

interface PopupInfo {
  cell: BatteryCell;
  position: { top: number; left: number };
}

const BatteryCellComponent: React.FC<{
  cell: BatteryCell;
  onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = 'bg-green-300/20 border-green-300/20 text-green-800 shadow-gray-400 shadow-sm';
  if (cell.status === 'warning') statusColor = 'bg-yellow-200/20 border-yellow-500 text-yellow-700';
  else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-500 text-red-700';

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[120px] h-[50px] m-[4px] border p-1 rounded-lg shadow-sm backdrop-blur-lg ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs hover:scale-[1.03] transition-transform duration-200`}
    >
      <div className='font-inter'>V: {cell.voltage != null ? cell.voltage.toFixed(2) : 'N/A'}V</div>
      <div className='font-inter'>T: {cell.temperature != null ? cell.temperature.toFixed(1) : 'N/A'}°C</div>
      <div className="font-inter">{cell.status}</div>
    </div>
  );
};

const CSU2: React.FC = () => {
  const [cells, setCells] = useState<BatteryCell[]>([]);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [popupHeight, setPopupHeight] = useState(150);
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize cells without random data
    const initialCells = Array.from({ length: 12 }, (_, i) => ({
      id: i,
      voltage: null, // No initial voltage
      temperature: null, // No initial temperature
      status: 'normal' as CellStatus, // Default status
    }));
    setCells(initialCells);

    // Removed setInterval for random data generation
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('csu2CellsUpdate', { detail: cells }));
  }, [cells]);

  useEffect(() => {
    if (popupRef.current) {
      setPopupHeight(popupRef.current.offsetHeight);
    }
  }, [popup]);

  const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 200;
    const padding = 10;

    const container = e.currentTarget.closest('.csu-grid') as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top + window.scrollY;
    const containerLeft = containerRect.left + window.scrollX;
    const containerWidth = container.clientWidth;
    const containerHeight = container.offsetHeight;

    let top = targetRect.top - containerTop + (targetRect.height - popupHeight) / 2;
    let left = targetRect.left - containerLeft + targetRect.width + padding;

    if (left + popupWidth > containerWidth) {
      left = targetRect.left - containerLeft - popupWidth - padding;
    }

    if (top < 0) top = 0;
    if (top + popupHeight > containerHeight) {
      top = containerHeight - popupHeight;
    }

    if (left < 0) left = padding;

    setPopup({ cell, position: { top, left } });
  };

  return (
    <div className="relative p-4">
      <h1 className="text-2xl font-semibold mb-3 text-gray-800 font-inter text-center">CSU 2</h1>
      <div
        className="csu-grid grid grid-cols-2 grid-rows-6 gap-1 bg-white/60 border border-gray-300 p-2 rounded-lg shadow-lg backdrop-blur-md"
        style={{
          height: 'auto',
          minHeight: 'calc(300px + 4rem)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {cells.map((cell) => (
          <BatteryCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
        ))}
      </div>

      {popup && (
        <div
          ref={popupRef}
          className="absolute z-50 bg-white/90 backdrop-blur-md border border-gray-300 rounded-lg shadow-xl p-4"
          style={{
            top: popup.position.top,
            left: popup.position.left,
            minWidth: 220,
          }}
        >
          <div className="mb-2 text-sm font-bold text-gray-700">
            Feedback for Cell <span className="text-blue-600">{popup.cell.id}</span> (CSU2)
          </div>
          <div className="text-sm text-gray-800 space-y-1">
            <p>
              <strong>Voltage:</strong> {popup.cell.voltage != null ? popup.cell.voltage.toFixed(2) : 'N/A'} V
            </p>
            <p>
              <strong>Temperature:</strong> {popup.cell.temperature != null ? popup.cell.temperature.toFixed(1) : 'N/A'}°C
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <span
                className={
                  popup.cell.status === 'critical'
                    ? 'text-red-600'
                    : popup.cell.status === 'warning'
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }
              >
                {popup.cell.status}
              </span>
            </p>
          </div>
          <button
            onClick={() => setPopup(null)}
            className="mt-3 text-xs text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default CSU2;