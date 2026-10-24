/* 实体资料página顶en la资料卡yNuevas obras行(ADR-0031 No. 10c 步): Datos形状y纯函数. 
 *
 * `/api/entity` 由壳取, 连同esteunopáginaNuevas obrasuno起当 props 递进来; 写操作都由壳做成 `actions`
 * 递进来, 岛No自己拼Por favor求. aquíSolo服务端abajo发ese资料排成página面要画几段: 名字abajo面eseuno行, 
 * derecha边资料表, exterior链, exterior部入口 y 同艺人.  */
import { brandIcon, foldName, linkMarkUrl, officialLinkText } from '@peach/legacy/core';

import type { FeedNew } from '../feed-new/feed-new';

/** unoexterior链, 形状同 `/api/entity`  `links[]`.  */
export interface HeroLink {
  link_id?: number | null;
  link_kind?: string;
  clickable?: boolean;
  gone?: boolean;
  retired_year?: number | string | null;
  label?: string;
  hostname?: string;
  url?: string;
}

/** exterior部入口(`peach.entry_links`): `pill` 排进exterior链ese排最izquierda, `mark` 另起uno行印站点标识.  */
export interface HeroEntryLink {
  site: string;
  label: string;
  ordinal?: string;
  slot: string;
  mark?: string;
  url: string;
}

export interface HeroCostar {
  id: number;
  k: string;
  n?: number;
  rep?: number | null;
  has_image?: boolean;
  image_version?: string;
  has_avatar?: boolean;
  avatar_stand_in?: boolean;
  avatar_focus?: unknown;
}

/** Actrizpágina头derecha侧资料表(ADR-0069). 服务端Soloabajo发Con值项.  */
export interface HeroProfile {
  birth_date?: string;
  age?: number;
  height?: number;
  bust?: number;
  waist?: number;
  hip?: number;
  cup?: string;
  debut_date?: string;
  debut_title?: string;
  active?: { from?: string; to?: string; ongoing?: boolean };
  tags?: string[];
}

export interface HeroNameGroups {
  reading?: string;
  shown?: string[];
  total?: number;
  groups?: { label?: string; names: { name: string; reading?: string }[] }[];
}

/** 创作者名abajo关注来源(ADR-0096). `key` es关注página作者Clave, 没绑来源时es空串; `held` es
 *  关注dentro同名, etc.用户认esNoes同uno人ese几组.  */
export interface HeroFollow {
  key: string;
  n: number;
  providers: string[];
  avatar: string;
  avatar_fallback: string;
  held: { key: string; name: string; providers: string[]; n: number; links: string[] }[];
}

/** `/api/entity` dentro资料卡读到ese些字段.  */
export interface EntityHeroData {
  favorite?: boolean;
  company_profile?: Partial<Record<'legal_name' | 'founded' | 'launched' | 'country' | 'location' | 'operator' | 'parent' | 'group' | 'distributor', { value: string; source_url: string; evidence?: string }>>;
  identity_labels?: string[];
  external_refs?: { provider: string; external_kind: string; external_id: string }[];
  related_identities?: { id: number; kind: string; canonical_name: string; relation: string }[];
  id: number;
  canonical_name: string;
  aliases?: string[];
  display_aliases?: string[];
  user_aliases?: string[];
  asset_count: number;
  member_count?: number;
  labels?: unknown[];
  maker?: { name: string; id?: number } | null;
  agency?: { canonical_name: string; id?: number } | null;
  metadata?: { agency?: { name?: string } | null } | null;
  links?: HeroLink[];
  entry_links?: HeroEntryLink[];
  related_performers?: HeroCostar[];
  feed?: { following: boolean } | null;
  follow?: HeroFollow | null;
  profile?: HeroProfile | null;
  name_groups?: HeroNameGroups | null;
}

/** 写操作y站interiorSaltar a都归壳.  */
export interface EntityHeroActions {
  /** 站interiorSaltar a, 走遗Deja路由同uno入口.  */
  openEntity(kind: string, name: string): void;
  /** este名字换成统称: Confirmar, 写回, 回执ypesado进esteunopágina都En壳dentro.  */
  chooseName(name: string): void;
  /** Abrir"添加别名"弹层.  */
  addAlias(): void;
  /** 订阅或Cancelar订阅Nuevas obras. Fallo时壳ya发过Fallo回执, aquí会收到抛出Error.  */
  follow(on: boolean): Promise<void>;
  /** 刚订arriba: etc.服务端esteuno轮拉取跑完, 再Nuevas obraseseuno行pesado取uno遍.  */
  refreshFeedAfterCheck(): void;
  /** Nuevas obras卡en la"No想ver""标Comoyaver过".  */
  feedAction(id: number, action: string): Promise<void>;
  /** 换完Avatar: pesado进esteunopágina, Avatar索引En服务端ya经换过.  */
  avatarPicked(): void;
  /** veresteuno名abajo来源Actualizar: 本人切到esteunopáginaEn线视Imagen, 别作者Clave去关注páginaSolovereseuno.  */
  openFollowAuthor(key: string): void;
  /** "es同uno人": 同名ese组关注作者绑到este名abajo. Fallo时壳ya发过Fallo回执.  */
  confirmFollowAuthor(key: string, name: string): Promise<void>;
}

/** 仍由遗Deja层拼ese几段 HTML ycontinuar线.  */
export interface EntityHeroHelpers {
  /** grandeeseImagen(`entityFaceImg`): 取No到就es空串, primero字母垫底.  */
  portraitImg(): string;
  /** 横滚行continuararriba拖动y滚轮(`wireDrag`).  */
  wireScroller(row: Element | null): void;
  /** Nuevas obraseseuno行: 拖动, 滚轮, 按Configuracióncontinuar自动滚动.  */
  wireFeedRow(row: Element | null): void;
  /** 操作回执(`actionReceipt`), 给 `undo` 就带unoDeshacerClave.  */
  receipt(message: string, options?: { undo?: () => Promise<void> }): void;
}

export interface EntityHeroProps {
  kind: string;
  /** 地址栏en laese名字: primero字母垫底取它,  y 骨架同uno字.  */
  name: string;
  entity: EntityHeroData;
  /** esteunopáginaNuevas obras(`feed-new/feed-new.ts` 取回来Entraday壳拼bienCompleto行 HTML).  */
  feedNew: FeedNew | null;
  /** 壳En `#index` dentroDeja给Nuevas obraseseuno行 `section.feednew[data-feed-new]`.  */
  feedHost: HTMLElement | null;
  /** esteunopáginaesNoes JAV 语境(`entityJavLayout`).  */
  jav: boolean;
  actions: EntityHeroActions;
  helpers: EntityHeroHelpers;
}

export const FACT_TAGS_SHOWN = 4;

/** 公司página(Sello, Agencia)门面es它自己标识, 方框; 人es圆框, derechaabajo角Con换Avatar入口.  */
export const isCompany = (kind: string) => kind === 'studio' || kind === 'agency';
export const isPeople = (kind: string) => kind === 'performer' || kind === 'creator';

export const entityFeedTip = (on: boolean) => on
  ? 'Suscrito a nuevas obras, 点击Cancelar suscripción'
  : 'Suscribirse a nuevas obras';

/** este实体名abajoyaCon写法, 统称排No.uno.  */
export function nameChoices(entity: EntityHeroData): string[] {
  return [entity.canonical_name, ...(entity.aliases || [])]
    .filter((option, index, all) => option && all.indexOf(option) === index);
}

/** Agencia: Con实体时给去处, SoloCon `metadata.agency` 时Solo写名字(esees采到Original文, 还Sin对应身).  */
export function agencyOf(entity: EntityHeroData): { name: string; linked: boolean; id?: number } | null {
  if (entity.agency) return { name: entity.agency.canonical_name, linked: true, id: entity.agency.id };
  const name = entity.metadata?.agency?.name || '';
  return name ? { name, linked: false } : null;
}

/** Actrizpáginaexterior链uno律es纯Imagen标, 名字SoloEn title  y 读屏文字dentro. 链到她所属Agenciaese(NAX 
 *  label 就es `New Actor eXperience`)写"<Agencia> Oficial资料": Imagen标verNo出esees她Oficial档案página.  */
export function performerLinkName(link: HeroLink, agency: string): string {
  const text = officialLinkText(link, 'performer'), home = foldName(agency);
  const own = home && [link.label, text].map(foldName).some((said) => said && (home.includes(said) || said.includes(home)));
  return own ? `${agency} OficialDetalles` : (text || link.label || '');
}

/** 链continuaranteriorese圆标: 常见社媒走雪碧Imagenen lamarca字形, 其余取服务端合成站点圆标, 取No到露出地球.  */
export type LinkMark = { brand: string } | { site: string } | { globe: true };

export type LinkView =
  | { type: 'icon'; url: string; title: string; mark: LinkMark }
  | { type: 'gone'; title: string }
  | { type: 'private'; label: string; sources?: string[] }
  | { type: 'url'; url: string; title: string; text: string; mark: LinkMark };

const siteMark = (link: HeroLink): LinkMark => ({ site: linkMarkUrl(link) });

/** exterior链eseuno排: exterior部入口en la `pill` 排最anterior, 其posterioresDatosBibliotecaen la链continuar. 
 *
 *  社媒收成纯Imagen标, 公司página官网保Deja名字; Actrizpágina连官网也esImagen标, derecha边másuno资料表, 名字eseuno栏
 *  放NoSiguiente排带字按钮. ya隐退ActrizInválido链continuarDejaEnOriginal, Nopuede点, 也No取站点Imagen标.  */
export function heroLinks(entity: EntityHeroData, kind: string): LinkView[] {
  const agency = agencyOf(entity)?.name || '';
  const pills: LinkView[] = (entity.entry_links || []).filter((x) => x.slot === 'pill')
    .map((x) => ({ type: 'icon', url: x.url, title: x.label, mark: { brand: x.mark || '' } }));
  const names = [entity.canonical_name, ...(entity.aliases || [])];
  const links = (entity.links || []).map((x): LinkView => {
    if (x.gone) {
      const why = x.retired_year ? `Ya于 ${x.retired_year} Año隐退` : '链continuarYaInválido';
      return { type: 'gone', title: `${performerLinkName(x, agency)} · ${why}` };
    }
    const url = x.url || '';
    if (!(x.clickable && /^https?:\/\//i.test(url))) return { type: 'private', label: x.label || x.hostname || 'yaRegistro' };
    if (isPeople(kind) && x.link_kind !== 'social') {
      return { type: 'icon', url, title: performerLinkName(x, agency), mark: siteMark(x) };
    }
    if (x.link_kind === 'social') {
      const brand = brandIcon(url);
      return { type: 'icon', url, title: x.label || '', mark: brand ? { brand } : siteMark(x) };
    }
    return { type: 'url', url, title: x.label || '', text: officialLinkText(x, kind, names), mark: siteMark(x) };
  });
  return [...pills, ...foldPrivate(links)];
}

/** No公开来源点No开, Soloes"记过este么uno处": 两处以arriba收成排Enúltimo尾uno"N No公开来源", 
 *  各处名字进 title. carpetaEnImagen标en proceso间uno处占unoCompleto行, 会uno排Imagen标exterior链切成bien几段.  */
function foldPrivate(links: LinkView[]): LinkView[] {
  const hidden = links.filter((link): link is Extract<LinkView, { type: 'private' }> => link.type === 'private');
  if (hidden.length < 2) return links;
  return [
    ...links.filter((link) => link.type !== 'private'),
    { type: 'private', label: `${hidden.length.toLocaleString()} NoPúblicoFuente`, sources: hidden.map((link) => link.label) },
  ];
}

/** ver片eseuno行: 站点自己横向标识.  */
export const entryMarks = (entity: EntityHeroData) => (entity.entry_links || []).filter((x) => x.slot === 'mark');

export interface FactRow {
  glyph: string;
  label: string;
  /** 行interior几段: `num` etc.ancho数字, `sub` 次级字色.  */
  parts: { text: string; tone: 'num' | 'sub' | 'plain' }[];
  /** 出道片名常Concuatrocincodiez字, 单行截断, Todo名放En title dentro.  */
  clip?: string | undefined;
  tags?: string[] | undefined;
}

/** 公司资料每格表达Independiente事实; SinDatos格子No显示.  */
export function companyFactRows(profile: EntityHeroData['company_profile']): FactRow[] {
  const fields = [
    ['legal_name', '公司Nombre', 'briefcase'], ['founded', 'Fundación de la empresa', 'calendar'],
    ['launched', 'Inicio de marca', 'flag'], ['country', 'País/Región', 'globe'],
    ['location', 'Ubicación', 'globe'], ['operator', 'Empresa operadora', 'briefcase'], ['parent', 'Empresa matriz', 'briefcase'],
    ['group', 'Grupo al que pertenece', 'briefcase'], ['distributor', 'Distribuidora', 'film'],
  ] as const;
  return fields.flatMap(([key, label, glyph]) => profile?.[key]?.value?.trim()
    ? [{ label, glyph, parts: [{ text: profile[key]!.value, tone: 'plain' as const }] }]
    : []);
}

/** 资料表cinco项: 生日, 身材, 出道, 生涯, Etiqueta. Con哪项画哪项. 仍En活跃写"至今".  */
export function factRows(p: HeroProfile | null | undefined): FactRow[] {
  if (!p) return [];
  const rows: FactRow[] = [];
  // 年龄由服务端按生日算, y生日成对abajo发; Solo拿到生日时eseuno行Solo写生日. 
  if (p.birth_date) rows.push({ glyph: 'cake', label: 'Cumpleaños', parts: [
    { text: p.birth_date, tone: 'num' },
    ...(Number.isFinite(p.age) ? [{ text: `· ${p.age} 岁`, tone: 'sub' as const }] : [])] });
  const size = ([['T', p.height], ['B', p.bust], ['W', p.waist], ['H', p.hip]] as const)
    .filter(([, value]) => value).map(([letter, value]) => `${letter}${value}`).join(' · ');
  const cup = p.cup ? `${size ? '· ' : ''}${p.cup} 罩杯` : '';
  if (size || cup) rows.push({ glyph: 'ruler', label: 'Cuerpo/Físico', parts: [
    ...(size ? [{ text: size, tone: 'num' as const }] : []), ...(cup ? [{ text: cup, tone: 'sub' as const }] : [])] });
  if (p.debut_date || p.debut_title) rows.push({ glyph: 'flag', label: 'Debut', clip: p.debut_title || undefined, parts: [
    ...(p.debut_date ? [{ text: p.debut_date, tone: 'num' as const }] : []),
    ...(p.debut_title ? [{ text: p.debut_title, tone: 'sub' as const }] : [])] });
  const active = p.active || {};
  if (active.from) rows.push({ glyph: 'calendar-range', label: 'Carrera', parts: [{
    text: `${active.from}${active.ongoing ? ' – 至今' : active.to ? ` – ${active.to}` : ''}`, tone: 'num' }] });
  if ((p.tags || []).length) rows.push({ glyph: 'tags', label: 'Etiqueta', parts: [], tags: p.tags });
  return rows;
}

/** 公司página名字abajo面eseuno行先列几别名, 余abajo收进"+N".  */
export const COMPANY_ALIASES_SHOWN = 3;

/** Etiquetaeseuno格Solo列anterior几, 余abajo收进"+N"; Solomás出uno时直continuar列出来, "+1" y eseunoEtiquetauno样ancho. 
 *  公司别名按 `COMPANY_ALIASES_SHOWN` 用同unoRegla.  */
export function shownTags(tags: string[], limit = FACT_TAGS_SHOWN): { shown: string[]; rest: number } {
  const cut = tags.length > limit + 1 ? limit : tags.length;
  return { shown: tags.slice(0, cut), rest: tags.length - cut };
}

/** 名字abajo面eseuno行别名: 读音En最anterior, continuar着esanterior几名义, 余abajo收进"+N".  */
export function nameLine(groups: HeroNameGroups | null | undefined): { names: string[]; rest: number; total: number } | null {
  if (!groups) return null;
  const shown = groups.shown || [];
  const names = [groups.reading || '', ...shown].filter(Boolean);
  const rest = (groups.total || 0) - shown.length;
  return names.length || rest > 0 ? { names, rest, total: groups.total || 0 } : null;
}
