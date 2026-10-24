/* 名册Cuadrícula: 艺人, 创作者, Sello, Agenciacuatro本地名册,  y 艺人páginaEn线eseuno档来源创作者. 
 *
 * uno格人: 圆框或竖幅Avatar, 名字, uno读数. cuatro实体同uno副版, 同uno取Imagen链, 区别SoloEn
 * 格anchoy读数口径. 圆框dentroese段 HTML 由 `card-art`  `avatarInner` 拼(ConImagen走Imagen, 没Imagen退primero字母, 
 * pequeñoImagen按Original尺寸摆再糊uno圈底), página面Nopesado画uno遍; Original尺寸取Imageny补底ReglaEn
 * `web/css/01-base.css`  `[data-person-ring]`, 量Imagenes `installCardArt` 挂EnDocumentaciónen la `load` 监听. 
 * 格底, Avatar框, primero字y读数配色En同Directorio `index-people.css`.  */
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { Chip } from '@/components/base/badges/chip';

import { cardClass } from '../components/card';
import { spriteGlyph } from '../components/sprite-glyph';
import type { OnlineAuthor } from '../follow/online-vocab';
import { ENTITY_KINDS, isCompany, personReadout, type IndexKind, type IndexPerson, type IndexProps, type PeopleLayout } from './index-data';

/* 平移挂En圆框arriba而Noes img arriba: 竖幅裁到 3:4 时几何居en proceso会切掉脸, 而 img 由遗Deja层拼, 
   Solo能从容Dispositivoesteuno侧改. 放grande反过来Solo能挂En img arriba, 所以脸框由 `avatarInner` 贴到 img arriba. 
   放grandees img 撑得比框还ancho再负偏移, Preflight 给 img  `max-width:100%` 会它压回框ancho, 
   脸就被挤到uno边, 所以aquí撤掉eseuno; Original尺寸摆pequeñoImagen另由 `[data-native-small]` 收住.  */
function Ring({ html, face, company, big }: { html: string; face?: string; company: boolean; big: boolean }) {
  const ring = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    if (face) ring.current?.style.setProperty('--face', face);
    else ring.current?.style.removeProperty('--face');
  }, [face]);
  const shape = !big ? 'size-17.5 rounded-full' : company ? 'aspect-square w-full rounded-2lg' : 'aspect-3/4 w-full rounded-2lg';
  return (
    <span ref={ring} data-person-ring="" data-fit-native={company ? 'mark' : 'portrait'}
      className={`relative inline-grid flex-none place-items-center self-center overflow-hidden text-title-1-regular ${shape} [&_img]:absolute [&_img]:inset-0 [&_img]:block [&_img]:size-full [&_img]:max-w-none [&_img]:object-cover [&_img]:object-(--face)`}
      dangerouslySetInnerHTML={{ __html: html }} />
  );
}

const CELL = 'relative flex cursor-pointer flex-col gap-2 p-3 text-inherit';
const Rss = spriteGlyph('rss');

function Cell(
  { name, readout, big, children, following, onPress, ...data }:
  { name: string; readout: string; big: boolean; children: ReactNode; following?: boolean; onPress(): void }
    & Record<`data-${string}`, string>,
) {
  return (
    <button type="button" {...data} data-index-cell="" onClick={onPress}
      className={cardClass({
        radius: 'plain', padding: 'none', interactive: true,
        className: `${CELL} ${big ? 'items-stretch text-left' : 'items-center text-center'}`,
      })}>
      {children}
      {following ? <span data-index-feed="" role="img" aria-label="Suscrito a nuevas obras" className="absolute top-4 right-4 z-2 inline-flex">
        <Chip variant="caption" color="blue"><Rss /></Chip>
      </span> : null}
      <span data-index-name="" className="text-body-medium wrap-anywhere text-text-primary">{name}</span>
      <span data-index-readout="" className="text-caption-1-regular">{readout}</span>
    </button>
  );
}

/** 本地名册. 资料página名册(Agencia旗abajo艺人, 片商旗abajoSello)摆也esesteuno格, Solo借取Imageny去处两样.  */
export function PeopleGrid(
  { kind, items, layout, props }:
  {
    kind: Exclude<IndexKind, 'tags'>; items: IndexPerson[]; layout: PeopleLayout;
    props: Pick<IndexProps, 'personAvatar' | 'openEntity'>;
  },
) {
  const company = isCompany(kind);
  const big = layout === 'big';
  return (
    <div data-index-grid="" data-layout={layout} data-cells={company ? 'company' : 'people'}
      className={`${company ? 'index-grid-company' : 'index-grid-person'} gap-3`}>
      {items.map((item) => {
        const entityKind = item.entity_kind || ENTITY_KINDS[kind];
        const avatar = props.personAvatar(item, entityKind, big);
        return (
          <Cell key={`${entityKind}:${item.entity_id || item.k}`} data-k={item.k} data-kind={entityKind} name={item.k} readout={`${personReadout(kind, item)}${item.identity_labels?.length ? ' · ' + item.identity_labels.join(' / ') : ''}`}
            big={big} following={item.following} onPress={() => props.openEntity(entityKind, item.k)}>
            <Ring html={avatar.html} face={avatar.face} company={company} big={big} />
          </Cell>
        );
      })}
    </div>
  );
}

/** En线eseuno档: 关注来源en la创作者. 建过档点开去他创作者资料página; 还没建档名abajoese批东西
 *  TodoEn关注páginaarriba, 点开etc.于"关注 · este人"; DatosBibliotecadentroCon同名创作者, etc.用户认, 读数带"待Confirmar", 
 *  点开去ese资料página, 认人按钮Enesedentro. `data-follow-author` 挂es关注páginaese套创作者Clave.  */
export function OnlineAuthors(
  { items, layout, props }: { items: OnlineAuthor[]; layout: PeopleLayout; props: IndexProps },
) {
  const big = layout === 'big';
  return (
    <div data-index-grid="" data-layout={layout} data-cells="people" className="index-grid-person gap-3">
      {items.map((author) => (
        <Cell key={author.key} data-follow-author={author.key} data-kind="performer" name={author.k}
          readout={`${author.n.toLocaleString()}  actualización(es)${author.held_by ? ' · PendienteConfirmar' : ''}`} big={big}
          onPress={() => {
            if (author.entity_id) props.openEntity('creator', author.k);
            else if (author.held_by) props.openEntity('creator', author.held_by);
            else props.openFollowAuthor(author.key);
          }}>
          <Ring html={props.authorAvatar(author)} company={false} big={big} />
        </Cell>
      ))}
    </div>
  );
}
