/* 关注página卡片, 两排yDetalles共用署名, Avatar, 来源Imagen标 y Títuloanteriorposteriorese几处字样. 
 *
 * 都es拼bien HTML 串, 卡片yDetalles用 `dangerouslySetInnerHTML` 摆进去. Imagen取No到时回落由壳
 * `wireImageFallbacks()` 委托监听按 `data-drop` Serie属性continuar手(`frontend/src/card-art/image-fallback.ts`), 
 * aquíSolo写属性. 创作者名, primero字母yAvatar取舍 y 关注Gestionarpáginaes同uno(`follow-manage.ts`). 
 *
 * 站点Imagen标, Versión字样y另见徽章按 `data-follow-*` 认, 样En `follow-feed.css`. 创作者圆框仍挂
 * `favatar`: Imagen坏时回落脚本按 `data-drop-class` 换AnteriorSolo带类名primero字母, continuarNo住属性.  */
import { api, esc, registerEntityLink } from '@peach/legacy/core';

import {
  authorAvatar, authorInitial, authorName, sourceIconUrl, type AliasGroup,
} from '../follow-manage/follow-manage';
import { localTime } from '../time';
import type { FollowContext, FollowGroup, FollowIdentity, FollowItem, FollowSource } from './follow-feed';

const text = (value: unknown): string => (typeof value === 'string' ? value : '');
const aliasesOf = (context: FollowContext) => context.aliases as readonly AliasGroup[];

/** Con站点Imagen标来源出uno `<img>`, 没登记站es空串. Imagen标独自代表站名时传 `label`, alt y
 *  title 写站名; exterior层ya经带名字传空, ImagenSolo作装饰. 取No到时撤掉, 退回exterior层文字.  */
export function sourceIcon(provider: string, label = ''): string {
  const url = sourceIconUrl(provider);
  return url
    ? `<img data-follow-site-icon="" src="${url}" alt="${esc(label)}"${label ? ` title="${esc(label)}"` : ''} loading="lazy" data-drop="self">`
    : '';
}

/** 站标eseuno格SoloConImagen标, 旁边Sin文字时用它: Filtrar来源Clave, 卡角来源角标, 没缩略Imagen卡面. 
 *  没登记Imagen标站直continuar写站名primero字; Imagen标取No到时由回落脚本换成同unoprimero字, eseuno格No会空着. 
 *  名字由exterior层 `aria-label`/`title` 说, esteen la字yImagen都Solo作装饰.  */
export function sourceMark(provider: string, label = ''): string {
  const initial = esc(authorInitial(label || provider));
  const url = sourceIconUrl(provider);
  return url
    ? `<img data-follow-site-icon="" src="${url}" alt="" loading="lazy" data-drop="initial" data-initial="${initial}" data-drop-class="follow-site-initial">`
    : `<span class="follow-site-initial" aria-hidden="true">${initial}</span>`;
}

/** TítuloComo空时卡片, DetallesyCola都写esteuno句.  */
export const FOLLOW_UNTITLED = 'No命名contenido';
export const followTitle = (item: { title?: unknown }): string => text(item.title).trim() || FOLLOW_UNTITLED;

/** esteuno版Listadentrouno创作者名字(别名合yposterior统称优先).  */
export const followAuthorName = (sources: readonly FollowSource[], context: FollowContext): string =>
  authorName(sources, aliasesOf(context));

/** 作者入口Solo认来源ya经绑定唯uno实体.  */
export function followAuthorEntity(sources: readonly FollowSource[]): string {
  const bound = sources.filter((source) => source.entity_id && source.entity_name);
  const ids = new Set(bound.map((source) => source.entity_id));
  if (ids.size !== 1) return '';
  const source = bound[0]!;
  const name = text(source.entity_name);
  registerEntityLink('creator', name, source.entity_id);
  return name;
}

/** 创作者圆框dentroese段: OficialAvatar优先, 归档站回退, 都取No到时换成primero字母.  */
export function authorAvatarHtml(sources: readonly FollowSource[], name: string): string {
  const { src, fallback } = authorAvatar(sources);
  const initial = authorInitial(name);
  if (!src) return `<span class="favatar none" title="No hay avatar disponible">${esc(initial)}</span>`;
  const fallbacks = fallback ? ` data-fallbacks="${esc(fallback)}"` : '';
  return `<img class="favatar" src="${esc(src)}" alt="" loading="lazy" referrerpolicy="no-referrer" `
    + `data-drop="initial"${fallbacks} data-initial="${esc(initial)}" data-drop-class="favatar none">`;
}

/** 卡片yDetalles署名. booru 帖子由服务端认出真正Publicar者时(`item.credit`), 名字 y Avatar都换成
 *  Publicar者: 也关注este就用ese来源, 否则Solo出primero字母, No借被关注者Avatar; 被关注者退成uno行
 *  "署名含", DescripciónesteComo什么出现Enaquí. 认No出照常署被关注者.  */
export function followIdentity(item: FollowItem, authorSources: readonly FollowSource[],
  context: FollowContext): FollowIdentity {
  const aliases = aliasesOf(context);
  const credit = item.credit as { poster?: string; credited?: string } | undefined;
  const poster = credit?.poster;
  if (!poster) {
    const name = authorName(authorSources, aliases);
    return { author: name || text(item.author) || text(item.source_label) || 'CreadorNo disponible',
      avatar: authorAvatarHtml(authorSources, name), credited: '', entityName: followAuthorEntity(authorSources) };
  }
  const key = (value: unknown) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const own = context.sources.find((row) => key(row.ref) === key(poster));
  const group = own?.author_key ? context.sources.filter((row) => row.author_key === own.author_key) : own ? [own] : [];
  const author = (group.length && authorName(group, aliases)) || poster;
  return { author, avatar: authorAvatarHtml(group, author), credited: credit.credited || '', entityName: followAuthorEntity(group) };
}

/** 说"esteunoes哪Versión"字样, 排EnTítuloanterior面, y主páginaTítuloen la版次字样同unoControles. WIP 说es
 *  esteuno, Noesesteuno组: 同组还Conuno `[WIP]` 时说成"含 WIP". 声音Versión说es卡面esteuno: 
 *  配音版着色, Sin声版弱化加虚线框.  */
export function followTitleMarks(group: FollowGroup, shown: FollowItem = group.primary): string {
  const marks: string[] = [];
  const mark = (edition: string, label: string) =>
    `<small class="javedition" data-follow-edition="${edition}">${label}</small>`;
  if (group.primary.variant_kind === 'wip') marks.push(mark('wip', 'WIP'));
  else if (group.has_wip) marks.push(mark('has-wip', 'Incluye WIP'));
  const version = text(group.primary.version);
  if (version) marks.push(mark('version', esc(version)));
  const audio = text(shown.audio);
  const label = audio === 'voiced' ? 'Versión doblada' : audio === 'silent' ? 'Ninguno声版' : '';
  if (label) marks.push(mark(audio, label));
  return marks.join('');
}

/** 另见站用站点Imagen标列出, 站名落EnImagen标 alt y徽章 title arriba; 没登记Imagen标站写站名. 
 *  "另见"相对卡面esteuno(`shown`)说: 卡面换成组dentro别站ese时, 主Entrada站才es另见.  */
export function followBadges(group: FollowGroup, shown: FollowItem = group.primary): string {
  const sites = new Map([group.primary, ...group.variants, ...group.duplicates]
    .filter((member) => member.provider !== shown.provider)
    .map((member) => [member.provider, member.provider_label || member.provider] as const));
  if (!sites.size) return '';
  const marks = [...sites].map(([provider, label]) => sourceIcon(provider, label) || `<span>${esc(label)}</span>`).join('');
  return `<span data-follow-seealso="" title="Ver también ${esc([...sites.values()].join(', '))}"><span data-follow-seealso-label="">Ver también</span> ${marks}</span>`;
}

/** "媒体no取得"eseuno句, Sin就es空串.  */
export function followMediaIssue(item: FollowItem, context: FollowContext): string {
  const error = text(item.media_error);
  if (error) return `MediosNo disponible: ${error}`;
  if (item.media_needs_credential && !context.credentials.has(item.provider)) {
    return item.playable ? 'ParcialMediosNo disponible: Necesario F95 Iniciar sesión会话解析' : 'MediosNo disponible: Necesario F95 Iniciar sesión会话解析';
  }
  return '';
}

/** 晚于此刻uno天以en laPublicarTiempo: 来源时钟或时区写错, 照实标出来, No当作正常最Nuevouno.  */
const FUTURE_SLACK_MS = 24 * 3600_000;
const isFuture = (iso: string, now: number): boolean => {
  const at = new Date(/[Zz]|[+-]\d\d:?\d\d$/.test(iso) ? iso : `${iso}Z`).getTime();
  return Number.isFinite(at) && at - now > FUTURE_SLACK_MS;
};

/** PublicarTiempotres段: 精度anterior缀, 按ver人所En时区写Tiempo, 晚于现EnEtiqueta. 来源Solo给相对Tiempo
 *  (`published_precision` Como `approximate`, 如"3 years ago"换算来)时Solo写到日y加"约", 
 *  时分es换算出来, 写出来就es假精度.  */
function whenParts(item: FollowItem, now: number) {
  const iso = text(item.published_at);
  if (!iso) return null;
  const approximate = item.published_precision === 'approximate';
  const full = localTime(iso);
  return {
    prefix: approximate ? 'Aprox. ' : '',
    full: approximate ? full.slice(0, 10) : full,
    suffix: isFuture(iso, now) ? ' · Más tarde que ahora' : '',
  };
}

/** PublicarTiempo, 按ver人所En时区显示; 来源没给就明说.  */
export function followWhen(item: FollowItem, now = Date.now()): string {
  const parts = whenParts(item, now);
  return parts ? `${parts.prefix}${parts.full}${parts.suffix}` : 'HoraNo disponible';
}

/** ListadentroTiempoSolo写到日: 今年去掉年, 往年Deja着. Pasar el ratón读得到 `followWhen` 完Completo写法.  */
export function followCompactWhen(item: FollowItem, now = Date.now()): string {
  const parts = whenParts(item, now);
  if (!parts) return 'HoraNo disponible';
  if (!/^\d{4}-/.test(parts.full)) return `${parts.prefix}${parts.full}${parts.suffix}`;
  const day = parts.full.startsWith(String(new Date(now).getFullYear())) ? parts.full.slice(5, 10) : parts.full.slice(0, 10);
  return `${parts.prefix}${day}${parts.suffix}`;
}

/* este次会话dentroya经回写过Imagen, `Entrada:媒体序号`. 回写Solo补空缺, 服务端本来就会忽略yaCon尺寸
   Entrada, pero每次pesado渲染都同uno批再发uno遍es白跑. 攒 800ms uno批, uno批至más 200 .  */
interface DimsEntry { item: number; width: number; height: number; media?: number }
const reported = new Set<string>();
let queue: DimsEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;

function flushDims() {
  timer = null;
  if (!queue.length) return;
  const entries = queue.splice(0, 200);
  /* 静predetermina: estees顺手学习, Noes用户动作; Solo读端 409  y 网络抖动都No该弹Sugerencia.  */
  (api('/api/follow/image-dims', { method: 'POST', body: JSON.stringify({ entries }) }) as Promise<unknown>)
    .catch(() => {});
  if (queue.length) timer = setTimeout(flushDims, 800);
}

/** Imagen片视ImagendentroSin尺寸卡面ImagenCargar完, 固Con尺寸回写给它主人(`/api/follow/image-dims`).  */
export function learnFollowDims(item: number, media: number | null, width: number, height: number): void {
  const key = `${item}:${media ?? ''}`;
  if (reported.has(key)) return;
  reported.add(key);
  queue.push(media === null ? { item, width, height } : { item, width, height, media });
  if (!timer) timer = setTimeout(flushDims, 800);
}
