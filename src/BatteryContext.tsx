import React, { createContext, useContext, useState, ReactNode } from "react";
import { ResponseData } from "./components/test";

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