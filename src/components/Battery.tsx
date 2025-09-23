


// /* eslint-disable */
// /* @ts-nocheck */
// import React, { useEffect, useState, useRef } from 'react';
// import { useBatteryContext } from '../BatteryContext';

// type CellStatus = 'normal' | 'warning' | 'critical' | 'no-data';

// export interface BatteryCell {
//   id: number;
//   voltage: number | null; // Received voltage
//   temperature: number | null; // Received temperature
//   status: CellStatus;
//   setVoltage: number | null; // Sent set_voltage
//   setTemperature: number | null; // Sent set_temp
//   balancing: boolean; // Sent set_balance
//   openWire: boolean; // Sent set_ow
//   voltageLimits: string | null; // Received voltage limits
//   data: string | null; // Other raw data
// }

// interface PopupInfo {
//   cell: BatteryCell;
//   position: { top: number; left: number };
// }

// const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
//   1: 2.0,
//   2: 2.5,
//   3: 2.8,
//   4: 3.3,
//   5: 3.4,
//   6: 3.6,
//   7: 4.0,
//   8: 4.2,
// };

// const VOLTAGE_WARNING_THRESHOLD = 0.1;
// const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
// const TEMPERATURE_WARNING_THRESHOLD = 5;
// const TEMPERATURE_CRITICAL_THRESHOLD = 10;

// const BatteryCellComponent: React.FC<{
//   cell: BatteryCell;
//   onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
// }> = ({ cell, onClick }) => {
//   let statusColor = 'bg-white/20 shadow-sm border-gray-300';
//   if (cell.status === 'warning') statusColor = 'bg-yellow-300/20 border-yellow-400';
//   else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-400 ';
//   else if (cell.status === 'normal') statusColor = 'bg-green-300/20 border-green-400';
//   else if (cell.status === 'no-data') statusColor = 'bg-gray-300/20 border-gray-300';

//   return (
//     <div
//       onClick={(e) => onClick(e, cell)}
//       className={`w-[110px] h-[50px] m-[3px] border-l-2 border-blue-500 border-r-2 border-blue-500 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs bg-gray-100 text-gray-800 hover:scale-[1.03] transition-transform duration-200`}
//     >
//       <div>V: {cell.voltage != null ? cell.voltage : '-' }V</div>
//       <div>T: {cell.temperature != null ? cell.temperature.toFixed(1) : '-' }°C</div>
//       <div>Data: {cell.voltageLimits || cell.data || '-'}</div>
//     </div>
//   );
// };

// const Battery: React.FC = () => {
//   const { responseData, instructions } = useBatteryContext();
//   const [cells, setCells] = useState<BatteryCell[]>([]);
//   const [popup, setPopup] = useState<PopupInfo | null>(null);
//   const [showCriticalAlert, setShowCriticalAlert] = useState(false);
//   const [popupHeight, setPopupHeight] = useState<number>(200); // Initial height
//   const popupRef = useRef<HTMLDivElement>(null);

//   // Initialize cells
//   useEffect(() => {
//     const initialCells: BatteryCell[] = Array.from({ length: 24 }, (_, i) => ({
//       id: i,
//       voltage: null,
//       temperature: null,
//       status: 'no-data',
//       setVoltage: null,
//       setTemperature: null,
//       balancing: false,
//       openWire: false,
//       data: null,
//       voltageLimits: null,
//     }));
//     setCells(initialCells);
//     console.log('Initial cells set:', initialCells); // Debug log
//   }, []);

//   // Update cells based on responseData and instructions
//   useEffect(() => {
//     if (!responseData || !Array.isArray(instructions)) {
//       console.log('Invalid responseData or instructions:', { responseData, instructions });
//       return;
//     }

//     setCells((prevCells) =>
//       prevCells.map((cell) => {
//         const cellData = Array.isArray(responseData[cell.id]) ? responseData[cell.id] : [];
//         const cellInstructions = instructions.filter((instr) => {
//           const cellNo = parseInt(instr.cellNo, 10);
//           return !isNaN(cellNo) && cellNo === cell.id;
//         });

//         let voltage: number | null = cell.voltage;
//         let temperature: number | null = cell.temperature;
//         let status: CellStatus = cell.status;
//         let setVoltage: number | null = cell.setVoltage;
//         let setTemperature: number | null = cell.setTemperature;
//         let balancing: boolean = cell.balancing;
//         let openWire: boolean = cell.openWire;
//         let data: string | null = cell.data;
//         let voltageLimits: string | null = cell.voltageLimits;

//         // Update from responseData (received values)
//         if (Array.isArray(cellData)) {
//           const voltageData = cellData.find((item) => item.command === 'get_voltage');
//           if (voltageData && voltageData.value) {
//             const parsedVoltage = parseFloat(voltageData.value);
//             if (!isNaN(parsedVoltage)) {
//               voltage = parsedVoltage;
//             }
//           }

//           const tempData = cellData.find((item) => item.command === 'get_temp');
//           if (tempData && tempData.value) {
//             const tempValue = parseFloat(tempData.value.replace(' °C', ''));
//             if (!isNaN(tempValue)) {
//               temperature = tempValue;
//             }
//           }

//           const voltageLimitsData = cellData.find((item) => item.command === 'get_voltage_limits');
//           if (voltageLimitsData && voltageLimitsData.value) {
//             voltageLimits = voltageLimitsData.value;
//           }
//         } else {
//           console.warn(`cellData for cell ${cell.id} is not an array:`, cellData);
//         }

//         // Update from instructions (sent values)
//         const setVoltageInstruction = cellInstructions.find((instr) => instr.command === 'set_voltage');
//         if (setVoltageInstruction && setVoltageInstruction.voltage) {
//           const parsedSetVoltage = parseInt(setVoltageInstruction.voltage, 10);
//           setVoltage = parsedSetVoltage >= 1 && parsedSetVoltage <= 8 ? parsedSetVoltage : null;
//         } else {
//           setVoltage = null;
//         }

//         const setTempInstruction = cellInstructions.find((instr) => instr.command === 'set_temp');
//         if (setTempInstruction && setTempInstruction.temperature) {
//           const parsedSetTemp = parseFloat(setTempInstruction.temperature);
//           setTemperature = !isNaN(parsedSetTemp) ? parsedSetTemp : null;
//         } else {
//           setTemperature = null;
//         }

//         const balanceInstruction = cellInstructions.find((instr) => instr.command === 'set_balance');
//         balancing = balanceInstruction ? balanceInstruction.value === '1' : false;

//         const openWireInstruction = cellInstructions.find((instr) => instr.command === 'set_ow');
//         openWire = openWireInstruction ? openWireInstruction.value === '1' : false;

//         // Update status based on voltage and temperature gaps
//         if (voltage !== null && setVoltage !== null && setVoltage in EXPECTED_SENT_VOLTAGES) {
//           const expectedVoltage = EXPECTED_SENT_VOLTAGES[setVoltage];
//           const voltageGap = Math.abs(expectedVoltage - voltage);
//           if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = 'critical';
//           else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = 'warning';
//           else status = 'normal';
//         } else if (temperature !== null && setTemperature !== null) {
//           const tempGap = Math.abs(setTemperature - temperature);
//           if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = 'critical';
//           else if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) status = 'warning';
//           else status = 'normal';
//         } else if (voltage === null && temperature === null) {
//           status = 'no-data';
//         }

//         return { ...cell, voltage, temperature, status, setVoltage, setTemperature, balancing, openWire, data, voltageLimits };
//       })
//     );
//     console.log('Updated cells:', cells); // Debug log
//   }, [responseData, instructions]);

//   // Check for critical state and show alert
//   useEffect(() => {
//     const hasCritical = cells.some(cell => cell.status === 'critical');
//     setShowCriticalAlert(hasCritical);
//     if (hasCritical) {
//       console.log('Critical state detected in one or more cells');
//     }
//   }, [cells]);

//   // Update popup height dynamically
//   useEffect(() => {
//     if (popupRef.current) {
//       setPopupHeight(popupRef.current.offsetHeight);
//       console.log('Popup height updated:', popupRef.current.offsetHeight); // Debug log
//     }
//   }, [popup]);

//   const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
//     const targetRect = (e.target as HTMLElement).getBoundingClientRect();
//     const popupWidth = 240;
//     const padding = 10;

//     const container = document.querySelector('.grid') as HTMLElement;
//     if (!container) {
//       console.error('Grid container not found'); // Debug log
//       return;
//     }
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
//     console.log('Popup set for cell:', cell.id, { top, left }); // Debug log
//   };

//   return (
//     <div className="relative w-64 ">
//       <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
//         TESTER READINGS
//       </h2>
//       <div
//         className="grid grid-cols-2 gap-2 bg-white/60 border border-cyan-100 p-3 rounded-lg shadow-lg backdrop-blur-sm"
//         style={{
//           height: 'calc(109vh - 80px)',
//           overflow: 'hidden',
//           position: 'relative',
//         }}
//       >
//         {cells.length === 0 ? (
//           <p className="text-gray-500 text-center col-span-2">No cells available</p>
//         ) : (
//           cells.map((cell) => (
//             <BatteryCellComponent
//               key={cell.id}
//               cell={cell}
//               onClick={handleCellClick}
//             />
//           ))
//         )}
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
//               <strong>Sent Voltage Command:</strong>{' '}
//               {popup.cell.setVoltage != null ? popup.cell.setVoltage : 'N/A'}
//             </div>
//             <div>
//               <strong>Expected Voltage:</strong>{' '}
//               {popup.cell.setVoltage != null && popup.cell.setVoltage in EXPECTED_SENT_VOLTAGES
//                 ? `${EXPECTED_SENT_VOLTAGES[popup.cell.setVoltage]}V`
//                 : 'N/A'}
//             </div>
//             <div>
//               <strong>Received Voltage:</strong>{' '}
//               {popup.cell.voltage != null ? `${popup.cell.voltage}V` : 'N/A'}
//             </div>
//             <div>
//               <strong>Sent Temperature:</strong>{' '}
//               {popup.cell.setTemperature != null ? `${popup.cell.setTemperature.toFixed(1)}°C` : 'N/A'}
//             </div>
//             <div>
//               <strong>Received Temperature:</strong>{' '}
//               {popup.cell.temperature != null ? `${popup.cell.temperature.toFixed(1)}°C` : 'N/A'}
//             </div>
//             <div>
//               <strong>Balancing:</strong>{' '}
//               {popup.cell.balancing ? (
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
//           <button
//             onClick={() => setPopup(null)}
//             className="mt-4 text-xs text-blue-600 hover:underline"
//           >
//             Close
//           </button>
//         </div>
//       )}


// {showCriticalAlert && (
//   <div
    
//     className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/80 text-white rounded-lg shadow-2xl p-6 backdrop-blur-sm"
//     style={{ minWidth: 300 }}
//   >
//     {/* <span class="relative flex size-3">
//   <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-90"></span>
//   <span class="relative inline-flex size-3 rounded-full bg-sky-500"></span>
// </span> */}
//     <h3 className="text-lg font-semibold mb-3">Error</h3>
//     <p className="text-base">Tester board failed due to critical cell status!</p>
//     <p className="text-sm">Please check the following cells:</p>
//     <div className="mt-3">
//       <strong>Critical Cells:</strong>
//       <ul className="list-disc pl-5 mt-1 text-sm ">
//         {cells
//           .filter((cell) => cell.status === 'critical')
//           .map((cell) => (
//             <li key={cell.id}>Cell ID: {cell.id}</li>
//           ))}
//       </ul>
//     </div>
//     <button
//       onClick={() => setShowCriticalAlert(false)}
//       className="mt-4 bg-white text-red-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
//     >
//       Close
//     </button>
//   </div>
// )}
//     </div>
//   );
// };

// export default Battery;











/* eslint-disable */
/* @ts-nocheck */
import React, { useEffect, useState, useRef } from 'react';
import { useBatteryContext } from '../BatteryContext';

type CellStatus = 'normal' | 'warning' | 'critical' | 'no-data';

export interface BatteryCell {
  id: number;
  voltage: number | null; // Received voltage
  temperature: number | null; // Received temperature
  status: CellStatus;
  setVoltage: number | null; // Sent set_voltage level (1-8)
  expectedVoltage: number | null; // Derived expected voltage from set_voltage level
  setTemperature: number | null; // Sent set_temp
  balancing: boolean; // Sent set_balance
  openWire: boolean; // Sent set_ow
  voltageLimits: string | null; // Received voltage limits
  data: string | null; // Other raw data
}

interface PopupInfo {
  cell: BatteryCell;
  position: { top: number; left: number };
}

const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
  1: 2.0,
  2: 2.5,
  3: 2.8,
  4: 3.3,
  5: 3.4,
  6: 3.6,
  7: 4.0,
  8: 4.2,
};

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

const BatteryCellComponent: React.FC<{
  cell: BatteryCell;
  onClick: (event: React.MouseEvent, cell: BatteryCell) => void;
}> = ({ cell, onClick }) => {
  let statusColor = 'bg-white/20 shadow-sm border-gray-300';
  if (cell.status === 'warning') statusColor = 'bg-yellow-300/20 border-yellow-400';
  else if (cell.status === 'critical') statusColor = 'bg-red-300/20 border-red-400 ';
  else if (cell.status === 'normal') statusColor = 'bg-green-300/20 border-green-400';
  else if (cell.status === 'no-data') statusColor = 'bg-gray-300/20 border-gray-300';

  return (
    <div
      onClick={(e) => onClick(e, cell)}
      className={`w-[110px] h-[50px] m-[3px] border-l-2 border-blue-500 border-r-2 border-blue-500 rounded-lg shadow-sm backdrop-blur-sm ${statusColor} cursor-pointer flex flex-col items-center justify-center text-xs bg-gray-100 text-gray-800 hover:scale-[1.03] transition-transform duration-200`}
    >
      <div>
        V: {cell.voltage != null ? cell.voltage : '-'} / {cell.expectedVoltage != null ? cell.expectedVoltage : '-'}V
      </div>
      <div>
        T: {cell.temperature != null ? cell.temperature.toFixed(1) : '-'} / {cell.setTemperature != null ? cell.setTemperature.toFixed(1) : '-'}°C
      </div>
      <div>Data: {cell.voltageLimits || cell.data || '-'}</div>
    </div>
  );
};

const Battery: React.FC = () => {
  const { cellData, responseData } = useBatteryContext();
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [showCriticalAlert, setShowCriticalAlert] = useState(false);
  const [popupHeight, setPopupHeight] = useState<number>(200);
  const popupRef = useRef<HTMLDivElement>(null);

  // Check for critical state and show alert
  useEffect(() => {
    const hasCritical = cellData.some(cell => {
      let status: CellStatus = 'no-data';
      if (cell.voltage !== null && cell.expectedVoltage !== null) {
        const voltageGap = Math.abs(cell.expectedVoltage - cell.voltage);
        if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = 'critical';
        else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = 'warning';
        else status = 'normal';
      } else if (cell.temperature !== null && cell.setTemperature !== null) {
        const tempGap = Math.abs(cell.setTemperature - cell.temperature);
        if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = 'critical';
        else if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) status = 'warning';
        else status = 'normal';
      }
      return status === 'critical';
    });
    setShowCriticalAlert(hasCritical);
    if (hasCritical) {
      console.log('Critical state detected in one or more cells');
    }
  }, [cellData]);

  // Update popup height dynamically
  useEffect(() => {
    if (popupRef.current) {
      setPopupHeight(popupRef.current.offsetHeight);
      console.log('Popup height updated:', popupRef.current.offsetHeight);
    }
  }, [popup]);

  const handleCellClick = (e: React.MouseEvent, cell: BatteryCell) => {
    const targetRect = (e.target as HTMLElement).getBoundingClientRect();
    const popupWidth = 240;
    const padding = 10;

    const container = document.querySelector('.grid') as HTMLElement;
    if (!container) {
      console.error('Grid container not found');
      return;
    }
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
    console.log('Popup set for cell:', cell.id, { top, left });
  };

  return (
    <div className="relative w-64">
      <h2 className="text-lg font-inter text-gray-800 mb-3 text-center font-semibold py-1 rounded-md shadow-md">
        TESTER READINGS
      </h2>
      <div
        className="grid grid-cols-2 gap-2 bg-white/60 border border-cyan-100 p-3 rounded-lg shadow-lg backdrop-blur-sm"
        style={{
          height: 'calc(109vh - 80px)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {cellData.length === 0 ? (
          <p className="text-gray-500 text-center col-span-2">No cells available</p>
        ) : (
          cellData.map((cell) => {
            // Compute status for rendering
            let status: CellStatus = 'no-data';
            if (cell.voltage !== null && cell.expectedVoltage !== null) {
              const voltageGap = Math.abs(cell.expectedVoltage - cell.voltage);
              if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = 'critical';
              else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = 'warning';
              else status = 'normal';
            } else if (cell.temperature !== null && cell.setTemperature !== null) {
              const tempGap = Math.abs(cell.setTemperature - cell.temperature);
              if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = 'critical';
              else if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) status = 'warning';
              else status = 'normal';
            }
            return (
              <BatteryCellComponent
                key={cell.id}
                cell={{ ...cell, status }}
                onClick={handleCellClick}
              />
            );
          })
        )}
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
              <strong>Sent Voltage Command:</strong>{' '}
              {popup.cell.setVoltage != null ? popup.cell.setVoltage : 'N/A'}
            </div>
            <div>
              <strong>Expected Voltage:</strong>{' '}
              {popup.cell.expectedVoltage != null
                ? `${popup.cell.expectedVoltage}V`
                : 'N/A'}
            </div>
            <div>
              <strong>Received Voltage:</strong>{' '}
              {popup.cell.voltage != null ? `${popup.cell.voltage}V` : 'N/A'}
            </div>
            <div>
              <strong>Sent Temperature:</strong>{' '}
              {popup.cell.setTemperature != null ? `${popup.cell.setTemperature.toFixed(1)}°C` : 'N/A'}
            </div>
            <div>
              <strong>Received Temperature:</strong>{' '}
              {popup.cell.temperature != null ? `${popup.cell.temperature.toFixed(1)}°C` : 'N/A'}
            </div>
            <div>
              <strong>Balancing:</strong>{' '}
              {popup.cell.balancing ? (
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
          <button
            onClick={() => setPopup(null)}
            className="mt-4 text-xs text-blue-600 hover:underline"
          >
            Close
          </button>
        </div>
      )}

      {showCriticalAlert && (
        <div
          className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/80 text-white rounded-lg shadow-2xl p-6 backdrop-blur-sm"
          style={{ minWidth: 300 }}
        >
          <h3 className="text-lg font-semibold mb-3">Error</h3>
          <p className="text-base">Tester board failed due to critical cell status!</p>
          <p className="text-sm">Please check the following cells:</p>
          <div className="mt-3">
            <strong>Critical Cells:</strong>
            <ul className="list-disc pl-5 mt-1 text-sm">
              {cellData
                .filter((cell) => {
                  let status: CellStatus = 'no-data';
                  if (cell.voltage !== null && cell.expectedVoltage !== null) {
                    const voltageGap = Math.abs(cell.expectedVoltage - cell.voltage);
                    if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = 'critical';
                    else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = 'warning';
                    else status = 'normal';
                  }
                  return status === 'critical';
                })
                .map((cell) => (
                  <li key={cell.id}>Cell ID: {cell.id}</li>
                ))}
            </ul>
          </div>
          <button
            onClick={() => setShowCriticalAlert(false)}
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default Battery;