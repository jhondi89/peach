/* 垃圾Colaen launo卡: arriba面 16:9 Vista previa格(SinVista previa时esTipo字形), abajo面名字, Tipo, 理由y
 * Tamaño, 底部tresetc.anchoClave: AbrirUbicación, 判断(Noes垃圾/pesadoNuevo判断), 移入回收站, 再uno行Estado. 
 *
 * 卡片盒复用馆藏Obras卡钩子(`data-media-card`/`data-media-pic`/`data-media-badge`/
 * `data-media-check`): Vista previa格, 来源角标, 选en proceso描边y勾es同uno套, Shift 连选时壳按
 * `[data-media-grid] > [data-media-card]` 数本página卡, 垃圾卡也En其en proceso. 垃圾卡自己几何
 * (描边面, 元Información区, Clave行)写En `./junk-queue.css`, 钩子es `data-junk-*`. 
 *
 * Título照遗Deja层写成转义posterior HTML: `data-middle-truncate` 由en proceso段截断(`src/ui-kit/middle-truncate.ts`)按ancho度
 * 从en proceso间截断, 它直continuar改写esteuno格文字, 交给 React 管话Siguiente次pesado画会 y 它互相覆盖.  */
import { memo, useRef, useState, type CSSProperties, type MouseEvent } from 'react';
import { esc, fmtSize } from '@peach/legacy/core';
import { spinnerHtml } from '@peach/legacy/ui';

import {
  junkDecision, junkKindMeta,
  type JunkItem, type JunkOperation, type JunkQueueActions, type JunkQueueHelpers, type JunkView,
} from './junk-queue';
import { suppressShiftTextSelection } from '../components/row-click';

/** 雪碧Imagenen launo字形, 写法同遗Deja层 `icon()`: 尺寸y描边由样表按Ubicación给.  */
function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

export interface JunkCardProps {
  item: JunkItem;
  view: JunkView;
  selected: boolean;
  selectMode: boolean;
  helpers: JunkQueueHelpers;
  actions: JunkQueueActions;
}

type Busy = '' | 'reveal' | JunkOperation;

const picking = (selectMode: boolean, event: MouseEvent) => selectMode || event.shiftKey || event.ctrlKey || event.metaKey;

function JunkCardView({ item, view, selected, selectMode, helpers, actions }: JunkCardProps) {
  const card = useRef<HTMLElement | null>(null);
  const [busy, setBusy] = useState<Busy>('');
  const [status, setStatus] = useState('');
  const kind = item.junk_kind || 'other';
  const [label, glyph] = junkKindMeta(item);
  const name = String(item.name || '');
  const decision = junkDecision(view);
  const preview = kind === 'video' ? `/thumb?id=${item.id}&c=4` : kind === 'image' ? `/photo-thumb?id=${item.id}` : '';
  const openable = kind === 'video' || kind === 'image';

  /* más选y修饰Clave优先: 点En卡arriba任何地方(Clave行除exterior)都esCambiar选en proceso.  */
  const clickCard = (event: MouseEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('[data-junk-actions]')) return;
    if (!picking(selectMode, event)) return;
    event.preventDefault();
    actions.toggleSelection(item.id, event.shiftKey);
  };
  const clickTitle = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (picking(selectMode, event)) {
      event.preventDefault();
      actions.toggleSelection(item.id, event.shiftKey);
      return;
    }
    if (card.current) actions.open(item, card.current);
  };
  const reveal = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy === 'reveal') return;
    setBusy('reveal');
    setStatus('');
    void actions.reveal(item).then(setStatus, () => {}).finally(() => setBusy(''));
  };
  /* 写 ledger tresClave. Éxitoposterior壳pesado读Cola, este卡随之离开; Fallo由壳报, ClaveRestaurar成puede点.  */
  const operate = (operation: JunkOperation) => (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (busy === operation) return;
    setBusy(operation);
    setStatus('');
    void actions.operate(item, operation).catch(() => {}).finally(() => setBusy(''));
  };
  const busyAttrs = (key: Busy) => (busy === key ? { 'aria-busy': true, 'aria-disabled': true } as const : {});

  const title = openable
    ? <button type="button" data-junk-title="" data-junk-open="" data-middle-truncate="" title={name}
      onClick={clickTitle} dangerouslySetInnerHTML={{ __html: esc(name || 'Recurso sin nombre') }} />
    : <span data-junk-title="" data-middle-truncate="" title={name}
      dangerouslySetInnerHTML={{ __html: esc(name || 'Recurso sin nombre') }} />;

  return (
    <article ref={card} data-media-card="" data-variant="junk" data-junk-card="" data-id={item.id} data-junk-kind={kind}
      data-selected={selected ? '' : undefined} onClick={clickCard} onMouseDown={suppressShiftTextSelection}>
      <div data-media-pic="" style={{ '--card-ratio': String(16 / 9) } as CSSProperties}>
        <span data-media-glyph=""><Icon name={glyph} /><b>{label}</b></span>
        {preview
          ? <span data-media-art="thumb" dangerouslySetInnerHTML={{
            __html: `<img class="poster" src="${preview}" width="640" height="360" alt="" loading="lazy" data-drop="self">`,
          }} />
          : null}
        <div data-media-badge="" dangerouslySetInnerHTML={{ __html: helpers.badgeHtml(item.location || '', item.cost || '') }} />
        <span data-media-check=""><Icon name="check" /></span>
      </div>
      <div data-junk-meta="">
        {title}
        <div data-junk-facts="">
          <span data-junk-who="">{label}</span>
          {item.why ? <span data-junk-why="">{item.why}</span> : null}
          <span data-junk-size="">{Number(item.size) > 0 ? fmtSize(Number(item.size)) : 'Tamaño desconocido'}</span>
        </div>
      </div>
      <footer data-junk-actions="">
        <button type="button" data-junk-action="reveal" title="Mostrar en explorador" aria-label="Mostrar en explorador"
          {...busyAttrs('reveal')} onClick={reveal}>
          {busy === 'reveal' ? <span data-junk-spinner="" dangerouslySetInnerHTML={{ __html: spinnerHtml('Localizando') }} /> : <Icon name="folder-open" />}
          <span data-junk-label="">AbrirPosición</span>
        </button>
        <button type="button" data-junk-action={decision.operation} title={decision.label} aria-label={decision.label}
          {...busyAttrs(decision.operation)} onClick={operate(decision.operation)}>
          <Icon name={decision.glyph} /><span data-junk-label="">{decision.label}</span>
        </button>
        <button type="button" data-junk-action="dispose" title="Mover a papelera" aria-label="Mover a papelera"
          {...busyAttrs('dispose')} onClick={operate('dispose')}>
          <Icon name="trash" /><span data-junk-label="">Mover a papelera</span>
        </button>
        <span data-junk-state="" aria-live="polite">{status}</span>
      </footer>
    </article>
  );
}

/** uno屏arribacien, Seleccionar之exteriorpesado画No该连带每uno: 比较都es引用, 壳递进来助手y动作身No变.  */
export const JunkCard = memo(JunkCardView);
