import { icon } from '@peach/legacy/core';

import { islandButton, islandGlyph, islandSelect } from './island-skeleton';

/* "escanearyRecolectar""媒体修复"两卡正文. 卡片本体由 React 画, 骨架y遗Deja层取数占
   画es同uno段话: 写两话, 骨架en laese句会比真卡cortouno截, continuar管时Completo卡跳uno次.  */
export const SCAN_CARD_TEXT = 'SincronizarArchivoyPelículaDetalles, 按Configuración生成LocalVista previa de video. abajo拉菜单Opcional择SoloEscanearArchivo, SincronizarCatalogadoPelícula, 生成Vista previa或Completar detalles. ';
export const REPAIR_CARD_TEXT = '修缺Hora戳表(Reproducir卡顿) y 缺Indexar(打No开) MP4. 常ver片子先修. ';

const bar = '<span class="skeleton skeleton-text" aria-hidden="true"></span>';
/* 要etc.Datos才能执行Clavees真按No: Original生 `disabled` 挡住点击y聚焦, `data-skeleton-action`
   让各档按ClaveEn骨架dentroUnificado成同uno副禁用面(`board.css`), 尺寸仍es最终eseuno档, Datosuno到Solo换Color.  */
const waiting = 'type="button" disabled data-skeleton-action';

/* 两 React 卡骨架包En同uno层 `.peach-react` dentro, 按Claveyabajo拉照 Board UI 尺寸画(见
   `island-skeleton.ts`). 卡片esteuno层结构照 React ese两卡抄: exterior面uno列 `gap-4`, Títuloy正文
   同uno对字级. abajo拉框dentroSoloesuno截占, NoesControles, Deja `aria-disabled` 就够.  */
const waitingAction = 'disabled data-skeleton-action';
const unavailable = 'aria-disabled="true"';
const island = (card: string) => `<div class="peach-react"><div class="flex flex-col gap-4">${card}</div></div>`;
const cardText = (title: string, text: string) => `<div data-geist-fieldset-content>
          <h3 class="text-title-2-medium text-text-primary">${title}</h3>
          <p class="text-body-2-regular text-text-secondary">${text}</p></div>`;

/** "escanearyRecolectar"卡: y React `LibraryProcessingCard` 同uno副容Dispositivo, 同uno段正文, 同uno组Clave. 
 *  "复核资料"SoloEnCon候选时出现, aquíNo预画.  */
export function scanCardSkeletonHtml(): string {
  return island(`<section aria-label="Escaneo y recopilación" data-geist-fieldset data-cleanup-task data-cleanup-processing data-fieldset-stack>
        ${cardText('Escaneo y recopilación', SCAN_CARD_TEXT)}
        <footer data-geist-fieldset-footer><a href="/sources" class="inline-flex items-center justify-center gap-1 whitespace-nowrap font-sans rounded-sm text-body-medium text-accent-600"><span>Fuentes y credenciales</span>${islandGlyph('arrow-up', 'size-[18px] shrink-0 rotate-90')}</a><span data-button-group data-split-button data-variant="primary">${islandButton({ glyph: 'database', label: 'Sincronizar biblioteca', attrs: waitingAction })}${islandButton({ glyph: 'chevron-down', attrs: `${waitingAction} aria-label="Más opciones de sincronización"` })}</span></footer>
      </section>`);
}

/** "媒体修复"卡: página脚媒体Bibliotecaabajo拉框先按最终尺寸画出来, Biblioteca名要etc.Datos; "Empezar修复"要etc.选定
 *  媒体Biblioteca, 骨架dentroes禁用态.  */
export function repairCardSkeletonHtml(): string {
  return island(`<section aria-label="Reparación de medios" data-geist-fieldset data-cleanup-task data-cleanup-processing>
        ${cardText('Reparación de medios', REPAIR_CARD_TEXT)}
        <footer data-geist-fieldset-footer>${islandSelect(bar, { className: 'w-48', attrs: unavailable })}${islandButton({ label: 'Iniciar reparación', attrs: waitingAction })}</footer>
      </section>`);
}

/** primero屏复用读数卡, tresTarea卡, 链continuarGestionary资源Sincronizar最终容Dispositivo; 静态Título, 正文 y Clave立即呈现.  */
export function cleanupSkeletonHtml(): string {
  const stats = [['Revisión manual', 'square-check-big'], ['Versión HD', 'sparkles'], ['Archivos duplicados', 'file-stack'], ['Archivos basura', 'file-archive'], ['Papelera', 'trash']];
  const presets = `<span class="geist-button ui-organize-preset-skeleton">${bar}</span>`.repeat(3);
  const organizeField = (label: string) => `<div class="ui-organizefield"><span>${label}</span>
            <span class="geist-input ui-organize-input-skeleton">${bar}</span></div>`;
  return `<div class="ui-cleanuppage" data-skeleton="cleanup" aria-busy="true" aria-label="CargandoGestión de datosEstado">
    <div class="ui-cleanupstats">${stats.map(([title, glyph]) => `
      <button type="button" class="board-plain-stat" disabled>
        <span class="ui-board-plain-stat-head"><span class="ui-board-stat-tile">${icon(glyph!)}</span>${title}</span>
        <strong>${bar}</strong><span class="cleanupmeta">${bar}</span></button>`).join('')}</div>
    <div class="cleanupgrid">
      <div class="cleanupscraping">${scanCardSkeletonHtml()}</div>
      <div class="cleanupmediarepair">${repairCardSkeletonHtml()}</div>
      <section class="cleanupfieldset cleanuporganize" data-geist-fieldset data-cleanup-task aria-labelledby="cleanup-loading-organize">
        <div class="geist-fieldset-content"><h3 class="geist-fieldset-title" id="cleanup-loading-organize">Organizar</h3>
          <p>Renombrar archivos con plantilla y moverlos al directorio. Primero Vista previa, luego Confirmar; se puede deshacer el lote completo.</p>
          <div class="ui-organizefields">
            <div class="organizesource"><span class="ui-gselect"><span class="gselectfield organize-source-skeleton">${bar}${icon('chevron-down')}</span></span></div>
            ${organizeField('Plantilla de nombre de archivo')}
            ${organizeField('Plantilla de directorio')}
            <div class="ui-organizepresets">${presets}</div>
            <p class="cleanupmeta">${bar}</p>
          </div></div>
        <footer class="geist-fieldset-footer" data-geist-fieldset-footer><button class="geist-button primary" ${waiting}>Vista previa</button></footer>
      </section></div>
    <section class="ui-resourcesync" aria-labelledby="cleanup-loading-links">
      <h2 id="cleanup-loading-links">Gestión de enlaces</h2>
      <div class="resourcesyncbox" data-geist-fieldset data-cleanup-task data-fieldset-stack>
        <div class="resourcesyncbody geist-fieldset-content"><h3 class="geist-fieldset-title">Enlace externo</h3>
          <div class="linksummary"><div class="ui-linkstats"><div><span>Total de enlaces</span><b>${bar}</b><small>${bar}</small></div>${['Sitio oficial/Agencia', 'Cuenta social', 'Sitio de información de obras'].map(title => `<div><span>${title}</span><b>${bar}</b></div>`).join('')}</div>
          <div class="ui-linkhosts"><span>Sitio principal</span><b>${bar}</b></div></div></div>
        <div class="resourcesyncfooter geist-fieldset-footer" data-geist-fieldset-footer><button class="resourceaction primary" ${waiting}>${icon('unlink')}<span>Verificar enlaces rotos</span></button></div>
      </div></section>
    <section class="ui-resourcesync" aria-labelledby="cleanup-loading-sync">
      <h2 id="cleanup-loading-sync">Sincronización de recursos</h2>
      <div class="resourcesyncbox" data-geist-fieldset data-cleanup-task>
        <div class="resourcesyncbody geist-fieldset-content"><h3 class="geist-fieldset-title">ArchivoyRegistro核对</h3>
          <p>Verificar los archivos de la colección en disco local y en la nube, listar registros sin archivo, carpetas vacías y cachés sin referencia.</p></div>
        <div class="resourcesyncfooter geist-fieldset-footer" data-geist-fieldset-footer><button class="resourceaction primary" ${waiting}>${icon('git-compare')}<span>Verificar archivos</span></button></div>
      </div></section></div>`;
}
