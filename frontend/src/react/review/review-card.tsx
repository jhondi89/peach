/* Colaen launo卡: 问es什么, 凭什么判, 以及tres结论. 
 *
 * 主体动作En最derecha—uno行dentro从izquierda到derechaes"拒绝, Omitir, 通过", 读到最posterioruno才eseste卡真正要人
 * 做判断. Geist 弹层y Fieldset 操作都eseste方向.  */
import { useRef } from 'react';

import { avatarInner } from '@peach/card-art';

import { Button } from '@/components/base/buttons/button';
import { Checkbox } from '@/components/base/checkbox/checkbox';
import { Chip } from '@/components/base/badges/chip';
import { cardClass } from '../components/card';
import { EmptyState } from '../components/empty-state';
import { useOverlayScrollbar } from '../components/overlay-scrollbar';
import { RiImageLine } from '@remixicon/react';
import { busyProps } from '../settings/use-action';
import { CandidateChoices, PendingGenres } from './candidate-form';
import { AssetPicker, EntityHead, IdentityEvidence, OriginAsset, SourceImage } from './review-evidence';
import type { DecisionStatus, ReviewCategory, ReviewRow, RowChoice } from './review';
import {
  canApprove, ENTITY_REVIEW_KINDS, rowEvidence, rowFieldName, rowSubject, rowTags, rowTitle,
} from './review';

/* Colaen la卡esuno圈细描边围着uno层superficial底: 判定Estado靠卡interior东西表达, Completo卡No换色, 所以卡面
   本身要淡—uno屏dosdiez同样框y排, 卡面越安静, 眼睛越容易落到contenidoarriba. 横向Relleno 20px
   到边, 判定自己铺满卡底eseuno格. esteunopágina所Con卡Solo读esteuno常量, 免得出现两卡.  */
const CARD = cardClass({
  variant: 'outlined', padding: 'none', className: 'flex flex-col gap-4 px-5 pt-4',
});

/* 卡头eseuno行行alto: 字段名esuno caption Chip(12/16 加arribaabajo各 4), 24px 由它定. Título, 
   勾选框 y 判定徽章各自Eneste 24px dentro居en proceso, 谁Tamaño de fuente变也还En同unoen proceso线arriba.  */
const HEADING_LINE = 'flex min-h-6 min-w-0 items-center';

/** 实体类卡头最más露几部对照Obras, 同服务端给数.  */
const COMPARISON_SHOWN = 2;

/* uno排卡etc.alto, largo出来ese部分En卡interior滚. alto度随contenido走话, uno行dentro几卡参差No齐, 
   眼睛要En每卡arribapesadoNuevo找"判定"En哪; 身回配eseuno类要放abajo来源Imagen y 样本Lista, altouno档.  */
const CARD_HEIGHT = (category: ReviewCategory) =>
  (category === 'western_identity' ? 'h-review-card-tall' : 'h-review-card');

export interface CardHandlers {
  openItem(id: number): void;
  openEntity(kind: string, name: string): void;
  onReveal(id: number): void;
  revealing: number;
  revealNote: string;
  toast(message: string): void;
}

export interface ReviewCardProps {
  category: ReviewCategory;
  row: ReviewRow;
  choice: RowChoice;
  onChoice(next: RowChoice): void;
  selected: boolean;
  onSelect(range: boolean, checked: boolean): void;
  locked: boolean;
  busy: boolean;
  problem: string;
  genreTags: string[];
  onDecide(status: DecisionStatus): void;
  handlers: CardHandlers;
}

export function ReviewCard(props: ReviewCardProps) {
  const {
    category, row, choice, onChoice, selected, onSelect, locked, busy, problem, genreTags,
    onDecide, handlers,
  } = props;
  /* Checkbox  `onChange` Solo给NuevoEstado, Shift 要从触发它eseunoabajo事件dentro取: 按abajo先于变更, 
     Clave盘空格也uno样.  */
  const range = useRef(false);
  /* 卡dentro会自己滚两: en proceso段证据,  y 贴En卡底eseuno句当anteriorInformación.  */
  const body = useOverlayScrollbar<HTMLDivElement>();
  const current = useOverlayScrollbar<HTMLParagraphElement>();
  const metadata = category === 'metadata_fields';
  const subjectKind = ENTITY_REVIEW_KINDS[category] || '';
  const subjectName = String(row.creator || '').trim();
  const asEntity = !!subjectKind && !!subjectName;
  const title = rowTitle(category, row);
  const fieldName = rowFieldName(category, row);
  const subject = rowSubject(category, row);
  const evidence = rowEvidence(row);
  const tags = rowTags(row);
  const approvable = canApprove(category, row);
  const comparison = row.comparison_assets || [];
  const assets = row.preview_assets || [];
  const decided = String(row.decision || 'pending') !== 'pending';

  /* 对照Obras排EnNo缩卡头dentro: 服务端给两, 再más也Solo露anterior两, 其余报uno数, 
     否则卡头会动作挤出卡exterior.  */
  const origin = comparison.length > 1
    ? <div className="flex flex-col gap-3">
        {comparison.slice(0, COMPARISON_SHOWN).map((asset) => (
          <OriginAsset key={asset.id} asset={asset} openItem={handlers.openItem} />
        ))}
        {comparison.length > COMPARISON_SHOWN
          ? <p className="text-body-2-regular text-text-secondary">
              {`另Con ${(comparison.length - COMPARISON_SHOWN).toLocaleString()}  título(s)对照Obra`}
            </p>
          : null}
      </div>
    : asEntity
      ? <EntityHead kind={subjectKind} name={subjectName}
          works={Number(row.video_count || row.videos || 0)}
          openEntity={handlers.openEntity}
          avatar={avatarInner(subjectName,
            row.entity_id
              ? { id: row.entity_id, has_image: !!row.has_image, image_version: row.image_version, avatar_focus: row.avatar_focus }
              : null,
            null, subjectKind)} />
      : row.asset_id
        ? <OriginAsset openItem={handlers.openItem}
            asset={{ id: row.asset_id, name: row.asset_name, preview_url: row.asset_preview_url }} />
        : null;

  /* Vista previa y 判断依据es同uno件事两medio: vereste几帧, 然posterior读esteuno句. 候选表单 y 身证据ese两类
     每uno项自己就esuno框, No再套uno层.  */
  const preview = metadata
    ? <CandidateChoices row={row} fieldName={fieldName} value={choice.candidateKey}
        onChange={(next) => onChoice({ ...choice, candidateKey: next })} locked={locked} />
    : category === 'creator_tags'
      ? (assets.length
        ? <AssetPicker assets={assets} picked={choice.assets} locked={locked}
            onPicked={(next) => onChoice({ ...choice, assets: next })} />
        /* 空白uno片会被当成界面坏. 真实Original因eseste些Obras还没抽帧, 说清楚比Deja白bien.  */
        : <EmptyState shell="inset" icon={RiImageLine} title="este批ObraaúnNo抽帧">
            {`${row.video_count || ''} ResultadoObraAún no hayDisponibleVista previa; 批准posterior仍会按所选Detalles写入Etiqueta. `}
          </EmptyState>)
      : category === 'fc2_similarity'
        ? null
        : category === 'western_identity'
          ? <IdentityEvidence row={row} openItem={handlers.openItem} openEntity={handlers.openEntity}
              onReveal={handlers.onReveal} revealing={handlers.revealing} note={handlers.revealNote} />
          : <SourceImage url={row.preview_url} />;

  const heading = asEntity
    ? origin
    : fieldName
      /* 字段名eseste卡En问问题("esteObras创作者Introduce什么"), Obras标识Soloes它问对象. 
         写EnTítuloúltimo尾话, unoSinCódigo JAV视频Archivo名会先它挤出省略号.  */
      ? <h4 className={`${HEADING_LINE} flex-wrap gap-2`}>
          {/* Chip 自己No截断: exterior面套uno层封顶裁切框, 超largo字段名No撑出卡exterior, Todo文En title dentro.  */}
          <span title={fieldName} className="flex max-w-full min-w-0 overflow-hidden rounded-md"><Chip variant="caption" color="blue">{fieldName}</Chip></span>
          <span title={subject} className="min-w-0 truncate text-body-medium text-text-primary">{subject}</span>
        </h4>
      : <h4 className={HEADING_LINE}>
          <span title={title} className="min-w-0 truncate text-body-medium text-text-primary">{title}</span>
        </h4>;

  return (
    <section aria-label={title} data-review-key={row.item_key}
      className={`${CARD} ${CARD_HEIGHT(category)} overflow-hidden`}>
      <header className="flex min-w-0 shrink-0 items-start gap-2">
        {locked ? null : (
          /* 勾选框SoloCon 16px, Títuloese行 24px. 两都按 24px 各自居en proceso, en proceso线才落Enunoarriba—
             顶对顶排话, 读人ver到es勾选框浮EnTítuloarriba面uno截.  */
          <span className={`${HEADING_LINE} shrink-0`}
            onPointerDownCapture={(event) => { range.current = event.shiftKey }}
            onKeyDownCapture={(event) => { range.current = event.shiftKey }}>
            <Checkbox isSelected={selected} aria-label={`Seleccionar ${title}`}
              onChange={(on) => onSelect(range.current, on)} />
          </span>
        )}
        <div className="min-w-0 flex-1">{heading}</div>
        {decided ? <Chip variant="caption" color="neutral">{row.decision}</Chip> : null}
      </header>

      {/* en proceso段SololargoNo缩: contenidocorto时它吃掉剩abajoalto度, contenidolargo时卡No变形, 由esteuno段自己滚. 
          exterior面esteuno层SoloComo放ese覆盖滚动轨道: 它按 `absolute` 铺, 得ConunoSolo裹着
          滚动本身定祖先, 否则会跑到Completopáginaderecha边缘去.  */}
      <div className="relative flex min-w-0 min-h-0 flex-1 flex-col">
        <div ref={body} className="flex min-w-0 min-h-0 flex-1 flex-col gap-3 overflow-y-auto">
          {/* DatosBibliotecaNormalizar名当Título, 抓取来源给写法(másComo罗马音)Deja作副Título.  */}
          {row.source_name
            ? <p className="text-body-2-regular text-text-secondary">{`Fuente写法: ${row.source_name}`}</p>
            : null}
          {/* 实体类卡片Obras数ya经写En创作者入口dentro, aquí再写uno遍就es同uno数字两处.  */}
          {!asEntity && (row.board || row.assets)
            ? <p className="text-body-2-regular text-text-secondary">
                {`对照Archivo: ${Number(row.video_count || row.assets || 0).toLocaleString()}`}
              </p>
            : null}
          {!asEntity && origin ? origin : null}
          {tags.length || category === 'creator_tags' ? (
            <div className="flex flex-wrap gap-1">
              {tags.length
                ? tags.map((tag) => <Chip key={tag} variant="caption" color="soft">{tag}</Chip>)
                : <small className="text-body-2-regular text-text-secondary">暂NingunoPendienteConfirmarEtiqueta</small>}
            </div>
          ) : null}
          {preview}
          <PendingGenres row={row} tags={genreTags} locked={locked} toast={handlers.toast} />
          {!metadata && evidence
            ? <p className="text-body-2-regular text-text-secondary wrap-anywhere">{evidence}</p>
            : null}
        </div>
      </div>

      {/* 候选表单当anteriorInformación另Con去处: 它贴En卡底, eseuno句读es"现Enes什么", Noesesteuno屏
          证据uno部分. exterior面uno层同样SoloComoese轨道, 负Margen由它出: 轨道要贴着卡interior缘, 
          而esteuno句自己得铺满Completo.  */}
      {metadata && evidence
        ? <div className="relative -mx-5 -mb-4 shrink-0">
            <p ref={current} role="region" aria-label="ActualInformación"
              className="max-h-22 overflow-y-auto border-t border-separator-border px-5 py-2.5 text-body-2-regular text-text-secondary wrap-anywhere">
              {evidence}
            </p>
          </div>
        : null}

      {/* 动作占满卡底eseuno格: 沉uno档底色, arriba面uno线"ver证据" y "abajo判断"分开, 
          abajo面两角跟着卡圆角收口.  */}
      <footer className="-mx-5 flex min-h-14 shrink-0 flex-wrap items-center justify-end gap-2 rounded-b-surface border-t border-separator-border bg-background-secondary-default py-3 pr-3 pl-5">
        <Button variant="danger" size="small" disabled={locked} {...busyProps(busy)}
          onClick={() => onDecide('rejected')}>Rechazar</Button>
        <Button variant="secondary" size="small" disabled={locked} {...busyProps(busy)}
          onClick={() => onDecide('skipped')}>Omitir</Button>
        {/* Sinpuede采纳候选时esteClave灰着, 字面说它Como什么点No,  y 旁边"Omitir"分得开.  */}
        <Button variant="primary" size="small" disabled={locked || !approvable} {...busyProps(busy)}
          title={approvable ? undefined : 'Sinpuede采用Detalles, Solo能Rechazar或Omitir'}
          onClick={() => onDecide('approved')}>
          {approvable ? 'Aceptar' : 'No puede pasar'}
        </Button>
        {problem
          ? <p role="status" className="w-full text-body-2-regular text-text-error-primary">{problem}</p>
          : null}
      </footer>
    </section>
  );
}
