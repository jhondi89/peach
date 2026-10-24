/* ReproducirDispositivoderechaClave菜单. 
 *
 * Proyecto照 YouTube ReproducirDispositivo f572e43c  .ytp-contextmenu 取舍: 循环Reproducir, 迷你ReproducirDispositivo(pequeño窗dentroes展开), 
 * 画en proceso画, Copiar视频网址, Copiar当anteriorTiempo视频网址, ReproducirEstadísticas; 嵌入代码, DepurarInformación y 排查Reproducir问题
 * Peach Sin对应能力, No列.  */
import { esc, icon } from '@peach/legacy/core';
import { dismissMenu, presentMenu, scrollMovesAnchor } from '@peach/legacy/ui';

import { playerHost } from './host';
import type { VjsPlayer } from './types';

/** 菜单dentro y pequeño窗Con关ese两项要问pequeño窗持Con方.  */
export interface PlayerMenuHooks {
  /** esteReproducirDispositivo此刻EnNoEnpequeño窗dentro.  */
  inMiniplayer(player: VjsPlayer): boolean;
  /** esteReproducirDispositivo放esObras还es关注Entrada: Copiar出来地址按它走.  */
  kind(player: VjsPlayer): 'item' | 'follow';
  /** pequeño窗en la"展开".  */
  expand(): void;
  /** Detallesen la"迷你ReproducirDispositivo": 越过Reproducir态判定, En curso放esteuno送进pequeño窗.  */
  toMiniplayer(): void;
}

let hooks: PlayerMenuHooks | null = null;
export function configurePlayerMenu(next: PlayerMenuHooks): void { hooks = next }

/* 菜单节点归este模: No.uno次用到时建En body arriba, 舞开着时临时挪进舞, 关掉再放回来. 
   它No进任何 React 树—被挪来挪去节点, React Desinstalar时会找No到它父级.  */
function menuElement(): HTMLElement {
  let menu = document.getElementById('playerMenu');
  if (!menu) {
    menu = document.createElement('div');
    menu.className = 'popmenu';
    menu.setAttribute('data-player-context-menu', '');
    menu.id = 'playerMenu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Reproductor菜单');
    menu.hidden = true;
    document.body.append(menu);
  }
  return menu;
}

let cleanup: (() => void) | null = null;

/** 给Imagen标 `<svg>` 挂uno空 data 属性: Introduce色Imagen标y勾选记号各Conuno样.  */
const mark = (svg: string, attribute: string) => attribute ? svg.replace('<svg', `<svg ${attribute}=""`) : svg;

export function closePlayerMenu(): void {
  const menu = document.getElementById('playerMenu');
  if (menu?.matches(':popover-open')) menu.hidePopover();
  if (menu && menu.parentElement !== document.body) document.body.append(menu);
  if (menu) dismissMenu(menu, () => { menu.innerHTML = '' });
  if (cleanup) { cleanup(); cleanup = null }
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true } catch {
    const area = document.createElement('textarea');
    area.value = text; area.setAttribute('readonly', ''); area.style.position = 'fixed'; area.style.opacity = '0';
    document.body.append(area); area.select();
    let ok = false; try { ok = document.execCommand('copy') } catch { /* Explorar dispositivoNo给 */ }
    area.remove(); return ok;
  }
}

interface MenuItem { icon: string; label: string; fill?: boolean; checked?: boolean; run(): void }

function playerMenuItems(player: VjsPlayer): MenuItem[] {
  const mini = !!hooks?.inMiniplayer(player);
  const item = player.peachItem;
  const kind = hooks?.kind(player) ?? 'item';
  const url = (withTime: boolean) => {
    const link = new URL(kind === 'follow' ? `/posts/${item?.id}` : `/assets/${item?.id}`, location.origin);
    if (kind !== 'follow' && location.pathname === link.pathname) {
      const context = new URLSearchParams(location.search);
      for (const key of ['mix', 'parts', 'editions', 'playlist']) {
        const value = context.get(key);
        if (value && /^[1-9]\d*$/.test(value)) link.searchParams.set(key, value);
      }
    }
    if (withTime) link.searchParams.set('t', String(Math.floor(player.currentTime() || 0)));
    return link.href;
  };
  const copy = (withTime: boolean, receipt: string) => {
    void copyTextToClipboard(url(withTime)).then((ok) =>
      playerHost().toast(ok ? receipt : 'CopiarFallido, Por favorManualCopiarDirección栏', { timeout: 4000, warn: !ok }));
  };
  const items: MenuItem[] = [
    { icon: 'repeat', label: 'Reproducción en bucle', checked: !!player.loop(), run: () => player.loop(!player.loop()) },
    mini ? { icon: 'maximize-2', label: 'Expandir', run: () => hooks?.expand() }
      : { icon: 'picture-in-picture-2', label: '迷你Reproductor', run: () => hooks?.toMiniplayer() },
  ];
  if (document.pictureInPictureEnabled) {
    items.push({ icon: 'player-pip', fill: true, label: 'Imagen en imagen',
      run: () => player.el().querySelector<HTMLElement>('.vjs-picture-in-picture-control')?.click() });
  }
  items.push({ icon: 'link', label: 'CopiarVideosURL', run: () => copy(false, 'CopiadoVideosURL') });
  items.push({ icon: 'link', label: 'CopiarActualHoraVideosURL', run: () => copy(true, 'CopiadoActualHoraVideosURL') });
  const stats = document.getElementById('playerStatsBtn');
  if (!mini && stats && !stats.hidden) items.push({ icon: 'chart', label: 'Estadísticas de reproducción', run: () => stats.click() });
  return items;
}

export function openPlayerMenu(player: VjsPlayer, x: number, y: number): void {
  const menu = menuElement();
  closePlayerMenu();
  /* 舞es模态 dialog, En顶层: 菜单要进它dentro面才盖得住, 否则落En遮罩底abajo.  */
  const stage = playerHost().stage();
  if (stage instanceof HTMLDialogElement && stage.open) stage.append(menu);
  menu.setAttribute('popover', 'manual');
  const items = playerMenuItems(player);
  menu.innerHTML = items.map((item, index) => {
    const checkable = item.checked !== undefined;
    return `<button type="button" role="${checkable ? 'menuitemcheckbox' : 'menuitem'}"${checkable ? ` aria-checked="${item.checked}"` : ''} data-player-menu="${index}">${
      mark(icon(item.icon), item.fill ? 'data-player-menu-fill' : '')}<span>${esc(item.label)}</span>${checkable ? mark(icon('check'), 'data-player-menu-check') : ''}</button>`;
  }).join('');
  presentMenu(menu); menu.showPopover();
  // 量 offsetWidth/offsetHeight: 进场动画起手es scale(.95), getBoundingClientRect 量到es缩过框. 
  menu.style.left = `${Math.max(8, Math.min(x, innerWidth - menu.offsetWidth - 8))}px`;
  menu.style.top = `${Math.max(8, Math.min(y, innerHeight - menu.offsetHeight - 8))}px`;
  const buttons = [...menu.querySelectorAll<HTMLElement>('[data-player-menu]')];
  buttons.forEach((button) => {
    button.onclick = (event) => {
      event.stopPropagation(); const item = items[Number(button.dataset.playerMenu)]; closePlayerMenu(); item?.run();
    };
  });
  const onDown = (event: Event) => { if (!menu.contains(event.target as Node)) closePlayerMenu() };
  const onKey = (event: KeyboardEvent) => {
    /* esteunoabajo Escape Solo关菜单: `preventDefault` 同时拦住舞 dialog  `cancel`, 舞Deja着.  */
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); closePlayerMenu(); return }
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    buttons[(current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus();
  };
  const onScroll = (event: Event) => { if (scrollMovesAnchor(event, player.el())) closePlayerMenu() };
  setTimeout(() => {
    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('keydown', onKey, true);
    window.addEventListener('scroll', onScroll, { capture: true, passive: true });
  }, 0);
  cleanup = () => {
    document.removeEventListener('pointerdown', onDown, true);
    document.removeEventListener('keydown', onKey, true);
    window.removeEventListener('scroll', onScroll, true);
  };
  buttons[0]?.focus();
}

export function wirePlayerContextMenu(player: VjsPlayer): void {
  player.el().addEventListener('contextmenu', (event) => {
    if ((event.target as Element).closest('.vjs-peach-settings-menu')) return;
    event.preventDefault(); openPlayerMenu(player, event.clientX, event.clientY);
  });
  player.on('dispose', closePlayerMenu);
}
