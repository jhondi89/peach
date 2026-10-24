/** 首次采集的历史范围；值为提交给设置接口的天数，0 表示不限时间。 */
export const FOLLOW_INITIAL_RANGE_OPTIONS = [
  ['0', 'Cualquier fecha'],
  ['7', 'Últimos 7 días'],
  ['30', 'Últimos 30 días'],
  ['90', 'Últimos 90 días'],
] as const satisfies readonly (readonly [value: string, label: string])[];

export type InitialFollowRange = typeof FOLLOW_INITIAL_RANGE_OPTIONS[number][0];
