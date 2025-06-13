// import React, { useState, useRef, useEffect } from "react";
// import MenuBar from "../components/MenuBar";

// interface SetInstruction {
//   id: number;
//   command: string;
//   cellNo: string;
//   cycleNo: string;
//   voltage: string;
//   temperature: string;
//   time: string;
// }

// const Settings: React.FC = () => {
//   const [instructions, setInstructions] = useState<SetInstruction[]>([
//     {
//       id: 1,
//       command: "",
//       cellNo: "",
//       cycleNo: "",
//       voltage: "",
//       temperature: "",
//       time: "",
//     },
//   ]);
//   const [notes, setNotes] = useState<string>("");
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [contextMenu, setContextMenu] = useState<{
//     x: number;
//     y: number;
//     rowIndex: number;
//   } | null>(null);

//   // Hide context menu on click elsewhere
//   useEffect(() => {
//     const handleClick = () => setContextMenu(null);
//     window.addEventListener("click", handleClick);
//     return () => window.removeEventListener("click", handleClick);
//   }, []);

//   const handleInputChange = (
//     index: number,
//     field: keyof SetInstruction,
//     value: string
//   ) => {
//     setInstructions((prev) => {
//       const newInstructions = [...prev];
//       newInstructions[index] = { ...newInstructions[index], [field]: value };
//       return newInstructions;
//     });
//   };

//   // Insert a row after the given index, with unique id
//   const insertRow = (index: number) => {
//     const maxId = instructions.reduce((max, row) => Math.max(max, row.id), 0);
//     const newRow = {
//       id: maxId + 1,
//       command: "",
//       cellNo: "",
//       cycleNo: "",
//       voltage: "",
//       temperature: "",
//       time: "",
//     };
//     setInstructions((prev) => [
//       ...prev.slice(0, index + 1),
//       newRow,
//       ...prev.slice(index + 1),
//     ]);
//   };

//   // Delete a row by index, but keep at least one row
//   const deleteRow = (index: number) => {
//     setInstructions((prev) => {
//       if (prev.length === 1) return prev;
//       return prev.filter((_, i) => i !== index);
//     });
//   };

//   const addRow = () => {
//     const maxId = instructions.reduce((max, row) => Math.max(max, row.id), 0);
//     const newRow = {
//       id: maxId + 1,
//       command: "",
//       cellNo: "",
//       cycleNo: "",
//       voltage: "",
//       temperature: "",
//       time: "",
//     };
//     setInstructions((prev) => [...prev, newRow]);
//   };

//   const handleLoadFile = () => {
//     if (fileInputRef.current) {
//       fileInputRef.current.click();
//     }
//   };

//   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         try {
//           const text = e.target?.result as string;
//           const data = JSON.parse(text);
//           if (Array.isArray(data)) {
//             const validData = data.map((item, index) => ({
//               id: index + 1,
//               command: item.command || "",
//               cellNo: item.cellNo || "",
//               cycleNo: item.cycleNo || "",
//               voltage: item.voltage || "",
//               temperature: item.temperature || "",
//               time: item.time || "",
//             }));
//             setInstructions(validData);
//           } else {
//             alert(
//               "Invalid file format. Please use a JSON array of instructions."
//             );
//           }
//         } catch (error) {
//           alert("Error parsing file. Please ensure it is a valid JSON file.");
//           console.error("File parse error:", error);
//         }
//       };
//       reader.readAsText(file);
//     }
//     if (fileInputRef.current) fileInputRef.current.value = "";
//   };

//   const handleSave = () => {
//     const dataToSave = instructions.map(({ id, ...rest }) => rest);
//     const jsonString = JSON.stringify(dataToSave, null, 2);
//     const blob = new Blob([jsonString], { type: "application/json" });
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = url;
//     link.download = `instructions_${
//       new Date().toISOString().split("T")[0]
//     }.json`;
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//     window.URL.revokeObjectURL(url);
//     alert("Instructions saved successfully.");
//   };

//   return (
//     <div className="flex flex-col h-screen bg-gray-100">
//       <MenuBar />

//       <div className="flex-1 p-4">
//         <div className="bg-white p-4 rounded-lg shadow-lg">
//           <h2 className="text-lg font-semibold mb-2">Set Instructions</h2>
//           <div
//             className="mb-4 instructions-table-scroll"
//             style={{ maxHeight: 320, overflowY: "auto", position: "relative" }}
//           >
//             <table className="w-full border-collapse border border-gray-300">
//               <thead>
//                 <tr className="bg-gray-200">
//                   <th className="border border-gray-300 p-2">No</th>
//                   <th className="border border-gray-300 p-2">Command</th>
//                   <th className="border border-gray-300 p-2">Cell No</th>
//                   <th className="border border-gray-300 p-2">Cycle No</th>
//                   <th className="border border-gray-300 p-2">Voltage</th>
//                   <th className="border border-gray-300 p-2">Temperature</th>
//                   <th className="border border-gray-300 p-2">Time</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {instructions.map((row, index) => (
//                   <tr
//                     key={`row-${row.id}-${index}`}
//                     data-index={index}
//                     onContextMenu={(e) => {
//                       e.preventDefault();
//                       setContextMenu({
//                         x: e.clientX,
//                         y: e.clientY,
//                         rowIndex: index,
//                       });
//                     }}
//                   >
//                     <td className="border border-gray-300 p-2">{index + 1}</td>
//                     <td className="border border-gray-300 p-2">
//                       <select
//                         value={row.command}
//                         onChange={(e) =>
//                           handleInputChange(index, "command", e.target.value)
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Command"
//                       >
//                         <option value="">Select command</option>
//                         <option value="set">SET</option>
//                         <option value="end">END</option>
//                         <option value="reset">RESET</option>
//                         <option value="cycle">CYCLE</option>
//                         <option value="delay">DELAY</option>
//                       </select>
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={row.cellNo}
//                         onChange={(e) =>
//                           handleInputChange(index, "cellNo", e.target.value)
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Cell No"
//                         placeholder="Enter cell number"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={row.cycleNo}
//                         onChange={(e) =>
//                           handleInputChange(index, "cycleNo", e.target.value)
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Cycle No"
//                         placeholder="Enter cycle number"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={row.voltage}
//                         onChange={(e) =>
//                           handleInputChange(index, "voltage", e.target.value)
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Voltage"
//                         placeholder="Enter voltage"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={row.temperature}
//                         onChange={(e) =>
//                           handleInputChange(
//                             index,
//                             "temperature",
//                             e.target.value
//                           )
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Temperature"
//                         placeholder="Enter temperature"
//                       />
//                     </td>
//                     <td className="border border-gray-300 p-2">
//                       <input
//                         type="text"
//                         value={row.time}
//                         onChange={(e) =>
//                           handleInputChange(index, "time", e.target.value)
//                         }
//                         className="w-full p-1 border rounded"
//                         title="Time"
//                         placeholder="Enter time"
//                       />
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             {/* Custom context menu for inserting and deleting row */}
//             {contextMenu && (
//               <div
//                 style={{
//                   position: "fixed",
//                   top: contextMenu.y,
//                   left: contextMenu.x,
//                   zIndex: 1000,
//                   background: "white",
//                   border: "1px solid #ccc",
//                   borderRadius: 4,
//                   boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
//                   padding: 0,
//                 }}
//                 onClick={() => setContextMenu(null)}
//                 onContextMenu={(e) => e.preventDefault()}
//               >
//                 <button
//                   className="px-4 py-2 hover:bg-gray-100 w-full text-left"
//                   onClick={() => {
//                     insertRow(contextMenu.rowIndex);
//                     setContextMenu(null);
//                   }}
//                 >
//                   Insert Row
//                 </button>
//                 <button
//                   className="px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
//                   onClick={() => {
//                     deleteRow(contextMenu.rowIndex);
//                     setContextMenu(null);
//                   }}
//                   disabled={instructions.length === 1}
//                   title={
//                     instructions.length === 1 ? "At least one row required" : ""
//                   }
//                 >
//                   Delete Row
//                 </button>
//               </div>
//             )}
//           </div>
//           <button
//             onClick={addRow}
//             className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//           >
//             Add Row
//           </button>

//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">
//               Notes/Instructions:
//             </label>
//             <textarea
//               value={notes}
//               onChange={(e) => setNotes(e.target.value)}
//               className="w-full p-2 border rounded h-24"
//               placeholder="Enter additional instructions or notes here..."
//             />
//           </div>

//           <div className="flex justify-end gap-4">
//             <button
//               onClick={handleLoadFile}
//               className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
//             >
//               Load File
//             </button>
//             <button
//               onClick={handleSave}
//               className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//             >
//               Save
//             </button>
//             <input
//               type="file"
//               ref={fileInputRef}
//               onChange={handleFileChange}
//               className="hidden-file-input"
//               accept=".json"
//               title="Load instructions JSON file"
//               placeholder="Select a JSON file"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Settings;

import React, { useState, useRef, useEffect } from "react";
import MenuBar from "../components/MenuBar";

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

const startStepOptions = [
  "Step 1",
  "Step 2",
  "Step 3",
  "Step 4",
  "Step 5",
  "Step 6",
];

const Settings: React.FC = () => {
  const [instructions, setInstructions] = useState<SetInstruction[]>([
    {
      id: 1,
      command: "",
      param1: "",
      param2: "",
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
      return prev.filter((_, i) => i !== index);
    });
  };

  const addRow = () => {
    const maxId = instructions.reduce((max, row) => Math.max(max, row.id), 0);
    const newRow: SetInstruction = {
      id: maxId + 1,
      command: "",
      param1: "",
      param2: "",
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
            const validData = data.map((item, index) => ({
              id: index + 1,
              command: item.command || "",
              param1: item.param1 || "",
              param2: item.param2 || "",
              cellNo: item.cellNo || "",
              cycleNo: item.cycleNo || "",
              voltage: item.voltage || "",
              temperature: item.temperature || "",
              time: item.time || "",
            }));
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
    link.download = `instructions_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    alert("Instructions saved successfully.");
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <MenuBar />

      <div className="flex-1 p-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h2 className="text-lg font-semibold mb-2">Set Instructions</h2>
          <div
            className="mb-4 instructions-table-scroll"
            style={{ maxHeight: 320, overflowY: "auto", position: "relative" }}
          >
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border border-gray-300 p-2">No</th>
                  <th className="border border-gray-300 p-2">Command</th>
                  <th className="border border-gray-300 p-2">Param 1</th>
                  <th className="border border-gray-300 p-2">Param 2</th>
                  <th className="border border-gray-300 p-2">Cell No</th>
                  <th className="border border-gray-300 p-2">Voltage</th>
                  <th className="border border-gray-300 p-2">Temperature</th>
                  <th className="border border-gray-300 p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {instructions.map((row, index) => (
                  <tr
                    key={`row-${row.id}-${index}`}
                    data-index={index}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setContextMenu({
                        x: e.clientX,
                        y: e.clientY,
                        rowIndex: index,
                      });
                    }}
                  >
                    <td className="border border-gray-300 p-2">{index + 1}</td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={row.command}
                        onChange={(e) =>
                          handleInputChange(index, "command", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        title="Command"
                      >
                        <option value="">Select command</option>
                        <option value="set">SET</option>
                        <option value="end">END</option>
                        <option value="reset">RESET</option>
                        <option value="cycle">CYCLE</option>
                        <option value="delay">DELAY</option>
                      </select>
                    </td>
                    {/* Param 1 */}
                    <td className="border border-gray-300 p-2">
                      {row.command === "cycle" ? (
                        <select
                          value={row.param1}
                          onChange={(e) =>
                            handleInputChange(index, "param1", e.target.value)
                          }
                          className="w-full p-1 border rounded"
                          title="Start Step"
                        >
                          <option value="">Select start step</option>
                          {startStepOptions.map((step) => (
                            <option key={step} value={step}>
                              {step}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value=""
                          disabled
                          className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed"
                          title="Param 1 only available for cycle"
                          placeholder="Unavailable"
                          readOnly
                        />
                      )}
                    </td>
                    {/* Param 2 */}
                    <td className="border border-gray-300 p-2">
                      {row.command === "cycle" ? (
                        <input
                          type="text"
                          value={row.param2}
                          onChange={(e) =>
                            handleInputChange(index, "param2", e.target.value)
                          }
                          className="w-full p-1 border rounded"
                          title="Cycle Index"
                          placeholder="Enter cycle index"
                        />
                      ) : (
                        <input
                          type="text"
                          value=""
                          disabled
                          className="w-full p-1 border rounded bg-gray-100 cursor-not-allowed"
                          title="Param 2 only available for cycle"
                          placeholder="Unavailable"
                          readOnly
                        />
                      )}
                    </td>
                    <td className="border border-gray-300 p-2">
                      <select
                        value={row.cellNo}
                        onChange={(e) =>
                          handleInputChange(index, "cellNo", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        title="Cell No"
                      >
                        <option value="">Select cell</option>
                        {Array.from({ length: 24 }, (_, i) => (
                          <option key={i + 1} value={String(i + 1)}>
                            {i + 1}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={row.voltage}
                        onChange={(e) =>
                          handleInputChange(index, "voltage", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        title="Voltage"
                        placeholder="Enter voltage"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={row.temperature}
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "temperature",
                            e.target.value
                          )
                        }
                        className="w-full p-1 border rounded"
                        title="Temperature"
                        placeholder="Enter temperature"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input
                        type="text"
                        value={row.time}
                        onChange={(e) =>
                          handleInputChange(index, "time", e.target.value)
                        }
                        className="w-full p-1 border rounded"
                        title="Time"
                        placeholder="Enter time"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Custom context menu for inserting and deleting row */}
            {contextMenu && (
              <div
                style={{
                  position: "fixed",
                  top: contextMenu.y,
                  left: contextMenu.x,
                  zIndex: 1000,
                  background: "white",
                  border: "1px solid #ccc",
                  borderRadius: 4,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                  padding: 0,
                }}
                onClick={() => setContextMenu(null)}
                onContextMenu={(e) => e.preventDefault()}
              >
                <button
                  className="px-4 py-2 hover:bg-gray-100 w-full text-left"
                  onClick={() => {
                    insertRow(contextMenu.rowIndex);
                    setContextMenu(null);
                  }}
                >
                  Insert Row
                </button>
                <button
                  className="px-4 py-2 hover:bg-gray-100 w-full text-left text-red-600"
                  onClick={() => {
                    deleteRow(contextMenu.rowIndex);
                    setContextMenu(null);
                  }}
                  disabled={instructions.length === 1}
                  title={
                    instructions.length === 1 ? "At least one row required" : ""
                  }
                >
                  Delete Row
                </button>
              </div>
            )}
          </div>
          <button
            onClick={addRow}
            className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Row
          </button>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Notes/Instructions:
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded h-24"
              placeholder="Enter additional instructions or notes here..."
            />
          </div>

          <div className="flex justify-end gap-4">
            <button
              onClick={handleLoadFile}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Load File
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Save
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden-file-input"
              accept=".json"
              title="Load instructions JSON file"
              placeholder="Select a JSON file"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
