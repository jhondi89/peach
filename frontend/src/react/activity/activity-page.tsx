/* 活动Página: Tareaen proceso心ese表唯uno界面. 
 *
 * esteuno屏要回答tres问题, 顺序就es它们紧迫程度: 现EnCon什么En跑, Con哪uno轮被挡abajo, 
 * 刚跑完ese些怎么样. tres段共用 `/api/tasks` uno次Por favor求Resultado. último尾"云Descargar"段es网盘离线
 * Tarea, 取数y轮询都En `downloads-panel.tsx` dentro,  y estetres段互No牵连. 
 *
 * 轮询交给 Query  `refetchInterval`: 间隔按Anterior次拿到contenido算, Con东西En跑两秒uno次, 
 * Todoes终态diez秒uno次. 它esposteriorActualizar, No写 `aria-busy`—página面en lacontenidouno直es完Completo, 写
 * etc.于告诉辅助技术 y 冒烟用例"esteuno屏还没bien". 取数FalloSoloEnpáginainterior报uno, AnteriorDatosDeja着: 
 * 服务pesado启ese几秒dentro, Completopágina换成uno句Error比Deja着diez秒anteriorProgreso更难用. 
 *
 * "RecienteCompletado"último尾"Cargar更早"往anteriorcontinuarunopágina, continuaren la行DejaEn组件dentro, y轮询eseuno按 id 合y: 
 * 轮询Solo管No.unopágina, 翻过ese些No会被Siguiente次Actualizar冲掉.  */
import { useId, useState } from 'react';
import type { ReactNode } from 'react';
import { RiArrowDownSLine, RiHistoryLine } from '@remixicon/react';
import { useMutation, useQuery } from '@tanstack/react-query';

import { Chip } from '@/components/base/badges/chip';
import { Button } from '@/components/base/buttons/button';

import { errorMessage } from '../../api';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { LoadingDots } from '../components/loading-dots';
import { Note } from '../components/note';
import { Page } from '../components/page';
import { Progress } from '../components/progress';
import { busyProps } from '../settings/use-action';
import { Disclosure } from '../settings/section';
import { DownloadsPanel } from './downloads-panel';
import { ErrorExcerpt } from './error-excerpt';
import {
  elapsedText, fetchEarlier, fetchTasks, foldRoutine, followupDetail, groupFollowups, isActive,
  isRoutine, mergeFinished, momentText, pollInterval, progressText, statusLabel, summaryText, TASKS_KEY, TRIGGER_LABELS, type TaskRunPayload,
} from './tasks';

/* Estado徽章SoloContres档Color: Éxitoes绿, Falloes红, 被叫停y被打断es黄, 其余Dejaen proceso性底. 
   BoardUI  Chip estetres档写成 lime/rose/yellow, No.cuatroColorNo存En.  */
const BADGE_COLORS: Record<string, 'lime' | 'rose' | 'yellow'> = {
  succeeded: 'lime', failed: 'rose', cancelled: 'yellow', interrupted: 'yellow',
};

function StatusBadge({ status }: { status: string }) {
  return <Chip color={BADGE_COLORS[status] ?? 'neutral'}>{statusLabel(status)}</Chip>;
}

/** uno轮Tarea派出posterior继(ADR-0040). 挂En父Tarea卡dentro, unouno行. 
 *
 * posterior继esIndependienteuno轮, Con自己Estado y Resultado, pero单独摆出来就读No出"它es谁派"—
 * 而ese恰恰esesteuno屏arriba唯uno需要解释东西: 用户没点过补Avatar, 它却En跑. 
 * 间线写En每 li 自己身arriba, No.unoese根同时充当y卡片正文分隔.  */
function FollowupList({ rows }: { rows: TaskRunPayload[] }) {
  return (
    <ul className="flex min-w-0 flex-col">
      {rows.map((row) => {
        const detail = followupDetail(row);
        return (
          <li key={row.id} data-status={row.status} data-followup-key={row.followup_key}
            className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-separator-border px-5 py-2.5">
            <span className="min-w-0 break-words text-caption-1-regular text-text-primary">
              {row.task_label}
            </span>
            <StatusBadge status={row.status} />
            {detail
              ? <span className="min-w-0 break-words text-caption-1-regular text-text-secondary">{detail}</span>
              : null}
          </li>
        );
      })}
    </ul>
  );
}

/** uno轮Tareauno卡. Fallo时Completo卡框线换成 danger 色, No给TerminarOriginal因ese行字arriba色—
 *  uno屏diez几行dentro逐行读红字, 比veruno眼哪卡框es红lento得más.  */
function RunCard(
  { run, meta, children, footer, followups }:
  { run: TaskRunPayload; meta: string; children?: ReactNode; footer?: string;
    followups?: TaskRunPayload[] },
) {
  return (
    <li data-status={run.status} data-task-key={run.task_key} data-run-id={run.id}
      className={cardClass({
        padding: 'none',
        bordered: 'line',
        className: run.status === 'failed' ? 'flex flex-col border-border-error-default' : 'flex flex-col',
      })}>
      <div className="flex flex-col gap-1.5 px-5 pt-5 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <strong className="min-w-0 break-words text-title-1-medium text-text-primary">{run.task_label}</strong>
          <StatusBadge status={run.status} />
        </div>
        <p className="text-caption-1-regular text-text-secondary">{meta}</p>
        {children}
      </div>
      {followups?.length ? <div className="border-t border-separator-border px-5 py-2.5">
        <Disclosure summary={`Tarea明细 · ${followups.length} 项`}
          defaultOpen={followups.some((row) => isActive(row) || row.status === 'failed')}>
          <FollowupList rows={followups} />
        </Disclosure>
      </div> : null}
      {footer
        ? <div className="flex min-h-14 flex-col justify-center rounded-b-2xl border-t border-separator-border bg-card-footer px-5 py-3">
            <ErrorExcerpt text={footer} className="text-caption-1-regular text-text-secondary" />
          </div>
        : null}
    </li>
  );
}

function RunningRun({ run, followups }: { run: TaskRunPayload; followups?: TaskRunPayload[] }) {
  const total = run.progress_total || 0;
  const current = run.progress_current || 0;
  const label = run.progress_label || 'En progreso';
  const elapsed = elapsedText(run.elapsed_seconds);
  const meta = [TRIGGER_LABELS[run.trigger] || run.trigger, elapsed && `Ya跑 ${elapsed}`]
    .filter(Boolean).join(' · ');
  return (
    <RunCard run={run} meta={meta} followups={followups}>
      {total > 0
        ? <div className="flex flex-col gap-1.5">
            <Progress label={label} value={Math.min(current, total)} max={total} />
            <p className="text-caption-1-regular text-text-secondary wrap-anywhere">{label} · {progressText(current, total)} 项</p>
          </div>
        : <LoadingDots label={label} />}
    </RunCard>
  );
}

/** 跑完uno轮. `runs` más于uno时es折叠起来几轮例行Tarea: Tiempo写成从最早到最Nuevoeseuno段, 
 *  摘要取最Nuevoeseuno轮—例行轮次摘要本来就uno样, 逐列出来Soloes同uno行抄 N 遍.  */
function SettledRun(
  { run, followups, runs }: { run: TaskRunPayload; followups?: TaskRunPayload[]; runs?: TaskRunPayload[] },
) {
  const summary = summaryText(run.result_summary);
  const elapsed = elapsedText(run.elapsed_seconds);
  const oldest = runs && runs.length > 1 ? runs[runs.length - 1] : undefined;
  const meta = (oldest
    ? [TRIGGER_LABELS[run.trigger] || run.trigger, `近 ${runs!.length} 轮`,
       `${momentText(oldest.finished_at)} – ${momentText(run.finished_at)}`]
    : [TRIGGER_LABELS[run.trigger] || run.trigger, momentText(run.finished_at),
       elapsed && `用时 ${elapsed}`]).filter(Boolean).join(' · ');
  return (
    <RunCard run={run} meta={meta} footer={run.error} followups={followups}>
      {summary ? <p className="text-caption-1-regular text-text-secondary wrap-anywhere">{summary}</p> : null}
    </RunCard>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <section aria-labelledby={id} className="flex min-w-0 flex-col gap-3">
      <h3 id={id} className="text-title-2-medium text-text-primary">{title}</h3>
      {children}
    </section>
  );
}

function RunList({ live = false, children }: { live?: boolean; children: ReactNode }) {
  return (
    <ul aria-live={live ? 'polite' : undefined} className="flex min-w-0 flex-col gap-3">{children}</ul>
  );
}

export function ActivityPage() {
  const tasks = useQuery({
    queryKey: TASKS_KEY,
    queryFn: ({ signal }) => fetchTasks(signal),
    refetchInterval: (query) => pollInterval(query.state.data),
  });
  const data = tasks.data;
  const top = data?.finished;
  // 往anterior翻continuaren la行. 没翻过时uno直es空, página面 y SoloConNo.unopágina时完Todouno样. 
  const [earlier, setEarlier] = useState<TaskRunPayload[]>([]);
  const [earlierMore, setEarlierMore] = useState(false);
  const [seenTop, setSeenTop] = useState(top);
  if (top !== seenTop) {
    setSeenTop(top);
    // 翻过página之posterior, NuevoCompletado几轮会No.unopáginaúltimo尾挤出去; AnteriorNo.unopáginay进ya翻过部分, 
    // No然被挤出去ese几轮carpetaEn两段之间, 哪uno段都No再Con它们. 
    if (earlier.length && seenTop) setEarlier(mergeFinished(earlier, seenTop));
  }
  const more = useMutation({
    mutationFn: ({ oldest }: { oldest: TaskRunPayload; shown: TaskRunPayload[] }) => fetchEarlier(oldest),
    onSuccess: (page, { shown }) => {
      setEarlier((current) => mergeFinished(current, shown, page.finished || []));
      setEarlierMore(Boolean(page.finished_has_more));
    },
  });
  const problem = tasks.error ? errorMessage(tasks.error) : '';
  // primero屏就没拿到Datos: Solo剩esteuno, No画空tres段. 
  if (!data) return <Page><Note tone="error">{problem || '读取Centro de tareasFallido'}</Note></Page>;

  const allFinished = mergeFinished(data.finished || [], earlier);
  const allRuns = [...(data.running || []), ...(data.skipped || []), ...allFinished];
  // posterior继挂到派出它ese卡abajo面. 父TareaNoEnesteuno屏arriba(ya经被 prune 掉)时照常单独摆出来
  // —挂Noarriba去就No显示, etc.于让unoEn跑Tarea凭空消失. 
  const byParent = groupFollowups(allRuns);
  const visible = new Set(allRuns.map((run) => run.id));
  const topLevel = (rows: TaskRunPayload[]) => rows.filter(
    (run) => !(run.followup_key && run.parent_run_id != null && visible.has(run.parent_run_id)));
  const settled = topLevel(allFinished);
  // 游标取最antiguo顶层eseuno轮: 服务端unopágina数es顶层行, posterior继跟着父Tarea走. 
  const oldest = settled[settled.length - 1];
  const hasEarlier = Boolean(oldest) && (earlier.length ? earlierMore : Boolean(data.finished_has_more));
  const loadEarlier = () => {
    if (!more.isPending && oldest) more.mutate({ oldest, shown: allFinished });
  };
  // 自己跑完, 派出posterior继还En跑eseuno轮算"En curso进行": Completo件事还没完, 放进"RecienteCompletado"
  // 就esuno卡AnterioryaCompletado, unoEn progreso. 
  const working = settled.filter((run) => byParent.get(run.id)?.some(isActive));
  const running = topLevel(data.running || []);
  const skipped = topLevel(data.skipped || []);
  // 同uno轮NoEn"RecienteCompletado"dentro再出现uno次: uno屏两行说es同uno件事, 读起来像跑两轮. 
  const finished = settled.filter((run) => !working.includes(run)
    && !skipped.some((row) => row.id === run.id));
  // 每pequeño时uno轮定时Verificar什么也没发生时uno摆出来, unopágina就被同uno句"yaVerificar 83"占满. 
  const folds = foldRoutine(finished, (run) => isRoutine(run) && !byParent.get(run.id)?.length);
  const quiet = !running.length && !working.length && !skipped.length && !finished.length;
  return (
    <Page>
      {problem ? <Note tone="error">{problem}</Note> : null}
      {data.available === false
        ? <Note tone="warning">{data.message || 'Base de datosaúnNo准备bienTareaRegistro表'}</Note>
        : null}
      {quiet
        ? <EmptyState shell="plain" icon={RiHistoryLine} title="Aún no hayTareaRegistro">
            escanear, 追更Verificar, 批量操作 y 命令行批Procesar跑起来之posterior, aquí会显示它们ProgresoyResultado. 
          </EmptyState>
        : <>
            <Section title="En progreso">
              {running.length || working.length
                ? <RunList live>
                    {running.map((run) => (
                      <RunningRun key={run.id} run={run} followups={byParent.get(run.id)} />))}
                    {working.map((run) => (
                      <SettledRun key={run.id} run={run} followups={byParent.get(run.id)} />))}
                  </RunList>
                : <Note tone="neutral">No hay tareas en ejecución.</Note>}
            </Section>
            {/* "刚才eseuno轮Como什么没跑"SoloConesteuno段答得出: 定时触发撞arribaEn跑eseuno轮会
                安静Omitir, NoDejaRegistro话它En界面arriba y 从没触发过uno模uno样.  */}
            {skipped.length
              ? <Section title="Rechazados">
                  <RunList>{skipped.map((run) => (
                    <SettledRun key={run.id} run={run} followups={byParent.get(run.id)} />))}</RunList>
                </Section>
              : null}
            {finished.length || hasEarlier
              ? <Section title="Completados recientemente">
                  {finished.length
                    ? <RunList>{folds.map(({ run, runs }) => (
                        <SettledRun key={run.id} run={run} runs={runs}
                          followups={byParent.get(run.id)} />))}</RunList>
                    : null}
                  {more.error ? <Note tone="error">{errorMessage(more.error)}</Note> : null}
                  {hasEarlier
                    ? <Button variant="secondary" size="small" leadingIcon={RiArrowDownSLine}
                        className="self-start" {...busyProps(more.isPending)} onClick={loadEarlier}>
                        Cargar更早
                      </Button>
                    : null}
                </Section>
              : null}
          </>}
      {/* 离线Descargar跑En网盘ese头, 自己uno表, 自己轮询; Tareaen proceso心Como空时它照样En.  */}
      <DownloadsPanel />
    </Page>
  );
}
