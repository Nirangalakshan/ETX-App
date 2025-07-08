interface Cell {
  id: number;
  voltage: number | null;
  temperature: number | null;
  status: "normal" | "warning" | "critical";
  data: {
    min: number;
    max: number;
    raw?: string;
  };
}