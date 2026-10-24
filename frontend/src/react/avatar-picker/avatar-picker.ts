/* 换AvatarDatos契约. 
 *
 * 候选Imagen走 `/avatar-choice?ref=`: página面Solo递服务端自己列出来 ref, 地址由服务端按索引拼. 
 * 手Introduce地址先交给 `/api/avatar-frame`, 过服务端公网判据, 取回来DejaEn缓存dentro, 才变成
 * uno `url:` ref; 本机ArchivoSoloEnExplorar dispositivodentroVista previa, Confirmar时按Original字节发出去.  */
import { ApiError, apiGet, apiSend } from '../../api';
import {
  centeredBox, frameWithin, isUsableSize, type CropBox, type CropSize,
} from '../../crop-geometry';

export const AVATAR_CHOICES_URL = '/api/avatar-choices';
export const AVATAR_PICK_URL = '/api/avatar-pick';
export const AVATAR_CODE_COVER_URL = '/api/avatar-code-cover';
export const AVATAR_FRAME_URL = '/api/avatar-frame';
const AVATAR_CHOICE_IMAGE_URL = '/avatar-choice';

export interface AvatarChoice {
  ref: string;
  source: 'gfriends' | 'history' | 'asset' | 'code' | 'url' | 'upload' | 'social' | 'online';
  label: string;
  width: number;
  height: number;
  detail: string;
  /** esteuno格es按哪名字从ImagenBibliotecadentro找到. SoloConuno名字命en proceso时es空串.  */
  found_by: string;
  current: boolean;
  /** esteuno格必须先框uno再装. ObrasImagenes横Imagen, Completo装进圆框Solo剩unoFondo.  */
  crop: boolean;
  /** 框选时puede以换底Imagen, 按 ref 给: Portada加nueve宫格esenueve格.  */
  bases: string[];
  /** Portadaarriba该取景eseuno(脸周围方Imagen, 没检出脸封套es正封), 源Imagen像素. 
   *  Solo对 `ref` eseuno, `width`×`height` ese尺寸作数.  */
  focus: CropBox | null;
  /** este部ObrasCon几演员; 0 esNo知道. más于uno时 `focus` No围着Portadaarribaese脸, 
   *  esemásmedioes领衔另uno.  */
  cast: number;
  /** Portadaese底ImagenVersión. Portada会Original地Reemplazar, Vista previa地址带arriba它才No显示antiguoImagen, 交框时回递它, 
   *  服务端才认得出框esEn哪unoarriba画. 别底ImagenNo会Original地变, es空串.  */
  version: string;
}

export interface AvatarChoices {
  kind: string;
  entity_id: number;
  names: string[];
  /** 名字链dentroEnImagenBibliotecaen proceso真ConImagenese几, 按链en la先posterior.  */
  matched_names: string[];
  choices: AvatarChoice[];
  index_age_hours: number | null;
  index_stale: boolean;
}

/** uno人unoClave: 换人就es另uno候选, No该读到Anterior人.  */
export const avatarChoicesKey = (kind: string, id: number) => ['avatar-choices', kind, id] as const;

const query = (kind: string, id: number) => `?kind=${encodeURIComponent(kind)}&id=${id}`;

export const choiceImageUrl = (kind: string, id: number, ref: string, version = '') =>
  `${AVATAR_CHOICE_IMAGE_URL}${query(kind, id)}&ref=${encodeURIComponent(ref)}`
  + (version ? `&v=${encodeURIComponent(version)}` : '');

/** 底Imagen `ref` Versión: SoloConPortadaeseunoCon, nueve宫格ese几格es空串.  */
export const baseVersion = (choice: AvatarChoice, ref: string): string =>
  ref.startsWith('cover:') || ref.endsWith(':cover') ? choice.version : '';

export const fetchAvatarChoices = (kind: string, id: number, signal?: AbortSignal) =>
  apiGet<AvatarChoices>(AVATAR_CHOICES_URL + query(kind, id), signal);

/** 按Código JAV取unoPortada来框. Código JAVNo必En馆藏dentro: 本机Sin时服务端去Oficial渠道取.  */
export const fetchCodeCover = (code: string) =>
  apiSend<AvatarChoice>(AVATAR_CODE_COVER_URL, { code });

/** uno格人像进框选之anterior, 服务端量出尺寸, 检出脸 y puede换底Imagen, y进esteuno格自己Descripción. 
 *  ListadentroImagenBibliotecaImagen还没取过时尺寸es 0, 而Predeterminado框SoloEn尺寸对得arriba时才按脸落.  */
export async function frameChoice(kind: string, id: number, choice: AvatarChoice): Promise<AvatarChoice> {
  const framed = await apiSend<AvatarChoice>(AVATAR_FRAME_URL, { kind, id, ref: choice.ref });
  return { ...choice, width: framed.width, height: framed.height, focus: framed.focus, bases: framed.bases };
}

/** 手Introduce地址: 服务端过公网判据, 取uno次Deja进缓存, 交回uno格 `url:` 候选.  */
export const frameAddress = (kind: string, id: number, url: string) =>
  apiSend<AvatarChoice>(AVATAR_FRAME_URL, { kind, id, url });

/** 本机Archivo: 按Original字节发过去量尺寸, 检脸, 服务端NoDeja.  */
export const frameFile = (kind: string, id: number, file: File) =>
  sendBytes<AvatarChoice>(`${AVATAR_FRAME_URL}${query(kind, id)}&name=${encodeURIComponent(file.name)}`, file);

/* 本机Archivo按Original样发字节, No走 multipart: 解析 multipart 要másuno依赖, 而aquíSoloCon
   unoArchivo, Sin别字段, Archivo名 y 框走Consulta串. Por favor求体Noes JSON, 所以No经 `apiSend`.  */
async function sendBytes<T>(url: string, file: File): Promise<T> {
  const response = await fetch(url, { method: 'POST', credentials: 'same-origin', body: file });
  const payload = await response.json().catch(() => null) as (T & { error?: string }) | null;
  if (response.ok) return payload as T;
  throw new ApiError(payload?.error || `Por favor求Fallido(${response.status})`, response.status, payload);
}

/** uno候选按 `aspect` 取景eseuno: Con取景区就En它dentro面取, Sin就CompletoImagen居en proceso. 
 *  `size` Noesesteuno格自己eseImagen时(换底Imagen)uno律居en proceso: 取景区Solo对它自己像素作数.  */
export function choiceFrame(choice: AvatarChoice, size: CropSize, aspect: number): CropBox {
  const own = size.width === choice.width && size.height === choice.height;
  return choice.focus && own ? frameWithin(choice.focus, size, aspect) : centeredBox(size, aspect);
}

/** 格子要No要自己取景: SoloCon要框ese几路(ObrasImagen, Código JAVPortada)es横Imagen. 竖ImagenBiblioteca
 *  人像照antiguo `object-cover`, 尺寸No知道也es.  */
export const framesItself = (choice: AvatarChoice): boolean =>
  choice.crop && isUsableSize({ width: choice.width, height: choice.height });

/** 框选出来eseuno, 源Imagen像素, derechaabajo开区间. posterior端按同uno组Completo数裁.  */
export interface AvatarCrop { x0: number; y0: number; x1: number; y1: number }

/** 两路交arriba去东西No同, 落点es同uno端点. `crop` es共用puede选工序, No给就Completo装.  */
export type AvatarSubmission =
  | { ref: string; crop?: AvatarCrop; version?: string }
  | { file: File; crop?: AvatarCrop };

export async function sendAvatarPick(
  kind: string, id: number, submission: AvatarSubmission,
): Promise<void> {
  if (!('file' in submission)) {
    await apiSend(AVATAR_PICK_URL, { kind, id, ...submission });
    return;
  }
  const { file, crop } = submission;
  const box = crop ? `&crop=${[crop.x0, crop.y0, crop.x1, crop.y1].join(',')}` : '';
  await sendBytes(`${AVATAR_PICK_URL}${query(kind, id)}&name=${encodeURIComponent(file.name)}${box}`, file);
}

/** Descripcióndentro点名别名数. 再más就esunogrande段字, 候选Cuadrícula挤得Solo剩uno排.  */
const NOTE_NAMES = 2;

/** DescripciónSoloDejauno句: esteuno屏ya经用Imagen说清En选什么, másuno行字就esmásuno行要读东西. 
 *  按哪名字找到要说—找错人esaquí唯uno会出grande错, 而名字es唯unoPistas. 名字más时点名
 *  anterior两, 余abajoSolo报数, 每uno格按谁找到En格子 title dentro.  */
export function pickerNote(name: string, data: AvatarChoices | undefined): string {
  // 候选En路arriba时Cuadrículadentroes Skeleton, aquíNo再另写uno句"En curso读取". 
  if (!data) return name;
  const elsewhere = data.matched_names.filter((one) => one !== name);
  if (elsewhere.length) {
    const named = `"${elsewhere.slice(0, NOTE_NAMES).join('""')}"`;
    const more = elsewhere.length > NOTE_NAMES ? `etc. ${elsewhere.length.toLocaleString()} Nombre` : '';
    return `${name}: Galeríadentro按${named}${more}找到. `;
  }
  return data.choices.length
    ? `${name}: 换en laese imagen(es)DejaEnEsta máquina, 随时能换回来. `
    : `${name}: Aún no hay备选Imágenes, puedeIntroducirCódigo JAV, ImágenesDirección或从Esta máquinaSeleccionar. `;
}

/** 超过两天按天数说: "124 pequeño时"要人自己去除.  */
const indexAge = (hours: number): string =>
  hours < 48 ? `${Math.max(1, Math.round(hours))} hora(s)` : `${Math.floor(hours / 24)} día(s)`;

/** ImagenBiblioteca索引没取过或ya过期, esteuno次也unoImagenBibliotecaImagen都没拿到时ese句Sugerencia; 别情形es空串. 
 *  没取过 y 过期es两回事: 过期索引照样En查, SoloesNuevo收人像查No到.  */
export function indexNote(data: AvatarChoices | undefined): string {
  if (!data || !data.index_stale || data.choices.some((one) => one.source === 'gfriends')) return '';
  return data.index_age_hours === null
    ? 'GaleríaIndexar还没取过, Solo能从UsadoImagendentro选. '
    : `GaleríaIndexar ${indexAge(data.index_age_hours)}没Actualizar, Nuevo收人像aquí还查No到. `;
}

/** más人合演Obras: 格子arriba标人数, 框选时提醒先找到她自己脸.  */
export const sharedCast = (choice: AvatarChoice): boolean => choice.cast > 1;

export const cropNote = (choice: AvatarChoice): string =>
  sharedCast(choice)
    ? `${choice.label}: ${choice.cast.toLocaleString()} 人合演, 先找到她自己脸, 再拖动方框选uno. `
    : `${choice.label}: 拖动方框选uno, 滚轮或角arribaese方改Tamaño. `;

const SOURCE_LABELS: Record<string, string> = {
  gfriends: 'Galería', history: 'Usado', asset: 'ObraImagen', code: 'Código JAVPortada',
  url: 'Dirección', upload: 'Esta máquina', social: 'Avatar de redes sociales', online: 'Obras en línea',
};

/** 底Imageneseuno排每uno格名字: Portadauno格, nueve宫格nueve格按Ubicación数.  */
export function baseLabel(ref: string): string {
  if (ref.startsWith('follow:')) {
    const what = ref.split(':')[2];
    return what === 'cover' ? 'ObraPortada' : `contenidoImágenes ${Number(what.replace('image', '') || 0) + 1}`;
  }
  if (ref.startsWith('cover:')) return 'Portada';
  const what = ref.split(':')[2] || '';
  if (what === 'cover') return 'Portada';
  const cell = Number(what.replace('cell', ''));
  return Number.isFinite(cell) ? `No. ${cell + 1} 格` : what;
}

/** uno格完CompletoDescripción, 进 `title`: 哪儿来, másgrande, 按谁找到. ObrasImagen再continuararriba服务端Descripción: 
 *  片名, 账号Sin本人身依据时还Con"Imagen representativa, no es la persona".  */
export const choiceDetail = (choice: AvatarChoice): string =>
  `${SOURCE_LABELS[choice.source] || choice.source} · ${choice.label}`
  + (choice.width ? ` · ${choice.width}×${choice.height}` : '')
  + (sharedCast(choice) ? ` · ${choice.cast.toLocaleString()} 人合演` : '')
  + (choice.found_by ? ` · 按"${choice.found_by}"找到` : '')
  + (choice.source === 'asset' && choice.detail && choice.detail !== choice.label ? ` · ${choice.detail}` : '');
