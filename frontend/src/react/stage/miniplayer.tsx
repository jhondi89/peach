/* pequeño窗: 舞esteuno面dentro, `<dialog>` 之exteriorese浮层. ReproducirDispositivo实例由 `stage-player.ts` 搬进搬出, 
 * Reproducir态, TiempoyRelación也由它随ReproducirDispositivo事件直continuar写En节点arriba; aquíSolo画uno次骨架结构, continuar按Clavey拖动. 
 * 组件No随舞pesado画(`memo` 且Sin props): `hidden`, `data-corner` y `transform` 都es命令改, 
 * pesado画会它们按初值写回去.  */
import { memo, useEffect, useLayoutEffect, useRef, type MouseEvent } from 'react';

import {
  expandMiniplayer, closeMiniplayer, playMiniplayer, registerMiniplayer, seekMiniplayer,
} from './stage-player';

const Glyph = ({ name }: { name: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>
);

/* ReproducirClavedentroeseuno由 `stage-player.ts` 换成两叠放字形, 所以esteuno格子节点No归 React.  */
const PLAY_GLYPH = { __html: '<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-player-pause"/></svg>' };

const pressed = (run: () => void) => (event: MouseEvent) => { event.stopPropagation(); run() };

export const Miniplayer = memo(function Miniplayer() {
  const root = useRef<HTMLElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const play = useRef<HTMLButtonElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const ahead = useRef<HTMLButtonElement>(null);
  const title = useRef<HTMLSpanElement>(null);
  const sub = useRef<HTMLSpanElement>(null);
  const info = useRef<HTMLButtonElement>(null);

  useLayoutEffect(() => {
    registerMiniplayer({
      root: root.current!, frame: frame.current!, play: play.current!, time: time.current!, back: back.current!,
      ahead: ahead.current!, title: title.current!, sub: sub.current!, info: info.current!,
    });
    return () => registerMiniplayer(null);
  }, []);

  useEffect(() => wireDrag(root.current!, card.current!), []);

  return (
    <aside ref={root} data-miniplayer="" id="miniplayer" data-corner="br" aria-label="pequeño窗Reproducir" hidden>
      <div ref={card} data-miniplayer-card="" id="miniplayerCard">
        <div ref={frame} data-miniplayer-frame="" id="miniplayerFrame">
          <div data-miniplayer-scrim="">
            <button type="button" data-miniplayer-button="expand" id="miniplayerExpand" aria-label="Expandir a detalles"
              aria-keyshortcuts="i" onClick={pressed(expandMiniplayer)}><Glyph name="maximize-2" /></button>
            <button type="button" data-miniplayer-button="close" id="miniplayerClose" aria-label="Desactivarpequeño窗"
              onClick={pressed(closeMiniplayer)}><Glyph name="x" /></button>
            <button ref={back} type="button" data-miniplayer-seek="" id="miniplayerBack"
              onClick={pressed(() => seekMiniplayer(-1))}><Glyph name="rotate-ccw" /></button>
            <button ref={play} type="button" data-miniplayer-play="" id="miniplayerPlay" aria-label="Pausar" aria-keyshortcuts="k"
              onClick={pressed(playMiniplayer)} dangerouslySetInnerHTML={PLAY_GLYPH} />
            <button ref={ahead} type="button" data-miniplayer-seek="" id="miniplayerAhead"
              onClick={pressed(() => seekMiniplayer(1))}><Glyph name="rotate-cw" /></button>
            <span ref={time} className="mono" data-miniplayer-time="" id="miniplayerTime">0:00 / 0:00</span>
          </div>
        </div>
        <button ref={info} type="button" data-miniplayer-info="" id="miniplayerInfo" aria-label="Expandir a detalles"
          onClick={() => expandMiniplayer()}>
          <span ref={title} data-miniplayer-title="" id="miniplayerTitle" />
          <span ref={sub} data-miniplayer-sub="" id="miniplayerSub" />
        </button>
      </div>
    </aside>
  );
});

/* 拖动Solo改 transform, 松手按pequeño窗en proceso心落En哪象限选角, 再用 .5s  transform 过渡吸过去, 过渡完
   data-corner 换成Nuevo角, 清掉 transform—arriba游 AnimatingSnap 就eseste么落回锚点.  */
function snap(root: HTMLElement, dx: number, dy: number): void {
  const rect = root.getBoundingClientRect();
  const corner = (rect.top + rect.height / 2 < innerHeight / 2 ? 't' : 'b') + (rect.left + rect.width / 2 < innerWidth / 2 ? 'l' : 'r');
  const topInset = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--topH')) || 56;
  const base = { left: rect.left - dx, top: rect.top - dy };
  const target = {
    left: corner.endsWith('l') ? 16 : innerWidth - 16 - rect.width,
    top: corner.startsWith('t') ? topInset + 16 : innerHeight - 16 - rect.height,
  };
  root.removeAttribute('data-miniplayer-drag');
  const finish = () => {
    root.removeAttribute('data-miniplayer-snap');
    root.style.transition = 'none'; root.dataset.corner = corner; root.style.transform = '';
    root.getBoundingClientRect(); root.style.transition = '';
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return }
  root.setAttribute('data-miniplayer-snap', '');
  root.style.transform = `translate(${target.left - base.left}px,${target.top - base.top}px)`;
  let done = false;
  const once = () => { if (done) return; done = true; root.removeEventListener('transitionend', once); finish() };
  root.addEventListener('transitionend', once);
  setTimeout(once, 600);
}

function wireDrag(root: HTMLElement, card: HTMLElement): () => void {
  let drag: { id: number; x: number; y: number; dx: number; dy: number; moved: boolean } | null = null;
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || (event.target as Element).closest('[data-miniplayer-button],[data-miniplayer-play],[data-miniplayer-seek],.vjs-control-bar')) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0, dy: 0, moved: false };
    try { card.setPointerCapture(event.pointerId) } catch { /* 指针ya经没 */ }
  };
  const move = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    drag.dx = event.clientX - drag.x; drag.dy = event.clientY - drag.y;
    if (!drag.moved && Math.hypot(drag.dx, drag.dy) < 4) return;
    if (!drag.moved) { drag.moved = true; root.setAttribute('data-miniplayer-drag', ''); root.removeAttribute('data-miniplayer-snap') }
    root.style.transform = `translate(${drag.dx}px,${drag.dy}px)`;
  };
  const release = (event: PointerEvent) => {
    if (!drag || event.pointerId !== drag.id) return;
    const done = drag; drag = null;
    try { card.releasePointerCapture(event.pointerId) } catch { /* 指针ya经没 */ }
    if (!done.moved) return;
    // 拖完松手会紧跟uno click, 落EnInformación栏arriba就es"展开"; esteunoabajoNo算点. 
    root.dataset.dragged = '1'; setTimeout(() => { delete root.dataset.dragged }, 0);
    snap(root, done.dx, done.dy);
  };
  const click = (event: Event) => { if (root.dataset.dragged) { event.stopPropagation(); event.preventDefault() } };
  /* 起手eseunoabajo mousedown No走Explorar dispositivoPredeterminado: 否则拖到No.dos帧, Chrome 会从pequeño窗底abajoese卡PortadaImagen起uno次
     Original生拖放, continuar着发 pointercancel, pequeño窗停EnOriginal处.  */
  const hold = (event: Event) => { if (drag) event.preventDefault() };
  card.addEventListener('pointerdown', down);
  card.addEventListener('mousedown', hold);
  card.addEventListener('pointermove', move);
  card.addEventListener('pointerup', release);
  card.addEventListener('pointercancel', release);
  card.addEventListener('click', click, true);
  return () => {
    card.removeEventListener('pointerdown', down);
    card.removeEventListener('mousedown', hold);
    card.removeEventListener('pointermove', move);
    card.removeEventListener('pointerup', release);
    card.removeEventListener('pointercancel', release);
    card.removeEventListener('click', click, true);
  };
}
