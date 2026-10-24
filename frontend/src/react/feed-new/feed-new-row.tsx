/* Nuevas obraseseuno行卡片区, primeropáginay资料página共用: 画进壳Dejabien `section.feednew` 宿主dentro, 卡片es壳拼
 * eseuno模板(`feedNewCardHtml`). 忽略ese当场消失, yaver过DejaEnOriginalSoloes变淡, 想要eseClave
 * 按abajo去换成Introduce实星; tres样都直continuar改esteuno行节点, Nopesado画Completo行—pesado画会横滚Ubicación y 自动滚动
 * uno起打回起点. uno都Sin就CompletoNo出.  */
import { useContext, useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { ShellActionsContext } from '../router/router';
import { SourceAvatar } from '../components/source-avatar';

import type { FeedNew } from './feed-new';

export function FeedNewRow({ feedNew, host, wire, act, settled }: {
  feedNew: FeedNew | null;
  host: HTMLElement;
  /** 拖动, 滚轮, 按Configuracióncontinuar自动滚动.  */
  wire(row: Element | null): void;
  /** 卡arribaesetresClave写操作.  */
  act(feedId: number, action: string): Promise<void>;
  /** ConSin卡: 画出来, 或最posterioruno被收起时报uno次.  */
  settled?(hasItems: boolean): void;
}) {
  const actions = useContext(ShellActionsContext);
  const box = useRef<HTMLDivElement>(null);
  const [sourceFaces, setSourceFaces] = useState<HTMLElement[]>([]);
  const html = feedNew?.items.length ? feedNew.html : '';
  useLayoutEffect(() => {
    host.removeAttribute('aria-busy');
    host.hidden = !html;
    if (feedNew) settled?.(!!html);
  }, [host, html, feedNew, settled]);
  useEffect(() => {
    if (html) wire(box.current?.querySelector('.feednewrow') ?? null);
    setSourceFaces([...box.current?.querySelectorAll<HTMLElement>('[data-feed-source-avatar]') ?? []]);
  }, [wire, html]);
  const click = async (event: MouseEvent<HTMLDivElement>) => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a.feednewopen');
    if (link && actions && !event.button && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey) {
      event.preventDefault(); actions.navigate(link.getAttribute('href')!); return;
    }
    const button = (event.target as Element).closest<HTMLElement>('[data-feed-action]');
    const card = button?.closest<HTMLElement>('[data-feed-id]');
    if (!button || !card) return;
    const action = button.dataset.feedAction || '';
    await act(Number(card.dataset.feedId), action);
    if (action === 'want' || action === 'unwant') {
      // 想要es开关: 同unoClave换成另uno头, 卡片No收起也No变淡. 
      const wanted = action === 'want';
      button.dataset.feedAction = wanted ? 'unwant' : 'want';
      button.setAttribute('aria-pressed', String(wanted));
      button.title = wanted ? 'Quitar de deseados' : 'Deseado';
      return;
    }
    if (action === 'ignore') card.remove();
    else card.classList.add('isread');
    if (!box.current?.querySelector('[data-feed-id]')) {
      host.hidden = true;
      settled?.(false);
    }
  };
  return html ? <><div ref={box} className="contents" onClick={(event) => { void click(event) }}
    dangerouslySetInnerHTML={{ __html: html }} />{sourceFaces.map((face, index) => createPortal(
      <SourceAvatar code={face.dataset.code!} person={{ name: face.dataset.name!, source_actor_id: face.dataset.actor! }} />,
      face, `${html.length}:${index}`))}</> : null;
}
