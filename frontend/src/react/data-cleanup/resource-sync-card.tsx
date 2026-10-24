/* DatosGestionarpáginaen la"资源Sincronizar": 按馆藏Registro逐Encontrar本地磁盘y网盘en laArchivo, 列出ArchivoyaNoEn
 * Registro, 空Archivocarpeta y No再被引用缓存, Confirmarposterioruno起清掉(ADR-0080). InválidoRegistro分两档: 带人Registro
 * 标Comoya消失, RegistroDeja着(ADR-0087), 其余永久Eliminar, No进回收站, 所以执行Clavees危险档, Confirmar框写明
 * 哪uno档NopuedeDeshacer. 
 *
 * escanearyLimpiares两趟posteriorTarea, 都走 `useBackgroundJob`. escanear结论就esese趟Tarea终态, 所以
 * Resultado区画es当anteriorrápido照: Anterior趟扫出来东西还etc.着清. eseuno趟清过之posterior(`applied`)读数就Noes
 * 现状, Resultado区改画服务DispositivoDeja着Recienteuno次Limpiar回执.  */
import { confirmModal, MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';
import { fmtSize } from '@peach/legacy/core';

import { Button } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import { useBackgroundJob } from '../background-job';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { TaskProgress } from '../components/task-progress';
import { spriteGlyph } from '../components/sprite-glyph';
import { PlainStat, plainStatClass } from '../components/stat-card';
import { queryClient } from '../query';
import { SourceMark } from '../settings/section';
import { busyProps } from '../settings/use-action';
import { TRASH_KEY } from './data-cleanup';
import {
  applyConfirmText, applyLeftovers, applyPlanText, applyText, fetchResourceApply, fetchResourceScan, hasChanges,
  purgeCount, RESOURCE_APPLY_KEY, RESOURCE_SCAN_KEY, scanLine, SOURCE_LABELS, sourceMeta, startResourceApply, startResourceScan,
  type ResourceApplyState, type ResourceScanState,
} from './resource-sync';

const COMPARE = spriteGlyph('git-compare');
const AGAIN = spriteGlyph('rotate-cw');
const DISCONNECTED = 'Sin progreso disponible, reconectando...';
const APPLY_LABEL = 'LimpiarInválidoResultado目';

/* Resultado读数两行各自按卡数etc.分: 来源几都No折出medio行. estrecho照顶arribaese排读数折两列, uno列.  */
const RESULT_ROW = 'inline-grid w-full grid-flow-col auto-cols-fr gap-4 max-plain-stat-pair:grid-flow-row'
  + ' max-plain-stat-pair:grid-cols-2 max-plain-stat-single:grid-cols-1';

const count = (value: number | undefined) => Number(value || 0).toLocaleString();

/** uno趟escanear结论: 来源uno行, 每来源uno读数卡; 要清tres样uno行.  */
function ScanResult({ scan, partial = false }: { scan: ResourceScanState; partial?: boolean }) {
  const cache = scan.cache ?? { files: 0, bytes: 0 };
  return (
    <>
      <div className={RESULT_ROW}>
        {(scan.sources ?? []).map((source) => (
          <article key={source.location} className={plainStatClass()}>
            <PlainStat label={SOURCE_LABELS[source.location] || 'Fuente de medios'}
              mark={<SourceMark mark={MEDIA_SOURCE_ICONS[source.location] ?? 'database'} />}
              aside={<span className={source.online ? 'text-notification-success-foreground' : 'text-text-error-primary'}>
                {source.online ? 'Accesible' : 'Sin conexión, YaOmitir'}
              </span>}
              figure={source.online ? `${count(source.missing)} 项` : '—'}
              meta={sourceMeta(source)} wrapMeta />
          </article>
        ))}
      </div>
      {!partial && <div className={RESULT_ROW}>
        <article className={plainStatClass()}>
          <PlainStat label="Pendiente永久Eliminar" figure={`${count(purgeCount(scan))} 项`} meta="ArchivoYaNoEn盘arriba, 含Papelera" />
        </article>
        <article className={plainStatClass()}>
          <PlainStat label="将标ComoYa消失" figure={`${count(scan.vanish)} 项`} meta="带人Registro, RegistroDeja着" />
        </article>
        <article className={plainStatClass()}>
          <PlainStat label="Carpeta vacía" figure={`${count(scan.empty)} `} meta="Conservar directorio raíz" />
        </article>
        <article className={plainStatClass()}>
          <PlainStat label="puedeLimpiarCaché" figure={`${count(cache.files)} `}
            meta={cache.files ? fmtSize(cache.bytes) : ''} />
        </article>
      </div>}
    </>
  );
}

export function ResourceSyncCard(
  { toast }: { toast(message: string, options?: { warning?: boolean }): void },
) {
  const apply = useBackgroundJob<ResourceApplyState, string>({
    queryKey: RESOURCE_APPLY_KEY,
    queryFn: ({ signal }) => fetchResourceApply(signal),
    start: startResourceApply,
    onFinish: (out) => {
      /* 回收站en laInválidoRegistro也unoy删: 顶arribaese回收站读数跟着pesado取. Verificareseuno带arriba `applied`.  */
      void queryClient.invalidateQueries({ queryKey: TRASH_KEY, exact: true });
      void queryClient.invalidateQueries({ queryKey: RESOURCE_SCAN_KEY, exact: true });
      if (out.status !== 'complete') return;
      /* 没删几样esesteuno轮Dejaabajo, 能删ya经删: 报Advertencia档, 写Completadoy没Procesar数目, No说Fallo.  */
      const { done, left } = applyLeftovers(out);
      if (left) toast(`Completado ${count(done)} 项, ${count(left)} 项SinProcesar`, { warning: true });
      else toast('YaLimpiarInválidoResultado目');
    },
  });
  const scan = useBackgroundJob<ResourceScanState>({
    queryKey: RESOURCE_SCAN_KEY,
    queryFn: ({ signal }) => fetchResourceScan(signal),
    start: startResourceScan,
    /* 又扫uno趟: Anterior趟Limpiar回执说esantiguo清单.  */
    onStarted: () => apply.dismiss(),
  });

  const state = scan.job;
  const scanning = scan.running || scan.start.isPending;
  const cleaning = apply.running || apply.start.isPending;
  const scanned = state?.status === 'complete' || state?.status === 'failed';
  const label = scanning ? 'EscanearEn proceso' : scanned ? 'pesadoNuevoEscanear' : 'Verificar archivos';

  /* 执行eseuno步Solo认este次Verificar候选, 逐复核posterior再删; 删就SinDeshacer.  */
  const runApply = (payload: ResourceScanState) => void confirmModal({
    title: APPLY_LABEL,
    body: applyConfirmText(payload),
    confirmLabel: APPLY_LABEL,
    danger: true,
    onConfirm: () => apply.start.mutateAsync(payload.scan_id || ''),
  });

  const done = apply.outcome;
  const receipt = (out: ResourceApplyState) => {
    const partial = applyLeftovers(out).left > 0;
    return (
      <Note tone={partial ? 'warning' : 'success'} title={partial ? 'Parcialmente completado' : 'LimpiarResultado'}>
        {applyText(out, fmtSize)}
      </Note>
    );
  };
  let progress = null;
  let result = null;
  if (done?.status === 'failed') {
    result = <Note tone="error" title="RecursoLimpiarNoFinalizar">{done.error || 'Revisa el registro de tareas para verificar los archivos procesados.'}</Note>;
  } else if (done) {
    result = receipt(done);
  } else if (apply.running) {
    progress = <TaskProgress embedded label={apply.job?.message || 'Procesando复核yLimpiarInválidoResultado目...'} />;
  } else if (scan.start.isError) {
    result = <Note tone="error" title="Error de escaneo">{errorMessage(scan.start.error)}</Note>;
  } else if (scan.query.isError && state) {
    result = <Note tone="neutral" title="Estado de tarea">{DISCONNECTED}</Note>;
  } else if (state?.status === 'running') {
    const line = scanLine(state);
    progress = (
      <TaskProgress embedded label={line} value={state.completed_sources} total={state.total_sources} />
    );
    if (state.sources?.length) result = <ScanResult scan={state} partial />;
  } else if (state?.status === 'failed') {
    result = <>
      {state.sources?.length ? <ScanResult scan={state} partial /> : null}
      <Note tone="error" title="Error de escaneo">{state.error || 'posteriorError de escaneo'}</Note>
    </>;
  } else if (state?.status === 'complete' && state.applied) {
    result = apply.job?.status === 'complete'
      ? receipt(apply.job)
      : <Note tone="neutral" title="LimpiarResultado">este次VerificarResultadoYa经Limpiar, pesadoNuevoEscanearpuede再核对. </Note>;
  } else if (state?.status === 'complete') {
    const changes = hasChanges(state);
    result = (
      <>
        <ScanResult scan={state} />
        {changes ? <Note tone="neutral" title="Limpiarcontenido">{applyPlanText(state)}</Note> : null}
        <div className="flex flex-wrap items-center justify-end gap-2">
          {changes
            ? <Button variant="danger" {...busyProps(cleaning)} onClick={() => runApply(state)}>
                {cleaning ? 'Procesando复核yLimpiar...' : APPLY_LABEL}
              </Button>
            : <p className="mr-auto text-body-regular text-notification-success-foreground">
                yaVerificarpuedeAcceder来源, Sin待LimpiarRegistro, 空Archivocarpeta或缓存. 
              </p>}
        </div>
      </>
    );
  }
  if (apply.start.isError && !done) {
    result = <>{result}<Note tone="error" title="LimpiarFallido">{errorMessage(apply.start.error)}</Note></>;
  }

  return (
    <section id="resource-sync" aria-labelledby="resource-sync-title" className="flex scroll-mt-20 flex-col gap-4">
      <Fieldset layout="split" labelledBy="resource-sync-title" footer={
        <Button data-resource-scan leadingIcon={scanned && !scanning ? AGAIN : COMPARE} {...busyProps(scanning)}
          onClick={() => { if (!scanning) scan.start.mutate() }}>{label}</Button>
      }>
        <FieldsetTitle id="resource-sync-title" gap="small">Sincronización de recursos</FieldsetTitle>
        <p className="max-w-190 text-body-2-regular leading-5 text-text-secondary">
          按馆藏Registro逐Encontrar本地磁盘y网盘en laArchivo, 列出ArchivoyaNo存EnRegistro, 空Archivocarpeta, 以及No再被引用缓存. 
        </p>
        <div aria-live="polite" className="mt-4 empty:hidden">{progress}</div>
      </Fieldset>
      <div aria-live="polite" className="flex flex-col gap-4 empty:hidden">{result}</div>
    </section>
  );
}
