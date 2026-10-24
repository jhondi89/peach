/** 应用导航的完整词表；默认可见顺序由 sidebar 的持久偏好决定。 */
export type SidebarKey = '' | 'performers' | 'studios' | 'tags' | 'jav' | 'flagged' | 'playlists'
  | 'follow' | 'immerse' | 'manage' | 'stats' | 'taste' | 'review' | 'data-cleanup' | 'trash'
  | 'follow-manage' | 'quality' | 'activity';
export type ManagementKey = 'stats' | 'taste' | 'review' | 'cleanup' | 'trash' | 'follow'
  | 'quality' | 'activity' | 'configuration';
export type NavigationItem<Key extends string = string> = readonly [key: Key, label: string, glyph: string];

export const SIDEBAR_ITEMS = [
  ['', 'Inicio', 'home'],
  ['performers', 'Artistas', 'user-round'],
  ['studios', 'Estudio', 'clapperboard'],
  ['tags', 'Etiquetas', 'tags'],
  ['jav', 'JAV', 'jav'],
  ['flagged', 'Marcados', 'bookmark'],
  ['playlists', 'Listas', 'playlist'],
  ['follow', 'Siguiendo', 'rss'],
  ['immerse', 'Modo inmersivo', 'gallery-vertical-end'],
  ['manage', 'Gestión', 'wrench'],
] as const satisfies readonly NavigationItem<SidebarKey>[];

export const MANAGE_SECTIONS = [
  ['stats', 'Estadísticas', 'chart'],
  ['taste', 'Gustos', 'heart'],
  ['review', 'Revisión manual', 'square-check-big'],
  ['cleanup', 'Datos', 'hard-drive'],
  ['trash', 'Papelera', 'trash'],
  ['follow', 'Gestionar seguimientos', 'rss'],
  ['quality', 'Versiones HD', 'sparkles'],
  ['activity', 'Tareas', 'history'],
  ['configuration', 'Configuración de Peach', 'folder-cog'],
] as const satisfies readonly NavigationItem<ManagementKey>[];

export const MANAGE_MENU_SECTIONS: readonly ManagementKey[] = ['stats', 'taste', 'cleanup', 'follow', 'activity', 'configuration'];
export const getManageMenuSections = (configurable: boolean): readonly NavigationItem<ManagementKey>[] =>
  MANAGE_SECTIONS.filter(([key]) => MANAGE_MENU_SECTIONS.includes(key) && (key !== 'configuration' || configurable));

export const OPTIONAL_SIDEBAR_ITEMS: readonly NavigationItem<SidebarKey>[] = MANAGE_SECTIONS
  .flatMap(([key, label, glyph]): NavigationItem<SidebarKey>[] => key === 'configuration' ? []
    : [[key === 'follow' ? 'follow-manage' : key === 'cleanup' ? 'data-cleanup' : key, label, glyph]]);
export const NAV_CATALOG: readonly NavigationItem<SidebarKey>[] = [...SIDEBAR_ITEMS, ...OPTIONAL_SIDEBAR_ITEMS];
export const DIRECT_MANAGE_NAV: Readonly<Partial<Record<SidebarKey, ManagementKey>>> = {
  stats: 'stats', review: 'review', 'data-cleanup': 'cleanup', trash: 'trash',
  'follow-manage': 'follow', quality: 'quality', activity: 'activity',
};
