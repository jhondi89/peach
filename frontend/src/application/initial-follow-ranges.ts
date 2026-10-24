/** primero次RecolectarHistorialRango; 值Como提交给ConfiguraciónInterfaz天数, 0 表示No限Tiempo.  */
export const FOLLOW_INITIAL_RANGE_OPTIONS = [
  ['0', 'Sin límite de tiempo'],
  ['7', 'Últimos 7 días'],
  ['30', 'Últimos 30 días'],
  ['90', 'Últimos 90 días'],
] as const satisfies readonly (readonly [value: string, label: string])[];

export type InitialFollowRange = typeof FOLLOW_INITIAL_RANGE_OPTIONS[number][0];
