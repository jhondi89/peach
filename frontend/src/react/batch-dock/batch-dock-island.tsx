/* 批量(ADR-0031 No. 11g 步): Directorio, 回收站, 垃圾Archivoy关注páginamás选时底部ese浮. 
 *
 * 常驻组件 `batch-dock`(`router/managed-routes.tsx` 常驻表): 路由树它画进壳常驻En `body` último尾
 * `[data-batch-dock]`, 宿主就esese节点本身. 壳Solo拿 `configureBatchDock` 给命令入口: 每次pesado画选en proceso态
 * 推uno计数y语境, 句柄它写进本模 store 再 `flushSync` 通知, 返回时浮ya经画bien—壳紧continuar着就
 * 补扫玻璃贴Imagen(`syncGlassOptics`). 浮exterior壳es共用 `SelectionDock`(复核, Etiquetapágina, 关注Gestionar同uno), 
 * 它要 `.peach-react` 作用域en la token y Preflight, 所以组件exterior面包uno层 `display: contents` 
 * `.peach-react`, No占盒子. 
 *
 * 浮en laClavees透明 `<button>`: 尺寸, 描边, Tamaño de fuentey 17px 字形照 ADR-0031 迁移anterior基线, Todo写En
 * `batch-dock.css`; BoardUI `Button`  medium 档es 20px 字形, 8px Relleno, 对Noarriba. 危险Clave挂
 * `data-danger`, 红色读 `../styles.css` dentroTodo站eseuno危险ClaveRegla.  */
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';

import { SelectionDock } from '../components/selection-dock';
import { batchActions, type BatchDockApi, type BatchDockHost, type BatchDockProps } from './batch-dock-api';
import './batch-dock.css';

let host: BatchDockHost | null = null;
let props: BatchDockProps = { count: 0, context: 'catalog', junkDismissed: false };
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => { listeners.delete(listener) };
}

function notify(): void {
  for (const listener of [...listeners]) listener();
}

/* esteuno面抛错, 被Error边界卸掉之posterior没人订阅, 推进来Solo写进 store, No画, No抛.  */
const api: BatchDockApi = {
  render(next) { props = next; flushSync(notify) },
};

/** continuararriba壳给宿主, 拿回批量命令入口. Solo调uno次; 壳 `loadBatchDock` continuar着En路由树dentroAbriresteuno面.  */
export function configureBatchDock(next: BatchDockHost): BatchDockApi {
  host = next;
  return api;
}

/** 常驻表en laeseuno面: 读本模 store, 宿主还没continuararriba时No画.  */
export function BatchDockSurface() {
  const view = useSyncExternalStore(subscribe, () => props);
  return host ? <BatchDock host={host} props={view} /> : null;
}

function BatchDock({ host: at, props: view }: { host: BatchDockHost; props: BatchDockProps }) {
  return (
    <div className="peach-react" data-batch-scope="" data-context={view.context}>
      <SelectionDock label="所Opciones目Acción" visible={view.count > 0} count={`Ya选 ${view.count.toLocaleString()} 项`}>
        {batchActions(view.context, view.junkDismissed).map((action) => (
          <button key={`${action.group}:${action.operation}`} type="button" data-batch-group={action.group}
            data-batch-action={action.operation} data-danger={action.danger ? '' : undefined}
            onClick={(event) => at.run(action.group, action.operation, event.currentTarget)}>
            <svg aria-hidden viewBox="0 0 24 24"><use href={`#i-${action.glyph}`} /></svg>
            {action.label}
          </button>
        ))}
      </SelectionDock>
    </div>
  );
}
