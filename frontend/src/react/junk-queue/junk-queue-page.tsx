/* 垃圾ArchivoCola(`/junk-files`, 由路由树画进 `#grid`): 计数行加uno屏逐项处置卡片. 
 *
 * página面画En壳 `#grid` dentro, 计数行经 portal 画进 `#count` dentro自己建uno `.peach-react` 容Dispositivo: 
 * eseuno行本身归壳(Directoriopágina也用它, 换página时由壳清空), dentro面摘要yCategoría归aquí. 
 *
 * primero屏NoEn `prefetch` dentroetc.. Categoría由地址决定, 此刻就画得出最终样子, etc.SoloCon读数, 所以unoAbrir
 * 就画: 计数行esEsperando态(`#count[aria-busy]`, 摘要dentrouno占), Cuadrículaes壳ese骨架, Datos到
 * 骨架淡出, 卡片从Difusodentro清晰起来(同DirectorioCuadrícula). En `prefetch` dentroetc.话, Por favor求挂着este段Tiempo
 * 屏arribaSoloCon壳静态骨架, Categoría点No动. 
 *
 * 换Categoría, 换视Imagenes换ConsultaClave, Cuadrícula按NuevoClavepesado挂, pesado铺骨架. 壳处置完推进 `revision` 时Consulta也换Clave, 
 * peroantiguounoDejaEn屏arriba直到Nuevouno到货(`placeholderData`), 被处置ese卡Original地消失, 
 * ya经往abajo露出来ese几段也No收回去.  */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import { requestErrorMessage } from '@peach/legacy/core';
import { loadingDotsHtml, popBadges } from '@peach/legacy/ui';

import { EmptyState } from '../components/empty-state';
import { RetryNote, useSkeletonReveal } from '../components/grid-reveal';
import { spriteGlyph } from '../components/sprite-glyph';
import { JunkCard } from './junk-card';
import { JunkCount } from './junk-count';
import { fetchJunkPage, junkQueryKey, type JunkPage, type JunkQueueProps, type JunkRoute } from './junk-queue';

const CheckGlyph = spriteGlyph('check');

const sameRoute = (key: readonly unknown[], route: JunkRoute) => key[1] === route.view && key[2] === route.kind;

export function JunkQueuePage(props: JunkQueueProps) {
  const route: JunkRoute = { kind: props.kind, view: props.view };
  const query = useQuery<JunkPage, Error>({
    queryKey: junkQueryKey(route, props.revision),
    queryFn: ({ signal }) => fetchJunkPage(route, signal),
    placeholderData: (previous, previousQuery) =>
      (previousQuery && sameRoute(previousQuery.queryKey, route) ? previous : undefined),
  });

  /* uno次取数落定就告诉壳uno次, Éxito, Como空, Fallo都算: 壳dentro `await` este次pesado读调用方据此放行.  */
  useEffect(() => {
    if (!query.isFetching) props.settled?.(props.revision);
  }, [query.isFetching, props.revision]);

  const host = useCountHost(props.countRow);
  const waiting = query.isPending;
  useLayoutEffect(() => {
    const row = props.countRow;
    if (!row) return;
    if (waiting) row.setAttribute('aria-busy', 'true');
    else row.removeAttribute('aria-busy');
  }, [props.countRow, waiting]);
  /* 判过uno批之posterior各类计数变, 弹es变ese几, 没动Original地No动(遗Deja层 `popBadges`).  */
  useLayoutEffect(() => {
    if (host && query.data) popBadges(host, 'junk');
  }, [host, query.data]);

  const { navigate } = props.actions;
  const count = host
    ? createPortal(
      <JunkCount route={route} page={query.data} failed={query.isError && !query.data} onNavigate={navigate} />, host)
    : null;
  return (
    <>
      {count}
      <JunkBody key={`${route.view}:${route.kind}`} props={props} data={query.data} pending={waiting}
        error={query.data ? null : query.error} retry={() => void query.refetch()} />
    </>
  );
}

/** 计数行dentro归esteunopáginaeseuno格. 挂arriba时换掉壳铺骨架, Desinstalar时撤掉, 行本身还给壳.  */
function useCountHost(row: HTMLElement | null): HTMLElement | null {
  const [host, setHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    if (!row) return undefined;
    const el = row.ownerDocument.createElement('div');
    el.className = 'peach-react';
    row.replaceChildren(el);
    setHost(el);
    return () => { el.remove(); setHost(null) };
  }, [row]);
  return host;
}

/** unoCategoría, uno视ImagenCuadrícula: 骨架, 卡片, 往abajo露Siguiente段y空态.  */
function JunkBody({ props, data, pending, error, retry }: {
  props: JunkQueueProps; data: JunkPage | undefined; pending: boolean; error: Error | null; retry(): void;
}) {
  const reveal = useSkeletonReveal(pending, props.skeletonHtml);
  const batch = Math.max(1, props.batchSize || 60);
  const [segments, setSegments] = useState(1);
  const items = data?.items || [];
  const shown = items.slice(0, segments * batch);
  const { canLoadMore } = props;
  const more = useCallback(() => {
    if (canLoadMore?.() === false) return;
    setSegments((current) => current + 1);
  }, [canLoadMore]);

  const content = () => {
    if (pending) return null;
    if (!data) return <RetryNote message={requestErrorMessage(error)} onRetry={retry} />;
    if (!items.length) {
      const dismissed = props.view === 'dismissed';
      return (
        <EmptyState icon={CheckGlyph} title={dismissed ? 'SinYa excluidoArchivo' : 'SinPendiente判断Archivos basura'}>
          {dismissed ? '点“No es basura”Recurso会ConservarEnaquí, puede随时Reclasificar. ' : 'ActualCategoríaSinPendienteVerificar archivos. '}
        </EmptyState>
      );
    }
    return (
      <>
        <div data-media-grid="" data-junk-grid="" data-select-mode={props.selectMode ? '' : undefined}>
          {shown.map((item) => (
            <JunkCard key={item.id} item={item} view={props.view} selected={props.selected.has(item.id)}
              selectMode={props.selectMode} helpers={props.helpers} actions={props.actions} />
          ))}
        </div>
        {shown.length < items.length ? <RevealMore key={segments} onMore={more} /> : null}
        {/* Colauno次Solo取anterior 200 : 露到底还Con没取, 说清楚es截断而NoesTodo.  */}
        {shown.length >= items.length && Number(data.total || 0) > items.length
          ? <p data-junk-truncated="" className="py-6 text-center text-caption-1-regular text-text-secondary">
              {`Mostraranterior ${items.length.toLocaleString()} Resultado, 共 ${Number(data.total).toLocaleString()} Resultado; Procesar掉este些posterior, 其余会补arriba来. `}
            </p>
          : null}
      </>
    );
  };
  return (
    <div data-junk-body="" data-grid-reveal={reveal.fading ? '' : undefined}>
      {reveal.layer}
      {content()}
    </div>
  );
}

/** 往abajo露Siguiente段. Datosya经Completo批En手arriba, No发Por favor求: 哨兵进入视口 320px interior就露, 点它也露, 
 *  判据同DirectorioCuadrícula续página. 每露uno段按NuevoClavepesado挂, 还En视口dentro就continuar着露.  */
function RevealMore({ onMore }: { onMore(): void }) {
  const node = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = node.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) onMore();
    }, { rootMargin: '320px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [onMore]);
  return <div ref={node} data-load-more="" onClick={onMore} dangerouslySetInnerHTML={{ __html: loadingDotsHtml('Cargando más...') }} />;
}
