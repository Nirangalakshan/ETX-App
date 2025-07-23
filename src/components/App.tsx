import React, { useState } from 'react';
import SerialTerminal from './test';
import CSU1 from './CSU1';
import CSU2 from './CSU2';
import { ResponseData } from './test';

const App: React.FC = () => {
  const [responseData, setResponseData] = useState<{
    individualCells: Record<number, ResponseData[]>;
    csu11: Record<number, ResponseData[]>;
    csu12: Record<number, ResponseData[]>;
  }>({
    individualCells: {},
    csu11: {},
    csu12: {},
  });

  return (
    <div className="p-4 space-y-4">
      <SerialTerminal
        responseData={responseData}
        setResponseData={setResponseData}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CSU1 responseData={responseData.csu11 || {}} />
        <CSU2 responseData={responseData.csu12 || {}} />
      </div>
    </div>
  );
};

export default App;