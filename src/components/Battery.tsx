// import React, { useEffect, useState } from 'react';
// import BatteryCell, { BatteryCellProps } from './BatteryCell';

// const Battery: React.FC = () => {
//   const [cells, setCells] = useState<BatteryCellProps[]>(
//     Array.from({ length: 24 }, (_, i) => ({
//       id: i + 1,
//       voltage: 3.6,
//       temperature: 25.0,
//       status: 'normal',
//     }))
//   );

//   useEffect(() => {
//     const interval = setInterval(() => {
//       setCells(prev =>
//         prev.map(cell => {
//           const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
//           const temperature = +(Math.random() * 20 + 20).toFixed(1);
//           const status =
//             voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';

//           return { ...cell, voltage, temperature, status };
//         })
//       );
//     }, 3000);

//     return () => clearInterval(interval);
//   }, []);

//   const column1 = cells.slice(0, 12);
//   const column2 = cells.slice(12, 24);

//   return (
//     <div className="flex gap-4 p-4 h-[944px]">
//       <div className="flex flex-col w-36">
//         {column1.map(cell => (
//           <BatteryCell key={cell.id} {...cell} />
//         ))}
//       </div>
//       <div className="flex flex-col w-36">
//         {column2.map(cell => (
//           <BatteryCell key={cell.id} {...cell} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default Battery;


import React, { useEffect, useState, useRef } from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

interface BatteryCell {
  id: number;
  voltage: number;        // actual voltage
  temperature: number;
  status: CellStatus;
  setVoltage: number;     // set voltage value
  balancing: boolean;     // is balancing active
  openWire: boolean;      // open wire status
}

interface PopupInfo {
  cell: BatteryCell;
  position: { top: number; left: number };
}

const BatteryCellComponent: React.FC<{
  cell: BatteryCell;
  onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = 'bg-green-500';
  if (cell.status === 'warning') statusColor = 'bg-yellow-500';
  else if (cell.status === 'critical') statusColor = 'bg-red-500';

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[110px] h-[50px] m-[3px] gap-5 border border-black p-1 rounded shadow text-center text-white text-xs cursor-pointer ${statusColor}`}
    >
      <div>V: {cell.voltage}V</div>
      <div>T: {cell.temperature}°C</div>
      <div className="italic">{cell.status}</div>
    </div>
  );
};

interface BatteryProps {
  setSelectedCell: (cell: BatteryCell | null) => void;
}

const Battery: React.FC<BatteryProps> = ({ setSelectedCell }) => {
  const [cells, setCells] = useState<BatteryCell[]>(
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      voltage: 3.6,
      temperature: 25.0,
      status: 'normal' as CellStatus,
      setVoltage: 3.65,          // default set voltage
      balancing: false,
      openWire: false,
    }))
  );

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [popupHeight, setPopupHeight] = useState(180); // Dynamically set
  const popupRef = useRef<HTMLDivElement>(null);
  // Local state for popup editable fields:
  const [setVoltageInput, setSetVoltageInput] = useState<number>(3.65);
  const [balancingActive, setBalancingActive] = useState<boolean>(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCells((prev) =>
        prev.map((cell) => {
          const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
          const temperature = +(Math.random() * 20 + 20).toFixed(1);
          const status: CellStatus =
            voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';

          // Simulate openWire randomly
          const openWire = Math.random() < 0.05;

          return { ...cell, voltage, temperature, status, openWire };
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (popupRef.current) {
      setPopupHeight(popupRef.current.offsetHeight);
    }
  }, [popup]);

  const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 220; // estimated width of popup
    const padding = 10;

    // Get the container (grid) dimensions and position
    const container = document.querySelector('.grid') as HTMLElement;
    if (!container) return; // Safety check
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top + window.scrollY;
    const containerLeft = containerRect.left + window.scrollX;
    const containerWidth = container.clientWidth; // Inner width
    const containerHeight = container.offsetHeight; // Include padding and borders

    let top = targetRect.top - containerTop + targetRect.height + padding;
    let left = targetRect.left - containerLeft + padding;

    // Prevent popup from going below the container
    if (top + popupHeight > containerHeight) {
      const spaceAbove = targetRect.top - containerTop;
      top = spaceAbove >= popupHeight ? spaceAbove - popupHeight - padding : Math.max(0, containerHeight - popupHeight - padding);
    }

    // Prevent popup from going off the right edge of the container
    if (left + popupWidth > containerWidth) {
      left = Math.max(padding, targetRect.left - containerLeft - popupWidth + targetRect.width - padding);
    }

    // Ensure popup doesn't go above the container
    if (top < 0) top = 0;

    // Ensure popup doesn't go left of the container
    if (left < 0) left = padding;

    setPopup({ cell, position: { top, left } });
    setSelectedCell(cell); // Update selected cell via prop

    // Initialize popup input states from clicked cell
    setSetVoltageInput(cell.setVoltage);
    setBalancingActive(cell.balancing);
  };

  // When toggling balancing, update cell data in main array and local state
  const toggleBalancing = () => {
    if (!popup) return;
    const newBalancing = !balancingActive;
    setBalancingActive(newBalancing);

    setCells((prev) =>
      prev.map((c) =>
        c.id === popup.cell.id ? { ...c, balancing: newBalancing } : c
      )
    );

    setPopup((p) =>
      p
        ? {
            ...p,
            cell: { ...p.cell, balancing: newBalancing },
          }
        : null
    );
  };

  // When set voltage input changes, update local state and main array
  const onSetVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    setSetVoltageInput(val);

    if (!popup) return;

    setCells((prev) =>
      prev.map((c) =>
        c.id === popup.cell.id ? { ...c, setVoltage: val } : c
      )
    );

    setPopup((p) =>
      p
        ? {
            ...p,
            cell: { ...p.cell, setVoltage: val },
          }
        : null
    );
  };

  return (
    <div className="relative">
      <div
        className="grid grid-cols-2 gap-1 bg-gray-100 border-2 border-black p-4 rounded-lg shadow-lg"
        style={{
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          position: 'relative', // Ensure popup positioning is relative to this container
        }}
      >
        {cells.map((cell) => (
          <BatteryCellComponent
            key={cell.id}
            cell={cell}
            onClick={handleCellClick}
          />
        ))}
      </div>

      {popup && (
        <div
          ref={popupRef}
          className="absolute z-50 backdrop-blur-md bg-white/90 border border-gray-300 rounded shadow-md p-4 max-w-xs"
          style={{
            top: popup.position.top,
            left: popup.position.left,
            minWidth: 200,
          }}
        >
          <div className="mb-2 font-bold">Cell ID: {popup.cell.id}</div>

          <div className="mb-1 text-sm">
            <label className="font-semibold mr-2">Set Voltage:</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={setVoltageInput}
              onChange={onSetVoltageChange}
              className="border rounded px-1 py-0.5 w-20"
              placeholder="Set voltage"
              title="Set voltage"
            />
            V
          </div>

          <div className="mb-1 text-sm">
            <span className="font-semibold mr-2">Actual Voltage:</span>
            {popup.cell.voltage.toFixed(2)} V
          </div>

          <div className="mb-1 text-sm">
            <span className="font-semibold mr-2">Balancing Status:</span>
            {balancingActive ? (
              <span className="text-green-600 font-semibold">Balancing Mode ON</span>
            ) : (
              <span className="text-gray-600">Idle</span>
            )}
          </div>

          <div className="mb-2 text-sm">
            <span className="font-semibold mr-2">Open Wire Status:</span>
            {popup.cell.openWire ? (
              <span className="text-red-600 font-semibold">Open Wire Detected</span>
            ) : (
              <span className="text-green-600">No Open Wire</span>
            )}
          </div>

          <div className="flex items-center">
            <label htmlFor="balancingToggle" className="mr-2 text-sm font-semibold">
              Set Balance:
            </label>
            <input
              type="checkbox"
              id="balancingToggle"
              checked={balancingActive}
              onChange={toggleBalancing}
              className="cursor-pointer"
            />
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

export default Battery;