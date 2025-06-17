

// import React, { useRef, useState } from "react";

// const InstructionRunner: React.FC = () => {
//   const [instructions, setInstructions] = useState<any[]>([]);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleLoadFile = () => {
//     fileInputRef.current?.click();
//   };

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (!file) return;
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       try {
//         const data = JSON.parse(event.target?.result as string);
//         if (Array.isArray(data)) {
//           setInstructions(data);
//         } else {
//           alert("Invalid file format. Please use a JSON array.");
//         }
//       } catch {
//         alert("Error parsing file. Please ensure it is valid JSON.");
//       }
//     };
//     reader.readAsText(file);
//     e.target.value = "";
//   };

//   const handleRunInstructions = () => {
//     // TODO: Send instructions to your main process or serial logic
//     alert("Running instructions (implement your logic here)");
//     // Example: window.serialAPI.runInstructions(instructions);
//   };

//   return (
//     <div className="mt-8 p-4 border rounded bg-gray-50">
//       <h3 className="font-semibold mb-2 text-lg">Test Run</h3>
//       <div className="flex gap-2 mb-2">
//         <button
//           onClick={handleLoadFile}
//           className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Load Instruction File
//         </button>
//         <button
//           onClick={handleRunInstructions}
//           className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
//           disabled={instructions.length === 0}
//         >
//           Run Instructions
//         </button>
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handleFileChange}
//           className="hidden"
//           accept=".json"
//           title="Load instruction JSON file"
//         />
//       </div>
//       <div className="max-h-40 overflow-y-auto text-xs bg-white border rounded p-2">
//         {instructions.length === 0 ? (
//           <span className="text-gray-400">No instructions loaded.</span>
//         ) : (
//           <pre>{JSON.stringify(instructions, null, 2)}</pre>
//         )}
//       </div>
//     </div>
//   );
// };

// export default InstructionRunner;




import React, { useState } from "react";

interface SetInstruction {
  id: number;
  command: string;
  param1: string;
  param2: string;
  cellNo: string;
  cycleNo: string;
  voltage: string;
  temperature: string;
  time: string;
}

interface InstructionRunnerProps {
  instructions: SetInstruction[];
  isPortOpen: boolean;
  writeSerialData: (command: string) => Promise<void>;
  updateCellState: (instruction: SetInstruction) => void;
}

// Modbus CRC16 calculation
const calculateCRC16 = (data: number[]): number => {
  let crc = 0xFFFF;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x0001) {
        crc = (crc >> 1) ^ 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }
  return crc;
};

const InstructionRunner: React.FC<InstructionRunnerProps> = ({
  instructions,
  isPortOpen,
  writeSerialData,
  updateCellState,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [lastCommand, setLastCommand] = useState<string>("");

  const SLAVE_ID = 0x07; // Fixed Slave ID from protocol
  const SET_CODE = 0x00; // Fixed SET code

  const formatCommand = (instruction: SetInstruction): number[] | null => {
    console.log("Renderer: Formatting instruction:", instruction);
    let functionCode: number;
    let data: number[] = [SLAVE_ID, SET_CODE];

    switch (instruction.command) {
      case "set_voltage":
        functionCode = 0x01;
        const cellNo = parseInt(instruction.cellNo);
        if (cellNo < 1 || cellNo > 23) return null;
        const voltage = Math.round(parseFloat(instruction.voltage) * 1000); // Convert to mV
        data = [...data, functionCode, cellNo, (voltage >> 8) & 0xFF, voltage & 0xFF];
        break;
      case "set_temp":
        functionCode = 0x02;
        const tempCellNo = parseInt(instruction.cellNo);
        if (tempCellNo < 1 || tempCellNo > 6) return null;
        const temperature = Math.round(parseFloat(instruction.temperature) * 10); // Convert to 0.1°C
        data = [...data, functionCode, tempCellNo, (temperature >> 8) & 0xFF, temperature & 0xFF];
        break;
      case "set_balance":
        functionCode = 0x03;
        const balanceCellNo = parseInt(instruction.cellNo);
        if (balanceCellNo < 1 || balanceCellNo > 23) return null;
        data = [...data, functionCode, balanceCellNo, 0x00, 0x01]; // Assume 1 = enable
        break;
      case "set_ow":
        functionCode = 0x04;
        const owCellNo = parseInt(instruction.cellNo);
        if (owCellNo < 1 || owCellNo > 24) return null;
        data = [...data, functionCode, owCellNo, 0x00, 0x01]; // Assume 1 = enable
        break;
      case "delay":
        functionCode = 0x06;
        const time = parseInt(instruction.time);
        if (time <= 0) return null;
        data = [...data, functionCode, (time >> 8) & 0xFF, time & 0xFF];
        break;
      case "cycle":
        return null; // Handled in handleRunInstructions
      default:
        console.warn("Renderer: Unsupported command:", instruction.command);
        return null;
    }

    const crc = calculateCRC16(data);
    data = [...data, crc & 0xFF, (crc >> 8) & 0xFF];
    console.log("Renderer: Formatted Modbus frame:", data.map(b => b.toString(16).padStart(2, '0')));
    return data;
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const handleRunInstructions = async () => {
    console.log("Renderer: Starting handleRunInstructions, isPortOpen:", isPortOpen, "instructions:", instructions);
    if (!isPortOpen) {
      console.warn("Renderer: Serial port is not open");
      alert("Serial port is not open.");
      return;
    }
    if (!instructions.length) {
      console.warn("Renderer: No instructions loaded");
      alert("No instructions loaded.");
      return;
    }

    setIsRunning(true);
    setCurrentStep(0);

    try {
      for (let i = 0; i < instructions.length && isRunning; i++) {
        console.log("Renderer: Processing instruction index:", i);
        setCurrentStep(i + 1);
        const instruction = instructions[i];

        if (instruction.command === "cycle") {
          const startStep = parseInt(instruction.param1.replace("Step ", "")) - 1;
          const cycleCount = parseInt(instruction.param2);
          console.log("Renderer: Handling cycle, startStep:", startStep, "cycleCount:", cycleCount);

          if (startStep < 0 || startStep >= instructions.length || cycleCount <= 0) {
            console.warn("Renderer: Invalid cycle parameters, skipping");
            alert(`Invalid cycle at step ${i + 1}: startStep ${startStep + 1}, cycleCount ${cycleCount}`);
            continue;
          }

          for (let cycle = 0; cycle < cycleCount && isRunning; cycle++) {
            console.log("Renderer: Cycle iteration:", cycle + 1);
            for (let j = startStep; j < instructions.length && isRunning; j++) {
              if (instructions[j].command === "end") {
                console.log("Renderer: Encountered end, breaking cycle");
                break;
              }
              setCurrentStep(j + 1);
              const cycleFrame = formatCommand(instructions[j]);
              if (cycleFrame) {
                const commandStr = String.fromCharCode(...cycleFrame);
                setLastCommand(cycleFrame.map(b => b.toString(16).padStart(2, '0')).join(' '));
                console.log("Renderer: Sending cycle command:", commandStr);
                await writeSerialData(commandStr);
                updateCellState(instructions[j]);
                if (instructions[j].command === "delay") {
                  const delayTime = parseInt(instructions[j].time);
                  if (delayTime > 0) {
                    console.log("Renderer: Delaying for", delayTime, "ms");
                    await delay(delayTime);
                  }
                }
              }
            }
          }
          continue;
        }

        if (instruction.command === "end") {
          console.log("Renderer: Encountered end, stopping execution");
          break;
        }

        const frame = formatCommand(instruction);
        if (frame) {
          const commandStr = String.fromCharCode(...frame);
          setLastCommand(frame.map(b => b.toString(16).padStart(2, '0')).join(' '));
          console.log("Renderer: Sending command:", commandStr);
          await writeSerialData(commandStr);
          updateCellState(instruction);
          if (instruction.command === "delay") {
            const delayTime = parseInt(instruction.time);
            if (delayTime > 0) {
              console.log("Renderer: Delaying for", delayTime, "ms");
              await delay(delayTime);
            }
          }
        }
      }
    } catch (error) {
      console.error("Renderer: Error in handleRunInstructions:", error);
      alert("Error executing instructions: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsRunning(false);
      setCurrentStep(0);
      setLastCommand("");
      console.log("Renderer: Execution completed or stopped");
    }
  };

  const handleStopExecution = () => {
    console.log("Renderer: Stopping execution");
    setIsRunning(false);
    setCurrentStep(0);
    setLastCommand("");
  };

  return (
    <div className="p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-2 text-lg">Test Run</h3>
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleRunInstructions}
          className={`px-4 py-1 rounded text-white ${
            isRunning || instructions.length === 0
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={isRunning || instructions.length === 0}
          title={instructions.length === 0 ? "No instructions loaded" : "Run loaded instructions"}
        >
          Run Instructions
        </button>
        <button
          onClick={handleStopExecution}
          className={`px-4 py-1 rounded text-white ${
            !isRunning ? "bg-gray-500 cursor-not-allowed" : "bg-red-500 hover:bg-red-600"
          }`}
          disabled={!isRunning}
          title="Stop instruction execution"
        >
          Stop
        </button>
      </div>
      {isRunning && (
        <div className="text-sm mb-2">
          <span className="font-semibold">Current Step:</span> {currentStep}
        </div>
      )}
      <div className="text-sm mb-2">
        <span className="font-semibold">Last Command (Hex):</span> {lastCommand || "None"}
      </div>
      <div className="max-h-40 overflow-y-auto text-xs bg-white border rounded p-2">
        {instructions.length === 0 ? (
          <span className="text-gray-400">No instructions loaded.</span>
        ) : (
          <pre>{JSON.stringify(instructions, null, 2)}</pre>
        )}
      </div>
    </div>
  );
};

export default InstructionRunner;
