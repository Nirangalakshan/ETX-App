// //correct one for adding reset for error panel
// import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
// import { ResponseData } from './components/test';

// type CellStatus = 'normal' | 'warning' | 'critical' | 'N/A';

// interface CellData {
//   id: number;
//   voltage: number | null;
//   temperature: number | null;
//   setVoltage: number | null;
//   setTemperature: number | null;
//   balancing: boolean;
//   openWire: boolean;
//   delay: number | null;
//   cellLed: boolean;
//   automaticSequence: boolean;
//   voltageLimits: string | null;
//   csu11Voltage: number | null;
//   csu11Temperature: number | null;
//   csu11Balance: boolean;
//   csu11OpenWire: boolean;
//   csu12Voltage: number | null;
//   csu12Temperature: number | null;
//   csu12Balance: boolean;
//   csu12OpenWire: boolean;
//   dcCsuVoltage: number | null;
//   dcCsuTemperature: number | null;
//   dcCsuBalance: boolean;
//   dcCsuOpenWire: boolean;
//   daisyChain: string | null;
//   expectedVoltage: number | null;
// }

// interface CellStatusData {
//   label: string;
//   status: CellStatus;
//   details?: string;
// }

// interface SetInstruction {
//   id: number;
//   command: string;
//   param1: string;
//   param2: string;
//   value: string;
//   cellNo: string;
//   cycleNo: string;
//   voltage: string;
//   temperature: string;
//   time: string;
// }

// interface AIAnalysis {
//   summary: string;
//   recommendations: string[];
//   isLoading: boolean;
//   error: string | null;
//   dataHash?: string;
// }

// interface BatteryContextType {
//   cellData: CellData[];
//   setCellData: React.Dispatch<React.SetStateAction<CellData[]>>;
//   daisyChainData: Record<number, ResponseData[]>;
//   setDaisyChainData: (data: Record<number, ResponseData[]>) => void;
//   dcCsuResponseData: Record<number, Record<number, ResponseData[]>>;
//   setDcCsuResponseData: (data: Record<number, Record<number, ResponseData[]>>) => void;
//   csu1ResponseData: Record<number, ResponseData[]>;
//   setCsu1ResponseData: (data: Record<number, ResponseData[]>) => void;
//   csu2ResponseData: Record<number, ResponseData[]>;
//   setCsu2ResponseData: (data: Record<number, ResponseData[]>) => void;
//   responseData: Record<number, ResponseData[]>;
//   setResponseData: (data: Record<number, ResponseData[]>) => void;
//   instructions: SetInstruction[];
//   setInstructions: (data: SetInstruction[]) => void;
//   aiAnalysis: AIAnalysis;
//   setAIAnalysis: (data: AIAnalysis) => void;
//   dcCsuInstructions: SetInstruction[];
//   setDcCsuInstructions: (data: SetInstruction[]) => void;
//   csu1Instructions: SetInstruction[];
//   setCsu1Instructions: (data: SetInstruction[]) => void;
//   csu2Instructions: SetInstruction[];
//   setCsu2Instructions: (data: SetInstruction[]) => void;
//   csu1Statuses: CellStatusData[];
//   setCsu1Statuses: (data: CellStatusData[]) => void;
//   csu2Statuses: CellStatusData[];
//   setCsu2Statuses: (data: CellStatusData[]) => void;
//   daisyStatuses: CellStatusData[];
//   setDaisyStatuses: (data: CellStatusData[]) => void;
//   statuses: CellStatusData[];
//   setStatuses: (data: CellStatusData[]) => void;
//   criticalState: boolean;
//   setCriticalState: (state: boolean) => void;
//   resetStatus: () => void;   // 🔥 add this
// }

// const BatteryContext = createContext<BatteryContextType | undefined>(undefined);

// export const BatteryProvider = ({ children }: { children: ReactNode }) => {
//   const initialCellData: CellData[] = Array.from({ length: 24 }, (_, i) => ({
//     id: i,
//     voltage: null,
//     temperature: null,
//     setVoltage: null,
//     setTemperature: null,
//     balancing: false,
//     openWire: false,
//     delay: null,
//     cellLed: false,
//     automaticSequence: false,
//     voltageLimits: null,
//     csu11Voltage: null,
//     csu11Temperature: null,
//     csu11Balance: false,
//     csu11OpenWire: false,
//     csu12Voltage: null,
//     csu12Temperature: null,
//     csu12Balance: false,
//     csu12OpenWire: false,
//     dcCsuVoltage: null,
//     dcCsuTemperature: null,
//     dcCsuBalance: false,
//     dcCsuOpenWire: false,
//     daisyChain: null,
//     expectedVoltage: null,
//   }));

//   const [cellData, setCellData] = useState<CellData[]>(initialCellData);
//   const [daisyChainData, setDaisyChainData] = useState<Record<number, ResponseData[]>>({});
//   const [dcCsuResponseData, setDcCsuResponseData] = useState<Record<number, Record<number, ResponseData[]>>>({});
//   const [csu1ResponseData, setCsu1ResponseData] = useState<Record<number, ResponseData[]>>({});
//   const [csu2ResponseData, setCsu2ResponseData] = useState<Record<number, ResponseData[]>>({});
//   const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});
//   const [instructions, setInstructions] = useState<SetInstruction[]>([]);
//   const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis>({
//     summary: '',
//     recommendations: [],
//     isLoading: false,
//     error: null,
//     dataHash: undefined,
//   });
//   const [dcCsuInstructions, setDcCsuInstructions] = useState<SetInstruction[]>([]);
//   const [csu1Instructions, setCsu1Instructions] = useState<SetInstruction[]>([]);
//   const [csu2Instructions, setCsu2Instructions] = useState<SetInstruction[]>([]);
//   const [csu1Statuses, setCsu1Statuses] = useState<CellStatusData[]>([]);
//   const [csu2Statuses, setCsu2Statuses] = useState<CellStatusData[]>([]);
//   const [daisyStatuses, setDaisyStatuses] = useState<CellStatusData[]>([]);
//   const [statuses, setStatuses] = useState<CellStatusData[]>([]);
//   const [criticalState, setCriticalState] = useState<boolean>(false);

//   // 🔥 resetStatus function (same logic you used in Battery.tsx)
//   const resetStatus = () => {
//     setStatuses([]);
//     setCsu1Statuses([]);
//     setCsu2Statuses([]);
//     setDaisyStatuses([]);
//     setCriticalState(false);
//   };

//   useEffect(() => {
//     console.log("BatteryContext: Initialized with cellData:", cellData);
//   }, []);

//   return (
//     <BatteryContext.Provider
//       value={{
//         cellData,
//         setCellData,
//         daisyChainData,
//         setDaisyChainData,
//         dcCsuResponseData,
//         setDcCsuResponseData,
//         csu1ResponseData,
//         setCsu1ResponseData,
//         csu2ResponseData,
//         setCsu2ResponseData,
//         responseData,
//         setResponseData,
//         instructions,
//         setInstructions,
//         aiAnalysis,
//         setAIAnalysis,
//         dcCsuInstructions,
//         setDcCsuInstructions,
//         csu1Instructions,
//         setCsu1Instructions,
//         csu2Instructions,
//         setCsu2Instructions,
//         csu1Statuses,
//         setCsu1Statuses,
//         csu2Statuses,
//         setCsu2Statuses,
//         daisyStatuses,
//         setDaisyStatuses,
//         statuses,
//         setStatuses,
//         criticalState,
//         setCriticalState,
//         resetStatus,   // ✅ provide it here
//       }}
//     >
//       {children}
//     </BatteryContext.Provider>
//   );
// };

// export const useBatteryContext = () => {
//   const context = useContext(BatteryContext);
//   if (!context) {
//     throw new Error('useBatteryContext must be used within a BatteryProvider');
//   }
//   return context;
// };










import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { ResponseData } from './components/test';

type CellStatus = 'normal' | 'warning' | 'critical' | 'N/A';

interface CellData {
  id: number;
  voltage: number | null;
  temperature: number | null;
  setVoltage: number | null;
  setTemperature: number | null;
  balancing: boolean;
  openWire: boolean;
  delay: number | null;
  cellLed: boolean;
  automaticSequence: boolean;
  voltageLimits: string | null;
  csu11Voltage: number | null;
  csu11Temperature: number | null;
  csu11Balance: boolean;
  csu11OpenWire: boolean;
  csu12Voltage: number | null;
  csu12Temperature: number | null;
  csu12Balance: boolean;
  csu12OpenWire: boolean;
  dcCsuVoltage: number | null;
  dcCsuTemperature: number | null;
  dcCsuBalance: boolean;
  dcCsuOpenWire: boolean;
  daisyChain: string | null;
  expectedVoltage: number | null;
}

interface CellStatusData {
  label: string;
  status: CellStatus;
  details?: string;
}

interface SetInstruction {
  id: number;
  command: string;
  param1: string;
  param2: string;
  value: string;
  cellNo: string;
  cycleNo: string;
  voltage: string;
  temperature: string;
  time: string;
}

interface AIAnalysis {
  summary: string;
  recommendations: string[];
  isLoading: boolean;
  error: string | null;
  dataHash?: string;
}

interface BatteryContextType {
  cellData: CellData[];
  setCellData: React.Dispatch<React.SetStateAction<CellData[]>>;
  daisyChainData: Record<number, ResponseData[]>;
  setDaisyChainData: (data: Record<number, ResponseData[]>) => void;
  dcCsuResponseData: Record<number, Record<number, ResponseData[]>>;
  setDcCsuResponseData: (data: Record<number, Record<number, ResponseData[]>>) => void;
  csu1ResponseData: Record<number, ResponseData[]>;
  setCsu1ResponseData: (data: Record<number, ResponseData[]>) => void;
  csu2ResponseData: Record<number, ResponseData[]>;
  setCsu2ResponseData: (data: Record<number, ResponseData[]>) => void;
  responseData: Record<number, ResponseData[]>;
  setResponseData: (data: Record<number, ResponseData[]>) => void;
  instructions: SetInstruction[];
  setInstructions: (data: SetInstruction[]) => void;
  aiAnalysis: AIAnalysis;
  setAIAnalysis: (data: AIAnalysis) => void;
  dcCsuInstructions: SetInstruction[];
  setDcCsuInstructions: (data: SetInstruction[]) => void;
  csu1Instructions: SetInstruction[];
  setCsu1Instructions: (data: SetInstruction[]) => void;
  csu2Instructions: SetInstruction[];
  setCsu2Instructions: (data: SetInstruction[]) => void;
  csu1Statuses: CellStatusData[];
  setCsu1Statuses: (data: CellStatusData[]) => void;
  csu2Statuses: CellStatusData[];
  setCsu2Statuses: (data: CellStatusData[]) => void;
  daisyStatuses: CellStatusData[];
  setDaisyStatuses: (data: CellStatusData[]) => void;
  statuses: CellStatusData[];
  setStatuses: (data: CellStatusData[]) => void;
  criticalState: boolean;
  setCriticalState: (state: boolean) => void;
  resetStatus: () => void;
  csu1TesterVoltages: (number | null)[];
  setCsu1TesterVoltages: React.Dispatch<React.SetStateAction<(number | null)[]>>;
  testerVoltages: (number | null)[];
  setTesterVoltages: React.Dispatch<React.SetStateAction<(number | null)[]>>;
}

const BatteryContext = createContext<BatteryContextType | undefined>(undefined);

export const BatteryProvider = ({ children }: { children: ReactNode }) => {
  const initialCellData: CellData[] = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    voltage: null,
    temperature: null,
    setVoltage: null,
    setTemperature: null,
    balancing: false,
    openWire: false,
    delay: null,
    cellLed: false,
    automaticSequence: false,
    voltageLimits: null,
    csu11Voltage: null,
    csu11Temperature: null,
    csu11Balance: false,
    csu11OpenWire: false,
    csu12Voltage: null,
    csu12Temperature: null,
    csu12Balance: false,
    csu12OpenWire: false,
    dcCsuVoltage: null,
    dcCsuTemperature: null,
    dcCsuBalance: false,
    dcCsuOpenWire: false,
    daisyChain: null,
    expectedVoltage: null,
  }));

  const [cellData, setCellData] = useState<CellData[]>(initialCellData);
  const [daisyChainData, setDaisyChainData] = useState<Record<number, ResponseData[]>>({});
  const [dcCsuResponseData, setDcCsuResponseData] = useState<Record<number, Record<number, ResponseData[]>>>({});
  const [csu1ResponseData, setCsu1ResponseData] = useState<Record<number, ResponseData[]>>({});
  const [csu2ResponseData, setCsu2ResponseData] = useState<Record<number, ResponseData[]>>({});
  const [responseData, setResponseData] = useState<Record<number, ResponseData[]>>({});
  const [instructions, setInstructions] = useState<SetInstruction[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis>({
    summary: '',
    recommendations: [],
    isLoading: false,
    error: null,
    dataHash: undefined,
  });
  const [dcCsuInstructions, setDcCsuInstructions] = useState<SetInstruction[]>([]);
  const [csu1Instructions, setCsu1Instructions] = useState<SetInstruction[]>([]);
  const [csu2Instructions, setCsu2Instructions] = useState<SetInstruction[]>([]);
  const [csu1Statuses, setCsu1Statuses] = useState<CellStatusData[]>([]);
  const [csu2Statuses, setCsu2Statuses] = useState<CellStatusData[]>([]);
  const [daisyStatuses, setDaisyStatuses] = useState<CellStatusData[]>([]);
  const [statuses, setStatuses] = useState<CellStatusData[]>([]);
  const [criticalState, setCriticalState] = useState<boolean>(false);
  const [csu1TesterVoltages, setCsu1TesterVoltages] = useState<(number | null)[]>(Array(12).fill(null));
  const [testerVoltages, setTesterVoltages] = useState<(number | null)[]>(Array(24).fill(null));

  const resetStatus = () => {
    setStatuses([]);
    setCsu1Statuses([]);
    setCsu2Statuses([]);
    setDaisyStatuses([]);
    setCriticalState(false);
  };

//     const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
//   1: 2.0,
//   2: 2.5,
//   3: 2.8,
//   4: 3.0,
//   5: 3.3,
//   6: 3.6,
//   7: 3.9,   // ✅ updated here
//   8: 4.2,
// };

// useEffect(() => {
//   setCellData(prevCells =>
//     prevCells.map(cell => ({
//       ...cell,
//       expectedVoltage: cell.setVoltage
//         ? EXPECTED_SENT_VOLTAGES[cell.setVoltage] ?? null
//         : null,
//     }))
//   );
// }, [instructions]); // or [cellData] if expectedVoltage must refresh when cellData updates


  useEffect(() => {
    console.log("BatteryContext: Initialized with cellData:", cellData);
  }, []);

  

  return (
    <BatteryContext.Provider
      value={{
        cellData,
        setCellData,
        daisyChainData,
        setDaisyChainData,
        dcCsuResponseData,
        setDcCsuResponseData,
        csu1ResponseData,
        setCsu1ResponseData,
        csu2ResponseData,
        setCsu2ResponseData,
        responseData,
        setResponseData,
        instructions,
        setInstructions,
        aiAnalysis,
        setAIAnalysis,
        dcCsuInstructions,
        setDcCsuInstructions,
        csu1Instructions,
        setCsu1Instructions,
        csu2Instructions,
        setCsu2Instructions,
        csu1Statuses,
        setCsu1Statuses,
        csu2Statuses,
        setCsu2Statuses,
        daisyStatuses,
        setDaisyStatuses,
        statuses,
        setStatuses,
        criticalState,
        setCriticalState,
        resetStatus,
        csu1TesterVoltages,
        setCsu1TesterVoltages,
        testerVoltages,
        setTesterVoltages
      }}
    >
      {children}
    </BatteryContext.Provider>
  );
};

export const useBatteryContext = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error('useBatteryContext must be used within a BatteryProvider');
  }
  return context;
};