// Periodi storici disponibili nel sistema
export const HISTORICAL_PERIODS = [
  { value: 'preistoria', label: 'Preistoria' },
  { value: 'età-antica', label: 'Età Antica' },
  { value: 'medioevo', label: 'Medioevo' },
  { value: 'età-moderna', label: 'Età Moderna' },
  { value: 'età-contemporanea', label: 'Età Contemporanea' },
  { value: 'contemporaneo-1960', label: 'Contemporaneo dal 1960' },
] as const;

export type PeriodValue = typeof HISTORICAL_PERIODS[number]['value'];
