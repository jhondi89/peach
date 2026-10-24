/* posteriorTarea仍En推进, peroSinTotal量puede言时 Loading Dots(`peach-web-ui`). 
 *
 * No用 Spinner: Spinner SoloComentarios用户刚刚点abajoeseunoabajo. 也No画Sin分母Progreso. 
 * tres点错相由 `../styles.css`  `dot-wave-*` 给, 减menos动效时Todo局Regla关掉动画. 
 *
 * `inline` eseuno档住En按钮dentro("载入更más"按abajo去之posterior): 按钮dentroNo能放段落, 换成行interior元素, 
 * Tamaño de fuente跟着按钮走.  */

export function LoadingDots({ label, inline = false }: { label: string; inline?: boolean }) {
  const dots = (
    <span aria-hidden className="inline-flex shrink-0 items-center gap-1">
      <i className="dot-wave-0 size-1 rounded-full bg-current" />
      <i className="dot-wave-1 size-1 rounded-full bg-current" />
      <i className="dot-wave-2 size-1 rounded-full bg-current" />
    </span>
  );
  if (inline) return <span role="status" className="inline-flex items-center gap-2">{dots}{label}</span>;
  return (
    <p role="status" className="flex min-w-0 items-center gap-2 text-caption-1-regular text-text-secondary">
      {dots}
      <span className="min-w-0 wrap-anywhere">{label}</span>
    </p>
  );
}
