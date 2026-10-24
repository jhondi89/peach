/* 添加 JAV 订阅: IntroducirActriz名, 到 JavDB 搜她演员卡, 勾选posterior登记到她名abajoy订arriba(ADR-0083). 
 *
 * EncontrarSoloes列出候选, No写任何东西: 同名人站arribapuede能No止uno, 替用户决定"就eseste"es错. 
 * 名字对得arriba, 又SoloConuno人ese几先勾arriba, 其余要用户自己点. 地址仍由服务端按勾选 id 拼, 
 * página面从头到尾No送地址. esteEnDatosBibliotecadentroNo存En也puede以订: 服务端会Nuevo她.  */
import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { RiSearchLine } from '@remixicon/react';

import { Chip } from '@/components/base/badges/chip';
import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Input } from '@/components/base/input/input';

import { cardClass } from '../components/card';
import { Note } from '../components/note';
import { ExternalLink, FieldLabel, Help } from '../settings/section';
import { busyProps, useAction } from '../settings/use-action';
import { followFeedByName, lookupFeedActor, type FeedCandidate, type FeedLookup } from './follow-manage';

const PLACEHOLDER = 'IntroducirActriz名, 到 JavDB 找她演员página';

export interface AddFeedProps {
  readOnly: boolean;
  toast(message: string): void;
  /** 订arriba之posterior让清单pesado取.  */
  onAdded(): void;
}

/** 勾abajo去会登记到谁名abajo: 先ver勾选卡ya经En谁名abajo, 再verDatosBibliotecadentro按名字认得出谁, 都Sin就Nuevo.  */
function destination(result: FeedLookup, picked: ReadonlySet<string>): { text: string; blocked: boolean } {
  const holders = new Map<number, string>();
  for (const card of result.candidates) {
    if (picked.has(card.id) && card.held_by) holders.set(card.held_by.id, card.held_by.name);
  }
  if (holders.size > 1) {
    return { text: `所勾卡分属Base de datosdentroNo同人: ${[...holders.values()].join(', ')}, 先去Fusionar再订`, blocked: true };
  }
  const [holder] = holders.values();
  if (holder) return { text: `会登记到"${holder}"名abajo`, blocked: false };
  if (result.known) return { text: `会登记到Base de datosen la"${result.known.name}"名abajo`, blocked: false };
  return { text: `Base de datosdentroAún no hay"${result.q}", 会Nuevouno resultado(s)`, blocked: false };
}

function CandidateRow({ card, picked, onPick }: { card: FeedCandidate; picked: boolean; onPick(on: boolean): void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Checkbox isSelected={picked} onChange={onPick}>
        <span className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="min-w-0 break-words">{card.names.join(', ')}</span>
          {card.record ? <Chip variant="caption" color="neutral">{card.record}</Chip> : null}
          {card.held_by ? (
            <small className="text-caption-1-regular text-text-secondary">{`YaEn"${card.held_by.name}"名abajo`}</small>
          ) : null}
        </span>
      </Checkbox>
      <ExternalLink href={card.url}>{card.id}</ExternalLink>
    </div>
  );
}

export function AddFeed({ readOnly, toast, onAdded }: AddFeedProps) {
  const [name, setName] = useState('');
  const [result, setResult] = useState<FeedLookup | null>(null);
  const [picked, setPicked] = useState<ReadonlySet<string>>(new Set<string>());
  const action = useAction();

  const search = () => {
    const q = name.trim();
    if (!q || readOnly) return;
    void action.run('lookup', (signal) => lookupFeedActor(q, signal), (found) => {
      setResult(found);
      setPicked(new Set(found.suggested));
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); search() }
  };
  const close = () => { setResult(null); setPicked(new Set()); action.setError('') };
  const add = () => {
    if (!result) return;
    void action.run('follow', (signal) => followFeedByName(result.q, [...picked], signal), (done) => {
      toast(done.created
        ? `YaNuevo"${done.entity_name}"ySuscribirse她Nuevas obras`
        : `Suscrito"${done.entity_name}"Nuevas obras`);
      setName('');
      close();
      onAdded();
    });
  };

  const where = result ? destination(result, picked) : null;

  return (
    /*  y "添加关注"eseuno同uno形: unoIntroduce充卡, TítuloEn卡dentro.  */
    <div className={cardClass({ padding: 'none', className: 'flex flex-col gap-4 px-6 py-5 max-sm:px-4' })}>
      <h3 className="text-title-2-medium text-text-primary">Añadir Suscripción JAV</h3>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-64 grow">
          <Input aria-label="Actriz名" placeholder={PLACEHOLDER} value={name} leadingIcon={RiSearchLine}
            enterKeyHint="search" isDisabled={readOnly} onChange={setName} onKeyDown={onKeyDown} />
        </div>
        <Button variant="primary" disabled={readOnly || !name.trim()} {...busyProps(action.busy === 'lookup')}
          onClick={search}>Buscar</Button>
      </div>

      {action.error ? <Note tone="error" title="No se completó esta vez">{action.error}</Note> : null}

      {result ? (
        <div className="flex flex-col gap-3">
          <FieldLabel>Tarjeta de actor en JavDB</FieldLabel>
          {result.candidates.length ? result.candidates.map((card) => (
            <CandidateRow key={card.id} card={card} picked={picked.has(card.id)}
              onPick={(on) => setPicked((now) => {
                const next = new Set(now);
                if (on) next.add(card.id); else next.delete(card.id);
                return next;
              })} />
          )) : <Help>Nombre no encontrado en JavDB.</Help>}
          {result.candidates.length ? (
            <Help role="status">{picked.size ? where!.text : '勾选她演员卡; Con碼y無碼两 registro(s)都Sí她话, 两 imagen(es)都勾. '}</Help>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            {result.candidates.length ? (
              <Button variant="primary" size="small" disabled={readOnly || !picked.size || where!.blocked}
                {...busyProps(action.busy === 'follow')} onClick={add}>{`AñadirSuscribirse(${picked.size})`}</Button>
            ) : null}
            <Button variant="secondary" size="small" onClick={close}>Desactivar</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
