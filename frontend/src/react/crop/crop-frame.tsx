/* EnunoImagenarriba框uno. Avatar y Portada共用esteuno. 
 *
 * No引RecortarBiblioteca: 要就es"uno能拖能缩矩形", 算术TodoEn `crop-geometry.ts` dentro, 
 * ImagenesunoImagen加cinco绝对定. 引unoBiblioteca进来换到SoloCon手样, 代价esuno
 * Nuevo依赖 y uno套它自己坐标约定. 
 *
 * 框坐标uno律es**源Imagen像素**, 进出esteuno层时各换算uno次; 屏幕arriba量到显示像素No
 * 往exterior传. Confirmar之posterior由posterior端按同uno组Completo数裁, 两边No会各取各Completo. 
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CSSProperties, PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent,
} from 'react';

import {
  boxPercent, clampBox, handleOutside, isUsableSize, moveBox, resizeFromCorner, scaleBox, toNatural,
  type CropBox, type CropSize,
} from '../../crop-geometry';

export interface CropFrameProps {
  src: string;
  /** ancho/alto. 给就锁Relación, 拖动Solo改Ubicación y Tamaño, No改形状.  */
  aspect: number | null;
  box: CropBox | null;
  size: CropSize | null;
  onBox(box: CropBox): void;
  onSize(size: CropSize): void;
  /** Sin障碍名称, 说清En框哪Imagen哪uno.  */
  label: string;
}

/** Clave盘uno步走框anchoesteRelación. uno屏之interior按住方向Clave能从uno边走到另uno边, 又No至于
 *  unoabajo越过uno脸.  */
const KEY_STEP = 0.02;
/** 滚轮uno格Zoom倍率.  */
const WHEEL_STEP = 1.08;

export function CropFrame({ src, aspect, box, size, onBox, onSize, label }: CropFrameProps) {
  const image = useRef<HTMLImageElement>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; x: number; y: number; box: CropBox } | null>(null);
  const [failed, setFailed] = useState(false);
  /* Imagen当anterior显示尺寸, Solo用来判断框En屏幕arriba够No够grande, 角柄放框dentro还es框exterior.  */
  const [shown, setShown] = useState<CropSize | null>(null);

  useEffect(() => { setFailed(false) }, [src]);
  useEffect(() => {
    const node = image.current;
    if (!node) return undefined;
    const observer = new ResizeObserver(() => setShown({ width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  /** 显示像素移 → 源Imagen像素. Imagen片按 `max-w-full` Zoom, 两轴Relaciónuno样.  */
  const scale = useCallback((dx: number, dy: number) => {
    const node = image.current;
    if (!node || !size) return { dx: 0, dy: 0 };
    return {
      dx: toNatural(dx, node.clientWidth, size.width),
      dy: toNatural(dy, node.clientHeight, size.height),
    };
  }, [size]);

  function start(mode: 'move' | 'resize') {
    return (event: ReactPointerEvent) => {
      if (!box || !size || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);
      drag.current = { mode, x: event.clientX, y: event.clientY, box };
    };
  }

  function move(event: ReactPointerEvent) {
    const active = drag.current;
    const node = image.current;
    if (!active || !node || !size) return;
    const shift = scale(event.clientX - active.x, event.clientY - active.y);
    if (active.mode === 'move') {
      onBox(moveBox(active.box, shift.dx, shift.dy, size));
      return;
    }
    onBox(resizeFromCorner(active.box, active.box.x0 + (active.box.x1 - active.box.x0) + shift.dx,
      active.box.y0 + (active.box.y1 - active.box.y0) + shift.dy, size, aspect));
  }

  function end(event: ReactPointerEvent) {
    if (!drag.current) return;
    drag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  function keys(event: ReactKeyboardEvent) {
    if (!box || !size) return;
    const step = Math.max(1, (box.x1 - box.x0) * KEY_STEP);
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step],
    };
    if (moves[event.key]) {
      event.preventDefault();
      onBox(moveBox(box, moves[event.key][0], moves[event.key][1], size));
      return;
    }
    if (event.key === '+' || event.key === '=' || event.key === '-') {
      event.preventDefault();
      onBox(scaleBox(box, event.key === '-' ? 1 / WHEEL_STEP : WHEEL_STEP, size, aspect));
    }
  }

  const rect = box && size ? boxPercent(clampBox(box, size, aspect), size) : null;
  const outside = rect ? handleOutside(rect, shown) : false;
  /* UbicaciónSolo经自定义属性进 CSS: seiscien分数挂En容Dispositivoarriba, 压暗y框本身各自用类名取用, 
     样仍然TodoEn类dentro(`docs/FRONTEND.md`).  */
  const frame = rect ? {
    '--crop-l': `${rect.left}%`, '--crop-t': `${rect.top}%`,
    '--crop-w': `${rect.width}%`, '--crop-h': `${rect.height}%`,
    '--crop-r': `${rect.left + rect.width}%`, '--crop-b': `${rect.top + rect.height}%`,
  } as CSSProperties : undefined;
  return (
    <div className="relative inline-block max-w-full select-none" style={frame}>
      <img ref={image} src={src} alt="" draggable={false}
        onLoad={(event) => {
          const node = event.currentTarget;
          if (isUsableSize({ width: node.naturalWidth, height: node.naturalHeight })) {
            onSize({ width: node.naturalWidth, height: node.naturalHeight });
          }
        }}
        onError={() => setFailed(true)}
        className="block max-h-crop-frame max-w-full object-contain" />
      {failed || !rect ? null : (
        <>
          {/* 框exterior压暗. cuatro而Noesuno圈巨grande box-shadow: posterior者Enesteuno层圆角y
              overflow abajo会溢到弹层exterior面去.  */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-(--crop-t) bg-scrim" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 top-(--crop-b) bg-scrim" />
          <div aria-hidden className="pointer-events-none absolute left-0 top-(--crop-t) h-(--crop-h) w-(--crop-l) bg-scrim" />
          <div aria-hidden className="pointer-events-none absolute right-0 left-(--crop-r) top-(--crop-t) h-(--crop-h) bg-scrim" />
          {/* 框本身. Completopuede拖, derechaabajo角esepequeño方改Tamaño; 方向Clavey加减号做同样两件事. 
              框En屏幕arriba很pequeño(极扁, 极largoImagen)时角柄Completo挪到框exteriorderechaabajo, 框dentroDeja给拖动.  */}
          <div role="group" tabIndex={0} aria-label={label} data-crop-box
            onPointerDown={start('move')} onPointerMove={move}
            onPointerUp={end} onPointerCancel={end} onKeyDown={keys}
            onWheel={(event) => {
              if (!box || !size) return;
              onBox(scaleBox(box, event.deltaY > 0 ? WHEEL_STEP : 1 / WHEEL_STEP, size, aspect));
            }}
            className="absolute left-(--crop-l) top-(--crop-t) h-(--crop-h) w-(--crop-w) cursor-move touch-none outline-none ring-2 ring-border-focus-ring ring-inset focus-visible:ring-4">
            <span data-crop-handle data-outside={outside || undefined} onPointerDown={start('resize')}
              onPointerMove={move} onPointerUp={end} onPointerCancel={end}
              className="absolute -right-1.5 -bottom-1.5 data-outside:-right-3.5 data-outside:-bottom-3.5 size-3 cursor-nwse-resize touch-none rounded-xs border border-separator-border bg-background-full" />
          </div>
        </>
      )}
      {failed
        ? <p className="p-4 text-body-2-regular text-text-secondary">este imagen(es)Imagen读No出来, 换uno imagen(es)再框. </p>
        : null}
    </div>
  );
}
