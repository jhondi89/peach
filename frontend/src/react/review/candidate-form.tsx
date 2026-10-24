/* Metadatos字段eseuno类卡片正文: uno组互斥来源值, 加arriba还没收录 genre. 
 *
 * uno候选卡arribaabajo两段读es两件事: arriba段eseste来源给ese值, 也就es选en proceso它就会写进DatosBiblioteca
 * 东西; abajo段es同uno来源顺带交回来其它字段, Solo作判断依据. 两段各自铺底色y由uno线
 * 隔开, 选哪uno段能改DatosBiblioteca就No用猜.  */
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Radio, RadioGroup } from 'react-aria-components';

import { Button } from '@/components/base/buttons/button';
import { InputBase, TextField } from '@/components/base/input/input';
import { errorMessage } from '../../api';
import type { ReviewCandidate, ReviewRow } from './review';
import { pendingGenres, recordGenre, reloadReview } from './review';

/** 候选顺带交回来ese些字段En界面arriba叫什么. 表dentroSin按Original名显示.  */
const EVIDENCE_LABELS: Record<string, string> = {
  title: 'Título', original_title: 'OriginalTítulo', runtime: 'FuenteDuración', director: 'Director',
  label: 'Label', poster_url: 'Póster', cover_url: 'Portada', screenshot_urls: 'Captura de pantalla',
  trailer_url: 'Tráiler',
};

/** 收录 genre 时候选词表, uno挂EnCompletopáginaarriba: 每卡各写uno遍话, 同unocien来 option 会En
 *  DOM dentroRepetir几diez.  */
export const GENRE_TAGS_ID = 'reviewgenretags';

export function GenreTagList({ tags }: { tags: string[] }) {
  if (!tags.length) return null;
  return (
    <datalist id={GENRE_TAGS_ID}>
      {tags.map((tag) => <option key={tag} value={tag} />)}
    </datalist>
  );
}

/** uno来源给值, 加arriba它顺带交回来判断依据.  */
function CandidateBody(
  { candidate, selectable = false }: { candidate: ReviewCandidate; selectable?: boolean },
) {
  const evidence = Object.entries(candidate.catalog_evidence || {})
    .filter(([, item]) => item && item.display_value);
  const id = candidate.content_id || candidate.provider_id;
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="relative flex min-w-0 flex-col gap-0.5 px-4 py-3 group-hover:bg-background-primary-hover group-data-selected:bg-background-primary-hover">
        <b className="text-body-2-medium text-text-secondary">
          {candidate.source}
          {candidate.official ? ' · Oficial优先' : ''}
          {id ? ` · ID ${id}` : ''}
        </b>
        <span className="text-body-medium break-words text-text-primary">
          {candidate.display_value || ''}
        </span>
        {(candidate.warnings || []).map((warning) => (
          <i key={warning} className="text-body-2-regular text-status-yellow-text">{warning}</i>
        ))}
        {selectable ? (
          <span aria-hidden="true" data-candidate-choice
            className="absolute top-4 right-4 inline-grid size-4 place-items-center rounded-full border border-border-checkbox-default bg-background-primary-default group-hover:border-border-checkbox-hover group-data-selected:border-border-focus-ring group-data-selected:bg-accent-600">
            <span className="size-1.5 rounded-full bg-text-white opacity-0 group-data-selected:opacity-100" />
          </span>
        ) : null}
      </span>
      {evidence.length ? (
        <dl className="flex flex-col gap-1 border-t border-separator-border bg-background-primary-default px-4 py-2.5">
          {evidence.map(([field, item]) => (
            <div key={field} className="flex min-w-0 flex-wrap gap-x-2">
              <dt className="text-body-2-regular text-text-secondary">
                {EVIDENCE_LABELS[field] || field}
              </dt>
              <dd className="min-w-0 text-body-2-regular break-words text-text-primary">
                {item.display_value}
              </dd>
              {(item.warnings || []).map((warning) => (
                <small key={warning} className="w-full text-caption-1-regular text-status-yellow-text">
                  {warning}
                </small>
              ))}
            </div>
          ))}
        </dl>
      ) : null}
    </span>
  );
}

/** 互斥几来源值. SoloConuno候选时没什么puede选: 单选圈Solo会让人以Como还Con别Opciones, 
 *  所以改成纯展示, 而提交仍按esteuno候选走.  */
export function CandidateChoices(
  { row, fieldName, value, onChange, locked }: {
    row: ReviewRow;
    fieldName: string;
    value: string;
    onChange(candidateKey: string): void;
    locked: boolean;
  },
) {
  const candidates = row.candidates || [];
  if (!candidates.length) return null;
  if (candidates.length === 1) {
    return (
      <div className="flex overflow-hidden rounded-surface border border-separator-border bg-background-secondary-default">
        <CandidateBody candidate={candidates[0]!} />
      </div>
    );
  }
  return (
    <RadioGroup aria-label={`${fieldName || 'Detalles'}Fuente`} value={value} isDisabled={locked}
      onChange={onChange} className="flex flex-col gap-2">
      {candidates.map((candidate) => (
        <Radio key={candidate.candidate_key} value={candidate.candidate_key}
          className="group flex cursor-pointer items-center gap-2 overflow-hidden rounded-surface border border-separator-border bg-background-secondary-default outline-none focus-visible:ring-2 focus-visible:ring-border-focus-ring data-selected:border-border-button-active data-disabled:cursor-not-allowed">
          <CandidateBody candidate={candidate} selectable />
        </Radio>
      ))}
    </RadioGroup>
  );
}

/** uno还没收录 genre. 给en proceso文名就es收录成eseEtiqueta, 判"Noescontenido"就es永久Excluir.  */
function GenreRow(
  { genre, tags, locked, toast }: {
    genre: string; tags: string[]; locked: boolean; toast(message: string): void;
  },
) {
  const [draft, setDraft] = useState('');
  const [problem, setProblem] = useState('');
  const record = useMutation({
    mutationFn: (tag: string) => recordGenre(genre, tag),
    onSuccess: async (result, tag) => {
      if (!result.ok) { setProblem(result.error || '服务端Rechazareste次Catalogar'); return }
      toast(tag ? `Ya"${genre}"CatalogarComoEtiqueta"${tag}"` : `Ya"${genre}"判Como非Etiquetas de contenido`);
      await reloadReview();
    },
    onError: (cause) => setProblem(errorMessage(cause)),
  });
  const accept = () => {
    const tag = draft.trim();
    if (!tag) { setProblem('先给它unoEtiquetas en chino'); return }
    setProblem('');
    record.mutate(tag);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <b lang="ja" className="text-body-medium text-text-primary">{genre}</b>
      <TextField aria-label={`"${genre}"Catalogar成Etiquetas en chino`} value={draft} onChange={setDraft}
        maxLength={40} isDisabled={locked || record.isPending} className="min-w-40 flex-1">
        {/* Introducir法还En组词时eseunoabajo Enter es"选este词", Noes"提交".  */}
        <InputBase size="small" list={tags.length ? GENRE_TAGS_ID : undefined}
          autoComplete="off" placeholder="Etiquetas en chino"
          onKeyDown={(event) => {
            if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
            event.preventDefault();
            accept();
          }} />
      </TextField>
      {/* 两结论都es次级Clave: este卡en la主动作es"通过", 词收进表dentroSoloes让eseuno步Con得
          puede选. 收录挂arriba primary 话, 同uno卡arriba会Con两蓝底ClaveEn抢"按aquí".  */}
      <Button variant="secondary" size="small" disabled={locked || record.isPending}
        onClick={accept}>Catalogar</Button>
      <Button variant="secondary" size="small" disabled={locked || record.isPending}
        onClick={() => { setProblem(''); record.mutate('') }}>No es contenido</Button>
      {problem
        ? <p role="status" className="w-full text-body-2-regular text-text-error-primary">{problem}</p>
        : null}
    </div>
  );
}

/** no收录 genre eseste卡arriba唯unouno件No判候选事: 来源给值, Peach 还没决定它算哪Etiqueta, 
 *  于esese句"来源还Con 2 no收录 genre"每批都Original样再来uno次. 收录uno次es对Completo词表说, 
 *  No属于其en proceso某uno来源, 所以单列uno摆En候选abajo面.  */
export function PendingGenres(
  { row, tags, locked, toast }: {
    row: ReviewRow; tags: string[]; locked: boolean; toast(message: string): void;
  },
) {
  const genres = pendingGenres(row);
  if (!genres.length) return null;
  return (
    <div role="group" aria-label="NoCatalogar genre" className="flex flex-col gap-2 rounded-surface border border-separator-border bg-background-primary-default px-4 py-3">
      <h5 className="text-body-2-medium text-text-secondary">{`NoCatalogar genre · ${genres.length}`}</h5>
      {genres.map((genre) => (
        <GenreRow key={genre} genre={genre} tags={tags} locked={locked} toast={toast} />
      ))}
    </div>
  );
}
