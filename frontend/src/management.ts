import { icon } from '@peach/legacy/core';

import { islandButton, islandGlyph, islandSelect } from './island-skeleton';

/* 「扫描与采集」「媒体修复」两张卡的正文。卡片本体由 React 画，骨架与遗留层的取数占位
   画的是同一段话：写两份的话，骨架上的那句会比真卡短一截，接管时整张卡跳一次。 */
export const SCAN_CARD_TEXT = 'Sincroniza archivos y datos de videos y genera vistas previas locales según los ajustes. En el menú puedes elegir solo escanear archivos, sincronizar videos ya importados, generar vistas previas o completar datos.';
export const REPAIR_CARD_TEXT = 'Repara MP4 sin tabla de tiempos (se traban al reproducir) o sin índice (no abren). Primero los que más ves.';

const bar = '<span class="skeleton skeleton-text" aria-hidden="true"></span>';
/* 要等数据才能执行的键是真的按不了：原生 `disabled` 挡住点击与聚焦，`data-skeleton-action`
   让各档按键在骨架里统一成同一副禁用面（`board.css`），尺寸仍是最终那一档，数据一到只换颜色。 */
const waiting = 'type="button" disabled data-skeleton-action';

/* 两张 React 卡的骨架包在同一层 `.peach-react` 里，按键与下拉照 Board UI 的尺寸画（见
   `island-skeleton.ts`）。卡片这一层的结构照 React 那两张卡抄：外面一列 `gap-4`，标题与正文
   同一对字级。下拉框里只是一截占位条，不是控件，留 `aria-disabled` 就够。 */
const waitingAction = 'disabled data-skeleton-action';
const unavailable = 'aria-disabled="true"';
const island = (card: string) => `<div class="peach-react"><div class="flex flex-col gap-4">${card}</div></div>`;
const cardText = (title: string, text: string) => `<div data-geist-fieldset-content>
          <h3 class="text-title-2-medium text-text-primary">${title}</h3>
          <p class="text-body-2-regular text-text-secondary">${text}</p></div>`;

/** 「扫描与采集」卡：与 React `LibraryProcessingCard` 同一副容器、同一段正文、同一组键。
 *  「复核资料」只在有候选时出现，这里不预画。 */
export function scanCardSkeletonHtml(): string {
  return island(`<section aria-label="Escaneo y obtención de datos" data-geist-fieldset data-cleanup-task data-cleanup-processing data-fieldset-stack>
        ${cardText('Escaneo y obtención de datos', SCAN_CARD_TEXT)}
        <footer data-geist-fieldset-footer><a href="/sources" class="inline-flex items-center justify-center gap-1 whitespace-nowrap font-sans rounded-sm text-body-medium text-accent-600"><span>Fuentes y credenciales</span>${islandGlyph('arrow-up', 'size-[18px] shrink-0 rotate-90')}</a><span data-button-group data-split-button data-variant="primary">${islandButton({ glyph: 'database', label: 'Sincronizar biblioteca', attrs: waitingAction })}${islandButton({ glyph: 'chevron-down', attrs: `${waitingAction} aria-label="Más formas de sincronizar"` })}</span></footer>
      </section>`);
}

/** 「媒体修复」卡：页脚的媒体库下拉框先按最终尺寸画出来，库名要等数据；「开始修复」要等选定
 *  媒体库，骨架里是禁用态。 */
export function repairCardSkeletonHtml(): string {
  return island(`<section aria-label="Reparación de medios" data-geist-fieldset data-cleanup-task data-cleanup-processing>
        ${cardText('Reparación de medios', REPAIR_CARD_TEXT)}
        <footer data-geist-fieldset-footer>${islandSelect(bar, { className: 'w-48', attrs: unavailable })}${islandButton({ label: 'Empezar a reparar', attrs: waitingAction })}</footer>
      </section>`);
}

/** 首屏复用读数卡、三张任务卡、链接管理与资源同步的最终容器；静态标题、正文和键立即呈现。 */
export function cleanupSkeletonHtml(): string {
  const stats = [['Revisión manual', 'square-check-big'], ['Versiones HD', 'sparkles'], ['Archivos duplicados', 'file-stack'], ['Archivos basura', 'file-archive'], ['Papelera', 'trash']];
  const presets = `<span class="geist-button ui-organize-preset-skeleton">${bar}</span>`.repeat(3);
  const organizeField = (label: string) => `<div class="ui-organizefield"><span>${label}</span>
            <span class="geist-input ui-organize-input-skeleton">${bar}</span></div>`;
  return `<div class="ui-cleanuppage" data-skeleton="cleanup" aria-busy="true" aria-label="Cargando estado de la gestión de datos">
    <div class="ui-cleanupstats">${stats.map(([title, glyph]) => `
      <button type="button" class="board-plain-stat" disabled>
        <span class="ui-board-plain-stat-head"><span class="ui-board-stat-tile">${icon(glyph!)}</span>${title}</span>
        <strong>${bar}</strong><span class="cleanupmeta">${bar}</span></button>`).join('')}</div>
    <div class="cleanupgrid">
      <div class="cleanupscraping">${scanCardSkeletonHtml()}</div>
      <div class="cleanupmediarepair">${repairCardSkeletonHtml()}</div>
      <section class="cleanupfieldset cleanuporganize" data-geist-fieldset data-cleanup-task aria-labelledby="cleanup-loading-organize">
        <div class="geist-fieldset-content"><h3 class="geist-fieldset-title" id="cleanup-loading-organize">Organizar</h3>
          <p>Renombra archivos según una plantilla y los ordena en carpetas. Primero ves una vista previa y lo ejecutas al confirmar; cada lote ejecutado se puede deshacer completo.</p>
          <div class="ui-organizefields">
            <div class="organizesource"><span class="ui-gselect"><span class="gselectfield organize-source-skeleton">${bar}${icon('chevron-down')}</span></span></div>
            ${organizeField('Plantilla de nombre de archivo')}
            ${organizeField('Plantilla de carpeta')}
            <div class="ui-organizepresets">${presets}</div>
            <p class="cleanupmeta">${bar}</p>
          </div></div>
        <footer class="geist-fieldset-footer" data-geist-fieldset-footer><button class="geist-button primary" ${waiting}>Vista previa</button></footer>
      </section></div>
    <section class="ui-resourcesync" aria-labelledby="cleanup-loading-links">
      <h2 id="cleanup-loading-links">Gestión de enlaces</h2>
      <div class="resourcesyncbox" data-geist-fieldset data-cleanup-task data-fieldset-stack>
        <div class="resourcesyncbody geist-fieldset-content"><h3 class="geist-fieldset-title">Enlaces externos</h3>
          <div class="linksummary"><div class="ui-linkstats"><div><span>Total de enlaces</span><b>${bar}</b><small>${bar}</small></div>${['Web oficial / agencia', 'Redes sociales', 'Sitios de datos de obras'].map(title => `<div><span>${title}</span><b>${bar}</b></div>`).join('')}</div>
          <div class="ui-linkhosts"><span>Sitios principales</span><b>${bar}</b></div></div></div>
        <div class="resourcesyncfooter geist-fieldset-footer" data-geist-fieldset-footer><button class="resourceaction primary" ${waiting}>${icon('unlink')}<span>Buscar enlaces rotos</span></button></div>
      </div></section>
    <section class="ui-resourcesync" aria-labelledby="cleanup-loading-sync">
      <h2 id="cleanup-loading-sync">Sincronización de recursos</h2>
      <div class="resourcesyncbox" data-geist-fieldset data-cleanup-task>
        <div class="resourcesyncbody geist-fieldset-content"><h3 class="geist-fieldset-title">Revisión de archivos y registros</h3>
          <p>Busca uno por uno en discos locales y en la nube los archivos de cada registro de la colección, y lista los registros cuyo archivo ya no existe, las carpetas vacías y la caché que ya nadie usa.</p></div>
        <div class="resourcesyncfooter geist-fieldset-footer" data-geist-fieldset-footer><button class="resourceaction primary" ${waiting}>${icon('git-compare')}<span>Revisar archivos</span></button></div>
      </div></section></div>`;
}
