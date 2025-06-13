import React, { useEffect, useState } from "react";

const SerialTerminal: React.FC = () => {
  const [ports, setPorts] = useState<string[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [baudRate, setBaudRate] = useState<number>(9600);
  const [isOpen, setIsOpen] = useState(false);
  const [sendText, setSendText] = useState("");
  const [received, setReceived] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  // List available ports on mount
  useEffect(() => {
    // @ts-ignore
    window.serialAPI.listPorts().then((ports: string[]) => {
      setPorts(ports);
      if (ports.length > 0) setSelectedPort(ports[0]);
    });
    // Listen for incoming serial data
    // @ts-ignore
    window.serialAPI.onSerialData((data: string) => {
      setReceived((prev) => [...prev, data]);
    });
  }, []);

  // Open selected port
  const handleOpen = async () => {
    setError(null);
    try {
      // @ts-ignore
      await window.serialAPI.openPort(selectedPort, baudRate);
      setIsOpen(true);
    } catch (err: any) {
      setError("Failed to open port: " + err.message);
    }
  };

  // Close port
  const handleClose = async () => {
    setError(null);
    try {
      // @ts-ignore
      await window.serialAPI.closePort();
      setIsOpen(false);
    } catch (err: any) {
      setError("Failed to close port: " + err.message);
    }
  };

  // Send data
  const handleSend = async () => {
    setError(null);
    try {
      // @ts-ignore
      await window.serialAPI.writePort(sendText);
      setSendText("");
    } catch (err: any) {
      setError("Failed to send data: " + err.message);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Serial Terminal</h2>
      <div className="mb-4 flex gap-2">
        <label htmlFor="serial-port-select" className="sr-only">
          Serial Port
        </label>
        <select
          id="serial-port-select"
          value={selectedPort}
          onChange={(e) => setSelectedPort(e.target.value)}
          disabled={isOpen}
          className="border rounded px-2 py-1"
        >
          {ports.map((port) => (
            <option key={port} value={port}>
              {port}
            </option>
          ))}
        </select>
        <input
            id="baud-rate-input"
            placeholder="Baud Rate"
          type="number"
          value={baudRate}
          onChange={(e) => setBaudRate(Number(e.target.value))}
          disabled={isOpen}
          className="border rounded px-2 py-1 w-28"
          min={1200}
          max={115200}
        />
        {!isOpen ? (
          <button
            onClick={handleOpen}
            className="bg-green-600 text-white px-3 py-1 rounded"
            disabled={!selectedPort}
          >
            Open
          </button>
        ) : (
          <button
            onClick={handleClose}
            className="bg-red-600 text-white px-3 py-1 rounded"
          >
            Close
          </button>
        )}
      </div>
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={sendText}
          onChange={(e) => setSendText(e.target.value)}
          className="border rounded px-2 py-1 flex-1"
          placeholder="Type data to send"
          title="Type data to send"
          disabled={!isOpen}
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-3 py-1 rounded"
          disabled={!isOpen || !sendText}
        >
          Send
        </button>
      </div>
      {error && <div className="text-red-600 mb-2">{error}</div>}
      <div className="border rounded p-2 h-40 overflow-y-auto bg-gray-50">
        <div className="font-mono text-xs">
          {received.length === 0 && <div className="text-gray-400">No data received yet.</div>}
          {received.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SerialTerminal;