import { ResponseData } from '../components/test';

export type CellStatus = 'normal' | 'warning' | 'critical' | 'N/A';

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

const VOLTAGE_WARNING_THRESHOLD = 0.01;
const VOLTAGE_CRITICAL_THRESHOLD = 0.02;
const TEMPERATURE_WARNING_THRESHOLD = 5;
const TEMPERATURE_CRITICAL_THRESHOLD = 10;

export function getCellStatus(
  dataItems: ResponseData[],
  setVoltage: number | null,
  setTemperature: number | null,
  voltageCommand: string,
  tempCommand: string
): { status: CellStatus; details?: string } {
  if (!dataItems || !Array.isArray(dataItems) || dataItems.length === 0) {
    console.warn('Invalid or empty dataItems for getCellStatus');
    return { status: 'N/A' };
  }

  const voltageItem = dataItems.find((item) => item.command === voltageCommand);
  const tempItem = dataItems.find((item) => item.command === tempCommand);
  const voltage = voltageItem ? parseFloat(voltageItem.value) : null;
  const temp = tempItem ? parseFloat(tempItem.value.replace(' °C', '')) : null;

  const details = `Voltage: ${voltage !== null ? voltage.toFixed(3) : 'N/A'}V, Temperature: ${temp !== null ? temp.toFixed(1) : 'N/A'}°C`;

  if (voltage !== null && setVoltage !== null && setVoltage in EXPECTED_SENT_VOLTAGES) {
    const expectedVoltage = EXPECTED_SENT_VOLTAGES[setVoltage];
    console.log(`Calculating voltage gap for setVoltage ${setVoltage}: expected=${expectedVoltage}, actual=${voltage}`);
    const voltageGap = Math.abs(expectedVoltage - voltage);
    if (voltageGap >= VOLTAGE_CRITICAL_THRESHOLD) {
      return { status: 'critical', details: `${details}, Voltage gap: ${voltageGap.toFixed(3)}V` };
    }
    if (voltageGap >= VOLTAGE_WARNING_THRESHOLD) {
      return { status: 'warning', details: `${details}, Voltage gap: ${voltageGap.toFixed(3)}V` };
    }
  } else {
    console.warn(`Invalid setVoltage ${setVoltage} or missing in EXPECTED_SENT_VOLTAGES`);
  }

  if (temp !== null && setTemperature !== null) {
    const tempGap = Math.abs(setTemperature - temp);
    if (tempGap >= TEMPERATURE_CRITICAL_THRESHOLD) {
      return { status: 'critical', details: `${details}, Temp gap: ${tempGap.toFixed(1)}°C` };
    }
    if (tempGap >= TEMPERATURE_WARNING_THRESHOLD) {
      return { status: 'warning', details: `${details}, Temp gap: ${tempGap.toFixed(1)}°C` };
    }
  }

  return { status: 'normal', details };
}