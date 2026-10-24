/* Subtítulosexterior观持久化y TextTrack Tiempo轴显示.  */
export const CAPTION_OPTIONS = {
  font: { label: 'Fuente', values: [['sans', 'NingunoSerifa'], ['mono', 'etc.anchoNingunoSerifa'], ['serif', 'Serifa'], ['mono-serif', 'Monoespaciado con serifa'], ['casual', 'Casual'], ['cursive', 'Manuscrito'], ['small-caps', 'Versalitas']] },
  size: { label: 'Tamaño de fuente', values: ['50', '75', '100', '150', '200', '300', '400'].map(value => [value, `${value}%`]) },
  color: { label: '文字Color', values: [['white', 'Blanco'], ['yellow', 'Amarillo'], ['green', 'Verde'], ['cyan', 'Cian'], ['blue', 'Azul'], ['magenta', 'Magenta'], ['red', 'Rojo'], ['black', 'Negro']] },
  opacity: { label: '文字NoTransparencia', values: ['25', '50', '75', '100'].map(value => [value, `${value}%`]) },
  background: { label: 'FondoColor', values: [['black', 'Negro'], ['white', 'Blanco'], ['red', 'Rojo'], ['green', 'Verde'], ['blue', 'Azul'], ['yellow', 'Amarillo'], ['magenta', 'Magenta'], ['cyan', 'Cian']] },
  backgroundOpacity: { label: 'FondoNoTransparencia', values: ['0', '25', '50', '75', '100'].map(value => [value, `${value}%`]) },
  window: { label: '窗口Color', values: [['black', 'Negro'], ['white', 'Blanco'], ['red', 'Rojo'], ['green', 'Verde'], ['blue', 'Azul'], ['yellow', 'Amarillo'], ['magenta', 'Magenta'], ['cyan', 'Cian']] },
  windowOpacity: { label: '窗口NoTransparencia', values: ['0', '25', '50', '75', '100'].map(value => [value, `${value}%`]) },
  edge: { label: 'Estilo de borde de carácter', values: [['none', 'Ninguno'], ['raised', 'Elevado'], ['depressed', 'Hundido'], ['outline', 'Contorno'], ['shadow', 'Sombra']] },
} as const;
export type CaptionKey = keyof typeof CAPTION_OPTIONS;
export type CaptionStyle = Record<CaptionKey, string>;
const DEFAULTS: CaptionStyle = { font: 'sans', size: '100', color: 'white', opacity: '100', background: 'black', backgroundOpacity: '75', window: 'black', windowOpacity: '0', edge: 'shadow' };
const KEY = 'peach.caption-style.v1';
const COLORS: Record<string, string> = { white: '255,255,255', yellow: '255,255,0', green: '0,255,0', cyan: '0,255,255', blue: '0,0,255', magenta: '255,0,255', red: '255,0,0', black: '0,0,0' };
const FONTS: Record<string, string> = { sans: 'Arial,sans-serif', mono: 'Consolas,monospace', serif: 'Georgia,serif', 'mono-serif': '"Courier New",monospace', casual: '"Comic Sans MS",sans-serif', cursive: 'cursive', 'small-caps': 'Arial,sans-serif' };
const EDGES: Record<string, string> = { none: 'none', raised: '-1px -1px 0 #ddd,1px 1px 0 #222', depressed: '1px 1px 0 #ddd,-1px -1px 0 #222', outline: '-1px -1px 0 #000,1px -1px 0 #000,-1px 1px 0 #000,1px 1px 0 #000', shadow: '2px 2px 3px #000' };

export function readCaptionStyle(): CaptionStyle {
  let saved: Partial<CaptionStyle> = {};
  try { saved = JSON.parse(localStorage.getItem(KEY) || '{}') || {} } catch { /* 使用Predeterminadoexterior观 */ }
  return Object.fromEntries(Object.entries(DEFAULTS).map(([key, fallback]) => [key,
    CAPTION_OPTIONS[key as CaptionKey].values.some(([value]) => value === saved[key as CaptionKey]) ? saved[key as CaptionKey] : fallback])) as CaptionStyle;
}

export function mountCaptionStyle(root: HTMLElement, video: HTMLVideoElement, signal: AbortSignal) {
  let style = readCaptionStyle();
  const overlay = document.createElement('div'); overlay.className = 'vjs-peach-captions'; overlay.setAttribute('aria-hidden', 'true');
  const window = document.createElement('div'); window.className = 'vjs-peach-caption-window'; overlay.append(window);
  root.querySelector('media-container')!.append(overlay); root.dataset.peachCaptions = '';
  const paintStyle = () => {
    const rgba = (color: string, opacity: string) => `rgba(${COLORS[color]},${Number(opacity) / 100})`;
    root.style.setProperty('--peach-caption-font', FONTS[style.font]!);
    root.style.setProperty('--peach-caption-scale', String(Number(style.size) / 100));
    root.style.setProperty('--peach-caption-color', rgba(style.color, style.opacity));
    root.style.setProperty('--peach-caption-background', rgba(style.background, style.backgroundOpacity));
    root.style.setProperty('--peach-caption-window', rgba(style.window, style.windowOpacity));
    root.style.setProperty('--peach-caption-edge', EDGES[style.edge]!);
    root.style.setProperty('--peach-caption-variant', style.font === 'small-caps' ? 'small-caps' : 'normal');
  };
  const render = () => {
    window.replaceChildren();
    for (const track of video.textTracks) {
      if (track.mode !== 'showing' || !['subtitles', 'captions'].includes(track.kind)) continue;
      for (const cue of Array.from(track.activeCues || [])) {
        const line = document.createElement('span'); line.className = 'vjs-peach-caption-line';
        if (cue instanceof VTTCue) line.append(cue.getCueAsHTML());
        window.append(line);
      }
    }
    overlay.hidden = !window.childNodes.length;
  };
  const bound = new WeakSet<TextTrack>();
  const bind = () => {
    for (const track of video.textTracks) if (!bound.has(track)) { bound.add(track); track.addEventListener('cuechange', render, { signal }) }
    render();
  };
  video.textTracks.addEventListener('addtrack', bind, { signal });
  video.textTracks.addEventListener('removetrack', bind, { signal });
  video.textTracks.addEventListener('change', render, { signal });
  paintStyle(); bind();
  return {
    current: () => style,
    set(key: CaptionKey, value: string) {
      if (!CAPTION_OPTIONS[key].values.some(([option]) => option === value)) return;
      style = { ...style, [key]: value }; paintStyle();
      try { localStorage.setItem(KEY, JSON.stringify(style)) } catch { /* 当anterior会话保Dejaexterior观 */ }
    },
    reset() { style = { ...DEFAULTS }; paintStyle(); try { localStorage.removeItem(KEY) } catch { /* 当anterior会话保Dejaexterior观 */ } },
  };
}
