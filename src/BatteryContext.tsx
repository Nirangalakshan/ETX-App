// import { createContext, useContext, useState, ReactNode } from "react";
// import { ResponseData } from "./components/test";

// interface SetInstruction {
//   id: number;
//   command: string;
//   param1: string;
//   param2: string;
//   cellNo: string;
//   cycleNo: string;
//   voltage: string;
//   temperature: string;
//   time: string;
// }

// interface BatteryContextType {
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
// }

// const BatteryContext = createContext<BatteryContextType | undefined>(undefined);

// export const BatteryProvider = ({ children }: { children: ReactNode }) => {
//   const [daisyChainData, setDaisyChainData] = useState<Record<number, ResponseData[]>>({});
//   const [dcCsuResponseData, setDcCsuResponseData] = useState<
//     Record<number, Record<number, ResponseData[]>>
//   >({});
//   const [csu1ResponseData, setCsu1ResponseData] = useState<
//     Record<number, ResponseData[]>
//   >({});
//   const [csu2ResponseData, setCsu2ResponseData] = useState<
//     Record<number, ResponseData[]>
//   >({});
//   const [responseData, setResponseData] = useState<
//     Record<number, ResponseData[]>
//   >({});
//   const [instructions, setInstructions] = useState<SetInstruction[]>([]);

//   return (
//     <BatteryContext.Provider
//       value={{
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
//       }}
//     >
//       {children}
//     </BatteryContext.Provider>
//   );
// };

// export const useBatteryContext = () => {
//   const context = useContext(BatteryContext);
//   if (!context) {
//     throw new Error("useBatteryContext must be used within a BatteryProvider");
//   }
//   return context;
// };











import { createContext, useContext, useState, ReactNode } from "react";
import { ResponseData } from "./components/test";

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
  dataHash?: string; // Store hash of data used for analysis
}

interface BatteryContextType {
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
}

const BatteryContext = createContext<BatteryContextType | undefined>(undefined);

export const BatteryProvider = ({ children }: { children: ReactNode }) => {
  const [daisyChainData, setDaisyChainData] = useState<Record<number, ResponseData[]>>({});
  const [dcCsuResponseData, setDcCsuResponseData] = useState<
    Record<number, Record<number, ResponseData[]>>
  >({});
  const [csu1ResponseData, setCsu1ResponseData] = useState<
    Record<number, ResponseData[]>
  >({});
  const [csu2ResponseData, setCsu2ResponseData] = useState<
    Record<number, ResponseData[]>
  >({});
  const [responseData, setResponseData] = useState<
    Record<number, ResponseData[]>
  >({});
  const [instructions, setInstructions] = useState<SetInstruction[]>([]);
  const [aiAnalysis, setAIAnalysis] = useState<AIAnalysis>({
    summary: "",
    recommendations: [],
    isLoading: false,
    error: null,
    dataHash: undefined,
  });

  return (
    <BatteryContext.Provider
      value={{
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
      }}
    >
      {children}
    </BatteryContext.Provider>
  );
};

export const useBatteryContext = () => {
  const context = useContext(BatteryContext);
  if (!context) {
    throw new Error("useBatteryContext must be used within a BatteryProvider");
  }
  return context;
};