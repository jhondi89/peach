export const PREFERENCE_SECTIONS = {
  appearance: 'Apariencia y navegación', playback: 'Explorar y reproducir', jav: 'JAV y nuevos lanzamientos', search: 'Búsqueda y recomendaciones', content: 'Visualización de contenido',
} as const;
export const CONFIGURATION_SECTIONS = {
  library: 'Biblioteca y catalogación', subscriptions: 'Fuentes y suscripciones', downloads: 'Canal de descarga', network: 'Red y acceso', maintenance: 'App y mantenimiento',
  diagnostics: 'Diagnóstico del sistema',
} as const;
export type ConfigurationPath = `/settings/${keyof typeof CONFIGURATION_SECTIONS}`;
export function configurationSection(path: string): string {
  return CONFIGURATION_SECTIONS[path.split('/')[2] as keyof typeof CONFIGURATION_SECTIONS] || CONFIGURATION_SECTIONS.library;
}
export const PREFERENCE_PATHS = ['/settings', ...Object.keys(PREFERENCE_SECTIONS).map(key => `/settings/${key}`)];
export const isPreferencePath = (path: string): boolean => PREFERENCE_PATHS.includes(path);
export function preferenceSection(path: string): string {
  return PREFERENCE_SECTIONS[path.split('/')[2] as keyof typeof PREFERENCE_SECTIONS] || PREFERENCE_SECTIONS.appearance;
}
export function settingsPath(title: string): string {
  const key = Object.entries({ ...PREFERENCE_SECTIONS, ...CONFIGURATION_SECTIONS }).find(([, value]) => value === title)?.[0];
  return `/settings/${key || 'appearance'}`;
}
export interface SettingsBackground {
  pathname: string; search: string; state: unknown; seq: number;
}
export const settingsBackgroundOf = (state: unknown): SettingsBackground | null => {
  const background = (state as { settingsBackground?: SettingsBackground } | null)?.settingsBackground;
  return background && typeof background.pathname === 'string' ? background : null;
};
