/* Imagen片回退链: 模板Solo声明Datos, 行Como归 wireImageFallbacks() Todo站委托监听. 
   Application y React página面引用同uno模, 候选依次尝试, TodoNopuede用时按 data-drop Procesar. 

   - `data-drop`: 必Introduce, 也eseste套机制开关. Sin它 `<img>` uno概No管—página面arriba
     另Conuno批靠 CSS 或父节点兜底Imagen(Sello `.mk`), 它们删掉反而es错. 
     取值 `self` Quitar `<img>` 自己; `closest:<SeleccionarDispositivo>` QuitarReciente祖先容Dispositivo; 
     `initial` 换成primero字母垫底. 
   - `data-fallbacks`: puede选, `|` 分隔候选 src, 按序换完才收场. 裸 `|` Noes
     合法 URL 字符, 所以este分隔符No会地址切坏. 
   - `data-drop-style`: puede选开关, 换Siguiente环之anterior先撤掉interior联 style. 人脸取景es按
     当anterioresteunoImagen算出来, 换成另uno照片脸NoEn同unoUbicación. 
   - `data-initial` / `data-drop-class`: `data-drop="initial"` 用. 

   兜底链最posterioruno环必须真 `<img>` 拿掉: Deja着uno取No到Imagen `<img>`, 
   `:has(img)` 照样匹配, primero字母垫底永远回No来, Explorar dispositivo还会 alt 文本画出来. 
   `onerror=null` SoloesNo再Reintentar, Noetc.于esteuno环走完.  */
import { esc } from '@peach/legacy/core';

const FALLBACK_SEPARATOR = '|';
const CLOSEST_PREFIX = 'closest:';

/* 回退链解析. 字符串进, 数组出, No碰 DOM, puede以单独测.  */
export function parseFallbacks(value: unknown): string[] {
  return String(value ?? '')
    .split(FALLBACK_SEPARATOR)
    .map(part => part.trim())
    .filter(Boolean);
}

/* 模板dentroese串 `data-*`. 空候选直continuar丢掉, 省得每调用点自己写uno遍tres元.  */
export function imageFallbackAttrs({
  drop = 'self', fallbacks = [], initial = '', dropClass = '', dropStyle = false,
}: {
  drop?: string; fallbacks?: string | readonly string[]; initial?: string; dropClass?: string; dropStyle?: boolean;
} = {}): string {
  const chain = (Array.isArray(fallbacks) ? fallbacks : [fallbacks]).filter(Boolean);
  return [
    `data-drop="${esc(drop)}"`,
    chain.length ? `data-fallbacks="${esc(chain.join(FALLBACK_SEPARATOR))}"` : '',
    initial ? `data-initial="${esc(initial)}"` : '',
    dropClass ? `data-drop-class="${esc(dropClass)}"` : '',
    dropStyle ? 'data-drop-style' : '',
  ].filter(Boolean).join(' ');
}

/* uno次Fallo推进uno格: 还Con候选就换 src, Sin就按 `data-drop` 收场. 
   返回 `retry`/`drop`/`''`, 最posterioresees"este元素没登记, No管".  */
export function advanceImageFallback(image: HTMLImageElement | null | undefined): '' | 'retry' | 'drop' {
  if (!image || !image.dataset || !image.dataset.drop) return '';
  const chain = parseFallbacks(image.dataset.fallbacks);
  if (chain.length) {
    const [next = '', ...rest] = chain;
    if ('dropStyle' in image.dataset) image.removeAttribute('style');
    /* 脸框SoloDescripciónNo.uno环ese实体Imagen. 回落Imagenes另uno照片, 脸NoEn同unoUbicación, 尺寸也Noes
       ese尺寸—Deja着它, Siguiente次 load 就会拿Anterior脸去给esteuno算放grande倍数. 
       esteunoNo受 `dropStyle` 开关管: 脸框本来就Solo对No.uno环成立, Sin"Deja着也对"
       Ubicación, 而 style ese边Con(`--face` ese类由容Dispositivo给取景要Deja).  */
    delete image.dataset.facebox;
    if (rest.length) image.dataset.fallbacks = rest.join(FALLBACK_SEPARATOR);
    else delete image.dataset.fallbacks;
    if (next === image.dataset.fallbackNoteSrc && image.dataset.fallbackNote) {
      image.title = image.dataset.fallbackNote;
      image.setAttribute('aria-label', image.dataset.fallbackNote);
    }
    image.src = next;
    return 'retry';
  }
  const drop = image.dataset.drop;
  if (drop.startsWith(CLOSEST_PREFIX)) {
    (image.closest(drop.slice(CLOSEST_PREFIX.length)) || image).remove();
    return 'drop';
  }
  if (drop === 'initial') {
    const span = document.createElement('span');
    span.className = image.dataset.dropClass || '';
    span.textContent = image.dataset.initial || '';
    image.replaceWith(span);
    return 'drop';
  }
  image.remove();
  return 'drop';
}

/* Todo站uno监听就够. `error` No冒泡, pero捕obtener阶段照样会经过祖先, 所以挂En根en la
   捕obtener监听能continuar住任何posterior代Imagen片, No必给每 `<img>` 各挂uno—逐绑话, 
   资料páginaexterior链站点圆标每次pesado绘都要pesadoNuevo绑uno轮. 
   Solo认 `<img>`: 同unoEvento名也会从 `<video>`, `<source>`, `<script>` arriba发出来.  */
const fallbackRoots = new WeakSet<EventTarget>();
export function wireImageFallbacks(root: EventTarget): void {
  if (fallbackRoots.has(root)) return;
  fallbackRoots.add(root);
  root.addEventListener('error', event => {
    if (event.target instanceof HTMLImageElement) advanceImageFallback(event.target);
  }, true);
}
