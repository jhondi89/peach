/* DatosGestionarpáginaen la"媒体修复"卡片: 选uno媒体Biblioteca, dentro面播No或播No顺 MP4 批量修bien. 
 *
 * 卡片 y "escanearyRecolectar"同uno副形状: izquierda边讲este件事 y 此刻Progreso, página脚放媒体Bibliotecay起停Clave; 
 * esteuno趟abajo场挂En卡片exterior面. 跑动时两秒问uno次, 空闲时No问.  */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { confirmModal, MEDIA_SOURCE_ICONS } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import { Select, SelectItem } from '@/components/base/select/select';

import { apiSend } from '../../api';
import { REPAIR_CARD_TEXT } from '../../management';
import { JOB_RUNNING_POLL_MS } from '../background-job';
import { Fieldset, FieldsetTitle } from '../components/fieldset';
import { Note } from '../components/note';
import { Progress } from '../components/progress';
import { queryClient } from '../query';
import { SourceMark } from '../settings/section';
import { busyProps, useAction } from '../settings/use-action';
import {
  fetchMediaRepair, fetchRepairLibraries, IDLE_REPAIR, MEDIA_REPAIR_KEY, MEDIA_REPAIR_URL,
  missingToolText, REPAIR_LIBRARIES_KEY, statusLine, type MediaRepairState,
} from './media-repair';

const libraryMark = (icon: string) => MEDIA_SOURCE_ICONS[icon] || icon;
const replace = (next: MediaRepairState) => queryClient.setQueryData(MEDIA_REPAIR_KEY, next);

export function MediaRepairCard() {
  const repair = useQuery({
    queryKey: MEDIA_REPAIR_KEY, queryFn: ({ signal }) => fetchMediaRepair(signal),
    refetchInterval: (query) => (query.state.data?.status === 'running' ? JOB_RUNNING_POLL_MS : false),
  });
  const choices = useQuery({
    queryKey: REPAIR_LIBRARIES_KEY, queryFn: ({ signal }) => fetchRepairLibraries(signal),
  });
  const [chosen, setChosen] = useState('');
  const action = useAction();
  const state = repair.data ?? IDLE_REPAIR;
  const libraries = choices.data ?? [];
  const running = state.status === 'running';

  // 跑着eseuno轮握着abajo拉框; 空闲时es人选ese, 没选过就esAnterior轮修Biblioteca, 再Sin就esNo.uno. 
  const selected = libraries.find((row) => row.id === (running ? state.library : chosen))
    ?? libraries.find((row) => row.id === state.library) ?? libraries[0];

  const start = () => {
    if (!selected) return;
    void confirmModal({
      title: `RepararBiblioteca de medios"${selected.name}"`,
      body: '缺Hora戳表片子另存uno修bien头, OriginalArchivoNo动; 缺Indexar片子pesado建posteriorReemplazarOriginalArchivo, '
        + '坏Original件改名成同DirectorioOcultarArchivo(.Nombre de archivo.peach-original)Deja着. '
        + (selected.metered ? 'esteBibliotecaEn计费Fuentearriba, 每修uno título(s)都要片子CompletadoCompleto拉uno遍. ' : ''),
      confirmLabel: 'RepararBiblioteca de medios',
      onConfirm: async () => replace(await apiSend<MediaRepairState>(MEDIA_REPAIR_URL,
        { library: selected.id, restart: true })),
    });
  };
  const stop = () => void action.run('stop',
    (signal) => apiSend<MediaRepairState>(MEDIA_REPAIR_URL, { stop: true }, 'POST', signal), replace);

  const line = statusLine(state);
  const complete = state.status === 'complete';
  const problem = action.error || state.error || (repair.error ? '读No到Reparación de mediosEstado' : '');
  return (
    <div className="flex flex-col gap-4">
      <Fieldset layout="split" label="Reparación de medios" footer={
        <>
          <Select aria-label="Biblioteca de medios" className="w-48" selectedKey={selected?.id ?? null}
            isDisabled={running || !libraries.length}
            onSelectionChange={(key) => { if (key !== null) setChosen(String(key)); }}>
            {libraries.map((row) => (
              <SelectItem key={row.id} id={row.id} textValue={row.name}>
                <SourceMark mark={libraryMark(row.icon)} />{row.name}
              </SelectItem>
            ))}
          </Select>
          {running
            ? <Button onClick={stop} {...busyProps(action.busy === 'stop')}>Detener</Button>
            : <Button onClick={start} disabled={!selected}>Iniciar reparación</Button>}
        </>
      }>
        <div className="flex flex-col gap-2">
          <FieldsetTitle>Reparación de medios</FieldsetTitle>
          <p className="text-body-2-regular text-text-secondary">{REPAIR_CARD_TEXT}</p>
          {running && state.total
            ? <Progress label="RepararProgreso" value={state.checked} max={state.total} />
            : null}
          {line ? <p role="status" className="text-caption-1-regular text-text-secondary">{line}</p> : null}
        </div>
      </Fieldset>
      <div aria-live="polite" className="flex flex-col gap-4 empty:hidden">
        {complete && !state.repaired && !state.failed
          ? <Note tone="info" title="Nada que reparar">esteBibliotecaen la片子都能直continuar播. </Note>
          : null}
        {complete && state.missing_tool
          ? <Note tone="warning" title="Falta untrunc">{missingToolText(state)}</Note>
          : null}
        {problem ? <Note tone="error">{problem}</Note> : null}
      </div>
    </div>
  );
}
