/* 侧栏Predeterminado给eseocho入口 y 它们次序. primeropágina之posterior先es关注—它es每天ConNuevo东西eseuno屏; JAV es主Biblioteca最常用
   ExplorarModo, 排Entres索引(艺人, Etiqueta, Sello)anterior面; yaEtiquetaes回头找, Gestionar垫底. ReproducirLista y InmersivoModoPredeterminadoNoEn: 
   两者都es从unoObras或uno索引dentro发起动作, 常驻uno格换来es每次都要Omitir它. 要它们人EnConfiguracióndentro加回来, 
   Clave仍En壳 `NAV_CATALOG` dentro. 两清单y `src/peach/web_settings.py` 同名常量逐字比对(test_web_settings.py).  */
export const DEFAULT_SIDEBAR_ORDER: readonly string[] = ['', 'follow', 'jav', 'performers', 'tags', 'studios', 'flagged', 'manage'];
export const OPTIONAL_SIDEBAR_KEYS: readonly string[] = ['playlists', 'immerse', 'stats', 'review', 'data-cleanup', 'trash', 'follow-manage', 'quality'];
const KNOWN_SIDEBAR_KEYS = new Set([...DEFAULT_SIDEBAR_ORDER, ...OPTIONAL_SIDEBAR_KEYS]);
/* 垃圾ArchivoyRepetirArchivo两páginay进DatosGestionar, 存过antiguoClave换成它.  */
const sidebarKeyAlias = (key: string) => (key === 'ads' || key === 'dupes' ? 'data-cleanup' : key);

/** 本机或DatosBibliotecadentro读到侧栏顺序: 认antiguoClave, 去pesado, 丢掉esteuno版Sin入口; uno项No剩时回到Predeterminado顺序.  */
export function normalizeSidebarOrder(value: unknown): string[] {
  const keys = Array.isArray(value) ? value.filter((key): key is string => typeof key === 'string') : [];
  const order = [...new Set(keys.map(sidebarKeyAlias))].filter((key) => KNOWN_SIDEBAR_KEYS.has(key));
  return order.length ? order : [...DEFAULT_SIDEBAR_ORDER];
}

/** 侧栏Filtrar属于当anterior地址对应contenido集合; 其余página面侧栏SoloCon导航.  */
export function sidebarHasCatalogContent(path: string): boolean {
  return ['/', '/unseen', '/watch-later', '/flagged', '/trash', '/junk-files'].includes(path)
    || /^\/assets\//.test(path)
    || /^\/(performers|studios|creators|series|agencies|tags)\/.+/.test(path);
}

/** unocontenido同名EtiquetaSolo计uno次. 调用者传入当anterior实际展示媒体.  */
export function sidebarTagCounts(items: { tags?: string[] }[]): [string, number][] {
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const tag of new Set(item.tags || [])) counts.set(tag, (counts.get(tag) || 0) + 1);
  }
  return [...counts].sort((a, b) => b[1] - a[1]).slice(0, 30);
}
