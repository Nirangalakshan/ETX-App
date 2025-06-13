import React from 'react';

export interface BatteryCellProps {
  id: number;
  voltage: number;
  temperature: number;
  status: 'normal' | 'warning' | 'critical';
}

const BatteryCell: React.FC<BatteryCellProps> = ({ id, voltage, temperature, status }) => {
  const getColor = () => {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div
      className={`w-full h-[40px] ${getColor()} border border-white text-xs flex items-center justify-between px-2 rounded my-1`}
      title={`Cell ${id}\nVoltage: ${voltage}V\nTemp: ${temperature}°C`}
    >
      <span>#{id}</span>
      <span>{voltage.toFixed(2)}V</span>
      <span>{temperature.toFixed(1)}°C</span>
    </div>
  );
};

export default BatteryCell;
