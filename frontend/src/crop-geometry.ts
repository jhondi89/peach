/* 框选eseunoEn源Imagenen la坐标. 纯算术, No碰 DOM, 也No认识 React. 
 *
 * uno切都用**源Imagen像素**表示, derechaabajo开区间—落盘框, 发给posterior端框, `poster_box`
 * ese字段都esesteuno套(`src/peach/jav_poster_crop.py`  `projection` Documentación串). 
 * 屏幕arriba量到es显示像素, 换算SoloEn进出esteuno层时各做uno次: 两边各按各坐标算abajo去, 
 * 框会EnZoom比NoesCompleto数时差出uno两像素, 而eseuno两像素En屏幕arribaverNo出来, SoloEn
 * 事posterior对Noarriba账. 
 */

export interface CropSize {
  width: number;
  height: number;
}

export interface CropBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** 框最pequeño边largo, 源Imagen像素. 再pequeño就NoesEn框unocontenido, 而esEn框噪点.  */
export const MIN_CROP_EDGE = 16;

function whole(size: CropSize): CropBox {
  return { x0: 0, y0: 0, x1: size.width, y1: size.height };
}

function round(box: CropBox): CropBox {
  return {
    x0: Math.round(box.x0), y0: Math.round(box.y0),
    x1: Math.round(box.x1), y1: Math.round(box.y1),
  };
}

export function isUsableSize(size: CropSize | null | undefined): size is CropSize {
  return Boolean(size) && Number.isFinite(size!.width) && Number.isFinite(size!.height)
    && size!.width > 0 && size!.height > 0;
}

/** 装得abajo最grandeese框, 按 `aspect`(ancho/alto)居en proceso; `aspect` Como null 时就esCompletoImagen. 
 *
 *  正封eseuno路Predeterminado框另Con讲究, 见 `defaultPanelBox`.  */
export function centeredBox(size: CropSize, aspect: number | null): CropBox {
  if (!isUsableSize(size)) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  if (aspect == null || !(aspect > 0)) return whole(size);
  let width = size.width;
  let height = width / aspect;
  if (height > size.height) {
    height = size.height;
    width = height * aspect;
  }
  const left = (size.width - width) / 2;
  const top = (size.height - height) / 2;
  return round({ x0: left, y0: top, x1: left + width, y1: top + height });
}

/** 正封Predeterminado框: 满alto, 按Relación取ancho, 贴derecha缘. 
 *
 *  横版封套es"背面 | 书脊 | 正面", 正面Enderecha侧, 所以Predeterminado框就es"从derecha缘量回去
 *  uno正封ese么ancho". 人要改másmedioSoloes折痕落En哪uno列, Predeterminado框先另exteriortres边摆对, 
 *  menostres次拖拽. 装Noabajo就退成CompletoImagen.  */
export function defaultPanelBox(size: CropSize, aspect: number): CropBox {
  if (!isUsableSize(size) || !(aspect > 0)) return whole(size);
  const width = Math.min(size.width, size.height * aspect);
  return round({ x0: size.width - width, y0: 0, x1: size.width, y1: size.height });
}

/** `focus` dentro按 `aspect` 装得abajo最grande框, en proceso心对齐 `focus` en proceso心. 
 *
 *  `focus` esposterior端给"该取景eseuno"(脸周围方Imagen或正封), 形状Nouno定es
 *  `aspect`. 取装得abajo而Noes围得住: 围住竖largo正封要带进书脊, 围住脸ese方Imagen
 *   3:4 格子会带进uno截胸口, 而esteuno本来就es按"装进Avatar刚bien"量出来.  */
export function frameWithin(focus: CropBox, size: CropSize, aspect: number): CropBox {
  if (!isUsableSize(size) || !(aspect > 0)) return whole(size);
  const inside = clampBox(focus, size);
  const box = centeredBox({ width: inside.x1 - inside.x0, height: inside.y1 - inside.y0 }, aspect);
  return {
    x0: inside.x0 + box.x0, y0: inside.y0 + box.y0,
    x1: inside.x0 + box.x1, y1: inside.y0 + box.y1,
  };
}

/** 框收进源Imagendentro, y保证它还算uno框. 
 *
 *  `aspect` 给就锁Relación: 先按 `anchor` eseuno边定尺寸, 装Noabajo再换另uno边定, 仍然
 *  装Noabajo就贴着Imagen边缘缩. cuatro角都carpeta过之posterior, anchoalto都至menos `MIN_CROP_EDGE`.  */
export function clampBox(box: CropBox, size: CropSize, aspect: number | null = null,
                         anchor: 'width' | 'height' = 'width'): CropBox {
  if (!isUsableSize(size)) return { x0: 0, y0: 0, x1: 0, y1: 0 };
  const floor = Math.min(MIN_CROP_EDGE, size.width, size.height);
  let width = Math.max(floor, Math.min(box.x1 - box.x0, size.width));
  let height = Math.max(floor, Math.min(box.y1 - box.y0, size.height));
  if (aspect != null && aspect > 0) {
    if (anchor === 'width') {
      height = width / aspect;
      if (height > size.height) { height = size.height; width = height * aspect; }
    } else {
      width = height * aspect;
      if (width > size.width) { width = size.width; height = width / aspect; }
    }
    if (width > size.width) { width = size.width; height = width / aspect; }
  }
  const left = Math.max(0, Math.min(box.x0, size.width - width));
  const top = Math.max(0, Math.min(box.y0, size.height - height));
  return round({ x0: left, y0: top, x1: left + width, y1: top + height });
}

/** Completo框平移 `(dx, dy)` 源Imagen像素, 尺寸No变, 碰到边就停.  */
export function moveBox(box: CropBox, dx: number, dy: number, size: CropSize): CropBox {
  const width = box.x1 - box.x0;
  const height = box.y1 - box.y0;
  const left = Math.max(0, Math.min(box.x0 + dx, size.width - width));
  const top = Math.max(0, Math.min(box.y0 + dy, size.height - height));
  return round({ x0: left, y0: top, x1: left + width, y1: top + height });
}

/** 以框心Comoen proceso心Zoom. `factor` grande于 1 es放grande框(ver到contenido更más).  */
export function scaleBox(box: CropBox, factor: number, size: CropSize,
                         aspect: number | null = null): CropBox {
  if (!isUsableSize(size) || !(factor > 0)) return box;
  const cx = (box.x0 + box.x1) / 2;
  const cy = (box.y0 + box.y1) / 2;
  const width = (box.x1 - box.x0) * factor;
  const height = (box.y1 - box.y0) * factor;
  return clampBox({
    x0: cx - width / 2, y0: cy - height / 2,
    x1: cx + width / 2, y1: cy + height / 2,
  }, size, aspect);
}

/** 拖derechaabajo角: izquierdaarriba角钉住No动, derechaabajo角跟着指针走.  */
export function resizeFromCorner(box: CropBox, x: number, y: number, size: CropSize,
                                 aspect: number | null = null): CropBox {
  const next = { x0: box.x0, y0: box.y0, x1: Math.max(box.x0 + 1, x), y1: Math.max(box.y0 + 1, y) };
  const anchor: 'width' | 'height' = (next.x1 - next.x0) / Math.max(1, next.y1 - next.y0)
    > (aspect ?? 1) ? 'height' : 'width';
  return clampBox(next, size, aspect, anchor);
}

/** 源Imagen像素框 → 覆盖层cien分比Ubicación. 显示尺寸No参y: cien分比es相对Imagen片本身.  */
export function boxPercent(box: CropBox, size: CropSize): {
  left: number; top: number; width: number; height: number;
} {
  if (!isUsableSize(size)) return { left: 0, top: 0, width: 0, height: 0 };
  return {
    left: (box.x0 / size.width) * 100,
    top: (box.y0 / size.height) * 100,
    width: ((box.x1 - box.x0) / size.width) * 100,
    height: ((box.y1 - box.y0) / size.height) * 100,
  };
}

/** 框dentroeseuno单独摆满uno容Dispositivo时 `background-size` / `background-position`. 
 *
 *  Vista previaNopesadoNuevo取uno次Imagen: 同uno地址换成FondoImagen, Explorar dispositivo用es同uno缓存字节. 
 *  `background-position` cien分比量es"Imagen比容Dispositivomás出来ese部分", 所以框正bienetc.于
 *  CompletoImagen时分母es 0, ese时Ubicación取 0 — Imagen y 容Dispositivouno样grande, 摆哪dentro都uno样.  */
export function previewStyle(box: CropBox, size: CropSize): {
  size: string; position: string;
} {
  if (!isUsableSize(size)) return { size: 'cover', position: '50% 50%' };
  const width = Math.max(1, box.x1 - box.x0);
  const height = Math.max(1, box.y1 - box.y0);
  const spare = (offset: number, whole: number, part: number) =>
    whole - part > 0 ? (offset / (whole - part)) * 100 : 0;
  return {
    size: `${(size.width / width) * 100}% ${(size.height / height) * 100}%`,
    position: `${spare(box.x0, size.width, width)}% ${spare(box.y0, size.height, height)}%`,
  };
}

/** 框dentroeseuno摆满uno同Relación容Dispositivo时, Completo `<img>` 按绝对定该放En哪, 放másgrande. 
 *
 *   y  `previewStyle` es同uno件事, 给esImagen片元素而NoesFondo: Imagen片元素才Con `load`
 *  事件puedecontinuar, 淡入要etc.它. `left`/`width` cien分比量es容Dispositivoancho, `top`/`height`
 *  量es容Dispositivoalto, 容Dispositivoy框同Relación, 所以两轴各按各边largo换算.  */
export function windowStyle(box: CropBox, size: CropSize): {
  left: string; top: string; width: string; height: string;
} {
  const width = Math.max(1, box.x1 - box.x0);
  const height = Math.max(1, box.y1 - box.y0);
  return {
    left: `${(-box.x0 / width) * 100}%`,
    top: `${(-box.y0 / height) * 100}%`,
    width: `${(size.width / width) * 100}%`,
    height: `${(size.height / height) * 100}%`,
  };
}

/** 显示像素 → 源Imagen像素. `rendered` es `<img>` 当anterior占 CSS 像素尺寸.  */
export function toNatural(value: number, rendered: number, natural: number): number {
  if (!(rendered > 0)) return 0;
  return (value * natural) / rendered;
}

/** 框En屏幕en lacorto边pequeño于este么más CSS 像素时, 改Tamañoese角柄挪到框exterior. 角柄 12px, 框Solo比它
 *  grandeuno点时Completo都被角柄盖住, 按abajo去Solo能改Tamaño, 拖No动框.  */
export const HANDLE_ROOM = 36;

/** 角柄该No该放到框exterior: `rect` es `boxPercent` cien分比, `shown` esImagen当anterior显示尺寸. 
 *  显示尺寸还没量到时No挪.  */
export function handleOutside(
  rect: { width: number; height: number }, shown: CropSize | null,
): boolean {
  if (!shown || !(shown.width > 0) || !(shown.height > 0)) return false;
  return Math.min((rect.width / 100) * shown.width, (rect.height / 100) * shown.height) < HANDLE_ROOM;
}
