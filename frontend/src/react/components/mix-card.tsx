/* uno叠视频卡片: ReproducirListapágina每unoLista,  y primeropáginaese Mix 卡es同uno件东西. 
 *
 * Portadaposterior面压着两层纸边, Descripción它esuno叠; Pasar el ratón时逐翻过esteuno叠en laImagen(`use-stack-flip.ts`). 
 * Portadaderechaabajo角es数徽标, abajo面uno行esesteuno叠dentro出镜最másese几Avatar, Títuloyuno行来源, 
 * 最derecha边Dejauno格给次要动作(点点点菜单). CompletoPortadaes"Abrir"点击区, Avatar各自通往资料página. 
 *
 * 卡es媒体卡, Noes Board Introduce充卡: 透明底, SinRelleno, 面SoloEnPortadaeseuno. 纸边, 翻página, 
 * 徽标底色y叠放Avatar让几何写En `../styles.css`  `[data-mix-*]` eseuno组Regladentro: 
 * 伪元素, `color-mix` y相邻兄弟SeleccionarDispositivoEn工具类dentro写No出来.  */
import { useCallback, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { avatarInner, representativeOf } from '@peach/card-art';
import { firstGrapheme } from '@peach/legacy/core';

import { ArtSlot } from './art-slot';
import { spriteGlyph } from './sprite-glyph';
import { useStackFlip } from './use-stack-flip';

export { MIX_FLIP_FACES, MIX_FLIP_LEAD_MS, MIX_FLIP_MS } from './use-stack-flip';

const PLAY = spriteGlyph('play');

/** 署名行uno. `kind` es `performer`/`creator`.  */
export interface MixCardFace {
  kind: string;
  id: number;
  name: string;
  has_image?: boolean;
  image_version?: string;
  avatar_focus?: unknown;
}

export interface MixCardProps {
  /** Título, 同时es点击区y菜单Sin障碍名称dentroese名字.  */
  name: string;
  /** Títuloabajoeseuno行: esteuno叠从哪儿来.  */
  caption: ReactNode;
  /** 徽标en la数.  */
  count: number;
  /** 静止Portada地址. Sin就写"Sin vista previa".  */
  poster: string | null;
  /** Pasar el ratón时翻过ese几Imagen地址, 按顺序; 最más取anterior `MIX_FLIP_FACES` .  */
  flipImages(): Promise<readonly string[]>;
  /** 此刻能No能翻(壳más选, 遮挡, 减menos动效, 滚动en proceso).  */
  canFlip(): boolean;
  /** 署名行人, 最más画cinco; uno都Sin时画Títuloprimero字.  */
  faces: readonly MixCardFace[];
  /** 点Avatar: 去este人资料página.  */
  onOpenEntity(kind: string, name: string): void;
  /** 点Portada. No给就esesteuno叠Sin去处(空Lista), 点击区Nopuede点. Parámetroeseste卡本身, 壳拿它当
   *  Abrir动画起点.  */
  onOpen?: (card: HTMLElement) => void;
  /** Portada点击区Sin障碍名称, 例如"AbrirReproducirLista 周últimolentover".  */
  openLabel: string;
  /** 署名行最derechaeseuno格: 次要动作菜单.  */
  menu?: ReactNode;
  /** Portada格anchoalto比. No给就es 16:9; primeropáginaese跟着esteuno屏卡片版走.  */
  ratio?: number;
  /** 静止Portada改用遗Deja层拼ese段Imagen片 HTML(Código JAVObras取景链要continuar管它), Portada格同时带arribaObras卡
   *  Portada格钩子(`data-media-pic`), Difuso衬底y取景 y Obras卡同uno路.  */
  artwork?: { kind: string; html: string };
  /** 静止Portada去掉版posterior身yOriginal地换版, 见 `./art-slot.tsx`.  */
  artworkIdentity?: string;
  relayoutArt?(root: HTMLElement): void;
  /** 翻página每uno也用 HTML 画,  y 静止Portadalargo得uno样; Parámetroes `flipImages` 给ese地址.  */
  faceHtml?(src: string): string;
  /** 徽标en la字. No给就es"N 视频".  */
  badge?: string;
  /** 署名行换成unoReproducir字形, No画Avatar: primeropáginaese Mix 说es"以它ComoSemilla相似Obras".  */
  glyph?: boolean;
  /** Completo卡都es点击区(primeropáginaese). No给就SoloConPortadapuede点, 署名行Avatar各自通往资料página.  */
  wholeCard?: boolean;
}

/** 静止Portada. 取No到时Imagen撤掉, Solo剩黑底, 同遗Deja层 `data-drop="self"`.  */
function Poster({ src }: { src: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return null;
  return (
    <img data-mix-poster="" src={src} width={640} height={360} alt="" loading="lazy" onError={() => setBroken(true)}
      className="absolute inset-0 block size-full object-contain" />
  );
}

/** 圆框共用eseuno副: 38px 正圆, Imagen铺满, primero字母居en proceso.  */
const RING = 'relative inline-grid size-9.5 flex-none place-items-center overflow-hidden rounded-full'
  + ' bg-background-secondary-default text-body-2-regular text-text-secondary'
  + ' [&_img]:absolute [&_img]:inset-0 [&_img]:block [&_img]:size-full [&_img]:object-cover';

/** 圆框dentroese段 HTML 由 `avatarInner` 拼: ConImagen走Imagen, 没Imagen退primero字母, Obra representativaAvatar查同unoObra representativa表.  */
function Avatars({ faces, fallback, onOpenEntity }: {
  faces: readonly MixCardFace[]; fallback: string; onOpenEntity: MixCardProps['onOpenEntity'];
}) {
  if (!faces.length) {
    return <span data-mix-initial="" aria-hidden className={`${RING} mt-0.5`}>{fallback}</span>;
  }
  return (
    <div data-mix-avatars="">
      {faces.slice(0, 5).map((face) => (
        <button key={`${face.kind}:${face.id}`} type="button" title={`AbrirDetallesPágina: ${face.name}`}
          aria-label={`AbrirDetallesPágina: ${face.name}`} onClick={() => onOpenEntity(face.kind, face.name)}
          className={`${RING} cursor-pointer outline-none`}
          dangerouslySetInnerHTML={{ __html: avatarInner(face.name, face, representativeOf(face.name), face.kind) }} />
      ))}
    </div>
  );
}

export function MixCard({
  name, caption, count, poster, flipImages, canFlip, faces, onOpenEntity, onOpen, openLabel, menu,
  ratio, artwork, artworkIdentity, relayoutArt, faceHtml, badge, glyph, wholeCard,
  ...data
}: MixCardProps & Record<`data-${string}`, string>) {
  const flip = useStackFlip({ load: flipImages, canFlip });
  /* 壳En滚动, 换página y 开más选时按 `_stopHover` 收掉uno切Pasar el ratón动效, este卡翻página也En其en proceso.  */
  const stop = useRef(flip.onPointerLeave);
  stop.current = flip.onPointerLeave;
  const card = useRef<HTMLElement | null>(null);
  const attach = useCallback((el: (HTMLElement & { _stopHover?: () => void }) | null) => {
    card.current = el;
    if (el) el._stopHover = () => stop.current();
  }, []);
  const open = onOpen ? () => { if (card.current) onOpen(card.current) } : undefined;
  const cover = artwork !== undefined || ratio !== undefined;
  return (
    <article {...data} ref={attach} data-mix-card="" onMouseEnter={flip.onPointerEnter}
      onMouseLeave={flip.onPointerLeave} onClick={wholeCard ? open : undefined}
      className="relative flex min-w-0 cursor-pointer flex-col gap-2">
      <div data-mix-stack="" className="relative isolate rounded-surface">
        <div data-mix-cover="" data-media-pic={cover ? '' : undefined}
          style={ratio !== undefined ? { '--card-ratio': String(ratio) } as CSSProperties : undefined}
          className="relative z-1 flex aspect-video items-center justify-center overflow-hidden">
          {artwork?.html
            ? <ArtSlot artwork={artwork} identity={artworkIdentity} relayout={relayoutArt} />
            : poster
              ? <Poster key={poster} src={poster} />
              : <span className="text-caption-1-regular tracking-caps text-text-secondary uppercase">Sin vista previa</span>}
          <div data-mix-faces="" hidden={!flip.faces.length}>
            {flip.faces.map((src, index) => (
              <div key={src} data-mix-face={index === flip.current ? 'on' : index === flip.leaving ? 'off' : ''}>
                {faceHtml
                  ? <span data-media-art="" dangerouslySetInnerHTML={{ __html: faceHtml(src) }} />
                  : <img src={src} alt="" loading="eager" />}
              </div>
            ))}
          </div>
          <button type="button" data-mix-open="" aria-label={openLabel} disabled={!onOpen} onClick={wholeCard ? undefined : open}
            className="absolute inset-0 z-1 cursor-pointer rounded-surface outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-border-focus-ring disabled:cursor-default" />
          <span data-mix-badge=""
            className="absolute right-2.25 bottom-2.25 z-6 flex min-h-7 items-center gap-1.5 rounded-2lg px-2.25 py-1 text-caption-1-semibold text-text-white">
            <PLAY aria-hidden className="size-3.75" />
            {badge ?? `${count.toLocaleString()}  video(s)`}
          </span>
        </div>
      </div>
      <div className="flex min-w-0 items-start gap-2.25">
        {glyph
          ? <span data-mix-glyph="" aria-hidden><PLAY /></span>
          : <Avatars faces={faces} fallback={firstGrapheme(name)} onOpenEntity={onOpenEntity} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <b data-mix-title="" className="truncate text-body-bold text-text-primary">{name}</b>
          <span data-mix-caption="" className="mt-0.5 truncate text-caption-1-regular text-text-secondary">{caption}</span>
        </div>
        {menu}
      </div>
    </article>
  );
}
