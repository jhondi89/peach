/* ReproducirListaPágina: Guardarabajo来 Mix y手动建Lista, 按Reciente改动排. 
 *
 * unoReproducirLista就esuno叠视频,  y primeropáginaese Mix 卡es同uno件东西, 所以穿同uno身
 * (`components/mix-card.tsx`): PortadaPasar el ratón时逐翻过Listaen laImagen, abajo面uno行esListadentro出镜最más
 * ese几Avatar, Título就esLista名. 改名 y Eliminar收进名字derecha边ese点点点菜单—它们eseste卡
 * 次要动作, No该 y "Abrir"y排占着unoCompleto行. 
 *
 * Nuevo, 改名, Eliminar都写 ledger, Solo由点击触发; Eliminar先过Confirmar弹层. tres者Éxitoposterior都给unoDeshacerClave, 
 * 写完让ListaClavepesado取, Nopesado挂Completopágina. 壳Enesteunopáginaarriba要求pesado读时 `revision` 加uno, página面同样Solopesado取.  */
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heading, Popover } from 'react-aria-components';
import { MenuDialog as Dialog } from '../components/menu-dialog';
import { confirmModal } from '@peach/legacy/ui';

import { Button } from '@/components/base/buttons/button';
import {
  MENU_ITEM, MENU_ITEM_INTERACTIVE, MENU_POPOVER_SURFACE,
} from '@/components/base/dropdown/menu-styles';
import { Input } from '@/components/base/input/input';
import { cx } from '@/utils/cx';

import { errorMessage } from '../../api';
import type { PlaylistsProps } from '../bundle';
import { EmptyState } from '../components/empty-state';
import { RetryNote } from '../components/grid-reveal';
import { MixCard } from '../components/mix-card';
import { ModalFrame } from '../components/modal-frame';
import { spriteGlyph } from '../components/sprite-glyph';
import { busyProps } from '../settings/use-action';
import {
  createPlaylist, deletePlaylist, fetchPlaylists, keepPlaylist, PLAYLISTS_KEY, posterUrl, recreatePlaylist,
  refreshPlaylists, renamePlaylist, resumeAssetId, type PlaylistRow,
} from './playlists';

const ELLIPSIS = spriteGlyph('ellipsis');
const PENCIL = spriteGlyph('pencil');
const TRASH = spriteGlyph('trash');
const PLAYLIST = spriteGlyph('playlist');

const MENU_ROW = cx(MENU_ITEM, MENU_ITEM_INTERACTIVE, 'text-body-2-medium');
const EMPTY_NAME = 'Lista de reproducciónNombreNo能ComoVacío';

type Toast = PlaylistsProps['toast'];

/** Deshacereseuno步: 做完Sin论成败都pesado读Lista; 抛出错交给回执, 它自己换成"DeshacerFallo".  */
const undoing = (task: () => Promise<unknown>) => async () => {
  try {
    await task();
  } finally {
    void refreshPlaylists();
  }
};

function CreateForm({ toast }: { toast: Toast }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const create = useMutation({
    mutationFn: (value: string) => createPlaylist(value),
    onSuccess: (result) => {
      setName('');
      setProblem('');
      void refreshPlaylists();
      toast('YaNuevoLista de reproducción', { undo: undoing(() => deletePlaylist(result.playlist.id)) });
    },
    onError: (cause) => setProblem(errorMessage(cause) || 'NuevoFallido'),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (create.isPending) return;
    if (!name.trim()) { setProblem(EMPTY_NAME); return }
    create.mutate(name);
  };
  return (
    <form data-playlist-create="" aria-label="NuevoLista de reproducción" onSubmit={submit}
      className="flex flex-wrap items-end gap-2">
      <div className="min-w-50 max-w-80 flex-1 basis-50 max-board-narrow:min-w-0 max-board-narrow:max-w-none">
        <Input label="Nueva lista de reproducción" placeholder="Introducir nombre" maxLength={80} value={name}
          onChange={(value) => { setName(value); setProblem('') }}
          validationBehavior="aria" isInvalid={Boolean(problem)} hint={problem || undefined} />
      </div>
      <Button type="submit" {...busyProps(create.isPending)}>Nuevo</Button>
    </form>
  );
}

function RenameDialog({ target, close, toast }: { target: PlaylistRow | null; close(): void; toast: Toast }) {
  const [name, setName] = useState('');
  const [problem, setProblem] = useState('');
  const input = useRef<HTMLInputElement>(null);
  /* Abrir时Original名Completo段选en proceso: más数时候esCompleto换掉, menos数esEnOriginal名arriba补uno截.  */
  useEffect(() => {
    if (!target) return undefined;
    setName(target.name);
    setProblem('');
    const frame = requestAnimationFrame(() => { input.current?.focus(); input.current?.select() });
    return () => cancelAnimationFrame(frame);
  }, [target]);
  const rename = useMutation({
    mutationFn: ({ row, value }: { row: PlaylistRow; value: string }) => renamePlaylist(row.id, value),
    onSuccess: (_result, { row }) => {
      close();
      void refreshPlaylists();
      toast('YaRenombrarLista de reproducción', { undo: undoing(() => renamePlaylist(row.id, row.name)) });
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!target || rename.isPending) return;
    const value = name.trim();
    if (!value) { setProblem(EMPTY_NAME); return }
    rename.mutate({ row: target, value });
  };
  return (
    <ModalFrame isOpen={Boolean(target)} onOpenChange={(open) => { if (!open) close() }} width="form">
      <form data-playlist-rename="" onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="flex flex-col gap-4 p-5">
          <Heading slot="title" className="text-title-2-semibold text-text-primary">EditarNombre</Heading>
          <Input ref={input} label="Nombre" placeholder="Introducir nombre" maxLength={80} value={name}
            onChange={(value) => { setName(value); setProblem('') }}
            validationBehavior="aria" isInvalid={Boolean(problem)} hint={problem || undefined} />
        </div>
        <div className="flex justify-between gap-4 p-3">
          <Button variant="secondary" onClick={close}>Cancelar</Button>
          <Button type="submit" {...busyProps(rename.isPending)}>GuardarNombre</Button>
        </div>
      </form>
    </ModalFrame>
  );
}

/** 卡片derechaabajoese点点点: Editar名称, EliminarReproducirLista. 
 *
 *  触发Clave静止时es透明uno字形, 指arriba或展开才铺uno面,  y RecortarPortadaese同uno副
 *  (`../cover-crop/cover-crop-page.tsx`). BoardUI Imagen标钮静止态都Con面: `ghost` esuno
 *  superficial蓝, `IconButton` es白底描边, 每卡都顶着uno, 署名行就No再SoloesAvataryTítulo.  */
function PlaylistMenu({ name, onRename, onDelete }: { name: string; onRename(): void; onDelete(): void }) {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const run = (action: () => void) => { setOpen(false); action() };
  return (
    <>
      <button ref={trigger} type="button" title="Más acciones" aria-label={`Lista de reproducciónAcción: ${name}`}
        aria-haspopup="dialog" aria-expanded={open} data-playlist-menu="" onClick={() => setOpen(true)}
        className="flex size-7.5 flex-none cursor-pointer items-center justify-center rounded-2lg text-foreground-icon-secondary outline-none transition-colors hover:bg-background-primary-hover hover:text-foreground-icon-primary aria-expanded:bg-background-primary-hover aria-expanded:text-foreground-icon-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring">
        <ELLIPSIS aria-hidden className="size-4.5" />
      </button>
      <Popover triggerRef={trigger} isOpen={open} onOpenChange={setOpen}
        placement="bottom end" offset={4} className={MENU_POPOVER_SURFACE}>
        {/* 面板exteriorancho 172px, 同antiguo卡片菜单: exterior框再加 10px Rellenoy 1px 描边.  */}
        <Dialog aria-label={`Lista de reproducciónAcción: ${name}`} className="flex w-37.5 flex-col gap-0.5 outline-none">
          <button type="button" className={MENU_ROW} onClick={() => run(onRename)}>
            <PENCIL aria-hidden className="size-4 shrink-0" />Editar名称
          </button>
          <button type="button" className={MENU_ROW} onClick={() => run(onDelete)}>
            <TRASH aria-hidden className="size-4 shrink-0" />EliminarReproducirLista
          </button>
        </Dialog>
      </Popover>
    </>
  );
}

export function PlaylistsPage({ openPlaylist, openEntity, canFlip, toast, revision }: PlaylistsProps) {
  const playlists = useQuery({ queryKey: PLAYLISTS_KEY, queryFn: ({ signal }) => fetchPlaylists(signal) });
  const [renaming, setRenaming] = useState<PlaylistRow | null>(null);
  /* 壳要求pesado读: primero帧eseuno代ya经由 `prefetch` 取过, 之posterior每加uno次pesado取uno次.  */
  const seen = useRef(revision);
  useEffect(() => {
    if (seen.current === revision) return;
    seen.current = revision;
    void refreshPlaylists();
  }, [revision]);

  const data = playlists.data;
  const items = data?.items ?? [];

  const remove = (row: PlaylistRow) => {
    void confirmModal({
      title: 'EliminarLista de reproducción', body: 'esteLista de reproducción将被Eliminar, VideosArchivoConservar. ', confirmLabel: 'EliminarLista de reproducción', danger: true,
      onConfirm: async () => {
        const kept = await keepPlaylist(row.id);
        await deletePlaylist(row.id);
        void refreshPlaylists();
        toast('YaEliminarLista de reproducción', kept ? { undo: undoing(() => recreatePlaylist(kept)) } : undefined);
      },
    });
  };

  return (
    <div className="w-full pt-1 pb-10.5">
      <header className="mb-4 flex items-start justify-between gap-4.5 max-board-narrow:flex-col max-board-narrow:items-stretch">
        <div>
          {/* 遗Deja样表ese `.stats h2` NoEn层dentro, dos级Título定成 24px(estrecho屏 20px), 工具类压No过, 
              字形带 `!`; 它给 4px 底距yesteen la `mb-1` 相同.  */}
          <h2 className="mb-1 text-display-4-medium! text-text-primary">Lista de reproducción</h2>
          <p className="text-body-2-regular text-text-secondary">Guardar Mix y continuar en tu orden.</p>
        </div>
        <CreateForm toast={toast} />
      </header>
      <div className="mx-auto w-full max-w-board">
      {/* 读取Fallo时página头yNuevo框照常En, SugerenciayReintentarClave落EnListaUbicaciónarriba.  */}
      {!data
        ? (playlists.isError
          ? <RetryNote message={errorMessage(playlists.error) || 'Lista de reproducción读取Fallido'} onRetry={() => void playlists.refetch()} />
          : null)
        : items.length
        ? (
          <div data-playlist-grid="" className="card-grid-cover gap-4.5">
            {items.map((row) => {
              const resume = resumeAssetId(row);
              const name = row.name.trim() || 'No命名Lista de reproducción';
              return (
                <MixCard key={row.id} data-playlist-card={String(row.id)} name={name}
                  caption={row.source_kind === 'mix' ? '由 Mix Guardar' : 'ManualLista de reproducción'}
                  count={row.item_count}
                  poster={row.preview_asset_id ? posterUrl(row.preview_asset_id) : null}
                  flipImages={async () => (row.preview_ids || []).map(posterUrl)}
                  canFlip={canFlip} faces={row.faces || []} onOpenEntity={openEntity}
                  {...(resume ? { onOpen: () => openPlaylist(row.id, resume) } : {})}
                  openLabel={`AbrirLista de reproducción ${name}`}
                  menu={<PlaylistMenu name={name} onRename={() => setRenaming(row)} onDelete={() => remove(row)} />} />
              );
            })}
          </div>
        )
        : (
          <EmptyState icon={PLAYLIST} title="Aún no hayLista de reproducción">
            Guardar Mix 或NuevoListaposterior, 会Enaquí按自己顺序ContinuarReproducir. 
          </EmptyState>
        )}
      </div>
      <RenameDialog target={renaming} close={() => setRenaming(null)} toast={toast} />
    </div>
  );
}
