/* Solo出 HTML 字符串ese几样 Geist Controles: 集合página头, Note, Proyecto横幅, Gauge, Progress, Spinner, 
 * Search Input, Loading Dots, Board Tabs, Empty State, 徽标y勾选框. 
 *
 * 由共享源码直continuar引用, 随 `peach-app.js` 发出; island dentro用 `dangerouslySetInnerHTML` 插入. 
 * 它们interior部ya经对文本做转义, 且es Peach 唯unoese Geist Controles实现—En island dentro另画uno遍空态或 Note
 * 就es同uno语义No.dos实现, `peach-web-ui` 门槛No允许.  */
import { esc, icon, requestErrorMessage } from '../core';
import { islandShortcutsEntry } from '../island-skeleton';

const NOTE_VARIANTS=new Set(['secondary','warning','error','success']);

/* `filterRow` 给骨架dentroese两排浮层用: 槽Etiqueta跟着 HTML uno起生成, 否则esteuno会自己画成
   No.dos浮层.  */
export function collectionHeaderHtml({readout='',controls='',before='',className='',loading=false,filterRow=''}={}){
  return `<div class="entitycollectionhead${className?' '+esc(className):''}"${filterRow?` data-filter-row="${esc(filterRow)}"`:''}>${before}<h3${loading?' class="skeleton"':''}>${readout}</h3>${loading && filterRow === 'bottom' ? islandShortcutsEntry() : ''}${controls}</div>`;
}

/* 逐明细收En Note 自己 <details> dentro, Predeterminado折叠: uno句话结论posterior面跟着arribamil行清单时, 
   abajo面contenidoTodo被推走, 而ese句结论本身才es要先读到东西. 每给Título, Descripción y Rutatres段: 
   Solo给uno"ver视频"链continuar话, es哪Archivo得逐点开才知道.  */
interface NoteDetailItem { label?: string; href?: string; note?: string; hint?: string }
interface NoteDetails { label?: string; items?: NoteDetailItem[]; footnote?: string }
function noteDetailsHtml({label='',items=[],footnote=''}:NoteDetails={}){
  const line=(item:NoteDetailItem)=>`<li>${item.href?`<a href="${esc(item.href)}">${esc(item.label||'')}</a>`
    :`<b>${esc(item.label||'')}</b>`}<span>${esc(item.note||'')}</span>${
    item.hint?`<code>${esc(item.hint)}</code>`:''}</li>`;
  return `<details class="geist-note-details"><summary>${esc(label)}</summary>
    <ul>${items.map(line).join('')}</ul>${footnote?`<p>${esc(footnote)}</p>`:''}</details>`;
}

/* Inline, persistent context beside the field/card/section it describes.
   Restaurar动作Con两形态: DejaEn本página执行走按钮, 要离开本página才做得成走链continuar. 
   两者占同uno格子, 同uno `data-note-action`, Note 版No因Como它es <a> 改变.  */
/** Geist Note: 字段, 卡片, 分区旁持久Comentarios.  */
export function noteHtml(message:any,{variant='secondary',label='',className='',size='medium',filled=false,actionLabel='',actionHref='',details=null}:{
  variant?: 'secondary' | 'warning' | 'error' | 'success' | (string & {});
  label?: string;
  className?: string;
  size?: 'small' | 'medium' | (string & {});
  actionLabel?: string; filled?: boolean;
  /** Restaurar动作要离开本página才做得成时给出目标地址, 动作由按钮换成同格子链continuar.  */
  actionHref?: string;
  /** 逐明细, 收En Note dentroPredeterminado折叠 details; `hint` 放Rutaeste类次要标注.  */
  details?: NoteDetails | null;
}={}):string{
  const kind=NOTE_VARIANTS.has(variant)?variant:'secondary';
  const symbol=kind==='secondary'?'info':kind==='success'?'check':'alert';
  const role=kind==='error'?' role="alert"':' role="note"';
  const action=!actionLabel?''
    :actionHref?`<a class="geist-button" href="${esc(actionHref)}" data-note-action>${esc(actionLabel)}</a>`
    :`<button type="button" class="geist-button primary" data-note-action>${esc(actionLabel)}</button>`;
  return `<div class="geist-note geist-note-${kind}${className?` ${esc(className)}`:''}${size==='small'?' geist-note-small':''}${filled?' geist-note-filled':''}"${role}>
    ${icon(symbol)}<p>${label?`<b>${esc(label)}</b>`:''}<span>${esc(kind==='error'?requestErrorMessage(message):message)}</span></p>${action}${details?noteDetailsHtml(details):''}</div>`;
}

const PROJECT_BANNER_CLASSES:Record<string,string>={gray:'project-banner-gray',success:'ui-project-banner-success',warning:'ui-project-banner-warning',error:'ui-project-banner-error'};
export function projectBannerHtml(message:unknown,{variant='gray',href,label,value,max}:{
  variant?: string; href?: string; label?: string; value?: unknown; max?: unknown;
}={}):string{
  const kind=['gray','success','warning','error'].includes(variant)?variant:'gray';
  return `<aside class="ui-project-banner ${PROJECT_BANNER_CLASSES[kind]}" role="${kind==='error'?'alert':'status'}"><div>${Number(max)>0?gaugeHtml('TareaFinalizar率',value,max):icon(kind==='error'||kind==='warning'?'alert':'info')}<p>${esc(message)}</p></div><a href="${esc(href)}">${esc(label)}</a></aside>`;
}

export function gaugeHtml(label:string,value:unknown,max:unknown=100,{usage=false,compact=false}={}):string{
  const ceiling=Number(max), current=Number(value);
  if(!Number.isFinite(ceiling)||ceiling<=0||!Number.isFinite(current))return `<span>${esc(label)}: No disponible</span>`;
  const percent=Math.max(0,Math.min(100,current/ceiling*100));
  const level=usage?(percent>=95?'error':percent>=80?'warning':'normal'):'normal';
  const status=usage?(level==='error'?'Vacío间即将用Lleno':level==='warning'?'Vacío间使用偏alto':'Vacío间充足'):'';
  return `<span class="ui-geist-gauge" data-level="${level}" role="progressbar" aria-label="${esc(label+(status?': '+status:''))}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13"/><circle cx="16" cy="16" r="13" pathLength="100" stroke-dasharray="${percent} 100"/></svg></span>${status&&!compact?`<span class="ui-gauge-status">${status}</span>`:''}`;
}

/** Determinate progress only. Callers supply real units instead of a decorative width. */
export function progressHtml(label:string,value:unknown,max:unknown=100,{variant='active',stops=[]}:{
  variant?: 'active' | 'warning' | 'error' | (string & {}); stops?: { value: unknown; label: string }[];
}={}):string{
  const ceiling=Math.max(0,Number(max)||0);
  const current=Math.max(0,Math.min(Number(value)||0,ceiling));
  const percent=ceiling?current/ceiling*100:0;
  return `<div class="ui-geist-progress" role="progressbar" aria-label="${esc(label)}"
    aria-valuemin="0" aria-valuemax="${ceiling}" aria-valuenow="${current}"
    style="--progress-value:${percent}%;--progress-color:var(${variant==='error'?'--drop':variant==='warning'?'--meter':'--feedback-success'})"><i></i>${stops.filter(stop=>Number(stop.value)>0&&Number(stop.value)<ceiling&&stop.label).map(stop=>`<span class="ui-geist-progress-stop" style="left:${Number(stop.value)/ceiling*100}%" role="img" aria-label="${esc(stop.label)}"></span>`).join('')}</div>`;
}

/**
 * Geist Spinner: immediate feedback for a user-triggered action. Geist names
 * "inline icon refresh" as one of its three cases, so an icon-only key that
 * swaps its glyph for these ten bars is the prescribed shape, not a fallback.
 *
 * `label` names the work in flight (`En curso换uno批`), never the action the button
 * already carries. This span is a `role=status` region sitting inside a button
 * that has its own accessible name: repeating that name announces the same
 * words twice and tells the reader nothing changed.
 */
export function spinnerHtml(label='CargarEn proceso'):string{
  const bars=Array.from({length:10},(_,index)=>
    `<i aria-hidden="true" style="--spinner-angle:${index*36}deg;--spinner-delay:${index*100-900}ms"></i>`).join('');
  return `<span class="ui-geist-spinner" role="status" aria-label="${esc(label)}">${bars}</span>`;
}

/**
 * Geist Search Input: search icon as a prefix, swapped in place for a Spinner
 * while the query runs, and the input geometry never changes. Read-only queries
 * carry no submit button, so the accessible name lives in `aria-label` — a
 * placeholder is not a label, it disappears the moment there is text to read.
 */
export function searchInputHtml({label,id='',name='',value='',placeholder='',attrs=''}:{
  label?: string; id?: string; name?: string; value?: unknown; placeholder?: string; attrs?: string;
}={}):string{
  const parts=[
    'type="search" enterkeyhint="search"',
    id?`id="${esc(id)}"`:'',
    name?`name="${esc(name)}"`:'',
    placeholder?`placeholder="${esc(placeholder)}"`:'',
    `value="${esc(value)}"`,
    `aria-label="${esc(label)}"`,
    'spellcheck="false" autocomplete="off"',
    attrs,
  ].filter(Boolean).join(' ');
  return `<div class="geist-search" data-search-input>
    <span class="geist-search-prefix" data-search-prefix>${icon('search')}</span>
    <input ${parts}></div>`;
}

/** Geist Loading Dots: indeterminate work continuing in the background. */
export function loadingDotsHtml(label='Procesando', {className=''}={}):string{
  return `<span class="ui-geist-loading${className?` ${esc(className)}`:''}" role="status">
    <span class="ui-geist-loading-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span>${esc(label)}</span></span>`;
}

/**
 * página面分区 Tabs: uno排互斥"esteunopágina现En摆es哪uno组东西". 
 *
 * 索引página用它切Sello/Agenciay本地/En线两套词表: 两档各esuno地址. 它回答espágina面层级
 * "En哪unopágina", Noes给当anterioreste批加unoFiltrar—Filtrar归玻璃en la药丸. 
 * 每uno都es `role=tab`, 当anterior项写 `aria-selected`; 选en proceso态由 `ui-board-local-nav`
 * en proceso性Introduce充样提供, aquíSolo出 DOM. 计数espuede选尾随徽标, 口径由调用方
 * 给: Tabs 自己No算数. anterior置字形也espuede选, SoloEn它指向对象(Sello, Agencia, 本地, 订阅源)
 * 时出现. 
 */
export function boardTabsHtml(items:{value:unknown;label:unknown;count?:unknown;symbol?:string}[],
  {active='',attr='data-tab',label='Vista de página',className='',panel=''}:{
    active?: unknown; attr?: string; label?: string; className?: string; panel?: string;
  }={}):string{
  const tabs=items.map(({value,label:text,count,symbol})=>{
    const selected=String(value)===String(active);
    const badge=count==null?'':`<span class="ui-board-tab-count">${esc(Number(count).toLocaleString())}</span>`;
    return `<button type="button" role="tab" ${attr}="${esc(value)}" aria-selected="${selected}"${
      panel?` aria-controls="${esc(panel)}"`:''}>${symbol?icon(symbol):''}${esc(text)}${badge}</button>`;
  }).join('');
  return `<div class="ui-board-local-nav ui-board-tabs${className?` ${esc(className)}`:''}" role="tablist" aria-label="${esc(label)}">${tabs}</div>`;
}

/** Geist Empty State: icon tile, title and explanatory copy stay one semantic unit. */
/** Geist Empty State: Imagen标, TítuloyDescripción同处uno组件interior.  */
export function emptyStateHtml(iconName:string,title:unknown,description:unknown,{className='',actions=''}={}):string{
  return `<div class="ui-emptystate${className?` ${esc(className)}`:''}" data-geist-empty-state role="status">
    <div class="ui-es-icon" aria-hidden="true">${icon(iconName)}</div>
    <div class="ui-es-copy"><h3>${esc(title)}</h3><p>${esc(description)}</p></div>
    ${actions?`<div class="ui-es-actions">${actions}</div>`:''}
  </div>`;
}

/**
 * 共用勾选框. Original生 checkbox En暗色abajo由Explorar dispositivo自绘, 跟站interior别ControlesNoes同uno套语言; 
 * `accent-color` 也Solo能改选en proceso色, no选en proceso态连Pasar el ratónComentarios都给No. 所以自绘uno, 关注
 * Lista, 来源Filtrar, 候选清单, Etiqueta匹配 y Configuración项共用它. 
 */
export function badgeHtml(text:unknown):string{return `<span class="ui-geist-badge">${esc(text)}</span>`}

export function checkboxHtml(inputAttrs=''):string{
  return `<span class="ui-pcheck"><input type="checkbox" ${inputAttrs}><span aria-hidden="true">${icon('check')}</span></span>`;
}
