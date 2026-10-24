/* 复核卡片en proceso段eseuno框证据: 来源Imagen片, Original视频入口, 创作者入口, 身证据, Obras样本nueve宫格. 
 *
 * vereste几帧, 然posterior读esteuno句, es同uno件事两medio, 所以它们合成卡片en proceso段eseuno框. 候选表单 y 
 * 身证据No进框: 它们每uno项自己就esuno框, 再套uno层就es框en proceso框.  */
import { useEffect, useState } from 'react';
import { RiExternalLinkLine, RiPlayLine } from '@remixicon/react';
import { VisuallyHidden } from 'react-aria-components';
import { spinnerHtml } from '@peach/legacy/ui';

import { Button, ButtonLink } from '@/components/base/buttons/button';
import { CheckboxGlyph } from '@/components/base/checkbox/checkbox-glyph';
import { LEGACY_AVATAR_IMG } from '../components/legacy-avatar';
import { busyProps } from '../settings/use-action';
import type { ReviewAsset, ReviewRow } from './review';

/** Solo放行 http(s) y站interior绝对Ruta. 候选Archivodentroeseuno列什么都puede能Con.  */
const webUrl = (value = '') => (/^https?:\/\//i.test(value) ? value : '');
const imageUrl = (value = '') =>
  webUrl(value) || (value.startsWith('/') && !value.startsWith('//') ? value : '');

/** 来源给eseImagen. 取No到时说清楚es"no取得", NoDejauno格空白让人以Como界面坏.  */
export function SourceImage({ url }: { url?: string }) {
  const source = imageUrl(url || '');
  return <RequestedSourceImage key={source} source={source} />;
}

function RequestedSourceImage({ source }: { source: string }) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle');
  useEffect(() => {
    if (status !== 'loading') return;
    const timer = setTimeout(() => setStatus('failed'), 30_000);
    return () => clearTimeout(timer);
  }, [status]);
  return (
    <div className="relative flex h-review-image items-center justify-center overflow-hidden rounded-surface bg-background-secondary-default">
      {status === 'loading' ? <span role="status" className="absolute flex items-center gap-2 text-body-2-regular text-text-secondary">
        <span dangerouslySetInnerHTML={{ __html: spinnerHtml('CargandoImágenes') }} />En cursoCargarImagen片
      </span> : null}
      {source && (status === 'loading' || status === 'ready')
        ? <img src={source} alt="Fuente提供备选Imágenes" referrerPolicy="no-referrer" decoding="async"
            className={`size-full object-contain ${status === 'loading' ? 'invisible' : ''}`} onLoad={() => setStatus('ready')}
            onError={() => setStatus('failed')} />
        : source ? <div className="flex flex-col items-center gap-2">
            {status === 'failed' ? <span className="text-body-2-regular text-text-secondary">No disponibleFuenteImágenes</span> : null}
            <Button variant="secondary" size="small" onClick={() => setStatus('loading')}>
              {status === 'failed' ? 'pesadoNuevoCargarImágenes' : 'verFuenteImágenes'}
            </Button>
          </div> : <span className="text-body-2-regular text-text-secondary">No disponibleFuenteImágenes</span>}
    </div>
  );
}

/** unoOriginal视频: Portada, Archivo名, Abrir.  */
export function OriginAsset(
  { asset, openItem }: { asset: ReviewAsset; openItem(id: number): void },
) {
  const name = asset.name || '';
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-surface bg-background-secondary-default p-2">
      <button type="button" onClick={() => openItem(asset.id)}
        className="flex aspect-card-cover w-review-cover-narrow shrink-0 review-tight:w-review-cover cursor-pointer items-center justify-center overflow-hidden rounded-2lg bg-background-tertiary-default outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring">
        {asset.preview_url
          ? <img src={asset.preview_url} alt="" loading="lazy" className="size-full object-cover" />
          : <span className="text-caption-1-regular text-text-secondary">Sin portada</span>}
        <VisuallyHidden>{`AbrirOriginalVideos ${name}`}</VisuallyHidden>
      </button>
      <div className="flex min-w-0 flex-col items-start gap-1">
        <b title={name} className="w-full truncate text-body-medium text-text-primary">
          {asset.code || name || 'OriginalVideos'}
        </b>
        <Button variant="secondary" size="small" leadingIcon={RiPlayLine}
          onClick={() => openItem(asset.id)}>AbrirOriginalVideos</Button>
      </div>
    </div>
  );
}

/** 主体esuno创作者而Noes某unoObras时卡头: 脸, 名字, Obras数. 
 *
 *  este类候选判es"este创作者"—创作者Etiquetaveres他TodoObras该打什么Etiqueta, 西方身回配
 *  vereseste人对No对得arriba. 从样本dentro挑uno画成"Original视频"读起来就es错: abajo面 60 样本, 
 *  arriba面 1 视频.  */
export function EntityHead(
  { kind, name, works, avatar, openEntity }: {
    kind: string; name: string; works: number; avatar: string;
    openEntity(kind: string, name: string): void;
  },
) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {/* `card-art`  `avatarInner` es唯unoese"ConImagen走Imagen, 没Imagen退primero字母"实现, página面Nopesado画uno遍.  */}
      <button type="button" aria-label={`AbrirCreadorPágina: ${name}`} onClick={() => openEntity(kind, name)}
        className={`relative inline-grid size-11 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-background-secondary-default text-caption-1-medium text-text-secondary outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring ${LEGACY_AVATAR_IMG}`}
        dangerouslySetInnerHTML={{ __html: avatar }} />
      <div className="flex min-w-0 flex-col items-start">
        <button type="button" onClick={() => openEntity(kind, name)}
          className="max-w-full cursor-pointer truncate text-body-medium text-text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-border-focus-ring">
          {name}
        </button>
        {works
          ? <small className="tabular-nums text-body-2-regular text-text-secondary">{`${works.toLocaleString()}  obra(s)`}</small>
          : null}
      </div>
    </div>
  );
}

/** 西方身回配证据: 候选身, 来源资料链continuar, 来源Imagen片, 本地Obras样本.  */
export function IdentityEvidence(
  { row, openItem, openEntity, onReveal, revealing, note }: {
    row: ReviewRow;
    openItem(id: number): void;
    openEntity(kind: string, name: string): void;
    onReveal(id: number): void;
    revealing: number;
    note: string;
  },
) {
  const profile = webUrl(row.profile_url || '');
  const samples = (row.preview_assets || []).slice(0, 6);
  const works = Math.max(0, Number(row.video_count || row.videos || 0));
  return (
    <section className="flex flex-col gap-3">
      <h5 className="text-body-medium text-text-primary">{`PendienteConfirmarPersona: ${row.babepedia_name || 'No标注'}`}</h5>
      <div className="flex flex-wrap items-center gap-2">
        {profile
          ? <ButtonLink variant="secondary" size="small" trailingIcon={RiExternalLinkLine}
              href={profile} target="_blank" rel="noopener noreferrer">FuenteDetalles</ButtonLink>
          : null}
        <Button variant="secondary" size="small"
          onClick={() => openEntity('creator', row.creator || '')}>
          {`verTodo ${works.toLocaleString()}  obra(s)`}
        </Button>
      </div>
      <SourceImage url={row.preview_url} />
      <p className="text-body-2-regular text-text-secondary">AceptarposteriorRegistro身判断. </p>
      {samples.length ? <>
        <h5 className="text-body-medium text-text-primary">LocalObra样本</h5>
        <ul className="flex flex-col gap-1">
          {samples.map((asset) => (
            <li key={asset.id} className="flex min-w-0 items-center gap-2">
              <Button variant="ghost" size="small" className="min-w-0"
                onClick={() => openItem(asset.id)}>
                <span title={asset.name} className="block max-w-full truncate">{asset.name}</span>
              </Button>
              <Button variant="ghost" size="small" aria-label={`Abrir ${asset.name} ArchivoPosición`}
                {...busyProps(revealing === asset.id)}
                onClick={() => onReveal(asset.id)}>ArchivoPosición</Button>
            </li>
          ))}
        </ul>
      </> : <p className="text-body-2-regular text-text-secondary">暂NingunoLocalObra样本, AbrirTodo obra(s)核对. </p>}
      {note ? <p role="status" className="text-body-2-regular text-text-error-primary">{note}</p> : null}
    </section>
  );
}

/** 创作者Etiquetaeseuno类Obras样本: 点unoabajoCambiar, Shift 选uno段— y 主Cuadrícula同uno套Seleccionar语义, 
 *  NoComoesteunopágina另造uno"más选Modo".  */
export function AssetPicker(
  { assets, picked, onPicked, locked }: {
    assets: ReviewAsset[];
    picked: number[];
    onPicked(next: number[]): void;
    locked: boolean;
  },
) {
  const [anchor, setAnchor] = useState<number | null>(null);
  const chosen = new Set(picked);
  const toggle = (index: number, range: boolean) => {
    if (locked) return;
    const next = new Set(chosen);
    if (range && anchor !== null) {
      const [from, to] = [Math.min(anchor, index), Math.max(anchor, index)];
      for (let at = from; at <= to; at++) next.add(assets[at]!.id);
    } else {
      const id = assets[index]!.id;
      if (next.has(id)) next.delete(id); else next.add(id);
    }
    setAnchor(index);
    onPicked(assets.filter((asset) => next.has(asset.id)).map((asset) => asset.id));
  };
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="tabular-nums text-body-2-regular text-text-secondary">
          {`Ya选 ${chosen.size} / ${assets.length}`}
        </span>
        <Button variant="ghost" size="small" disabled={locked}
          onClick={() => onPicked(assets.map((asset) => asset.id))}>Seleccionar todo</Button>
        <Button variant="ghost" size="small" disabled={locked}
          onClick={() => onPicked([])}>Limpiar</Button>
      </div>
      <div className="review-asset-grid gap-1.5">
        {assets.map((asset, index) => {
          const on = chosen.has(asset.id);
          return (
            <button key={asset.id} type="button" aria-pressed={on} title={asset.name}
              onClick={(event) => toggle(index, event.shiftKey)}
              className={`relative aspect-card-cover cursor-pointer overflow-hidden rounded-surface bg-background-tertiary-default outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-border-focus-ring ${on ? 'opacity-100 ring-2 ring-border-button-active ring-inset' : 'opacity-50'}`}>
              <img src={`/poster?id=${asset.id}&c=4`} alt="" loading="lazy"
                className="size-full object-cover" />
              {/* 勾选样子归Registrarse表dentroeseuno: aquíNo另画uno, 免得同unopágina出现两"ya选".  */}
              <span className="absolute top-1 right-1">
                <CheckboxGlyph size="sm" state={{ isSelected: on, isIndeterminate: false,
                  isFocusVisible: false, isDisabled: locked, isHovered: false }} />
              </span>
              <VisuallyHidden>{`${on ? 'Ya选' : 'No选'} ${asset.name || asset.id}`}</VisuallyHidden>
            </button>
          );
        })}
      </div>
    </div>
  );
}
