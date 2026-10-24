/* DatosGestionarpáginaen la"escanearyRecolectar"卡片. 
 *
 * 卡片dentro讲esese按钮此刻En做什么(Progreso或Esperando点); Resultado y 故障讲esesteuno趟Tareaabajo场, 
 * 挂En卡片exterior面,  y 链continuarGestionar, 资源Sincronizarese两同uno写法. 
 *
 * 写操作es `useMutation`: 服务端回就esesteuno趟Nuevorápido照, 用 `setQueryData` 换进缓存, 
 * 再让esteClave立刻pesado读uno次continuararriba轮询节律. primero屏读到antiguo终态No冒充NuevoResultado—Tarea关掉página面
 * 照样En跑, Estadodentro常年躺着Anterior趟回执, 判据En `use-library-processing.ts`.  */
import { useEffect } from 'react';
import { RiArrowRightLine } from '@remixicon/react';
import { useMutation } from '@tanstack/react-query';

import { Button } from '@/components/base/buttons/button';
import { LinkButton } from '@/components/base/buttons/link-button';

import { apiSend, errorMessage } from '../../api';
import { SCAN_CARD_TEXT } from '../../management';
import type { LibraryProcessingProps } from '../bundle';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { PathLine } from '../components/path-line';
import { Disclosure } from '../settings/section';
import { queryClient } from '../query';
import {
  DISCONNECTED_TEXT, issueDetails, LIBRARY_PROCESSING_KEY, LIBRARY_PROCESSING_URL,
  notesLine, processingActive, remainingTime, type LibraryProcessingCommand, type LibraryProcessingData,
} from './library-processing';
import { useLibraryProcessingJob } from './use-library-processing';
import { ProcessingActions } from './processing-actions';
import { ProcessingControls } from './processing-controls';
import { ProcessingProgress } from './processing-line';

/* en proceso文正文写成常量: JSX dentro换行文字会Encontinuar缝处más出uno空格, en proceso文句子dentrover得见. 
   卡片正文yprimero屏骨架共用 `SCAN_CARD_TEXT`(`management.ts`).  */
const STALLED_TEXT = 'esteuno项耗时较largo, 暂时SinNuevo进展. TareaTerminarposteriorpuede以ReintentarNoFinalizarParcial. ';
/* 补齐Actriz资料es落Biblioteca之posterioruno步, uno趟dentro常常什么都No用补, ese时este句话No出现: 
   cuatro读数Todoes 0 还写uno句"别名 0 ", 读人分No清es没得补还esesteuno步没跑.  */
const profileText = (state: LibraryProcessingData) => {
  const aliases = state.performer_aliases || 0;
  const avatars = state.performer_avatars || 0;
  const conflicts = state.performer_profile_conflicts || 0;
  const failed = state.performer_profile_failed || 0;
  if (!aliases && !avatars && !conflicts && !failed) return '';
  const parts = [`补齐ActrizDetalles: Alias ${aliases} , Avatar ${avatars}  imagen(es)`];
  if (conflicts) parts.push(`${conflicts} 同名Conflicto交回人工`);
  if (failed) parts.push(`${failed}  imagen(es)AvatarNo disponible`);
  return `${parts.join(', ')}. `;
};

const receiptText = (state: LibraryProcessingData) =>
  state.requested_stage === 'previews' ? `Ya生成 ${state.previews || 0}  título(s)Vista previa de video. `
  : `YaEscanear ${state.scanned || 0} Archivo, Reconocer ${state.identified || 0} Código JAV, `
  + `Organizar ${state.candidates || 0} GrupoDetallesResultado, AutomáticoGuardar ${state.auto_applied || 0} Resultado. `
  + (state.previews ? `Ya生成 ${state.previews}  título(s)Vista previa de video. ` : '')
  + profileText(state);

/** 卡片exterior面eseuno: esteuno趟怎么. 逐明细要展开才读, 完Completo清单EnEstado给出RegistroArchivodentro.  */
function Outcome(
  { state, problem, settled, onRetry, toast }:
  {
    state: LibraryProcessingData; problem: string;
    settled: LibraryProcessingData | null; onRetry(): void; toast(message: string): void;
  },
) {
  const details = issueDetails(state);
  const retryable = state.status === 'failed' && !!state.retryable_asset_ids?.length;
  const notes = notesLine(state.notes || {});
  /* 清单esesteunopágina唯uno自己滚, Original生滚动Eneste儿就esuno系统灰柱子.  */
  const list = useOverlayScrollbar<HTMLUListElement>();
  return (
    /* 空着时Completo收起: `aria-live` 容DispositivoDeja着uno空轨道, 卡片底abajo就凭空más出unoEspaciado.  */
    <div aria-live="polite" className="flex flex-col gap-4 empty:hidden">
      {state.status === 'running' && state.stalled
        ? <Note tone="warning" title="Procesamiento lento">{STALLED_TEXT}</Note>
        : null}
      {problem || state.status === 'failed'
        ? <Note tone="error" className="gap-0 p-3"
            action={retryable
              ? <Button variant="primary" size="small" onClick={onRetry}>ReintentarNoFinalizar项</Button>
              : null}
            extra={details
              /* tres层东西叠En同uno红底arriba: uno句结论, uno清单, unoRegistro地址. 各自之间
                 横uno自己Color发丝线, 读人才ver得出哪uno段Terminar—Solo靠Espaciado话, 
                 几diez同样largocorto明细会连成uno片.  */
              ? <div className="mt-3 border-t border-current/20 pt-3">
                  <Disclosure summary={details.label} contentClassName="gap-0">
                    {/* 轨道es滚动容Dispositivo兄弟, 得Conuno层Solo裹着清单定祖先给它落脚.  */}
                    <div className="relative">
                      {/* 间线画En每自己身arriba, No用 `divide-y`: eseuno族SeleccionarDispositivo裹En
                          `:where()` dentroSin特异性, 压No过岛interior `@scope` último尾ese所Con元素
                          边框清cero preflight, 线会静predetermina消失.  */}
                      <ul ref={list} className="max-h-96 overflow-y-auto pr-3">
                        {details.items.map((item) => (
                          <li key={item.key}
                            className="flex flex-col gap-1 border-b border-current/15 py-2 wrap-anywhere first:pt-0 last:border-b-0 last:pb-0">
                            {item.href
                              ? <a href={item.href} className="text-body-2-medium underline-offset-4 hover:underline">{item.label}</a>
                              : <span className="text-body-2-medium">{item.label}</span>}
                            <span className="text-caption-1-regular">{item.note}</span>
                            {item.hint ? <code className="text-caption-1-regular break-all">{item.hint}</code> : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                    {details.log
                      /* Registro地址使用次级文字色, 分隔线沿用ErrorSugerencia红色.  */
                      ? <div className="mt-3 border-t border-border-error-default/20 pt-3 text-text-secondary">
                          <PathLine path={details.log} prefix="Todos los registros completados:" className="text-caption-1-regular"
                            onRevealed={toast} />
                        </div>
                      : null}
                  </Disclosure>
                </div>
              : null}>
            {problem || state.error || 'ProcesarNoFinalizar, Por favorReintentar'}
          </Note>
        : null}
      {settled?.status === 'complete'
        ? <Note tone="success" title="Procesamiento completado">{receiptText(settled)}</Note>
        : null}
      {!processingActive(state) && notes
        ? <Note tone="neutral"
            extra={state.issues_log
              /* en proceso性Sugerencia分隔线跟随次级文字色.  */
              ? <div className="mt-1.5 border-t border-current/20 pt-1.5 text-text-secondary">
                  <PathLine path={state.issues_log} prefix="Todos los registros completados:" className="text-caption-1-regular"
                    onRevealed={toast} />
                </div>
              : null}>
            {notes}
          </Note>
        : null}
    </div>
  );
}

export function LibraryProcessingCard(props: LibraryProcessingProps) {
  const { toast, onComplete } = props;
  const { job, settled, forget } = useLibraryProcessingJob(props);
  const start = useMutation({
    mutationFn: (command: LibraryProcessingCommand) =>
      apiSend<LibraryProcessingData>(LIBRARY_PROCESSING_URL, command),
    onSuccess: (next) => {
      forget();
      // 回就esesteuno趟Nuevorápido照, 换进缓存即puede; 节律由esteClave说算, 让它立刻pesado读uno次continuararriba. 
      queryClient.setQueryData(LIBRARY_PROCESSING_KEY, next);
      void queryClient.invalidateQueries({ queryKey: LIBRARY_PROCESSING_KEY });
    },
  });
  // esteuno趟跑完就让遗Deja层pesado画DatosGestionarpáginaese几计数: 复核y候选读数跟着它变. 
  useEffect(() => { if (settled) onComplete?.() }, [settled, onComplete]);

  const state = job.data ?? { status: 'idle' };
  const problem = start.error ? errorMessage(start.error)
    : job.isError ? (job.data ? DISCONNECTED_TEXT : errorMessage(job.error))
    : '';
  const busy = start.isPending || processingActive(state);

  const run = async (command: LibraryProcessingCommand) => {
    if (busy) return;
    start.reset();
    await start.mutateAsync(command);
  };
  const retry = () => {
    if (!state.job_id || !state.retryable_asset_ids?.length) return;
    void run({ job_id: state.job_id, retry: state.retryable_asset_ids }).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4">
      <Fieldset layout="stack" label="Escaneo y recopilación" footer={
        <>
          <LinkButton href="/sources" size="small" trailingIcon={RiArrowRightLine}>Fuentes y credenciales</LinkButton>
          {state.candidates
            ? <LinkButton href="/review" size="small" trailingIcon={RiArrowRightLine}>复核Detalles</LinkButton>
            : null}
          {/* 两入口y存, 各自答Noesuno问题: aquíes"pesadoNuevo跑unoCompleto批", abajo面eseErrorSugerenciadentro
              "ReintentarnoCompletado项"Solo补Anterior趟没做完ese些. Recolectardentro网络Tiempo de espera几乎每趟都Dejaabajo几项puede
              Reintentar, página脚要es让给ReintentarClave, Nuevo入Biblioteca片子就再也Sin入口被扫到.  */}
          <ProcessingActions scan busy={busy} metadataOnly={state?.metadata_only} speedMode={state.speed_mode} onRun={run} />
        </>
      }>
        <div className="flex flex-col gap-2">
          <FieldsetTitle>Escaneo y recopilación</FieldsetTitle>
          <p className="text-body-2-regular text-text-secondary">{SCAN_CARD_TEXT}</p>
          {state.status === 'paused' && !state.total
            ? <p className="text-caption-1-regular text-text-secondary">Pausado</p>
            : processingActive(state)
            ? <ProcessingProgress state={state} />
            : null}
          {processingActive(state) ? <p className="text-body-2-regular text-text-secondary tabular-nums" data-processing-eta="">
            {remainingTime(state)}
          </p> : null}
          <ProcessingControls state={state} disabled={start.isPending || job.isError} />
        </div>
      </Fieldset>
      <Outcome state={state} problem={problem} settled={settled} onRetry={retry} toast={toast} />
    </div>
  );
}
