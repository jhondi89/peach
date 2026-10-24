/* 实体资料página顶arribaese资料卡, 连同资料卡abajo面, Obrasarriba面eseuno行no入BibliotecaNuevas obras. 
 *
 * 资料卡按 Board  profile 卡排: uno secondary 底, 18px 圆角卡, 正文esAvatar加身tres行
 * (名字, 别名y归属, exterior链), ActrizCon资料时derecha边再加uno栏资料表, 同艺人收进卡底ese色阶带—
 * eseeseste人附注, Noesesteunopágina正文. 卡exterior面交集, Filtrarycontenido区仍归壳. 
 *
 * Avatar, 同艺人脸 y Nuevas obras卡es拼bien HTML(grandeyNuevas obras卡由壳给, 同艺人脸取自 `@peach/card-art`): 
 * 取ImagenFallo时兜底链(`card-art/image-fallback.ts`)会 `<img>`
 * 从 DOM dentro摘掉, 人脸放grande(`avatarFrame`)往Imagenarriba写interior联尺寸, Esperando微光挂EnImagen父元素arriba, este几样
 * 都直continuar改节点, 所以ese几格用 `dangerouslySetInnerHTML`, React No拥Condentro面节点.  */
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { entityFaceImg, facePos } from '@peach/card-art';
import { entityPath, esc, firstGrapheme, icon } from '@peach/legacy/core';

import { Button } from '@/components/base/buttons/button';

import { AvatarPicker } from '../avatar-picker/avatar-picker-page';
import { Note } from '../components/note';
import { FavoriteButton } from '../library-shortcuts/shortcut-controls';
import { busyProps } from '../settings/busy-props';
import { FeedNewRow } from '../feed-new/feed-new-row';
import { Glyph } from './glyph';
import { FeedSwitch, MorePop } from './hero-pop';
import { NamePicker } from './name-picker';
import {
  COMPANY_ALIASES_SHOWN, agencyOf, companyFactRows, entityFeedTip, entryMarks, factRows, heroLinks, isCompany, isPeople, nameChoices, nameLine, shownTags,
  type EntityHeroActions, type EntityHeroData, type EntityHeroHelpers, type EntityHeroProps,
  type HeroCostar, type HeroFollow, type LinkMark, type LinkView,
} from './entity-hero';

/** 同艺人圆框dentroeseImagen: 实体Imagen优先, 退到Obra representativaAvatar, 按检出人脸取景.  */
function costarImg(person: HeroCostar): string {
  return entityFaceImg({
    id: person.id, hasImage: person.has_image, version: person.image_version, rep: person.has_avatar ? person.rep : null,
    style: facePos(person.avatar_focus), focus: person.avatar_focus, standIn: person.avatar_stand_in,
  });
}

export function EntityHeroPage({ kind, name, entity, feedNew, feedHost, actions, helpers }: EntityHeroProps) {
  const people = isPeople(kind);
  const company = isCompany(kind);
  const facts = people ? factRows(entity.profile) : company ? companyFactRows(entity.company_profile) : [];
  const links = heroLinks(entity, kind);
  const marks = entryMarks(entity);
  const costars = kind === 'agency' ? [] : (entity.related_performers || []);
  const linkRow = useRef<HTMLDivElement>(null);
  const costarRow = useRef<HTMLDivElement>(null);
  /* 同艺人yestrecho屏ese排exterior链都es `overflow-x:auto` 加隐藏滚动: 能滚, pero鼠标Sinuno够得着
     入口, 所以登记Todo站横向行ese套拖动加滚轮映射. exterior链ese排ancho屏abajo换行, 组件量得出No溢出.  */
  useEffect(() => { helpers.wireScroller(linkRow.current) }, [helpers, links.length]);
  useEffect(() => { helpers.wireScroller(costarRow.current) }, [helpers, costars.length]);

  return (
    <>
      <section data-entity-card="" aria-label="Detalles">
        <div data-entity-profile={facts.length ? 'facts' : ''}>
          <div data-entity-portrait-wrap="">
            <Portrait kind={kind} name={name} helpers={helpers} people={people} company={company} />
            {people && entity.id ? (
              <span data-avatar-picker="">
                <AvatarPicker kind={kind} entityId={Number(entity.id)} name={entity.canonical_name || name}
                  onPicked={actions.avatarPicked} />
              </span>
            ) : null}
          </div>
          <div data-entity-identity="">
            <div data-entity-title="">
              <h2>{entity.canonical_name}</h2>
              {kind !== 'tag' ? <NamePicker current={entity.canonical_name} choices={nameChoices(entity)}
                onChoose={actions.chooseName} onAddAlias={actions.addAlias} /> : null}
              {entity.id ? <FavoriteButton item={{ entity_id: Number(entity.id), kind, name: entity.canonical_name || name, favorite: entity.favorite }} /> : null}
            </div>
            <AliasLine kind={kind} entity={entity} actions={actions} />
            {entity.related_identities?.length ? (
              <div className="flex min-w-0 flex-wrap gap-2 text-caption-1-regular text-text-secondary">
                {/* 账号名常esunolargo串Sin空格英文, estrecho屏abajo得能En任意处折行.  */}
                {entity.related_identities.map((identity) => {
                  const text = `${identity.relation === 'same_person' ? 'Misma persona' : 'Cuenta vinculada'}: ${identity.canonical_name}`;
                  return (
                    <button type="button" key={identity.id} title={text}
                      className="min-w-0 max-w-full text-text-primary underline wrap-anywhere"
                      onClick={() => actions.openEntity(identity.kind, identity.canonical_name)}>
                      {text}
                    </button>
                  );
                })}
              </div>
            ) : null}
            {links.length ? (
              <div ref={linkRow} data-entity-links="">{links.map((link, at) => <HeroLinkView key={at} link={link} />)}</div>
            ) : null}
            {marks.length || entity.feed ? <EntryMarks entity={entity} actions={actions} helpers={helpers} /> : null}
            {entity.follow?.held.length ? <HeldAuthors follow={entity.follow} entity={entity} actions={actions} /> : null}
          </div>
          {facts.length ? (
            <dl data-entity-facts="">
              {facts.map((row) => (
                <FactRowView key={row.label} glyph={row.glyph} label={row.label} clip={row.clip}>
                  {row.tags ? <FactTags tags={row.tags} />
                    : row.parts.map((part, at) => (
                      <span key={at} data-fact-tone={part.tone === 'plain' ? undefined : part.tone}>
                        {at ? ' ' : ''}{part.text}
                      </span>
                    ))}
                </FactRowView>
              ))}
            </dl>
          ) : null}
        </div>
        {costars.length ? (
          <div data-entity-foot="" aria-label="Coprotagonistas">
            <div ref={costarRow} data-related-people="">
              {costars.map((person) => (
                <button key={person.k} type="button" data-related-performer={person.k}
                  onClick={() => actions.openEntity('performer', person.k)}>
                  <span data-hero-ring="" dangerouslySetInnerHTML={{
                    __html: `<span>${esc(firstGrapheme(person.k))}</span>${costarImg(person)}` }} />
                  <span data-hero-costar-name="">{person.k}</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </section>
      {/* Nuevas obraseseuno行摆En壳Dejabien `section.feednew[data-feed-new]` dentro, yprimeropáginaeseuno行同uno组件.  */}
      {feedHost ? createPortal(<FeedNewRow feedNew={feedNew} host={feedHost} wire={helpers.wireFeedRow}
        act={(feedId, action) => actions.feedAction(feedId, action)} />, feedHost) : null}
    </>
  );
}

/** grande: 公司取自己标识(方框), 人取实体Imagen或Obra representativaAvatar(圆框); uno环都取No到就Solo剩primero字母.  */
function Portrait({ kind, name, helpers, people, company }: {
  kind: string; name: string; helpers: EntityHeroHelpers; people: boolean; company: boolean;
}) {
  /* ImagenSolo拼uno次: 兜底链摘掉 `<img>`, 人脸放grande写进去尺寸都DejaEn节点arriba, pesado画时No能按
     同uno段 HTML 再盖回去(`dangerouslySetInnerHTML` SoloEn字符串变时才pesado写).  */
  const [html] = useState(() => `${helpers.portraitImg()}<span>${esc(firstGrapheme(name))}</span>`);
  return (
    <div data-entity-portrait={people ? 'round' : 'square'} data-fit-native={company ? 'mark' : 'portrait'}
      data-entity-kind={kind} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** 身资料各项带Imagen标; 别名IndependienteOrdenar, 归属Con实体时提供站interior入口.  */
function AliasLine({ kind, entity, actions }: { kind: string; entity: EntityHeroData; actions: EntityHeroActions }) {
  const agency = agencyOf(entity);
  const go = (target: string, to: string) => (event: MouseEvent) => {
    event.preventDefault();
    actions.openEntity(target, to);
  };
  const agencyNode = agency ? (agency.linked
    ? <a href={entityPath('agency', agency.name, agency.id)} data-agency={agency.name} onClick={go('agency', agency.name)}>{agency.name}</a>
    : agency.name) : null;
  const count = <><b>{entity.asset_count.toLocaleString()}</b>  video(s)</>;
  if (kind === 'performer' || kind === 'creator') {
    const line = nameLine(entity.name_groups);
    return (
      <div data-entity-alias="meta">
        <IdentityMeta entity={entity} />
        <span data-meta-item="" title="Videos"><Glyph name="film" /><span>{count}</span></span>
        {entity.follow?.key ? <FollowMeta follow={entity.follow} actions={actions} /> : null}
        {agencyNode ? <span data-meta-item="" title="Agencia"><Glyph name="briefcase" /><span>{agencyNode}</span></span> : null}
        {line ? (
          <div data-meta-item="names">
            <Glyph name="id-card" />
            <span data-alias-names="" title="Alias">{line.names.map((one, at) => <span key={at}>{one}</span>)}</span>
            {line.rest > 0 ? (
              <MorePop id="entityAliasPop" hook="alias" rest={line.rest} label={`另exterior ${line.rest.toLocaleString()} Alias`}
                heading={`${line.total.toLocaleString()} Alias`}>
                <dl>
                  {(entity.name_groups?.groups || []).map((group, at) => (
                    <NameGroup key={at} label={group.label} names={group.names} />
                  ))}
                </dl>
              </MorePop>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }
  const aliases = entity.display_aliases || [];
  /* Agenciapágina数es人, Noes片; 片商página同理, 旗abajoCon几 label es它自己读数(ADR-0051).  */
  const members = kind === 'agency'
    ? <> · <b>{(entity.member_count || 0).toLocaleString()}</b>  actriz/actrices</>
    : (entity.labels || []).length ? <> · <b>{entity.labels!.length.toLocaleString()}</b>  sello(s)</> : null;
  const maker = entity.maker;
  return (
    <div data-entity-alias="meta">
      {kind === 'creator' ? <IdentityMeta entity={entity} /> : null}
      <span data-meta-item="" title="Videos"><Glyph name="film" /><span>{count}{members}</span></span>
      {agencyNode ? <span data-meta-item="" title="Agencia"><Glyph name="briefcase" /><span>{agencyNode}</span></span> : null}
      {maker ? <span data-meta-item="" title="Productora"><Glyph name="clapperboard" /><a href={entityPath('studio', maker.name, maker.id)} data-studio-link={maker.name}
        onClick={go('studio', maker.name)}>{maker.name}</a></span> : null}
      {aliases.length ? <CompanyAliases aliases={aliases} /> : null}
    </div>
  );
}

/** 公司别名: 先列几, 余abajo收进"+N", 浮层dentrouno名字uno行. 片商改过几轮名, 挂过uno串
 *  label 时别名能Contresdiezmás, Todo摊开会占掉资料卡diez几行.  */
function CompanyAliases({ aliases }: { aliases: string[] }) {
  const { shown, rest } = shownTags(aliases, COMPANY_ALIASES_SHOWN);
  return (
    <div data-meta-item="names" data-company-names="">
      <Glyph name="id-card" />
      <span data-alias-names="" title="Alias">{shown.map((name, at) => <span key={at}>{name}</span>)}</span>
      {rest ? (
        <MorePop id="entityAliasPop" hook="alias" rest={rest} label={`另exterior ${rest.toLocaleString()} Alias`}
          heading={`${aliases.length.toLocaleString()} Alias`}>
          <dl><NameGroup names={aliases.map((name) => ({ name }))} /></dl>
        </MorePop>
      ) : null}
    </div>
  );
}

/** 关注dentro绑Eneste名abajo来源: 读数es还没入BibliotecaActualizar, Completo段es站interior去处(同Agencia链continuar钨蓝), 
 *  点开切到esteunopáginaEn线视Imagen.  */
function FollowMeta({ follow, actions }: { follow: HeroFollow; actions: EntityHeroActions }) {
  const from = follow.providers.join(' · ');
  return (
    <span data-meta-item="" data-entity-follow="" title={from ? `Seguir · ${from}` : 'Seguir'}>
      <Glyph name="rss" />
      <a href="?media=online" onClick={(event) => { event.preventDefault(); actions.openFollowAuthor(follow.key) }}>
        {follow.n.toLocaleString()} 项Actualizar
      </a>
    </span>
  );
}

/** 关注dentroCon同名作者, 还没认esNoes同uno人: 每组unoSugerencia, 认才ese组来源绑到este名abajo. 
 *  名字相同No算证据(ADR-0095), 所以aquíSolo问, No替人绑.  */
function HeldAuthors({ follow, entity, actions }: {
  follow: HeroFollow; entity: EntityHeroData; actions: EntityHeroActions;
}) {
  const [busy, setBusy] = useState('');
  const confirm = async (key: string, name: string) => {
    if (busy) return;
    setBusy(key);
    try {
      await actions.confirmFollowAuthor(key, name);
    } catch {
      /* Fallo回执由壳发, 按钮回到puede按.  */
    } finally {
      setBusy('');
    }
  };
  return (
    <div data-entity-held="" className="flex flex-col gap-2">
      {follow.held.map((group) => (
        <Note key={group.key} tone="info" title={`SeguirdentroCon同名作者 ${group.name}`}
          action={<Button size="small" {...busyProps(busy === group.key)}
            onClick={() => { void confirm(group.key, group.name) }}>Es la misma persona</Button>}>
          {[group.providers.join(' · '), `${group.n.toLocaleString()}  actualización(es)`].filter(Boolean).join(' · ')}
          .  y  {entity.canonical_name} es同uno人吗?
        </Note>
      ))}
    </div>
  );
}

/** Categoría于身行No.uno项.  */
function IdentityMeta({ entity }: { entity: EntityHeroData }) {
  if (!entity.identity_labels?.length) return null;
  return (
    <span data-meta-item="classification" data-identity-classification="">
      <Glyph name="user-round" /><span>{entity.identity_labels.join(' · ')}</span>
    </span>
  );
}

/** 浮层en launo组名字: uno名字uno行, 读音排En它abajo面uno行. 串成uno段话, 名字 y 读音分No清各属于谁.  */
function NameGroup({ label, names }: { label?: string; names: { name: string; reading?: string }[] }) {
  return (
    <>
      {label ? <dt>{label}</dt> : null}
      <dd data-wide={label ? undefined : ''}>
        {names.map((entry, at) => (
          <span key={at} data-pop-name="">{entry.name}{entry.reading ? <small>{entry.reading}</small> : null}</span>
        ))}
      </dd>
    </>
  );
}

function FactRowView({ glyph, label, clip, children }: { glyph: string; label: string; clip?: string; children: ReactNode }) {
  return (
    <>
      <dt><Glyph name={glyph} />{label}</dt>
      <dd data-fact={glyph === 'tags' ? 'tags' : clip ? 'clip' : glyph === 'calendar-range' ? 'num' : undefined}
        title={clip}>{children}</dd>
    </>
  );
}

/** 站en laEtiquetaSoloes读数, NoesesteunopáginaFiltrar, 所以esEtiqueta脸, Nocontinuar点击.  */
function FactTags({ tags }: { tags: string[] }) {
  const { shown, rest } = shownTags(tags);
  return (
    <>
      {shown.map((tag) => <span key={tag} data-fact-tag="" title={tag}>{tag}</span>)}
      {rest ? (
        <MorePop id="entityTagPop" hook="fact" rest={rest} label={`另exterior ${rest.toLocaleString()} Etiqueta`}
          heading={`${tags.length.toLocaleString()} Etiqueta`}>
          <div data-fact-tags="">{tags.map((tag) => <span key={tag} data-fact-tag="" title={tag}>{tag}</span>)}</div>
        </MorePop>
      ) : null}
    </>
  );
}

/** 链continuaranteriorese圆标. 站点圆标es别人服务Dispositivoen laImagen, 取No到时 `data-drop="self"`  img 撤掉, 
 *  露出底abajoese地球, 所以esteuno格es遗Deja层 HTML.  */
function LinkIcon({ mark }: { mark: LinkMark }) {
  if ('brand' in mark) return <span data-link-icon="brand"><Glyph name={mark.brand} /></span>;
  const html = icon('globe') + ('site' in mark
    ? `<img src="${esc(mark.site)}" alt="" loading="lazy" referrerpolicy="no-referrer" data-drop="self">` : '');
  return <span data-link-icon="" dangerouslySetInnerHTML={{ __html: html }} />;
}

/** exterior链排成uno行次级按钮: 36px alto, uno圈线. 纯Imagen标链continuar自己No带puede读文字, 名字DejaEn title y
 *  读屏名称dentro; 官网ese"点之anteriorverNo出es谁"链continuar才写字.  */
function HeroLinkView({ link }: { link: LinkView }) {
  switch (link.type) {
    case 'icon':
      return (
        <a data-link="icon" href={link.url} target="_blank" rel="noreferrer" title={link.title} aria-label={link.title}>
          <LinkIcon mark={link.mark} />
        </a>
      );
    case 'gone':
      /* ya隐退ActrizInválido链continuarDejaEnOriginal, Nopuede点: 去敲uno停放域名Solo会招来杀毒软件告警.  */
      return (
        <span data-link="gone" tabIndex={0} title={link.title} aria-label={link.title}>
          <LinkIcon mark={{ globe: true }} />
        </span>
      );
    case 'private':
      return (
        <span data-link="private" title={link.sources ? link.sources.join('\n') : link.label}>
          <LinkIcon mark={{ globe: true }} />
          <span data-link-label="">{link.sources ? link.label : `Fuente · ${link.label}`}</span>
        </span>
      );
    default:
      return (
        <a data-link="url" href={link.url} target="_blank" rel="noreferrer" title={link.title}>
          <LinkIcon mark={link.mark} /><span data-link-label="">{link.text}</span>
        </a>
      );
  }
}

/** ver片eseuno行: JavDB y MISSAV 两站自己标识, posterior面es订阅Nuevas obras开关. 
 *
 *  MISSAV 站arribaSinImagen形标识, 它Título就es排出来字: Halant 500, `MISS` 跟página面Tinta色, `AV` 用
 *  它粉. unoActrizEn javdb Con两演员páginaes常事, No.dosEn标识posterior面缀服务端编bien序号.  */
function EntryMarks({ entity, actions, helpers }: {
  entity: EntityHeroData; actions: EntityHeroActions; helpers: EntityHeroHelpers;
}) {
  const [following, setFollowing] = useState(!!entity.feed?.following);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  /* 写回Fallo时开关DejaEnOriginal, Fallo回执由壳发; Éxito才发过去时回执, Deshaceres另uno次真实写回.  */
  const write = async (on: boolean): Promise<boolean> => {
    if (busyRef.current) return false;
    busyRef.current = true;
    setBusy(true);
    try {
      await actions.follow(on);
      setFollowing(on);
      return true;
    } catch {
      return false;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };
  const toggle = async (on: boolean) => {
    if (!await write(on)) return;
    helpers.receipt(on ? 'Suscrito a nuevas obras' : 'Suscripción cancelada', { undo: async () => { await write(!on) } });
    if (on) actions.refreshFeedAfterCheck();
  };
  return (
    <div data-entry-marks="">
      {entryMarks(entity).map((mark, at) => (
        <a key={at} data-entry-mark="" href={mark.url} target="_blank" rel="noreferrer" title={mark.label} aria-label={mark.label}>
          {mark.mark ? <Glyph name={mark.mark} /> : <span data-missav-mark=""><span>MISS</span><span>AV</span></span>}
          {mark.ordinal ? <span data-entry-ordinal="">{mark.ordinal}</span> : null}
        </a>
      ))}
      {entity.feed ? <FeedSwitch following={following} busy={busy} onToggle={(on) => { void toggle(on) }}
        tip={entityFeedTip(following)} /> : null}
    </div>
  );
}
