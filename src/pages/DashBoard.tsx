/* eslint-disable */
/* @ts-nocheck */

import React, { useState, useEffect, useRef } from "react";
import MenuBar from "../components/MenuBar";
import Battery from "../components/Battery";
import CSU1 from "../components/CSU1";
import CSU2 from "../components/CSU2";
import ErrorWarningPanel from "../components/ErrorWarningPanel";
import SerialTerminal from "../components/test";
import Daicy from "../components/Daicy";
import { useBatteryContext } from "../BatteryContext";
import "../index.css";

interface BatteryCell {
  id: number;
  voltage: number | null;
  temperature: number | null;
  status: "normal" | "warning" | "critical" | "N/A";
  setVoltage: number | null;
  setTemperature: number | null;
  balancing: boolean;
  openWire: boolean;
  voltageLimits: string | null;
  data: string | null;
}

interface ResponseData {
  command: string;
  value: string;
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

const DashBoard: React.FC = () => {
  const {
    csu1ResponseData,
    csu2ResponseData,
    dcCsuResponseData,
    setDcCsuResponseData,
    responseData,
    setResponseData,
    instructions,
    setInstructions,
    dcCsuInstructions,
    setDcCsuInstructions,
    csu1Instructions,
    setCsu1Instructions,
    csu2Instructions,
    setCsu2Instructions,
  } = useBatteryContext();

  const [batteryCells, setBatteryCells] = useState<BatteryCell[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initializeCells = (): void => {
    const initialCells: BatteryCell[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      voltage: null,
      temperature: null,
      status: "N/A",
      setVoltage: null,
      setTemperature: null,
      balancing: false,
      openWire: false,
      voltageLimits: null,
      data: null,
    }));
    setBatteryCells(initialCells);
  };

  useEffect(() => {
    initializeCells();
  }, []);

  const updateCellVoltage = (
    cellId: number,
    data: ResponseData[],
    dcIc?: number
  ): void => {
    if (dcIc !== undefined) {
      setDcCsuResponseData(
        (prev: Record<number, Record<number, ResponseData[]>>) => ({
          ...prev,
          [dcIc]: {
            ...(prev[dcIc] || {}),
            [cellId]: data,
          },
        })
      );
    } else {
      setResponseData((prev: Record<number, ResponseData[]>) => ({
        ...prev,
        [cellId]: data,
      }));
    }
  };

  const validateInstruction = (instr: unknown): instr is SetInstruction => {
    if (!instr || typeof instr !== "object") return false;

    const requiredKeys: (keyof SetInstruction)[] = [
      "id",
      "command",
      "param1",
      "param2",
      "value",
      "cellNo",
      "cycleNo",
      "voltage",
      "temperature",
      "time",
    ];

    return requiredKeys.every(
      (key) =>
        key in instr &&
        (typeof (instr as Record<string, unknown>)[key] === "string" ||
          typeof (instr as Record<string, unknown>)[key] === "number")
    );
  };

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (!Array.isArray(json)) {
          console.error("Invalid JSON format: Expected an array");
          return;
        }

        const validInstructions: SetInstruction[] = json.filter(
          (instr): instr is SetInstruction => validateInstruction(instr)
        );
        const dcInstructions: SetInstruction[] = [];
        const csu1Instructions: SetInstruction[] = [];
        const csu2Instructions: SetInstruction[] = [];

        validInstructions.forEach((instr) => {
          const cellNo = parseInt(instr.cellNo, 10);
          if (isNaN(cellNo)) return;
          if (instr.command.includes("dc_csu")) {
            dcInstructions.push(instr);
          } else if (cellNo < 12) {
            csu1Instructions.push(instr);
          } else {
            csu2Instructions.push(instr);
          }
        });

        setInstructions(validInstructions);
        setDcCsuInstructions(dcInstructions);
        setCsu1Instructions(csu1Instructions);
        setCsu2Instructions(csu2Instructions);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
    reader.readAsText(file);
  };

  const handleClearInstructions = (): void => {
    setInstructions([]);
    setDcCsuInstructions([]);
    setCsu1Instructions([]);
    setCsu2Instructions([]);
    setResponseData({});
    setDcCsuResponseData({});
    initializeCells();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col max-w-full  ">
      <MenuBar />
      <div className="flex-1 p-2 sm:p-3 md:p-4 lg:p-6 xl:p-8  max-w-full ">
        <div className="relative w-full flex flex-row  items-start">
          <div className="w-1/6">
            <Battery />
          </div>
          {/* <div className=" relative flex-1 flex-col gap-1vh ">
            <div className="flex flex-row gap-2 ">
              <div className="w-1/3 flex flex-col">
                <CSU2 />
              </div>
              <div className="w-1/3 flex flex-col gap-1">
                <CSU1 />
              </div>
              <div className="w-1/3 flex flex-col gap-1">
                <Daicy />
              </div>
            </div>
            <div className="bg-white rounded-md shadow p-4 mt-[1.5rem] border border-cyan-100">
              <ErrorWarningPanel />
            </div>
          </div> */}

          {/* <div className="relative flex-1 flex flex-col gap-[1vh] p-2 sm:p-3">
            <div className="flex flex-col md:flex-row gap-3 md:gap-3 w-full">
              <div className="w-full md:w-1/3 flex flex-col">
                <CSU2 />
              </div>
              <div className="w-full md:w-1/3 flex flex-col">
                <CSU1 />
              </div>
              <div className="w-full md:w-1/3 flex flex-col">
                <Daicy />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-3 sm:p-4 mt-4 border border-cyan-100">
              <ErrorWarningPanel />
            </div>
          </div> */}

          <div className="relative flex-1 flex flex-col  sm:p-2 justify-center items-center">
            <div className="flex flex-col md:flex-row gap-[3%] w-full justify-center items-stretch ">
              <div className="flex-1 max-w-[95%] sm:max-w-[90%] md:max-w-[32%] lg:max-w-[30%] xl:max-w-[28%] transition-all duration-300">
                <CSU2 />
              </div>
              <div className="flex-1 max-w-[95%] sm:max-w-[90%] md:max-w-[32%] lg:max-w-[50%] xl:max-w-[28%] transition-all duration-300">
                <CSU1 />
              </div>
              <div className="flex-1 max-w-[95%] sm:max-w-[90%] md:max-w-[32%] lg:max-w-[50%] xl:max-w-[28%] transition-all duration-300">
                <Daicy />
              </div>
            </div>

            <div className="bg-white rounded-md shadow p-6 sm:p-4  mt-4 border border-cyan-100 transition-all duration-300 ml-0 md:ml-2 lg:ml-4 xl:ml-6 w-full">
              <ErrorWarningPanel />
            </div>
          </div>

          <div className="lg:max-w-[40%] relative">
            <SerialTerminal
              responseData={responseData}
              setResponseData={setResponseData}
              dcCsuResponseData={dcCsuResponseData}
              setDcCsuResponseData={setDcCsuResponseData}
              updateCellVoltage={updateCellVoltage}
            />
          </div>
        </div>
      </div>
      <input
        placeholder="Upload JSON file"
        type="file"
        accept=".json"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
};

export default DashBoard;
