// ErrorWarningPanel.tsx
import React from 'react';
import { useBatteryContext } from '../BatteryContext';

type CellStatus = 'normal' | 'warning' | 'critical' | 'N/A';

interface ErrorWarningItem {
  label: string;
  status: CellStatus;
  details?: string;
}

const ErrorWarningPanel: React.FC = () => {
  const { csu1Statuses, csu2Statuses, daisyStatuses } = useBatteryContext();

  const errors = [
    ...csu1Statuses.filter(item => item.status === 'critical'),
    ...csu2Statuses.filter(item => item.status === 'critical'),
    ...daisyStatuses.filter(item => item.status === 'critical'),
  ];

  const warnings = [
    ...csu1Statuses.filter(item => item.status === 'warning'),
    ...csu2Statuses.filter(item => item.status === 'warning'),
    ...daisyStatuses.filter(item => item.status === 'warning'),
  ];

  const normals = [
    ...csu1Statuses.filter(item => item.status === 'normal'),
    ...csu2Statuses.filter(item => item.status === 'normal'),
    ...daisyStatuses.filter(item => item.status === 'normal'),
  ];

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