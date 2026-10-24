/* Imagen片灯箱: unoOriginal生模态 dialog, 主画布y缩略Imagen各esuno Swiper. 
 *
 * 宿主es body último尾uno带 `.peach-react` 容Dispositivo, uno棵根常驻: Abrir时换arribaNuevouno灯箱
 * (`key` 每次加uno, Swiper 从头建), 关掉时Solocontenido渲染成空, 根 y 容DispositivoDeja着给Siguiente次. No进
 * 路由树: eseuno套es给壳página面容Dispositivo用, 容Dispositivo归壳, 换página就被Completopesado写; 灯箱浮En所Conpágina面
 * 之arriba, 哪unopágina都能Abrir, 跟哪página面容Dispositivo都No同生共死.  */
import { useId, useLayoutEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { flushSync } from 'react-dom';

import { icon } from '@peach/legacy/core';
import { setActionBusy, spinnerHtml, wireContextCard } from '@peach/legacy/ui';

import { syncBoardRange } from '../../board-controls';
import {
  loadSwiper, photoMeta, photoTitle, photoZoom, PHOTO_ZOOM_MAX, PHOTO_ZOOM_MIN, PHOTO_ZOOM_STEP,
  type LightboxHost, type LightboxSlide, type PhotoZoom, type SwiperConstructor, type SwiperInstance,
} from './photo-lightbox';

let host: HTMLElement | null = null;
let root: Root | null = null;
let generation = 0;

function lightboxRoot(): Root {
  if (!root || !host?.isConnected) {
    root?.unmount();
    host = document.createElement('div');
    host.className = 'peach-react';
    host.dataset.photoLightboxHost = '';
    document.body.append(host);
    root = createRoot(host);
  }
  return root;
}

/** 从No. `index` Empezarver `slides`. Swiper 取No到时退到NuevoEtiquetapáginadentroAbrireseunograndeImagen.  */
export async function openPhotoLightbox(index: number, slides: LightboxSlide[], actions?: LightboxHost): Promise<void> {
  if (!slides.length || index < 0 || index >= slides.length) return;
  let Swiper: SwiperConstructor;
  try {
    Swiper = await loadSwiper();
  } catch {
    window.open(slides[index].src, '_blank', 'noopener');
    return;
  }
  const at = lightboxRoot();
  flushSync(() => at.render(
    <PhotoLightbox key={++generation} slides={slides} index={index} Swiper={Swiper} host={actions ?? null} />,
  ));
}

export function closePhotoLightbox(): void {
  if (root) flushSync(() => root!.render(null));
}

interface Detail {
  dismiss(returnFocus?: boolean): void;
  /** 面板开着, esteunoabajo点En面板 y 触发Clave之exterior: 收起面板, esteunoabajoNo再算别.  */
  dismissOutside(target: EventTarget | null): boolean;
  isOpen(): boolean;
}

function PhotoLightbox({ slides, index, Swiper, host: actions }: {
  slides: LightboxSlide[]; index: number; Swiper: SwiperConstructor; host: LightboxHost | null;
}) {
  const many = slides.length > 1;
  const detailId = useId();
  const box = useRef<HTMLDialogElement>(null);
  const mainEl = useRef<HTMLDivElement>(null);
  const stripEl = useRef<HTMLDivElement>(null);
  const pagination = useRef<HTMLDivElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const fwd = useRef<HTMLButtonElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLElement>(null);
  const range = useRef<HTMLInputElement>(null);
  const zoom = useRef<PhotoZoom | null>(null);
  const detail = useRef<Detail | null>(null);
  const [active, setActive] = useState(index);
  const [percent, setPercent] = useState(100);
  /* grandeImagen自然尺寸, 到才知道: 面板en la分辨率读它. 取No到OriginalImagenese几换成缩略Imagen.  */
  const [natural, setNatural] = useState<Record<number, [number, number]>>({});
  const [broken, setBroken] = useState<ReadonlySet<number>>(() => new Set());
  /** OriginalImagen y 缩略Imagen都取No到ese几: 放uno占, No露Explorar dispositivo破Imagen标.  */
  const [lost, setLost] = useState<ReadonlySet<number>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<{ at: number; text: string }>({ at: index, text: '' });

  useLayoutEffect(() => {
    const dialog = box.current!;
    dialog.showModal();
    document.body.classList.add('photolight-open');
    const strip = new Swiper(stripEl.current!, {
      slidesPerView: 'auto', spaceBetween: 8, freeMode: true, watchSlidesProgress: true,
      centeredSlides: true, slideToClickedSlide: true,
    });
    const centerThumb = (at: number, speed = 200) => strip.slideTo(at, speed);
    const main = new Swiper(mainEl.current!, {
      initialSlide: index, zoom: { minRatio: .01, maxRatio: 100 }, keyboard: { enabled: true }, lazyPreloadPrevNext: 1,
      // arribaabajo滚也翻Página: verImagen时手En滚轮arriba, 没人愿意Como换uno去够izquierdaderechaClave或按钮. 
      mousewheel: { enabled: true, forceToAxis: false },
      thumbs: { swiper: strip },
      pagination: {
        el: pagination.current, clickable: true, dynamicBullets: true, dynamicMainBullets: 3,
        renderBullet: (at: number, className: string) =>
          `<button type="button" class="${className}" aria-label="verNo. ${at + 1}  imagen(es)"></button>`,
      },
      navigation: { prevEl: back.current, nextEl: fwd.current },
      on: {
        slideChange(this: SwiperInstance) {
          setActive(this.activeIndex);
          centerThumb(this.activeIndex);
        },
      },
    });
    centerThumb(index, 0);
    zoom.current = photoZoom(dialog, main, setPercent);
    const context = wireContextCard(dialog, toggle.current!, panel.current!);
    const dismiss = (returnFocus = false) => {
      context.hide();
      toggle.current?.setAttribute('aria-expanded', 'false');
      if (returnFocus && toggle.current && document.contains(toggle.current)) toggle.current.focus();
    };
    /* 开着没开着问Información卡自己: 退场动画eseuno段面板还没 hidden, 按 hidden 判会"En curso收"
       当成"开着", 连按两abajo Escape No.dosabajo就Soloes又收uno遍.  */
    detail.current = {
      dismiss,
      dismissOutside: (target) => {
        const node = target instanceof Node ? target : null;
        if (!context.isOpen() || toggle.current!.contains(node) || panel.current!.contains(node)) return false;
        dismiss();
        return true;
      },
      isOpen: context.isOpen,
    };
    /* Swiper SoloEn自己构造eseuno刻量uno次容Dispositivo. 窗口uno改Tamaño(或primero屏Fuente de letra, 滚动落定得比构造晚)
       slide 就停Enantiguoancho度arriba, grandeImagen按Error框Zoom, ver起来就es"显示NoTodo".  */
    const resize = new ResizeObserver(() => { main.update(); strip.update(); zoom.current?.resize() });
    resize.observe(dialog);
    const keys = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (detail.current?.isOpen()) detail.current.dismiss(true);
      else closePhotoLightbox();
    };
    document.addEventListener('keydown', keys, true);
    return () => {
      document.removeEventListener('keydown', keys, true);
      dismiss();
      resize.disconnect();
      main.destroy(true, true);
      strip.destroy(true, true);
      zoom.current = null;
      detail.current = null;
      dialog.close();
      document.body.classList.remove('photolight-open');
    };
    // 每次Abrir换unoNuevo(`key`), esteuno段SoloEn挂arribay卸abajo时各跑uno次. 
  }, []);

  useLayoutEffect(() => { if (range.current) syncBoardRange(range.current) }, [percent]);

  const slide = slides[active];
  const asset = slide.asset ?? null;
  const reveal = async (button: HTMLButtonElement) => {
    if (!asset || !actions || button.getAttribute('aria-busy') === 'true') return;
    const at = active;
    setActionBusy(button);
    setBusy(true);
    setStatus({ at, text: '' });
    try {
      setStatus({ at, text: await actions.revealSource(asset.id) });
    } finally {
      setActionBusy(button, false);
      setBusy(false);
    }
  };
  const loaded = (at: number, img: HTMLImageElement) => {
    if (img.naturalWidth && img.naturalHeight && !natural[at]) {
      setNatural((prev) => ({ ...prev, [at]: [img.naturalWidth, img.naturalHeight] }));
    }
    zoom.current?.loaded(img);
  };
  // OriginalImagen取No到时换arribaeste缩略Imagen: 归档站OriginalArchivoAnfitrión会拦abajoProxy(pawchive  file.
  // 子域挂着 ddos-guard), 缩略Imagen由Explorar dispositivo直continuar读公开Anfitrión. Solo换uno次, 缩略Imagen也取No到就放占. 
  const failed = (at: number) => {
    if (broken.has(at) || !slides[at].thumb || slides[at].thumb === slides[at].src) {
      setLost((prev) => new Set(prev).add(at));
      return;
    }
    setBroken((prev) => new Set(prev).add(at));
  };
  const apply = (raw: number | 'fit') => zoom.current?.apply(raw);
  const revealLabel = '<span>Mostrar en explorador</span>';

  return (
    <dialog ref={box} aria-label="Explorar imágenes" data-photo-lightbox="" data-has-strip={many ? '' : undefined}
      onCancel={(event) => { event.preventDefault(); closePhotoLightbox() }}
      onClick={(event) => {
        // 主画布铺满视口posterior, 黑色Deja白属于 zoom 容Dispositivo而Noes最exterior层; 两者都视ComoFondo. 
        // 点Imagen片, 缩略Imagen, 工具栏 y 翻página按钮仍NoCerrar sesión. 
        const target = event.target as Element;
        if (detail.current?.dismissOutside(target)) return;
        if (target === box.current || target.classList.contains('swiper-zoom-container')) closePhotoLightbox();
      }}>
      <button type="button" data-photo-close="" aria-label="Desactivar" onClick={closePhotoLightbox}
        dangerouslySetInnerHTML={{ __html: icon('x') }} />
      <div ref={mainEl} className="swiper" data-photo-main="" role="region" aria-roledescription="Carrusel"
        aria-label="Explorar imágenes">
        <div className="swiper-wrapper">
          {slides.map((item, at) => (
            <div key={at} className="swiper-slide">
              <div className="swiper-zoom-container">
                {lost.has(at)
                  ? <span data-photo-missing="">Imágenes取No到</span>
                  : <img src={broken.has(at) ? item.thumb : item.src} alt={item.name ?? ''} loading="lazy"
                    referrerPolicy="no-referrer" onLoad={(event) => loaded(at, event.currentTarget)}
                    onError={() => failed(at)} />}
              </div>
            </div>
          ))}
        </div>
        {/* 方向Solo翻Imagen标, No转Completo按钮. 两都画朝izquierdaeseuno, 朝derechaEn样dentro转medio圈.  */}
        <button ref={back} type="button" data-photo-nav="back" aria-label="Anterior"
          dangerouslySetInnerHTML={{ __html: icon('chevron-left') }} />
        <button ref={fwd} type="button" data-photo-nav="fwd" aria-label="Siguiente"
          dangerouslySetInnerHTML={{ __html: icon('chevron-left') }} />
      </div>
      <div data-photo-bar="">
        <button ref={toggle} type="button" data-photo-detail-toggle="" aria-expanded="false" aria-controls={detailId}
          aria-haspopup="dialog" aria-label="ImágenesDetalles" title="ImágenesDetalles" dangerouslySetInnerHTML={{ __html: icon('info') }} />
        <div>
          <div data-photo-count="" aria-live="polite">{`${active + 1} / ${slides.length}`}</div>
          {many ? <div ref={pagination} data-photo-pagination="" aria-label="SeleccionarImágenes" /> : null}
        </div>
        <div data-photo-zoom="">
          <button type="button" data-zoom-step="-1" aria-label="Alejar"
            onClick={() => apply(percent - PHOTO_ZOOM_STEP)} dangerouslySetInnerHTML={{ __html: icon('zoom-out') }} />
          <input ref={range} type="range" min={PHOTO_ZOOM_MIN} max={PHOTO_ZOOM_MAX} step="1" value={percent}
            aria-label="Zoom" onChange={(event) => apply(Number(event.currentTarget.value))} />
          <button type="button" data-zoom-step="1" aria-label="Acercar"
            onClick={() => apply(percent + PHOTO_ZOOM_STEP)} dangerouslySetInnerHTML={{ __html: icon('zoom-in') }} />
          <b data-photo-zoom-readout="">{`${percent}%`}</b>
          <button type="button" data-photo-scale="fit" aria-label="Ajustar a ventana" title="Ajustar a ventana"
            onClick={() => apply('fit')} dangerouslySetInnerHTML={{ __html: icon('maximize') }} />
          <button type="button" data-photo-scale="original" aria-label="Tamaño original" title="Tamaño original"
            onClick={() => apply(100)}>1:1</button>
        </div>
      </div>
      {/* Imagen片DetallesSolo展示安TodoMetadatos, 定Solo asset id 交给服务端: 绝No能Como显示Ruta ledger
          本机绝对Ruta送进Explorar dispositivo. Título按esteuno换uno元素: en proceso段省略(`src/ui-kit/middle-truncate.ts`)
          会改写它文字, 同uno元素arriba React 再改字就对Noarriba.  */}
      <section ref={panel} id={detailId} data-photo-detail="" role="dialog" aria-modal="false"
        aria-labelledby={`${detailId}-title`} hidden>
        <div data-photo-detail-copy="">
          <h2 key={active} id={`${detailId}-title`} data-middle-truncate="" tabIndex={-1}>{photoTitle(slide)}</h2>
          <span data-photo-detail-meta="">{photoMeta(slide, natural[active])}</span>
        </div>
        <button type="button" data-photo-reveal="" hidden={!asset || !actions}
          onClick={(event) => void reveal(event.currentTarget)}
          dangerouslySetInnerHTML={{ __html: (busy ? spinnerHtml('Localizando') : icon('folder-open')) + revealLabel }} />
        <span data-photo-status="" aria-live="polite">{status.at === active ? status.text : ''}</span>
      </section>
      <div ref={stripEl} className="swiper" data-photo-strip="">
        <div className="swiper-wrapper">
          {slides.map((item, at) => (
            <div key={at} className="swiper-slide">
              <img src={item.thumb} alt="" loading="lazy" referrerPolicy="no-referrer" />
            </div>
          ))}
        </div>
      </div>
    </dialog>
  );
}
