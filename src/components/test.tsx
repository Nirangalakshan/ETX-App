//save with cell ids
/* eslint-disable */
/* @ts-nocheck */

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useBatteryContext } from "../BatteryContext";
import { useSerial } from "../SerialContext";


export interface ResponseData {
  command: string;
  value: string;
}

interface SerialTerminalProps {
  updateCellVoltage: (cellId: number, voltage: number) => void;
}

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

interface Instruction {
  command: string;
  cellNo?: string;
  voltage?: string;
  temperature?: string;
  value?: string;
}

const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
  1: 2.0,
  2: 2.5,
  3: 2.8,
  4: 3.0,
  5: 3.3,
  6: 3.6,
  7: 3.9,
  8: 4.2,
};

const instructionToHexMap: Record<
  string,
  {
    commandCode: string;
    functionCode: string;
    cellNoRange?: [number, number];
    valueType?: string;
    excludeFunctionCode?: boolean;
  }
> = {
  get_voltage: {
    commandCode: "04",
    functionCode: "01",
    cellNoRange: [0, 23],
    valueType: "float",
  },
  get_temp: {
    commandCode: "04",
    functionCode: "02",
    cellNoRange: [0, 5],
    valueType: "temp",
  },
  get_current: {
    commandCode: "04",
    functionCode: "03",
    cellNoRange: [0, 23],
    valueType: "current",
  },
  get_temperature_res: {
    commandCode: "04",
    functionCode: "04",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_dc_csu_volt: {
    commandCode: "04",
    functionCode: "05",
    cellNoRange: [0, 23],
    valueType: "dc_csu_voltage",
  },
  get_dc_csu_temp: {
    commandCode: "04",
    functionCode: "06",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_dc_csu_balance: {
    commandCode: "04",
    functionCode: "07",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_dc_csu_ow: {
    commandCode: "04",
    functionCode: "08",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_11_csu_volt: {
    commandCode: "04",
    functionCode: "09",
    cellNoRange: [0, 24],
    valueType: "11_csu_voltage",
  },
  get_11_csu_temp: {
    commandCode: "04",
    functionCode: "0A",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_11_csu_balance: {
    commandCode: "04",
    functionCode: "0B",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_11_csu_ow: {
    commandCode: "04",
    functionCode: "0C",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  get_12_csu_volt: {
    commandCode: "04",
    functionCode: "0D",
    cellNoRange: [0, 24],
    valueType: "12_csu_voltage",
  },
  get_12_csu_temp: {
    commandCode: "04",
    functionCode: "0E",
    cellNoRange: [0, 5],
    valueType: "int",
  },
  get_12_csu_balance: {
    commandCode: "04",
    functionCode: "0F",
    cellNoRange: [0, 22],
    valueType: "binary",
  },
  get_12_csu_ow: {
    commandCode: "04",
    functionCode: "10",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  set_voltage: {
    commandCode: "03",
    functionCode: "01",
    cellNoRange: [0, 23],
    valueType: "float",
  },
  set_temp: {
    commandCode: "03",
    functionCode: "02",
    cellNoRange: [0, 5],
    valueType: "temp",
  },
  set_balance: {
    commandCode: "03",
    functionCode: "03",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  set_ow: {
    commandCode: "03",
    functionCode: "04",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  daisy_chain: {
    commandCode: "03",
    functionCode: "05",
    cellNoRange: [0, 23],
    valueType: "binary",
  },
  set_delay: {
    commandCode: "03",
    functionCode: "06",
    cellNoRange: [0, 23],
    valueType: "int",
  },
  set_cell_led: { commandCode: "03", functionCode: "07", valueType: "binary" },
  set_automatic_sequence: {
    commandCode: "03",
    functionCode: "08",
    valueType: "binary",
  },
  get_voltage_limits: {
    commandCode: "A6",
    functionCode: "00",
    cellNoRange: [0, 24],
    valueType: "voltage_limits",
  },
};

const calculateCRC16 = (data: number[]): number => {
  let crc = 0xffff;
  const polynomial = 0xa001;

  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      const lsb = crc & 0x0001;
      crc >>= 1;
      if (lsb) crc ^= polynomial;
    }
  }
  return crc;
};

const extractIndividualCellVoltageData = (
  hexArray: number[]
): { id: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const cellNo = hexArray[2];
  const valueBytes = hexArray.slice(3, 5);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 10000;
  return { id, cellNo, value: floatValue.toFixed(3) };
};

const extractDCVoltageData = (
  hexArray: number[]
): { id: number; dcIc: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, dcIc: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const dcIc = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 10000;
  return { id, dcIc, cellNo, value: floatValue.toFixed(3) };
};

const extractCurrent = (
  hexArray: number[]
): { id: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const cellNo = hexArray[2];
  const valueBytes = hexArray.slice(3, 5);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 10000;
  return { id, cellNo, value: floatValue.toFixed(3) };
};

const extract11CSUVoltageData = (
  hexArray: number[]
): { id: number; id11: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, id11: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const id11 = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 10000;
  return { id, id11, cellNo, value: floatValue.toFixed(3) };
};

const extract12CSUVoltageData = (
  hexArray: number[]
): { id: number; id12: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, id12: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const id12 = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 10000;
  return { id, id12, cellNo, value: floatValue.toFixed(3) };
};

const extractTemperature = (
  hexArray: number[]
): { id: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const cellNo = hexArray[2];
  const valueBytes = hexArray.slice(3, 5);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 1000;
  return { id, cellNo, value: floatValue.toFixed(3) + " °C" };
};

const extractDCTemperature = (
  hexArray: number[]
): { id: number; dcIc: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, dcIc: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const dcIc = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 1000;
  return { id, dcIc, cellNo, value: floatValue.toFixed(3) + " °C" };
};

const extract11CSUTemperature = (
  hexArray: number[]
): { id: number; id11: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, id11: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const id11 = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 1000;
  return { id, id11, cellNo, value: floatValue.toFixed(3) + " °C" };
};

const extract12CSUTemperature = (
  hexArray: number[]
): { id: number; id12: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, id12: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const id12 = hexArray[2];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 1000;
  return { id, id12, cellNo, value: floatValue.toFixed(3) + " °C" };
};

const extractDaisyChainData = (
  hexArray: number[]
): { id: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const cellNo = hexArray[2];
  const value = hexArray[3] === 1 ? "On" : "Off";
  return { id, cellNo, value };
};

const parseNonVoltageValue = (
  hexArray: number[],
  command: string
): string | null => {
  if (hexArray.length < 8) return null;
  if (command === "set_temp" || command === "temp_response") {
    const valueBytes = hexArray.slice(3, 5);
    const valueInt = (valueBytes[0] << 8) | valueBytes[1];
    const floatValue = valueInt / 1000;
    return floatValue.toFixed(3) + " °C";
  } else if (command === "set_voltage" || command === "get_current") {
    const valueBytes = hexArray.slice(3, 5);
    const valueInt = (valueBytes[0] << 8) | valueBytes[1];
    const floatValue = valueInt / 10000;
    return floatValue.toFixed(3);
  } else if (
    command === "get_temperature_res" ||
    command === "get_dc_csu_balance" ||
    command === "get_dc_csu_ow" ||
    command === "get_11_csu_balance" ||
    command === "get_11_csu_ow" ||
    command === "get_12_csu_balance" ||
    command === "get_12_csu_ow" ||
    command === "set_ow" ||
    command === "daisy_chain" ||
    command === "set_cell_led" ||
    command === "set_balance" ||
    command === "set_automatic_sequence"
  ) {
    return hexArray[3] === 1 ? "On" : "Off";
  } else if (command === "get_voltage_limits") {
    const valueBytes = hexArray.slice(2, 4);
    const maxVoltage = ((valueBytes[0] << 8) | valueBytes[1]) / 10000;
    return maxVoltage.toFixed(4) + " V";
  } else if (command === "set_delay") {
    return hexArray[4].toString() + " ms";
  }
  return null;
};

const parseSentSetCommand = (
  hexArray: number[],
  timestamp: string
): string | null => {
  if (hexArray.length < 8 || hexArray[1] !== 0x03) return null;

  const [, , functionCode, cellNo] = hexArray;
  const commandEntry = Object.entries(instructionToHexMap).find(
    ([, { commandCode: cc, functionCode: fc }]) =>
      parseInt(cc, 16) === 0x03 && parseInt(fc, 16) === functionCode
  );

  if (!commandEntry) {
    console.warn(
      `SerialTerminal: Unknown set command (functionCode: ${functionCode.toString(
        16
      )})`
    );
    return null;
  }

  const command = commandEntry[0];
  const { cellNoRange } = commandEntry[1];

  if (cellNoRange && (cellNo < cellNoRange[0] || cellNo > cellNoRange[1])) {
    console.warn(
      `SerialTerminal: Invalid cellNo ${cellNo} for command ${command}`
    );
    return null;
  }

  let parsedValue: string | null = null;
  if (command === "set_voltage") {
    const value = (hexArray[4] << 8) | hexArray[5];
    parsedValue = (value / 10000).toFixed(3);
  } else if (command === "set_temp") {
    const value = (hexArray[4] << 8) | hexArray[5];
    parsedValue = (value / 1000).toFixed(3) + " °C";
  } else if (
    command === "set_ow" ||
    command === "daisy_chain" ||
    command === "set_cell_led" ||
    command === "set_balance" ||
    command === "set_automatic_sequence"
  ) {
    parsedValue = hexArray[4] === 1 ? "On" : "Off";
  } else if (command === "set_delay") {
    parsedValue = hexArray[4].toString() + " ms";
  }

  if (parsedValue === null) {
    console.warn(
      `SerialTerminal: Failed to parse value for set command ${command}`
    );
    return null;
  }

  return `[${timestamp}] Sent HEX: ${hexArray
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(
      " "
    )} → Command: ${command}, Cell ID: ${cellNo}, Value: ${parsedValue}`;
};

const logHexCommand = (
  type: "Sent" | "Received",
  hexArray: number[],
  timestamp: string,
  command: string,
  cellNo: number,
  parsedValue: string | null,
  setReceived: React.Dispatch<
    React.SetStateAction<{
      Individual: string[];
      CSU11: string[];
      CSU12: string[];
      DCCSU: string[];
      DaisyChain: string[];
    }>
  >,
  error?: string
) => {
  const hexString = hexArray
    .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
    .join(" ");
  let logLine: string;

  if (error) {
    logLine = `[${timestamp}] ${type} HEX: ${hexString} → ${error}`;
  } else if (parsedValue === null) {
    logLine = `[${timestamp}] ${type} HEX: ${hexString} → Failed to parse value for ${command}`;
  } else {
    logLine = `[${timestamp}] ${type} HEX: ${hexString} → Cell ID: ${cellNo}, Command: ${command}, Value: ${parsedValue}`;
  }

  setReceived((prev) => {
    let category: keyof typeof prev = "Individual";
    if (typeof command === "string") {
      if (command.includes("_11_csu_")) {
        category = "CSU11";
      } else if (command.includes("_12_csu_")) {
        category = "CSU12";
      } else if (command.includes("_dc_csu_")) {
        category = "DCCSU";
      } else if (command === "daisy_chain") {
        category = "DaisyChain";
      }
    }

    const newReceived = {
      ...prev,
      [category]: [...prev[category], logLine],
    };
    console.log(
      `SerialTerminal: Updated received state (${type}, ${category}):`,
      newReceived[category]
    );
    return newReceived;
  });
};

const SerialTerminal: React.FC<SerialTerminalProps> = ({ updateCellVoltage }) => {
  const {
    responseData,
    setResponseData,
    dcCsuResponseData,
    setDcCsuResponseData,
    csu1ResponseData,
    setCsu1ResponseData,
    csu2ResponseData,
    setCsu2ResponseData,
    daisyChainData,
    setDaisyChainData,
    setInstructions,
    cellData: contextCellData,
    setCellData,
    criticalState,
    csu1Statuses,
    csu2Statuses,
    daisyStatuses,
    testerVoltages,
    csu1TesterVoltages,
    csu2TesterVoltages,
  } = useBatteryContext();

  const {
    baudRate,
    availablePorts,
    connectedPorts,
    selectedPort,
    setBaudRate,
    setSelectedPort,
    refreshPorts,
    initializePort,
    closePort,
  } = useSerial();

  const [received, setReceived] = useState<{
    Individual: string[];
    CSU11: string[];
    CSU12: string[];
    DCCSU: string[];
    DaisyChain: string[];
  }>({
    Individual: [],
    CSU11: [],
    CSU12: [],
    DCCSU: [],
    DaisyChain: [],
  });
  const [isRunning, setIsRunning] = useState(false);
  const [cycleCount, setCycleCount] = useState(1);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [fileName, setFileName] = useState<string>("");
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSentCommand, setLastSentCommand] = useState<{
    command: string;
    cellNo?: number;
  } | null>(null);
  const [cycleData, setCycleData] = useState<Record<string, any>[]>([]);
  const [showCriticalErrorPopup, setShowCriticalErrorPopup] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveInterval, setAutoSaveInterval] = useState(30); // seconds
  const [testName, setTestName] = useState<string>(""); // New state for test name
  const [currentDataFile, setCurrentDataFile] = useState<string>(''); // Updated to use testName

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const setReceivedRef = useRef(setReceived);
  const lastSentCommandRef = useRef(lastSentCommand);
  const cellDataRef = useRef(contextCellData);
  const isRunningRef = useRef(isRunning);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    if (criticalState && isRunning) {
      handleStopTest();
      setError("Test stopped due to critical cell status");
      setShowCriticalErrorPopup(true);
    }
  }, [criticalState, isRunning]);

  useEffect(() => {
    cellDataRef.current = contextCellData;
    setCellData(contextCellData);
  }, [contextCellData, setCellData]);

  useEffect(() => {
    lastSentCommandRef.current = lastSentCommand;
  }, [lastSentCommand]);

  useEffect(() => {
    setReceivedRef.current = setReceived;
  }, [setReceived]);

  useEffect(() => {
    localStorage.setItem("serialBaudRate", baudRate.toString());
  }, [baudRate]);

  useEffect(() => {
    if (!window.serialAPI) {
      setError(
        "Serial API not available. Ensure the app is running in a supported environment."
      );
    }
  }, []);

  useEffect(() => {
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, []);

  const updateCellStatesFile = async (
    cycleNo: number,
    type: 'csu11' | 'csu12' | 'dccsu' | 'individual',
    cellNo: number,
    setVoltage: number | null,
    testerVoltage: number | null,
    actualVoltage: number | null
  ) => {
    try {
      if (!window.fileAPI?.updateCellStatesFile) {
        console.error('File API not available for cell states file');
        setError('File API not available');
        return { success: false, error: 'File API not available' };
      }

      // Ensure cycleNo is positive; default to 1 if invalid
      const validCycleNo = cycleNo > 0 ? cycleNo : 1;

      // Validate inputs
      if (isNaN(cellNo) || cellNo < 0 || cellNo > 23) {
        console.error(`Invalid cellNo: ${cellNo} for type ${type}`);
        setError(`Invalid cellNo: ${cellNo}`);
        return { success: false, error: `Invalid cellNo: ${cellNo}` };
      }
      if (actualVoltage === null || isNaN(actualVoltage)) {
        console.warn(`Skipping file update: Invalid actualVoltage for cell ${cellNo}, type ${type}`);
        return { success: false, error: `Invalid actualVoltage: ${actualVoltage}` };
      }

      // Sanitize testName to create a valid filename
      const sanitizedTestName = testName.trim().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() || `test_${new Date().toISOString().replace(/[:.]/g, '-')}`;
      const cycleData = {
        cycleNo: validCycleNo,
        type,
        cellNo,
        setVoltage: setVoltage ?? 0,
        testerVoltage: testerVoltage ?? 0,
        actualVoltage: actualVoltage ?? 0,
        testId: sanitizedTestName, // Include testId
      };

      console.log(`Appending to cell_states_${sanitizedTestName}.json:`, cycleData);

      const result = await window.fileAPI.updateCellStatesFile(cycleData, `cell_states_${sanitizedTestName}.json`);

      if (result.success) {
        console.log(`Successfully appended cycle ${validCycleNo}, type ${type}, cell ${cellNo} to cell_states_${sanitizedTestName}.json`);
        setReceived((prev) => ({
          ...prev,
          Individual: [
            ...prev.Individual,
            `[${new Date().toLocaleTimeString()}] 💾 Appended cycle ${validCycleNo} (${type}, cell ${cellNo}) to cell_states_${sanitizedTestName}.json`,
          ],
        }));
        setCurrentDataFile(`cell_states_${sanitizedTestName}.json`);
      } else {
        console.error(`Failed to append cycle data: ${result.error}`);
        setError(`Failed to append cycle data: ${result.error}`);
      }

      return result;
    } catch (error: any) {
      console.error('Error appending to cell states file:', error);
      setError(`Error appending to cell states file: ${error.message}`);
      return { success: false, error: error.message };
    }
  };

  const startAutoSave = () => {
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }

    autoSaveIntervalRef.current = setInterval(async () => {
      if (!isRunningRef.current || currentCycle === 0) {
        console.log('Auto-save skipped: Test not running or cycle is 0');
        return;
      }

      const currentCellData = cellDataRef.current;
      for (const cell of currentCellData) {
        const cellNo = cell.id;
        const individualVoltage = cell.voltage; // Use individual actual voltage
        if (cell.csu11Voltage !== null) {
          await updateCellStatesFile(
            currentCycle,
            'csu11',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.csu11Voltage
          );
        }
        if (cell.csu12Voltage !== null) {
          await updateCellStatesFile(
            currentCycle,
            'csu12',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.csu12Voltage
          );
        }
        if (cell.dcCsuVoltage !== null) {
          await updateCellStatesFile(
            currentCycle,
            'dccsu',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.dcCsuVoltage
          );
        }
        if (cell.voltage !== null) {
          await updateCellStatesFile(
            currentCycle,
            'individual',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.voltage
          );
        }
      }
      console.log('Auto-save completed');
    }, autoSaveInterval * 1000);

    setAutoSaveEnabled(true);
  };

  const handleSaveAllData = async () => {
    try {
      const currentCellData = cellDataRef.current;
      for (const cell of currentCellData) {
        const cellNo = cell.id;
        const individualVoltage = cell.voltage; // Use individual actual voltage
        if (cell.csu11Voltage !== null) {
          await updateCellStatesFile(
            currentCycle || 1,
            'csu11',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.csu11Voltage
          );
        }
        if (cell.csu12Voltage !== null) {
          await updateCellStatesFile(
            currentCycle || 1,
            'csu12',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.csu12Voltage
          );
        }
        if (cell.dcCsuVoltage !== null) {
          await updateCellStatesFile(
            currentCycle || 1,
            'dccsu',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.dcCsuVoltage
          );
        }
        if (cell.voltage !== null) {
          await updateCellStatesFile(
            currentCycle || 1,
            'individual',
            cellNo,
            cell.setVoltage,
            individualVoltage ?? 0,
            cell.voltage
          );
        }
      }
      setReceived((prev) => ({
        ...prev,
        Individual: [
          ...prev.Individual,
          `[${new Date().toLocaleTimeString()}] 💾 All cell states appended to ${currentDataFile}`,
        ],
      }));
    } catch (error: any) {
      console.error('Error saving all data:', error);
      setError(`Failed to append all data: ${error.message}`);
    }
  };

  const handleResetDataFile = async () => {
    try {
      if (!window.fileAPI?.resetCellStates) {
        console.error('File API not available for resetting cell states');
        setError('File API not available');
        return;
      }
      const sanitizedTestName = testName.trim().replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase() || `test_${new Date().toISOString().replace(/[:.]/g, '-')}`;
      const result = await window.fileAPI.resetCellStates(`cell_states_${sanitizedTestName}.json`);
      if (result.success) {
        console.log(`Successfully reset cell_states_${sanitizedTestName}.json`);
        setReceived((prev) => ({
          ...prev,
          Individual: [
            ...prev.Individual,
            `[${new Date().toLocaleTimeString()}] 🔄 Cell states file reset: cell_states_${sanitizedTestName}.json`,
          ],
        }));
        setCurrentDataFile(`cell_states_${sanitizedTestName}.json`);
      } else {
        console.error(`Failed to reset cell states file: ${result.error}`);
        setError(`Failed to reset cell states file: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Error resetting cell states file:', error);
      setError(`Error resetting cell states file: ${error.message}`);
    }
  };

useEffect(() => {
  if (!window.serialAPI?.onSerialData) {
    console.warn("SerialTerminal: serialAPI.onSerialData not available");
    return;
  }

  const handleCellStateUpdate = async (
    cycleNo: number,
    type: 'csu11' | 'csu12' | 'dccsu' | 'individual',
    cellNo: number,
    setVoltage: number | null,
    testerVoltage: number | null,
    actualVoltage: number
  ) => {
    console.log(`handleCellStateUpdate called: cycleNo=${cycleNo}, type=${type}, cellNo=${cellNo}, setVoltage=${setVoltage}, testerVoltage=${testerVoltage}, actualVoltage=${actualVoltage}`);
    // For csu11 type and cellNo 0–11, use setVoltage from cellNo + 12
    const mappedCellNo = type === 'csu11' && cellNo >= 0 && cellNo <= 11 ? (cellNo + 12 <= 23 ? cellNo + 12 : 23) : cellNo;
    const mappedCell = cellDataRef.current[mappedCellNo];
    const setVoltageForCsu11 = type === 'csu11' && cellNo >= 0 && cellNo <= 11 ? (mappedCell?.setVoltage ?? setVoltage ?? 0) : setVoltage;
    const result = await updateCellStatesFile(cycleNo, type, cellNo, setVoltageForCsu11, testerVoltage, actualVoltage);
    if (!result.success) {
      console.error(`handleCellStateUpdate failed: ${result.error}`);
    }
  };

  const handler = (data: { hex: string; parsed: string | null }) => {
    console.log("SerialTerminal: Received serial data:", data);
    const timestamp = new Date().toLocaleTimeString();
    const hexArray = data.hex.split(" ").map((hex) => parseInt(hex, 16));

    if (hexArray.length !== 8 || hexArray[0] !== 0x07) {
      console.warn("SerialTerminal: Invalid hex data format:", data.hex);
      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        "unknown",
        0,
        null,
        setReceivedRef.current,
        "Invalid HEX format"
      );
      return;
    }

    const receivedCRC = (hexArray[7] << 8) | hexArray[6];
    const calculatedCRC = calculateCRC16(hexArray.slice(0, 6));
    if (receivedCRC !== calculatedCRC) {
      console.warn("SerialTerminal: CRC mismatch:", data.hex);
      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        "unknown",
        0,
        null,
        setReceivedRef.current,
        "CRC mismatch"
      );
      return;
    }

    const commandCode = hexArray[1];
    const functionCode = hexArray[2];

    let command: string | undefined;

    if (
      lastSentCommandRef.current?.command &&
      typeof lastSentCommandRef.current.command === "string" &&
      instructionToHexMap[lastSentCommandRef.current.command]
    ) {
      command = lastSentCommandRef.current.command;
      console.log(`SerialTerminal: Using lastSentCommand: ${command}`);
    } else {
      command = Object.entries(instructionToHexMap).find(
        ([, { commandCode: cc, functionCode: fc }]) =>
          parseInt(cc, 16) === commandCode &&
          parseInt(fc, 16) === functionCode
      )?.[0];
    }

    if (!command || typeof command !== "string") {
      console.warn(
        `SerialTerminal: Invalid or undefined command for commandCode: 0x${commandCode.toString(
          16
        )}, functionCode: 0x${functionCode.toString(16)}, lastSentCommand:`,
        lastSentCommandRef.current
      );
      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        "unknown",
        0,
        null,
        setReceivedRef.current,
        `Invalid or undefined command for commandCode: 0x${commandCode.toString(
          16
        )}, functionCode: 0x${functionCode.toString(16)}`
      );
      return;
    }

    console.log(`SerialTerminal: Processing command: ${command}`);

    const { cellNoRange, valueType } = instructionToHexMap[command];

    let cellNo: number = 0;
    let parsedValue: string | null = null;

    if (valueType === "float") {
      const result = extractIndividualCellVoltageData(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "dc_csu_voltage") {
      const result = extractDCVoltageData(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "11_csu_voltage") {
      const result = extract11CSUVoltageData(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "12_csu_voltage") {
      const result = extract12CSUVoltageData(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "temp") {
      const result = extractTemperature(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "current") {
      const result = extractCurrent(hexArray);
      cellNo = result.cellNo;
      parsedValue = result.value;
    } else if (valueType === "int") {
      if (command.includes("_11_csu_")) {
        const result = extract11CSUTemperature(hexArray);
        cellNo = result.cellNo;
        parsedValue = result.value;
      } else if (command.includes("_12_csu_")) {
        const result = extract12CSUTemperature(hexArray);
        cellNo = result.cellNo;
        parsedValue = result.value;
      } else if (command.includes("_dc_csu_")) {
        const result = extractDCTemperature(hexArray);
        cellNo = result.cellNo;
        parsedValue = result.value;
      } else {
        cellNo = hexArray[2];
        parsedValue = parseNonVoltageValue(hexArray, command);
      }
    } else if (valueType === "binary") {
      if (command.includes("_11_csu_")) {
        cellNo = hexArray[3];
        parsedValue = hexArray[4] === 1 ? "On" : "Off";
      } else if (command.includes("_12_csu_")) {
        cellNo = hexArray[3];
        parsedValue = hexArray[4] === 1 ? "On" : "Off";
      } else if (command.includes("_dc_csu_")) {
        cellNo = hexArray[3];
        parsedValue = hexArray[4] === 1 ? "On" : "Off";
      } else if (command === "daisy_chain") {
        const result = extractDaisyChainData(hexArray);
        cellNo = result.cellNo;
        parsedValue = result.value;
      } else {
        cellNo = hexArray[2];
        parsedValue = parseNonVoltageValue(hexArray, command);
      }
    } else if (valueType === "voltage_limits") {
      cellNo = hexArray[2];
      parsedValue = parseNonVoltageValue(hexArray, command);
    } else {
      cellNo = hexArray[2];
      parsedValue = parseNonVoltageValue(hexArray, command);
    }

    if (parsedValue === null) {
      console.warn(
        `SerialTerminal: Failed to parse value for command ${command}, hex: ${data.hex}`
      );
      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        "unknown",
        cellNo,
        null,
        setReceivedRef.current,
        `Failed to parse value for command ${command}`
      );
      return;
    }

    if (
      cellNoRange &&
      (isNaN(cellNo) || cellNo < cellNoRange[0] || cellNo > cellNoRange[1])
    ) {
      console.warn(
        `SerialTerminal: Invalid cellNo ${cellNo} for command ${command}`
      );
      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        "unknown",
        cellNo,
        parsedValue,
        setReceivedRef.current,
        `Invalid cellNo ${cellNo} for command ${command}`
      );
      return;
    }

    console.log(
      `SerialTerminal: Parsed cellNo: ${cellNo}, value: ${parsedValue} for command ${command}`
    );

    logHexCommand(
      "Received",
      hexArray,
      timestamp,
      command,
      cellNo,
      parsedValue,
      setReceivedRef.current
    );

    if (!isNaN(cellNo) && cellNo >= 0 && cellNo <= 23) {
      setCellData((prev) => {
        const newCellData = prev.map((cell) =>
          cell.id === cellNo
            ? {
                ...cell,
                voltage:
                  command === "get_voltage" && parsedValue
                    ? parseFloat(parsedValue)
                    : cell.voltage,
                setVoltage:
                  command === "set_voltage" && parsedValue
                    ? parseFloat(parsedValue)
                    : cell.setVoltage,
                expectedVoltage:
                  command === "set_voltage" && parsedValue
                    ? EXPECTED_SENT_VOLTAGES[parseInt(parsedValue)] || cell.expectedVoltage
                    : cell.expectedVoltage,
                temperature:
                  command === "get_temp" && parsedValue
                    ? parseFloat(parsedValue.replace(" °C", ""))
                    : cell.temperature,
                voltageLimits:
                  command === "get_voltage_limits"
                    ? parsedValue
                    : cell.voltageLimits,
                csu11Voltage:
                  command === "get_11_csu_volt" && parsedValue
                    ? parseFloat(parsedValue)
                    : cell.csu11Voltage,
                csu11Temperature:
                  command === "get_11_csu_temp" && parsedValue
                    ? parseFloat(parsedValue.replace(" °C", ""))
                    : cell.csu11Temperature,
                csu11Balance:
                  command === "get_11_csu_balance"
                    ? parsedValue === "On"
                    : cell.csu11Balance,
                csu11OpenWire:
                  command === "get_11_csu_ow"
                    ? parsedValue === "On"
                    : cell.csu11OpenWire,
                csu12Voltage:
                  command === "get_12_csu_volt" && parsedValue
                    ? parseFloat(parsedValue)
                    : cell.csu12Voltage,
                csu12Temperature:
                  command === "get_12_csu_temp" && parsedValue
                    ? parseFloat(parsedValue.replace(" °C", ""))
                    : cell.csu12Temperature,
                csu12Balance:
                  command === "get_12_csu_balance"
                    ? parsedValue === "On"
                    : cell.csu12Balance,
                csu12OpenWire:
                  command === "get_12_csu_ow"
                    ? parsedValue === "On"
                    : cell.csu12OpenWire,
                dcCsuVoltage:
                  command === "get_dc_csu_volt" && parsedValue
                    ? parseFloat(parsedValue)
                    : cell.dcCsuVoltage,
                dcCsuTemperature:
                  command === "get_dc_csu_temp" && parsedValue
                    ? parseFloat(parsedValue.replace(" °C", ""))
                    : cell.dcCsuTemperature,
                dcCsuBalance:
                  command === "get_dc_csu_balance"
                    ? parsedValue === "On"
                    : cell.dcCsuBalance,
                dcCsuOpenWire:
                  command === "get_dc_csu_ow"
                    ? parsedValue === "On"
                    : cell.dcCsuOpenWire,
                daisyChain:
                  command === "daisy_chain" ? parsedValue : cell.daisyChain,
              }
            : cell
        );
        console.log(
          `SerialTerminal: Updated cellData for Cell ID ${cellNo}, command ${command}:`,
          newCellData[cellNo]
        );
        return newCellData;
      });

      if (["get_11_csu_volt", "get_12_csu_volt", "get_dc_csu_volt", "get_voltage"].includes(command)) {
        const type = command === "get_11_csu_volt" ? "csu11" :
                     command === "get_12_csu_volt" ? "csu12" :
                     command === "get_dc_csu_volt" ? "dccsu" : "individual";
        const actualVoltage = parseFloat(parsedValue);
        if (!isNaN(actualVoltage)) {
          const cell = cellDataRef.current[cellNo];
          const individualVoltage = cell.voltage; // Use individual actual voltage
          console.log(`Triggering cell state update for ${type}, cell ${cellNo}, voltage ${actualVoltage}, testerVoltage ${individualVoltage}`);
          handleCellStateUpdate(
            currentCycle || 1,
            type,
            cellNo,
            cell?.setVoltage,
            individualVoltage ?? 0,
            actualVoltage
          );
        } else {
          console.warn(`Invalid actualVoltage for ${type}, cell ${cellNo}: ${parsedValue}`);
        }
      }
    }

    if (
      [
        "get_voltage",
        "get_dc_csu_volt",
        "get_11_csu_volt",
        "get_12_csu_volt",
        "set_voltage",
      ].includes(command)
    ) {
      const voltageValue = parseFloat(parsedValue);
      if (!isNaN(cellNo) && !isNaN(voltageValue)) {
        console.log(
          `SerialTerminal: Updating cell ${cellNo} with voltage ${voltageValue}`
        );
        updateCellVoltage(cellNo, voltageValue);
      }
    }

    const newResponseEntry: ResponseData = { command, value: parsedValue };

    console.log(`SerialTerminal: Categorizing command: ${command}`);
    if (command.includes("_11_csu_")) {
      setCsu1ResponseData((prevData) => {
        const existingDataForCell = Array.isArray(prevData[cellNo])
          ? prevData[cellNo]
          : [];
        const newData = {
          ...prevData,
          [cellNo]: [...existingDataForCell, newResponseEntry],
        };
        console.log(
          `SerialTerminal: Updated csu1ResponseData for Cell ID ${cellNo}, command ${command}:`,
          newData
        );
        return newData;
      });
    } else if (command.includes("_12_csu_")) {
      setCsu2ResponseData((prevData) => {
        const existingDataForCell = Array.isArray(prevData[cellNo])
          ? prevData[cellNo]
          : [];
        const newData = {
          ...prevData,
          [cellNo]: [...existingDataForCell, newResponseEntry],
        };
        console.log(
          `SerialTerminal: Updated csu2ResponseData for Cell ID ${cellNo}, command ${command}:`,
          newData
        );
        return newData;
      });
    } else if (command === "daisy_chain") {
      setDaisyChainData((prevData) => {
        const existingDataForCell = Array.isArray(prevData[cellNo])
          ? prevData[cellNo]
          : [];
        const newData = {
          ...prevData,
          [cellNo]: [...existingDataForCell, newResponseEntry],
        };
        console.log(
          `SerialTerminal: Updated daisyChainData for Cell ID ${cellNo}, command ${command}:`,
          newData
        );
        return newData;
      });
    } else if (command.includes("_dc_csu_")) {
      const dcIc = hexArray[2];
      setDcCsuResponseData((prevData) => {
        const existingDataForDcIc = prevData[dcIc] || {};
        const existingDataForCell = Array.isArray(existingDataForDcIc[cellNo])
          ? existingDataForDcIc[cellNo]
          : [];
        const newDataForCell = [...existingDataForCell, newResponseEntry];
        const newData = {
          ...prevData,
          [dcIc]: {
            ...existingDataForDcIc,
            [cellNo]: newDataForCell,
          },
        };
        console.log(
          `SerialTerminal: Updated dcCsuResponseData for IC ${dcIc}, Cell ID ${cellNo}, command ${command}:`,
          newData
        );
        return newData;
      });
    } else {
      setResponseData((prevData) => {
        const existingDataForCell = Array.isArray(prevData[cellNo])
          ? prevData[cellNo]
          : [];
        const newData = {
          ...prevData,
          [cellNo]: [...existingDataForCell, newResponseEntry],
        };
        console.log(
          `SerialTerminal: Updated responseData for Cell ID ${cellNo}, command ${command}:`,
          newData
        );
        return newData;
      });
    }
  };

  window.serialAPI.onSerialData(handler);

  const errorHandler = (error: string) => {
    setError(error);
    setReceived((prev) => ({
      ...prev,
      Individual: [
        ...prev.Individual,
        `[${new Date().toLocaleTimeString()}] Error: ${error}`,
      ],
    }));
  };
  window.serialAPI.onSerialError?.(errorHandler);

  return () => {
    window.serialAPI.removeSerialDataListener?.();
    window.serialAPI.removeSerialErrorListener?.();
  };
}, [currentCycle, setCsu1ResponseData, setCsu2ResponseData, setDaisyChainData, setDcCsuResponseData, setResponseData, updateCellVoltage]);

  const handleOpen = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await initializePort(selectedPort);
      console.log(
        `SerialTerminal: Opening port ${selectedPort} at baud rate ${baudRate}`
      );
    } catch (err: any) {
      setError("Failed to open port: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await closePort(selectedPort);
      console.log("SerialTerminal: Port closed successfully");
    } catch (err: any) {
      setError("Failed to close port: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected.");
      return;
    }

    setFileName(file.name);
    setHexLines([]);
    setError(null);

    try {
      const text = await file.text();
      let json: Instruction[];
      try {
        json = JSON.parse(text);
      } catch (parseErr: any) {
        setError(`Failed to parse JSON: ${parseErr.message}`);
        return;
      }

      if (!Array.isArray(json)) {
        setError("JSON must be an array of instruction objects.");
        return;
      }

      setInstructions(json);
      console.log(
        "✅ Uploaded instructions:",
        json.map((i) => i.command)
      );

      const newCellData = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        voltage: null,
        temperature: null,
        setVoltage: null,
        expectedVoltage: null,
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
      }));

      const allHex: string[] = [];
      const errors: string[] = [];

      for (const [index, entry] of json.entries()) {
        if (!entry || typeof entry !== "object") {
          errors.push(`Invalid instruction at index ${index}: Not an object`);
          continue;
        }

        let command = (entry.command || "").toLowerCase();
        if (command === "get_temperature") {
          command = "get_temp";
        }

        if (!command || !instructionToHexMap[command]) {
          errors.push(
            `Invalid or unmapped command at index ${index}: ${
              entry.command || "undefined"
            }`
          );
          continue;
        }

        const { commandCode, functionCode, cellNoRange, excludeFunctionCode } =
          instructionToHexMap[command];
        const frame: number[] = [0x07, parseInt(commandCode, 16)];

        if (!excludeFunctionCode) {
          frame.push(parseInt(functionCode, 16));
        }

        let cellNo: number | undefined;
        if (cellNoRange) {
          cellNo = parseInt(entry.cellNo, 10);
          if (
            isNaN(cellNo) ||
            cellNo < cellNoRange[0] ||
            cellNo > cellNoRange[1]
          ) {
            errors.push(
              `Invalid cellNo for ${command} at index ${index}: ${
                entry.cellNo || "undefined"
              }`
            );
            continue;
          }
          frame.push(cellNo);
        } else {
          frame.push(0);
        }

        const totalFrameLength = excludeFunctionCode ? 6 : 7;
        while (frame.length < totalFrameLength) {
          frame.push(0);
        }

        if (commandCode === "03") {
          if (command === "set_voltage") {
            const value = parseInt(entry.voltage, 10);
            if (isNaN(value) || value < 0 || value > 255) {
              errors.push(
                `Invalid voltage for ${command} at index ${index}: ${
                  entry.voltage ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (frame.length > 5) {
              frame.fill(0, 5, totalFrameLength);
            }
            if (cellNo !== undefined && cellNo >= 0 && cellNo <= 23) {
              newCellData[cellNo].setVoltage = value;
              newCellData[cellNo].expectedVoltage = EXPECTED_SENT_VOLTAGES[value] || null;
              newCellData[cellNo].voltage = null;
            }
          } else if (command === "set_temp") {
            const value = parseFloat(entry.temperature);
            const scaledValue = Math.round(value * 1000);
            if (isNaN(value) || scaledValue < -20000 || scaledValue > 100000) {
              errors.push(
                `Invalid temperature for ${command} at index ${index}: ${
                  entry.temperature ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = (scaledValue >> 8) & 0xff;
            frame[5] = scaledValue & 0xff;
            if (cellNo !== undefined && cellNo >= 0 && cellNo <= 23) {
              newCellData[cellNo].setTemperature = value;
            }
          } else if (
            command === "set_ow" ||
            command === "daisy_chain" ||
            command === "set_balance" ||
            command === "set_cell_led" ||
            command === "set_automatic_sequence"
          ) {
            const value =
              entry.value !== undefined ? parseInt(entry.value, 10) : 1;
            if (value !== 0 && value !== 1) {
              errors.push(
                `Invalid binary value for ${command} at index ${index}: ${
                  entry.value ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (cellNo !== undefined && cellNo >= 0 && cellNo <= 23) {
              if (command === "set_balance") {
                newCellData[cellNo].balancing = value === 1;
              } else if (command === "set_ow") {
                newCellData[cellNo].openWire = value === 1;
              } else if (command === "set_cell_led") {
                newCellData[cellNo].cellLed = value === 1;
              } else if (command === "set_automatic_sequence") {
                newCellData[cellNo].automaticSequence = value === 1;
              } else if (command === "daisy_chain") {
                newCellData[cellNo].daisyChain = value === 1 ? "On" : "Off";
              }
            }
          } else if (command === "set_delay") {
            const value =
              entry.value !== undefined ? parseInt(entry.value, 10) : 0;
            if (isNaN(value) || value < 0 || value > 255) {
              errors.push(
                `Invalid delay value for ${command} at index ${index}: ${
                  entry.value ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (cellNo !== undefined && cellNo >= 0 && cellNo <= 23) {
              newCellData[cellNo].delay = value;
            }
          }
          if (frame.length > 5) {
            frame.fill(0, 5, totalFrameLength);
          }
        }

        const crc = calculateCRC16(frame.slice(0, totalFrameLength));
        frame.push(crc & 0xff, (crc >> 8) & 0xff);

        const hexFrame = frame
          .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
          .join(" ");
        allHex.push(hexFrame);
      }

      setCellData(newCellData);

      if (allHex.length === 0 && errors.length > 0) {
        setError(`No valid commands processed. Errors: ${errors.join("; ")}`);
      } else {
        setHexLines(allHex);
        const timestamp = new Date().toLocaleTimeString();
        setReceived((prev) => {
          const newReceived = { ...prev };
          for (const hexFrame of allHex) {
            const hexArray = hexFrame
              .split(" ")
              .map((hex) => parseInt(hex, 16));
            const [, commandCode, functionCodeOrCellNo] = hexArray;
            const commandEntry = Object.entries(instructionToHexMap).find(
              ([
                ,
                { commandCode: cc, functionCode: fc, excludeFunctionCode },
              ]) =>
                parseInt(cc, 16) === commandCode &&
                (excludeFunctionCode ||
                  parseInt(fc, 16) === functionCodeOrCellNo)
            );
            const command = commandEntry ? commandEntry[0] : "unknown";
            console.log(
              `SerialTerminal: Processing command in handleFileChange: ${command}`
            );
            if (typeof command !== "string") {
              newReceived.Individual = [
                ...newReceived.Individual,
                `[${timestamp}] Error: Invalid command in file: ${command}`,
              ];
              continue;
            }
            let category: keyof typeof prev = "Individual";
            if (command.includes("_11_csu_")) {
              category = "CSU11";
            } else if (command.includes("_12_csu_")) {
              category = "CSU12";
            } else if (command.includes("_dc_csu_")) {
              category = "DCCSU";
            } else if (command === "daisy_chain") {
              category = "DaisyChain";
            }
            newReceived[category] = [
              ...newReceived[category],
              `[${timestamp}] Hex frame ready: ${hexFrame}`,
            ];
          }
          if (errors.length > 0) {
            newReceived.Individual = [
              ...newReceived.Individual,
              `[${timestamp}] File processing errors: ${errors.join("; ")}`,
            ];
          }
          console.log(
            "SerialTerminal: Updated received state with hex frames:",
            newReceived
          );
          return newReceived;
        });
      }
    } catch (err: any) {
      setError(`Failed to process file: ${err.message}`);
    }
  };

  const handleStopTest = () => {
    console.log("Stopping test...");
    isRunningRef.current = false;
    setIsRunning(false);
    setIsLoading(false);
    setCurrentCycle(0);
    // stopAutoSave();
    setReceived((prev) => ({
      ...prev,
      Individual: [
        ...prev.Individual,
        `[${new Date().toLocaleTimeString()}] ⏹️ Test stopped by user`,
      ],
    }));
  };




// const handleRunTest = async () => {
//   console.log("handleRunTest called");
//   setError(null);
//   setIsLoading(true);
//   setIsRunning(true);
//   isRunningRef.current = true;
//   setCurrentCycle(0);
//   setCycleData([]);

//   if (autoSaveEnabled) {
//     startAutoSave();
//   }

//   try {
//     console.log("Starting test with", cycleCount, "cycles");

//     if (!window.serialAPI) {
//       throw new Error("Serial API not available");
//     }

//     if (!window.serialAPI.writePortRaw) {
//       throw new Error("writePortRaw method not available on serialAPI");
//     }

//     for (let cycle = 1; cycle <= cycleCount; cycle++) {
//       if (!isRunningRef.current) {
//         console.log("Test stopped at cycle", cycle);
//         break;
//       }

//       console.log("Starting cycle", cycle);
//       setCurrentCycle(cycle);

//       for (let i = 0; i < hexLines.length; i++) {
//         if (!isRunningRef.current) {
//           console.log("Test stopped at hex line", i);
//           break;
//         }

//         const hexLine = hexLines[i];
//         console.log("Processing hex line", i + 1, "of", hexLines.length, ":", hexLine);

//         const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
//         const [, commandCode, functionCodeOrCellNo, cellNo] = hexArray;

//         // Skip updateCellStatesFile for commands with commandCode 0x03
//         const skipFileUpdate = commandCode === 0x03;

//         const commandEntry = Object.entries(instructionToHexMap).find(
//           ([, { commandCode: cc, functionCode: fc, excludeFunctionCode }]) =>
//             parseInt(cc, 16) === commandCode &&
//             (excludeFunctionCode || parseInt(fc, 16) === functionCodeOrCellNo)
//         );

//         const command = commandEntry ? commandEntry[0] : "unknown";

//         if (command === "set_voltage") {
//           const voltageHexValue = hexArray[4];
//           const expectedVoltage = EXPECTED_SENT_VOLTAGES[voltageHexValue] || null;

//           if (expectedVoltage !== null && cellNo >= 0 && cellNo <= 23) {
//             setCellData((prev) => {
//               const newData = [...prev];
//               newData[cellNo] = {
//                 ...newData[cellNo],
//                 setVoltage: voltageHexValue,
//                 expectedVoltage: expectedVoltage,
//                 voltage: null,
//                 csu11Voltage: null,
//                 csu12Voltage: null,
//                 dcCsuVoltage: null,
//               };
//               return newData;
//             });
//           }
//         }

//         if (typeof command !== "string") {
//           setReceived((prev) => ({
//             ...prev,
//             Individual: [
//               ...prev.Individual,
//               `[${new Date().toLocaleTimeString()}] Error: Invalid command: ${command}`,
//             ],
//           }));
//           continue;
//         }

//         setLastSentCommand(
//           commandEntry ? { command: commandEntry[0], cellNo } : null
//         );

//         const byteBuffer = new Uint8Array(hexArray);
//         console.log("Sending byte buffer:", byteBuffer);

//         try {
//           await window.serialAPI.writePortRaw(byteBuffer);
//           console.log("✅ Data sent successfully");
//         } catch (sendError: any) {
//           console.error("❌ Failed to send data:", sendError);
//           throw new Error(`Failed to send data: ${sendError.message}`);
//         }

//         const timestamp = new Date().toLocaleTimeString();
//         const setDetails = parseSentSetCommand(hexArray, timestamp);

//         if (setDetails) {
//           let category: keyof typeof received = "Individual";
//           if (command.includes("_11_csu_")) category = "CSU11";
//           else if (command.includes("_12_csu_")) category = "CSU12";
//           else if (command.includes("_dc_csu_")) category = "DCCSU";
//           else if (command === "daisy_chain") category = "DaisyChain";

//           setReceived((prev) => ({
//             ...prev,
//             [category]: [...prev[category], setDetails],
//           }));
//         } else {
//           logHexCommand(
//             "Sent",
//             hexArray,
//             timestamp,
//             command,
//             cellNo,
//             null,
//             setReceived
//           );
//         }

//         // Skip file update for commandCode 0x03
//         if (!skipFileUpdate && command === "set_voltage" && cellNo >= 0 && cellNo <= 23) {
//           const cell = cellDataRef.current[cellNo];
//           await updateCellStatesFile(
//             cycle,
//             'csu11', // Default to csu11 for set_voltage; adjust if needed
//             cellNo,
//             cell?.setVoltage,
//             cell?.voltage ?? 0, // Use individual actual voltage
//             cell?.voltage
//           );
//         }

//         await new Promise((resolve) => setTimeout(resolve, 500));
//         if (command === "set_automatic_sequence") {
//           await new Promise((resolve) => setTimeout(resolve, 18000));
//         }
//       }

//       if (!isRunningRef.current) {
//         console.log("Test stopped after cycle", cycle);
//         break;
//       }

//       await new Promise((resolve) => setTimeout(resolve, 200));

//       setCycleData((prev) => {
//         const updatedCycle = { ...(prev[cycle - 1] || {}) };
//         const currentCellData = cellDataRef.current;

//         for (const cell of currentCellData) {
//           const key = `cell_${cell.id}`;
//           const cellEntry: Record<string, any> = { id: cell.id };

//           if (cell.voltage !== null || cell.setVoltage !== null) {
//             cellEntry.individual = {
//               receivedVoltage: cell.voltage ?? null,
//               expectedVoltage: cell.expectedVoltage ?? null,
//             };
//           }
//           if (cell.csu11Voltage !== null) {
//             cellEntry.csu11 = {
//               receivedVoltage: cell.csu11Voltage ?? null,
//               expectedVoltage: cell.expectedVoltage ?? null,
//             };
//           }
//           if (cell.csu12Voltage !== null) {
//             cellEntry.csu12 = {
//               receivedVoltage: cell.csu12Voltage ?? null,
//               expectedVoltage: cell.expectedVoltage ?? null,
//             };
//           }
//           if (cell.dcCsuVoltage !== null) {
//             cellEntry.dcCsu = {
//               receivedVoltage: cell.dcCsuVoltage ?? null,
//               expectedVoltage: cell.expectedVoltage ?? null,
//             };
//           }
//           if (cell.daisyChain !== null) {
//             cellEntry.daisyChain = {
//               status: cell.daisyChain,
//             };
//           }

//           if (Object.keys(cellEntry).length > 1) {
//             updatedCycle[key] = cellEntry;
//           }
//         }

//         const newCycleData = [...prev];
//         newCycleData[cycle - 1] = updatedCycle;
//         return newCycleData;
//       });
//     }

//     setCurrentCycle(0);

//     const timestamp = new Date().toLocaleTimeString();
//     if (isRunningRef.current) {
//       setReceived((prev) => ({
//         ...prev,
//         Individual: [
//           ...prev.Individual,
//           `[${timestamp}] ✅ Test completed successfully for ${cycleCount} cycle(s).`,
//           `[${timestamp}] ✅ All data saved to ${currentDataFile}`,
//         ],
//       }));
//     }

//     if (window.serialAPI?.isPortOpen) {
//       const isPortOpen = await window.serialAPI.isPortOpen();
//       if (!isPortOpen) {
//         setError("Port disconnected during test. Attempting to reconnect...");
//         await handleOpen();
//       }
//     }
//   } catch (err: any) {
//     console.error("❌ Test failed:", err);
//     setError("Failed to send test data: " + err.message);
//   } finally {
//     console.log("Cleaning up test state");
//     setIsLoading(false);
//     setIsRunning(false);
//     isRunningRef.current = false;
//     setLastSentCommand(null);
//     setCurrentCycle(0);
//     stopAutoSave();
//   }
// };




const handleRunTest = async () => {
  console.log("handleRunTest called");
  setError(null);
  setIsLoading(true);
  setIsRunning(true);
  isRunningRef.current = true;
  setCurrentCycle(0);
  setCycleData([]);

  if (autoSaveEnabled) {
    startAutoSave();
  }

  try {
    console.log("Starting test with", cycleCount, "cycles");

    if (!window.serialAPI) {
      throw new Error("Serial API not available");
    }

    if (!window.serialAPI.writePortRaw) {
      throw new Error("writePortRaw method not available on serialAPI");
    }

    for (let cycle = 1; cycle <= cycleCount; cycle++) {
      if (!isRunningRef.current) {
        console.log("Test stopped at cycle", cycle);
        break;
      }

      console.log("Starting cycle", cycle);
      setCurrentCycle(cycle);

      for (let i = 0; i < hexLines.length; i++) {
        if (!isRunningRef.current) {
          console.log("Test stopped at hex line", i);
          break;
        }

        const hexLine = hexLines[i];
        console.log("Processing hex line", i + 1, "of", hexLines.length, ":", hexLine);

        const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
        const [, commandCode, functionCodeOrCellNo, cellNo] = hexArray;

        // Skip updateCellStatesFile for commands with commandCode 0x03
        const skipFileUpdate = commandCode === 0x03;

        const commandEntry = Object.entries(instructionToHexMap).find(
          ([, { commandCode: cc, functionCode: fc, excludeFunctionCode }]) =>
            parseInt(cc, 16) === commandCode &&
            (excludeFunctionCode || parseInt(fc, 16) === functionCodeOrCellNo)
        );

        const command = commandEntry ? commandEntry[0] : "unknown";

        if (command === "set_voltage") {
          const voltageHexValue = hexArray[4];
          const expectedVoltage = EXPECTED_SENT_VOLTAGES[voltageHexValue] || null;

          if (expectedVoltage !== null && cellNo >= 0 && cellNo <= 23) {
            setCellData((prev) => {
              const newData = [...prev];
              newData[cellNo] = {
                ...newData[cellNo],
                setVoltage: voltageHexValue,
                expectedVoltage: expectedVoltage,
                voltage: null,
                csu11Voltage: null,
                csu12Voltage: null,
                dcCsuVoltage: null,
              };
              return newData;
            });
          }
        }

        if (typeof command !== "string") {
          setReceived((prev) => ({
            ...prev,
            Individual: [
              ...prev.Individual,
              `[${new Date().toLocaleTimeString()}] Error: Invalid command: ${command}`,
            ],
          }));
          continue;
        }

        setLastSentCommand(
          commandEntry ? { command: commandEntry[0], cellNo } : null
        );

        const byteBuffer = new Uint8Array(hexArray);
        console.log("Sending byte buffer:", byteBuffer);

        try {
          await window.serialAPI.writePortRaw(byteBuffer);
          console.log("✅ Data sent successfully");
        } catch (sendError: any) {
          console.error("❌ Failed to send data:", sendError);
          throw new Error(`Failed to send data: ${sendError.message}`);
        }

        const timestamp = new Date().toLocaleTimeString();
        const setDetails = parseSentSetCommand(hexArray, timestamp);

        if (setDetails) {
          let category: keyof typeof received = "Individual";
          if (command.includes("_11_csu_")) category = "CSU11";
          else if (command.includes("_12_csu_")) category = "CSU12";
          else if (command.includes("_dc_csu_")) category = "DCCSU";
          else if (command === "daisy_chain") category = "DaisyChain";

          setReceived((prev) => ({
            ...prev,
            [category]: [...prev[category], setDetails],
          }));
        } else {
          logHexCommand(
            "Sent",
            hexArray,
            timestamp,
            command,
            cellNo,
            null,
            setReceived
          );
        }

        // Skip file update for commandCode 0x03
        if (!skipFileUpdate && command === "set_voltage" && cellNo >= 0 && cellNo <= 23) {
          const cell = cellDataRef.current[cellNo];
          // Use setVoltage from cell 12–23 (e.g., cellNo + 12)
          const mappedCellNo = cellNo + 12 <= 23 ? cellNo + 12 : 23; // Cap at 23
          const mappedCell = cellDataRef.current[mappedCellNo];
          const setVoltageForCsu11 = mappedCell?.setVoltage ?? cell?.setVoltage ?? 0;
          await updateCellStatesFile(
            cycle,
            'csu11',
            cellNo,
            setVoltageForCsu11, // Use setVoltage from mapped cell (12–23)
            cell?.voltage ?? 0,
            cell?.voltage
          );
        }

        await new Promise((resolve) => setTimeout(resolve, 500));
        if (command === "set_automatic_sequence") {
          await new Promise((resolve) => setTimeout(resolve, 18000));
        }
      }

      if (!isRunningRef.current) {
        console.log("Test stopped after cycle", cycle);
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 200));

      setCycleData((prev) => {
        const updatedCycle = { ...(prev[cycle - 1] || {}) };
        const currentCellData = cellDataRef.current;

        for (const cell of currentCellData) {
          const key = `cell_${cell.id}`;
          const cellEntry: Record<string, any> = { id: cell.id };

          if (cell.voltage !== null || cell.setVoltage !== null) {
            cellEntry.individual = {
              receivedVoltage: cell.voltage ?? null,
              expectedVoltage: cell.expectedVoltage ?? null,
            };
          }
          if (cell.csu11Voltage !== null) {
            cellEntry.csu11 = {
              receivedVoltage: cell.csu11Voltage ?? null,
              expectedVoltage: cell.expectedVoltage ?? null,
            };
          }
          if (cell.csu12Voltage !== null) {
            cellEntry.csu12 = {
              receivedVoltage: cell.csu12Voltage ?? null,
              expectedVoltage: cell.expectedVoltage ?? null,
            };
          }
          if (cell.dcCsuVoltage !== null) {
            cellEntry.dcCsu = {
              receivedVoltage: cell.dcCsuVoltage ?? null,
              expectedVoltage: cell.expectedVoltage ?? null,
            };
          }
          if (cell.daisyChain !== null) {
            cellEntry.daisyChain = {
              status: cell.daisyChain,
            };
          }

          if (Object.keys(cellEntry).length > 1) {
            updatedCycle[key] = cellEntry;
          }
        }

        const newCycleData = [...prev];
        newCycleData[cycle - 1] = updatedCycle;
        return newCycleData;
      });
    }

    setCurrentCycle(0);

    const timestamp = new Date().toLocaleTimeString();
    if (isRunningRef.current) {
      setReceived((prev) => ({
        ...prev,
        Individual: [
          ...prev.Individual,
          `[${timestamp}] ✅ Test completed successfully for ${cycleCount} cycle(s).`,
          `[${timestamp}] ✅ All data saved to ${currentDataFile}`,
        ],
      }));
    }

    if (window.serialAPI?.isPortOpen) {
      const isPortOpen = await window.serialAPI.isPortOpen();
      if (!isPortOpen) {
        setError("Port disconnected during test. Attempting to reconnect...");
        await handleOpen();
      }
    }
  } catch (err: any) {
    console.error("❌ Test failed:", err);
    setError("Failed to send test data: " + err.message);
  } finally {
    console.log("Cleaning up test state");
    setIsLoading(false);
    setIsRunning(false);
    isRunningRef.current = false;
    setLastSentCommand(null);
    setCurrentCycle(0);
    // stopAutoSave();
  }
};






  const handleSaveCycleData = () => {
    if (!cycleData || cycleData.length === 0) return;

    const allCycles = {};

    cycleData.forEach((cycle, cycleIndex) => {
      const csu11 = Object.entries(cycle)
        .filter(([_, v]) => v?.csu11)
        .map(([cellKey, cellValue], idx) => ({
          cell: cellKey,
          csu11Voltage: cellValue?.csu11?.receivedVoltage ?? null,
          testerVoltage1: cycle[`cell_${idx + 12}`]?.individual?.receivedVoltage ?? null,
        }));

      const csu12 = Object.entries(cycle)
        .filter(([_, v]) => v?.csu12)
        .map(([cellKey, cellValue], idx) => ({
          cell: cellKey,
          csu12Voltage: cellValue?.csu12?.receivedVoltage ?? null,
          testerVoltage2: cycle[`cell_${idx}`]?.individual?.receivedVoltage ?? null,
        }));

      const dcCsu = Object.entries(cycle)
        .filter(([_, v]) => v?.dcCsu)
        .map(([cellKey, cellValue]) => {
          const cellNumber = parseInt(cellKey.replace('cell_', ''));
          return {
            cell: cellKey,
            dcCsuVoltage: cellValue?.dcCsu?.receivedVoltage ?? null,
            testerVoltage: cycle[`cell_${cellNumber}`]?.individual?.receivedVoltage ?? null,
          };
        });

      allCycles[`Cycle ${cycleIndex + 1}`] = { csu11, csu12, dcCsu };
    });

    const cycleDataJson = JSON.stringify(allCycles, null, 2);

    const blob = new Blob([cycleDataJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cycle_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearOutput = () => {
    setReceived({
      Individual: [],
      CSU11: [],
      CSU12: [],
      DCCSU: [],
      DaisyChain: [],
    });
    setResponseData({});
    setDcCsuResponseData({});
    setCsu1ResponseData({});
    setCsu2ResponseData({});
    setDaisyChainData({});
    setCellData(
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        voltage: null,
        temperature: null,
        setVoltage: null,
        expectedVoltage: null,
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
      }))
    );
    setCycleData([]);
  };

return (
    <div 
      className="flex justify-center items-start max-h-215 overflow-y-auto"
      // onKeyDown={(e) => {
      //   // Prevent form submission on Enter key
      //   if (e.key === 'Enter') {
      //     e.preventDefault();
      //     e.stopPropagation();
      //   }
      // }}
      // onSubmit={(e) => {
      //   // Prevent any form submissions
      //   e.preventDefault();
      //   e.stopPropagation();
      // }}
    >
      <div className="w-80 mx-2 p-2 max-h-500 bg-white shadow-lg rounded-xl space-y-4 border border-cyan-100">
        <h2 className="text-xl font-bold text-gray-900 text-center font-inter">
          BMS TEST RUN
        </h2>

        <div className="flex justify-center">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
              ${connectedPorts.includes(selectedPort)
                ? "bg-green-100 text-green-800 shadow-green-300 shadow-md animate-pulse"
                : "bg-red-100 text-red-700 border border-red-300"
              }`}
          >
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full ${
                connectedPorts.includes(selectedPort)
                  ? "bg-green-600"
                  : "bg-red-600"
              }`}
            />
            {connectedPorts.includes(selectedPort) ? "Connected" : "Disconnected"}
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <div className="flex flex-col tablet:flex-1">
              <label className="text-xs font-medium text-gray-700">
                Serial Port
              </label>
              <select
                title="Select Serial Port"
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
                disabled={connectedPorts.includes(selectedPort) || isLoading}
                className="w-50 border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
              >
                {availablePorts.length === 0 && connectedPorts.length === 0 ? (
                  <option value="">No ports available</option>
                ) : (
                  [...availablePorts, ...connectedPorts].map((port) => (
                    <option key={port} value={port}>
                      {port} {connectedPorts.includes(port) ? "(Connected)" : ""}
                    </option>
                  ))
                )}
              </select>
            </div>
            <button
              onClick={refreshPorts}
              disabled={isLoading}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1.5 rounded-lg disabled:opacity-50 transition-colors text-sm"
              title="Refresh Ports"
            >
              🔄
            </button>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700">Baud Rate</label>
            <select
              title="Select Baud Rate"
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              disabled={connectedPorts.includes(selectedPort) || isLoading}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
            >
              {[
                300, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600,
                115200, 128000, 256000,
              ].map((rate) => (
                <option key={rate} value={rate}>
                  {rate} bps
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-700">Test Name</label>
            <input
              placeholder="Enter test name"
              type="text"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              disabled={isRunning || isLoading}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
            />
          </div>

          <div className="flex gap-2">
            {!connectedPorts.includes(selectedPort) ? (
              <button
                onClick={handleOpen}
                disabled={isLoading || !selectedPort}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                    />
                  </svg>
                ) : null}
                Open Port
              </button>
            ) : (
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm flex-1 disabled:opacity-50 flex items-center justify-center text-sm transition-colors"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-4 w-4 mr-2 text-white"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
                    />
                  </svg>
                ) : null}
                Close Port
              </button>
            )}
          </div>
        </div>

        <div className="relative group">
          <label className="text-xs font-medium text-gray-700">
            📁 Upload JSON Instructions
          </label>
          <input
            placeholder="Upload JSON file"
            type="file"
            accept=".json"
            onChange={handleFileChange}
            disabled={!connectedPorts.includes(selectedPort) || isLoading}
            className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
          />
          {fileName && (
            <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
          )}

          {/* <div className="space-y-2 mt-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Auto-save</label>
              <input
                title="autosave"
                type="checkbox"
                checked={autoSaveEnabled}
                onChange={(e) => {
                  setAutoSaveEnabled(e.target.checked);
                  if (e.target.checked) {
                    startAutoSave();
                  } else {
                    stopAutoSave();
                  }
                }}
                disabled={isLoading}
                className="w-4 h-4"
              />
              <input
                type="number"
                min="5"
                max="300"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                disabled={!autoSaveEnabled || isLoading}
                className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-16"
                title="Auto-save interval (seconds)"
              />
              <span className="text-xs text-gray-500">sec</span>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveAllData}
                disabled={isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 transition-colors"
              >
                💾 Save Now
              </button>
              <button
                type="button"
                onClick={handleResetDataFile}
                disabled={isLoading || isRunning}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-xs disabled:opacity-50 transition-colors"
              >
                🔄 Reset File
              </button>
            </div>
          </div> */}
        

        {/* <button
          type="button"
          onClick={handleSaveAllData}
          disabled={
            !connectedPorts.includes(selectedPort) ||
            isLoading
          }
          className="mt-2 w-full bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors font-sans"
        >
          {isLoading ? (
            <svg
              className="animate-spin h-4 w-4 mr-2 text-white"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"
              />
            </svg>
          ) : null}
          💾 Save to Single File
        </button> */}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-medium text-gray-700">Cycles</label>
        <input
          placeholder="Enter cycles"
          type="number"
          min={1}
          max={1000}
          value={cycleCount}
          onChange={(e) => setCycleCount(Number(e.target.value))}
          className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm w-20"
          disabled={isLoading}
        />
        {currentCycle > 0 && (
          <span className="text-xs text-blue-700 ml-2">
            Running cycle {currentCycle} / {cycleCount}
          </span>
        )}
      </div>

      {hexLines.length > 0 && (
        <div className="flex gap-2 h-10">
          <button
            
            onClick={(e) => {
              handleRunTest();
            }}
            disabled={!connectedPorts.includes(selectedPort) || isLoading || isRunning}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors font-inter"
          >
            {isLoading ? (
              <svg className="animate-spin h-4 w-4 mr-2 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-8 8v-8H4z"/>
              </svg>
            ) : null}
            {isRunning ? ' Running...' : '▶️ Run Test'}
          </button>
          
          <button
            type="button"
            onClick={handleStopTest}
            disabled={!isRunning}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors font-sans w-36"
            title="Stop Test"
          >
            ⏹️ Stop Test
          </button>
        </div>
      )}

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded-lg text-xs animate-pulse font-sans">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">
            Cycle Data
          </label>
        </div>

        <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner">
          {cycleData.length === 0 ? (
            <p className="text-gray-400">
              No cycle data stored yet. Run a test to store cycle data.
            </p>
          ) : (
            cycleData.map((cycle, cycleIndex) => (
              <div
                key={cycleIndex}
                className="mb-4 border-b border-gray-200 pb-2"
              >
                <div className="text-blue-800 font-semibold mb-2">
                  🔁 Cycle {cycleIndex + 1}
                </div>

                {cycle && typeof cycle === "object" ? (
                  <div className="ml-2 space-y-2">
                    <div>
                      <div className="font-semibold text-gray-800">Individual</div>
                      {Object.entries(cycle).map(([cellKey, cellValue]) =>
                        cellValue?.individual ? (
                          <div key={cellKey} className="ml-4">
                            <span className="font-medium">{cellKey}:</span>
                            {cellValue.individual.receivedVoltage !== null && (
                              <span className="text-green-600">
                                {" "}
                                Received: {cellValue.individual.receivedVoltage} V
                              </span>
                            )}
                            {cellValue.individual.expectedVoltage !== null && (
                              <span className="text-blue-600">
                                {" "}
                                Expected: {cellValue.individual.expectedVoltage} V
                              </span>
                            )}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800">CSU11</div>
                      {Object.entries(cycle).map(([cellKey, cellValue], idx) =>
                        cellValue?.csu11 ? (
                          <div key={cellKey} className="ml-4">
                            <span className="font-medium">{cellKey}:</span>
                            <span className="text-purple-600">
                              {" "}
                              CSU11 Voltage: {cellValue.csu11.receivedVoltage} V
                            </span>
                            {cycle[`cell_${idx + 12}`]?.individual?.receivedVoltage !== undefined && (
                              <span className="text-green-600 ml-2">
                                Tester: {cycle[`cell_${idx + 12}`].individual.receivedVoltage} V
                              </span>
                            )}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800">CSU12</div>
                      {Object.entries(cycle).map(([cellKey, cellValue], idx) =>
                        cellValue?.csu12 ? (
                          <div key={cellKey} className="ml-4">
                            <span className="font-medium">{cellKey}:</span>
                            <span className="text-orange-600">
                              {" "}
                              CSU12 Voltage: {cellValue.csu12.receivedVoltage} V
                            </span>
                            {cycle[`cell_${idx}`]?.individual?.receivedVoltage !== undefined && (
                              <span className="text-green-600 ml-2">
                                Tester: {cycle[`cell_${idx}`].individual.receivedVoltage} V
                              </span>
                            )}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800">DC CSU</div>
                      {Object.entries(cycle).map(([cellKey, cellValue]) =>
                        cellValue?.dcCsu ? (
                          <div key={cellKey} className="ml-4">
                            <span className="font-medium">{cellKey}:</span>
                            <span className="text-red-600">
                              {" "}
                              Voltage: {cellValue.dcCsu.receivedVoltage} V
                            </span>
                            {cycle[cellKey]?.individual?.receivedVoltage !== undefined && (
                              <span className="text-green-600 ml-2">
                                Tester: {cycle[cellKey].individual.receivedVoltage} V
                              </span>
                            )}
                          </div>
                        ) : null
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-gray-800">Daisy Chain</div>
                      {Object.entries(cycle).map(([cellKey, cellValue]) =>
                        cellValue?.daisyChain ? (
                          <div key={cellKey} className="ml-4">
                            <span className="font-medium">{cellKey}:</span>
                            <span className="text-gray-600">
                              {" "}
                              {cellValue.daisyChain.status}
                            </span>
                          </div>
                        ) : null
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">
                    No data available for this cycle
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">
          Serial Output
        </label>
        <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner">
          {Object.entries(received).map(([category, logs]) =>
            logs.length > 0 ? (
              <div key={category} className="mb-2">
                <h3 className="font-semibold text-gray-800">{category}</h3>
                {logs.map((log, index) => (
                  <p key={index} className="text-gray-600 break-all">
                    {log}
                  </p>
                ))}
              </div>
            ) : null
          )}
          {Object.values(received).every((logs) => logs.length === 0) && (
            <p className="text-gray-400">No serial data received yet.</p>
          )}
        </div>
      </div>

      {showCriticalErrorPopup && (
        <div
          className="fixed z-50 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/90 text-white rounded-lg shadow-2xl p-6 backdrop-blur-sm"
          style={{ minWidth: 300 }}
        >
          <h3 className="text-lg font-semibold mb-3">Test Stopped</h3>
          <p className="text-base">Test stopped due to critical cell status!</p>
          <div className="mt-3">
            <strong>Critical Cells:</strong>
            <ul className="list-disc pl-5 mt-1 text-sm">
              {csu1Statuses
                .filter((status) => status.status === 'critical')
                .map((status) => (
                  <li key={status.label}>{status.label}</li>
                ))}
              {csu2Statuses
                .filter((status) => status.status === 'critical')
                .map((status) => (
                  <li key={status.label}>{status.label}</li>
                ))}
              {daisyStatuses
                .filter((status) => status.status === 'critical')
                .map((status) => (
                  <li key={status.label}>{status.label}</li>
                ))}
            </ul>
          </div>
          <button
            onClick={() => setShowCriticalErrorPopup(false)}
            className="mt-4 bg-white text-red-500 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
    </div>
  );
};
export default SerialTerminal;