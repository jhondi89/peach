/* DatosGestionarPágina: Bibliotecadentroya经Con东西怎么收拾. 
 *
 * 照 Board  dashboard 模板排: 顶Anterior排读数卡, 每esunocontenidoEnBibliotecaen la经过, 兼eseunopágina入口; 
 * abajo面uno列es要Enestepáginaarriba做几件事(escanearyRecolectar, 媒体修复, Organizar), 再往abajoes链continuar
 * Gestionar, SoloEnConArchivoya消失Obras时才出现HuérfanoRegistro, 最posterioresSoloEnCon来源配根Directorio时才出现
 * 资源Sincronizar.  */
import { useQuery } from '@tanstack/react-query';
import { fmtSize } from '@peach/legacy/core';

import type { DataCleanupProps, DataCleanupSection } from '../bundle';
import { Page } from '../components/page';
import { spriteGlyph, type Glyph } from '../components/sprite-glyph';
import { PLAIN_STAT_STRIP, PlainStat, plainStatClass } from '../components/stat-card';
import { DUPLICATES_KEY, fetchDuplicates } from '../duplicates/duplicates';
import { LibraryProcessingCard } from '../library-processing/library-processing-card';
import { MediaRepairCard } from '../media-repair/media-repair-card';
import { fetchMediaSources, MEDIA_SOURCES_KEY } from '../media-sources';
import { fetchQualityGoals, QUALITY_GOALS_KEY } from '../quality-goals/quality-goals';
import { queryClient } from '../query';
import {
  fetchJunkSummary, fetchReviewCounts, fetchTrashSummary, JUNK_KEY, junkBreakdown,
  REVIEW_COUNTS_KEY, reviewSummary, TRASH_KEY,
} from './data-cleanup';
import { LinkManager } from './link-manager';
import { OrganizeCard } from './organize-card';
import { OrphanRecordsCard } from './orphan-records-card';
import { hasResourceRoots } from './resource-sync';
import { ResourceSyncCard } from './resource-sync-card';

interface Reading { figure: string; meta?: string }

/** uno读数卡tresabajo场: 还En取, 取到, 取No到. 各卡各自Fallo各自算.  */
function reading<T>(
  query: { data: T | undefined; isError: boolean }, read: (data: T) => Reading,
): Reading {
  if (query.data !== undefined) return read(query.data);
  return { figure: query.isError ? '读取Fallido' : '—' };
}

function EntryCard(
  { section, label, icon, value, open }:
  { section: DataCleanupSection; label: string; icon: Glyph; value: Reading; open(section: DataCleanupSection): void },
) {
  return (
    <button type="button" className={plainStatClass({ interactive: true })} data-cleanup-go={section}
      onClick={() => open(section)}>
      <PlainStat label={label} icon={icon} figure={value.figure} meta={value.meta} />
    </button>
  );
}

const REVIEW = spriteGlyph('square-check-big');
const QUALITY = spriteGlyph('sparkles');
const DUPLICATES = spriteGlyph('file-stack');
const JUNK = spriteGlyph('file-archive');
const TRASH = spriteGlyph('trash');

/* escanearyRecolectar跑完, Bibliotecadentromás出来东西会落进estetres读数: 复核, alto清版yRepetirArchivo.  */
const PROCESSING_READINGS = [REVIEW_COUNTS_KEY, QUALITY_GOALS_KEY, DUPLICATES_KEY];
const refreshReadings = () => {
  for (const queryKey of PROCESSING_READINGS) void queryClient.invalidateQueries({ queryKey, exact: true });
};

export function DataCleanupPage({ toast, failure, open }: DataCleanupProps) {
  const review = useQuery({ queryKey: REVIEW_COUNTS_KEY, queryFn: ({ signal }) => fetchReviewCounts(signal) });
  const quality = useQuery({ queryKey: QUALITY_GOALS_KEY, queryFn: ({ signal }) => fetchQualityGoals(signal) });
  const duplicates = useQuery({ queryKey: DUPLICATES_KEY, queryFn: ({ signal }) => fetchDuplicates(signal) });
  const junk = useQuery({ queryKey: JUNK_KEY, queryFn: ({ signal }) => fetchJunkSummary(signal) });
  const trash = useQuery({ queryKey: TRASH_KEY, queryFn: ({ signal }) => fetchTrashSummary(signal) });
  const sources = useQuery({ queryKey: MEDIA_SOURCES_KEY, queryFn: ({ signal }) => fetchMediaSources(signal) });
  const notify = (message: string) => toast(message);

  return (
    <Page>
      <div className={PLAIN_STAT_STRIP}>
        <EntryCard section="review" label="Revisión manual" icon={REVIEW} open={open}
          value={reading(review, reviewSummary)} />
        <EntryCard section="quality" label="Versión HD" icon={QUALITY} open={open}
          value={reading(quality, (data) => ({ figure: `${Number(data.total || 0).toLocaleString()} Pendiente de actualización` }))} />
        <EntryCard section="duplicates" label="Archivos duplicados" icon={DUPLICATES} open={open}
          value={reading(duplicates, (data) => (Number(data.total || 0)
            ? {
                figure: `${Number(data.total).toLocaleString()} Grupo · ${Number(data.files || 0).toLocaleString()} Archivo`,
                meta: `puede回收 ${fmtSize(data.reclaimable || 0)}`,
              }
            : { figure: 'SinContenido duplicado' }))} />
        <EntryCard section="ads" label="Archivos basura" icon={JUNK} open={open}
          value={reading(junk, (data) => ({
            figure: `${Number(data.pending_total || 0).toLocaleString()} Pendiente判断`, meta: junkBreakdown(data),
          }))} />
        <EntryCard section="trash" label="Papelera" icon={TRASH} open={open}
          value={reading(trash, (data) => ({
            figure: `${Number(data.total || 0).toLocaleString()} 项EnPapelera`,
            meta: data.total ? `占用 ${fmtSize(data.bytes || 0)}` : '',
          }))} />
      </div>
      <div className="flex flex-col gap-4 max-cleanup-tight:gap-3">
        {/* 卡片 y 它Sugerenciaes两件东西, Sugerencia挂En卡片exterior面: `#libraryProcessing` esesteuno格本身, 
            地址栏带着它进来时滚到aquí.  */}
        <div id="libraryProcessing" className="scroll-mt-20">
          <LibraryProcessingCard toast={notify} monitor onComplete={refreshReadings} />
        </div>
        <div id="mediaRepair"><MediaRepairCard /></div>
        <OrganizeCard toast={notify} failure={failure} />
      </div>
      <LinkManager />
      <OrphanRecordsCard toast={notify} />
      {hasResourceRoots(sources.data) ? <ResourceSyncCard toast={toast} /> : null}
    </Page>
  );
}
