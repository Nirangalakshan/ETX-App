// import React, { useEffect, useState, useRef } from 'react';

// type CellStatus = 'normal' | 'warning' | 'critical';

// export interface BatteryCell {
//   id: number;
//   voltage: number | null;
//   temperature: number | null;
//   status: CellStatus;
//   setVoltage: number;
//   balancing: boolean;
//   openWire: boolean;
//   data: string | null;
//   voltageLimits?: string | null;
// }

// interface PopupInfo {
//   cell: BatteryCell;
//   position: { top: number; left: number };
// }

// const BatteryCellComponent: React.FC<{
//   cell: BatteryCell;
//   onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
// }> = ({ cell, onClick }) => {
//   let statusColor = 'bg-white-200 shadow-sm border-gray-300';
//   if (cell.status === 'warning') statusColor = 'bg-yellow-300/20 border-yellow-400';
//   else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-400';

//   return (
//     <div
//       onClick={(e) => onClick(e, cell)}
//       className={`w-[110px] h-[50px] m-[3px] border-l-2 border-blue-500 border-r-2 border-blue-500 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs bg-gray-100 text-gray-800 hover:scale-[1.03] transition-transform duration-200`}
//     >
//       <div>V: {cell.voltage != null ? cell.voltage.toFixed(2) : '-'}V</div>
//       <div>T: {cell.temperature != null ? cell.temperature.toFixed(1) : '-'}°C</div>
//       <div>Data: {cell.voltageLimits || cell.data || '-'}</div>
//     </div>
//   );
// };

// const Battery: React.FC = () => {
//   const [cells, setCells] = useState<BatteryCell[]>([]);
//   const [popup, setPopup] = useState<PopupInfo | null>(null);
//   const [popupHeight, setPopupHeight] = useState(180);
//   const popupRef = useRef<HTMLDivElement>(null);
//   const [setVoltageInput, setSetVoltageInput] = useState<number>(3.65);
//   const [balancingActive, setBalancingActive] = useState<boolean>(false);
//   const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});

//   useEffect(() => {
//     const initialCells = Array.from({ length: 24 }, (_, i) => ({
//       id: i,
//       voltage: null,
//       temperature: null,
//       status: 'normal' as CellStatus,
//       setVoltage: 3.65,
//       balancing: false,
//       openWire: false,
//       data: null,
//       voltageLimits: null,
//     }));
//     setCells(initialCells);
//   }, []);

//   useEffect(() => {
//     const handleUpdate = (event: Event) => {
//       const data = (event as CustomEvent).detail;
//       setResponseData(data);
//     };

//     window.addEventListener('batteryCellsUpdate', handleUpdate);
//     return () => window.removeEventListener('batteryCellsUpdate', handleUpdate);
//   }, []);

//   useEffect(() => {
//     if (!responseData) return;

//     setCells((prevCells) =>
//       prevCells.map((cell) => {
//         const cellData = responseData[cell.id] || [];
//         let voltage: number | null = cell.voltage;
//         let temperature: number | null = cell.temperature;
//         let status: CellStatus = cell.status;
//         let setVoltage: number = cell.setVoltage;
//         let data: string | null = cell.data;
//         let voltageLimits: string | null = cell.voltageLimits;

//         const voltageData = cellData.find((item) => item.command === 'get_voltage');
//         if (voltageData && voltageData.value) {
//           const parsedVoltage = parseFloat(voltageData.value);
//           if (!isNaN(parsedVoltage)) {
//             voltage = parsedVoltage;
//             status = voltage < 10.0 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal';
//           }
//         }

//         const tempData = cellData.find((item) => item.command === 'get_temp');
//         if (tempData && tempData.value) {
//           const tempValue = parseFloat(tempData.value.replace(' °C', ''));
//           if (!isNaN(tempValue)) {
//             temperature = tempValue;
//             if (temperature > 60) status = 'critical';
//             else if (temperature > 45 && status !== 'critical') status = 'warning';
//           }
//         }

//         const setVoltageData = cellData.find((item) => item.command === 'set_voltage');
//         if (setVoltageData && setVoltageData.value) {
//           const parsedSetVoltage = parseFloat(setVoltageData.value);
//           if (!isNaN(parsedSetVoltage)) setVoltage = parsedSetVoltage;
//         }

//         return { ...cell, voltage, temperature, status, setVoltage, data, voltageLimits };
//       })
//     );
//   }, [responseData]);

//   useEffect(() => {
//     if (popupRef.current) {
//       setPopupHeight(popupRef.current.offsetHeight);
//     }
//   }, [popup]);

//   const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
//     const targetRect = (e.target as HTMLElement).getBoundingClientRect();
//     const popupWidth = 220;
//     const padding = 10;

//     const container = document.querySelector('.grid') as HTMLElement;
//     if (!container) return;
//     const containerRect = container.getBoundingClientRect();
//     const containerTop = containerRect.top + window.scrollY;
//     const containerLeft = containerRect.left + window.scrollX;
//     const containerWidth = container.clientWidth;
//     const containerHeight = container.offsetHeight;

//     let top = targetRect.top - containerTop + targetRect.height + padding;
//     let left = targetRect.left - containerLeft + padding;

//     if (top + popupHeight > containerHeight) {
//       const spaceAbove = targetRect.top - containerTop;
//       top = spaceAbove >= popupHeight ? spaceAbove - popupHeight - padding : Math.max(0, containerHeight - popupHeight - padding);
//     }

//     if (left + popupWidth > containerWidth) {
//       left = Math.max(padding, targetRect.left - containerLeft - popupWidth + targetRect.width - padding);
//     }

//     if (top < 0) top = 0;
//     if (left < 0) left = padding;

//     setPopup({ cell, position: { top, left } });
//     setSelectedCell(cell);
//     setSetVoltageInput(cell.setVoltage);
//     setBalancingActive(cell.balancing);
//   };

//   const toggleBalancing = () => {
//     if (!popup) return;
//     const newBalancing = !balancingActive;
//     setBalancingActive(newBalancing);

//     setPopup((p) =>
//       p
//         ? {
//             ...p,
//             cell: { ...p.cell, balancing: newBalancing },
//           }
//         : null
//     );
//   };

//   const onSetVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const val = parseFloat(e.target.value);
//     if (isNaN(val)) return;
//     setSetVoltageInput(val);

//     setPopup((p) =>
//       p
//         ? {
//             ...p,
//             cell: { ...p.cell, setVoltage: val },
//           }
//         : null
//     );
//   };

//   return (
//     <div className="relative w-68">
//       <div
//         className="grid grid-cols-2 gap-1 bg-white/60 border-2 border-gray-300 p-4 rounded-lg shadow-lg backdrop-blur-sm"
//         style={{
//           height: 'calc(100vh - 80px)',
//           overflow: 'hidden',
//           position: 'relative',
//         }}
//       >
//         {cells.map((cell) => (
//           <BatteryCellComponent
//             key={cell.id}
//             cell={cell}
//             onClick={handleCellClick}
//           />
//         ))}
//       </div>

//       {popup && (
//         <div
//           ref={popupRef}
//           className="absolute z-50 backdrop-blur-lg bg-white/90 border border-gray-300 rounded-lg shadow-xl p-4"
//           style={{
//             top: popup.position.top,
//             left: popup.position.left,
//             minWidth: 240,
//           }}
//         >
//           <h3 className="text-gray-800 font-semibold mb-2 text-sm">
//             Cell ID: <span className="text-blue-600">{popup.cell.id}</span>
//           </h3>

//           <div className="space-y-1 text-sm text-gray-700">
//             <div>
//               <strong>Set Voltage:</strong>{' '}
//               <input
//                 placeholder='Set voltage'
//                 title='Set voltage'
//                 type="number"
//                 step="0.01"
//                 min="0"
//                 value={setVoltageInput}
//                 onChange={onSetVoltageChange}
//                 className="border border-gray-300 rounded px-2 py-1 w-24 text-sm"
//               />{' '}
//               V
//             </div>
//             <div>
//               <strong>Actual Voltage:</strong>{' '}
//               {popup.cell.voltage != null ? popup.cell.voltage.toFixed(2) : 'N/A'} V
//             </div>
//             <div>
//               <strong>Temperature:</strong>{' '}
//               {popup.cell.temperature != null ? popup.cell.temperature.toFixed(1) : 'N/A'}°C
//             </div>
//             <div>
//               <strong>Balancing:</strong>{' '}
//               {balancingActive ? (
//                 <span className="text-green-600 font-semibold">ON</span>
//               ) : (
//                 <span className="text-gray-500">OFF</span>
//               )}
//             </div>
//             <div>
//               <strong>Open Wire:</strong>{' '}
//               {popup.cell.openWire ? (
//                 <span className="text-red-500 font-semibold">Yes</span>
//               ) : (
//                 <span className="text-green-600">No</span>
//               )}
//             </div>
//             <div>
//               <strong>Voltage Limits:</strong>{' '}
//               {popup.cell.voltageLimits || 'N/A'}
//             </div>
//             <div>
//               <strong>Raw Data:</strong>{' '}
//               {popup.cell.data || 'N/A'}
//             </div>
//           </div>

//           <div className="flex items-center mt-3">
//             <label htmlFor="balancingToggle" className="mr-2 text-sm font-medium">
//               Toggle Balancing:
//             </label>
//             <input
//               type="checkbox"
//               id="balancingToggle"
//               checked={balancingActive}
//               onChange={toggleBalancing}
//               className="cursor-pointer"
//             />
//           </div>

//           <button
//             onClick={() => setPopup(null)}
//             className="mt-4 text-xs text-blue-600 hover:underline"
//           >
//             Close
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Battery;









// update with dc data
import React, { useEffect, useState, useRef } from 'react';
import { useBatteryContext } from '../BatteryContext';
import { ResponseData } from './test';

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
  voltageLimits: string | null;
}

interface PopupInfo {
  cell: BatteryCell;
  position: { top: number; left: number };
}

const BatteryCellComponent: React.FC<{
  cell: BatteryCell;
  onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = 'bg-white-200 shadow-sm border-gray-300';
  if (cell.status === 'warning') statusColor = 'bg-yellow-300/20 border-yellow-400';
  else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-400';
  else if (cell.status === 'normal') statusColor = 'bg-green-300/20 border-green-400';

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[110px] h-[50px] m-[3px] border-l-2 border-blue-500 border-r-2 border-blue-500 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs bg-gray-100 text-gray-800 hover:scale-[1.03] transition-transform duration-200`}
    >
      <div>V: {cell.voltage != null ? cell.voltage.toFixed(2) : '-'}V</div>
      <div>T: {cell.temperature != null ? cell.temperature.toFixed(1) : '-'}°C</div>
      <div>Data: {cell.voltageLimits || cell.data || '-'}</div>
    </div>
  );
};

const Battery: React.FC = () => {
  const { responseData } = useBatteryContext();
  const [cells, setCells] = useState<BatteryCell[]>([]);
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [popupHeight, setPopupHeight] = useState(180);
  const popupRef = useRef<HTMLDivElement>(null);
  const [setVoltageInput, setSetVoltageInput] = useState<number>(3.65);
  const [balancingActive, setBalancingActive] = useState<boolean>(false);

  useEffect(() => {
    const initialCells = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      voltage: null,
      temperature: null,
      status: null,
      setVoltage: 3.65,
      balancing: false,
      openWire: false,
      data: null,
      voltageLimits: null,
    }));
    setCells(initialCells);
  }, []);

  useEffect(() => {
    if (!responseData) return;

    setCells((prevCells) =>
      prevCells.map((cell) => {
        const cellData = responseData[cell.id] || [];
        let voltage: number | null = cell.voltage;
        let temperature: number | null = cell.temperature;
        let status: CellStatus = cell.status;
        let setVoltage: number = cell.setVoltage;
        let balancing: boolean = cell.balancing;
        let openWire: boolean = cell.openWire;
        let data: string | null = cell.data;
        let voltageLimits: string | null = cell.voltageLimits;

        const voltageData = cellData.find((item) => item.command === 'get_voltage');
        if (voltageData && voltageData.value) {
          const parsedVoltage = parseFloat(voltageData.value);
          if (!isNaN(parsedVoltage)) {
            voltage = parsedVoltage;
            status = parsedVoltage < 3.3 ? 'critical' : parsedVoltage < 3.5 ? 'warning' : 'normal';
          }
        }

        const tempData = cellData.find((item) => item.command === 'get_temp');
        if (tempData && tempData.value) {
          const tempValue = parseFloat(tempData.value.replace(' °C', ''));
          if (!isNaN(tempValue)) {
            temperature = tempValue;
            if (temperature > 60) status = 'critical';
            else if (temperature > 45 && status !== 'critical') status = 'warning';
          }
        }

        const setVoltageData = cellData.find((item) => item.command === 'set_voltage');
        if (setVoltageData && setVoltageData.value) {
          const parsedSetVoltage = parseFloat(setVoltageData.value);
          if (!isNaN(parsedSetVoltage)) setVoltage = parsedSetVoltage;
        }

        const balanceData = cellData.find((item) => item.command === 'set_balance');
        if (balanceData && balanceData.value) {
          balancing = balanceData.value === 'On';
        }

        const openWireData = cellData.find((item) => item.command === 'set_ow');
        if (openWireData && openWireData.value) {
          openWire = openWireData.value === 'On';
        }

        const voltageLimitsData = cellData.find((item) => item.command === 'get_voltage_limits');
        if (voltageLimitsData && voltageLimitsData.value) {
          voltageLimits = voltageLimitsData.value;
        }

        return { ...cell, voltage, temperature, status, setVoltage, balancing, openWire, data, voltageLimits };
      })
    );
  }, [responseData]);

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
      left = Math.max(pading, targetRect.left - containerLeft - popupWidth + targetRect.width - padding);
    }

    if (top < 0) top = 0;
    if (left < 0) left = padding;

    setPopup({ cell, position: { top, left } });
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

    // Dispatch command to SerialTerminal (if needed)
    const command = {
      command: 'set_balance',
      cellNo: popup.cell.id,
      value: newBalancing ? 1 : 0,
    };
    window.serialAPI?.writePortRaw(new Uint8Array([
      0x07, 0x03, 0x03, popup.cell.id, newBalancing ? 1 : 0, 0, 0, 0
    ]));
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

    // Dispatch command to SerialTerminal (if needed)
    if (popup) {
      const command = {
        command: 'set_voltage',
        cellNo: popup.cell.id,
        voltage: val,
      };
      window.serialAPI?.writePortRaw(new Uint8Array([
        0x07, 0x03, 0x01, popup.cell.id, Math.floor(val * 10000) & 0xFF, 0, 0, 0
      ]));
    }
  };

  return (
    <div className="relative w-68">
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