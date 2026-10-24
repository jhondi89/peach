/* 雪碧Imagenen launo字形, 写法同遗Deja层 `icon()`(`src/core/index.ts`): 尺寸y描边由样表按Ubicación给.  */
import { iconGeometry } from '../../core/icon-geometry';

export function Icon({ name }: { name: string }) {
  const {wide,viewBox} = iconGeometry(name);
  return <svg viewBox={viewBox} className={wide ? 'iconwide' : undefined} aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

/* Configuración分区eseuno排取自 Remix: 它ese套线Condiciónes靠 `fill` 画出来轮廓, Noes描边. Todo站Predeterminado
   `stroke:currentColor;fill:none` 会让它Completo消失, `settings-panel.css` 给izquierda栏esteuno列反过来写.  */
export function RemixIcon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#${name}`} /></svg>;
}
