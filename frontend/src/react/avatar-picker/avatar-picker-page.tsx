/* 换Avatar: 资料página圆框角arribaese加号. 
 *
 * 自动挑ese按来源Prioridad来, 而ese顺序回答es"先试哪uno", Noes"哪uno适合当
 * Avatar"—ImagenBibliotecadentro排No.uno常常es压着书名写真Portada, 同uno人往abajo翻几就Con片商正脸
 * OriginalImagen. 所以aquíNo做更聪明自动挑选, Solo候选摊开让人veruno眼就能换. 
 *
 * esteuno屏要回答es"换成哪uno", 所以候选Cuadrícula占掉en proceso间Todoalto度, 头部 y 底abajoese排操作
 * 固定No动, SoloConCuadrícula滚. 候选到点开弹层才取: 资料página每进uno次就预取uno遍, más数时候没人点. 
 * 弹层exterior壳es `../components/modal-frame.tsx`.  */
import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import { RiAddLine, RiCloseLine, RiUserLine } from '@remixicon/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Heading } from 'react-aria-components';

import { Chip } from '@/components/base/badges/chip';
import { Button } from '@/components/base/buttons/button';
import { IconButton } from '@/components/base/buttons/icon-button';
import { Input } from '@/components/base/input/input';

import { errorMessage } from '../../api';
import {
  centeredBox, isUsableSize, previewStyle, windowStyle, type CropBox, type CropSize,
} from '../../crop-geometry';
import type { AvatarPickerProps } from '../bundle';
import { ModalFrame, ModalGlyph } from '../components/modal-frame';
import { Note } from '../components/note';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { CropFrame } from '../crop/crop-frame';
import { queryClient } from '../query';
import { busyProps } from '../settings/use-action';
import {
  avatarChoicesKey, baseLabel, baseVersion, choiceDetail, choiceFrame, choiceImageUrl, cropNote,
  fetchAvatarChoices, fetchCodeCover, frameAddress, frameChoice, frameFile, framesItself, indexNote,
  pickerNote, sendAvatarPick, sharedCast,
  type AvatarChoice, type AvatarSubmission,
} from './avatar-picker';

/** 候选还没回来时摆几格占: uno排cuatro格摆两排,  y 最常见uno屏候选差Nomásalto.  */
const SKELETON_TILES = 8;
/** 格子Relación, y `--aspect-avatar-choice` 同uno数.  */
const TILE_ASPECT = 3 / 4;

/** 框选eseuno步框es哪Imagen: 服务端eseuno格, 或者本机选Archivo(SoloEnExplorar dispositivodentroVista previa).  */
interface Cropping { choice: AvatarChoice; file?: File }

/** 进框选cuatro路. 都要先问服务端uno次: ImagenConmásgrande, 脸En哪.  */
type Opening =
  | { via: 'choice'; choice: AvatarChoice }
  | { via: 'code'; code: string }
  | { via: 'url'; url: string }
  | { via: 'file'; file: File };

/** 框选交回来eseuno; null esCompleto装.  */
type CropPick = { ref: string; crop: CropBox; version: string } | null;

async function openCrop(kind: string, id: number, wanted: Opening): Promise<Cropping> {
  switch (wanted.via) {
    case 'choice': return { choice: await frameChoice(kind, id, wanted.choice) };
    case 'code': return { choice: await fetchCodeCover(wanted.code) };
    case 'url': return { choice: await frameAddress(kind, id, wanted.url) };
    case 'file': return { choice: await frameFile(kind, id, wanted.file), file: wanted.file };
  }
}

export function AvatarPicker({ kind, entityId, name, onPicked }: AvatarPickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* 加号压En圆框derechaabajo角eseuno圈arriba—它属于esteAvatar, 离得远就成página面AnteriorNo知道
          管什么按钮. 定归exterior面esteuno层; AvatareseImagen自己带 `z-index:1`, esteuno层要抬到它arriba面, 
          No然按钮Conunomedio藏EnImagen底abajo. 按钮收成 28px 圆—它坐Enuno圆边arriba, 方钮压En弧线
          arriba会遮掉unogrande脸; uno圈página面底色描边它 y Imagen分开. BoardUI  IconButton SoloCon方形, 
          形状归组件自己管, 所以aquíesunoOriginal生按钮, 底色, 描边, Pasar el ratóny焦点环取它同uno套 token. 
          Pasar el ratón时底色透出身posterior脸: 暗色ese档Pasar el ratón色本来就带 60% 透明, superficial色ese档es实色, 
          aquí给它补同样 60%, 两档读起来es同uno动作.  */}
      <span className="absolute right-1 bottom-1 z-10">
        <button type="button" aria-haspopup="dialog" aria-label={`更换${name}Avatar`}
          onClick={() => setOpen(true)}
          className="flex size-7 cursor-pointer items-center justify-center rounded-full border border-border-button-default bg-background-primary-default text-foreground-icon-primary shadow-xs outline-none ring-2 ring-background-full transition-colors hover:border-border-button-hover hover:bg-background-primary-hover/60 dark:hover:bg-background-primary-hover focus-visible:ring-border-focus-ring active:bg-background-primary-active">
          <RiAddLine aria-hidden className="size-4" />
        </button>
      </span>
      <ModalFrame isOpen={open} onOpenChange={setOpen} width="avatar-picker" label="Cambiar avatar">
        <PickerBody kind={kind} entityId={entityId} name={name} onPicked={onPicked}
          close={() => setOpen(false)} />
      </ModalFrame>
    </>
  );
}

/** 弹层contenido. SoloEn弹层开着时挂载, 候选也就SoloEneste时候取.  */
function PickerBody({ kind, entityId, name, onPicked, close }: AvatarPickerProps & { close(): void }) {
  const file = useRef<HTMLInputElement>(null);
  const grid = useOverlayScrollbar<HTMLDivElement>();
  const [url, setUrl] = useState('');
  const [code, setCode] = useState('');
  /* 每unoImagen点开都es框选, Noes当场换Imagen: ImagenBiblioteca人像másesTodo身竖Imagen, Completo装进圆框脸Solo占
     unopequeño. Completo屏换掉而Noes再叠uno层弹层: esteuno步要es尽puede能grande底Imagen, 而弹层套弹层Solo会
     让底Imagen更pequeño.  */
  const [cropping, setCropping] = useState<Cropping | null>(null);
  const key = avatarChoicesKey(kind, entityId);
  const picked = useRef(false);

  const listing = useQuery({
    queryKey: key,
    queryFn: ({ signal }) => fetchAvatarChoices(kind, entityId, signal),
    // Anterior次点开没取到就pesado来. 取到过eseunoDeja着, 反复开合No必每次再问uno遍. 
    retryOnMount: true,
  });
  /* 换Éxito之posterioresteuno候选dentro"En用"es哪uno格ya经过期, 扔掉它, abajo次点开pesadoNuevo取. 要etc.到弹层
     真收起来再扔: este时候还Con人En读esteClave, 当场清掉它会立刻再取uno遍, 白问uno趟.  */
  useEffect(() => () => {
    if (picked.current) queryClient.removeQueries({ queryKey: avatarChoicesKey(kind, entityId) });
  }, [kind, entityId]);
  /* tres来源共用uno出口, Éxitoposterior就地关掉y让宿主pesado画. FalloDejaEnOriginal地y说出Original因—
     esteuno步会改掉盘en laImagen, 静predeterminaFalloetc.于让人以Como换bien.  */
  const submit = useMutation({
    mutationFn: (submission: AvatarSubmission) => sendAvatarPick(kind, entityId, submission),
    onSuccess: () => {
      picked.current = true;
      close();
      onPicked();
    },
  });
  /* 进框选之anterioretc.服务端量完再切屏: 先摆居en proceso框, 脸回来再挪, 人puede能ya经En拖. 
     ObrasImageneseuno组No必问, Listadentro就带着尺寸 y 取景区.  */
  const opening = useMutation({
    mutationFn: (wanted: Opening) => openCrop(kind, entityId, wanted),
    onSuccess: setCropping,
  });
  const opens = (via: Opening['via']) => opening.isPending && opening.variables?.via === via;

  function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const chosen = input.files?.[0];
    input.value = '';
    if (chosen && !busy) opening.mutate({ via: 'file', file: chosen });
  }

  /* 框选交回来eseuno按它来路交: 本机Archivo再发uno次Original字节, 其余按 ref. Completo装ese
     No带框, 也No带Versión—CompletoImagenNo存En"框画En哪uno版arriba"问题.  */
  function pickCrop(picked: CropPick) {
    if (submit.isPending || !cropping) return;
    const { choice, file } = cropping;
    if (file) submit.mutate(picked ? { file, crop: picked.crop } : { file });
    else submit.mutate(picked ?? { ref: choice.ref });
  }

  const data = listing.data;
  const choices = data?.choices ?? [];
  const problem = (submit.error ? errorMessage(submit.error) : '')
    || (!cropping && opening.error ? errorMessage(opening.error) : '')
    || (listing.error ? errorMessage(listing.error) : '');
  const busy = submit.isPending || opening.isPending;
  const index = cropping ? '' : indexNote(data);
  // SoloCon候选eseuno没取到时Sugerencia旁边给"Reintentar": 提交 y 取PortadaFallo, pesado来eseseClave自己. 
  const listingFailed = !!problem && !!listing.error && problem === errorMessage(listing.error);
  // 候选取完es空(或没取到)时NoDejaCuadrículaeseuno带: 两分隔线之间空着uno, 读起来像还Enetc.. 
  const showGrid = listing.isPending || choices.length > 0;
  return (
    <>
      {/* 头部: izquierda边uno方Imagen标槽, derecha边Título加uno句Descripción, derechaarriba角esCerrarClave.  */}
      <div className="flex shrink-0 items-start gap-4 p-5">
        <ModalGlyph><RiUserLine className="size-6" /></ModalGlyph>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Heading slot="title" className="text-title-3-semibold text-text-primary">
              {cropping ? 'Encuadrar el área del avatar' : 'Cambiar avatar'}
            </Heading>
            {!cropping && choices.length ? <Chip color="soft">{choices.length.toLocaleString()} puede选</Chip> : null}
          </div>
          <p className="text-body-2-regular text-text-secondary">
            {cropping ? cropNote(cropping.choice) : pickerNote(name, data)}
          </p>
          {index ? <Note tone="neutral">{index}</Note> : null}
          {problem ? (
            <Note tone="error" action={listingFailed ? (
              <Button variant="secondary" size="small" {...busyProps(listing.isFetching)}
                onClick={() => { if (!listing.isFetching) void listing.refetch() }}>Reintentar</Button>
            ) : undefined}>{problem}</Note>
          ) : null}
        </div>
        <IconButton icon={RiCloseLine} size="small" aria-label="Desactivar" onClick={close} />
      </div>
      {cropping ? (
        <CropStep kind={kind} entityId={entityId} choice={cropping.choice} file={cropping.file}
          busy={submit.isPending} back={() => setCropping(null)} confirm={pickCrop} />
      ) : (
      <>
      {/* 候选Cuadrículaesesteuno屏唯uno会滚层: 头部 y 底abajoese排操作再largo也No动. arribaabajo各Deja 16px: 
          SoloDejaarriba边话, 最posterioruno排Imagen贴着底abajoese线. exterior面esteuno层SoloComo放ese覆盖滚动
          轨道, 它按 `absolute` 铺, 得ConunoSolo裹着滚动本身定祖先.  */}
      {showGrid ? (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div ref={grid} className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t border-separator-border px-5 py-4">
          {/* 候选回来之anterior摆同uno格子占, 格子exterior框, RelaciónyEtiquetaeseuno行都 y 真格子uno样, 
              换arriba真格子时CuadrículaNo跳.  */}
          <div role="listbox" aria-label="Avatar alternativo" aria-busy={listing.isPending || undefined}
            data-skeleton={listing.isPending ? 'avatar-choices' : undefined}
            className="inline-grid grid-cols-3 content-start gap-2 sm:grid-cols-4">
            {listing.isPending ? Array.from({ length: SKELETON_TILES }, (_, index) => (
              <span key={index} aria-hidden data-avatar-skeleton
                className="flex flex-col gap-1 overflow-hidden rounded-2lg border border-separator-border bg-background-secondary-default pb-1 text-caption-1-regular">
                <span className="relative block w-full aspect-avatar-choice skeleton-sheen" />
                <span className="relative mx-auto w-2/3 rounded-sm skeleton-sheen">&nbsp;</span>
              </span>
            )) : choices.map((choice) => (
              <button type="button" key={choice.ref} role="option" data-avatar-choice
                aria-selected={choice.current} title={choiceDetail(choice)} {...busyProps(busy)}
                onClick={() => {
                  if (busy) return;
                  if (choice.crop) setCropping({ choice });
                  else opening.mutate({ via: 'choice', choice });
                }}
                className="relative flex cursor-pointer flex-col gap-1 overflow-hidden rounded-2lg border border-separator-border bg-background-secondary-default pb-1 text-center text-caption-1-regular text-text-secondary outline-none hover:border-border-button-hover hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring aria-selected:border-border-focus-ring aria-selected:bg-background-tertiary-default aria-selected:text-text-primary aria-disabled:cursor-progress aria-disabled:opacity-60">
                <ChoiceImage src={choiceImageUrl(kind, entityId, choice.ref, baseVersion(choice, choice.ref))}
                  choice={choice} />
                <span className="truncate px-1">{choice.label}</span>
                {choice.current
                  ? <span className="absolute top-1 left-1"><Chip variant="caption" color="gray">En uso</Chip></span>
                  : null}
                {/* 合演Portadaarriba最grandeese脸másmedioes领衔另uno, 格子No围着它取景, aquí标出人数.  */}
                {sharedCast(choice)
                  ? <span className="absolute top-1 right-1"><Chip variant="caption" color="gray">{choice.cast.toLocaleString()} 人</Chip></span>
                  : null}
              </button>
            ))}
          </div>
        </div>
      </div>
      ) : null}
      {/* Código JAV, 手Introduce地址 y 本机Archivo跟候选esy列几路, Noes候选ver完之posteriorcomplementar, 所以摆En
          固定eseunodentro: Cuadrícula再largo也No会它们推到verNo见地方.  */}
      <div className="flex shrink-0 flex-col gap-3 border-t border-separator-border p-5">
        {/* Código JAVeseuno会出网, esCon副作用提交, 所以配按钮; 回车照样能交.  */}
        <form className="flex min-w-0 items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (code.trim() && !busy) opening.mutate({ via: 'code', code: code.trim() });
          }}>
          <div className="min-w-0 flex-1">
            <Input aria-label="Código JAV" placeholder="Código JAV, 如 ABW-232" value={code} onChange={setCode} />
          </div>
          <Button type="submit" variant="secondary" disabled={!code.trim()}
            {...busyProps(opens('code'))}>取Portada来框</Button>
        </form>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => file.current?.click()}
            {...busyProps(opens('file'))}>从Esta máquina选Imágenes</Button>
          {/* Original生ArchivoSeleccionarDispositivolargo相Nopuede控, 按钮归 BoardUI, Introducir框SoloDeja着continuarArchivo.  */}
          <input ref={file} type="file" accept="image/png,image/jpeg" tabIndex={-1} aria-hidden
            className="hidden" onChange={pickFile} />
          {/* 地址uno行至menos 224px: estrecho屏abajo y "从本机选Imagen片"挤No进uno行就Completo行换abajo去, Introducir框No被压成uno缝.  */}
          <div className="flex min-w-0 flex-1 basis-56 items-center gap-2">
            <div className="min-w-0 flex-1">
              <Input type="url" aria-label="ImágenesDirección" placeholder="https://..." value={url} onChange={setUrl} />
            </div>
            <Button disabled={!url.trim()} {...busyProps(opens('url'))}
              onClick={() => { if (!busy) opening.mutate({ via: 'url', url: url.trim() }) }}>用esteDirección</Button>
          </div>
        </div>
      </div>
      </>
      )}
    </>
  );
}

/** uno格候选Imagen. Imagen到之anterioreseuno格es Skeleton 微光, 到骨架淡出, Imagen从Difusodentro清晰起来. 
 *
 *  要框横Imagen(ObrasImagen, Código JAVPortada)NoCompleto铺满居en proceso: Portada正en proceso常常es书脊或Fondo, 格子
 *  Enposterior端给取景区dentro取uno 3:4, ver到就es框选eseuno步Predeterminado框住ese脸. 竖ImagenBiblioteca
 *  人像照antiguo `object-cover`.  */
function ChoiceImage({ src, choice }: { src: string; choice: AvatarChoice }) {
  const image = useRef<HTMLImageElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [lost, setLost] = useState(false);
  /* 缓存en laImagenpuede能En挂arriba `onLoad` 之anterior就ya经解码完, eseuno次 `load` No会再来.  */
  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth) setRevealed(true);
  }, []);
  const size = { width: choice.width, height: choice.height };
  const place = framesItself(choice) ? windowStyle(choiceFrame(choice, size, TILE_ASPECT), size) : null;
  const shown = revealed || lost ? true : undefined;
  return (
    <span data-choice-lost={lost || undefined}
      className="relative block w-full aspect-avatar-choice overflow-hidden">
      {/* 取No到Imagen时揭开骨架, 撤掉Imagen: 骨架停Enese儿读成还Enetc., Deja着Imagen就esuno破Imagen标. 
          格子剩uno空底, 名字 y 来源照antiguoEnabajo面ese行y title dentro.  */}
      {lost ? null : <img ref={image} loading="lazy" alt="" src={src} data-revealed={shown}
        onLoad={() => setRevealed(true)} onError={() => setLost(true)}
        className={place
          ? 'reveal-content absolute max-w-none top-(--tile-top) left-(--tile-left) h-(--tile-height) w-(--tile-width)'
          : 'reveal-content absolute inset-0 size-full object-cover'}
        style={place ? {
          '--tile-top': place.top, '--tile-left': place.left,
          '--tile-height': place.height, '--tile-width': place.width,
        } as CSSProperties : undefined} />}
      <span aria-hidden data-revealed={shown}
        className="reveal-skeleton pointer-events-none absolute inset-0 skeleton-sheen" />
    </span>
  );
}

/** 本机ArchivoEnExplorar dispositivoen laVista previa地址. 离开框选就收回, NoDeja着占interior存.  */
function useFileUrl(file: File | undefined): string {
  const [url, setUrl] = useState('');
  useEffect(() => {
    if (!file) return undefined;
    const made = URL.createObjectURL(file);
    setUrl(made);
    return () => URL.revokeObjectURL(made);
  }, [file]);
  return url;
}

/** 框选eseuno步: uno底Imagen, uno方框, uno圆Vista previa. 
 *
 *  Relación锁死 1:1 且No给解锁: Avatar框es圆, 非方Imagen装进去Solo会被再裁uno次, 而No.dos次
 *  裁En哪由 CSS 说算, 人Enaquí框eseuno就No作数. 
 *
 *  Noes非框NopuedeImagen(人像ese几路)másuno"Completo使用": ConImagen本来就esuno合用grande头照.  */
function CropStep({ kind, entityId, choice, file, busy, back, confirm }: {
  kind: string; entityId: number; choice: AvatarChoice; file?: File; busy: boolean;
  back(): void; confirm(picked: CropPick): void;
}) {
  const bases = choice.bases.length ? choice.bases : [choice.ref];
  const [base, setBase] = useState(bases[0]);
  const [size, setSize] = useState<CropSize | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const version = baseVersion(choice, base);
  const fileUrl = useFileUrl(file);
  const src = file ? fileUrl : choiceImageUrl(kind, entityId, base, version);
  const frame = useOverlayScrollbar<HTMLDivElement>();
  /* 换底Imagen就es换unoImagen, Anterior框uno数都NoDeja: 同uno组坐标落En另unoImagenarribaesuno
     错区域, 而错En屏幕arriba y "本来就框Eneste儿"verNo出区别.  */
  function pickBase(next: string) {
    setBase(next);
    setSize(null);
    setBox(null);
  }
  const preview = box && size ? previewStyle(box, size) : null;
  return (
    <>
      <div ref={frame} className="flex min-h-0 flex-1 flex-col items-center gap-4 overflow-y-auto border-t border-separator-border px-5 py-4">
        {src ? (
          <CropFrame src={src} aspect={1} box={box} size={size}
            label={`${choice.label} Avatar取景框`}
            onSize={(next) => {
              setSize(next);
              /* esteuno格自己eseImagen从取景区dentro落Predeterminado框: 检出脸就正bienes批Procesar会截eseuno. 
                 换成nueve宫格某uno格就居en proceso, 取景区Solo对它自己ese作数.  */
              if (isUsableSize(next)) {
                setBox(base === choice.ref ? choiceFrame(choice, next, 1) : centeredBox(next, 1));
              }
            }}
            onBox={setBox} />
        ) : null}
        {/* 底Imageneseuno排: Portada加nueve宫格nueve格. uno部Obrasdentro哪uno格Con正脸, Solo能ver着换.  */}
        {bases.length > 1 ? (
          <div role="radiogroup" aria-label="Imagen de fondo" className="flex flex-wrap justify-center gap-2">
            {bases.map((ref) => (
              <button type="button" key={ref} role="radio" aria-checked={ref === base}
                data-crop-base onClick={() => pickBase(ref)}
                className="cursor-pointer rounded-lg px-2 py-1 text-caption-1-regular text-text-secondary outline-none hover:text-text-primary focus-visible:ring-2 focus-visible:ring-border-focus-ring aria-checked:bg-background-tertiary-default aria-checked:text-text-primary">
                {baseLabel(ref)}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3 border-t border-separator-border p-5">
        {/* 圆Vista previa就es它arriba线之posterior样子. FondoImagen y arriba面esees同uno地址, Nomás取uno次.  */}
        <span aria-hidden data-crop-preview
          className="size-crop-preview shrink-0 rounded-full border border-separator-border bg-background-secondary-default bg-(image:--crop-preview) bg-(position:--crop-preview-at) bg-(length:--crop-preview-size) bg-no-repeat"
          style={preview ? {
            '--crop-preview': `url("${src}")`,
            '--crop-preview-size': preview.size,
            '--crop-preview-at': preview.position,
          } as CSSProperties : undefined} />
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" onClick={back} {...busyProps(busy)}>Volver备选Imágenes</Button>
          {choice.crop ? null : (
            <Button variant="secondary" {...busyProps(busy)}
              onClick={() => { if (!busy) confirm(null) }}>Completo imagen(es)使用</Button>
          )}
          <Button disabled={!box || !size} {...busyProps(busy)}
            onClick={() => { if (box && !busy) confirm({ ref: base, crop: box, version }) }}>Usar este bloque</Button>
        </div>
      </div>
    </>
  );
}
