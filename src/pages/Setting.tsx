import React, { useState, useRef, useEffect } from "react";
import MenuBar from "../components/MenuBar";

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

const Settings: React.FC = () => {
  const [instructions, setInstructions] = useState<SetInstruction[]>([
    {
      id: 1,
      command: "",
      param1: "",
      param2: "",
      value: "",
      cellNo: "",
      cycleNo: "",
      voltage: "",
      temperature: "",
      time: "",
    },
  ]);
  const [notes, setNotes] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    rowIndex: number;
  } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  const handleInputChange = (
    index: number,
    field: keyof SetInstruction,
    value: string
  ) => {
    if (
      (field === "param2" || field === "temperature" || field === "time") &&
      value &&
      (isNaN(Number(value)) || Number(value) < 0)
    ) {
      return;
    }
    setInstructions((prev) => {
      const newInstructions = [...prev];
      newInstructions[index] = { ...newInstructions[index], [field]: value };
      return newInstructions;
    });
  };

  const insertRow = (index: number) => {
    const maxId = instructions.reduce((max, row) => Math.max(max, row.id), 0);
    const newRow: SetInstruction = {
      id: maxId + 1,
      command: "",
      param1: "",
      param2: "",
      value: "",
      cellNo: "",
      cycleNo: "",
      voltage: "",
      temperature: "",
      time: "",
    };
    setInstructions((prev) => [
      ...prev.slice(0, index + 1),
      newRow,
      ...prev.slice(index + 1),
    ]);
  };

  const deleteRow = (index: number) => {
    setInstructions((prev) => {
      if (prev.length === 1) return prev;
      const newInstructions = prev.filter((_, i) => i !== index);
      return newInstructions.map((instr) => {
        if (instr.command === "cycle" && instr.param1) {
          const stepNum = parseInt(instr.param1.replace("Step ", ""));
          if (stepNum > newInstructions.length) {
            return { ...instr, param1: "" };
          }
        }
        return instr;
      });
    });
  };

  const addRow = () => {
    const maxId = instructions.reduce((max, row) => Math.max(max, row.id), 0);
    const newRow: SetInstruction = {
      id: maxId + 1,
      command: "",
      param1: "",
      param2: "",
      value: "",
      cellNo: "",
      cycleNo: "",
      voltage: "",
      temperature: "",
      time: "",
    };
    setInstructions((prev) => [...prev, newRow]);
  };

  const handleLoadFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            const validData = data.map((item, index) => {
              const voltage =
                item.command === "set_voltage" &&
                item.voltage &&
                parseInt(item.voltage) >= 1 &&
                parseInt(item.voltage) <= 8
                  ? item.voltage
                  : item.command === "set_voltage"
                  ? ""
                  : item.voltage || "";
              const cellNo =
                item.cellNo &&
                parseInt(item.cellNo) >= 0 &&
                parseInt(item.cellNo) <=
                  (item.command === "set_temp" ||
                  item.command === "get_temperature" ||
                  item.command === "get_11_csu_temp" ||
                  item.command === "get_12_csu_temp" ||
                  item.command === "get_dc_csu_temp"
                    ? 5
                    : item.command === "get_11_csu_volt" ||
                      item.command === "get_12_csu_volt"
                    ? 11
                    : 22)
                  ? item.cellNo
                  : "";
              const value =
                (item.command === "set_ow" || item.command === "daisy_chain") &&
                ["0", "1"].includes(item.value)
                  ? item.value
                  : item.command === "set_ow" || item.command === "daisy_chain"
                  ? ""
                  : item.value || "";
              return {
                id: index + 1,
                command: item.command || "",
                param1: item.command === "cycle" ? item.param1 || "" : "",
                param2: item.command === "cycle" ? item.param2 || "" : "",
                value,
                cellNo,
                cycleNo: item.cycleNo || "",
                voltage,
                temperature: item.temperature || "",
                time: item.time || "",
              };
            });
            setInstructions(validData);
          } else {
            alert(
              "Invalid file format. Please use a JSON array of instructions."
            );
          }
        } catch (error) {
          alert("Error parsing file. Please ensure it is a valid JSON file.");
          console.error("File parse error:", error);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = () => {
    const dataToSave = instructions.map(({ id, ...rest }) => rest);
    const jsonString = JSON.stringify(dataToSave, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `instructions_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    alert("Instructions saved successfully.");
  };

  const isFieldEnabled = (command: string, field: keyof SetInstruction) => {
    if (command === "") return false;
    switch (command) {
      case "set_voltage":
        return field === "cellNo" || field === "voltage";
      case "set_temp":
        return field === "cellNo" || field === "temperature";
      case "set_ow":
      case "daisy_chain":
      case "set_balance":
        return field === "cellNo" || field === "value";
      case "cycle":
        return field === "param1" || field === "param2";
      case "set_delay":
        return field === "value" || field === "cellNo";
      case "get_voltage":
      case "get_current":
      case "get_11_csu_volt":
      case "get_12_csu_volt":
      case "get_11_csu_ow":
      case "get_12_csu_ow":
      case "get_11_csu_balance":
      case "get_12_csu_balance":
      case "get_dc_csu_volt":
      case "get_dc_csu_ow":
      case "get_dc_csu_balance":
      case "get_dc_csu_temp":
        return field === "cellNo";
      case "get_temperature":
      case "get_temperature_res":
      case "get_11_csu_temp":
      case "get_12_csu_temp":
        return field === "cellNo";
      case "end":
      case "reset":
        return false;
      case "set_automatic_sequence":
      case "set_cell_led":
        return field === "value" || field === "cellNo";
      default:
        return false;
    }
  };

  const getCellOptions = (command: string) => {
    const maxCells =
      command === "set_temp" ||
      command === "get_temperature" ||
      command === "get_11_csu_temp" ||
      command === "get_12_csu_temp" ||
      command === "get_dc_csu_temp"
        ? 6
        : command === "get_11_csu_volt" || command === "get_12_csu_volt"
        ? 12
        : 24;
    return Array.from({ length: maxCells }, (_, i) => i);
  };

  const getVoltageOptions = () => {
    return Array.from({ length: 8 }, (_, i) => String(i + 1));
  };

  const getValueOptions = () => {
    return ["0", "1"];
  };

  const getStepOptions = () => {
    return Array.from({ length: instructions.length }, (_, i) => `Step ${i + 1}`);
  };

  const tableContainerStyle = {
    maxHeight: instructions.length > 4 ? "calc(4 * 3.5rem + 3rem)" : "none",
    overflowY: instructions.length > 4 ? "auto" : "visible" as const,
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-inter">
      <MenuBar />
      <div className="flex-1 p-6">
        <div className="bg-white p-6 rounded-xl toast-shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Set Instructions</h2>
            <div className="flex space-x-3">
              <button
                onClick={handleLoadFile}
                className="px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Load File</span>
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm6.293-9.707a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 9.414V17a1 1 0 11-2 0V9.414L7.707 11.707a1 1 0 01-1.414-1.414l3-3z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Save</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
              />
            </div>
          </div>

          <div className="mb-6">
            <div
              className="relative shadow-sm rounded-lg border border-gray-200"
              style={tableContainerStyle}
            >
              <table className="w-full text-sm text-left text-gray-700">
                <thead className="text-xs text-gray-700 uppercase bg-gray-100 sticky top-0 font-inter">
                  <tr>
                    <th scope="col" className="px-6 py-3 w-12">No</th>
                    <th scope="col" className="px-6 py-3">Command</th>
                    <th scope="col" className="px-6 py-3">Start Step</th>
                    <th scope="col" className="px-6 py-3">Cycle Index</th>
                    <th scope="col" className="px-6 py-3">Value</th>
                    <th scope="col" className="px-6 py-3">Cell No</th>
                    <th scope="col" className="px-6 py-3">Voltage</th>
                    <th scope="col" className="px-6 py-3">Temperature</th>
                    <th scope="col" className="px-6 py-3">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {instructions.map((row, index) => (
                    <tr
                      key={`row-${row.id}-${index}`}
                      className={`border-b ${
                        index % 2 === 0 ? "bg-white" : "bg-gray-50"
                      } hover:bg-gray-50`}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setContextMenu({
                          x: e.clientX,
                          y: e.clientY,
                          rowIndex: index,
                        });
                      }}
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={row.command}
                          onChange={(e) => {
                            const newCommand = e.target.value;
                            handleInputChange(index, "command", newCommand);
                            setInstructions((prev) => {
                              const newInstructions = [...prev];
                              newInstructions[index] = {
                                ...newInstructions[index],
                                param1: newCommand === "cycle" ? row.param1 : "",
                                param2: newCommand === "cycle" ? row.param2 : "",
                                value:
                                  newCommand === "set_ow" ||
                                  newCommand === "set_balance" ||
                                  newCommand === "daisy_chain" ||
                                  newCommand === "set_automatic_sequence"
                                    ? row.value
                                    : "",
                                cellNo:
                                  (newCommand === "set_temp" ||
                                  newCommand === "get_temperature" ||
                                  newCommand === "get_11_csu_temp" ||
                                  newCommand === "get_12_csu_temp" ||
                                  newCommand === "get_dc_csu_temp") &&
                                  parseInt(row.cellNo) > 5
                                    ? ""
                                    : (newCommand === "get_11_csu_volt" ||
                                      newCommand === "get_12_csu_volt") &&
                                      parseInt(row.cellNo) > 11
                                    ? ""
                                    : [
                                        "delay",
                                        "end",
                                        "reset",
                                        "cycle",
                                        "cell_led",
                                      ].includes(newCommand)
                                    ? ""
                                    : row.cellNo,
                                cycleNo: "",
                                voltage:
                                  newCommand === "set_voltage" ? row.voltage : "",
                                temperature:
                                  newCommand === "set_temp" ? row.temperature : "",
                                time: newCommand === "set_delay" ? row.time : "",
                              };
                              return newInstructions;
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">Select command</option>
                          <option value="set_temp">SET TEMPERATURE</option>
                          <option value="set_voltage">SET VOLTAGE</option>
                          <option value="set_ow">SET OW</option>
                          <option value="set_balance">SET BALANCE</option>
                          <option value="daisy_chain">SET DAISY CHAIN</option>
                          <option value="set_cell_led">CELL LED</option>
                          <option value="set_delay">DELAY</option>
                          <option value="set_automatic_sequence">SET AUTOMATIC SEQUENCE</option>
                          <option value="get_voltage">GET VOLTAGE</option>
                          <option value="get_temperature">GET TEMPERATURE</option>
                          <option value="get_temperature_res">GET TEMP_RES</option>
                          <option value="get_current">GET CURRENT</option>
                          <option value="get_11_csu_volt">GET 11 CSU VOLT</option>
                          <option value="get_11_csu_temp">GET 11 CSU TEMP</option>
                          <option value="get_11_csu_ow">GET 11 CSU OW</option>
                          <option value="get_11_csu_balance">
                            GET 11 CSU BALANCE
                          </option>
                          <option value="get_12_csu_volt">GET 12 CSU VOLT</option>
                          <option value="get_12_csu_temp">GET 12 CSU TEMP</option>
                          <option value="get_12_csu_ow">GET 12 CSU OW</option>
                          <option value="get_12_csu_balance">
                            GET 12 CSU BALANCE
                          </option>
                          <option value="get_dc_csu_volt">GET DC CSU VOLT</option>
                          <option value="get_dc_csu_ow">GET DC CSU OW</option>
                          <option value="get_dc_csu_balance">
                            GET DC CSU BALANCE
                          </option>
                          <option value="get_dc_csu_temp">GET DC CSU TEMP</option>
                          <option value="cycle">CYCLE</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {row.command === "cycle" ? (
                          <select
                            value={row.param1}
                            onChange={(e) =>
                              handleInputChange(index, "param1", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select start step</option>
                            {getStepOptions().map((step) => (
                              <option key={step} value={step}>
                                {step}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="p-2 text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.command === "cycle" ? (
                          <input
                            type="text"
                            value={row.param2}
                            onChange={(e) =>
                              handleInputChange(index, "param2", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Enter index"
                          />
                        ) : (
                          <div className="p-2 text-gray-400">-</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {row.command === "set_ow" || row.command === "daisy_chain" || row.command === "set_automatic_sequence" || row.command === "set_balance" ? (
                          <select
                            value={row.value}
                            onChange={(e) =>
                              handleInputChange(index, "value", e.target.value)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select value</option>
                            {getValueOptions().map((val) => (
                              <option key={val} value={val}>
                                {val}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row.value}
                            onChange={(e) =>
                              handleInputChange(index, "value", e.target.value)
                            }
                            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              !isFieldEnabled(row.command, "value")
                                ? "bg-gray-100 text-gray-400"
                                : ""
                            }`}
                            disabled={!isFieldEnabled(row.command, "value")}
                            placeholder={
                              isFieldEnabled(row.command, "value")
                                ? "Enter value"
                                : "-"
                            }
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={row.cellNo}
                          onChange={(e) =>
                            handleInputChange(index, "cellNo", e.target.value)
                          }
                          className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            !isFieldEnabled(row.command, "cellNo")
                              ? "bg-gray-100 text-gray-400"
                              : ""
                          }`}
                          disabled={!isFieldEnabled(row.command, "cellNo")}
                        >
                          <option value="">Select cell</option>
                          {getCellOptions(row.command).map((cell) => (
                            <option key={cell} value={String(cell)}>
                              {cell}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        {row.command === "set_voltage" ? (
                          <select
                            value={row.voltage}
                            onChange={(e) =>
                              handleInputChange(index, "voltage", e.target.value

)
                            }
                            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          >
                            <option value="">Select voltage</option>
                            {getVoltageOptions().map((volt) => (
                              <option key={volt} value={volt}>
                                {volt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={row.voltage}
                            onChange={(e) =>
                              handleInputChange(index, "voltage", e.target.value)
                            }
                            className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                              !isFieldEnabled(row.command, "voltage")
                                ? "bg-gray-100 text-gray-400"
                                : ""
                            }`}
                            disabled={!isFieldEnabled(row.command, "voltage")}
                            placeholder={
                              isFieldEnabled(row.command, "voltage")
                                ? "Enter voltage"
                                : "-"
                            }
                          />
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.temperature}
                          onChange={(e) =>
                            handleInputChange(index, "temperature", e.target.value)
                          }
                          className={`w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            !isFieldEnabled(row.command, "temperature")
                              ? "bg-gray-100 text-gray-400"
                              : ""
                            }`}
                          disabled={!isFieldEnabled(row.command, "temperature")}
                          placeholder={
                            isFieldEnabled(row.command, "temperature")
                              ? "Enter temp"
                              : "-"
                          }
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={row.time}
                          onChange={(e) =>
                            handleInputChange(index, "time", e.target.value)
                          }
                          className={`w-full p-2 border border-gray-300 rounded-md focus: ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                            !isFieldEnabled(row.command, "time")
                              ? "bg-gray-100 text-gray-400"
                              : ""
                            }`}
                          disabled={!isFieldEnabled(row.command, "time")}
                          placeholder={
                            isFieldEnabled(row.command, "time")
                              ? "Enter time"
                              : "-"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {contextMenu && (
              <div
                style={{
                  position: "fixed",
                  top: contextMenu.y,
                  left: contextMenu.x,
                  zIndex: 1000,
                }}
                className="bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 py-1"
              >
                <button
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    insertRow(contextMenu.rowIndex);
                    setContextMenu(null);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Insert Row
                </button>
                <button
                  className={`flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left ${
                    instructions.length === 1
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-600"
                  }`}
                  onClick={() => {
                    if (instructions.length > 1) {
                      deleteRow(contextMenu.rowIndex);
                      setContextMenu(null);
                    }
                  }}
                  disabled={instructions.length === 1}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete Row
                </button>
              </div>
            )}

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={addRow}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center space-x-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2 h5V4a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Add Row</span>
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes/Instructions
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              rows={4}
              placeholder="Enter additional instructions or notes here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;