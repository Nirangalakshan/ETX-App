
import React, { useEffect, useState, useRef } from 'react';
import { useBatteryContext } from '../BatteryContext';

type CellStatus = 'normal' | 'warning' | 'critical' | 'N/A';

interface ErrorWarningItem {
  label: string;
  status: CellStatus;
  details?: string;
}

const VOLTAGE_WARNING_THRESHOLD = 0.1;
const VOLTAGE_CRITICAL_THRESHOLD = 0.2;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

const EXPECTED_SENT_VOLTAGES: Record<number, number> = {
  1: 2.0,
  2: 2.5,
  3: 2.8,
  4: 3.3,
  5: 3.4,
  6: 3.6,
  7: 4.0,
  8: 4.2,
};

const ErrorWarningPanel: React.FC = () => {
  const { cellData, responseData, instructions, csu1Statuses, csu2Statuses, daisyStatuses,  } = useBatteryContext();
  const [localStatuses, setLocalStatuses] = useState<{
    csu1: ErrorWarningItem[];
    csu2: ErrorWarningItem[];
    daisy: ErrorWarningItem[];
  }>({ csu1: [], csu2: [], daisy: [] });
  const prevLocalStatusesRef = useRef<{
    csu1: ErrorWarningItem[];
    csu2: ErrorWarningItem[];
    daisy: ErrorWarningItem[];
  }>({ csu1: [], csu2: [], daisy: [] });

  // Compute local statuses for individual cells with valid data
  useEffect(() => {
    if (!responseData || !Array.isArray(instructions) || !cellData || cellData.length === 0) {
      console.log('Invalid or empty data:', { 
        cellDataLength: cellData?.length, 
        responseDataKeys: responseData ? Object.keys(responseData) : [], 
        instructionsCount: instructions?.length 
      });
      return;
    }

    // Start with previous local statuses to preserve valid data
    const newCsu1Statuses: ErrorWarningItem[] = [...prevLocalStatusesRef.current.csu1];
    const newCsu2Statuses: ErrorWarningItem[] = [...prevLocalStatusesRef.current.csu2];
    const newDaisyStatuses: ErrorWarningItem[] = [...prevLocalStatusesRef.current.daisy];

    cellData.forEach((cell) => {
      const cellData = Array.isArray(responseData[cell.id]) ? responseData[cell.id] : [];
      const cellInstructions = instructions.filter((instr) => {
        const cellNo = parseInt(instr.cellNo, 10);
        return !isNaN(cellNo) && cellNo === cell.id;
      });

      let voltage: number | null = cell.voltage;
      let temperature: number | null = cell.temperature;
      let setVoltage: number | null = cell.setVoltage;
      let setTemperature: number | null = cell.setTemperature;
      let balancing: boolean = cell.balancing;
      let openWire: boolean = cell.openWire;
      let voltageLimits: string | null = cell.voltageLimits;
      let status: CellStatus = 'N/A';

      // Update from responseData (received values)
      if (Array.isArray(cellData)) {
        const voltageData = cellData.find((item) => item.command === 'get_voltage');
        if (voltageData && voltageData.value) {
          const parsedVoltage = parseFloat(voltageData.value);
          if (!isNaN(parsedVoltage)) {
            voltage = parsedVoltage;
          }
        }

        const tempData = cellData.find((item) => item.command === 'get_temp');
        if (tempData && tempData.value) {
          const tempValue = parseFloat(tempData.value.replace(' °C', ''));
          if (!isNaN(tempValue)) {
            temperature = tempValue;
          }
        }

        const voltageLimitsData = cellData.find((item) => item.command === 'get_voltage_limits');
        if (voltageLimitsData && voltageLimitsData.value) {
          voltageLimits = voltageLimitsData.value;
        }
      } else {
        console.warn(`cellData for cell ${cell.id} is not an array:`, cellData);
      }

      // Update from instructions (sent values)
      const setVoltageInstruction = cellInstructions.find((instr) => instr.command === 'set_voltage');
      if (setVoltageInstruction && setVoltageInstruction.voltage) {
        const parsedSetVoltage = parseInt(setVoltageInstruction.voltage, 10);
        setVoltage = parsedSetVoltage >= 1 && parsedSetVoltage <= 8 ? parsedSetVoltage : null;
      } else {
        setVoltage = null;
      }

      const setTempInstruction = cellInstructions.find((instr) => instr.command === 'set_temp');
      if (setTempInstruction && setTempInstruction.temperature) {
        const parsedSetTemp = parseFloat(setTempInstruction.temperature);
        setTemperature = !isNaN(parsedSetTemp) ? parsedSetTemp : null;
      } else {
        setTemperature = null;
      }

      const balanceInstruction = cellInstructions.find((instr) => instr.command === 'set_balance');
      balancing = balanceInstruction ? balanceInstruction.value === '1' : false;

      const openWireInstruction = cellInstructions.find((instr) => instr.command === 'set_ow');
      openWire = openWireInstruction ? openWireInstruction.value === '1' : false;

      // Determine status
      if (voltage !== null && setVoltage !== null && setVoltage in EXPECTED_SENT_VOLTAGES) {
        const expectedVoltage = EXPECTED_SENT_VOLTAGES[setVoltage];
        const voltageGap = Math.abs(expectedVoltage - voltage);
        if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) status = 'critical';
        else if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) status = 'warning';
        else status = 'normal';
      } else if (temperature !== null && setTemperature !== null) {
        const tempGap = Math.abs(setTemperature - temperature);
        if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) status = 'critical';
        else if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) status = 'warning';
        else status = 'normal';
      } else {
        status = 'N/A';
      }

      // Only include cells with non-N/A status
      if (status !== 'N/A') {
        // Build details string
        const details = [
          voltage !== null ? `Voltage: ${voltage} V` : null,
          temperature !== null ? `Temperature: ${temperature.toFixed(1)} °C` : null,
          setVoltage !== null ? `Set Voltage: ${EXPECTED_SENT_VOLTAGES[setVoltage]} V` : null,
          setTemperature !== null ? `Set Temperature: ${setTemperature.toFixed(1)} °C` : null,
          balancing ? `Balancing: ${balancing}` : null,
          openWire ? `Open Wire: ${openWire}` : null,
          voltageLimits !== null ? `Voltage Limits: ${voltageLimits}` : null,
          cell.delay !== null ? `Delay: ${cell.delay} ms` : null,
          cell.cellLed ? `Cell LED: ${cell.cellLed}` : null,
          cell.automaticSequence ? `Automatic Sequence: ${cell.automaticSequence}` : null,
          cell.csu11Voltage !== null ? `CSU11 Voltage: ${cell.csu11Voltage.toFixed(2)} V` : null,
          cell.csu11Temperature !== null ? `CSU11 Temperature: ${cell.csu11Temperature.toFixed(1)} °C` : null,
          cell.csu11Balance ? `CSU11 Balance: ${cell.csu11Balance}` : null,
          cell.csu11OpenWire ? `CSU11 Open Wire: ${cell.csu11OpenWire}` : null,
          cell.csu12Voltage !== null ? `CSU12 Voltage: ${cell.csu12Voltage.toFixed(2)} V` : null,
          cell.csu12Temperature !== null ? `CSU12 Temperature: ${cell.csu12Temperature.toFixed(1)} °C` : null,
          cell.csu12Balance ? `CSU12 Balance: ${cell.csu12Balance}` : null,
          cell.csu12OpenWire ? `CSU12 Open Wire: ${cell.csu12OpenWire}` : null,
          cell.dcCsuVoltage !== null ? `DC CSU Voltage: ${cell.dcCsuVoltage.toFixed(2)} V` : null,
          cell.dcCsuTemperature !== null ? `DC CSU Temperature: ${cell.dcCsuTemperature.toFixed(1)} °C` : null,
          cell.dcCsuBalance ? `DC CSU Balance: ${cell.dcCsuBalance}` : null,
          cell.dcCsuOpenWire ? `DC CSU Open Wire: ${cell.dcCsuOpenWire}` : null,
          cell.daisyChain !== null ? `Daisy Chain: ${cell.daisyChain}` : null,
        ]
          .filter((item) => item !== null)
          .join(', ');

        const statusItem: ErrorWarningItem = {
          label: `Tester Cell: ${cell.id}`,
          status,
          details: details || 'No data available',
        };

        // Update or add status item, preserving valid statuses
        const updateStatusArray = (array: ErrorWarningItem[], item: ErrorWarningItem) => {
          const index = array.findIndex(existing => existing.label === item.label);
          if (index >= 0) {
            // Only update if new status is not 'N/A' or existing status is 'N/A'
            if (item.status !== 'N/A' || array[index].status === 'N/A') {
              array[index] = item;
            }
          } else {
            array.push(item);
          }
        };

        // Group by CSU1 (cells 0-11), CSU2 (cells 12-23), and Daisy Chain
        if (cell.id < 12) {
          updateStatusArray(newCsu1Statuses, statusItem);
        } else if (cell.id < 24) {
          updateStatusArray(newCsu2Statuses, statusItem);
        } else if (cell.daisyChain !== null || cell.id >= 24) {
          updateStatusArray(newDaisyStatuses, statusItem);
        }
      }
    });

    setLocalStatuses({
      csu1: newCsu1Statuses,
      csu2: newCsu2Statuses,
      daisy: newDaisyStatuses,
    });

    // Update previous statuses
    prevLocalStatusesRef.current = {
      csu1: newCsu1Statuses,
      csu2: newCsu2Statuses,
      daisy: newDaisyStatuses,
    };

    console.log('Computed local statuses:', {
      localCsu1: newCsu1Statuses.map(item => ({ label: item.label, status: item.status })),
      localCsu2: newCsu2Statuses.map(item => ({ label: item.label, status: item.status })),
      localDaisy: newDaisyStatuses.map(item => ({ label: item.label, status: item.status })),
      contextCsu1: csu1Statuses.map(item => ({ label: item.label, status: item.status })),
      contextCsu2: csu2Statuses.map(item => ({ label: item.label, status: item.status })),
      contextDaisy: daisyStatuses.map(item => ({ label: item.label, status: item.status })),
      cellDataLength: cellData.length,
      responseDataKeys: Object.keys(responseData),
      instructionsCount: instructions.length,
      statusSummary: {
        local: {
          csu1: {
            critical: newCsu1Statuses.filter(item => item.status === 'critical').length,
            warning: newCsu1Statuses.filter(item => item.status === 'warning').length,
            normal: newCsu1Statuses.filter(item => item.status === 'normal').length,
            na: newCsu1Statuses.filter(item => item.status === 'N/A').length,
          },
          csu2: {
            critical: newCsu2Statuses.filter(item => item.status === 'critical').length,
            warning: newCsu2Statuses.filter(item => item.status === 'warning').length,
            normal: newCsu2Statuses.filter(item => item.status === 'normal').length,
            na: newCsu2Statuses.filter(item => item.status === 'N/A').length,
          },
          daisy: {
            critical: newDaisyStatuses.filter(item => item.status === 'critical').length,
            warning: newDaisyStatuses.filter(item => item.status === 'warning').length,
            normal: newDaisyStatuses.filter(item => item.status === 'normal').length,
            na: newDaisyStatuses.filter(item => item.status === 'N/A').length,
          },
        },
        context: {
          csu1: {
            critical: csu1Statuses.filter(item => item.status === 'critical').length,
            warning: csu1Statuses.filter(item => item.status === 'warning').length,
            normal: csu1Statuses.filter(item => item.status === 'normal').length,
            na: csu1Statuses.filter(item => item.status === 'N/A').length,
          },
          csu2: {
            critical: csu2Statuses.filter(item => item.status === 'critical').length,
            warning: csu2Statuses.filter(item => item.status === 'warning').length,
            normal: csu2Statuses.filter(item => item.status === 'normal').length,
            na: csu2Statuses.filter(item => item.status === 'N/A').length,
          },
          daisy: {
            critical: daisyStatuses.filter(item => item.status === 'critical').length,
            warning: daisyStatuses.filter(item => item.status === 'warning').length,
            normal: daisyStatuses.filter(item => item.status === 'normal').length,
            na: daisyStatuses.filter(item => item.status === 'N/A').length,
          },
        },
      },
      changes: {
        csu1: newCsu1Statuses.length !== prevLocalStatusesRef.current.csu1.length || 
              newCsu1Statuses.some((item, i) => item.status !== prevLocalStatusesRef.current.csu1[i]?.status),
        csu2: newCsu2Statuses.length !== prevLocalStatusesRef.current.csu2.length || 
              newCsu2Statuses.some((item, i) => item.status !== prevLocalStatusesRef.current.csu2[i]?.status),
        daisy: newDaisyStatuses.length !== prevLocalStatusesRef.current.daisy.length || 
               newDaisyStatuses.some((item, i) => item.status !== prevLocalStatusesRef.current.daisy[i]?.status),
      },
    });
  }, [cellData, responseData, instructions]);

  // Merge local and context statuses for display, prioritizing local for individual cells
  const mergedCsu1Statuses = [
    ...localStatuses.csu1,
    ...csu1Statuses.filter(
      contextItem => !localStatuses.csu1.some(localItem => localItem.label === contextItem.label)
    ),
  ];
  const mergedCsu2Statuses = [
    ...localStatuses.csu2,
    ...csu2Statuses.filter(
      contextItem => !localStatuses.csu2.some(localItem => localItem.label === contextItem.label)
    ),
  ];
  const mergedDaisyStatuses = [
    ...localStatuses.daisy,
    ...daisyStatuses.filter(
      contextItem => !localStatuses.daisy.some(localItem => localItem.label === contextItem.label)
    ),
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

  // Filter statuses for errors, warnings, normals, excluding N/A
  const errors = [
    ...mergedCsu1Statuses.filter(item => item.status === 'critical'),
    ...mergedCsu2Statuses.filter(item => item.status === 'critical'),
    ...mergedDaisyStatuses.filter(item => item.status === 'critical'),
  ];

  const warnings = [
    ...mergedCsu1Statuses.filter(item => item.status === 'warning'),
    ...mergedCsu2Statuses.filter(item => item.status === 'warning'),
    ...mergedDaisyStatuses.filter(item => item.status === 'warning'),
  ];

  const normals = [
    ...mergedCsu1Statuses.filter(item => item.status === 'normal'),
    ...mergedCsu2Statuses.filter(item => item.status === 'normal'),
    ...mergedDaisyStatuses.filter(item => item.status === 'normal'),
  ];

  return (
    <div className="w-full bg-white border border-gray-500 rounded-xl p-5 shadow-lg mt-4 space-y-4 overflow-y-auto" style={{ height: 'calc(37vh - 20px)' }}>
      <h2 className="text-xl font-bold text-gray-800">Cell Status</h2>

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