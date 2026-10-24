/* 卡片, AvataryPortadaese几段 HTML: 壳拼 HTML  y 各岛 `dangerouslySetInnerHTML` 读同uno. 
 *
 * 吐字符串而Noes React 元素: este些 `<img>` 落进página面以posterior还要被别人Original地改. 兜底链
 * (`./image-fallback.ts`)取No到Imagen时换 `src`, 摘掉或换成primero字母, 取景(`./framing.ts`)En
 * Cargarposterior往Imagenarriba写interior联样y类名. React verNo见este些改动: 节点归它管, pesado画uno次就冲掉取景, 
 * 被兜底链摘掉节点再交给它Actualizar还会报错.  */
import { esc, firstGrapheme } from '@peach/legacy/core';

import { javImageKind } from '../jav-artwork';
import { imageFallbackAttrs } from './image-fallback';
import { representativeOf } from './representatives';

/** 人脸取景: `axis`/`pct` es挪eseunomedio, `box` es放grandeeseunomedio(`/api/entity`  `avatar_focus`).  */
export interface FaceFocus {
  axis?: string;
  pct?: number;
  box?: { cx: number; cy: number; faceW: number; imgW: number; imgH: number } | null;
}

/** Avatar引用: 实体 id, ConSin实体Imagen, 取景. 两Versión号拼进地址 `&v=`, 见 `withVersion`. 
 *  `avatar_stand_in` es服务端说"Obra representativaImagenNoes本人"(`attach_avatar_availability`).  */
export interface FaceRef {
  id?: number | null; has_image?: boolean; image_version?: string; logo_version?: string; avatar_focus?: unknown;
  avatar_stand_in?: boolean;
  rep?: number | null;
  has_avatar?: boolean;
  identity_categories?: string[];
  source_avatar_url?: string;
  source_avatar_fallbacks?: string[];
}

/** Obra representativaImagen替账号顶着圆框时, Pasar el ratóny读屏读到ese句.  */
export const STAND_IN_TITLE = 'Imagen representativa, no es la persona';

/* Original地ReemplazarImagen(实体Imagen, Portada, 标识)地址都带服务端abajo发contenidoVersión(Archivo修改Tiempo): 换Avatar, 
   补alto清Portada, 换标识都覆盖同unoArchivo, 地址No跟着变话, 同unopáginadentroExplorar dispositivo直continuar复用interior存dentroese
   antiguoImagen, 要Actualizar才ver得到Nuevo.  */
export const withVersion = (url: string, version: string | null | undefined): string =>
  version ? `${url}&v=${encodeURIComponent(version)}` : url;

/** Portada地址. `thumb` es派生档, `upgradeCover` 它摘掉换Original件, Versión号DejaEnposterior面.  */
export const coverUrl = (item: { code?: string | null; cover_key?: string; cover_version?: string }, thumb = false): string =>
  withVersion(`/cover?code=${encodeURIComponent(item.cover_key || item.code || '')}${thumb ? '&thumb=1' : ''}`, item.cover_version);

/** Sello标识地址, `variant` 跟着Ubicación走: grande要字标, pequeño要方形Imagen标.  */
export const logoUrl = (studio: string, variant: string, version?: string | null): string =>
  withVersion(`/logo?studio=${encodeURIComponent(studio)}&variant=${variant}`, version);

const focusOf = (value: unknown): FaceFocus | null =>
  value && typeof value === 'object' ? value as FaceFocus : null;

/** "Actriz"Solo用于Código JAVLanzamiento物. 素人, 创作者自制 y 网红contenidoen la出镜者es艺人, 套arriba JAV 行业
 *  称谓既No准确也会 y 创作者身混淆. 判据由posterior端 `is_jav` 给.  */
export function performerLabel(item: { is_jav?: boolean } | null | undefined): string {
  return item && item.is_jav ? 'Actriz' : 'Actriz';
}

/* 实体ese脸: Normalizar实体Imagen优先, 取No到退到Obra representativaAvatar, 两样都取No到就uno `<img>`
   都No出. cuatroUbicación(顶栏圆Avatar, 卡片署名, 共演者, 资料páginagrande)共用esteuno. 

   SinCondición出Imagen, etc. 404 再Imagen摘掉代价es: unoObrasDetallespágina 9 este样 404(1 Sello
   实体Imagen, 4 人物实体Imagen, 4 Avatar), primeropáginaTeléfono视口 2 ; `/entity-image` y
   `/avatar`  404 都No带缓存头, 每次pesado绘再打unoCompleto轮. `hasImage` 由 `/api/tops`, 
   `/api/items`, `/api/item`, `/api/entity` 随资料abajo发, 判据 y 取Imagen同uno函数. 

   `rep` esteuno侧No带标志: 调用方传进来就该es"取得到Obra representativa"(顶栏En入Obra representativa表时
   ya经筛过, 见 `./representatives.ts`). `/avatar` es按需生成, 还没裁过pero印相还En也算
   取得到—ese点unoabajo就Con路No能uno起关掉. 

   兜底链最posterioruno环必须真 `<img>` 拿掉(`data-drop="self"`): Deja着取No到Imagen
   `<img>`, `:has(img)` 仍然匹配, primero字母垫底回No来, Explorar dispositivo还会 alt 画出来. 

   `thumb` 要es实体Imagen缩到largo边 640 eseuno. 资料página仍取Original件—esedentro就es要ver清. 

   `version` es服务端随 `has_image` abajo发 `image_version`, `logoVersion` es `logo_version`. 

   `standIn` es服务端 `avatar_stand_in`: 账号Sin本人身依据, 圆框dentroeseObra representativaImagenSoloes
   替它占. 显示Obra representativaAvatar时Imagenarriba带 `title` y `aria-label` Descripciónesteuno点; 实体ImagenNo带, 
   取ImagenFallo退到Obra representativa时再补arriba.  */
export function entityFaceImg({
  kind = 'performer', id = null, hasImage = false, version = '', rep = null, mark = null, logo = '',
  logoVersion = '', logoVariant = 'logo', alt = '', lazy = true, style = '', dropStyle = false, focus = null, thumb = false,
  standIn = false,
}: {
  kind?: string; id?: number | null | undefined; hasImage?: boolean | undefined; version?: string | null | undefined;
  rep?: number | null | undefined; mark?: number | null | undefined; logo?: string;
  logoVersion?: string | null | undefined; logoVariant?: string; alt?: string;
  lazy?: boolean; style?: string; dropStyle?: boolean; focus?: unknown; thumb?: boolean;
  standIn?: boolean | undefined;
} = {}): string {
  const useEntity = !!(id && hasImage);
  const entitySrc = useEntity ? withVersion(`/entity-image?kind=${kind}&id=${id}${thumb ? '&thumb=1' : ''}`, version) : '';
  // `rep` 由服务端 has_avatar 决定ConSin值, Sin就No出esteuno环. 
  const avatarSrc = rep ? `/avatar?id=${rep}` : '';
  /* 公司门面es它自己标识, NoesObras截Imagen—esees某部片Imagen, 说es别人事. 
     Sello走 `/logo`: `logo` SoloEn调用方问过 `has_logo` 时才Con值. 变体跟着Ubicación走, 
     grande要字标, pequeño要方形Imagen标. AgenciaSin标识Archivo, 走官网ese链continuar站点圆标 `mark`.  */
  const useLogo = !!logo;
  const src = useLogo ? logoUrl(logo, logoVariant, logoVersion)
    : (entitySrc || avatarSrc || (mark ? `/link-mark?id=${mark}` : ''));
  if (!src) return '';
  const fallbacks = useLogo ? [entitySrc, avatarSrc].filter(Boolean)
    : (useEntity && avatarSrc ? [avatarSrc] : []);
  // 人脸取景es按实体Imagen算出来, 回落Imagenes另uno照片, 脸NoEn同unoUbicación: Solo贴给No.uno环. 
  const framed = useEntity && !useLogo;
  const faceBox = framed ? faceBoxAttrs(focus) : '';
  /* 挪 y 放grandees同uno sidecar 两medio, aquí替调用点挪eseunomedio补arriba: 给 `focus` 却
     没给 `style` , 按同uno换算自己算. 分开传时漏掉 `style` No会报错也verNo出来
     —Imagen照样出, Soloes几何居en proceso, 脸落EnImagen顶en laese些正bien被裁掉脑袋.  */
  const framedStyle = style || facePos(focus);
  /* 贴脸框就uno定要能撤 style: 放grandees avatarFrame 写进 img interior联 style , 回落时
     No撤, ese几cien分比会按AnteriorImagen尺寸套Enesteunoarriba. 调用点No必记得开este开关—
     忘开代价espágina面Anterior明显错Imagen, 而它SoloEn回落发生时才现形.  */
  /* `decoding="async"` 让解码离开主线程: uno屏几diezImagen同时Llegar时, Sincronizar解码滚动
      y 点击uno起压住, 而este些Imagenuno都No参yprimero屏排版—框尺寸由 CSS 定死.  */
  const note = standIn && src === avatarSrc ? ` title="${STAND_IN_TITLE}" aria-label="${STAND_IN_TITLE}"` : '';
  const fallbackNote = standIn && fallbacks.includes(avatarSrc)
    ? ` data-fallback-note-src="${esc(avatarSrc)}" data-fallback-note="${STAND_IN_TITLE}"` : '';
  return `<img src="${src}" width="128" height="128" alt="${alt}"${note}${fallbackNote}${lazy ? ' loading="lazy"' : ''} decoding="async"${framed ? framedStyle : ''} `
    + `${faceBox}${imageFallbackAttrs({
      dropStyle: (dropStyle || !!faceBox || !!framedStyle) && framed,
      fallbacks,
    })}>`;
}

/* Avatarinterior层: 先垫primero字母, 再叠真实Imagen. 

   `has_image` 缺席按"没Imagen"Procesar,  y  entityFaceImg Predeterminado值uno致: 每uno调用点
   ref 都由服务端带着标志abajo发(卡片署名, 索引página, 口味榜, 复核卡片, InmersivoModo), 
   ancho容缺席Solo会让Siguiente忘挂标志端点悄悄退回"SinCondición出Imagen, etc. 404 再摘". 

   取景反过来: No传就从 ref arriba取. 它 y  `has_image` 出自同unoabajo发, 分开传代价es
   siete调用点要各记uno次, 而漏掉No报错也No掉Imagen, Soloes几何居en proceso—este错SoloCon对着página面
   unover才发现得. 公司eseuno格要es"明确No取景", 传 `null` 覆盖掉.  */
export function avatarInner(name: string, ref: FaceRef | null | undefined, repId: number | null | undefined,
  kind = 'performer', markId: number | null = null, logoName = '', logoVariant = 'icon',
  focus: unknown = undefined, thumb = false): string {
  // esteuno层grandemásespequeño圆框 y estrecho格子, Sello标识Enesedentro要方形Imagen标而Noes横着字标; 索引página
  // Sellogrande格es同uno模板en la例exterior, 由调用方点名要 `large`. 
  const hint = focus === undefined ? (ref && ref.avatar_focus) || null : focus;
  const sourceFace = !ref?.has_image && !logoName && ref?.source_avatar_url
    ? `<img src="${esc(ref.source_avatar_url)}" width="128" height="128" alt="" loading="lazy" decoding="async" ${
      imageFallbackAttrs({ fallbacks: ref.source_avatar_fallbacks || [] })}>` : '';
  return `<span class="ini">${esc(firstGrapheme(name))}</span>`
    + (sourceFace || entityFaceImg({
      kind, id: ref && ref.id, hasImage: !!(ref && ref.has_image), version: ref && ref.image_version,
      rep: ref?.has_avatar && ref.rep ? ref.rep : repId, mark: markId,
      logo: logoName, logoVersion: ref && ref.logo_version, logoVariant, focus: hint, thumb,
      standIn: !!(ref && ref.avatar_stand_in),
    }));
}

/** 卡片署名, Mix 叠放Avatar, Inmersivo作者eseuno格: `avatarInner` 读取引用或顶栏Obra representativa表. `kind` Como空es
 *  "Sin署名人", No退Obra representativa, 按Actrizeseuno档出primero字母.  */
export function entityAvatar(name: string, ref: FaceRef | null | undefined, kind: string): string {
  return avatarInner(name, ref, kind ? representativeOf(name) : null, kind || 'performer');
}

/* 人脸取景: 资料página圆框按检出人脸en proceso心取景(/api/entity  avatar_focus). 
   没检出或没算过返回空串维持几何居en proceso; 换回落Imagen时必须撤掉—esees另uno照片, 
   脸NoEn同unoUbicación, 见资料卡grandeeseImagen `data-drop-style`. 

   换算SoloConesteuno. 资料página它写进 img  style; 索引páginagrandeImagen版要它交给圆框en la
   CSS 变量—eseen la img 由共用 avatarInner 拼, 版能改容DispositivoSoloCon圆框.  */
export function faceOrigin(value: unknown): string {
  const f = focusOf(value);
  return f && f.axis === 'x' ? `${f.pct}% 50%`
    : f && f.axis === 'y' ? `50% ${f.pct}%`
      : '';
}

export function facePos(value: unknown): string {
  const origin = faceOrigin(value);
  return origin ? ` style="object-position:${origin}"` : '';
}

/* 人脸放grande: 脸框像素尺寸交给página面, 倍数EnImagenCargarposterior按框真实尺寸算. 

   Solo挪解决No"脸太pequeño"—cover Zoom由框 y ImagenRelación定死, 脸EnImagendentro占másmenos, En框dentro
   就占másmenos. 539 dentroCon 29 esTodo身站姿照, 脸落EnImagenarribamedio截unopequeñodentro, 挪到正en proceso依antiguo
   esuno认No出es谁头. 放grande倍数由 `./face-frame.ts` carpetaEn"够ver清""Noarriba采样"
   "No切头"tres之间, 服务端算No: 它No知道este框Conmásgrande, este屏幕几倍像素. 

   属性而Noes style: 倍数得etc.Imagen y 框都Llegar才算得出来,  y Portada `data-cx`/`coverAnchor`
   同uno路. 缺 `box`  sidecar(补字段之anterior算)No贴属性, ese些Imagen照antiguoSolo挪No放grande. 

   cinco数挤Enuno属性dentro, esComo让回落Solo需要摘uno样东西: 脸框SoloDescripciónNo.uno环ese实体Imagen, 
   换到 `/avatar` ese就Completo作废, 见 `./image-fallback.ts`  advanceImageFallback.  */
export function faceBoxAttrs(value: unknown): string {
  const b = focusOf(value)?.box;
  if (!b) return '';
  return ` data-facebox="${[b.cx, b.cy, b.faceW, b.imgW, b.imgH].map(Number).join(' ')}"`;
}

/** PortadadentroeseImagen要字段.  */
export interface CoverItem {
  id?: number;
  code?: string;
  cover_key?: string;
  is_jav?: boolean;
  has_cover?: boolean;
  cover_version?: string;
  has_thumb?: boolean;
  has_local_poster?: boolean;
  cover_frame?: { cx?: number | null; cy?: number | null; layout?: string } | null;
  poster_box?: { x0?: number; y0?: number; x1?: number; y1?: number; px?: number[]; method?: string } | null;
  [field: string]: unknown;
}

/* OficialPortadaese `<img>`. 人脸UbicaciónOriginal样交给página面, 锚点由 `coverAnchor` EnCargarposterior算: 哪轴被裁, 
   要推más远, SoloCon同时拿到Imagen片 y 容DispositivoRelación才知道. 人物EnImagenen laUbicación差别很grande, 写死锚点会
   uno部分Obras裁掉abajo巴或Completo切出画exterior; 取No到人脸就退回固定取景.  */
export function coverImage(item: CoverItem, layout: 'big' | 'small', eager = false): string {
  const src = coverUrl(item, true);
  const wide = /ブルーレイ|blu[\s-]?ray/i.test(String(item.title || item.display_title || item.name || ''));
  const f = item.cover_frame || {};
  const still = item.poster_box?.method !== 'manual' && (f.layout === 'still'
    || /^(IENEE|IENFE|SDHS)-/i.test(String(item.code || ''))
    || /(?:[|\[|\(|()\s*(?:[48]K\s*)?VR\s*(?:]|\]|\)|))/i.test(String(item.title || item.display_title || item.name || '')));
  const faceY = f.cy == null ? null : still ? Math.min(1, Math.max(0, f.cy)) : Math.min(0.6, Math.max(0.05, f.cy));
  const face = [f.cx != null ? ` data-cx="${f.cx}"` : '',
    faceY != null ? ` data-cy="${faceY}"` : ''].join('');
  /* 正封eseuno取景框, 源Imagen像素坐标加源Imagen尺寸, 由 `posterPanel` EnCargarposterior换算成
     cien分比. `map(Number)` 既es校验也es转义: 进到属性en launo定es数字.  */
  const pb = item.poster_box;
  const box = pb ? ` data-posterbox="${[pb.x0, (pb.px || [])[0], (pb.px || [])[1], pb.y0, pb.x1, pb.y1].map(Number).join(' ')}"` : '';
  // pequeñoImagenverCompleto(含剧照拼贴), grandeImagenSolo取derecha侧正封. 
  return `<img class="poster cover ${layout === 'small' ? 'whole' : 'front'}" src="${src}"
    width="640" height="360" alt="" loading="${eager ? 'eager' : 'lazy'}" data-cover-code="${esc(item.code || '')}"${wide ? ' data-wide-sleeve="1"' : ''}${still ? ' data-cover-layout="still"' : ''}${face}${box} data-drop="self">`;
}

/** Portada格两Imagen: Oficial封套(取景链continuar管)或Vista previaImagen. 空串esesteunoSinpuede用Imagen.  */
export type ArtworkKind = 'cover' | 'thumb' | '';

export interface Artwork {
  kind: ArtworkKind;
  html: string;
}

const NO_ARTWORK: Artwork = { kind: '', html: '' };

/** Código JAVObrasPortada: 按"Portada predeterminada JAV"取Oficial封套或Vista previaImagen, 两来源都挂En元素arriba, 
 *  Configuraciónuno换 `syncJavImages` Original地换Imagen. 取景Datos跟着元素走, 从Vista previaImagen切回Portada时还找得到框.  */
export function javArtwork(item: CoverItem, layout: 'big' | 'small', eager: boolean, javImage: unknown): Artwork {
  const kind = javImageKind(item, javImage);
  if (!kind) return NO_ARTWORK;
  const cover = item.has_cover && item.code ? coverUrl(item, true) : '';
  const thumb = item.has_thumb || item.has_local_poster ? `/poster?id=${item.id}&c=4` : '';
  const coverMarkup = coverImage(item, layout, eager);
  const frame = (coverMarkup.match(/ data-(?:c[xy]|posterbox)="[^"]*"/g) || []).join('');
  const image = kind === 'cover'
    ? coverMarkup
    : `<img class="poster" src="${thumb}" width="640" height="360" alt="" loading="${eager ? 'eager' : 'lazy'}"${frame}>`;
  return {
    kind: kind === 'cover' ? 'cover' : 'thumb',
    html: image.replace('<img ', `<img data-jav-image="${item.id}" data-jav-cover="${esc(cover)}" data-jav-thumb="${esc(thumb)}" data-jav-image-layout="${layout}" `),
  };
}

/** unoObras卡Portada. Código JAVObras走arriba面ese; 关注来源Entrada用来源自己缩略Imagen; 其余取本地
 *  Vista previa格. `size` esesteuno屏grandeImagen/pequeñoImagen, Solo施加给Código JAVObras.  */
export function cardArtwork(item: CoverItem & { follow_thumb_url?: string | null }, size: 'big' | 'small',
  eager: boolean, javImage: unknown): Artwork {
  if (item.is_jav) return javArtwork(item, size, eager, javImage);
  if (item.follow_thumb_url) {
    return {
      kind: 'thumb',
      html: `<img class="poster" src="${esc(item.follow_thumb_url)}" width="640" height="360" alt="" loading="${eager ? 'eager' : 'lazy'}" referrerpolicy="no-referrer">`,
    };
  }
  return mixFace(item, size, eager, javImage);
}

/** Mix unoImagen, ReproducirCola每uno行pequeñoImagen也es它: Código JAVObras走封套链, 其余取本地Vista previa格, 同uno
 *  En两处largo得uno样. `size` Solo施加给Código JAVObras.  */
export function mixFace(item: CoverItem, size: 'big' | 'small', eager: boolean, javImage: unknown): Artwork {
  if (item.is_jav) return javArtwork(item, size, eager, javImage);
  if (item.has_cover && item.cover_key) return { kind: 'cover', html: coverImage(item, size, eager) };
  if (!item.has_thumb && !item.has_local_poster) return NO_ARTWORK;
  return { kind: 'thumb', html: `<img class="poster" src="/poster?id=${item.id}&c=4" width="640" height="360" alt="" loading="${eager ? 'eager' : 'lazy'}">` };
}

/** ReproducirColauno行pequeñoImagen: Mix Imagen按pequeñoImagen取, Sinpuede用Imagen就写"Sin vista previa"占住eseuno格.  */
export function queueThumbHtml(item: CoverItem, javImage: unknown): string {
  return mixFace(item, 'small', false, javImage).html || '<span class="nopic">Sin vista previa</span>';
}

/* Detalles开场给ReproducirDispositivo海报: video.js 脚本还EnDescargar, 流源还没continuararriba时, Imagen先给本地
   Portada, NoDejauno黑. 选哪y卡片同uno判据, Código JAVObras跟随"Portada predeterminada JAV"Configuración—
   Oficial封套或Vista previaImagen; 其它媒体退到本地Vista previa格. 返回空串表示esteSinpuede用本地Imagen, 
   ReproducirDispositivo照antiguo从黑场Empezar.  */
export function detailPosterUrl(item: CoverItem, javImage: unknown): string {
  const thumb = item.has_thumb || item.has_local_poster ? `/poster?id=${item.id}&c=4` : '';
  if (!item.is_jav) return item.has_cover && item.cover_key ? coverUrl(item) : thumb;
  return javImageKind(item, javImage) === 'cover'
    ? coverUrl(item) : thumb;
}

/** 卡片署名要字段.  */
export interface IdentityItem {
  is_jav?: boolean;
  creator?: string;
  performers?: string[];
  performer_entities?: (FaceRef | null)[];
  performer_total?: number;
  creator_entity?: FaceRef | null;
  entity_refs?: Partial<Record<'performer' | 'creator' | 'studio' | 'series', FaceRef[]>>;
  studio?: string;
  code?: string;
  tags?: string[];
}

/* 卡片署名落到哪uno身arriba. Obras卡, 版次Cola y "Continuar viendo"必须用同uno推导—各算各
   迟早会En同名 creator/performer ese 35 组arriba分叉, 同unoObrasEn两处指向两实体. 

   Código JAVantiguo投影常Actriz罗马字同时塞进 `asset.creator`. Normalizar performer 实体ya经本地化时, 
   No能再让antiguo扁平字段抢走卡片署名 y 链continuar; 非Código JAV创作者Obras仍优先 creator. 

   共演Obras用AvatarSugerenciamás人, pero文字Solo保DejaPrimero, 再给Total人数. 两largo名字加Metadatos
   会En普通卡片dentro折成tres行; "Primera persona + N más"仍能Descripción身y规模.  */
export function cardIdentity(item: IdentityItem): {
  kind: '' | 'creator' | 'performer'; name: string; coStarred: boolean; performers: string[];
  refs: (FaceRef | null)[]; total: number;
} {
  const performers = item.performers || [];
  const refs = item.performer_entities ?? item.entity_refs?.performer ?? [];
  const performer = performers[0] || '';
  const primaryCreator = item.is_jav && performer ? '' : item.creator || '';
  const kind = primaryCreator ? 'creator' : performer ? 'performer' : '';
  return {
    kind, name: primaryCreator || performer || 'Sin asignar',
    coStarred: performers.length > 1 && !primaryCreator, performers, refs,
    total: item.performer_total || performers.length,
  };
}

/* ReproducirColauno行Avatar. Completo行本身就esuno <button>, dentro面再嵌 <button> 会被Explorar dispositivo就地拆散, 
   Avatar y Título会被甩到行exterior面去, 所以aquíuno律出 `<span>`, Nopuede点. 

   Avatar y 名字必须落到同uno身. 各自挑 kind(Avatar先ver performer, 名字先ver
   creator)时, 同名 creator/performer Repetir实体(DatosBibliotecadentroCon 35 组)会uno跳
   `/performers/x`, 另uno跳 `/creators/x`, 同uno卡arriba两入口去两地方.  */
export function queueAvatarHtml(item: IdentityItem): string {
  const { kind, name, coStarred, performers, refs } = cardIdentity(item);
  if (coStarred) {
    return `<div class="mavstack">${performers.slice(0, 5)
      .map((nm, i) => `<span class="mav">${avatarInner(nm, refs[i], representativeOf(nm))}</span>`)
      .join('')}</div>`;
  }
  const ref = kind === 'performer' ? refs[0] : item.creator_entity ?? item.entity_refs?.creator?.[0];
  return `<span class="mav">${avatarInner(name, ref, kind ? representativeOf(name) : null, kind || 'performer')}</span>`;
}

/** Mix 署名: Código JAVObras先认Actriz, 其余先认创作者.  */
export function mixLabel(item: IdentityItem, tagLabel: (tag: string) => string): string {
  const performer = (item.performers || [])[0];
  return (item.is_jav && performer ? performer : item.creator) || performer || item.studio || item.code
    || tagLabel((item.tags || [])[0] || '') || 'Recomendado para ti';
}
