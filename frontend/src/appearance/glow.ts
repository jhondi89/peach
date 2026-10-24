/* 光晕, 玻璃面y强调色写到página面arriba, 以及配色ese几abajo点选. 
 *
 * 光晕怎么算, 怎么写En `./home-glow.ts`: eseunoNo认识偏bien对象, aquí当anteriorConfiguración y 目标元素递进去. 
 * 侧栏eseuno层写es `.glowlayer` ese空 div 而Noes <html>: 自定义属性es继承, 写En根arribaCompleto棵树都要
 * pesado算样, 实测每帧 15ms arribaabajo, 拖动时帧预算当场就超; 量法 y 数字记En web/css/01-base.css eseRegla
 * arriba面. uno帧Solo写uno次: 指针拖动uno秒能发arribacien pointermove, 排进 requestAnimationFrame 之posterior写就es
 * esteuno帧真正要画eseuno. 
 *
 * 其余玻璃面(Buscar框, 顶栏Imagen标钮, Filtrar浮层, Configuración卡分区导航, 媒体Bibliotecay配色弹层, estrecho栏, Seleccionar工具)
 * 分散EnCompleto棵树arriba, Sin共同宿主, 它们ese两团反光色相Solo能写En根arriba. 写uno次根就esCompleto棵树pesado算样, 所以
 * eseunoSolocontinuar换档, 点Color y 开关ese几abajo. 强调色同理: uno次点选写uno属性, 换来esCompletopágina按钮, 焦点环 y 
 * 链continuar跟着走.  */
import {
  ACCENTS, DEFAULT_ACCENT, DEFAULT_HOME_GLOW, HOME_GLOW_PRESETS, HOME_GLOW_SPOTS, glowAccent, glowChipFill, glowPalette,
  isNativeGlass, normalizeAccent, paintGlassFaces, paintHomeGlow, type HomeGlow,
} from './home-glow';

import type { SettingsStore } from '../settings-store';
import { appSettingsStore } from './settings';

/** esteuno层读写ese两项; store arriba还Con别字段.  */
export interface GlowSettings { homeGlow: HomeGlow; accent: string }
type GlowStore = SettingsStore<GlowSettings>;

/** 侧栏光晕eseuno层当场写uno次. 启动时No.uno帧之anterior走esteuno.  */
export function paintHomeGlowNow(store: GlowStore = appSettingsStore()): void {
  paintHomeGlow(document.querySelector<HTMLElement>('.glowlayer'), store.value.homeGlow);
}

let glowFrame = 0;
/** 排uno帧pesado画侧栏光晕eseuno层; 同uno帧dentro再叫No另排. 读eseseuno帧时Configuración.  */
export function applyHomeGlow(store: GlowStore = appSettingsStore()): void {
  if (glowFrame) return;
  glowFrame = requestAnimationFrame(() => { glowFrame = 0; paintHomeGlowNow(store) });
}

export function applyGlassFaces(store: GlowStore = appSettingsStore()): void {
  paintGlassFaces(document.documentElement, store.value.homeGlow);
}

export function applyAccent(store: GlowStore = appSettingsStore()): void {
  document.documentElement.dataset.accent = store.value.accent;
}

/** 预设色en launo格. `native` eseuno格No带Color, 球色由样表按当anteriorTema取.  */
export interface GlowChip { key: string; label: string; native: boolean; fill: string }

const chip = (key: string, label: string, colors: readonly string[]): GlowChip =>
  ({ key, label, native: isNativeGlass(key), fill: isNativeGlass(key) ? '' : glowChipFill(colors) });

/* 预设色照 feralui 预设 chip 做: tres光晕色etc.分uno圈 conic-gradient, 再叠 BoardUI esetres层白色alto光. 
   "自定义"SoloConEn用户真手调过Color之posterior才占uno格: 没调过时eseuno格dentroesuno y Predeterminado档uno模uno样球, 点它
   什么也No会变, 读起来却像还Conuno档没试过.  */
export function glowChips(glow: HomeGlow): GlowChip[] {
  const chips = HOME_GLOW_PRESETS.map(([key, label, palette]) => chip(key, label, HOME_GLOW_SPOTS.map((spot) => palette[spot].color)));
  if (glow.preset === 'custom') chips.push(chip('custom', 'Personalizado', HOME_GLOW_SPOTS.map((spot) => glow[spot].color)));
  return chips;
}

/** 强调色eseuno排: `[Clave, 名称]`. 球色由样表按 `data-accent-ball` 取esteuno档 400 y 600 两级.  */
export const ACCENT_CHOICES = ACCENTS;

/* 换uno档光晕连强调色uno起换: uno档配色就esuno副面, 光晕暖着, 按钮还es蓝, 读起来es两套皮叠Enuno起. 
   强调色eseuno排puede以单独点, 点完Solo改强调色, No动光晕—先给uno套搭配bien, 要拆开也拆得开.  */
export function chooseGlowPreset(key: string, store: GlowStore = appSettingsStore()): void {
  if (key === 'custom') return;
  const glow = store.value.homeGlow;
  glow.preset = key;
  Object.assign(glow, glowPalette(key));
  store.value.accent = glowAccent(key);
  store.save();
  applyHomeGlow(store); applyGlassFaces(store); applyAccent(store);
}

export function chooseAccent(key: string, store: GlowStore = appSettingsStore()): void {
  store.value.accent = normalizeAccent(key);
  store.save();
  applyAccent(store);
}

/* Restableceres配色, NoesCompleto光晕: Título就写着"光晕" y "强调色", 强度 y 粒uno起清掉会让人以Como按错Clave. 
   CompletoRestaurarPredeterminadoEn详细Configuracióneseuno屏.  */
export function resetGlowColors(store: GlowStore = appSettingsStore()): void {
  const glow = store.value.homeGlow;
  glow.preset = DEFAULT_HOME_GLOW.preset;
  Object.assign(glow, glowPalette(glow.preset));
  store.value.accent = DEFAULT_ACCENT;
  store.save();
  applyHomeGlow(store); applyGlassFaces(store); applyAccent(store);
}

/* 侧栏底部ese配色钮derechaabajo角两pequeño圆: arriba面ese报当anterior预设No.uno光晕色, abajo面ese报强调色. 光晕关掉
   之posteriorarriba面ese收起, Solo剩强调色eseuno—BoardUI Original版ese点本来就es强调色. "玻璃Original色"eseuno档Sin光晕色
   puede报, 换成玻璃自带ese两团反光色各unomedio, 样表按 `data-glow-native` 取.  */
export function paintGlowButton(button: HTMLElement, glow: HomeGlow): void {
  button.style.setProperty('--glow-swatch', glow.on ? glow.spot1.color : 'var(--color-accent-500)');
  button.toggleAttribute('data-glow-native', glow.on && isNativeGlass(glow.preset));
  button.toggleAttribute('data-glow-off', !glow.on);
}

/** 当场画uno次ese钮, 之posterior每次落盘都跟arriba: 钮常驻En壳dentro, 点哪uno处改配色它都要对齐.  */
export function wireGlowButton(button: HTMLElement, store: GlowStore = appSettingsStore()): () => void {
  paintGlowButton(button, store.value.homeGlow);
  return store.subscribe(() => paintGlowButton(button, store.value.homeGlow));
}
