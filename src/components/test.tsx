
//updated for save instructions to json file and run instructions in loop
import React, { useEffect, useState, useRef } from "react";
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
}

interface Instruction {
  command: string;
  cellNo?: string;
  voltage?: string;
  temperature?: string;
  value?: string;
}

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

const SerialTerminal: React.FC<SerialTerminalProps> = ({
  updateCellVoltage,
}) => {
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
  const [cellData, setCellData] = useState<CellData[]>([]);
  const [cycleData, setCycleData] = useState<Record<string, any>[]>([]);

  const setReceivedRef = useRef(setReceived);
  const lastSentCommandRef = useRef(lastSentCommand);

  useEffect(() => {
    // Initialize cellData for 24 cells
    const initialCellData = Array.from({ length: 24 }, (_, i) => ({
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
    }));
    setCellData(initialCellData);
    console.log("SerialTerminal: Initialized cellData:", initialCellData);
  }, []);

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
    console.log(
      "SerialTerminal: Checking serialAPI availability:",
      !!window.serialAPI
    );
    if (!window.serialAPI) {
      setError(
        "Serial API not available. Ensure the app is running in a supported environment."
      );
    }
  }, []);

  useEffect(() => {
    if (!window.serialAPI?.onSerialData) {
      console.warn("SerialTerminal: serialAPI.onSerialData not available");
      return;
    }

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

      // Initialize cellNo and parsedValue based on valueType
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
          command,
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
          command,
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

      // Update cellData with received values
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
      } else {
        console.warn(
          `SerialTerminal: Skipping cellData update due to invalid cellNo: ${cellNo}`
        );
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
        } else {
          console.warn(
            `SerialTerminal: Invalid voltage or cellNo parsed: ${parsedValue}, CellNo: ${cellNo}`
          );
          logHexCommand(
            "Received",
            hexArray,
            timestamp,
            command,
            cellNo,
            parsedValue,
            setReceivedRef.current,
            `Invalid voltage or cellNo parsed: ${parsedValue}, CellNo: ${cellNo}`
          );
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
  }, [updateCellVoltage]);

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
      console.log("✅ Uploaded instructions:", json.map(i => i.command));


      const newCellData = Array.from({ length: 24 }, (_, i) => ({
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

// ⬇️ Add this inside your SerialTerminal component
const handleSaveCellData = () => {
  try {
    const dataToSave: Record<string, any> = {};

    const cycleKey = `cycle_${currentCycle || 1}`;
    const individualData: Record<string, any> = {};
    const csu1Data: Record<string, any> = {};
    const csu2Data: Record<string, any> = {};
    const daisyChainDataExport: Record<string, any> = {};

    cellData.forEach((cell) => {
      const cellKey = `cell_${cell.id}`;

      // ✅ Save both received and expected voltages
      if (cell.voltage !== null || cell.setVoltage !== null) {
        individualData[cellKey] = {
          receivedVoltage: cell.voltage ?? null,
          expectedVoltage: cell.setVoltage ?? null,
        };
      }

      // CSU1
      if (
        cell.csu11Voltage !== null ||
        cell.csu11Temperature !== null ||
        cell.csu11Balance ||
        cell.csu11OpenWire
      ) {
        csu1Data[cellKey] = {
          voltage: cell.csu11Voltage,
          temperature: cell.csu11Temperature,
          balance: cell.csu11Balance,
          openWire: cell.csu11OpenWire,
        };
      }

      // CSU2
      if (
        cell.csu12Voltage !== null ||
        cell.csu12Temperature !== null ||
        cell.csu12Balance ||
        cell.csu12OpenWire
      ) {
        csu2Data[cellKey] = {
          voltage: cell.csu12Voltage,
          temperature: cell.csu12Temperature,
          balance: cell.csu12Balance,
          openWire: cell.csu12OpenWire,
        };
      }

      // DaisyChain
      if (cell.daisyChain !== null) {
        daisyChainDataExport[cellKey] = {
          value: cell.daisyChain,
        };
      }
    });

    dataToSave[cycleKey] = {
      individual: individualData,
      csu1: csu1Data,
      csu2: csu2Data,
      daisyChain: daisyChainDataExport,
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cell_data_${timestamp}.json`;

    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const logTime = new Date().toLocaleTimeString();
    setReceived((prev) => ({
      ...prev,
      Individual: [
        ...prev.Individual,
        `[${logTime}] ✅ Data saved to ${filename}`,
      ],
    }));
  } catch (err: any) {
    setError(`❌ Failed to save data: ${err.message}`);
  }
};



const saveCellDataToJson = (data: Record<string, any>[], isManualSave: boolean = false) => {
  try {
    // Create a timestamp and filename early to ensure availability
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `cell_data_${timestamp}.json`;

    // For manual save, use cellData; for cycle save, use provided data
    const dataToSave = isManualSave
      ? cellData.reduce((acc, cell) => {
          const individual: Record<string, any> = {};
          const csu: Record<string, any> = {};
          const daisychain: Record<string, any> = {};

          // Individual data
          if (cell.voltage !== null) individual.voltage = cell.voltage;
          if (cell.temperature !== null) individual.temperature = cell.temperature;
          if (cell.setVoltage !== null) individual.setVoltage = cell.setVoltage;
          if (cell.setTemperature !== null) individual.setTemperature = cell.setTemperature;
          if (cell.balancing) individual.balancing = cell.balancing;
          if (cell.openWire) individual.openWire = cell.openWire;
          if (cell.delay !== null) individual.delay = cell.delay;
          if (cell.cellLed) individual.cellLed = cell.cellLed;
          if (cell.automaticSequence) individual.automaticSequence = cell.automaticSequence;
          if (cell.voltageLimits !== null) individual.voltageLimits = cell.voltageLimits;

          // CSU data
          if (
            cell.csu11Voltage !== null ||
            cell.csu11Temperature !== null ||
            cell.csu11Balance ||
            cell.csu11OpenWire ||
            cell.csu12Voltage !== null ||
            cell.csu12Temperature !== null ||
            cell.csu12Balance ||
            cell.csu12OpenWire ||
            cell.dcCsuVoltage !== null ||
            cell.dcCsuTemperature !== null ||
            cell.dcCsuBalance ||
            cell.dcCsuOpenWire
          ) {
            csu.csu11 = {};
            csu.csu12 = {};
            csu.dcCsu = {};
            if (cell.csu11Voltage !== null) csu.csu11.voltage = cell.csu11Voltage;
            if (cell.csu11Temperature !== null) csu.csu11.temperature = cell.csu11Temperature;
            if (cell.csu11Balance) csu.csu11.balance = cell.csu11Balance;
            if (cell.csu11OpenWire) csu.csu11.openWire = cell.csu11OpenWire;
            if (cell.csu12Voltage !== null) csu.csu12.voltage = cell.csu12Voltage;
            if (cell.csu12Temperature !== null) csu.csu12.temperature = cell.csu12Temperature;
            if (cell.csu12Balance) csu.csu12.balance = cell.csu12Balance;
            if (cell.csu12OpenWire) csu.csu12.openWire = cell.csu12OpenWire;
            if (cell.dcCsuVoltage !== null) csu.dcCsu.voltage = cell.dcCsuVoltage;
            if (cell.dcCsuTemperature !== null) csu.dcCsu.temperature = cell.dcCsuTemperature;
            if (cell.dcCsuBalance) csu.dcCsu.balance = cell.dcCsuBalance;
            if (cell.dcCsuOpenWire) csu.dcCsu.openWire = cell.dcCsuOpenWire;
            // Remove empty CSU objects
            if (Object.keys(csu.csu11).length === 0) delete csu.csu11;
            if (Object.keys(csu.csu12).length === 0) delete csu.csu12;
            if (Object.keys(csu.dcCsu).length === 0) delete csu.dcCsu;
          }

          // Daisychain data
          if (cell.daisyChain !== null) daisychain.daisyChain = cell.daisyChain;

          // Only include cell if it has data in any category
          if (
            Object.keys(individual).length > 0 ||
            Object.keys(csu).length > 0 ||
            Object.keys(daisychain).length > 0
          ) {
            acc[`cell_${cell.id}`] = {
              id: cell.id,
              ...(Object.keys(individual).length > 0 && { individual }),
              ...(Object.keys(csu).length > 0 && { csu }),
              ...(Object.keys(daisychain).length > 0 && { daisychain }),
            };
          }
          return acc;
        }, {} as Record<string, any>)
      : data;

    // Check if there's any data to save
    const dataKeys = isManualSave ? Object.keys(dataToSave) : data.length;
    if (dataKeys.length === 0) {
      const timestampLog = new Date().toLocaleTimeString();
      setReceived((prev) => ({
        ...prev,
        Individual: [
          ...prev.Individual,
          `[${timestampLog}] No cell data available to save${isManualSave ? "" : " for cycles"}.`,
        ],
      }));
      return;
    }

    // For cycle data, restructure into individual, csu, and daisychain
    const jsonToSave = isManualSave
      ? { individual: dataToSave, csu: {}, daisychain: {} }
      : data.reduce((acc, cycleData, index) => {
          const individual: Record<string, any> = {};
          const csu: Record<string, any> = {};
          const daisychain: Record<string, any> = {};

          Object.entries(cycleData).forEach(([cellKey, cell]) => {
            const cellIndividual: Record<string, any> = {};
            const cellCsu: Record<string, any> = {};
            const cellDaisychain: Record<string, any> = {};

            // Individual data
            if (cell.voltage !== null) cellIndividual.voltage = cell.voltage;
            if (cell.temperature !== null) cellIndividual.temperature = cell.temperature;
            if (cell.setVoltage !== null) cellIndividual.setVoltage = cell.setVoltage;
            if (cell.setTemperature !== null) cellIndividual.setTemperature = cell.setTemperature;
            if (cell.balancing) cellIndividual.balancing = cell.balancing;
            if (cell.openWire) cellIndividual.openWire = cell.openWire;
            if (cell.delay !== null) cellIndividual.delay = cell.delay;
            if (cell.cellLed) cellIndividual.cellLed = cell.cellLed;
            if (cell.automaticSequence) cellIndividual.automaticSequence = cell.automaticSequence;
            if (cell.voltageLimits !== null) cellIndividual.voltageLimits = cell.voltageLimits;

            // CSU data
            if (
              cell.csu11?.voltage !== null ||
              cell.csu11?.temperature !== null ||
              cell.csu11?.balance ||
              cell.csu11?.openWire ||
              cell.csu12?.voltage !== null ||
              cell.csu12?.temperature !== null ||
              cell.csu12?.balance ||
              cell.csu12?.openWire ||
              cell.dcCsu?.voltage !== null ||
              cell.dcCsu?.temperature !== null ||
              cell.dcCsu?.balance ||
              cell.dcCsu?.openWire
            ) {
              cellCsu.csu11 = {};
              cellCsu.csu12 = {};
              cellCsu.dcCsu = {};
              if (cell.csu11?.voltage !== null) cellCsu.csu11.voltage = cell.csu11.voltage;
              if (cell.csu11?.temperature !== null) cellCsu.csu11.temperature = cell.csu11.temperature;
              if (cell.csu11?.balance) cellCsu.csu11.balance = cell.csu11.balance;
              if (cell.csu11?.openWire) cellCsu.csu11.openWire = cell.csu11.openWire;
              if (cell.csu12?.voltage !== null) cellCsu.csu12.voltage = cell.csu12.voltage;
              if (cell.csu12?.temperature !== null) cellCsu.csu12.temperature = cell.csu12.temperature;
              if (cell.csu12?.balance) cellCsu.csu12.balance = cell.csu12.balance;
              if (cell.csu12?.openWire) cellCsu.csu12.openWire = cell.csu12.openWire;
              if (cell.dcCsu?.voltage !== null) cellCsu.dcCsu.voltage = cell.dcCsu.voltage;
              if (cell.dcCsu?.temperature !== null) cellCsu.dcCsu.temperature = cell.dcCsu.temperature;
              if (cell.dcCsu?.balance) cellCsu.dcCsu.balance = cell.dcCsu.balance;
              if (cell.dcCsu?.openWire) cellCsu.dcCsu.openWire = cell.dcCsu.openWire;
              // Remove empty CSU objects
              if (Object.keys(cellCsu.csu11).length === 0) delete cellCsu.csu11;
              if (Object.keys(cellCsu.csu12).length === 0) delete cellCsu.csu12;
              if (Object.keys(cellCsu.dcCsu).length === 0) delete cellCsu.dcCsu;
            }

            // Daisychain data
            if (cell.daisyChain !== null) cellDaisychain.daisyChain = cell.daisyChain;

            // Add to respective categories if data exists
            if (Object.keys(cellIndividual).length > 0) {
              individual[cellKey] = { id: cell.id, ...cellIndividual };
            }
            if (Object.keys(cellCsu).length > 0) {
              csu[cellKey] = { id: cell.id, ...cellCsu };
            }
            if (Object.keys(cellDaisychain).length > 0) {
              daisychain[cellKey] = { id: cell.id, ...cellDaisychain };
            }
          });

          // Only include cycle if it has data
          if (
            Object.keys(individual).length > 0 ||
            Object.keys(csu).length > 0 ||
            Object.keys(daisychain).length > 0
          ) {
            acc[`cycle_${index + 1}`] = {
              ...(Object.keys(individual).length > 0 && { individual }),
              ...(Object.keys(csu).length > 0 && { csu }),
              ...(Object.keys(daisychain).length > 0 && { daisychain }),
            };
          }
          return acc;
        }, {} as Record<string, any>);

    // Check if there's any filtered data to save
    if (Object.keys(jsonToSave).length === 0) {
      const timestampLog = new Date().toLocaleTimeString();
      setReceived((prev) => ({
        ...prev,
        Individual: [
          ...prev.Individual,
          `[${timestampLog}] No valid cell data available to save${isManualSave ? "" : " for cycles"}.`,
        ],
      }));
      return;
    }

    // Create a Blob with the JSON data
    const jsonString = JSON.stringify(jsonToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor element to trigger the download
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Log the save action
    const timestampLog = new Date().toLocaleTimeString();
    setReceived((prev) => ({
      ...prev,
      Individual: [
        ...prev.Individual,
        `[${timestampLog}] Cell data saved to ${filename}`,
      ],
    }));
  } catch (err: any) {
    const timestampLog = new Date().toLocaleTimeString();
    setError(`Failed to save cell data${isManualSave ? "" : " for cycles"}: ${err.message}`);
    setReceived((prev) => ({
      ...prev,
      Individual: [
        ...prev.Individual,
        `[${timestampLog}] Failed to save cell data${isManualSave ? "" : " for cycles"}: ${err.message}`,
      ],
    }));
  }
};


  // const handleSaveCellData = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void => {
  //   saveCellDataToJson([], true);
  // };

  const handleRunTest = async () => {
    setError(null);
    setIsLoading(true);
    setCurrentCycle(0);
    setCycleData([]); // Reset cycleData before starting

    try {
      const allCycleData: Record<string, any>[] = [];

      for (let cycle = 1; cycle <= cycleCount; cycle++) {
        setCurrentCycle(cycle);

        for (const hexLine of hexLines) {
          const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
          const [, commandCode, functionCodeOrCellNo, cellNo] = hexArray;
          const commandEntry = Object.entries(instructionToHexMap).find(
            ([, { commandCode: cc, functionCode: fc, excludeFunctionCode }]) =>
              parseInt(cc, 16) === commandCode &&
              (excludeFunctionCode || parseInt(fc, 16) === functionCodeOrCellNo)
          );

          const command = commandEntry ? commandEntry[0] : "unknown";
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

          if (commandEntry) {
            setLastSentCommand({ command: commandEntry[0], cellNo });
          } else {
            setLastSentCommand(null);
          }

          const byteBuffer = new Uint8Array(hexArray);
          await window.serialAPI?.writePortRaw(byteBuffer);

          const timestamp = new Date().toLocaleTimeString();
          const setDetails = parseSentSetCommand(hexArray, timestamp);
          if (setDetails) {
            setReceived((prev) => {
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
              const newReceived = {
                ...prev,
                [category]: [...prev[category], setDetails],
              };
              return newReceived;
            });
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

          if (
            commandCode === 0x04 ||
            commandCode === 0xa6 ||
            commandCode === 0x0d
          ) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        // Store cell data for this cycle
        const cycleCellData = cellData.reduce((acc, cell) => {
          if (
            cell.voltage !== null ||
            cell.temperature !== null ||
            cell.setVoltage !== null ||
            cell.setTemperature !== null ||
            cell.balancing ||
            cell.openWire ||
            cell.delay !== null ||
            cell.cellLed ||
            cell.automaticSequence ||
            cell.voltageLimits !== null ||
            cell.csu11Voltage !== null ||
            cell.csu11Temperature !== null ||
            cell.csu11Balance ||
            cell.csu11OpenWire ||
            cell.csu12Voltage !== null ||
            cell.csu12Temperature !== null ||
            cell.csu12Balance ||
            cell.csu12OpenWire ||
            cell.dcCsuVoltage !== null ||
            cell.dcCsuTemperature !== null ||
            cell.dcCsuBalance ||
            cell.dcCsuOpenWire ||
            cell.daisyChain !== null
          ) {
            acc[`cell_${cell.id}`] = {
              id: cell.id,
              voltage: cell.voltage,
              temperature: cell.temperature,
              setVoltage: cell.setVoltage,
              setTemperature: cell.setTemperature,
              balancing: cell.balancing,
              openWire: cell.openWire,
              delay: cell.delay,
              cellLed: cell.cellLed,
              automaticSequence: cell.automaticSequence,
              voltageLimits: cell.voltageLimits,
              csu11: {
                voltage: cell.csu11Voltage,
                temperature: cell.csu11Temperature,
                balance: cell.csu11Balance,
                openWire: cell.csu11OpenWire,
              },
              csu12: {
                voltage: cell.csu12Voltage,
                temperature: cell.csu12Temperature,
                balance: cell.csu12Balance,
                openWire: cell.csu12OpenWire,
              },
              dcCsu: {
                voltage: cell.dcCsuVoltage,
                temperature: cell.dcCsuTemperature,
                balance: cell.dcCsuBalance,
                openWire: cell.dcCsuOpenWire,
              },
              daisyChain: cell.daisyChain,
            };
          }
          return acc;
        }, {} as Record<string, any>);
        allCycleData.push(cycleCellData);
      }

      // Update cycleData state
      setCycleData(allCycleData);

      // Save all cycle data to a single JSON file
      saveCellDataToJson(allCycleData);

      setCurrentCycle(0); // Reset indicator after completion

      const timestamp = new Date().toLocaleTimeString();
      setReceived((prev) => ({
        ...prev,
        Individual: [
          ...prev.Individual,
          `[${timestamp}] ✅ Test sent successfully for ${cycleCount} cycle(s).`,
        ],
      }));

      if (window.serialAPI?.isPortOpen) {
        const isPortOpen = await window.serialAPI.isPortOpen();
        if (!isPortOpen) {
          setError("Port disconnected during test. Attempting to reconnect...");
          await handleOpen();
        }
      }
    } catch (err: any) {
      setError("Failed to send test data: " + err.message);
    } finally {
      setIsLoading(false);
      setLastSentCommand(null);
      setCurrentCycle(0);
    }
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
    <div className="w-80 mx-2 p-2 bg-white shadow-lg rounded-xl space-y-4 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 text-center font-inter">
        🔌 BMS TEST RUN
      </h2>

      <div className="flex justify-center">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
            ${
              connectedPorts.includes(selectedPort)
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
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              disabled={connectedPorts.includes(selectedPort) || isLoading}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
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
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={!connectedPorts.includes(selectedPort) || isLoading}
          className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
        />
        {/* <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
          Upload a JSON file with BMS commands (e.g., set_voltage, get_voltage)
        </div> */}
        {fileName && (
          <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
        )}

        <button
          onClick={handleSaveCellData}
          disabled={!connectedPorts.includes(selectedPort) || isLoading}
          className="mt-2 w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors font-sans"
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
          💾 Save Cell Data
        </button>
      </div>

      <div className="flex items-center gap-2 mb-2">
        <label className="text-xs font-medium text-gray-700">Cycles</label>
        <input
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
        <button
          onClick={handleRunTest}
          disabled={!connectedPorts.includes(selectedPort) || isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-sm disabled:opacity-50 flex items-center justify-center text-sm transition-colors font-sans"
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
          ▶️ Run Test
        </button>
      )}

      {error && (
        <div className="p-2 bg-red-100 text-red-700 rounded-lg text-xs animate-pulse font-sans">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">Cell Data</label>
          <button
            onClick={handleClearOutput}
            className="text-xs text-blue-600 hover:text-blue-800 font-inter justify-center"
          >
            Clear Output
          </button>
        </div>
        <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner">
          {cellData.every(
            (cell) =>
              !cell.voltage &&
              !cell.temperature &&
              !cell.setVoltage &&
              !cell.setTemperature &&
              !cell.balancing &&
              !cell.openWire &&
              !cell.delay &&
              !cell.cellLed &&
              !cell.automaticSequence &&
              !cell.voltageLimits &&
              !cell.csu11Voltage &&
              !cell.csu11Temperature &&
              !cell.csu11Balance &&
              !cell.csu11OpenWire &&
              !cell.csu12Voltage &&
              !cell.csu12Temperature &&
              !cell.csu12Balance &&
              !cell.csu12OpenWire &&
              !cell.dcCsuVoltage &&
              !cell.dcCsuTemperature &&
              !cell.dcCsuBalance &&
              !cell.dcCsuOpenWire &&
              !cell.daisyChain
          ) ? (
            <p className="text-gray-400">No data received yet.</p>
          ) : (
            cellData.map((cell) => (
              <div key={cell.id} className="mb-2">
                <div className="font-semibold">Cell ID: {cell.id}</div>
                {cell.voltage !== null && (
                  <div className="ml-4">Voltage: {cell.voltage} V</div>
                )}
                {cell.temperature !== null && (
                  <div className="ml-4">Temperature: {cell.temperature} °C</div>
                )}
                {cell.setVoltage !== null && (
                  <div className="ml-4">Set Voltage: {cell.setVoltage}</div>
                )}
                {cell.setTemperature !== null && (
                                  <div className="ml-4">Set Temperature: {cell.setTemperature} °C</div>
              )}
              {cell.balancing && (
                <div className="ml-4">Balancing: {cell.balancing.toString()}</div>
              )}
              {cell.openWire && (
                <div className="ml-4">Open Wire: {cell.openWire.toString()}</div>
              )}
              {cell.delay !== null && (
                <div className="ml-4">Delay: {cell.delay} ms</div>
              )}
              {cell.cellLed && (
                <div className="ml-4">Cell LED: {cell.cellLed.toString()}</div>
              )}
              {cell.automaticSequence && (
                <div className="ml-4">Automatic Sequence: {cell.automaticSequence.toString()}</div>
              )}
              {cell.voltageLimits !== null && (
                <div className="ml-4">Voltage Limits: {cell.voltageLimits}</div>
              )}
              {cell.csu11Voltage !== null && (
                <div className="ml-4">CSU11 Voltage: {cell.csu11Voltage} V</div>
              )}
              {cell.csu11Temperature !== null && (
                <div className="ml-4">CSU11 Temperature: {cell.csu11Temperature} °C</div>
              )}
              {cell.csu11Balance && (
                <div className="ml-4">CSU11 Balance: {cell.csu11Balance.toString()}</div>
              )}
              {cell.csu11OpenWire && (
                <div className="ml-4">CSU11 Open Wire: {cell.csu11OpenWire.toString()}</div>
              )}
              {cell.csu12Voltage !== null && (
                <div className="ml-4">CSU12 Voltage: {cell.csu12Voltage} V</div>
              )}
              {cell.csu12Temperature !== null && (
                <div className="ml-4">CSU12 Temperature: {cell.csu12Temperature} °C</div>
              )}
              {cell.csu12Balance && (
                <div className="ml-4">CSU12 Balance: {cell.csu12Balance.toString()}</div>
              )}
              {cell.csu12OpenWire && (
                <div className="ml-4">CSU12 Open Wire: {cell.csu12OpenWire.toString()}</div>
              )}
              {cell.dcCsuVoltage !== null && (
                <div className="ml-4">DC CSU Voltage: {cell.dcCsuVoltage} V</div>
              )}
              {cell.dcCsuTemperature !== null && (
                <div className="ml-4">DC CSU Temperature: {cell.dcCsuTemperature} °C</div>
              )}
              {cell.dcCsuBalance && (
                <div className="ml-4">DC CSU Balance: {cell.dcCsuBalance.toString()}</div>
              )}
              {cell.dcCsuOpenWire && (
                <div className="ml-4">DC CSU Open Wire: {cell.dcCsuOpenWire.toString()}</div>
              )}
              {cell.daisyChain !== null && (
                <div className="ml-4">Daisy Chain: {cell.daisyChain}</div>
              )}
            </div>
          ))
        )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-700">Serial Output</label>
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
    </div>
  );
};

export default SerialTerminal;