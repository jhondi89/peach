import { useEffect, useRef, useState } from 'react';
import { RiArrowDownSLine, RiDatabase2Line, RiGlobalLine, RiHardDrive2Line } from '@remixicon/react';
import { Popover } from 'react-aria-components';
import { Button } from '@/components/base/buttons/button';
import { MENU_ITEM, MENU_ITEM_INTERACTIVE, MENU_POPOVER_SURFACE } from '@/components/base/dropdown/menu-styles';
import { cx } from '@/utils/cx';
import { formModal, iconSwitchHtml } from '@peach/legacy/ui';
import { MenuDialog } from '../components/menu-dialog';
import { busyProps } from '../settings/use-action';
import type { LibraryProcessingCommand, ProcessingSpeed } from './library-processing';

export const RESOURCE_NOTICE_KEY = 'peach.library-processing.resource-notice.v1';

/** escanear y yaConObrasCompletar共用资料流水线, 视频Vista previa由媒体BibliotecaConfiguración决定.  */
export function ProcessingActions({ busy, scan = false, metadataOnly = false, speedMode = 'standard', onRun }: {
  busy: boolean; scan?: boolean; metadataOnly?: boolean; speedMode?: ProcessingSpeed;
  onRun(command: LibraryProcessingCommand): void | Promise<unknown>;
}) {
  const trigger = useRef<HTMLButtonElement>(null);
  const prompt = useRef<ReturnType<typeof formModal> | null>(null);
  useEffect(() => () => prompt.current?.close(), []);
  const [open, setOpen] = useState(false);
  const primary: { label: string; icon: typeof RiDatabase2Line; command: LibraryProcessingCommand } = { label: scan ? 'Sincronizar biblioteca' : 'Sincronizareste些Película', icon: RiDatabase2Line,
    command: scan ? {} : { stage: 'collect' as const } };
  const options: typeof primary[] = [primary,
    ...(scan ? [{ label: 'Solo escanear archivos', icon: RiHardDrive2Line, command: { stage: 'scan' as const } }] : []),
    ...(scan ? [{ label: 'Solo sincronizar películas catalogadas', icon: RiDatabase2Line, command: { stage: 'collect' as const } }] : []),
    { label: 'Solo generar vistas previas de video', icon: RiHardDrive2Line, command: { stage: 'previews' as const } },
    { label: 'Solo completar datos', icon: RiGlobalLine, command: { stage: 'metadata' as const } },
  ];
  const run = (command: LibraryProcessingCommand) => {
    if (busy) return;
    setOpen(false);
    let acknowledged = false;
    try { acknowledged = localStorage.getItem(RESOURCE_NOTICE_KEY) === 'seen' } catch { /* 存储Nopuede用时保DejaSugerencia */ }
    if (!scan || acknowledged || command.stage === 'metadata') {
      void Promise.resolve(onRun(command)).catch(() => { /* Error由Tarea入口DejaEnOriginal */ });
      return;
    }
    if (prompt.current) return;
    const previews = command.stage === 'previews';
    const title = previews ? 'Generar vista previa de video' : command.stage === 'scan' ? 'EscanearMediosArchivo' : 'Sincronizar biblioteca';
    const dialog = formModal({
      title,
      description: previews
        ? 'Generar vista previa de video会读取Videosy占用ProcesarDispositivo, puede能让电脑变lento. Necesario同时使用电脑时, Opcional择Bajo usoModo. '
        : `Procesar会读取MediosArchivo${command.stage === 'scan' ? '' : metadataOnly ? 'yDescargasDetalles' : ', DescargasDetallesyGenerar vista previa de video'}, puede能让电脑变lento. Necesario同时使用电脑时, Opcional择Bajo usoModo. `,
      body: iconSwitchHtml('processing-speed', 'ProcesarModo', [['low', 'Bajo uso'], ['standard', 'Estándar'], ['high', 'Máxima velocidad']], speedMode, { text: true }),
      confirmLabel: title,
      onConfirm: async () => {
        const selected = dialog.dialog.querySelector<HTMLInputElement>('input[name="processing-speed"]:checked')?.value;
        await onRun({ ...command, speed_mode: selected === 'low' ? 'low' : selected === 'high' ? 'high' : 'standard' });
        try { localStorage.setItem(RESOURCE_NOTICE_KEY, 'seen') } catch { /* 本次启动照常Completado */ }
      },
    });
    prompt.current = dialog;
    void dialog.done.then(() => { if (prompt.current === dialog) prompt.current = null });
  };
  return <>
    <span data-button-group data-split-button data-variant="primary">
      <Button leadingIcon={primary.icon} {...busyProps(busy)} onClick={() => run(primary.command)}>{primary.label}</Button>
      <Button ref={trigger} iconOnly leadingIcon={RiArrowDownSLine} aria-label="Más opciones de sincronización"
        aria-haspopup="dialog" aria-expanded={open} {...busyProps(busy)} onClick={() => { if (!busy) setOpen(!open) }} />
    </span>
    <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen} placement="bottom end" offset={4}
      className={MENU_POPOVER_SURFACE}>
      <MenuDialog aria-label="SincronizarMétodo" className="flex w-56 flex-col gap-1 outline-none">
        {options.map(({ label, icon: Icon, command }) => {
          const blocked = metadataOnly && 'stage' in command && command.stage === 'previews';
          return <button key={label} type="button" disabled={blocked}
            title={blocked ? 'Por favor先EnBiblioteca de mediosConfiguraciónEn procesoActivarVista previa de video生成' : undefined}
            className={cx(MENU_ITEM, MENU_ITEM_INTERACTIVE, 'text-body-2-medium')}
            onClick={() => run(command)}><Icon aria-hidden className="size-4 shrink-0" />{label}</button>;
        })}
      </MenuDialog>
    </Popover>
  </>;
}
