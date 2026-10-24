/* 雪碧Imagen(`web/index.html`  `#i-*` symbol)en launo字形, 写法同遗Deja层 `icon()`: 尺寸y描边
 * 由 `./entity-hero.css` 按Ubicación给. 横向站点标识(JavDB esees 326:111)viewBox 跟着 symbol
 * Relación走, 槽按alto定ancho.  */
import { iconGeometry } from '../../core/icon-geometry';

export function Glyph({ name }: { name: string }) {
  const {wide,viewBox} = iconGeometry(name);
  return (
    <svg viewBox={viewBox} aria-hidden="true"
      data-glyph={wide ? 'wide' : undefined}>
      <use href={`#i-${name}`} />
    </svg>
  );
}
