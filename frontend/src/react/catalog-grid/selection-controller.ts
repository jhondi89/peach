import { junkRoute } from '../../junk-queue';
import { selectRange } from '../../selection';

export type SelectionSurface = 'catalog' | 'follow' | 'junk';
export interface SelectionSets { selected: Set<number>; followSelected: Set<number> }
export interface SelectionState {
  selectMode: boolean;
  selectSurface: string;
  lastSelectedId: number | null;
  followLastSelectedId: number | null;
}

export interface SelectionDock {
  count: number;
  context: SelectionSurface | 'trash';
  junkDismissed: boolean;
}

/** 资料páginay回收站共享DirectorioSeleccionar集; 垃圾Archivo拥ConIndependienteSeleccionarModoRango.  */
export function selectionSurface(pathname: string): SelectionSurface {
  return pathname === '/follow' ? 'follow' : pathname === '/junk-files' ? 'junk' : 'catalog';
}

/** 两 Set 保持常驻, 返回值供唯uno壳Estado写入.  */
export function setSelectionMode(sets: SelectionSets, state: Readonly<SelectionState>,
  surface: SelectionSurface, on: boolean, clear = false): SelectionState {
  if (clear) { sets.selected.clear(); sets.followSelected.clear(); }
  return {
    selectMode: on,
    selectSurface: on ? (state.selectMode ? state.selectSurface : surface) : '',
    lastSelectedId: clear ? null : state.lastSelectedId,
    followLastSelectedId: clear ? null : state.followLastSelectedId,
  };
}

/** 跨业务Rango或进入NopuedeSeleccionarpágina面时清空; Directoriointerior部导航沿用Seleccionar.  */
export function syncSelectionSurface(sets: SelectionSets, state: Readonly<SelectionState>,
  pathname: string, canSelect: boolean): SelectionState {
  const surface = selectionSurface(pathname);
  return state.selectMode && (!canSelect || state.selectSurface !== surface)
    ? setSelectionMode(sets, state, surface, false, true) : { ...state };
}

/** 展示顺序由página面提供, No能混合流en lacorto视频带入Directorio Shift Rango.  */
export function toggleSelection(sets: SelectionSets, state: Readonly<SelectionState>,
  surface: SelectionSurface, visible: number[], id: number, range = false): SelectionState {
  const follow = surface === 'follow';
  const anchor = selectRange(follow ? sets.followSelected : sets.selected, visible,
    follow ? state.followLastSelectedId : state.lastSelectedId, id, range);
  return {
    ...setSelectionMode(sets, state, surface, true),
    ...(follow ? { followLastSelectedId: anchor } : { lastSelectedId: anchor }),
  };
}

/** 批量操作覆盖CompletoSeleccionar集, 计数ContienenoEn当anterior屏幕en laya选Obras.  */
export function selectionDock(sets: SelectionSets, pathname: string, search: string,
  catalogState: string): SelectionDock {
  const surface = selectionSurface(pathname);
  return {
    count: (surface === 'follow' ? sets.followSelected : sets.selected).size,
    context: surface === 'catalog' && catalogState === 'trash' ? 'trash' : surface,
    junkDismissed: junkRoute(search).view === 'dismissed',
  };
}
