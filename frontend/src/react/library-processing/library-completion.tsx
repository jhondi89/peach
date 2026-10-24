import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { cardArtwork } from '@peach/card-art';

import { LinkButton } from '@/components/base/buttons/link-button';
import { RiArrowRightLine } from '@remixicon/react';

import { apiSend, errorMessage } from '../../api';
import type { MediaItem } from '../catalog-grid/types';
import { Note } from '../components/note';
import { queryClient } from '../query';
import {
  DISCONNECTED_TEXT, fetchLibraryProcessing, LIBRARY_PROCESSING_KEY, LIBRARY_PROCESSING_URL,
  pollInterval, processingActive, type LibraryProcessingCommand, type LibraryProcessingData,
} from './library-processing';
import { ProcessingActions } from './processing-actions';

/** 缺Imagen判据y卡面uno致; 本机影片puede抽帧, ConCódigo JAV挂载影片puede补LanzamientoPortada.  */
type PreviewItem = Pick<MediaItem, 'id' | 'name' | 'medium' | 'disposal' | 'location' | 'code' | 'is_jav'
  | 'has_cover' | 'cover_key' | 'has_thumb' | 'has_local_poster' | 'follow_thumb_url'>;

export function missingPreviewIds(items: PreviewItem[], javImage: string): number[] {
  return [...new Set(items.filter(item => (!item.medium || item.medium === 'video')
    && (!/\.(strm|iso)$/i.test(item.name || '') || !!item.code)
    && !item.disposal && item.location !== 'online' && (item.location === 'local' || !!item.code)
    && !cardArtwork(item, 'small', false, javImage).html).map(item => item.id))];
}

export function LibraryCompletionPrompt({ assetIds, onComplete }: { assetIds: number[]; onComplete?(): void }) {
  return assetIds.length ? <Completion assetIds={assetIds} onComplete={onComplete} /> : null;
}

function Completion({ assetIds, onComplete }: { assetIds: number[]; onComplete?(): void }) {
  const job = useQuery({ queryKey: LIBRARY_PROCESSING_KEY,
    queryFn: ({ signal }) => fetchLibraryProcessing(signal),
    refetchInterval: query => pollInterval(query.state.data, true) });
  const [started, setStarted] = useState<string | null>(null);
  const [outcome, setOutcome] = useState('');
  const completed = useRef<string | null>(null);
  const start = useMutation({
    mutationFn: (command: LibraryProcessingCommand) =>
      apiSend<LibraryProcessingData>(LIBRARY_PROCESSING_URL, { ...command, asset_ids: assetIds }),
    onSuccess: next => {
      setStarted(next.job_id || null);
      queryClient.setQueryData(LIBRARY_PROCESSING_KEY, next);
      void queryClient.invalidateQueries({ queryKey: LIBRARY_PROCESSING_KEY });
    },
  });
  const state = job.data;
  useEffect(() => {
    if (!state || !started || state.job_id !== started || processingActive(state)
      || completed.current === started) return;
    completed.current = started;
    if (state.status === 'complete') {
      setOutcome(`CompletarFinalizar: Obtener ${state.covers || 0}  imagen(es)Portada, 生成 ${state.previews || 0}  título(s)Vista previa de video. `);
    }
    void queryClient.invalidateQueries({ queryKey: ['catalog-grid'] });
    onComplete?.();
  }, [state, started, onComplete]);
  // 运行en procesoProgresoy控制由常驻Tarea卡承continuar, 缺ImagenSugerenciaSoloEnpuede发起Completar时呈现. 
  if (processingActive(state)) return null;
  const busy = start.isPending || processingActive(state);
  const problem = start.error ? errorMessage(start.error) : job.error ? DISCONNECTED_TEXT
    : started && state?.job_id === started && state.status === 'failed' ? state.error || 'CompletarNoFinalizar' : '';
  const message = problem || (start.isPending ? 'ProcesandoIniciarCompletar...'
    : outcome || `este批PelículaEn procesoCon ${assetIds.length.toLocaleString()}  título(s)暂Sin vista previa, puedeCompletar detallesyImágenes. `);
  return <section aria-label="CompletarVista previa" aria-live="polite" data-library-completion="" className="@container mb-4">
    <Note tone={problem ? 'warning' : 'neutral'} action={<div className="flex flex-wrap items-center gap-2"><ProcessingActions busy={busy} metadataOnly={state?.metadata_only} onRun={command => {
      if (busy) return;
      setOutcome('');
      start.mutate(command);
    }} /></div>}>
      {message}{' '}<LinkButton href="/data-cleanup#libraryProcessing" size="small" trailingIcon={RiArrowRightLine}>
      {problem ? 'Ver y procesar' : 'verProcesarDetalles'}
    </LinkButton></Note>
  </section>;
}
