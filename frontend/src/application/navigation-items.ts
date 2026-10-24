/** 应用导航完Completo词表; Predeterminadopuede见顺序由 sidebar 持久偏bien决定.  */
export type SidebarKey = '' | 'performers' | 'studios' | 'tags' | 'jav' | 'flagged' | 'playlists'
  | 'follow' | 'immerse' | 'manage' | 'stats' | 'taste' | 'review' | 'data-cleanup' | 'trash'
  | 'follow-manage' | 'quality' | 'activity';
export type ManagementKey = 'stats' | 'taste' | 'review' | 'cleanup' | 'trash' | 'follow'
  | 'quality' | 'activity' | 'configuration';
export type NavigationItem<Key extends string = string> = readonly [key: Key, label: string, glyph: string];

export const SIDEBAR_ITEMS = [
  ['', 'Inicio', 'home'],
  ['performers', 'Actriz', 'user-round'],
  ['studios', 'Sello', 'clapperboard'],
  ['tags', 'Etiqueta', 'tags'],
  ['jav', 'JAV', 'jav'],
  ['flagged', 'Marcado', 'bookmark'],
  ['playlists', 'Lista de reproducción', 'playlist'],
  ['follow', 'Seguir', 'rss'],
  ['immerse', 'Modo inmersivo', 'gallery-vertical-end'],
  ['manage', 'Gestionar', 'wrench'],
] as const satisfies readonly NavigationItem<SidebarKey>[];

export const MANAGE_SECTIONS = [
  ['stats', 'Estadísticas', 'chart'],
  ['taste', 'Preferencias', 'heart'],
  ['review', 'Revisión manual', 'square-check-big'],
  ['cleanup', 'Gestión de datos', 'hard-drive'],
  ['trash', 'Papelera', 'trash'],
  ['follow', 'Gestionar seguidos', 'rss'],
  ['quality', 'Versión HD', 'sparkles'],
  ['activity', 'Centro de tareas', 'history'],
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
