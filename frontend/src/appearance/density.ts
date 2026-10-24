/* 卡片密度: grandeImagenComo主, 密集Como辅. 值存En自己Clave(`density`)arriba, NoEn偏bien对象dentro. 
 *
 * 写es <html> en la `--tile`(uno格模Ancho)y <body> en la `data-density`, 以及顶栏eseTamañoImagenClave
 * (`#density`)按abajo态, Sugerenciay字形. 壳En模体dentroSincronizar调 `applyDensity()`, No.uno帧之anterior就写bien.  */
import { iconSwapHtml, setIconSwap } from '@peach/legacy/ui';

import { PHOTO_SIZES } from './layout';

export type Density = 'big' | 'dense';
const DENSITY_KEY = 'density';
/** 168px es模单, grandeImagen两格.  */
export const TILES: Readonly<Record<Density, string>> = { big: '336px', dense: '168px' };

/** 存Noes认得ese两档时按grandeImagen算.  */
export const currentDensity = (): Density => (localStorage.getItem(DENSITY_KEY) === 'dense' ? 'dense' : 'big');

/* 顶栏esteClave y Filtrar框en la版开关问同uno件事"现Enes哪排法", 所以字形也取同uno映射
   (PHOTO_SIZES No.tres), 按abajo去跟着换成当anteriorEstadoImagen标.  */
function paintSizeGlyph(button: HTMLElement, size: string): void {
  const [big, small] = PHOTO_SIZES;
  if (!button.querySelector('[data-icon-swap]')) button.innerHTML = iconSwapHtml(big[2], small[2], size === small[0] ? 'b' : 'a');
  else setIconSwap(button, size === small[0] ? 'b' : 'a');
  button.setAttribute('aria-label', size === 'big' ? 'CambiarComoImagen pequeña' : 'CambiarComoImagen grande');
}

const densityButton = (): HTMLElement | null => document.querySelector<HTMLElement>('#density');

export function applyDensity(density: Density = currentDensity()): void {
  document.documentElement.style.setProperty('--tile', TILES[density]);
  document.body.dataset.density = density;
  const button = densityButton();
  if (!button) return;
  button.setAttribute('aria-pressed', String(density === 'dense'));
  button.title = 'Actual:' + (density === 'big' ? 'Imagen grande' : 'Compacto');
  paintSizeGlyph(button, density === 'big' ? 'big' : 'small');
}

/** 换uno档密度, 落盘, 当场写arriba.  */
export function toggleDensity(): void {
  const next: Density = currentDensity() === 'big' ? 'dense' : 'big';
  localStorage.setItem(DENSITY_KEY, next);
  applyDensity(next);
}

/** 停En照片Muroarriba时, 同unoClave报es照片Tamaño.  */
export function paintPhotoSizeButton(size: string): void {
  const button = densityButton();
  if (!button) return;
  button.setAttribute('aria-pressed', String(size === 'small'));
  button.title = 'Actual:' + (size === 'big' ? 'Imagen grande' : 'Imagen pequeña');
  paintSizeGlyph(button, size);
}
