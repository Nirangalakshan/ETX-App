import React, { useState } from 'react';
import SerialTerminal from './test';
import CSU1 from './CSU1';
import CSU2 from './CSU2';
import { ResponseData } from './test'; // Import ResponseData type from SerialTerminal
import { BatteryCell } from './CSU2';

const App: React.FC = () => {
  const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});
  const [csu1Cells, setCsu1Cells] = useState<BatteryCell[]>([]);
  const [csu2Cells, setCsu2Cells] = useState<BatteryCell[]>([]);

  const updateCellVoltage = (cellId: number, voltage: number) => {
    // Update CSU1 cells for get_11_csu_volt
    setCsu1Cells((prevCells) =>
      prevCells.map((cell) =>
        cell.id === cellId
          ? {
              ...cell,
              voltage,
              status:
                voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal',
            }
          : cell
      )
    );

    // Update CSU2 cells for get_12_csu_volt
    setCsu2Cells((prevCells) =>
      prevCells.map((cell) =>
        cell.id === cellId
          ? {
              ...cell,
              voltage,
              status:
                voltage < 3.3 ? 'critical' : voltage < 3.5 ? 'warning' : 'normal',
            }
          : cell
      )
    );
  };

  return (
    <div className="p-4 space-y-4">
      <SerialTerminal
        responseData={responseData}
        setResponseData={setResponseData}
        updateCellVoltage={updateCellVoltage}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CSU1 responseData={responseData} />
        <CSU2 responseData={responseData} />
      </div>
    </div>
  );
};

export default App;