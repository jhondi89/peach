/* 面板dentro沿用tres样共用Controles: Geist Switch(`iconSwitchHtml`), Geist Select(`selectFieldHtml`)y
 * 自绘拉(`dialSliderHtml`). 
 *
 * 它们模板, Clave盘y动效En `src/ui-kit/` uno, primeropáginaFiltrar, 卡片版 y Configuraciónpágina用es
 * 同uno套; aquíSolo给每unouno容Dispositivo, 由助手 HTML 写进去再continuar线. 分段滑由 `board-controls.ts`
 * En body en la观察Dispositivover到Nuevo节点时自动continuararriba. 
 *
 * React No进este几容Dispositivo子树: 容DispositivodentroSoloCon `ref`, Sin JSX 子节点, 协调时No会去动助手写abajo DOM.  */
import { useLayoutEffect, useRef } from 'react';

import {
  dialSliderHtml, iconSwitchHtml, selectFieldHtml, setActionBusy, wireDialSlider, wireIconSwitch, wireSelectField,
} from '@peach/legacy/ui';

import type { Choice } from './settings-panel-api';

const rows = (options: readonly Choice[]): Choice[] => options.map(([value, label, mark]) => mark ? [value, label, mark] : [value, label]);

/** uno组互斥视Imagen. `value` yAnterior次画出来No同, 或者面板pesadoNuevoAbrir(`epoch` 换)时Completopesado画: 
 *  滑按Nuevo选en proceso项pesadoNuevo量Ubicación. 点选本身Nopesado画, DOM ya经es点完样子. `variant` es遗Deja模板
 *  `iconSwitchHtml` 认ese修饰类(Temaese组圆钮, Portadaese两组文字档), 样En遗Deja表dentro.  */
export function IconSwitch({ id, name, legend, options, value, attr, variant, text = false, epoch, onChoose }: {
  id: string; name: string; legend: string; options: readonly Choice[]; value: string;
  attr: string; variant: string; text?: boolean; epoch: number; onChoose(value: string): void;
}) {
  const mount = useRef<HTMLDivElement | null>(null);
  const painted = useRef<{ value: string; epoch: number } | null>(null);
  const choose = useRef(onChoose);
  choose.current = onChoose;
  useLayoutEffect(() => {
    const node = mount.current;
    if (!node) return;
    if (painted.current && painted.current.value === value && painted.current.epoch === epoch) return;
    node.innerHTML = iconSwitchHtml(name, legend, rows(options), value, { attr, className: variant, text });
    wireIconSwitch(node, attr, (next) => {
      painted.current = { value: next, epoch };
      choose.current(next);
    });
    painted.current = { value, epoch };
  });
  return <div id={id} ref={mount} />;
}

/** unoabajo拉. 触发Dispositivoarribaeseuno格contenidopuede由 `decorate` 改写(Ordenar方向eseuno格叠着两箭头).  */
export function SelectField({ id, label, options, value, disabled = false, busy = false, hidden, describedBy, epoch, onPick, decorate }: {
  id: string; label: string; options: readonly Choice[]; value: string; disabled?: boolean; busy?: boolean;
  hidden?: boolean; describedBy?: string; epoch: number; onPick(value: string): void;
  decorate?(field: HTMLElement): void;
}) {
  const mount = useRef<HTMLDivElement | null>(null);
  const field = useRef<(HTMLElement & { value: string; disabled: boolean }) | null>(null);
  const built = useRef(-1);
  const pick = useRef(onPick);
  pick.current = onPick;
  useLayoutEffect(() => {
    const node = mount.current;
    if (!node) return;
    if (built.current !== epoch || !field.current) {
      node.innerHTML = selectFieldHtml(rows(options), value, { label });
      const root = wireSelectField(node.firstElementChild as HTMLElement);
      root.addEventListener('change', () => pick.current(root.value));
      field.current = root;
      built.current = epoch;
    }
    const root = field.current;
    if (root.value !== value) root.value = value;
    if (root.disabled !== disabled) root.disabled = disabled;
    if ((root.getAttribute('aria-busy') === 'true') !== busy) setActionBusy(root, busy);
    decorate?.(root);
  });
  return <div id={id} ref={mount} hidden={hidden} aria-describedby={describedBy} />;
}

/** uno行"Etiqueta + 0–max 拉". 拉由助手continuarEnEtiquetaposterior面,  y Etiqueta同Comoesteuno行直continuar子节点; React Solo管
 *  Etiquetaeseuno格. 拖动en proceso每uno步走 `onStep`, 松手, Clave盘落Clave才走 `onSettle`.  */
export function DialRow({ field, label, max, value, hidden, onStep, onSettle }: {
  field: string; label: string; max: number; value: number; hidden: boolean;
  onStep(value: number): void; onSettle(value: number): void;
}) {
  const row = useRef<HTMLDivElement | null>(null);
  const dial = useRef<{ value: number; set(next: number): void } | null>(null);
  const handlers = useRef({ onStep, onSettle });
  handlers.current = { onStep, onSettle };
  useLayoutEffect(() => {
    const node = row.current;
    if (!node || dial.current) return;
    node.insertAdjacentHTML('beforeend', dialSliderHtml({ value, min: 0, max, step: 1, label, attr: `data-glow-dial="${field}"` }));
    dial.current = wireDialSlider(node.lastElementChild as HTMLElement, {
      onInput: (next) => handlers.current.onStep(next),
      onChange: (next) => handlers.current.onSettle(next),
    });
  });
  useLayoutEffect(() => {
    if (dial.current && dial.current.value !== value) dial.current.set(value);
  }, [value]);
  return (
    <div data-glow-field={field} hidden={hidden} ref={row}>
      <span data-glow-field-label="">{label}</span>
    </div>
  );
}
