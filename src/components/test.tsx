//update all data correctly
import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
} from "react";
import { useBatteryContext } from "../BatteryContext";

export interface ResponseData {
  command: string;
  value: string;
}

interface SerialTerminalProps {
  updateCellVoltage: (cellId: number, voltage: number) => void;
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
  set_cell_led: {
    commandCode: "03",
    functionCode: "07",
    valueType: "binary",
  },
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

const extractDaisyTemp = (
  hexArray: number[]
): { id: number; cellNo: number; value: string | null } => {
  if (hexArray.length < 8) return { id: 0, cellNo: 0, value: null };
  const id = hexArray[1];
  const cellNo = hexArray[3];
  const valueBytes = hexArray.slice(4, 6);
  const valueInt = (valueBytes[0] << 8) | valueBytes[1];
  const floatValue = valueInt / 1000;
  return { id, cellNo, value: floatValue.toFixed(3) + " °C" };
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
    const value = hexArray[4];
    parsedValue = `${value} `;
  } else if (command === "set_temp" || command === "temp_response") {
    const value = hexArray[4];
    parsedValue = `${value} °C`;
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
    .join(" ")} → Command: ${command}, Cell ID: ${cellNo}, Value: ${parsedValue}`;
};

const logHexCommand = (
  type: "Sent" | "Received",
  hexArray: number[],
  timestamp: string,
  command: string,
  cellNo: number,
  parsedValue: string | null,
  setReceived: React.Dispatch<React.SetStateAction<string[]>>,
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
    const newReceived = [...prev, logLine];
    console.log(
      `SerialTerminal: Updated received state (${type}):`,
      newReceived
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
  } = useBatteryContext();

  const baudRates = [
    300, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 38400, 57600, 115200,
    128000, 256000,
  ];

  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [baudRate, setBaudRate] = useState<number>(() => {
    const saved = localStorage.getItem("serialBaudRate");
    return saved ? Number(saved) : 9600;
  });
  const [isOpen, setIsOpen] = useState(false);
  const [received, setReceived] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [hexLines, setHexLines] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastSentCommand, setLastSentCommand] = useState<{
    command: string;
    cellNo?: number;
  } | null>(null);

  const lastSentCommandRef = useRef(lastSentCommand);
  const setReceivedRef = useRef(setReceived);

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
    loadPorts();
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
        instructionToHexMap[lastSentCommandRef.current.command]
      ) {
        command = lastSentCommandRef.current.command;
      } else {
        command = Object.entries(instructionToHexMap).find(
          ([, { commandCode: cc, functionCode: fc }]) =>
            parseInt(cc, 16) === commandCode &&
            parseInt(fc, 16) === functionCode
        )?.[0];
      }

      if (!command || !instructionToHexMap[command]) {
        console.warn(
          `SerialTerminal: Unknown command: ${command} (commandCode: 0x${commandCode.toString(
            16
          )}, functionCode: 0x${functionCode.toString(16)})`
        );
        logHexCommand(
          "Received",
          hexArray,
          timestamp,
          "unknown",
          0,
          null,
          setReceivedRef.current,
          `Unknown command (commandCode: 0x${commandCode.toString(
            16
          )}, functionCode: 0x${functionCode.toString(16)})`
        );
        return;
      }

      const { cellNoRange, valueType } = instructionToHexMap[command];

      let cellNo: number;
      let parsedValue: string | null;

      if (valueType === "float") {
        const { cellNo: extractedCellNo, value } =
          extractIndividualCellVoltageData(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
      } else if (valueType === "dc_csu_voltage") {
        const { cellNo: extractedCellNo, dcIc, value } =
          extractDCVoltageData(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
        console.log(
          `SerialTerminal: Parsed DC CSU cellNo: ${cellNo}, dcIc: ${dcIc}, value: ${parsedValue} for ${command}`
        );
      } else if (valueType === "11_csu_voltage") {
        const { cellNo: extractedCellNo, id11: extractedId11, value } =
          extract11CSUVoltageData(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
        console.log(
          `SerialTerminal: Parsed CSU11 cellNo: ${cellNo}, id11: ${extractedId11}, value: ${parsedValue} for ${command}`
        );
      } else if (valueType === "12_csu_voltage") {
        const { cellNo: extractedCellNo, id12: extractedId12, value } =
          extract12CSUVoltageData(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
        console.log(
          `SerialTerminal: Parsed CSU12 cellNo: ${cellNo}, id12: ${extractedId12}, value: ${parsedValue} for ${command}`
        );
      } else if (valueType === "temp") {
        const { cellNo: extractedCellNo, id: extractedId, value } =
          extractTemperature(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
        console.log(
          `SerialTerminal: Parsed id: ${extractedId}, cellNo: ${cellNo}, value: ${parsedValue} for ${command}`
        );
      } else if (valueType === "current") {
        const { cellNo: extractedCellNo, id: extractedId, value } =
          extractCurrent(hexArray);
        cellNo = extractedCellNo;
        parsedValue = value;
        console.log(
          `SerialTerminal: Parsed id: ${extractedId}, cellNo: ${cellNo}, value: ${parsedValue} for ${command}`
        );
      } else if (valueType === "int") {
        if (command.includes("_11_csu_")) {
          const { cellNo: extractedCellNo, id: extractedId, value } =
            extract11CSUTemperature(hexArray);
          cellNo = extractedCellNo;
          parsedValue = value;
          console.log(
            `SerialTerminal: Parsed CSU11 temp cellNo: ${cellNo}, id: ${extractedId}, value: ${parsedValue} for ${command}`
          );
        } else if (command.includes("_12_csu_")) {
          const { cellNo: extractedCellNo, id: extractedId, value } =
            extract12CSUTemperature(hexArray);
          cellNo = extractedCellNo;
          parsedValue = value;
          console.log(
            `SerialTerminal: Parsed CSU12 temp cellNo: ${cellNo}, id: ${extractedId}, value: ${parsedValue} for ${command}`
          );
        } else if (command.includes("_dc_csu_")) {
          const { cellNo: extractedCellNo, value } =
            extractDaisyTemp(hexArray);
          cellNo = extractedCellNo;
          parsedValue = value;
          console.log(
            `SerialTerminal: Parsed daisy chain temp cellNo: ${cellNo}, value: ${parsedValue} for ${command}`
          );
        }
         else {
          cellNo = hexArray[2];
          parsedValue = parseNonVoltageValue(hexArray, command);
        }
      } else if (valueType === "binary") {
        if (command.includes("_11_csu_")) {
          cellNo = hexArray[3];
          parsedValue = hexArray[4] === 1 ? "On" : "Off";
          console.log(
            `SerialTerminal: Parsed CSU11 binary command ${command}, cellNo: ${cellNo}, value: ${parsedValue}`
          );
        } else if (command.includes("_12_csu_")) {
          cellNo = hexArray[3];
          parsedValue = hexArray[4] === 1 ? "On" : "Off";
          console.log(
            `SerialTerminal: Parsed CSU12 binary command ${command}, cellNo: ${cellNo}, value: ${parsedValue}`
          );
        } else if (command === "daisy_chain") {
          const { cellNo: extractedCellNo, value } =
            extractDaisyChainData(hexArray);
          cellNo = extractedCellNo;
          parsedValue = value;
          console.log(
            `SerialTerminal: Parsed daisy_chain cellNo: ${cellNo}, value: ${parsedValue}`
          );
        } else {
          cellNo = hexArray[2];
          parsedValue = parseNonVoltageValue(hexArray, command);
        }
      } else {
        cellNo = hexArray[2];
        parsedValue = parseNonVoltageValue(hexArray, command);
      }

      if (!parsedValue) {
        console.warn(
          `SerialTerminal: Failed to parse value for ${command}:`,
          data
        );
        logHexCommand(
          "Received",
          hexArray,
          timestamp,
          command,
          cellNo,
          null,
          setReceivedRef.current
        );
        return;
      }

      logHexCommand(
        "Received",
        hexArray,
        timestamp,
        command,
        cellNo,
        parsedValue,
        setReceivedRef.current
      );

      if (cellNoRange && !isNaN(cellNo)) {
        if (cellNo < cellNoRange[0] || cellNo > cellNoRange[1]) {
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

      if (command.includes("_11_csu_")) {
        setCsu1ResponseData((prevData) => {
          const existingDataForCell = prevData[cellNo] || [];
          // Comment out to allow updates for the same command
          // const commandExists = existingDataForCell.some(
          //   (item) => item.command === command
          // );
          // if (commandExists) {
          //   console.log(
          //     `SerialTerminal: Skipping update for CSU11 Cell ID ${cellNo}, command ${command} already exists`
          //   );
          //   return prevData;
          // }
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
          const existingDataForCell = prevData[cellNo] || [];
          // Comment out to allow updates
          // const commandExists = existingDataForCell.some(
          //   (item) => item.command === command
          // );
          // if (commandExists) {
          //   console.log(
          //     `SerialTerminal: Skipping update for CSU12 Cell ID ${cellNo}, command ${command} already exists`
          //   );
          //   return prevData;
          // }
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
          const existingDataForCell = prevData[cellNo] || [];
          // Comment out to allow updates
          // const commandExists = existingDataForCell.some(
          //   (item) => item.command === command
          // );
          // if (commandExists) {
          //   console.log(
          //     `SerialTerminal: Skipping update for Daisy Chain Cell ID ${cellNo}, command ${command} already exists`
          //   );
          //   return prevData;
          // }
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
      } else if (
        command === "get_dc_csu_volt" ||
        command === "get_dc_csu_temp" ||
        command === "get_dc_csu_balance" ||
        command === "get_dc_csu_ow"
      ) {
        const dcIc = hexArray[2];
        setDcCsuResponseData((prevData) => {
          const existingDataForDcIc = prevData[dcIc] || {};
          const existingDataForCell = existingDataForDcIc[cellNo] || [];
          // Comment out to allow updates
          // const commandExists = existingDataForCell.some(
          //   (item) => item.command === command
          // );
          // if (commandExists) {
          //   console.log(
          //     `SerialTerminal: Skipping update for DC CSU IC ${dcIc}, Cell ID ${cellNo}, command ${command} already exists`
          //   );
          //   return prevData;
          // }
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
          const existingDataForCell = prevData[cellNo] || [];
          // Comment out to allow updates
          // const commandExists = existingDataForCell.some(
          //   (item) => item.command === command
          // );
          // if (commandExists) {
          //   console.log(
          //     `SerialTerminal: Skipping update for Individual Cell ID ${cellNo}, command ${command} already exists`
          //   );
          //   return prevData;
          // }
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
      setReceived((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Error: ${error}`,
      ]);
    };
    window.serialAPI.onSerialError?.(errorHandler);

    return () => {
      window.serialAPI.removeSerialDataListener?.();
      window.serialAPI.removeSerialErrorListener?.();
    };
  }, [updateCellVoltage]);

  const loadPorts = async () => {
    setError(null);
    try {
      const newPorts = await window.serialAPI?.listPorts();
      setPorts(newPorts || []);
      if (newPorts?.length && !newPorts.includes(selectedPort)) {
        setSelectedPort(newPorts[0]);
      } else if (!newPorts?.length) {
        setSelectedPort("");
      }
    } catch (err: any) {
      setError("Failed to load ports: " + err.message);
    }
  };

  const handleOpen = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await window.serialAPI?.openPort(selectedPort, baudRate);
      setIsOpen(true);
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
      await window.serialAPI?.closePort();
      setIsOpen(false);
      console.log("SerialTerminal: Port closed successfully");
    } catch (err: any) {
      setError("Failed to close port: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setHexLines([]);
    setError(null);

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      if (!Array.isArray(json)) {
        setError("JSON must be an array of instruction objects.");
        return;
      }

      const allHex: string[] = [];

      for (const entry of json) {
        let command = (entry.command || "").toLowerCase();
        if (command === "get_temperature") {
          command = "get_temp";
        }

        if (!command || !instructionToHexMap[command]) {
          setError(
            `Invalid or unmapped command: ${entry.command || "undefined"}`
          );
          continue;
        }

        const { commandCode, functionCode, cellNoRange, excludeFunctionCode } =
          instructionToHexMap[command];
        const frame: number[] = [0x07, parseInt(commandCode, 16)];

        if (!excludeFunctionCode) {
          frame.push(parseInt(functionCode, 16));
        }

        if (cellNoRange) {
          const cellNo = parseInt(entry.cellNo, 10);
          if (
            isNaN(cellNo) ||
            cellNo < cellNoRange[0] ||
            cellNo > cellNoRange[1]
          ) {
            setError(
              `Invalid cellNo for ${command}: ${entry.cellNo || "undefined"}`
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
              setError(
                `Invalid voltage for ${command}: ${
                  entry.voltage ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (frame.length > 5) {
              frame.fill(0, 5, totalFrameLength);
            }
          } else if (command === "set_temp") {
            const value = parseInt(entry.temperature, 10);
            if (isNaN(value) || value < -20 || value > 100) {
              setError(
                `Invalid temperature for ${command}: ${
                  entry.temperature ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (frame.length > 5) {
              frame.fill(0, 5, totalFrameLength);
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
              setError(
                `Invalid binary value for ${command}: ${
                  entry.value ?? "undefined"
                }`
              );
              continue;
            }
            frame[4] = value & 0xff;
            if (frame.length > 5) {
              frame.fill(0, 5, totalFrameLength);
            }
          } else if (command === "set_delay") {
            const value = parseInt(entry.time, 10);
            if (isNaN(value) || value < 0 || value > 255) {
              setError(
                `Invalid time for ${command}: ${entry.time ?? "undefined"}`
              );
              continue;
            }
            frame[3] = value & 0xff;
            if (frame.length > 4) {
              frame.fill(0, 4, totalFrameLength);
            }
          }
        }

        const crc = calculateCRC16(frame.slice(0, totalFrameLength));
        frame.push(crc & 0xff, (crc >> 8) & 0xff);

        const hexFrame = frame
          .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
          .join(" ");
        allHex.push(hexFrame);
      }

      if (allHex.length === 0) {
        setError("No valid commands processed.");
      } else {
        setHexLines(allHex);
        const timestamp = new Date().toLocaleTimeString();
        setReceived((prev) => {
          const newReceived = [
            ...prev,
            `[${timestamp}] Hex frames ready:`,
            ...allHex,
          ];
          console.log(
            "SerialTerminal: Updated received state with hex frames:",
            newReceived
          );
          return newReceived;
        });
      }
    } catch (err: any) {
      setError("Failed to process file: " + err.message);
    }
  };

  const handleRunTest = async () => {
    setError(null);
    setIsLoading(true);
    try {
      for (const hexLine of hexLines) {
        const hexArray = hexLine.split(" ").map((hex) => parseInt(hex, 16));
        const [, commandCode, functionCodeOrCellNo, cellNo] = hexArray;
        const commandEntry = Object.entries(instructionToHexMap).find(
          ([, { commandCode: cc, functionCode: fc, excludeFunctionCode }]) =>
            parseInt(cc, 16) === commandCode &&
            (excludeFunctionCode || parseInt(fc, 16) === functionCodeOrCellNo)
        );

        if (commandEntry) {
          console.log(
            `SerialTerminal: Setting lastSentCommand to ${commandEntry[0]} for cell ${cellNo}`
          );
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
            const newReceived = [...prev, setDetails];
            console.log(
              "SerialTerminal: Updated received state with sent set command:",
              newReceived
            );
            return newReceived;
          });
        } else {
          logHexCommand(
            "Sent",
            hexArray,
            timestamp,
            commandEntry?.[0] || "unknown",
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

      const timestamp = new Date().toLocaleTimeString();
      setReceived((prev) => {
        const newReceived = [
          ...prev,
          `[${timestamp}] ✅ Test sent successfully.`,
        ];
        console.log(
          "SerialTerminal: Updated received state with test completion:",
          newReceived
        );
        return newReceived;
      });

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
    }
  };

  const handleClearOutput = () => {
    setReceived([]);
    setResponseData({});
    setDcCsuResponseData({});
    setCsu1ResponseData({});
    setCsu2ResponseData({});
    setDaisyChainData({});
  };

  const allCellData = {
    Individual: responseData,
    "DC CSU": dcCsuResponseData,
    CSU11: csu1ResponseData,
    CSU12: csu2ResponseData,
    DaisyChain: daisyChainData,
  };

  return (
    <div className="w-80 mx-2 p-2 bg-white shadow-lg rounded-xl space-y-4 border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-900 text-center font-roboto">
        🔌 BMS TEST RUN
      </h2>

      <div className="flex justify-center">
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300
            ${
              isOpen
                ? "bg-green-100 text-green-800 shadow-green-300 shadow-md animate-pulse"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
        >
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              isOpen ? "bg-green-600" : "bg-red-600"
            }`}
          />
          {isOpen ? "Connected" : "Disconnected"}
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
              disabled={isOpen || isLoading}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
            >
              {ports.length === 0 ? (
                <option value="">No ports available</option>
              ) : (
                ports.map((port) => (
                  <option key={port} value={port}>
                    {port}
                  </option>
                ))
              )}
            </select>
          </div>
          <button
            onClick={loadPorts}
            disabled={isOpen || isLoading}
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
            disabled={isOpen || isLoading}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 transition-colors"
          >
            {baudRates.map((rate) => (
              <option key={rate} value={rate}>
                {rate} bps
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {!isOpen ? (
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
          disabled={!isOpen || isLoading}
          className="block mt-1 text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-100 file:text-blue-600 hover:file:bg-blue-200 disabled:file:bg-gray-200 disabled:file:text-gray-500"
        />
        <div className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded py-1 px-2 mt-1">
          Upload a JSON file with BMS commands (e.g., set_voltage, get_voltage)
        </div>
        {fileName && (
          <p className="text-xs text-gray-500 mt-1">Loaded: {fileName}</p>
        )}
      </div>

      {hexLines.length > 0 && (
        <button
          onClick={handleRunTest}
          disabled={!isOpen || isLoading}
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

      {(Object.keys(responseData).length > 0 ||
        Object.keys(dcCsuResponseData).length > 0 ||
        Object.keys(csu1ResponseData).length > 0 ||
        Object.keys(csu2ResponseData).length > 0 ||
        Object.keys(daisyChainData).length > 0) && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-700">Cell Data</label>
          <div className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-sm shadow-inner">
            {Object.entries(allCellData).map(([category, data]) => {
              if (!data || Object.keys(data).length === 0) return null;
              return (
                <div key={category} className="mb-4">
                  <h3 className="font-bold text-purple-600 mb-2">{category}</h3>
                  {Object.entries(data)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([cellIdOrDcIc, dataItems]) => {
                      console.log(
                        `SerialTerminal: Rendering ${category} Cell ID: ${cellIdOrDcIc}`,
                        dataItems
                      );
                      return (
                        <div
                          key={cellIdOrDcIc}
                          className="text-gray-800 break-all mb-2"
                        >
                          <div className="font-semibold text-blue-600">
                            {category === "DC CSU"
                              ? `DC IC ${cellIdOrDcIc}`
                              : `Cell ${cellIdOrDcIc}`}
                          </div>
                          {Array.isArray(dataItems) ? (
                            dataItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="ml-4 flex justify-between"
                              >
                                <span className="text-xs">
                                  {item.command
                                    .replace("set_", "")
                                    .replace("get_", "")
                                    .replace("_11_csu_", "csu11 ")
                                    .replace("_12_csu_", "csu12 ")
                                    .replace("daisy_chain", "Daisy Chain")
                                    .replace(/_/g, " ")}
                                  :
                                </span>
                                <span
                                  className={`font-medium text-xs ${
                                    parseFloat(item.value) > 4.5 ||
                                    (parseFloat(item.value) < 2.0 &&
                                      item.command.includes("volt") &&
                                      !item.command.includes("csu_volt") &&
                                      item.value !== "1")
                                      ? "text-red-600"
                                      : ""
                                  }`}
                                >
                                  {item.value}
                                </span>
                              </div>
                            ))
                          ) : (
                            Object.entries(dataItems).map(([cellNo, items]) => (
                              <div key={cellNo}>
                                <div className="font-semibold text-blue-600 ml-4">
                                  Cell {cellNo}
                                </div>
                                {items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="ml-8 flex justify-between"
                                  >
                                    <span className="text-xs">
                                      {item.command
                                        .replace("set_", "")
                                        .replace("get_", "")
                                        .replace("_11_csu_", "csu11 ")
                                        .replace("_12_csu_", "csu12 ")
                                        .replace("daisy_chain", "Daisy Chain")
                                        .replace(/_/g, " ")}
                                      :
                                    </span>
                                    <span
                                      className={`font-medium text-xs ${
                                        parseFloat(item.value) > 4.5 ||
                                        (parseFloat(item.value) < 2.0 &&
                                          item.command.includes("volt") &&
                                          !item.command.includes("csu_volt") &&
                                          item.value !== "1")
                                          ? "text-red-600"
                                          : ""
                                      }`}
                                    >
                                      {item.value}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-medium text-gray-700">
            Output Console
          </label>
          {received.length > 0 && (
            <button
              onClick={handleClearOutput}
              className="text-xs text-blue-600 hover:text-blue-800 font-inter"
            >
              Clear Output
            </button>
          )}
        </div>
        <div
          className="h-40 overflow-y-auto border border-gray-300 rounded-lg p-3 bg-gray-50 font-mono text-xs shadow-inner"
          style={{ textTransform: "none" }}
        >
          {received.length === 0 ? (
            <p className="text-gray-400">No data received yet.</p>
          ) : (
            received.map((line, idx) => <div key={idx}>{line}</div>)
          )}
        </div>
      </div>
    </div>
  );
};

export default SerialTerminal;