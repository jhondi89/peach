/* 明暗Tema写到página面arriba. 
 *
 * TemaSolo写属性, No写Color: 两套色板都En web/css/01-base.css, 选跟随系统就属性摘掉, 交还给
 * `prefers-color-scheme`. React 子树en la BoardUI 源码profundo色 token 挂En `.dark` arriba, 所以同uno次调用按
 * 实际profundosuperficial给 <html> 加减 `dark` 类, 跟随系统时也算arriba系统eseuno档. 地址栏色跟着同uno次调用走—两
 * meta 各代表uno档, 选en procesoese开到 `all`, 另uno关成 `not all`, 否则Teléfonoen la地址栏还DejaEn系统eseuno档. 
 * `index.html` primero屏interior联脚本做es同tres件事, 它Solo负责No.uno帧, 之posterior都从aquí出.  */
import { appSettingsStore } from './settings';

/** `[值, 显示名, 字形]`: Configuración面板eseuno组tres档. 显示Dispositivoese字形说es"跟着este显示Dispositivo".  */
export const THEME_OPTIONS: readonly (readonly [value: string, label: string, icon: string])[] = [
  ['system', 'Seguir sistema', 'monitor'], ['light', 'Claro', 'sun'], ['dark', 'Oscuro', 'moon'],
];

let systemDark: MediaQueryList | null = null;
const prefersDark = (): MediaQueryList => (systemDark ??= matchMedia('(prefers-color-scheme: dark)'));

/* 换Tema时CompletopáginaColor过渡uno起播, 满屏拖影. 写属性anterior挂uno样过渡Todo关掉, 写完强制算uno次样, 
 * NuevoColor就直continuar落定, 之posterior再摘掉也No会补播. 明暗Clave滑NoEn其interior: 它ese段移本来就该跟着este次Cambiar走. 
 * 摘除排EnSiguiente帧, 同时挂uno定时Dispositivo兜底: página面Nopuede见时 rAF No跑, 样No能uno直挂着.  */
let transitionBlock: HTMLStyleElement | null = null;
function suppressTransitions(): () => void {
  if (!transitionBlock) {
    transitionBlock = document.createElement('style');
    transitionBlock.textContent = '*:not(.board-theme-thumb),*::before,*::after{transition:none!important}';
  }
  if (!transitionBlock.isConnected) document.head.append(transitionBlock);
  return () => {
    void getComputedStyle(document.documentElement).opacity;
    const release = () => { cancelAnimationFrame(frame); clearTimeout(timer); transitionBlock?.remove() };
    const frame = requestAnimationFrame(release);
    const timer = setTimeout(release, 100);
  };
}

export function applyTheme(choice: string = appSettingsStore().value.theme): void {
  const restore = suppressTransitions();
  const root = document.documentElement;
  if (choice === 'system') delete root.dataset.theme; else root.dataset.theme = choice;
  const dark = choice === 'dark' || (choice === 'system' && prefersDark().matches);
  root.classList.toggle('dark', dark);
  document.querySelectorAll<HTMLElement>('[data-board-theme]').forEach((button) =>
    button.setAttribute('aria-pressed', String((button.dataset.boardTheme === 'dark') === dark)));
  document.querySelector('.board-theme-toggle')?.classList.toggle('is-dark', dark);
  document.querySelectorAll<HTMLMetaElement>('meta[data-theme-color]').forEach((meta) => {
    meta.media = (meta.dataset.themeColor === 'dark') === dark ? 'all' : 'not all';
  });
  restore();
}

/** 跟随系统eseuno档: 系统换明暗, página面当场跟arriba. Solocontinuaruno次.  */
let watching = false;
export function watchSystemTheme(): void {
  if (watching) return;
  watching = true;
  prefersDark().addEventListener('change', () => { if (appSettingsStore().value.theme === 'system') applyTheme() });
}
