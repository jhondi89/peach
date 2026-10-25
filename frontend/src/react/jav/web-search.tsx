/* Buscar en internet: actrices y obras en FreeJavBT, JavDB y en las páginas que el usuario añadió como fuente.
 * Solo muestra; suscribirse y «Lo quiero» usan los mismos puntos que el resto de la aplicación. */
import { useEffect, useState, type FormEvent } from 'react';
import { RiExternalLinkLine } from '@remixicon/react';
import { Button, ButtonLink } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { apiGet } from '../../api';
import { Note } from '../components/note';
import { spriteGlyph } from '../components/sprite-glyph';
import { busyProps, useAction } from '../settings/use-action';
import { addWant, invalidateWants } from '../wants/wants';
import { FEEDS_KEY, followFeedByName, type FeedCandidate } from '../follow-manage/follow-manage';
import { queryClient } from '../query';

const SearchGlyph = spriteGlyph('search');

interface WebResult { title: string; url: string; image: string; code: string; date: string; owned?: boolean; wanted?: boolean }
interface WebSource { id: string; name: string; items: WebResult[]; error: string }
interface WebSearchResponse {
  q: string;
  code: { code: string; owned: boolean; wanted: boolean } | null;
  actresses: { candidates: FeedCandidate[]; error?: string; approximate?: boolean; q?: string; asked?: string; site?: string };
  sources: WebSource[];
}

const fetchWebSearch = (query: string, signal?: AbortSignal) =>
  apiGet<WebSearchResponse>(`/api/web-search?q=${encodeURIComponent(query)}`, signal);

export function WebSearch({ readOnly, receipt, navigate, initial }: {
  readOnly: boolean; receipt(message: string): void; navigate(path: string): void; initial: string;
}) {
  const [text, setText] = useState(initial);
  const [result, setResult] = useState<WebSearchResponse | null>(null);
  const [wanted, setWanted] = useState<ReadonlySet<string>>(new Set());
  const [followed, setFollowed] = useState<ReadonlySet<string>>(new Set());
  const search = useAction();
  const act = useAction();
  const run = (query: string) => {
    if (!query.trim()) return;
    const params = new URLSearchParams(location.search); params.set('q', query.trim());
    history.replaceState(history.state, '', `${location.pathname}?${params}`);
    void search.run('search', (signal) => fetchWebSearch(query.trim(), signal), (found) => { setResult(found); setWanted(new Set()) });
  };
  const submit = (event: FormEvent) => { event.preventDefault(); run(text) };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (initial.trim()) run(initial) }, []);
  const want = (code: string) => void act.run(`want:${code}`, (signal) => addWant({ code }, signal), () => {
    setWanted((now) => new Set([...now, code])); void invalidateWants(); receipt(`Añadido a «Lo quiero»: ${code}`);
  });
  const follow = (card: FeedCandidate) => void act.run(`follow:${card.id}`,
    (signal) => followFeedByName(card.names[0], [card.id], signal), (done) => {
      setFollowed((now) => new Set([...now, card.id]));
      void queryClient.invalidateQueries({ queryKey: FEEDS_KEY });
      receipt(done.created ? `Se añadió a “${done.entity_name}” y te suscribiste a sus estrenos`
        : `Te suscribiste a los estrenos de “${done.entity_name}”`);
    });
  const workActions = (item: { code: string; owned?: boolean; wanted?: boolean }) => <>
    {item.code ? <Button variant="secondary" onClick={() => navigate(`/works/${encodeURIComponent(item.code)}`)}>Ver ficha</Button> : null}
    {item.code ? <Button variant="ghost" disabled={readOnly || item.owned || item.wanted || wanted.has(item.code)}
      {...busyProps(act.busy === `want:${item.code}`)} onClick={() => want(item.code)}>
      {item.owned ? 'Ya en la colección' : item.wanted || wanted.has(item.code) ? 'En «Lo quiero»' : 'Lo quiero'}</Button> : null}
  </>;
  const actresses = result?.actresses;
  return <section aria-label="Buscar en internet" className="flex min-w-0 flex-col gap-6">
    <form role="search" onSubmit={submit} className="flex gap-2">
      <div className="min-w-0 flex-1">
        <Input type="search" aria-label="Buscar en internet" placeholder="Nombre de una actriz, un código o un título"
          leadingIcon={SearchGlyph} value={text} onChange={setText} enterKeyHint="search" />
      </div>
      <Button type="submit" variant="primary" {...busyProps(search.busy === 'search')} disabled={!text.trim()}>Buscar</Button>
    </form>
    <p className="text-body-2-regular text-text-secondary">
      Busca en FreeJavBT, en JavDB y en las páginas que añadiste en <a className="underline" href="/sources">Fuentes y credenciales</a> con página de búsqueda.
    </p>
    {search.error ? <Note tone="error" title="La búsqueda falló">{search.error}</Note> : null}
    {act.error ? <Note tone="error">{act.error}</Note> : null}
    {result?.code ? <div className="flex flex-wrap items-center gap-3 rounded-lg bg-background-secondary-default p-4">
      <b className="text-title-3-medium">{result.code.code}</b>
      <span className="flex-1 text-body-2-regular text-text-secondary">Parece un código de obra.</span>
      {workActions(result.code)}
    </div> : null}
    {result ? <div className="flex flex-col gap-3">
      <h3 className="text-title-2-medium text-text-primary">Actrices en {actresses?.site || 'FreeJavBT'}</h3>
      {actresses?.approximate ? <p className="text-body-2-regular text-text-secondary">
        No hay nadie llamado «{actresses.asked}»; estas son las que coinciden con «{actresses.q}».</p> : null}
      {actresses?.error ? <Note tone="warning">{actresses.error}</Note> : null}
      {!actresses?.error && !actresses?.candidates.length ? <p className="text-body-2-regular text-text-secondary">No se encontraron actrices.</p> : null}
      <ul className="flex flex-col divide-y divide-separator-border">
        {(actresses?.candidates || []).slice(0, 12).map((card) => <li key={card.id} className="flex flex-wrap items-center gap-3 py-3">
          <span className="min-w-0 flex-1">
            <b className="text-body-medium text-text-primary">{card.names[0]}</b>
            {card.names.length > 1 ? <span className="text-body-2-regular text-text-secondary"> · {card.names.slice(1, 4).join(' · ')}</span> : null}
            {card.record ? <span className="text-body-2-regular text-text-secondary"> · {card.record === '無碼' ? 'sin censura' : card.record}</span> : null}
            {card.held_by ? <span className="text-body-2-regular text-text-secondary"> · ya está como {card.held_by.name}</span> : null}
          </span>
          <ButtonLink variant="secondary" trailingIcon={RiExternalLinkLine} href={card.url} target="_blank" rel="noopener noreferrer">{actresses?.site || 'FreeJavBT'}</ButtonLink>
          <Button variant="primary" disabled={readOnly || followed.has(card.id)} {...busyProps(act.busy === `follow:${card.id}`)}
            onClick={() => follow(card)}>{followed.has(card.id) ? 'Suscrita' : 'Añadir y suscribirse'}</Button>
        </li>)}
      </ul>
    </div> : null}
    {(result?.sources || []).map((source) => <div key={source.id} className="flex flex-col gap-3">
      <h3 className="text-title-2-medium text-text-primary">Obras en {source.name}</h3>
      {source.error ? <Note tone="warning">{source.error}</Note> : null}
      {!source.error && !source.items.length ? <p className="text-body-2-regular text-text-secondary">Sin resultados.</p> : null}
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
        {source.items.map((item, index) => <article key={`${item.url}-${index}`} className="flex min-w-0 flex-col gap-2 rounded-lg bg-background-secondary-default p-3">
          {item.image ? <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer" className="aspect-[3/2] w-full rounded-md object-cover"
            onError={(event) => { event.currentTarget.style.display = 'none' }} /> : null}
          <h4 className="line-clamp-3 text-body-2-medium text-text-primary" title={item.title}>{item.code && !item.title.toUpperCase().startsWith(item.code.toUpperCase()) ? <b>{item.code} </b> : null}{item.title}</h4>
          {item.date ? <span className="text-caption-1-regular text-text-secondary">{item.date}</span> : null}
          <div className="mt-auto flex flex-wrap gap-2">
            {workActions(item)}
            {item.url ? <ButtonLink variant="ghost" trailingIcon={RiExternalLinkLine} href={item.url} target="_blank" rel="noopener noreferrer">Abrir</ButtonLink> : null}
          </div>
        </article>)}
      </div>
    </div>)}
    {!result && !search.busy ? <p className="text-body-2-regular text-text-secondary">Escribe un nombre y pulsa Buscar.</p> : null}
    {search.busy ? <p role="status" className="text-body-2-regular text-text-secondary">Buscando en internet…</p> : null}
  </section>;
}

