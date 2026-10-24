import { islandButton } from './island-skeleton';

/** 诊断分区primero屏ypáginainteriorEsperando共用同uno结构.  */
export function diagnosticsSkeleton(): string {
  const action = (label: string) => islandButton({ label, variant: 'secondary', attrs: 'disabled data-skeleton-action' });
  const card = (content: string) => `<div class="flex w-full flex-col rounded-2xl bg-background-secondary-default pl-3"><div class="flex flex-col gap-4 py-4 pr-3">${content}</div></div>`;
  const lines = '<span class="skeleton h-5 w-1/3"></span><span class="skeleton h-4 w-2/3"></span>';
  const section = (title: string, content: string) => `<section aria-label="${title}" class="flex w-full flex-col gap-2"><p class="w-full px-3 text-body-2-medium text-text-secondary">${title}</p>${content}</section>`;
  return `<div data-skeleton="diagnostics" aria-busy="true" aria-label="Leyendo diagnóstico del sistema" class="flex min-w-0 flex-col gap-6"><div aria-hidden="true" inert class="flex flex-col gap-6">
    <div class="flex flex-wrap justify-end gap-2">${action('Descargar informe de diagnóstico')}${action('Reverificar')}</div>
    ${section('NecesarioSeguir', card(`<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div class="flex min-w-0 flex-1 flex-col gap-2">${lines}<span class="skeleton h-4 w-1/2"></span></div>${action('Abrir página relacionada')}</div>`))}
    ${section('Salud de la biblioteca', card(lines))}
    ${section('Sesión de fuente', `<div class="flex flex-col gap-3">${card(lines)}${card(lines)}</div>`)}
  </div></div>`;
}
