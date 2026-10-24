/* Gestionar区página头(ADR-0031 No. 11g 步): Gestionar, 面包屑, página面Títuloy回收站Descripción行. 
 *
 * 常驻组件 `manage-header`(`router/managed-routes.tsx` 常驻表): 路由树它画进壳常驻
 * `[data-manage-header]`(`display: contents`, cuatro直continuar落En `main` 流dentro), 宿主就esese节点本身. 壳启动时
 * 先SincronizarEn宿主dentro写uno同结构骨架(`manageHeaderSkeletonHtml`); Abriresteuno面时 `place` 清掉骨架, 路由树En
 * 同unoTareadentro画出primero帧. primero帧还Sin props, 画成空, 壳拿到句柄就手arribaese推进来. 之posterior壳Solo经
 * `configureManageHeader` 给句柄推 props: 句柄写本模 store 再 `flushSync` 通知, 返回时ya经画bien—壳紧continuar着
 * 就读 `[data-manage-title]` 做Título揭示. 换página, 换读数都落En同uno组件arriba, 导航选en proceso态随地址Sincronizar, 
 * 回收站读数Original地换字. 
 *
 * 宿主No包 `.peach-react`: esteunouno直En Preflight 之exterior, 按钮yTamaño de fuente继承es遗Deja层Todo局Regla, 样TodoEn
 * `manage-header.css`, No用工具类.  */
import { useLayoutEffect, useRef, useSyncExternalStore, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';

import { swapText } from '@peach/legacy/ui';

import { manageHeaderView, TRASH_LEDE_SKELETON_HTML, type ManageHeaderProps, type ManageHeaderView } from '../../manage-header';
import { Icon } from '../settings-panel/icon';
import type { ManageHeaderApi, ManageHeaderHost } from './manage-header-api';
import './manage-header.css';

let host: ManageHeaderHost | null = null;
let props: ManageHeaderProps | null = null;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

/* esteuno面抛错, 被Error边界卸掉之posterior没人订阅, 推进来Solo写进 store, No画, No抛.  */
const api: ManageHeaderApi = {
  render(next) { props = next; flushSync(notify) },
};

/** continuararriba壳给宿主, 拿回página头命令入口. Solo调uno次; 壳 `loadManageHeader` continuar着En路由树dentroAbriresteuno面, 
 *  画arriba之posterior才交出句柄, 壳随即手arribaese props 推进来.  */
export function configureManageHeader(next: ManageHeaderHost): ManageHeaderApi {
  host = next;
  props = null;
  return api;
}

/** 常驻表en laeseuno面: 读本模 store, 宿主还没continuararriba或壳还没推 props 时No画.  */
export function ManageHeaderSurface() {
  const current = useSyncExternalStore(subscribe, () => props);
  return host && current ? <ManageHeader host={host} props={current} /> : null;
}

function ManageHeader({ host: at, props: current }: { host: ManageHeaderHost; props: ManageHeaderProps }) {
  const view = manageHeaderView(current);
  if (!view) return null;
  return (
    <>
      <ManageBar host={at} pressed={view.pressed} menu={current.menu} />
      {view.crumb ? <Crumb host={at} label={view.crumb} /> : null}
      <h2 data-manage-title="" data-compact={view.compact ? '' : undefined}>{view.title}</h2>
      {view.lede.kind === 'none' ? null : <TrashLede host={at} lede={view.lede} />}
    </>
  );
}

/** Gestionar导航使用en proceso性Introduce充选en proceso态; Cambiarposterior当anterior项滚入puede见区域.  */
function ManageBar({ host: at, pressed: key, menu }: Pick<ManageHeaderProps, 'menu'> & { host: ManageHeaderHost; pressed: string }) {
  const row = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const group = row.current;
    const pressed = group?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (!group || !pressed) return;
    const left = pressed.offsetLeft, right = left + pressed.offsetWidth;
    if (left < group.scrollLeft) group.scrollLeft = left;
    else if (right > group.scrollLeft + group.clientWidth) group.scrollLeft = right - group.clientWidth;
  }, [key, menu]);

  return (
    <nav data-manage-bar="" aria-label="Gestionar">
      <div ref={row} data-manage-menu="">
        {menu.map(([entry, label, glyph]) => {
          const on = entry === key;
          return (
            <button key={entry} type="button" data-manage={entry} aria-pressed={on} aria-current={on ? 'page' : undefined}
              onClick={() => at.openManage(entry)}>
              <Icon name={glyph} /><span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ── 面包屑 ──
   Geist Breadcrumbs: Anterior级es链continuar, 当anteriorpáginaes纯文本y带 `aria-current="true"`. href Deja给NuevoEtiquetapáginayderechaClave
   菜单; 普通izquierdaClave走路由, Completopáginapesado载会丢掉返回表面yya读Ubicación.  */
function Crumb({ host: at, label }: { host: ManageHeaderHost; label: string }) {
  const follow = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button) return;
    event.preventDefault();
    at.openDataCleanup();
  };
  return (
    <nav data-manage-crumb="" aria-label="Breadcrumb">
      <ol>
        <li><a href="/data-cleanup" onClick={follow}>Gestión de datos</a><Icon name="chevron-right" /></li>
        <li aria-current="true"><span>{label}</span></li>
      </ol>
    </nav>
  );
}

/* ── 回收站Descripción行 ──
   读数到之anterior铺同形占(izquierda边uno格读数, derecha端unoClave尺寸), Descripción行从进página起就占着自己alto度. 读数eseuno格
   uno直es同uno节点: 每次pesado画说es同uno件事Nuevo读数, 字由 `swapText` Original地换, Con起点puede走. 
   "清空回收站"SoloEn回收站dentroCon东西时出现.  */
type Lede = Exclude<ManageHeaderView['lede'], { kind: 'none' }>;

function TrashLede({ host: at, lede }: { host: ManageHeaderHost; lede: Lede }) {
  return (
    <p className="mono" data-manage-lede="">
      {lede.kind === 'skeleton'
        ? <span data-trash-lede-skeletons="" dangerouslySetInnerHTML={{ __html: TRASH_LEDE_SKELETON_HTML }} />
        : (
          <>
            <LedeText text={lede.text} />
            {lede.total ? (
              <button type="button" data-empty-trash="" data-danger="" title="Eliminar permanentemente el contenido de la papelera"
                onClick={() => at.emptyTrash()}>Vaciar papelera</button>
            ) : null}
          </>
        )}
    </p>
  );
}

function LedeText({ text }: { text: string }) {
  const slot = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => { swapText(slot.current, text) }, [text]);
  return <span ref={slot} data-lede-text="" />;
}
