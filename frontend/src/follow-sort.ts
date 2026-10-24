/* 关注ListaOrdenar维度y各自Predeterminado方向. React 关注Gestionarpáginay遗Deja层画primero屏骨架都读esteuno: 
   骨架跑En React 包Cargar之anterior, Ordenar框dentro该写哪uno档, 方向Clave该朝哪头, 得跟continuar管posteriores同uno答案.  */

/** 工具栏eseabajo拉en laOrdenar维度. anteriorcuatro按创作者比, posteriortres按单来源比.  */
export const SORT_OPTIONS = [
  ['checked', 'VerificarHora'], ['added', 'Fecha de adición'], ['name', 'CreadorNombre'], ['sources', 'FuenteCantidad'],
  ['source', 'Nombre de fuente'], ['provider', 'Sitio'], ['status', 'Estado'],
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number][0];
export const DEFAULT_SORT: SortKey = 'checked';

export type SortDir = 'asc' | 'desc';

/** 每uno列问ese句话常态: Tiempo问"Reciente先ver", 名字问"从头排".  */
export const SORT_DEFAULT_DIR: Record<SortKey, SortDir> = {
  checked: 'desc', added: 'desc', name: 'asc', sources: 'desc',
  source: 'asc', provider: 'asc', status: 'asc',
};

export const isSortKey = (value: unknown): value is SortKey =>
  SORT_OPTIONS.some(([key]) => key === value);

/** 地址栏en la `sort` / `dir` 落到哪uno档: 认No出Ordenar回Predeterminado, 没写方向就取eseuno档常态.  */
export function resolveFollowSort(sort: unknown, dir: unknown): { sort: SortKey; dir: SortDir } {
  const key = isSortKey(sort) ? sort : DEFAULT_SORT;
  return { sort: key, dir: dir === 'asc' || dir === 'desc' ? dir : SORT_DEFAULT_DIR[key] };
}
