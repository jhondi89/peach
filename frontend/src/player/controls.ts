/* 挂En Video.js 控制en la Peach Controles: Configuración菜单(氛围Modo, ReproducirVelocidad度, Nitidez), CineModoClave, 
 * 控制排版y形变Imagen标, 拖动Vista previa, Media Session, 转圈yexterior挂Subtítulos, exterior加舞氛围光采样. 
 *
 * Controles样取自 YouTube delhi-modern(player 9470c977), 每uno出处写En它自己函数arriba.  */
import { api, esc, fmtClock, icon, realDuration } from '@peach/legacy/core';

import { playerHost } from './host';
import { detailPlayer, resizeSoon } from './registry';
import { PLAYER_PANEL_EVENT } from './stats';
import type { PlayerItem, SourceQuality, VjsPlayer } from './types';
import { SubtitleControls, subtitleIcon } from './subtitles';

type TooltipSync = (label?: string, aria?: string) => void;

/** 控制arriba每按钮Pasar el ratónSugerencia都从aquí出: 文案 + rápido捷Clave徽标, 样取自 YouTube delhi-modern. 
 *  Original生 title yEstadoSugerencia共用同unoSincronizar入口.  */
export function playerControlTooltip(button: Element | null | undefined, label: string, shortcut = ''): TooltipSync {
  if (!button) return () => {};
  let tip = button.querySelector<HTMLElement>(':scope>.vjs-peach-tooltip');
  if (!tip) {
    tip = document.createElement('span'); tip.className = 'vjs-peach-tooltip'; tip.setAttribute('role', 'tooltip');
    tip.innerHTML = '<span class="vjs-peach-tooltip-text"></span><kbd hidden></kbd>';
    button.append(tip);
  }
  const text = tip.querySelector('.vjs-peach-tooltip-text')!, key = tip.querySelector('kbd')!;
  if (shortcut) button.setAttribute('aria-keyshortcuts', shortcut);
  const sync: TooltipSync = (nextLabel = label, aria = '') => {
    text.textContent = nextLabel; key.textContent = shortcut; key.hidden = !shortcut;
    button.setAttribute('aria-label', aria || nextLabel); button.removeAttribute('title');
  };
  sync(); return sync;
}

/** rápido捷Clave复用按钮自己点击Ruta: Pantalla completa, 画en proceso画, Silenciar各Con兜底逻辑挂En按钮arriba, EnClave盘分支dentro
 *  再实现uno遍就会 y 按钮走岔. pequeño窗en laReproducirDispositivoNoEn媒体框dentro, 按 Video.js 自己壳找Controles.  */
export function clickPlayerControl(video: Element | null, selector: string): void {
  video?.closest('.video-js')?.querySelector<HTMLElement>(`.vjs-control-bar ${selector}`)?.click();
}

export function applyAmbientMode(enabled: boolean, save = true): void {
  const host = playerHost(), settings = host.settings();
  settings.ambientMode = !!enabled; if (save) host.saveSettings();
  host.stage()?.toggleAttribute('data-ambient', settings.ambientMode);
  document.dispatchEvent(new CustomEvent('peachambientchange', { detail: { enabled: settings.ambientMode } }));
}

const theaterSyncs = new WeakMap<Element, TooltipSync>();

function syncPlayerTheaterButton(button: Element | null | undefined): void {
  if (!button) return;
  const theater = playerHost().settings().theaterMode;
  button.setAttribute('aria-pressed', String(theater));
  button.querySelector('use')?.setAttribute('href', theater ? '#i-theater-exit' : '#i-theater-enter');
  theaterSyncs.get(button)?.(theater ? 'Vista predeterminada' : 'Modo cine');
}

export function applyTheaterMode(enabled: boolean, save = true): void {
  const host = playerHost(), settings = host.settings();
  settings.theaterMode = !!enabled; if (save) host.saveSettings();
  const stage = host.stage(); stage?.toggleAttribute('data-theater', settings.theaterMode);
  syncPlayerTheaterButton(stage?.querySelector('[data-player-theater]'));
  resizeSoon(detailPlayer());
}

/** 氛围光: 按Imagen平均色给舞写 `--video-glow`. 
 *
 *  取样Con两入口: Reproduciren proceso跟着帧回调走, `start` 则立刻取uno帧. PausarImagen同样esuno帧puede画Imagen, 
 *  Solo跟着帧回调走话, Pausar时关掉氛围Modo就再也开No回来—关掉抹掉光, 而帧回调SoloEnConNuevo
 *  Imagen时才来. 每采样链带uno run 号: Pausar或página面隐藏时排队ese回调puede能永远No来, 用uno
 *  "ya排队"布尔判pesado会被它永久锁死; 换成 run 号posteriorantiguo回调醒来直continuarCerrar sesión, 链arriba永远SoloConunoEn跑.  */
export function mountPlayerAmbient(video: HTMLVideoElement): () => void {
  const stage = playerHost().stage(), canvas = stage?.querySelector<HTMLCanvasElement>('[data-ambient-canvas]');
  if (!stage || !canvas) return () => {};
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return () => {};
  let stopped = false, last = 0, run = 0;
  let glow: number[] | null = null;
  const clear = () => { glow = null; ctx.clearRect(0, 0, canvas.width, canvas.height); stage.style.removeProperty('--video-glow') };
  const sample = () => {
    if (video.readyState < 2) return;
    try {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data; let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < px.length; i += 16) { r += px[i]!; g += px[i + 1]!; b += px[i + 2]!; n++ }
      if (n) {
        const next = [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
        // 平均色微pequeño抖动保持Estable, 继承色SoloEnpuede见变化时ActualizarCompleto座Detalles. 
        if (!glow || next.some((value, index) => Math.abs(value - glow![index]!) >= 6)) {
          glow = next; stage.style.setProperty('--video-glow', `rgb(${next.join(' ')})`);
        }
      }
    } catch { /* 跨源Imagen取No到像素 */ }
  };
  const queue = (id: number) => {
    if (video.requestVideoFrameCallback) video.requestVideoFrameCallback((now) => paint(id, now));
    else requestAnimationFrame((now) => paint(id, now));
  };
  const paint = (id: number, now: number) => {
    if (stopped || id !== run) return;
    if (!playerHost().settings().ambientMode) { clear(); return }
    if (video.paused) return;
    if (!document.hidden && now - last > 480) { last = now; sample() }
    queue(id);
  };
  const start = () => { if (stopped || !playerHost().settings().ambientMode) return; sample(); if (!video.paused) queue(++run) };
  const onChange = (event: Event) => {
    const enabled = !!(event as CustomEvent<{ enabled: boolean }>).detail.enabled;
    stage.toggleAttribute('data-ambient', enabled);
    if (enabled) start(); else { run++; clear() }
  };
  document.addEventListener('peachambientchange', onChange);
  video.addEventListener('play', start); video.addEventListener('loadeddata', start); start();
  return () => {
    stopped = true; run++; document.removeEventListener('peachambientchange', onChange);
    video.removeEventListener('play', start); video.removeEventListener('loadeddata', start); clear();
  };
}

/** Configuración菜单: 氛围Modo, ReproducirVelocidad度, Nitidez. 返回函数换掉来源Nitidez表. 
 *
 *  `sourceQualities` es来源自己给Nitidez表([{height,label}], 从alto到bajo). rule34video 每档
 *  写成Independiente字段, videojs  qualityLevels verNo到它们—ese套Solo认 HLS/DASH 自适应轨道, 而aquí
 *  escuatro各自Independiente mp4. 所以由调用方查bien再传进来.  */
export function mountPlayerQualityControl(
  player: VjsPlayer, video: HTMLVideoElement, fallbackHeight: unknown = 0, initialSourceQualities: SourceQuality[] | null = null,
): ((next: SourceQuality[] | null) => void) | undefined {
  const controlBar = player.el().querySelector<HTMLElement>('.vjs-control-bar');
  if (!controlBar || controlBar.querySelector('[data-player-quality]')) return undefined;
  const root = document.createElement('div');
  root.className = 'vjs-peach-settings vjs-control'; root.dataset.playerQuality = '';
  root.innerHTML = `<button type="button" class="vjs-peach-settings-toggle" aria-label="Configuración del reproductor" aria-expanded="false">
    ${icon('settings')}<span data-player-quality-badge hidden></span></button>
    <div class="vjs-peach-settings-menu" role="menu" aria-label="Configuración del reproductor" aria-hidden="true"></div>`;
  const fullscreen = controlBar.querySelector('.vjs-fullscreen-control');
  controlBar.insertBefore(root, fullscreen || null);
  const toggle = root.querySelector('button')!, badge = root.querySelector<HTMLElement>('[data-player-quality-badge]')!;
  playerControlTooltip(toggle, 'Configuración');
  const menu = root.querySelector<HTMLElement>('.vjs-peach-settings-menu')!;
  let subtitleControls: SubtitleControls | undefined;
  const levels = typeof player.qualityLevels === 'function' ? player.qualityLevels() : null;
  let sourceQualities = initialSourceQualities;
  let selectedQuality = 'auto';
  const resolution = (width: unknown, height: unknown) => {
    const values = [Number(width), Number(height)].filter((value) => value > 0);
    return values.length ? Math.min(...values) : 0;
  };
  interface Row { key: string; label: string; pixels: number }
  const rows = (): Row[] => {
    const result: Row[] = [];
    if (levels?.length) {
      if (levels.length > 1) result.push({ key: 'auto', label: 'Automático', pixels: 0 });
      for (let index = 0; index < levels.length; index++) {
        const level = levels[index]!;
        const pixels = resolution(level.width, level.height)
          || (levels.length === 1 ? resolution(video.videoWidth, video.videoHeight) : 0);
        result.push({ key: String(index), label: pixels ? `${pixels}p` : (levels.length === 1 ? 'ActualCalidad de imagen' : `线路 ${index + 1}`), pixels });
      }
      return result;
    }
    if (sourceQualities?.length) {
      return sourceQualities.map((quality) => ({ key: `h${quality.height}`, label: quality.label || `${quality.height}p`, pixels: quality.height }));
    }
    const pixels = resolution(video.videoWidth, video.videoHeight) || Number(fallbackHeight) || 0;
    return [{ key: 'original', label: pixels ? `${pixels}p` : 'Arte original', pixels }];
  };
  const qualityRows = () => {
    const options = rows();
    const active = options.find((option) => option.key === selectedQuality) || options[0]!;
    const playing = levels?.[levels.selectedIndex ?? -1];
    const activePixels = active.key === 'auto'
      ? resolution(playing?.width, playing?.height) || resolution(video.videoWidth, video.videoHeight)
      : active.pixels;
    badge.textContent = activePixels >= 2160 ? '4K' : activePixels >= 720 ? 'HD' : ''; badge.hidden = !badge.textContent;
    return { options, active };
  };
  const isOpen = () => menu.getAttribute('aria-hidden') !== 'true';
  const setOpen = (open: boolean) => {
    menu.setAttribute('aria-hidden', String(!open)); toggle.setAttribute('aria-expanded', String(open));
    if (!open) subtitleControls?.hide();
    if (open) document.dispatchEvent(new CustomEvent(PLAYER_PANEL_EVENT, { detail: 'settings' }));
  };
  const close = () => setOpen(false);
  const closeSettingsForOtherPanel = (event: Event) => { if ((event as CustomEvent<string>).detail !== 'settings') close() };
  document.addEventListener(PLAYER_PANEL_EVENT, closeSettingsForOtherPanel);
  /* 面板之间Cambiar照 YouTube ReproducirDispositivo 9470c977  www-player.css: popup 自己 .25s
     cubic-bezier(.4,0,.2,1) 改alto度, antiguo面板往来方向滑出, Nuevo面板从去方向滑入. 
     antiguo面板必须先脱离Diseño再滑, 否则两contenido会En动画期间菜单撑成两倍alto; alto度也得
     先钉Enantiguo值, Siguiente帧再写Nuevo值, 同uno帧写两次Solo会直continuar跳到Nuevo值, verNo到过渡.  */
  const PANEL_MS = 250;
  let panelTimer: ReturnType<typeof setTimeout> | null = null;
  let panelRun = 0;
  const renderPanel = (html: string, direction: number): HTMLElement => {
    const run = ++panelRun;
    if (panelTimer) {
      clearTimeout(panelTimer); panelTimer = null;
      menu.classList.remove('vjs-peach-popup-animating'); menu.style.height = '';
    }
    menu.querySelectorAll('.vjs-peach-panel-leaving').forEach(panel => panel.remove());
    menu.scrollTop = 0;
    const current = menu.querySelector<HTMLElement>('.vjs-peach-panel');
    const next = document.createElement('div'); next.className = 'vjs-peach-panel'; next.innerHTML = html;
    if (!current || !direction || !isOpen() || matchMedia('(prefers-reduced-motion:reduce)').matches) { menu.replaceChildren(next); menu.style.height = ''; return next }
    const from = menu.getBoundingClientRect().height;
    current.classList.add('vjs-peach-panel-leaving'); current.inert = true; current.setAttribute('aria-hidden', 'true');
    next.classList.add(direction > 0 ? 'vjs-peach-panel-animate-forward' : 'vjs-peach-panel-animate-back');
    menu.append(next); menu.style.height = `${from}px`;
    const to = next.scrollHeight;
    requestAnimationFrame(() => {
      if (run !== panelRun) return;
      menu.classList.add('vjs-peach-popup-animating'); menu.style.height = `${to}px`;
      next.classList.remove('vjs-peach-panel-animate-forward', 'vjs-peach-panel-animate-back');
      current.classList.add(direction > 0 ? 'vjs-peach-panel-animate-back' : 'vjs-peach-panel-animate-forward');
      panelTimer = setTimeout(() => {
        panelTimer = null; current.remove();
        menu.classList.remove('vjs-peach-popup-animating'); menu.style.height = '';
      }, PANEL_MS);
    });
    return next;
  };
  const button = (panel: HTMLElement, selector: string) => panel.querySelector<HTMLElement>(selector)!;
  /** 菜单此刻摆es哪uno面; 轨道y尺寸变化Solo就地改esteuno面(`refreshPanel`).  */
  let view: 'main' | 'speed' | 'quality' | 'subtitles' = 'main';
  const showMain = (direction = 0) => {
    view = 'main';
    const { active } = qualityRows(), speed = Number(player.playbackRate()) || 1;
    const panel = renderPanel(`<div class="vjs-peach-panel-menu"><button type="button" class="vjs-peach-menu-row" role="menuitemcheckbox" data-player-ambient aria-checked="${playerHost().settings().ambientMode}">
      ${icon('player-ambient')}<span>Modo ambiente</span><i class="vjs-peach-switch" aria-hidden="true"></i></button>
      <button type="button" class="vjs-peach-menu-row" role="menuitem" data-player-speed>${icon('player-speed')}<span>Velocidad de reproducción</span><b>${speed === 1 ? 'Normal' : `${speed}×`}</b>${icon('player-menu-next')}</button>
      <button type="button" class="vjs-peach-menu-row" role="menuitem" data-player-subtitles><span class="vjs-peach-menu-cc" aria-hidden="true">${subtitleIcon()}</span><span>Subtítulos</span><b>${esc(subtitleControls?.label() || 'Desactivar')}</b>${icon('player-menu-next')}</button>
      <button type="button" class="vjs-peach-menu-row" role="menuitem" data-player-quality-view>${icon('player-quality')}<span>Nitidez</span><b>${esc(active.label)}</b>${icon('player-menu-next')}</button></div>`, direction);
    button(panel, '[data-player-ambient]').onclick = () => { applyAmbientMode(!playerHost().settings().ambientMode); showMain() };
    button(panel, '[data-player-speed]').onclick = () => showSpeed();
    button(panel, '[data-player-subtitles]').onclick = () => subtitleControls?.show();
    button(panel, '[data-player-quality-view]').onclick = () => showQuality();
  };
  /* ReproducirVelocidad度面板照 YouTube delhi-modern(player 9470c977  base.js): 滑两端取ReproducirDispositivo
     支持最bajoy最alto倍Velocidad, 步进 0.05, 加减Clave各动 0.05 y按两pequeño数收敛, 读数写成 1.00x. 
     预设胶囊点就地生效, 面板No退回Anterior级. No.cinco格 3.0 Enarriba游es Premium 专属, 本机装
     Peach Sin会员分级este回事, eseuno格照arriba游Deja着, SoloesNo画角标; 滑arriba限跟着抬到 3, 
     No然点 3.0 会被收敛回 2.  */
  const SPEED_MIN = .25, SPEED_MAX = 3, SPEED_STEP = .05, SPEED_PRESETS = [1, 1.25, 1.5, 2, 3];
  const speedLabel = (speed: number) => Number.isInteger(speed) ? speed.toFixed(1) : String(speed);
  const showSpeed = (direction = 1) => {
    view = 'speed';
    const min = SPEED_MIN, max = SPEED_MAX;
    const clampSpeed = (value: number) => Math.min(max, Math.max(min, Number(value.toFixed(2))));
    const panel = renderPanel(`<div class="vjs-peach-panel-header"><button type="button" class="vjs-peach-menu-back" data-player-menu-back aria-label="Volver al menú anterior">${icon('player-menu-back')}</button><strong>Velocidad de reproducción</strong></div>
      <div class="vjs-peach-speed-panel"><div class="vjs-peach-speed-display"><output data-player-speed-display></output></div>
      <div class="vjs-peach-speed-slider"><button type="button" class="vjs-peach-speed-button" data-player-speed-step="-1" aria-label="Velocidad de reproducción减 0.05">${icon('minus')}</button>
      <input type="range" class="vjs-peach-speed-range" data-player-speed-range min="${min}" max="${max}" step="${SPEED_STEP}" aria-label="Velocidad de reproducción">
      <button type="button" class="vjs-peach-speed-button" data-player-speed-step="1" aria-label="Velocidad de reproducción加 0.05">${icon('plus')}</button></div>
      <div class="vjs-peach-speed-chips">${SPEED_PRESETS.map((speed) =>
        `<span class="vjs-peach-speed-preset"><button type="button" class="vjs-peach-speed-button" data-player-speed-option="${speed}" aria-pressed="false">${speedLabel(speed)}</button>${speed === 1 ? '<span class="vjs-peach-speed-preset-label">Normal</span>' : ''}</span>`).join('')}</div></div>`, direction);
    const display = panel.querySelector<HTMLOutputElement>('[data-player-speed-display]')!;
    const range = panel.querySelector<HTMLInputElement>('[data-player-speed-range]')!;
    // player.playbackRate() 读es ratechange 之posterior才写缓存, 面板自己记住esteuno次倍Velocidad. 
    let rate = clampSpeed(Number(player.playbackRate()) || 1);
    const syncSpeed = () => {
      display.textContent = `${rate.toFixed(2)}x`; range.value = String(rate);
      range.style.setProperty('--peach-speed-percent', `${(rate - min) / (max - min) * 100}%`);
      panel.querySelectorAll<HTMLElement>('[data-player-speed-option]').forEach((option) =>
        option.setAttribute('aria-pressed', String(Number(option.dataset.playerSpeedOption) === rate)));
    };
    const setSpeed = (value: number) => { rate = clampSpeed(value); player.playbackRate(rate); syncSpeed() };
    button(panel, '[data-player-menu-back]').onclick = () => showMain(-1);
    range.oninput = () => setSpeed(Number(range.value));
    panel.querySelectorAll<HTMLElement>('[data-player-speed-step]').forEach((step) => {
      step.onclick = () => setSpeed(rate + Number(step.dataset.playerSpeedStep) * SPEED_STEP);
    });
    panel.querySelectorAll<HTMLElement>('[data-player-speed-option]').forEach((option) => {
      option.onclick = () => setSpeed(Number(option.dataset.playerSpeedOption));
    });
    syncSpeed();
  };
  /** Nitidezeseuno列: Abrir面板时画uno次, 轨道增减或自动档换轨时Original地pesado画, 焦点DejaEn同uno档arriba.  */
  const fillQualityOptions = (list: HTMLElement) => {
    const { options, active } = qualityRows();
    const focused = list.contains(document.activeElement) ? (document.activeElement as HTMLElement).dataset.playerQualityOption : undefined;
    list.innerHTML = options.map((option) =>
      `<button type="button" class="vjs-peach-menu-option" role="menuitemradio" data-player-quality-option="${esc(option.key)}" aria-checked="${option.key === active.key}"><span class="vjs-peach-option-check">${option.key === active.key ? icon('player-option-check') : ''}</span><span class="vjs-peach-option-label">${esc(option.label)}</span></button>`).join('');
    const buttons = [...list.querySelectorAll<HTMLElement>('[data-player-quality-option]')];
    buttons.find((option) => focused !== undefined && option.dataset.playerQualityOption === focused)?.focus();
    buttons.forEach((option) => {
      option.onclick = () => {
        selectedQuality = option.dataset.playerQualityOption || 'auto';
        if (levels?.length) {
          for (let index = 0; index < levels.length; index++) levels[index]!.enabled = selectedQuality === 'auto' || selectedQuality === String(index);
        }
        /* 来源档escuatro各自Independiente mp4, Noes同uno流más轨道, 所以Solo能换 src. 
           记住当anteriorProgreso y ReproducirEstado再换: 换源会pesadoNuevoCargar, Nocontinuar回去就etc.于从头Empezar.  */
        if (sourceQualities?.length && selectedQuality.startsWith('h')) {
          const height = selectedQuality.slice(1);
          const at = player.currentTime() || 0, wasPlaying = !player.paused();
          const next = new URL(player.currentSrc() || video.src, location.origin);
          next.searchParams.set('quality', height);
          player.src({ src: next.pathname + next.search, type: 'video/mp4' });
          player.one('loadedmetadata', () => {
            if (at > 0) player.currentTime(at);
            if (wasPlaying) player.play()?.catch(() => {});
          });
        }
        showMain(-1);
      };
    });
  };
  const showQuality = (direction = 1) => {
    view = 'quality';
    const panel = renderPanel(`<div class="vjs-peach-panel-header"><button type="button" class="vjs-peach-menu-back" data-player-menu-back aria-label="Volver al menú anterior">${icon('player-menu-back')}</button><strong>Nitidez</strong></div><div class="vjs-peach-panel-menu"></div>`, direction);
    button(panel, '[data-player-menu-back]').onclick = () => showMain(-1);
    fillQualityOptions(button(panel, '.vjs-peach-panel-menu'));
  };
  /* HLS 自动码率起播时轨道陆续登记, 码率随网Velocidad换档, 视频尺寸也跟着变: este些事件SoloActualizar角标 y 
     En cursovereseuno面. 退回主菜单话, En cursoNitidez面板dentro挑档人会被uno次换轨踢出去.  */
  const refreshPanel = () => {
    if (!isOpen()) { qualityRows(); return }
    const panel = menu.lastElementChild as HTMLElement | null;
    if (view === 'quality' && panel) { fillQualityOptions(button(panel, '.vjs-peach-panel-menu')); return }
    const { active } = qualityRows();
    const label = view === 'main' ? panel?.querySelector('[data-player-quality-view] b') : null;
    if (label) label.textContent = active.label;
  };
  toggle.onclick = (event) => { event.stopPropagation(); const open = !isOpen(); if (open) showMain(); setOpen(open) };
  const outside = (event: Event) => { if (!root.contains(event.target as Node)) close() };
  document.addEventListener('pointerdown', outside);
  root.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isOpen()) { event.preventDefault(); event.stopPropagation(); close(); toggle.focus() }
    if (['ArrowDown', 'ArrowUp'].includes(event.key) && isOpen() && !(event.target instanceof HTMLInputElement)) {
      event.preventDefault();
      const buttons = [...menu.querySelectorAll<HTMLElement>('button:not([disabled]),input,a[href]')].filter(node => node.offsetParent !== null && !node.closest('[inert]'));
      const current = buttons.indexOf(document.activeElement as HTMLElement);
      buttons[(current + (event.key === 'ArrowDown' ? 1 : buttons.length - 1)) % buttons.length]?.focus();
    }
  });
  video.addEventListener('loadedmetadata', refreshPanel);
  video.addEventListener('resize', refreshPanel);
  levels?.on?.(['addqualitylevel', 'removequalitylevel', 'change'], refreshPanel);
  player.on('dispose', () => {
    panelRun++;
    document.removeEventListener('pointerdown', outside);
    document.removeEventListener(PLAYER_PANEL_EVENT, closeSettingsForOtherPanel);
    if (panelTimer) clearTimeout(panelTimer);
  });
  subtitleControls = new SubtitleControls(player, video, {
    render: renderPanel, open: () => { view = 'subtitles'; setOpen(true) }, close,
    back: () => { subtitleControls?.hide(); showMain(-1) },
  });
  qualityRows();
  mountPlayerTheaterControl(player, root);
  mountPlayerChromeLayout(player);
  return (next) => { sourceQualities = next?.length ? next : null; refreshPanel() };
}

function mountPlayerTheaterControl(player: VjsPlayer, settingsRoot: Element): void {
  const controlBar = player.el().querySelector<HTMLElement>('.vjs-control-bar');
  if (!controlBar || controlBar.querySelector('[data-player-theater]')) return;
  const theater = playerHost().settings().theaterMode;
  const root = document.createElement('div'); root.className = 'vjs-peach-theater vjs-control';
  root.innerHTML = `<button type="button" data-player-theater aria-pressed="${theater}">${icon(theater ? 'theater-exit' : 'theater-enter')}</button>`;
  controlBar.insertBefore(root, settingsRoot.nextSibling);
  const theaterButton = root.querySelector('button')!;
  theaterSyncs.set(theaterButton, playerControlTooltip(theaterButton, 'Modo cine', 'T'));
  syncPlayerTheaterButton(theaterButton);
  theaterButton.onclick = (event) => { event.stopPropagation(); applyTheaterMode(!playerHost().settings().theaterMode) };
}

function mountPlayerChromeLayout(player: VjsPlayer): void {
  const controlBar = player.el().querySelector<HTMLElement>('.vjs-control-bar');
  if (!controlBar || controlBar.querySelector('.vjs-peach-right-controls')) return;
  const play = controlBar.querySelector<HTMLElement>(':scope>.vjs-play-control');
  if (play && !play.querySelector(':scope>.vjs-peach-hover')) play.insertAdjacentHTML('beforeend', '<span class="vjs-peach-hover" aria-hidden="true"></span>');
  const explicitIcon = (button: HTMLElement | null, name: string) => {
    if (!button) return null;
    button.dataset.peachExplicitIcon = '';
    button.insertAdjacentHTML('beforeend', icon(name, 'vjs-peach-control-icon'));
    return button.querySelector(':scope>.vjs-peach-control-icon use');
  };
  /* ReproducirClave y SilenciarClaveImagen标要自己形变, No能Completo换掉: `<use>` 克隆出来es影子树, dentro面
     `d` 改No动, 也挂Noarriba过渡. 所以este两Clave sprite en la <path> 搬进自己 svg, Imagen标怎么变
     由 CSS 说. 照 YouTube delhi-modern(player 9470c977  base.js): Reproducir↔Pausares同uno
     Ruta逐数字插值 200ms(arriba游 `eST`  `d` 拆成数字y分隔符再逐插值), Volumen两道弧
     各自Zoom 250ms(arriba游 `jjc`: interior弧绕 (18,12), exterior弧绕 (22,12)), 两处曲线都es `qn3`
     也就es cubic-bezier(.4,0,.2,1).  */
  const morphIcon = (button: HTMLElement | null | undefined, name: string) => {
    if (!button) return null;
    const symbol = document.getElementById(`i-${name}`); if (!symbol) return null;
    button.dataset.peachExplicitIcon = '';
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', symbol.getAttribute('viewBox') || '');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('class', 'vjs-peach-control-icon vjs-peach-morph-icon');
    svg.innerHTML = symbol.innerHTML; button.append(svg); return svg;
  };
  const spritePaths = (name: string) => [...(document.getElementById(`i-${name}`)?.querySelectorAll('path') || [])];
  const playIcon = morphIcon(play, 'player-play'), playPath = playIcon?.querySelector('path');
  const playD = spritePaths('player-play')[0]?.getAttribute('d') || '', pauseD = spritePaths('player-pause')[0]?.getAttribute('d') || '';
  const syncPlayTooltip = playerControlTooltip(play, 'Reproducir', 'K');
  /* WebKit(Safari y iOS en la所ConExplorar dispositivo)No认 CSS  `d` 属性, 写进 style etc.于没写, Imagen标
     停EnReproducireseuno. ese边直continuar改Ruta属性: Sin插值, 瞬间Cambiar.  */
  const cssPathD = CSS.supports('d', 'path("M0 0")');
  const syncPlayIcon = () => {
    const paused = player.paused() || player.ended(), d = paused ? playD : pauseD;
    if (playPath) { if (cssPathD) playPath.style.setProperty('d', `path("${d}")`); else playPath.setAttribute('d', d) }
    syncPlayTooltip(paused ? 'Reproducir' : 'Pausar');
  };
  player.on(['play', 'pause', 'ended'], syncPlayIcon); syncPlayIcon();
  const volume = controlBar.querySelector<HTMLElement>(':scope>.vjs-volume-panel');
  const mute = volume?.querySelector<HTMLElement>(':scope>.vjs-mute-control'), muteIcon = morphIcon(mute, 'player-volume');
  /* SilenciareseImagen标搬进同uno svg: 挖空喇叭 y 叉号跟实心喇叭, 两道弧共处uno处, 弧缩完
     它们才uno起顶arriba, 靠 opacity 换而Noes换Completo svg.  */
  if (muteIcon) spritePaths('player-volume-muted').forEach((path) => muteIcon.append(path.cloneNode(true)));
  const syncMuteTooltip = playerControlTooltip(mute, 'Silenciar', 'M');
  /* exterior弧跟Volumen走: arriba游 `setVolume` dentro超过 50 才给 1, 否则 0, Silenciar时两道弧uno起收掉.  */
  const syncVolumeIcon = () => {
    const silent = player.muted() || player.volume() === 0;
    if (muteIcon) { muteIcon.dataset.silent = String(silent); muteIcon.dataset.loud = String(!silent && player.volume() > .5) }
    syncMuteTooltip(silent ? 'Activar sonido' : 'Silenciar');
  };
  player.on('volumechange', syncVolumeIcon); syncVolumeIcon();
  /* en proceso心Sugerencia照 YouTube delhi-modern(player 9470c977  www-player.css y base.js): uno
     78px 毛玻璃圆闪unoabajo当anterior动作Imagen标, 1s 走完 0→1.33→1 Zoom淡出. 捕obtener阶段读es
     Cambiar之anteriorEstado, 闪出来正bienesesteuno次做事: Pausaren proceso点ReproducirClave闪Reproducir. Clave盘rápido捷Clave走
     也es同uno按钮点击Ruta, 所以Clave盘No用另挂uno处. 
     Imagenen proceso心Solo允许ConesteunoSugerencia圆: CompletoReproducirDispositivodentro凡es能CambiarReproducir入口—控制ReproducirClave, 
     SilenciarClave, 点Imagen本身—都汇到este flashBezel arriba. 同unoImagenarriba再挂No.dos 78px 圆, 
     两边各按自己时机取Estado, 点unoabajo就会uno闪Reproduciruno闪Pausar, 叠Enuno起verNo清哪才es
     刚做事.  */
  const bezel = document.createElement('div');
  bezel.className = 'vjs-peach-bezel'; bezel.setAttribute('role', 'status'); bezel.hidden = true;
  bezel.innerHTML = `<span class="vjs-peach-bezel-icon">${icon('player-play')}</span>`;
  const bezelUse = bezel.querySelector('use'); let bezelTimer: ReturnType<typeof setTimeout> | null = null;
  const flashBezel = (name: string, label: string) => {
    bezelUse?.setAttribute('href', `#i-${name}`); bezel.setAttribute('aria-label', label);
    bezel.hidden = false; bezel.classList.remove('vjs-peach-bezel-run');
    void bezel.offsetWidth; bezel.classList.add('vjs-peach-bezel-run');
    if (bezelTimer) clearTimeout(bezelTimer);
    bezelTimer = setTimeout(() => { bezel.hidden = true; bezel.classList.remove('vjs-peach-bezel-run') }, 1000);
  };
  controlBar.parentElement!.insertBefore(bezel, controlBar);
  player.el().addEventListener('click', (event) => {
    const target = event.target as Element;
    if (target.closest('.vjs-mute-control')) {
      const silent = player.muted() || player.volume() === 0;
      flashBezel(silent ? 'player-volume' : 'player-volume-muted', silent ? 'Activar sonido' : 'Silenciar');
    } else if (target.closest('.vjs-play-control,.vjs-tech,.vjs-poster')) {
      const paused = player.paused() || player.ended();
      flashBezel(paused ? 'player-play' : 'player-pause', paused ? 'Reproducir' : 'Pausar');
    }
  }, true);
  player.on('dispose', () => { if (bezelTimer) clearTimeout(bezelTimer) });
  const time = document.createElement('button'); let remaining = false;
  time.type = 'button'; time.className = 'vjs-peach-time vjs-control'; time.dataset.playerTime = '';
  time.innerHTML = '<span class="vjs-peach-time-text"></span>';
  const timeText = time.querySelector('.vjs-peach-time-text')!;
  const syncTimeTooltip = playerControlTooltip(time, 'MostrarDisponibleHora');
  const syncTime = () => {
    const current = Math.max(0, Number(player.currentTime()) || 0), duration = Math.max(0, Number(player.duration()) || 0);
    const left = fmtClock(Math.max(0, duration - current));
    timeText.textContent = `${remaining ? `-${left}` : fmtClock(current)} / ${fmtClock(duration)}`;
    time.dataset.remaining = String(remaining);
    syncTimeTooltip(remaining ? 'MostrarYaTiempo de reproducción' : 'MostrarDisponibleHora', remaining
      ? `Disponible ${left}, TotalDuración ${fmtClock(duration)}; 点击MostrarYaTiempo de reproducción`
      : `Reproducido ${fmtClock(current)}, TotalDuración ${fmtClock(duration)}; 点击MostrarDisponibleHora`);
  };
  time.onclick = (event) => { event.stopPropagation(); remaining = !remaining; syncTime() };
  player.on(['timeupdate', 'durationchange', 'loadedmetadata'], syncTime); syncTime();
  if (volume) volume.insertAdjacentElement('afterend', time); else controlBar.append(time);
  const pip = controlBar.querySelector<HTMLElement>(':scope>.vjs-picture-in-picture-control');
  playerControlTooltip(controlBar.querySelector('.vjs-subtitles-control>button'), 'Subtítulos');
  explicitIcon(pip, 'player-pip');
  // i Clave归迷你ReproducirDispositivo(YouTube  aria-keyshortcuts="i"), 画en proceso画SoloDeja按钮. 
  const syncPipTooltip = playerControlTooltip(pip, 'Imagen en imagen');
  player.on(['enterpictureinpicture', 'leavepictureinpicture'], () => syncPipTooltip(document.pictureInPictureElement ? 'SalirImagen en imagen' : 'Imagen en imagen'));
  const fullscreen = controlBar.querySelector<HTMLElement>(':scope>.vjs-fullscreen-control');
  const fullscreenUse = explicitIcon(fullscreen, 'player-fullscreen-enter');
  const syncFullscreenTooltip = playerControlTooltip(fullscreen, 'Pantalla completa', 'F');
  /* CSS  `.vjs-fullscreen` Solo能覆盖 Video.js ya经SincronizarEstado类Ruta. 实际Explorar dispositivo还puede能
     走 full-window 回退, 或者先触发 fullscreenchange, Siguiente帧才Completado class Actualizar. ReproducirDispositivo
     自己 `isFullscreen()` Resultado登记到 DOM, ImagenIntroduce充No再依赖某uno实现细节类名.  */
  const syncFullscreenState = () => {
    const active = !!player.isFullscreen();
    player.el().toggleAttribute('data-peach-fullscreen', active);
    fullscreenUse?.setAttribute('href', active ? '#i-player-fullscreen-exit' : '#i-player-fullscreen-enter');
    syncFullscreenTooltip(active ? 'Salir de pantalla completa' : 'Pantalla completa');
    resizeSoon(player);
  };
  player.on(['fullscreenchange', 'enterFullWindow', 'exitFullWindow'], syncFullscreenState);
  syncFullscreenState();
  const controls = [
    pip,
    controlBar.querySelector<HTMLElement>(':scope>.vjs-subtitles-control'),
    controlBar.querySelector<HTMLElement>(':scope>.vjs-peach-settings'),
    controlBar.querySelector<HTMLElement>(':scope>.vjs-peach-theater'),
    fullscreen,
  ].filter((control): control is HTMLElement => !!control);
  if (!controls.length) return;
  const group = document.createElement('div'); group.className = 'vjs-peach-right-controls'; group.setAttribute('aria-label', 'ReproductorVista控制');
  controlBar.insertBefore(group, controls[0]!);
  controls.forEach((control) => {
    control.insertAdjacentHTML('beforeend', '<span class="vjs-peach-hover" aria-hidden="true"></span>');
    group.append(control);
  });
  /* estrecho屏折叠照 YouTube 判据来: base.js 9470c977 dentroReproducirDispositivoancho度 `v.width<528` Abrir
     ytp-xsmall-width-mode, derecha侧收成"Configuración + 展开", 点开才铺开其余按钮. 判据必须esReproducirDispositivo
     自己ancho度, Noes视口—同uno视口abajoCineModo y 普通视ImagenReproducirDispositivoancho度差unogrande截.  */
  const expand = document.createElement('div'); expand.className = 'vjs-peach-expand vjs-control';
  /* alto亮层要挂En `.vjs-control` esteuno层: 亮起来Reglaes `>.vjs-peach-hover`, 塞进
     button dentro就差uno层, 展开Clave成este排唯unoSin hover 按钮. UbicaciónEneste排izquierda端—
     este排Completo体derecha对齐, 展开时Nuevo按钮从它derecha边largo出来, 箭头指izquierda才对得arriba要发生事. 箭头用
     `i-player-expand`: 菜单行ese `>` es 24 视框, uno单粗细线, 铺到 32px SoloCon 1.3px 粗; 
     arriba游展开Clave自带uno 32 视框, 两单粗箭头, 同样 32px 渲染就es 2px.  */
  expand.innerHTML = `<button type="button" data-player-expand aria-expanded="false">${icon('player-expand')}</button><span class="vjs-peach-hover" aria-hidden="true"></span>`;
  group.prepend(expand);
  const expandButton = expand.querySelector('button')!;
  const syncExpandTooltip = playerControlTooltip(expandButton, 'Expandir controles');
  const setExpanded = (open: boolean) => {
    player.el().classList.toggle('vjs-peach-right-expanded', open);
    expandButton.setAttribute('aria-expanded', String(open)); syncExpandTooltip(open ? 'ColapsarControles' : 'Expandir controles');
  };
  expandButton.onclick = (event) => { event.stopPropagation(); setExpanded(!player.el().classList.contains('vjs-peach-right-expanded')) };
  const syncWidthMode = () => {
    const box = player.el(), narrow = box.clientWidth < 528;
    /* Configuración面板要按ReproducirDispositivoalto度收顶, 而它定祖先SoloCon 36px alto, cien分比取No到ReproducirDispositivo.  */
    box.style.setProperty('--peach-player-h', `${box.clientHeight}px`);
    box.classList.toggle('vjs-peach-xsmall', narrow);
    if (!narrow) setExpanded(false);
  };
  const widthObserver = new ResizeObserver(syncWidthMode); widthObserver.observe(player.el());
  player.on('dispose', () => widthObserver.disconnect());
  setExpanded(false); syncWidthMode();
}

interface TimelineSheets { frames: number; interval: number; columns?: number; rows?: number }

/** Progresoen la拖动Vista previa: Tiempoyeseuno秒Imagen. 
 *
 *  RecolectarTarea铺bienTiempo轴continuar触印相就按它走: 每 10 或 30 秒uno帧, 指到哪uno秒ver到就eseseuno秒. 
 *  取No到退回nueve宫格esenueve格—eseesTodo片nueveetc.分, 两pequeño时片子格y格之间隔着diez几分钟, 指Ubicación y 
 *  ver到Imagen对Noarriba, pero比SinImagen强. 关注EntradaSin本地Imagen, Solo报Tiempo.  */
export function mountPlayerSeekPreview(player: VjsPlayer, item: PlayerItem | null, options: { thumbnail?: boolean } = {}): void {
  const progress = player.el().querySelector<HTMLElement>('.vjs-control-bar .vjs-progress-control');
  if (!progress || progress.querySelector('[data-player-seek-preview]')) return;
  const hasThumbnail = !!item && options.thumbnail !== false;
  const preview = document.createElement('div');
  preview.className = 'vjs-peach-seek-preview'; preview.dataset.playerSeekPreview = ''; preview.hidden = true;
  preview.innerHTML = `${hasThumbnail ? '<i class="vjs-peach-seek-frame" hidden><img alt=""></i>' : ''}<span class="mono">0:00</span>`;
  progress.append(preview);
  const frame = preview.querySelector<HTMLElement>('.vjs-peach-seek-frame');
  const image = preview.querySelector('img'), label = preview.querySelector('span')!;
  let sheets: TimelineSheets | null = null, shown = '';
  if (frame && item?.id) {
    (api(`/api/timeline?id=${encodeURIComponent(item.id)}`) as Promise<TimelineSheets | null>)
      .then((meta) => { if (meta && meta.frames > 0 && meta.interval > 0) sheets = meta }).catch(() => {});
  }
  const showSheetFrame = (seconds: number, sheet: TimelineSheets, box: HTMLElement, img: HTMLImageElement) => {
    if (!item) return;
    const columns = sheet.columns || 10, per = columns * (sheet.rows || 10);
    const index = Math.min(sheet.frames - 1, Math.max(0, Math.floor(seconds / sheet.interval)));
    const page = Math.floor(index / per), slot = index % per;
    // último通常No满 10 行, 行数按它自己ese几帧反算: 按满行去铺, 格子会落到Imagenexterior面空白arriba. 
    const rows = Math.ceil(Math.min(per, sheet.frames - page * per) / columns);
    const source = `/timeline?id=${encodeURIComponent(item.id)}&s=${page}`;
    if (source !== shown) { shown = source; img.src = source }
    box.hidden = false;
    // 取景框按片源Relación, Imagen按格子铺满: 两边Relaciónuno致, `fill` 才既No裁也No拉. 
    if (item.width && item.height) box.style.aspectRatio = `${item.width} / ${item.height}`;
    img.style.objectFit = 'fill';
    img.style.width = `${columns * 100}%`; img.style.height = `${rows * 100}%`;
    img.style.left = `${-(slot % columns) * 100}%`; img.style.top = `${-Math.floor(slot / columns) * 100}%`;
  };
  let cell = -1;
  const move = (event: PointerEvent) => {
    if (event.pointerType === 'touch') return;
    const duration = realDuration(player.duration()) || realDuration(item?.duration);
    if (!duration) return;
    const rect = progress.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const width = frame ? Math.min(240, Math.max(160, rect.width * .28)) : 76;
    const x = Math.min(rect.width - width / 2, Math.max(width / 2, event.clientX - rect.left));
    preview.style.left = `${x}px`; preview.hidden = false; label.textContent = fmtClock(duration * ratio);
    if (!frame || !image || !item) return;
    if (sheets) { showSheetFrame(duration * ratio, sheets, frame, image); return }
    const nextCell = Math.min(8, Math.floor(ratio * 9));
    if (nextCell === cell) return;
    cell = nextCell; frame.hidden = false; image.removeAttribute('style');
    image.src = `/poster?id=${encodeURIComponent(item.id)}&c=${nextCell}`;
  };
  const hide = () => { preview.hidden = true };
  if (image && frame) image.onerror = () => { frame.hidden = true };
  progress.addEventListener('pointermove', move); progress.addEventListener('pointerleave', hide);
  player.on('dispose', () => { progress.removeEventListener('pointermove', move); progress.removeEventListener('pointerleave', hide) });
}

/** 画en proceso画ese窗口由Explorar dispositivo画, 站interior控制unoClave都递No进去. Media Session 动作ProcesarDispositivoes唯uno
 *  入口: 登记 `seekbackward`  y  `seekforward` 之posterior, Chrome 才Enese窗口dentro画出rápido退 y rápido进两, 
 *  步largo用Configuracióndentroese秒数; `setPositionState` 让它自己eseProgreso知道现En放到哪, `seekto` 让拖它
 *  真生效. No登记时esedentroSoloConReproducir, Pausar y Cerrartres. 站interiorpequeño窗es另uno件事, esetresClaveEnpequeño窗自己身arriba.  */
export function mountPlayerMediaSession(player: VjsPlayer, item: PlayerItem): void {
  const session = navigator.mediaSession;
  if (!session || typeof session.setActionHandler !== 'function') return;
  const total = () => realDuration(player.duration()) || realDuration(item.duration) || 0;
  const seekTo = (seconds: number) => {
    const duration = total();
    player.currentTime(Math.max(0, duration ? Math.min(duration, seconds) : seconds));
  };
  const step = () => Math.max(1, Number(playerHost().settings().seekSeconds) || 10);
  const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
    ['play', () => { void player.play() }],
    ['pause', () => player.pause()],
    ['seekbackward', (details) => seekTo(player.currentTime() - (details?.seekOffset || step()))],
    ['seekforward', (details) => seekTo(player.currentTime() + (details?.seekOffset || step()))],
    ['seekto', (details) => { if (typeof details?.seekTime === 'number') seekTo(details.seekTime) }],
  ];
  const registered: MediaSessionAction[] = [];
  for (const [action, handler] of handlers) {
    /* Explorar dispositivoNo认动作会抛, 认得照常登记: Completo try 会让unoNo认识动作带走posterior面
       TodoProcesarDispositivo, pequeño窗于es又回到SoloConReproducirPausar.  */
    try { session.setActionHandler(action, handler); registered.push(action) } catch { /* No认动作 */ }
  }
  const syncPosition = () => {
    const duration = total(), position = Math.max(0, Number(player.currentTime()) || 0);
    if (typeof session.setPositionState !== 'function') return;
    /* DuraciónNopuede用或者Progreso跑EnDuraciónanterior面时No报: `setPositionState` 对este两入参直continuar抛, 
       而 `timeupdate` 每秒都来, 抛uno次就es每秒unoError.  */
    if (!duration || position > duration) return;
    try {
      session.setPositionState({ duration, position, playbackRate: Math.max(.001, Number(player.playbackRate()) || 1) });
    } catch { /* Explorar dispositivo拒收 */ }
  };
  player.on(['timeupdate', 'durationchange', 'ratechange', 'seeked', 'loadedmetadata'], syncPosition);
  syncPosition();
  player.on('dispose', () => {
    registered.forEach((action) => { try { session.setActionHandler(action, null) } catch { /* ya撤 */ } });
    try { session.setPositionState?.() } catch { /* ya撤 */ }
  });
}

/** CargarSugerencia复用 YouTube e937390a  `FsY`: cuatro段嵌套元素ycuatro段动画.  */
export function mountPlayerSpinner(player: VjsPlayer): void {
  const spinner = player.el().querySelector('.vjs-loading-spinner');
  if (!spinner || spinner.querySelector('.vjs-peach-spinner-container')) return;
  spinner.innerHTML = '<span class="vjs-peach-spinner-container"><span class="vjs-peach-spinner-rotator"><span class="vjs-peach-spinner-left"><span class="vjs-peach-spinner-circle"></span></span><span class="vjs-peach-spinner-right"><span class="vjs-peach-spinner-circle"></span></span></span></span>';
}

/** 本机资产exterior挂Subtítulos. 服务端ya经 srt/ass/ssa 换成 WebVTT, aquíSolo它挂成 text track. 
 *  uno律No设 default: 自动Abrir某unoetc.于替用户选语言, 而同uno部片常Con简体, 繁体, 日语tres. 
 *  Peach Subtítulos菜单SoloEnCon轨时候出现; 轨道挂EnOriginal生 video arriba, 随同uno元素保Deja.  */
export function mountPlayerSubtitles(player: VjsPlayer, assetId: number): void {
  (api(`/api/assets/${assetId}/subtitles`) as Promise<{ subtitles?: { playable?: boolean; src: string; language?: string; label: string }[] } | null>)
    .then((payload) => {
      if (!player || player.isDisposed()) return;
      (payload?.subtitles || []).filter((track) => track.playable).forEach((track) => {
        player.addRemoteTextTrack({ kind: 'subtitles', src: track.src, srclang: track.language || '', label: track.label, default: false }, true);
      });
    }).catch(() => {});
}
