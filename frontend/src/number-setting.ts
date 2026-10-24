/** 数值偏bien读回判据: Completo数且落En区间dentro才算数, 否则退回 `fallback`. 
 *  壳En启动时归uno化 `appSettings` 用它, Configuración面板数值Controles(`react/settings-panel/number-setting.tsx`)也用它.  */
export function boundedPreference(value: number, min: number, max: number, fallback: number): number {
  return Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}
