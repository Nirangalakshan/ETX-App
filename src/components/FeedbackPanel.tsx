import React from 'react';

type CellStatus = 'normal' | 'warning' | 'critical';

interface BatteryCell {
  id: number;
  voltage: number;        // actual voltage
  temperature: number;
  status: CellStatus;
  setVoltage: number;     // set voltage value
  balancing: boolean;     // is balancing active
  openWire: boolean;      // open wire status
}

interface FeedbackPanelProps {
  selectedCell: BatteryCell | null;
}

const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ selectedCell }) => {
  // Determine CSU based on cell ID
  const getCSU = (cellId: number) => (cellId < 12 ? 'CSU 1' : 'CSU 2');

  return (
    <div
      className="w-64 bg-gray-200 p-4 ml-4 rounded-lg shadow-lg overflow-y-auto"
      style={{ height: 'calc(100vh - 80px)' }}
    >
      <h3 className="text-lg font-bold mb-2">Feedback to CSU</h3>
      {selectedCell ? (
        <div className="text-sm">
          <p><strong>CSU:</strong> {getCSU(selectedCell.id)}</p>
          <p><strong>Cell ID:</strong> {selectedCell.id}</p>
          <p><strong>Voltage:</strong> {selectedCell.voltage.toFixed(2)} V</p>
          <p><strong>Temperature:</strong> {selectedCell.temperature}°C</p>
          <p><strong>Status:</strong> {selectedCell.status}</p>
          <p><strong>Set Voltage:</strong> {selectedCell.setVoltage.toFixed(2)} V</p>
          <p><strong>Balancing:</strong> {selectedCell.balancing ? 'ON' : 'OFF'}</p>
          <p><strong>Open Wire:</strong> {selectedCell.openWire ? 'Detected' : 'None'}</p>
        </div>
      ) : (
        <p className="text-gray-500">Select a cell to see feedback</p>
      )}
    </div>
  );
};

export default FeedbackPanel;