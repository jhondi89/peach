/* 批量(常驻组件 `batch-dock`, `batch-dock-island.tsx`)对壳契约, 以及每语境abajo列哪几Clave. 
 *
 * más选Estado归共享 shell store y application/selection.js: 开关, 选en proceso集, Shift 连选y切páginaCerrar sesiónSoloConuno. 壳每次pesado画
 * 选en proceso态时计数y语境推进来; esteuno面Solo负责画底部ese浮(共用 `SelectionDock`). 点abajo去回到壳
 * `run`: Confirmar弹层, 写Interfaz, 回执yDeshaceres壳dentro按Agrupar分派ese几流程, 忙态挂En传回去eseClavearriba.  */

/** Directorio(含资料páginayEtiquetapágina), 回收站, 垃圾Archivo, 关注página.  */
export type BatchContext = 'catalog' | 'trash' | 'junk' | 'follow';

/** unoClave回到壳哪流程: `batch` 走 `/api/batch`, `region` es判定产地弹层, `follow` 写关注Entrada, 
 *  `junk` es垃圾Archivo判定, `clear` Cerrar sesiónmás选.  */
export type BatchGroup = 'batch' | 'region' | 'follow' | 'junk' | 'clear';

export interface BatchAction {
  group: BatchGroup;
  operation: string;
  label: string;
  glyph: string;
  danger?: boolean;
}

export interface BatchDockProps {
  /** 选en proceso几项; 0 时浮收起.  */
  count: number;
  context: BatchContext;
  /** 垃圾Archivopágina此刻veres"yaExcluir"eseuno: esedentro给"pesadoNuevo判断", 待判断eseuno给"Noes垃圾".  */
  junkDismissed: boolean;
}

export interface BatchDockHost {
  /** esteuno面画进去eseuno层(`[data-batch-dock]`, 本身 `display: contents`), 也就es常驻组件宿主.  */
  root: HTMLElement;
  run(group: BatchGroup, operation: string, button: HTMLButtonElement): void;
}

export interface BatchDockApi {
  render(props: BatchDockProps): void;
}

const CLEAR: BatchAction = { group: 'clear', operation: 'clear', label: 'Cancelar', glyph: 'x' };

/** esteuno语境abajo浮en laClave, 按从izquierda到derecha顺序. "Cancelar"TotalEn最posterior.  */
export function batchActions(context: BatchContext, junkDismissed = false): BatchAction[] {
  switch (context) {
    case 'trash':
      return [
        { group: 'batch', operation: 'restore', label: 'Restaurar', glyph: 'rotate-ccw' },
        { group: 'batch', operation: 'delete', label: 'Eliminar permanentemente', glyph: 'trash', danger: true },
        CLEAR,
      ];
    case 'junk':
      return [
        junkDismissed
          ? { group: 'junk', operation: 'reconsider-junk', label: 'Reclasificar', glyph: 'rotate-ccw' }
          : { group: 'junk', operation: 'dismiss-junk', label: 'No es basura', glyph: 'check' },
        { group: 'junk', operation: 'dispose', label: 'Mover a papelera', glyph: 'trash', danger: true },
        CLEAR,
      ];
    case 'follow':
      return [
        { group: 'follow', operation: 'save', label: 'Guardar en base de datos', glyph: 'bookmark-plus' },
        { group: 'follow', operation: 'seen', label: 'Marcar como visto', glyph: 'eye' },
        { group: 'follow', operation: 'ignored', label: 'Ignorar', glyph: 'eye-off' },
        CLEAR,
      ];
    default:
      return [
        { group: 'batch', operation: 'like', label: 'Me gusta', glyph: 'thumbs-up' },
        { group: 'batch', operation: 'seen', label: 'Visto', glyph: 'eye' },
        { group: 'batch', operation: 'later', label: 'Ver más tarde', glyph: 'bookmark-plus' },
        { group: 'region', operation: 'region', label: '判定Origen', glyph: 'globe' },
        { group: 'batch', operation: 'dispose', label: 'Mover a papelera', glyph: 'trash', danger: true },
        CLEAR,
      ];
  }
}
