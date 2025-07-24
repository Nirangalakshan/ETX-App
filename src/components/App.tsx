import React, { useState } from 'react';
import SerialTerminal, { ResponseData } from "./test";
import Battery from './Battery';
import CSU1 from './CSU1';
import CSU2 from './CSU2';

const ParentComponent: React.FC = () => {
  // Separate state for each component
  const [individualResponseData, setIndividualResponseData] = useState<Record<number, ResponseData[]>>({});
  const [csu1ResponseData, setCsu1ResponseData] = useState<Record<number, ResponseData[]>>({});
  const [csu2ResponseData, setCsu2ResponseData] = useState<Record<number, ResponseData[]>>({});
  
  const [selectedCell, setSelectedCell] = useState<any>(null);

  const updateCellVoltage = (cellId: number, voltage: number) => {
    // Your implementation for updating cell voltage
    console.log(`Updating cell ${cellId} with voltage ${voltage}`);
  };

  // Transform individual response data to Battery cells format
  const transformToBatteryCells = () => {
    return Array.from({ length: 24 }, (_, i) => {
      const cellData = individualResponseData[i] || [];
      
      // Extract voltage
      const voltageData = cellData.find((item) => 
        item.command === 'get_voltage' || item.command === 'set_voltage'
      );
      const voltage = voltageData ? parseFloat(voltageData.value) : null;
      
      // Extract temperature
      const tempData = cellData.find((item) => 
        item.command === 'get_temp' || item.command === 'set_temp'
      );
      const temperature = tempData ? parseFloat(tempData.value.replace(' °C', '')) : null;
      
      // Extract other data
      const balancingData = cellData.find((item) => item.command === 'get_dc_csu_balance');
      const openWireData = cellData.find((item) => item.command === 'get_dc_csu_ow');
      const voltageLimitsData = cellData.find((item) => item.command === 'get_voltage_limits');
      
      // Determine status
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (voltage !== null) {
        if (voltage < 3.3) status = 'critical';
        else if (voltage < 3.5) status = 'warning';
      }
      if (temperature !== null && temperature > 60) {
        status = 'critical';
      } else if (temperature !== null && temperature > 45 && status !== 'critical') {
        status = 'warning';
      }
      
      return {
        id: i,
        voltage,
        temperature,
        status,
        setVoltage: voltage || 3.65, // Default set voltage
        balancing: balancingData?.value === 'On' || false,
        openWire: openWireData?.value === 'On' || false,
        data: cellData.map(item => `${item.command}: ${item.value}`).join(', '),
        voltageLimits: voltageLimitsData?.value || null,
      };
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold text-center mb-8">Battery Management System</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Individual Battery Cells */}
          <div className="lg:col-span-1">
            <Battery 
              cells={transformToBatteryCells()} 
              setSelectedCell={setSelectedCell} 
            />
          </div>
          
          {/* CSU Components */}
          <div className="lg:col-span-1 space-y-4">
            <CSU1 responseData={csu1ResponseData} />
            <CSU2 responseData={csu2ResponseData} />
          </div>
          
          {/* Serial Terminal */}
          <div className="lg:col-span-1">
            <SerialTerminal
              responseData={individualResponseData}
              setResponseData={setIndividualResponseData}
              csu1ResponseData={csu1ResponseData}
              setCsu1ResponseData={setCsu1ResponseData}
              csu2ResponseData={csu2ResponseData}
              setCsu2ResponseData={setCsu2ResponseData}
              updateCellVoltage={updateCellVoltage}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentComponent;