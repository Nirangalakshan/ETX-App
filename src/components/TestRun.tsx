// Place this under your port configuration section

import React, { useRef, useState } from "react";

const InstructionRunner: React.FC = () => {
  const [instructions, setInstructions] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLoadFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          setInstructions(data);
        } else {
          alert("Invalid file format. Please use a JSON array.");
        }
      } catch {
        alert("Error parsing file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleRunInstructions = () => {
    // TODO: Send instructions to your main process or serial logic
    alert("Running instructions (implement your logic here)");
    // Example: window.serialAPI.runInstructions(instructions);
  };

  return (
    <div className="mt-8 p-4 border rounded bg-gray-50">
      <h3 className="font-semibold mb-2 text-lg">Test Run</h3>
      <div className="flex gap-2 mb-2">
        <button
          onClick={handleLoadFile}
          className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Load Instruction File
        </button>
        <button
          onClick={handleRunInstructions}
          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          disabled={instructions.length === 0}
        >
          Run Instructions
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".json"
          title="Load instruction JSON file"
        />
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