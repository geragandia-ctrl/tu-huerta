export const MATERIALES_ITEMS = [
  { key: 'taller_capacitacion', label: 'Taller de capacitación', icon: '📚' },
  { key: 'semillas', label: 'Semillas de estación', icon: '🌾' },
  { key: 'herramientas', label: 'Kit de herramientas', icon: '🛠️' },
  { key: 'certificacion', label: 'Certificación', icon: '📜' },
] as const

export type MaterialKey = (typeof MATERIALES_ITEMS)[number]['key']
