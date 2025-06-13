import React, { useEffect, useState, useRef } from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

interface BatteryCell {
  id: number;
  voltage: number;        // actual voltage
  temperature: number;
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
  let statusColor = 'bg-green-500';
  if (cell.status === 'warning') statusColor = 'bg-yellow-500';
  else if (cell.status === 'critical') statusColor = 'bg-red-500';

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[120px] h-[50px] m-[3px] border border-black p-1 rounded shadow text-center text-white text-xs cursor-pointer ${statusColor}`}
    >
      <div>V: {cell.voltage}V</div>
      <div>T: {cell.temperature}°C</div>
      <div className="italic">{cell.status}</div>
    </div>
  );
};

const CSU2: React.FC = () => {
  const [cells, setCells] = useState<BatteryCell[]>([]);

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [popupHeight, setPopupHeight] = useState(150); // Adjusted for feedback-only popup
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initial state
    const initialCells = Array.from({ length: 12 }, (_, i) => ({
      id: i + 12,
      voltage: 3.6,
      temperature: 25.0,
      status: 'normal' as CellStatus,
    }));
    setCells(initialCells);

    const interval = setInterval(() => {
      setCells((prev) =>
        prev.map((cell) => {
          const voltage = +(Math.random() * 0.7 + 3.1).toFixed(2);
          const temperature = +(Math.random() * 20 + 20).toFixed(1);
          const status: CellStatus =
            voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';
          return { ...cell, voltage, temperature, status };
        })
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Sync with Dashboard (optional, if Dashboard needs to access this state)
    window.dispatchEvent(new CustomEvent('csu2CellsUpdate', { detail: cells }));
  }, [cells]);

  useEffect(() => {
    if (popupRef.current) {
      setPopupHeight(popupRef.current.offsetHeight);
    }
  }, [popup]);

  const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 200; // Adjusted width for feedback-only
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
    <div className="relative">
      <h1 className="text-2xl font-bold mb-2">CSU2</h1>
      <div
        className="csu-grid grid grid-cols-2 grid-rows-6 gap-2 bg-gray-100 border-2 border-black p-4 rounded-lg shadow-lg"
        style={{ height: 'auto', minHeight: 'calc(300px + 4rem)', overflow: 'hidden', position: 'relative' }}
      >
        {cells.map((cell) => (
          <BatteryCellComponent key={cell.id} cell={cell} onClick={handleCellClick} />
        ))}
      </div>
      {popup && (
        <div
          ref={popupRef}
          className="absolute z-50 backdrop-blur-md bg-white/90 border border-gray-300 rounded shadow-md p-4"
          style={{
            top: popup.position.top,
            left: popup.position.left,
            minWidth: 200,
          }}
        >
          <div className="mb-2 font-bold">Feedback for Cell {popup.cell.id} (CSU 2)</div>
          <div className="text-sm">
            <p><strong>Voltage:</strong> {popup.cell.voltage.toFixed(2)} V</p>
            <p><strong>Temperature:</strong> {popup.cell.temperature}°C</p>
            <p><strong>Status:</strong> {popup.cell.status}</p>
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