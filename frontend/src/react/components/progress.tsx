/* ya知Total量Progreso. ActualizarDescargar, Tarea活动yEstadísticaspágina覆盖率, Capacidad共用esteuno. 
 *
 * Registrarse表dentroSinProgreso组件, 用 SVG 矩形画: ancho度按Relación写进 `rect` 属性, No用interior联样, 
 * 也就No必给 `no-inline-styles` 开例exterior. 差异登记En `../boardui/ORIGIN.md`. 
 *
 * 画布固定 `SCALE` 格ancho, Introduce充y刻度都先换算成它数; 读屏值照给真实单. 按字节计
 * Capacidades10 mil100 millones量级, 它直continuar写成 `viewBox` ancho, Chrome 画出来矩形esceroancho.  */

/** 画布ancho度: Introduce充 y 刻度都换算成este么más.  */
const SCALE = 100;
/** uno道刻度ancho度, 按 `SCALE` 计.  */
const STOP_WIDTH = 0.4;

export function Progress({ label, value, max = 100, stops = [] }: { label: string; value: number; max?: number; stops?: number[] }) {
  const total = max > 0 ? max : 1;
  const clamp = (at: number) => Math.min(Math.max(Number.isFinite(at) ? at : 0, 0), total);
  const share = (at: number) => (clamp(at) / total) * SCALE;
  /* 读屏值同Imagenuno样carpetaEn [0, max]: 超额Completado读成"150 / 100"会被当成算错.  */
  return (
    <svg role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={total} aria-valuenow={clamp(value)}
      viewBox={`0 0 ${SCALE} 1`} preserveAspectRatio="none" className="h-1.5 w-full overflow-hidden rounded-full">
      <rect width={SCALE} height={1} className="fill-background-tertiary-default" />
      <rect width={share(value)} height={1} className="fill-border-focus-ring" />
      {stops.map((stop) => <rect key={stop} x={share(stop)} width={STOP_WIDTH} height={1} className="fill-background-secondary-default" />)}
    </svg>
  );
}
