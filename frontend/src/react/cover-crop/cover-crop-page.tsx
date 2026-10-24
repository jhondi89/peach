/* RecortarPortada: ObrasDetallespáginaTítulo旁eseClave点开uno屏. 
 *
 * 裁es**取景框**, NoesImagen片. 横版封套dentro正封eseuno本来就NoesunoNuevoImagen, 而esuno组
 * 写En `<Código JAV>.poster.json` en la坐标(`src/peach/jav_poster_crop.py`), página面按它取景. 
 * 所以esteuno屏Confirmar之posteriorPortadaOriginalImagenuno字节都没动, "RestaurarPredeterminado"就esese组坐标按折痕判据
 * pesado算uno遍—NoesImagen还Original, Imagen从来没变过. 
 *
 * Predeterminado框满alto贴derecha缘, 按正封anchoalto比取ancho: 封套es"背面 | 书脊 | 正面", 人要改másmedio
 * Soloes折痕落En哪uno列. Relaciónpuede以解锁, 因Como版No规Completo封套确实存En. 
 */
import { useRef, useState } from 'react';
import { RiCloseLine } from '@remixicon/react';
import { useMutation } from '@tanstack/react-query';
import { UNSAFE_PortalProvider } from 'react-aria';
import { Heading } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { IconButton } from '@/components/base/buttons/icon-button';
import { Switch } from '@/components/base/switch/switch';

import { errorMessage } from '../../api';
import {
  clampBox, defaultPanelBox, isUsableSize, type CropBox, type CropSize,
} from '../../crop-geometry';
import { PANEL_ASPECT } from '../../jav-artwork';
import type { CoverCropProps } from '../bundle';
import { ModalFrame, ModalGlyph } from '../components/modal-frame';
import { Note } from '../components/note';
import { overlayHost } from '../components/overlay-host';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { CropFrame } from '../crop/crop-frame';
import { busyProps } from '../settings/use-action';
import { sendCoverCrop } from './cover-crop';

/** 雪碧Imagenen la Lucide `crop`. esteClave y antiguo版工具定, SincronizarEliminar排Enuno行, ese两es
 *  15px, 线ancho 2 线字形; Remix eseesIntroduce充轮廓, y排ver笔画粗uno圈.  */
function CropIcon({ className }: { className: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <use href="#i-crop" />
    </svg>
  );
}

export function CoverCrop({ code, coverUrl, box, onSaved }: CoverCropProps) {
  const [open, setOpen] = useState(false);
  const anchor = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={anchor} type="button" aria-haspopup="dialog" data-cover-crop
        aria-label={`Recortar ${code} Portada`} title="Recortar portada: 框出正封eseuno"
        onClick={() => setOpen(true)}
        className="flex size-7 cursor-pointer items-center justify-center rounded-lg text-foreground-icon-secondary outline-none transition-colors hover:bg-background-primary-hover hover:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring">
        <CropIcon className="size-3.75" />
      </button>
      {/* Detallespáginaes `showModal()` 开Original生 dialog, 弹层要挂进同uno层才盖得住它.  */}
      <UNSAFE_PortalProvider getContainer={() => overlayHost(anchor.current)}>
        <ModalFrame isOpen={open} onOpenChange={setOpen} width="cover-crop" label="Recortar portada">
          <CropBody code={code} coverUrl={coverUrl} box={box} onSaved={onSaved}
            close={() => setOpen(false)} />
        </ModalFrame>
      </UNSAFE_PortalProvider>
    </>
  );
}

function CropBody({ code, coverUrl, box: saved, onSaved, close }: CoverCropProps & { close(): void }) {
  const [size, setSize] = useState<CropSize | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const [locked, setLocked] = useState(true);
  const frame = useOverlayScrollbar<HTMLDivElement>();

  const submit = useMutation({
    mutationFn: (next: CropBox | null) => sendCoverCrop(code, next),
    onSuccess: (result) => { close(); onSaved(result.poster_box) },
  });

  /* 进来时先摆En当anterior生效ese框arriba: 人要改es"现Eneste样", 从头Empezar框etc.于先
     现状复Originaluno遍. Sin生效框(estePortada判定ComoNo该裁)才退回Predeterminado满alto贴derecha缘.  */
  function ready(next: CropSize) {
    setSize(next);
    const current = saved && saved.px?.[0] === next.width && saved.px?.[1] === next.height
      ? { x0: saved.x0, y0: saved.y0, x1: saved.x1, y1: saved.y1 }
      : defaultPanelBox(next, PANEL_ASPECT);
    setBox(clampBox(current, next, null));
  }

  const busy = submit.isPending;
  return (
    <>
      <div className="flex shrink-0 items-start gap-4 p-5">
        <ModalGlyph><CropIcon className="size-6" /></ModalGlyph>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Heading slot="title" className="text-title-3-semibold text-text-primary">Recortar portada</Heading>
          <p className="text-body-2-regular text-text-secondary">
            {code}: 框出正封eseuno, PortadaOriginalImagenNo动. 拖动方框Mover, 滚轮或角arribaese方改Tamaño. 
          </p>
          {submit.error ? <Note tone="error">{errorMessage(submit.error)}</Note> : null}
        </div>
        <IconButton icon={RiCloseLine} size="small" aria-label="Desactivar" onClick={close} />
      </div>
      <div ref={frame} className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto border-t border-separator-border px-5 py-4">
        <CropFrame src={coverUrl} aspect={locked ? PANEL_ASPECT : null} box={box} size={size}
          label={`${code} 正封取景框`}
          onSize={(next) => { if (isUsableSize(next)) ready(next) }}
          onBox={setBox} />
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-separator-border p-5">
        <Switch isSelected={locked} onChange={(next) => {
          setLocked(next);
          if (next && box && size) setBox(clampBox(box, size, PANEL_ASPECT));
        }}>
          <span className="text-body-2-regular text-text-secondary">Bloquear正封Relación</span>
        </Switch>
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" {...busyProps(busy)}
            onClick={() => { if (!busy) submit.mutate(null) }}>Restaurar predeterminado</Button>
          <Button disabled={!box || !size} {...busyProps(busy)}
            onClick={() => { if (box && !busy) submit.mutate(box) }}>Usar este bloque</Button>
        </div>
      </div>
    </>
  );
}
