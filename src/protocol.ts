export interface SetInstruction {
  id: number;
  command: string;
  param1: string;
  param2: string;
  cellNo: string;
  cycleNo: string;
  voltage: string;
  temperature: string;
  time: string;
  protocolValue?: string;
}

export const validCommands = [
  "set_voltage",
  "set_temp",
  "set_balance",
  "set_ow",
  "delay",
  "cycle",
  "end",
  "get_voltage",
  "get_current",
  "get_temperature",
  "get_11_csu_volt",
  "get_12_csu_volt",
  "get_11_csu_ow",
  "get_12_csu_ow",
  "get_11_csu_balance",
  "get_12_csu_balance",
  "get_11_csu_temp",
  "get_12_csu_temp",
  "daisy_chain",
  "reset",
  "cell_led",
];

export const commandToHex: Record<string, string> = {
  set_voltage: "01",
  set_temp: "02",
  set_balance: "03",
  set_ow: "04",
  daisy_chain: "05",
  delay: "06",
  cell_led: "07",
  // Note: "Automatic sequence" (0x08) not included as it's not in validCommands
};

export const protocolMap: Record<string, (instruction: SetInstruction) => string> = {
  set_voltage: ({ cellNo, voltage }) => {
    const cell = parseInt(cellNo);
    const volt = parseFloat(voltage) * 100; // e.g., 3.65V -> 365
    if (isNaN(cell) || cell < 1 || cell > 23 || isNaN(volt) || volt < 100 || volt > 800) {
      return "";
    }
    return `0301${cell.toString(16).padStart(2, '0')}${Math.round(volt).toString(16).padStart(4, '0')}`;
  },
  set_temp: ({ cellNo, temperature }) => {
    const cell = parseInt(cellNo);
    const temp = parseFloat(temperature) * 10; // e.g., 25.0C -> 250
    if (isNaN(cell) || cell < 1 || cell > 6 || isNaN(temp)) return "";
    return `0302${cell.toString(16).padStart(2, '0')}${Math.round(temp).toString(16).padStart(4, '0')}`;
  },
  set_balance: ({ cellNo }) => {
    const cell = parseInt(cellNo);
    if (isNaN(cell) || cell < 1 || cell > 23) return "";
    return `0303${cell.toString(16).padStart(2, '0')}01`;
  },
  set_ow: ({ cellNo }) => {
    const cell = parseInt(cellNo);
    if (isNaN(cell) || cell < 1 || cell > 24) return "";
    return `0304${cell.toString(16).padStart(2, '0')}01`;
  },
  daisy_chain: ({ param1 }) => {
    const value = parseInt(param1);
    if (isNaN(value) || (value !== 0 && value !== 1)) return "";
    return `0305${value.toString(16).padStart(2, '0')}`;
  },
  delay: ({ time }) => {
    const ms = parseInt(time);
    if (isNaN(ms) || ms <= 0) return "";
    return `0306${ms.toString(16).padStart(4, '0')}`;
  },
  cell_led: ({ cellNo }) => {
    const cell = parseInt(cellNo);
    if (isNaN(cell) || cell < 1 || cell > 23) return "";
    return `0307${cell.toString(16).padStart(2, '0')}`;
  },
  cycle: ({ param1, param2 }) => {
    const step = parseInt(param1.replace("Step ", ""));
    const count = parseInt(param2);
    if (isNaN(step) || isNaN(count) || step < 1 || count <= 0) return "";
    return `06${step.toString(16).padStart(2, '0')}${count.toString(16).padStart(2, '0')}`;
  },
  end: () => "07",
  get_voltage: ({ cellNo }) => {
    const cell = parseInt(cellNo);
    if (isNaN(cell) || cell < 1 || cell > 23) return "";
    return `08${cell.toString(16).padStart(2, '0')}`;
  },
  get_current: () => "09",
  get_temperature: ({ cellNo }) => {
    const cell = parseInt(cellNo);
    if (isNaN(cell) || cell < 1 || cell > 6) return "";
    return `0A${cell.toString(16).padStart(2, '0')}`;
  },
  get_11_csu_volt: () => "0B",
  get_12_csu_volt: () => "0C",
  get_11_csu_ow: () => "0D",
  get_12_csu_ow: () => "0E",
  get_11_csu_balance: () => "0F",
  get_12_csu_balance: () => "10",
  get_11_csu_temp: () => "11",
  get_12_csu_temp: () => "12",
  reset: () => "14",
};