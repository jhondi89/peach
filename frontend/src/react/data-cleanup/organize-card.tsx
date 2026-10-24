/* DatosGestionarpáginaen la"Organizar"(ADR-0039): 选来源, Introduce两模板, Vista previa, 执行, exterior加Completo批Revertir. 
 *
 * Vista previaesuno次SincronizarPor favor求, ResultadoSolo活Eneste卡arriba; 执行yRevertires同uno趟posteriorTarea, rápido照摊En
 * `/api/organize` 顶层, 所以 `useBackgroundJob` 用 `withJob` Solo换Tareaese几格, 来源, 模板
 * yAnterior批Original样Deja着. 执行yRevertir动es真实Archivo名yDatosBibliotecaRuta, 都要先过Confirmar弹层.  */
import { useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { confirmModal, MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';
import { LOC } from '@peach/legacy/core';

import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Select, SelectItem } from '@/components/base/select/select';

import { errorMessage } from '../../api';
import { useBackgroundJob } from '../background-job';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { TaskProgress } from '../components/task-progress';
import { queryClient } from '../query';
import { SourceMark } from '../settings/section';
import { busyProps } from '../settings/use-action';
import {
  baseName, DIRECTORY_TEMPLATE_ERROR, fetchOrganize, ORGANIZE_KEY, organizeOutcome, planSummary,
  previewOrganize, rememberTemplates, startOrganize, withOrganizeJob,
  type OrganizeCommand, type OrganizeData, type OrganizeJob, type OrganizePlan,
} from './organize';

const APPLY_BODY = (name: string) => `将按este两模板改动"${name}"en laNombre de archivoyDirectorio, 目标Ya存En行会Completo行Omitir. `
  + 'esteuno批puede以从"RevertirLote anterior"Completo批退回. ';
const ROLLBACK_BODY = '将Lote anteriorOrganizar动过Archivo退回OrganizaranteriorNombreyPosición, Ruta de la base de datos跟着退回. '
  + 'Tras revertir, este lote ya no aparecerá aquí.';
/** Vista previaSolo列anterior 8 行: aquíes给人扫uno眼方向对No对, 完Completo计划En CSV dentro.  */
const PLAN_ROWS = 8;

function PlanRows({ plan }: { plan: OrganizePlan }) {
  return (
    <>
      <ol className="mt-2 flex min-w-0 flex-col gap-1">
        {plan.rows.slice(0, PLAN_ROWS).map((row) => (
          <li key={row.current_path}
            className="flex min-w-0 items-center gap-2 text-caption-1-regular text-text-secondary">
            <span data-middle-truncate title={row.current_path} className="min-w-0 truncate">{baseName(row.current_path)}</span>
            <span aria-hidden>→</span>
            <span data-middle-truncate title={row.target_path} className="min-w-0 truncate text-text-primary">{baseName(row.target_path)}</span>
          </li>
        ))}
      </ol>
      {plan.truncated
        ? <p className="text-caption-1-regular text-text-secondary">Solo列出anterior 8 行, CompletadoCompletoPlanificadoEnPlanificado CSV dentro. </p>
        : null}
    </>
  );
}

export function OrganizeCard(
  { toast, failure }: { toast(message: string): void; failure(action: string, error: unknown): void },
) {
  const organize = useQuery({ queryKey: ORGANIZE_KEY, queryFn: ({ signal }) => fetchOrganize(signal) });
  const data = organize.data;
  const locations = data?.locations ?? [];
  const [chosen, setChosen] = useState('');
  const location = locations.some((row) => row.location === chosen) ? chosen : locations[0]?.location ?? '';
  const stored = data?.templates?.[location];
  /* 两框En人动过之anterior跟着存abajo模板走: 换来源就换成ese来源Última vez用ese两行.  */
  const [draft, setDraft] = useState<{ location: string; file: string; dir: string } | null>(null);
  const fields = draft?.location === location ? draft : { location, file: stored?.file ?? '', dir: stored?.dir ?? '' };
  const edit = (patch: Partial<{ file: string; dir: string }>) => setDraft({ ...fields, ...patch });
  const [invalid, setInvalid] = useState<'file' | 'dir' | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const dirInput = useRef<HTMLInputElement>(null);

  const request = () => ({ location, file_template: fields.file.trim(), dir_template: fields.dir.trim() });
  const preview = useMutation({
    mutationFn: previewOrganize,
    /* 模板No合法时Error就出En两框en launo, 所以除说Original因还要指出es哪uno格.  */
    onError: (cause) => {
      const target = DIRECTORY_TEMPLATE_ERROR.test(errorMessage(cause)) ? 'dir' : 'file';
      setInvalid(target);
      (target === 'dir' ? dirInput : fileInput).current?.focus();
    },
  });
  const job = useBackgroundJob<OrganizeJob, OrganizeCommand, OrganizeData>({
    queryKey: ORGANIZE_KEY,
    queryFn: ({ signal }) => fetchOrganize(signal),
    start: startOrganize,
    jobOf: (current) => current,
    withJob: withOrganizeJob,
    onStarted: () => preview.reset(),
    onFinish: (finished) => {
      /* Anterior批跟着esteuno趟变: 执行más出uno批, Revertir退掉uno批. pesado读uno次拿到Nuevo `last_batch`.  */
      void queryClient.invalidateQueries({ queryKey: ORGANIZE_KEY, exact: true });
      if (finished.status !== 'complete') return;
      const { text, failed } = organizeOutcome(finished);
      if (failed) failure('按模板Organizar', new Error(`${failed} 行No能Procesar`));
      else toast(text.replace(/. $/, ''));
    },
  });

  const running = job.running || job.start.isPending;
  const plan = preview.data;
  const changes = Number(plan?.counts?.change || 0);
  const name = LOC[location] || location;
  const hint = (data?.placeholders ?? []).map((item) => `{${item.key}} ${item.label}`).join(' · ');

  const runPreview = () => {
    if (preview.isPending || !location) return;
    setInvalid(null);
    preview.mutate(request());
  };
  const runApply = () => void confirmModal({
    title: '按模板OrganizarArchivo', body: APPLY_BODY(name), confirmLabel: 'OrganizarArchivo',
    /* Vista previaSoloes试uno试, No落盘; Confirmar执行ese两行才记成este来源模板.  */
    onConfirm: async () => {
      const sent = request();
      await job.start.mutateAsync({ kind: 'apply', request: sent });
      void rememberTemplates({
        ...(data?.templates ?? {}), [sent.location]: { file: sent.file_template, dir: sent.dir_template },
      });
    },
  });
  const runRollback = () => void confirmModal({
    title: 'RevertirLote anteriorOrganizar', body: ROLLBACK_BODY, confirmLabel: 'RevertirOrganizar',
    onConfirm: () => job.start.mutateAsync({ kind: 'rollback' }),
  });

  /* este卡en la结论SoloConuno句: 跑着eseuno趟, este次跟完eseuno趟, 刚出Vista previa, 按Nuevoantiguo取最Nuevo.  */
  let state = null;
  const current = job.job;
  const outcome = job.outcome;
  if (current?.status === 'running') {
    const line = current.message || current.stage || 'ProcesandoOrganizarArchivo...';
    state = <TaskProgress embedded label={line} value={Math.min(current.checked || 0, current.total || 0)} total={current.total} />;
  } else if (outcome?.status === 'failed') {
    state = <Note tone="error" title="ArchivoOrganizarNoFinalizar">{outcome.error || 'Revisa el registro de tareas para verificar los archivos procesados.'}</Note>;
  } else if (outcome) {
    const { text, failed } = organizeOutcome(outcome);
    state = <Note tone={failed ? 'warning' : 'success'} title={failed ? 'Parcialmente completado' : 'OrganizarResultado'}>{text}</Note>;
  } else if (job.start.isError) {
    state = <Note tone="error" title="OrganizarFallido">{errorMessage(job.start.error)}</Note>;
  } else if (preview.isPending) {
    state = <TaskProgress embedded label="Procesando按模板算Planificado..." />;
  } else if (preview.isError) {
    state = <Note tone="error" title="模板NoDisponible">{errorMessage(preview.error)}</Note>;
  } else if (plan) {
    state = <><Note tone="neutral" title="Vista previaResultado">{planSummary(plan)}</Note>{changes ? <PlanRows plan={plan} /> : null}</>;
  }

  return (
    <Fieldset layout="stack" id="organize" labelledBy="cleanup-organize-title"
      attributes={{ 'data-cleanup-organize': '' }}
      footer={
        <>
          <Button disabled={!locations.length} {...busyProps(preview.isPending)} onClick={runPreview}>Vista previa</Button>
          {changes && !running && !job.outcome
            ? <Button onClick={runApply}>执行Organizar</Button>
            : null}
          {data?.last_batch
            ? <Button variant="secondary" {...busyProps(running)} onClick={runRollback}>RevertirLote anterior</Button>
            : null}
        </>
      }>
      <FieldsetTitle id="cleanup-organize-title" gap="medium">Organizar</FieldsetTitle>
      <p className="text-body-regular text-text-secondary">
        按模板给Archivo改名y归入Directorio. 先Vista previa, Confirmarposterior执行; 执行过uno批puede以Completo批退回. 
      </p>
      {organize.isError
        ? <div className="mt-3"><Note tone="error" title="OrganizarConfiguración读取Fallido">{errorMessage(organize.error)}</Note></div>
        : null}
      <div className="mt-3 flex flex-col gap-3">
        {locations.length
          ? <Select aria-label="Organizar哪 fuente(s)" className="w-fit min-w-25" selectedKey={location || null}
              onSelectionChange={(key) => {
                if (key === null) return;
                setChosen(String(key)); setInvalid(null); preview.reset();
              }}>
              {locations.map((row) => (
                <SelectItem key={row.location} id={row.location} textValue={LOC[row.location] || row.location}>
                  <SourceMark mark={MEDIA_SOURCE_ICONS[row.location] || 'database'} />{LOC[row.location] || row.location}
                </SelectItem>
              ))}
            </Select>
          : null}
        <Input label="Plantilla de nombre de archivo" placeholder="{number}[ {title}]" value={fields.file} ref={fileInput}
          spellCheck="false" isInvalid={invalid === 'file'}
          onChange={(value) => { edit({ file: value }); setInvalid(null) }} />
        <Input label="Plantilla de directorio" placeholder="Deja vacío表示Original地改名" value={fields.dir} ref={dirInput}
          spellCheck="false" isInvalid={invalid === 'dir'}
          onChange={(value) => { edit({ dir: value }); setInvalid(null) }} />
        {data?.presets?.length
          ? <div className="flex flex-wrap gap-2">
              {data.presets.map((preset) => (
                <Button key={preset.label} variant="secondary" title={preset.label}
                  className="max-w-full [&>span]:min-w-0 [&>span]:shrink"
                  onClick={() => { edit({ file: preset.file, dir: preset.dir }); setInvalid(null) }}>
                  <span className="truncate">{preset.label}</span>
                </Button>
              ))}
            </div>
          : null}
        <p className="text-caption-1-regular leading-4.5 text-text-secondary">
          {`${hint ? `${hint}; ` : ''}方括号en lacontenidoEn字段ComoVacío时Completo段省略. `}
        </p>
      </div>
      <div aria-live="polite" className="mt-3 flex flex-col gap-2 empty:hidden">{state}</div>
    </Fieldset>
  );
}
