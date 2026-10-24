/* DatosGestionarpáginaen la"链continuarGestionar". 
 *
 * tres真相tresClave(见 `links.ts`): Bibliotecadentro链continuar现状, ese趟联网Verificar, ese趟Eliminar. VerificaryEliminar
 * 各esuno趟posteriorTarea, 都走 `useBackgroundJob`. Verificar结论espágina面进来就要ver东西(Anterior趟判出
 * Inválido链continuar还etc.着删), 所以画es当anteriorrápido照; EliminarSolo报本次跟完eseuno趟. 
 *
 * Resultado分两表NoesComobienver: `linktr.ee` 回 403 es挡爬虫, `x.com` 回 500 es临时Error, 
 * 链continuar本身bienbien. 混成uno会让人顺手bien链continuaruno起删掉, 所以"地址yaInválido" y "本次no
 * AccederÉxito"各占uno, SoloConanteriorunocontinuar得arribaEliminar.  */
import { useEffect, useState, type ReactNode } from 'react';
import { RiExternalLinkLine } from '@remixicon/react';
import { useQuery } from '@tanstack/react-query';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import { ErrorExcerpt } from '../activity/error-excerpt';
import { useBackgroundJob } from '../background-job';
import { DataTable, type DataColumn } from '../components/data-table';
import {
  Fieldset, FieldsetTitle, PanelFooter, RESULT_PANEL, RESULT_SECTION,
} from '../components/fieldset';
import { Note } from '../components/note';
import { TaskProgress } from '../components/task-progress';
import { spriteGlyph } from '../components/sprite-glyph';
import { queryClient } from '../query';
import { busyProps } from '../settings/use-action';
import {
  checkLine, fetchLinkCheck, fetchLinkPrune, fetchLinkStats, LINK_CHECK_KEY, LINK_KINDS,
  LINK_PRUNE_KEY, LINKS_KEY, pruneText, startLinkCheck, startLinkPrune,
  type LinkCheckState, type LinkPruneState, type LinkRow,
} from './links';

const UNLINK = spriteGlyph('unlink');
const RETRY = spriteGlyph('rotate-cw');

const GONE_HINT = 'SitioVolver 404 或 410, ConfirmaresteDirecciónNo存En. ';
/* esteuno组grandemáses站点拒绝程序Acceder或uno次抖动, 换Tiempo再问uno次就通.  */
const UNCLEAR_HINT = 'SitioRechazar程序Acceso或uno次临时故障都会落Enaquí. 链continuarConservar, puede勾选posterior单独Reintentar. ';
const PRUNE_HINT = 'Eliminaranterior会逐Resultadopesado验uno次; 此AcciónNopuedeDeshacer. ';
const DISCONNECTED = 'Sin progreso disponible, reconectando...';

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** uno格读数: 名目, 数字, puede选uno句注. 每uno类各占uno格: 挤成uno行时Etiqueta y 数字之间Solo剩
 *  间隔点, 数字归谁Todo靠猜.  */
function Stat({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="text-caption-1-regular leading-5 text-text-secondary">{label}</span>
      <b className="text-title-2-semibold font-bold leading-5 tabular-nums text-text-primary">{value}</b>
      {note ? <small className="text-caption-1-regular leading-5 text-text-secondary">{note}</small> : null}
    </div>
  );
}

function LinkTable(
  { title, items, hint, picked, onPick, children, footer }:
  {
    title: string; items: LinkRow[]; hint: string;
    picked: readonly number[]; onPick(next: number[]): void; children?: ReactNode; footer?: ReactNode;
  },
) {
  if (!items.length) return null;
  const columns: DataColumn<LinkRow>[] = [
    { id: 'entity', label: 'Pertenece a', value: (item) => item.entity,
      render: (item) => <span className="block min-w-24 wrap-anywhere">{item.entity}</span> },
    { id: 'kind', label: 'Tipo', value: (item) => LINK_KINDS[item.link_kind] || item.link_kind,
      render: (item) => LINK_KINDS[item.link_kind] || item.link_kind },
    { id: 'label', label: 'Etiqueta', value: (item) => item.label || '',
      render: (item) => <span className="block min-w-24 wrap-anywhere">{item.label || ''}</span> },
    { id: 'note', label: 'Resultado', value: (item) => item.note,
      render: (item) => <div className="min-w-40 max-w-80"><ErrorExcerpt text={item.note} className="tabular-nums text-text-error-primary" /></div> },
    { id: 'url', label: 'Dirección', value: (item) => item.url,
      render: (item) => <a href={item.url} target="_blank" rel="noreferrer" title={item.url}
        className="flex max-w-90 min-w-0 items-center gap-1 text-text-secondary hover:text-text-primary">
        <span data-middle-truncate className="min-w-0 truncate">{item.url}</span>
        <RiExternalLinkLine aria-hidden className="size-3.5 shrink-0" />
      </a> },
  ];
  return (
    <div className={RESULT_SECTION}>
      <DataTable label={title} items={items} columns={columns} rowId={(item) => String(item.id)}
        description={hint} unit="Resultado链continuar" panel={false} footerActions={footer}
        rowLabel={(item) => `${item.entity} ${item.label || item.url}`}
        selected={picked.map(String)} onSelected={(ids) => onPick(ids.map(Number))}
        actions={() => children} />
    </div>
  );
}

export function LinkManager() {
  const stats = useQuery({ queryKey: LINKS_KEY, queryFn: ({ signal }) => fetchLinkStats(signal) });
  const [picked, setPicked] = useState<number[]>([]);
  const [gonePicked, setGonePicked] = useState<number[]>([]);
  const prune = useBackgroundJob<LinkPruneState, { checkId: string; ids?: number[] }>({
    queryKey: LINK_PRUNE_KEY,
    queryFn: ({ signal }) => fetchLinkPrune(signal),
    start: startLinkPrune,
    /* 删完之posteriorBibliotecaen la链continuarmenos, ese两读数跟着pesado取.  */
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: LINKS_KEY, exact: true });
      void queryClient.invalidateQueries({ queryKey: LINK_CHECK_KEY, exact: true });
    },
  });
  const check = useBackgroundJob<LinkCheckState, { retry?: readonly number[]; checkId?: string }>({
    queryKey: LINK_CHECK_KEY,
    queryFn: ({ signal }) => fetchLinkCheck(signal),
    start: startLinkCheck,
    /* 又起uno趟Verificar: Anterior趟Eliminar回执说esantiguo清单, 勾选行号也No再指向任何东西.  */
    onStarted: () => { prune.dismiss(); setPicked([]); setGonePicked([]) },
  });

  const state = check.job;
  const checkId = state?.check_id ?? '';
  useEffect(() => { setPicked([]); setGonePicked([]) }, [checkId]);

  const running = check.running || check.start.isPending;
  const removing = prune.running || prune.start.isPending;
  const done = state?.status === 'complete';
  const gone = state?.gone ?? [];
  const unclear = state?.unclear ?? [];
  const retryable = done ? unclear : [];
  const selectedGone = gone.filter((item) => gonePicked.includes(item.id)).map((item) => item.id);
  const selectedRetryable = retryable.filter((item) => picked.includes(item.id)).map((item) => item.id);
  const info = stats.data;
  const hosts = (info?.top_hosts ?? []).slice(0, 3).map(([host, n]) => `${host} ${count(n)}`).join(' · ');

  const run = (retry?: readonly number[]) => {
    if (running || (retry && !retry.length)) return;
    check.start.mutate(retry ? { retry, checkId } : {});
  };
  const removeGone = (ids?: number[]) => {
    if (removing || !gone.length) return;
    void confirmModal({
      title: 'Eliminar enlaces inválidos',
      body: `将Eliminar ${ids?.length ?? gone.length} ResultadoInválido链continuar. Eliminaranterior会再次Verificar, EliminarposteriorNinguno法Restaurar. `,
      confirmLabel: 'Eliminar enlaces inválidos',
      danger: true,
      onConfirm: () => prune.start.mutateAsync({ checkId, ids }),
    });
  };

  /* Eliminareseuno趟跑完, 结论就eseseuno句回执: antiguo清单en la行ya经删掉或者Confirmar保Deja.  */
  const pruned = prune.outcome;
  const startError = check.start.error ?? prune.start.error;
  let progress: ReactNode = null;
  let result: ReactNode = null;
  if (pruned?.status === 'failed') {
    result = <Note tone="error" title="链continuarLimpiarNoFinalizar">{pruned.error || 'Por favorVer tareasRegistro, 核对YaProcesar链continuar. '}</Note>;
  } else if (pruned && !gone.length && !unclear.length) {
    result = <Note tone="success" title="Finalizar">{pruneText(pruned)}</Note>;
  } else if (startError) {
    result = <Note tone="error" title="Error de verificación">{errorMessage(startError)}</Note>;
  } else if (check.query.isError && state) {
    result = <Note tone="neutral" title="Estado de tarea">{DISCONNECTED}</Note>;
  } else if (state?.status === 'failed') {
    result = <Note tone="error" title="Error de verificación">{state.error || 'Error de verificación'}</Note>;
  } else if (state && state.status !== 'idle') {
    progress = <>
      {state.status === 'running'
        ? <TaskProgress embedded label={checkLine(state)} value={Math.min(state.checked || 0, state.total || 0)} total={state.total} />
        : null}
      {removing
        ? <TaskProgress embedded label={prune.job?.message || 'Procesandopesado验yEliminar enlaces inválidos...'}
            value={Math.min(prune.job?.checked || 0, prune.job?.total || 0)} total={prune.job?.total} />
        : null}
    </>;
    const pickedLabel = selectedRetryable.length ? `Reintentar选En proceso ${selectedRetryable.length} Resultado` : 'Reintentar选En proceso链continuar';
    result = done || gone.length || unclear.length ? (
      <div className={RESULT_PANEL}>
        {pruned?.status === 'complete' ? <Note tone="success" title="Finalizar">{pruneText(pruned)}</Note> : null}
        <LinkTable title="DirecciónYaInválido" items={gone} hint={GONE_HINT} picked={gonePicked} onPick={setGonePicked}>
          <Button variant="danger" size="small" disabled={!done || !selectedGone.length}
            {...busyProps(removing)} onClick={() => removeGone(selectedGone)}>
            {`Eliminar所选(${selectedGone.length})`}
          </Button>
        </LinkTable>
        <LinkTable title="本次NoAccesoExitoso" items={unclear} hint={UNCLEAR_HINT}
          picked={picked} onPick={setPicked} footer={retryable.length
            ? <Button leadingIcon={RETRY} {...busyProps(running)}
                onClick={() => run(retryable.map((item) => item.id))}>{`TodoReintentar(${retryable.length})`}</Button>
            : null}>
          {retryable.length
            ? <>
                  <Button leadingIcon={RETRY} disabled={!selectedRetryable.length} {...busyProps(running)}
                    onClick={() => run(selectedRetryable)}>{pickedLabel}</Button>
              </>
            : null}
        </LinkTable>
        {done && gone.length
          ? <PanelFooter tone="error" status={PRUNE_HINT}>
              <Button variant="danger" {...busyProps(removing)} onClick={() => removeGone()}>
                {`Eliminar ${gone.length} ResultadoInválido链continuar`}
              </Button>
            </PanelFooter>
          : null}
        {done && !gone.length && !unclear.length
          ? <p className={`${RESULT_SECTION} text-body-regular text-notification-success-foreground`}>Todo链continuar均Accesible. </p>
          : null}
      </div>
    ) : null;
  }

  return (
    <section id="link-manager" aria-labelledby="link-manager-title" className="flex scroll-mt-20 flex-col gap-4">
      <Fieldset layout="stack" labelledBy="link-manager-title" footer={
        <Button leadingIcon={UNLINK} {...busyProps(running)} onClick={() => run()}>
          {running ? 'Verificando' : done ? 'Reverificar' : 'Verificar enlaces rotos'}
        </Button>
      }>
        <FieldsetTitle id="link-manager-title" gap="small">Gestión de enlaces</FieldsetTitle>
        {stats.isError
          ? <Note tone="error" title="链continuarEstadísticas读取Fallido">{errorMessage(stats.error)}</Note>
          : info
            ? <>
                <div className="link-stat-grid mt-4 gap-x-8 gap-y-3">
                  <Stat label="Total de enlaces" value={count(info.total)}
                    note={`分布En ${count(info.entities)} Actriz, SelloySerie`} />
                  {Object.entries(info.by_kind ?? {}).map(([kind, value]) => (
                    <Stat key={kind} label={LINK_KINDS[kind] || kind} value={count(value)} />
                  ))}
                </div>
                {hosts
                  ? <div className="mt-4 flex min-w-0 flex-col gap-0.5">
                      <span className="text-caption-1-regular text-text-secondary">Sitio principal</span>
                      <b className="text-body-2-medium break-words text-text-primary">{hosts}</b>
                    </div>
                  : null}
              </>
            : null}
        <div aria-live="polite" className="mt-4 flex flex-col gap-3 empty:hidden">{progress}</div>
      </Fieldset>
      <div aria-live="polite" className="empty:hidden">{result}</div>
    </section>
  );
}
