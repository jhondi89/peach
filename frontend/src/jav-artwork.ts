export type JavImagePreference = 'cover' | 'thumbnail';
export type JavLayout = 'big' | 'small';

export function normalizeJavLayout(value: unknown): JavLayout {
  return ['small', 'sleeve', 'preview'].includes(String(value)) ? 'small' : 'big';
}

export function normalizeJavPreferences(settings: { javLayout?: unknown; javImage?: unknown }) {
  return {
    javLayout: normalizeJavLayout(settings.javLayout),
    javImage: normalizeJavImage(settings.javLayout === 'preview' ? 'thumbnail' : settings.javImage),
  };
}

export function normalizeJavImage(value: unknown): JavImagePreference {
  return value === 'thumbnail' ? 'thumbnail' : 'cover';
}

export function javImageKind(item: { is_jav?: boolean; code?: string; has_cover?: boolean; has_thumb?: boolean }, preference: unknown): 'cover' | 'thumbnail' | '' {
  const cover = Boolean(item.is_jav && item.code && item.has_cover);
  if (cover && (normalizeJavImage(preference) === 'cover' || !item.has_thumb)) return 'cover';
  return item.has_thumb ? 'thumbnail' : '';
}

/** 正封anchoalto比y `jav_poster_crop.PANEL_ASPECT` uno致. Portada框选按它锁Relación; Sin边车双página封套按它从derecha缘量回正封
 *  ancho度, 贴derecha缘时 0.75 卡片比正封ancho, No量就会带进uno书脊.  */
export const PANEL_ASPECT = 0.704;
// y jav_poster_crop ancho封套模板共用尺寸; 明确 Blu-ray 版次才启用. 
export const WIDE_PANEL_ASPECT = 0.85;
export const WIDE_SLEEVE_RATIO_MIN = 1.75;
export const WIDE_SLEEVE_RATIO_MAX = 1.85;

/** Interfaz `poster_box` 形状: `x0/y0/x1/y1` es源Imagen像素坐标, `px` es源Imagen尺寸, 
 *  `method` 记着este框es沿折痕(`fold`), 按正封anchoalto比先验(`ratio`), 还es人En
 *  Detallespágina自己框(`manual`). anterior两档框永远满alto贴derecha缘, SoloCon `x0` es活; 手工框
 *  cuatro边都puede能动. No该裁, 没算过, 算法Versión落posteriorPortada拿到es null.  */
export interface PosterBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  method?: string;
  px: number[];
}

/** 正封En卡片en la摆法. cuatro数都escien分数: `clip` es从Imagen片cuatro边各切掉másmenos(喂
 *  `clip-path: inset()`), `left`/`top` esImagen片izquierdaarriba角相对卡片偏移, `height` esImagen片
 *  alto度相对卡片alto度. Sin框时返回 null, 调用方Original样退回 CSS dentroese贴derecha缘回退. 
 *
 *  Zoom由框alto度定: 框eseuno正bien铺满卡片alto度, 所以Imagen片被放到卡片alto
 *  `源Imagenalto / 框alto` 倍. 算出来ese两档框本来就es满alto, esteuno档于es恒Como 100%, uno像素
 *  都No放grande; SoloCon手工框横着切uno刀时才会grande于 100%. 
 *
 *  横向: 框占卡片ancho `框ancho / 框alto / 容DispositivoRelación`. 装得abajo就居en proceso, 两侧各Dejauno交给Difuso
 *  Fondo; 装Noabajo就让框derecha缘贴住卡片derecha缘再从izquierda边切, 因ComoTítulo, Actriz名 y 角标都压En
 *  正封derecha侧.  */
export function panelFrame(box: Partial<PosterBox> | null | undefined, ratio: number, contain = false): {
  clip: { top: number; right: number; bottom: number; left: number };
  left: number; top: number; height: number;
} | null {
  const width = Number(box?.px?.[0]);
  const height = Number(box?.px?.[1]);
  const x0 = Number(box?.x0);
  if (!(width > 0 && height > 0 && ratio > 0) || !Number.isFinite(x0)) return null;
  // carpeta回Imagen片dentro面: 框落EnImagen片exterior面esDatos坏, 按Completo幅puede见Procesar比按负ancho度算abajo去安Todo. 
  // 缺 `y0/y1/x1` 按"满alto到derecha缘"补—算出来ese两档框就eseste形状. 
  const span = (value: unknown, fallback: number, limit: number) =>
    Math.min(limit, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : fallback));
  const left0 = span(x0, 0, width);
  const right = Math.max(left0, span(box?.x1, width, width));
  const top0 = span(box?.y0, 0, height);
  const bottom = Math.max(top0, span(box?.y1, height, height));
  const boxWidth = right - left0;
  const boxHeight = bottom - top0;
  if (!(boxWidth > 0 && boxHeight > 0)) return null;
  const visible = boxWidth / boxHeight / ratio;
  if (!(visible > 0)) return null;
  const scale = contain ? Math.min(1, 1 / visible) : 1;
  const offset = contain ? (1 - visible * scale) / 2 - left0 / boxHeight / ratio * scale : visible <= 1
    ? (1 - visible) / 2 - left0 / boxHeight / ratio
    : 1 - right / boxHeight / ratio;
  // `|| 0` esComo -0 收成 0: 写进 CSS 两者uno样, 读出来比对时Nouno样. 
  const percent = (value: number) => (Math.round(value * 10000) || 0) / 100;
  return {
    clip: {
      top: percent(top0 / height), right: percent(1 - right / width),
      bottom: percent(1 - bottom / height), left: percent(left0 / width),
    },
    left: percent(offset),
    top: percent((1 - scale) / 2 - top0 / boxHeight * scale),
    height: percent(height / boxHeight * scale),
  };
}

/** Original地换Imagen, 保DejaLista顺序, 滚动Ubicación y En cursoReproducir媒体.  */
export function syncJavImages(root: ParentNode, preference: unknown): void {
  root.querySelectorAll<HTMLImageElement>('img[data-jav-image]').forEach(img => {
    const cover = img.dataset.javCover || '';
    const thumb = img.dataset.javThumb || '';
    const useCover = Boolean(cover && (normalizeJavImage(preference) === 'cover' || !thumb));
    const src = useCover ? cover : thumb;
    img.classList.toggle('cover', useCover);
    img.classList.toggle('whole', useCover && img.dataset.javImageLayout !== 'big');
    img.classList.toggle('front', useCover && img.dataset.javImageLayout === 'big');
    /* 取景es按AnteriorImagen算, 换Imagen之posterioruno律作废, 由 `coverAnchor` EnNuevoImagenCargar完pesado算. 
       DifusoFondo挂En卡片arriba而NoesImagen片arriba, `removeAttribute('style')` 够No着它.  */
    img.classList.remove('panel');
    img.removeAttribute('style');
    (img.closest('.pic,[data-media-pic]') as HTMLElement | null)?.style.removeProperty('--cover-blur');
    if (src && img.getAttribute('src') !== src) img.src = src;
  });
}

/** grandeImagen/pequeñoImagenOriginal地换: 同unoImagenSolo换取景类名, 来源 y ya换回Original件都Deja着, NopesadoNuevo解码. 
 *  Anterior版算出取景uno律作废; 返回ya经Cargar完, 要按Nuevo卡片Relación立刻pesado算取景ese几, 
 *  还没到手etc. `load` 自己算.  */
export function relayoutJavImages(root: ParentNode, layout: JavLayout): HTMLImageElement[] {
  const ready: HTMLImageElement[] = [];
  root.querySelectorAll<HTMLImageElement>('img[data-jav-image]').forEach(img => {
    if (img.dataset.javImageLayout === layout) return;
    img.dataset.javImageLayout = layout;
    if (!img.classList.contains('cover')) return;
    img.classList.toggle('whole', layout !== 'big');
    img.classList.toggle('front', layout === 'big');
    img.classList.remove('panel');
    img.removeAttribute('style');
    (img.closest('.pic,[data-media-pic]') as HTMLElement | null)?.style.removeProperty('--cover-blur');
    if (img.complete && img.naturalWidth) ready.push(img);
  });
  return ready;
}
