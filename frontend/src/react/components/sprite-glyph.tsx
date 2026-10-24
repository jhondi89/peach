/* 遗Deja雪碧Imagen(`web/index.html`  `#i-*` symbol)en la字形, 做成 y  Remix Imagen标同形组件. 
 *
 * primero屏骨架由遗Deja层画, 字形取就es雪碧Imagen: página面continuar管时换成 Remix dentro形状Recienteese几, 
 * esteuno排会En骨架换成正文eseuno拍跳unoabajo(方勾变圆勾, uno叠Archivo变两página纸). 所以骨架dentro
 * 出现过字形, continuar管posterior仍取同uno. 尺寸由宿主给(BoardUI `Button` 按档传 `size-*`). 
 *
 * ancho字形("Aa"es 1.4:1) viewBox 跟着 symbol Relación走, 同遗Deja层 `icon()` 
 * 共用几何定义; 宿主决定alto度, ancho度由字形Relación决定.  */
import type { ComponentType } from 'react';
import { iconGeometry } from '../../core/icon-geometry';

export type Glyph = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;

const cache = new Map<string, Glyph>();

export function spriteGlyph(name: string): Glyph {
  const known = cache.get(name);
  if (known) return known;
  const {wide,viewBox} = iconGeometry(name);
  const Sprite: Glyph = wide
    ? ({ className }) => (
      <svg aria-hidden viewBox={viewBox}
        className={`iconwide shrink-0 fill-current ${className ?? 'h-4 w-auto'}`}>
        <use href={`#i-${name}`} />
      </svg>
    )
    : ({ className }) => (
      <svg aria-hidden viewBox="0 0 24 24" fill="none" strokeLinecap="round" strokeLinejoin="round"
        className={`shrink-0 stroke-current stroke-2 ${className ?? 'size-4'}`}>
        <use href={`#i-${name}`} />
      </svg>
    );
  Sprite.displayName = `SpriteGlyph(${name})`;
  cache.set(name, Sprite);
  return Sprite;
}
