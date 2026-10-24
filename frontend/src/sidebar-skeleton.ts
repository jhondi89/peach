/* 侧栏导航骨架: 壳启动时Sincronizar写进 `#drawerScroll`, 路由树画arriba常驻组件 `sidebar`(`react/sidebar/`)eseuno刻
 * Completo换掉. 
 *
 * izquierda侧导航Solo认地址 y 本地Configuración, unoPor favor求都Noetc.; React 包装载回来之anterioresteuno列No能es空. 骨架y组件画es
 * 同uno结构(Título行空槽, 导航eseuno列), 两者之间换手Sin移.  */
const escape = (value: string) => value.replace(/[&<>"']/g, (char) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

/** `order` es `appSettings.sidebarOrder`, `catalog` es `[Clave, 名称, 字形]` Todo入口, `pressed` es壳 `navOn`.  */
export function sidebarSkeletonHtml(
  order: readonly string[], catalog: readonly (readonly [string, string, string])[], pressed: (key: string) => boolean,
): string {
  const byKey = new Map(catalog.map((item) => [item[0], item]));
  const buttons = order.map((key) => byKey.get(key)).filter((item) => item !== undefined).map(([key, label, glyph]) => {
    const mark = key === ''
      ? '<img data-sidebar-home-logo="" src="/peach-logo.png" alt="">'
      : `<svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${escape(glyph)}"/></svg>`;
    return `<button type="button" data-nav="${escape(key)}" aria-pressed="${pressed(key)}" aria-label="${escape(label)}">`
      + `${mark}<span>${escape(label)}</span></button>`;
  });
  return `<div data-sidebar-head=""></div><div data-sidebar-nav="">${buttons.join('')}</div>`;
}
