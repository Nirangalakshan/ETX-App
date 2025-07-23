import React, { useEffect, useState, useRef } from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

export interface BatteryCell {
  id: number;
  voltage: number | null;
  temperature: number | null;
  status: CellStatus;
  setVoltage: number;
  balancing: boolean;
  openWire: boolean;
  data: string | null;
  voltageLimits?: string | null;
}

interface PopupInfo {
  cell: BatteryCell;
  position: { top: number; left: number };
}

const BatteryCellComponent: React.FC<{
  cell: BatteryCell;
  onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = 'bg-green-300/20 border-green-400';
  if (cell.status === 'warning') statusColor = 'bg-yellow-300/20 border-yellow-400';
  else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-400';


  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[110px] h-[50px] m-[3px] border p-1 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs text-gray-800 hover:scale-[1.03] transition-transform duration-200`}
    >
      <div>V: {cell.voltage != null ? cell.voltage.toFixed(2) : 'N/A'}V</div>
      <div>T: {cell.temperature != null ? cell.temperature.toFixed(1) : 'N/A'}°C</div>
      <div>Data: {cell.voltageLimits || cell.data || 'N/A'}</div>
    </div>
  );
};

interface BatteryProps {
  cells: BatteryCell[];
  setSelectedCell: (cell: BatteryCell | null) => void;
}

const Battery: React.FC<BatteryProps> = ({ cells, setSelectedCell }) => {
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [popupHeight, setPopupHeight] = useState(180);
  const popupRef = useRef<HTMLDivElement>(null);
  const [setVoltageInput, setSetVoltageInput] = useState<number>(3.65);
  const [balancingActive, setBalancingActive] = useState<boolean>(false);

  useEffect(() => {
    if (popupRef.current) {
      setPopupHeight(popupRef.current.offsetHeight);
    }
  }, [popup]);

  const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 220;
    const padding = 10;

    const container = document.querySelector('.grid') as HTMLElement;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const containerTop = containerRect.top + window.scrollY;
    const containerLeft = containerRect.left + window.scrollX;
    const containerWidth = container.clientWidth;
    const containerHeight = container.offsetHeight;

    let top = targetRect.top - containerTop + targetRect.height + padding;
    let left = targetRect.left - containerLeft + padding;

    if (top + popupHeight > containerHeight) {
      const spaceAbove = targetRect.top - containerTop;
      top = spaceAbove >= popupHeight ? spaceAbove - popupHeight - padding : Math.max(0, containerHeight - popupHeight - padding);
    }

    if (left + popupWidth > containerWidth) {
      left = Math.max(padding, targetRect.left - containerLeft - popupWidth + targetRect.width - padding);
    }

    if (top < 0) top = 0;
    if (left < 0) left = padding;

    setPopup({ cell, position: { top, left } });
    setSelectedCell(cell);
    setSetVoltageInput(cell.setVoltage);
    setBalancingActive(cell.balancing);
  };

  const toggleBalancing = () => {
    if (!popup) return;
    const newBalancing = !balancingActive;
    setBalancingActive(newBalancing);

    setPopup((p) =>
      p
        ? {
            ...p,
            cell: { ...p.cell, balancing: newBalancing },
          }
        : null
    );
  };

  const onSetVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    if (isNaN(val)) return;
    setSetVoltageInput(val);

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
        className="grid grid-cols-2 gap-1 bg-white/60 border-2 border-gray-300 p-4 rounded-lg shadow-lg backdrop-blur-sm"
        style={{
          height: 'calc(100vh - 80px)',
          overflow: 'hidden',
          position: 'relative',
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
          className="absolute z-50 backdrop-blur-lg bg-white/90 border border-gray-300 rounded-lg shadow-xl p-4"
          style={{
            top: popup.position.top,
            left: popup.position.left,
            minWidth: 240,
          }}
        >
          <h3 className="text-gray-800 font-semibold mb-2 text-sm">
            Cell ID: <span className="text-blue-600">{popup.cell.id}</span>
          </h3>

          <div className="space-y-1 text-sm text-gray-700">
            <div>
              <strong>Set Voltage:</strong>{' '}
              <input
                placeholder='Set voltage'
                title='Set voltage'
                type="number"
                step="0.01"
                min="0"
                value={setVoltageInput}
                onChange={onSetVoltageChange}
                className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
              />{' '}
              V
            </div>
            <div>
              <strong>Actual Voltage:</strong>{' '}
              {popup.cell.voltage != null ? popup.cell.voltage.toFixed(2) : 'N/A'} V
            </div>
            <div>
              <strong>Temperature:</strong>{' '}
              {popup.cell.temperature != null ? popup.cell.temperature.toFixed(1) : 'N/A'}°C
            </div>
            <div>
              <strong>Balancing:</strong>{' '}
              {balancingActive ? (
                <span className="text-green-600 font-semibold">ON</span>
              ) : (
                <span className="text-gray-500">OFF</span>
              )}
            </div>
            <div>
              <strong>Open Wire:</strong>{' '}
              {popup.cell.openWire ? (
                <span className="text-red-500 font-semibold">Yes</span>
              ) : (
                <span className="text-green-600">No</span>
              )}
            </div>
            <div>
              <strong>Voltage Limits:</strong>{' '}
              {popup.cell.voltageLimits || 'N/A'}
            </div>
            <div>
              <strong>Raw Data:</strong>{' '}
              {popup.cell.data || 'N/A'}
            </div>
          </div>

          <div className="flex items-center mt-3">
            <label htmlFor="balancingToggle" className="mr-2 text-sm font-medium">
              Toggle Balancing:
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
            className="mt-4 text-xs text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Battery;