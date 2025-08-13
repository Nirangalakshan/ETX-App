import React, { useState, useEffect } from 'react';
import { ResponseData } from './test';
import { getCellStatus, CellStatus } from '../utils/cellStatusUtils';

interface ErrorWarningItem {
  label: string;
  status: CellStatus;
  details?: string;
}

interface ErrorWarningPanelProps {
  csu1Data?: Record<number, ResponseData[]>;
  csu2Data?: Record<number, ResponseData[]>;
  daisyData?: Record<number, Record<number, ResponseData[]>>;
}

const ErrorWarningPanel: React.FC<ErrorWarningPanelProps> = ({
  csu1Data = {},
  csu2Data = {},
  daisyData = {}
}) => {
  const [errors, setErrors] = useState<ErrorWarningItem[]>([]);
  const [warnings, setWarnings] = useState<ErrorWarningItem[]>([]);
  const [normals, setNormals] = useState<ErrorWarningItem[]>([]);

  useEffect(() => {
    const newErrors: ErrorWarningItem[] = [];
    const newWarnings: ErrorWarningItem[] = [];
    const newNormals: ErrorWarningItem[] = [];

    // Log input data for debugging
    console.log('Input data:', { csu1Data, csu2Data, daisyData });

    // Process CSU1 cells
    if (csu1Data && typeof csu1Data === 'object') {
      Object.entries(csu1Data).forEach(([cellNo, dataItems]) => {
        if (!dataItems || !Array.isArray(dataItems)) {
          console.warn(`CSU1 - Cell ${cellNo}: Invalid dataItems`);
          return;
        }
        console.log(`CSU1 - Cell ${cellNo} dataItems:`, dataItems);
        const setVoltage = Number(cellNo);
        const setTemperature = null; // Adjust if per-cell set temperature is available
        const { status, details } = getCellStatus(dataItems, setVoltage, setTemperature, 'get_12_csu_volt', 'get_12_csu_temp');
        console.log(`CSU1 - Cell ${cellNo} status:`, status);
        
        if (status === 'critical') {
          newErrors.push({ label: `CSU1 - Cell ${cellNo}`, status, details });
        } else if (status === 'warning') {
          newWarnings.push({ label: `CSU1 - Cell ${cellNo}`, status, details });
        } else if (status === 'normal') {
          newNormals.push({ label: `CSU1 - Cell ${cellNo}`, status, details });
        }
      });
    }

    // Process CSU2 cells
    if (csu2Data && typeof csu2Data === 'object') {
      Object.entries(csu2Data).forEach(([cellNo, dataItems]) => {
        if (!dataItems || !Array.isArray(dataItems)) {
          console.warn(`CSU2 - Cell ${cellNo}: Invalid dataItems`);
          return;
        }
        console.log(`CSU2 - Cell ${cellNo} dataItems:`, dataItems);
        const setVoltage = Number(cellNo);
        const setTemperature = null;
        const { status, details } = getCellStatus(dataItems, setVoltage, setTemperature, 'get_12_csu_volt', 'get_12_csu_temp');
        console.log(`CSU2 - Cell ${cellNo} status:`, status);
        
        if (status === 'critical') {
          newErrors.push({ label: `CSU2 - Cell ${cellNo}`, status, details });
        } else if (status === 'warning') {
          newWarnings.push({ label: `CSU2 - Cell ${cellNo}`, status, details });
        } else if (status === 'normal') {
          newNormals.push({ label: `CSU2 - Cell ${cellNo}`, status, details });
        }
      });
    }

    // Process Daisy Chain cells
    if (daisyData && typeof daisyData === 'object') {
      Object.entries(daisyData).forEach(([icNo, cellMap]) => {
        if (cellMap && typeof cellMap === 'object') {
          Object.entries(cellMap).forEach(([cellNo, dataItems]) => {
            if (!dataItems || !Array.isArray(dataItems)) {
              console.warn(`Daisy Chain IC${icNo} - Cell ${cellNo}: Invalid dataItems`);
              return;
            }
            console.log(`Daisy Chain IC${icNo} - Cell ${cellNo} dataItems:`, dataItems);
            const setVoltage = Number(cellNo);
            const setTemperature = null;
            const { status, details } = getCellStatus(dataItems, setVoltage, setTemperature, 'get_dc_csu_volt', 'get_dc_csu_temp');
            console.log(`Daisy Chain IC${icNo} - Cell ${cellNo} status:`, status);
            
            if (status === 'critical') {
              newErrors.push({ label: `Daisy Chain IC${icNo} - Cell ${cellNo}`, status, details });
            } else if (status === 'warning') {
              newWarnings.push({ label: `Daisy Chain IC${icNo} - Cell ${cellNo}`, status, details });
            } else if (status === 'normal') {
              newNormals.push({ label: `Daisy Chain IC${icNo} - Cell ${cellNo}`, status, details });
            }
          });
        }
      });
    }

    console.log('Processed data:', { errors: newErrors, warnings: newWarnings, normals: newNormals });
    setErrors(newErrors);
    setWarnings(newWarnings);
    setNormals(newNormals);
  }, [csu1Data, csu2Data, daisyData]);

  const renderList = (items: ErrorWarningItem[], color: string, bgColor: string) => (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={index} className={`${bgColor} border rounded-lg p-3 text-sm shadow-sm ${color}`}>
          <strong>{item.label}</strong>
          {item.details && <><br />{item.details}</>}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-5 shadow-md mt-4 space-y-4 overflow-y-auto" style={{ height: 'calc(22vh - 20px)' }}>
      <h2 className="text-xl font-bold text-gray-800">⚠️ Cell Status</h2>

      {errors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-red-600 mb-2 flex items-center gap-2">
            🔴 Critical Errors <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{errors.length}</span>
          </h3>
          {renderList(errors, 'text-red-800', 'bg-red-50 border-red-200')}
        </div>
      )}

      {warnings.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-yellow-600 mb-2 flex items-center gap-2">
            🟡 Warnings <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">{warnings.length}</span>
          </h3>
          {renderList(warnings, 'text-yellow-800', 'bg-yellow-50 border-yellow-200')}
        </div>
      )}

      {normals.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-green-600 mb-2 flex items-center gap-2">
            🟢 Normal <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">{normals.length}</span>
          </h3>
          {renderList(normals, 'text-green-800', 'bg-green-50 border-green-200')}
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && normals.length === 0 && (
        <div className="text-gray-500 text-sm bg-gray-50 border border-gray-200 rounded-lg p-3 text-center">
          No cell status data available.
        </div>
      )}
    </div>
  );
};

export default ErrorWarningPanel;