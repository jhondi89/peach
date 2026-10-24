/* VerificarActualizar: 当anteriory最NuevoVersión, DescargarInstalarProgreso, 准备bien之posteriorConfirmarpesado启. 
 *
 * ActualizarTareaEn progreso每秒问uno次Estado, 空闲时 30 秒uno次; 连续 120 次问No到就停abajoyDescripciónOriginal因.  */
import { useEffect, useRef, useState } from 'react';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';

import { apiGet, apiSend, errorMessage } from '../../api';
import type { ReleaseState, UpdateJob } from '../bundle';
import { Note } from '../components/note';
import { Progress } from '../components/progress';
import { ErrorText, ExternalLink, Fact, FactList, Footer, Help, Section, Stack } from './section';
import { busyProps, useAction } from './use-action';

const ACTIVE = new Set(['downloading', 'verifying', 'extracting', 'preparing', 'restarting', 'installing']);
const STOPS = [65, 75, 90];
const MAX_FAILURES = 120;

export function ReleaseUpdates({ initial, initialJob }: { initial: ReleaseState; initialJob?: UpdateJob | undefined }) {
  const [data, setData] = useState(initial);
  const [job, setJob] = useState<UpdateJob>(initialJob || { state: 'idle', progress: 0 });
  const [pollError, setPollError] = useState('');
  const action = useAction();
  const prompted = useRef(false);
  const mounted = useRef(true);
  const running = ACTIVE.has(job.state);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  const restart = async () => {
    const result = await apiSend<UpdateJob>('/api/configuration/update-restart', {});
    if (mounted.current) setJob(result);
  };
  const confirmRestart = () => void confirmModal({
    title: 'ActualizarYa准备bien', body: `Peach ${job.version || ''} 将EnReiniciarposteriorInstalar. `,
    confirmLabel: 'Reiniciar ahora', cancelLabel: 'Más tarde', onConfirm: restart,
  });

  useEffect(() => {
    if (job.state !== 'ready' || prompted.current) return;
    prompted.current = true;
    confirmRestart();
  }, [job.state]);

  useEffect(() => {
    const controller = new AbortController();
    const delay = ACTIVE.has(job.state) ? 1000 : 30000;
    let timer: ReturnType<typeof setTimeout>;
    let failures = 0;
    const poll = async () => {
      try {
        const result = await apiGet<UpdateJob>('/api/configuration/update-status', controller.signal);
        if (controller.signal.aborted) return;
        setJob(result);
        failures = 0;
        if (result.state === 'complete') {
          setData((current) => ({ ...current, current_version: result.version || current.current_version, state: 'current', message: 'Ya está actualizadoProbar版. ' }));
        }
        const automatic = await apiGet<{ result?: ReleaseState }>('/api/configuration/automatic-updates', controller.signal);
        if (!controller.signal.aborted && automatic.result) setData(automatic.result);
      } catch {
        failures += 1;
        if (failures >= MAX_FAILURES && !controller.signal.aborted) setPollError('aúnNoConectar到 Peach, Por favorVerificarBandeja del sistemaposteriorActualizarpágina面. ');
      }
      if (!controller.signal.aborted && failures < MAX_FAILURES) timer = setTimeout(poll, delay);
    };
    timer = setTimeout(poll, delay);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [job.state]);

  const download = () => {
    if (running) return;
    prompted.current = false;
    setPollError('');
    void action.run('download', (signal) => apiSend<UpdateJob>('/api/configuration/update', {}, 'POST', signal), setJob);
  };
  const check = () => void action.run('check', (signal) => apiGet<ReleaseState>('/api/configuration/updates', signal), setData,
    (cause) => { setData({ ...initial, state: 'error' }); action.setError(errorMessage(cause)); });

  const error = action.error || pollError;
  const reading = job.state === 'downloading' && job.total
    ? `${((job.downloaded || 0) / 1048576).toFixed(1)} / ${(job.total / 1048576).toFixed(1)} MB`
    : `${job.progress}%`;
  return (
    <Section title="Comprobar actualizaciones">
      <FactList>
        <Fact term="Versión actual">{data.current_version}</Fact>
        <Fact term="Método de instalación">{data.installation}</Fact>
        <Fact term="Actualizar通道">{data.channel}</Fact>
        <Fact term="Versión más reciente">{data.latest_version || (data.state === 'unchecked' ? 'Sin verificar' : 'No disponible')}</Fact>
        {data.package_kind ? <Fact term="Descargar contenido">
          {data.package_kind === 'update' ? 'AplicarActualizar包' : 'Apps y herramientas'}
          {data.asset_size ? ` · ${(data.asset_size / 1048576).toFixed(1)} MB` : ''}
        </Fact> : null}
      </FactList>
      {data.package_kind === 'update'
        ? <Help>AplicarActualizar包复用InstaladoHerramientas; Herramientas缺失, 损坏或Versión变化时会另行Descargas所需Herramientas包. </Help>
        : data.package_kind === 'full' ? <Help>本次ActualizarContieneMediosHerramientas. </Help> : null}
      {/* 还没Verificar过时"最NuevoVersión"eseuno行ya经写着"aúnnoVerificar", abajo面No再说uno遍.  */}
      {data.state === 'unchecked' && !data.checked_at && !error && job.state === 'idle' ? null : <Stack divided>
        {data.checked_at ? <Help>Verificar于 {new Date(data.checked_at * 1000).toLocaleString()}</Help> : null}
        {data.state === 'available' && !error
          ? <Note tone="info" title="ConDisponibleActualizar">{data.message}</Note>
          : error || data.state === 'error'
            ? <ErrorText>{error || data.message}</ErrorText>
            : data.state === 'unchecked' ? null : <Help role="status">{data.message}</Help>}
        {job.state === 'error' ? <ErrorText>{job.message}</ErrorText> : null}
        {job.state !== 'idle' && job.state !== 'error' ? (
          <div aria-live="polite" className="flex flex-col gap-2">
            <Progress label="Actualizar准备Progreso" value={job.progress} stops={STOPS} />
            <Help>Descargar → 校验 → Descomprimir → 准备Instalar · {job.message}</Help>
            <Help>{reading}</Help>
          </div>
        ) : null}
      </Stack>}
      <Footer status={<ExternalLink href={data.release_url}>Ver página de lanzamiento</ExternalLink>}>
        {job.state === 'ready' ? <Button onClick={confirmRestart}>ReiniciarInstalar</Button> : null}
        {data.state === 'available' && data.installation === 'Paquete de prueba independiente' && job.state !== 'ready'
          ? <Button onClick={download} {...busyProps(running || action.busy === 'download')}>Descargar e instalar</Button>
          : null}
        <Button variant={job.state === 'ready' || (data.state === 'available' && data.installation === 'Paquete de prueba independiente') ? 'secondary' : 'primary'}
          disabled={running} onClick={check} {...busyProps(action.busy === 'check')}>Comprobar actualizaciones</Button>
      </Footer>
    </Section>
  );
}
