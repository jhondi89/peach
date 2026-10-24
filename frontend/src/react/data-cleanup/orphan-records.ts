/* HuérfanoRegistroDatos契约: ArchivoyaNoEn盘arriba, 带着人RegistroObras(ADR-0087). 
 *
 * uno读端点, uno写端点. Lista带每Enseis表en laRegistro数, 行en laPuntuacióny次数 y EnBiblioteca候选; 
 * continuar回Registro搬到选en procesoArchivo, 删掉antiguo行, 记unopuedeCompleto批撤回批次. 彻底Eliminar走批量Interfaz `delete`.  */
import { apiGet, apiSend } from '../../api';
import { BATCH_URL } from '../duplicates/duplicates';

export const ORPHAN_RECORDS_URL = '/api/orphan-records';
export const ORPHAN_ATTACH_URL = '/api/orphan-records/attach';
export const ORPHAN_RECORDS_KEY = ['orphan-records'] as const;

/** EnBibliotecadentropuede能es它NuevoVersióneseArchivo.  */
export interface OrphanCandidate {
  id: number;
  location: string;
  name: string;
  duration: number | null;
  size: number | null;
}

export interface OrphanRecord {
  id: number;
  name: string;
  code: string;
  location: string;
  duration: number | null;
  size: number | null;
  vanished_at: number | null;
  has_thumb: boolean;
  /** seis表各Con几, 加arriba行en laPuntuación, alto潮yReproducir次数; `last_played` 记过就es 1. SinNo出现.  */
  records: Partial<Record<RecordKey, number>>;
  candidates: OrphanCandidate[];
}

export interface OrphanRecordsData { total: number; items: OrphanRecord[] }

export type RecordTable = 'asset_preference' | 'watch_queue' | 'playlist_item'
  | 'asset_quality_goal' | 'activity_event' | 'asset_tag_preference';

/** 行arriba自己cuatro列人Registro.  */
export type RowRecord = 'rating' | 'o_count' | 'play_count' | 'last_played';

export type RecordKey = RecordTable | RowRecord;

/** seis表Enesteunoen la名字, 顺序就es显示顺序.  */
export const RECORD_LABELS: ReadonlyArray<readonly [RecordTable, string]> = [
  ['asset_preference', 'Me gustay理由'],
  ['watch_queue', 'Ver más tarde'],
  ['playlist_item', 'Lista de reproducción'],
  ['asset_quality_goal', 'Buscar mejor versión'],
  ['activity_event', 'VerHistorial'],
  ['asset_tag_preference', 'OcultarEtiqueta'],
];

export const fetchOrphanRecords = (signal?: AbortSignal) =>
  apiGet<OrphanRecordsData>(ORPHAN_RECORDS_URL, signal);

/** unoHuérfanoRegistrocontinuar到EnBiblioteca某Archivoarriba. 真实 ledger 写入, antiguo行随之Eliminar.  */
export const attachOrphan = (id: number, target: number) =>
  apiSend<{ ok: boolean; batch: string }>(ORPHAN_ATTACH_URL, { id, target });

/** 彻底Eliminaresteuno y 它带Registro. NopuedeDeshacer, 调用方必须先过危险档Confirmar弹层. 
 *  Archivo又回到盘en laeseuno落En `blocked` dentro, No删, Siguiente轮escanear会它continuar回EnBiblioteca.  */
export const purgeOrphan = (id: number | number[]) =>
  apiSend<{ ok: boolean; purged: number; blocked: unknown[] }>(BATCH_URL, { ids: Array.isArray(id) ? id : [id], operation: 'delete' });

/** 行arribacuatro列写法: 分值y次数照写; Solo记过RecienteReproducir, SinReproducir次数时写"Reproducir过".  */
const rowRecordsText = (records: OrphanRecord['records']) => [
  records.rating ? `Puntuación ${records.rating}` : '',
  records.play_count ? `Reproducir ${Number(records.play_count).toLocaleString()} 次`
    : records.last_played ? 'Reproducir过' : '',
  records.o_count ? `Orgasmo ${Number(records.o_count).toLocaleString()} 次` : '',
];

/** uno带Registro排成uno句: "喜欢y理由 1 · 观verHistorial 3 · Puntuación 4 · Reproducir 2 次".  */
export const recordsText = (records: OrphanRecord['records']) => [
  ...RECORD_LABELS
    .filter(([table]) => records[table])
    .map(([table, label]) => `${label} ${Number(records[table]).toLocaleString()}`),
  ...rowRecordsText(records),
].filter(Boolean).join(' · ');

const minutes = (seconds: number | null) => (seconds ? `${Math.round(seconds / 60)} minuto(s)` : '');

/** abajo拉框dentrouno候选Archivoeseuno行.  */
export const candidateText = (item: OrphanCandidate) =>
  [item.name, minutes(item.duration)].filter(Boolean).join(' · ');
