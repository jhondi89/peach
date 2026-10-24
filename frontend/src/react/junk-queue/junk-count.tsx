/* 垃圾Archivopágina计数行: uno摘要面(esteuno视Imagen, esteuno类Conmásmenos) y unoCategoría. 
 *
 * CategoríaCon哪几项, 选en proceso哪uno项, veres待判断还esyaExcluir, Todo由地址决定, etc.Datos时就es最终样子; 
 * 随Por favor求变SoloCon摘要dentroese数 y 各类计数徽标, Datos没到时它们让给占. 壳En React 包Cargar
 * 之anterior铺eseuno版(`src/junk-queue.ts`  `junkCountSkeletonHtml`) y aquíetc.Datos时逐项相同. 
 *
 * CategoríaesprimeropáginaFiltrareseuno副: uno玻璃浮层, 当anterioreseuno类底abajo垫uno滑动玻璃, Pasar el ratón时滑到指针abajo
 * eseuno(`components/use-view-glide.ts`). 分隔线derecha边"yaExcluir/返回待判断"es换视Imagen, 
 * No归este玻璃: yaExcluir视Imagenabajo它 y "Todo"同时es当anterior项, 它自己静止垫uno同料玻璃. 
 *
 * Categoría仍es `<a href>`: 要落到地址arriba, puedeprofundo链, puedeActualizarRestaurar, en procesoClavey修饰Clave照Explorar dispositivoPredeterminado开NuevoEtiqueta. 
 * 普通izquierdaClave交给壳, 由它收起más选, 改地址ypesado读. 计数Como 0 eseuno类Completo徽标No画.  */
import { useRef, type MouseEvent } from 'react';

import { JUNK_KIND_OPTIONS, junkPath, junkSummaryLabel, junkViewLink } from '../../junk-queue';
import { CollectionSummary } from '../components/collection-summary';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { useViewGlide } from '../components/use-view-glide';
import { junkCount, type JunkPage, type JunkRoute } from './junk-queue';

function Icon({ name }: { name: string }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><use href={`#i-${name}`} /></svg>;
}

function Badge({ scope, count }: { scope: string; count: number }) {
  if (!count) return null;
  return <>{' '}<span data-count-badge={`junk:${scope}`}>{count.toLocaleString()}</span></>;
}

export function JunkCount({ route, page, failed, onNavigate }: {
  route: JunkRoute; page: JunkPage | undefined; failed: boolean; onNavigate(path: string): void;
}) {
  const nav = useOverlayScrollbar<HTMLElement>();
  const pane = useRef<HTMLSpanElement>(null);
  const { kind, view } = route;
  /* 计数徽标到货, 判过uno批posterior计数变, 各ancho度跟着变: este些数也算进Clavedentro, 玻璃pesadoNuevo落.  */
  const counts = page ? JUNK_KIND_OPTIONS.map(([key]) => junkCount(page, key)).join(',') : '';
  const glide = useViewGlide(pane, nav, '[data-junk-kind-link][aria-current="page"]', `${view}:${kind}:${counts}`);
  const other = junkViewLink(view);
  const click = (event: MouseEvent<HTMLElement>) => {
    const link = (event.target as HTMLElement).closest('a');
    if (!link || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onNavigate(link.getAttribute('href') || junkPath());
  };
  /* 读No到就No再转圈: FalloOriginal因写EnCuadrículaeseuno格dentro, aquíSolo说"Sin数".  */
  const figure = page ? `${Number(page.total || 0).toLocaleString()} ` : failed ? '—' : '';
  return (
    <div data-junk-count="">
      <div data-junk-summary="" aria-live="polite">
        <CollectionSummary label={junkSummaryLabel(view)} figure={figure} pending={!page && !failed} flush />
      </div>
      <div data-junk-filters-frame="" data-filter-glass="" data-glass-pane="">
        <span ref={pane} data-view-glide="" aria-hidden="true" />
        <nav ref={nav} data-junk-filters="" aria-label="Clasificación de basura" onClick={click} onPointerLeave={glide.leave}>
          {JUNK_KIND_OPTIONS.map(([key, label, glyph]) => (
            <a key={key || 'all'} href={junkPath(key, view)} data-junk-kind-link={key}
              aria-current={key === kind ? 'page' : undefined} onPointerEnter={glide.hover}>
              <Icon name={glyph} />{label}<Badge scope={key} count={page ? junkCount(page, key) : 0} />
            </a>
          ))}
          <i data-junk-divider="" aria-hidden="true" />
          <a href={other.href} data-junk-view-link={other.view} aria-current={view === 'dismissed' ? 'page' : undefined}
            onPointerEnter={view === 'dismissed' ? undefined : glide.hover}>
            <Icon name={other.glyph} />{other.label}<Badge scope="dismissed" count={Number(page?.dismissed_total || 0)} />
          </a>
        </nav>
      </div>
    </div>
  );
}
