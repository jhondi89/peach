/* Geist MiddleTruncate  Peach Original生适配层. 

   Solo复用yaVerificar行Como: 按容Dispositivoancho度保Dejaprimero尾, 使用单省略号, ancho度变化posteriorpesado算, CopiarySin障碍名称
   仍提供完CompletoOriginal文. 调用方Solo需给Archivo名, Ruta, URL 或 ID 加 data-middle-truncate; Título y DescripciónContinuar
   使用último尾省略. 随 `peach-app.js` 发出, 由 Application 启动yLimpiarTodoDocumentación唯uno观察者, 
   Original生宿主y React 子树写属性都归它管.  */

interface TruncateState { full: string; rendered: string; raf: number }

const ELLIPSIS='...';
const segmenter=typeof Intl.Segmenter==='function'
  ? new Intl.Segmenter(undefined,{granularity:'grapheme'})
  : null;
const states=new WeakMap<Element,TruncateState>();
let observed=new WeakSet<Element>();
let resizeObserver:ResizeObserver|null=null;
let disposeTruncation:(()=>void)|null=null;
let tracked=new Set<Element>();

const graphemes=(value:unknown)=>segmenter
  ? [...segmenter.segment(String(value??''))].map(part=>part.segment)
  : Array.from(String(value??''));

/* 纯算法边界单独Exportar, Node puede直continuar实测, No需要伪造 DOM. fits(candidate) 由Explorar dispositivo
   测量层注入; dos分寻找能放abajo最largoprimero尾组合, 奇数优先保Deja开头.  */
function middleTruncateText(value:unknown,fits:(candidate:string)=>boolean):string{
  const parts=graphemes(value);
  if(!parts.length||fits(value as string))return String(value??'');
  let low=0,high=Math.max(0,parts.length-1),best=ELLIPSIS;
  while(low<=high){
    const kept=(low+high)>>1;
    const head=Math.ceil(kept/2),tail=Math.floor(kept/2);
    const candidate=parts.slice(0,head).join('')+ELLIPSIS+(tail?parts.slice(-tail).join(''):'');
    if(fits(candidate)){best=candidate;low=kept+1}else high=kept-1;
  }
  return best;
}

const measuredWidth=Object.assign((element:Element,value:string)=>{
  const style=getComputedStyle(element);
  const canvas=measuredWidth.canvas||(measuredWidth.canvas=document.createElement('canvas'));
  const context=canvas.getContext('2d');
  if(!context)return Number.POSITIVE_INFINITY;
  /* Chromium 会En font-variant-numeric etc.largo数字开启时计算posterior font 简写返回Como空串; 
     直continuar赋值会让 Canvas 静predetermina退回 10px sans-serif, 进而bajo估en proceso文Archivo名ancho度.  */
  context.font=style.font||`${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  let width=context.measureText(value).width;
  const letterSpacing=parseFloat(style.letterSpacing);
  if(Number.isFinite(letterSpacing))width+=Math.max(0,graphemes(value).length-1)*letterSpacing;
  const wordSpacing=parseFloat(style.wordSpacing);
  if(Number.isFinite(wordSpacing))width+=(value.match(/\s/g)||[]).length*wordSpacing;
  return width;
},{canvas:null as HTMLCanvasElement|null});

/* puede用ancho度Predeterminado取元素自己盒子. 带 data-middle-truncate-within 元素按contenido收缩(posterior面紧跟着
   别东西, 比如Archivo名posterior面"最grande"Etiqueta), 自己盒子就es当anterior文字ancho度—拿它当arriba限, 
   clientWidth 取Completomenos掉eseNo到uno像素每uno轮都让Todo文"放Noabajo", 越截越corto. este类元素改按父级
   量: 父级contenidoancho减去所Con兄弟 y 列Espaciado, 剩abajo才es文字能占.  */
const availableWidth=(element:HTMLElement)=>{
  if(element.dataset.middleTruncateWithin===undefined)return element.clientWidth;
  const box=element.parentElement;if(!box)return element.clientWidth;
  const style=getComputedStyle(box);
  const gap=parseFloat(style.columnGap)||0;
  let used=0,shown=0;
  for(const child of box.children){
    const width=child.getBoundingClientRect().width;
    if(child===element){shown++;continue}
    if(width>0){used+=width;shown++}
  }
  return box.getBoundingClientRect().width-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0)
    -used-gap*Math.max(0,shown-1);
};

const paint=(element:HTMLElement)=>{
  const state=states.get(element);if(!state||!element.isConnected)return;
  const available=availableWidth(element);
  const rendered=available>0
    ? middleTruncateText(state.full,candidate=>measuredWidth(element,candidate)<=available)
    : state.full;
  state.rendered=rendered;
  if(element.textContent!==rendered)element.textContent=rendered;
  const truncated=rendered!==state.full;
  element.classList.toggle('middle-truncated',truncated);
  element.setAttribute('aria-label',state.full);
  if(!element.hasAttribute('title')||element.dataset.middleTitle==='true'){
    element.title=state.full;element.dataset.middleTitle='true';
  }
};

const schedule=(element:Element)=>{
  const state=states.get(element);if(!state||state.raf)return;
  state.raf=requestAnimationFrame(()=>{state.raf=0;paint(element as HTMLElement)});
};

const bind=(element:Element)=>{
  if(!(element instanceof HTMLElement))return;
  if(!states.has(element))states.set(element,{full:element.textContent||'',rendered:element.textContent||'',raf:0});
  if(!observed.has(element)){
    observed.add(element);
    tracked.add(element);
    /* 按父级量元素跟着父级尺寸pesado算: 它自己盒子Solo会随文字变, No会随窗口变.  */
    if(element.dataset.middleTruncateWithin!==undefined&&element.parentElement)resizeObserver?.observe(element.parentElement);
    else resizeObserver?.observe(element);
  }
  schedule(element);
};

const scan=(node:Node)=>{
  if(node.nodeType!==Node.ELEMENT_NODE)return;
  const element=node as Element;
  if(element.matches('[data-middle-truncate]'))bind(element);
  element.querySelectorAll('[data-middle-truncate]').forEach(bind);
};

function initMiddleTruncate(root:Document|Element=document):()=>void{
  disposeTruncation?.();
  observed=new WeakSet<Element>();tracked=new Set<Element>();
  const elements=tracked;
  let live=true;
  resizeObserver=new ResizeObserver(entries=>entries.forEach(entry=>{
    if(!live)return;
    schedule(entry.target);
    entry.target.querySelectorAll?.(':scope>[data-middle-truncate-within]').forEach(schedule);
  }));
  const resize=resizeObserver;
  scan((root as Document).documentElement||root);
  const mutations=new MutationObserver(records=>records.forEach(record=>{
    if(!live)return;
    record.addedNodes.forEach(scan);
    const element=record.target.nodeType===Node.TEXT_NODE?record.target.parentElement:record.target as Element;
    const target=element?.closest?.('[data-middle-truncate]') as HTMLElement|null|undefined;
    if(!target)return;
    const state=states.get(target);
    if(state&&target.textContent!==state.rendered){
      state.full=target.textContent||'';
      if(target.dataset.middleTitle==='true')target.removeAttribute('title');
      schedule(target);
    }
  }));
  mutations.observe((root as Document).body||root,{childList:true,characterData:true,subtree:true});
  document.fonts?.ready?.then(()=>{if(live)root.querySelectorAll('[data-middle-truncate]').forEach(schedule)});
  const copy:EventListener=event=>{
    const selection=document.getSelection();
    if(!selection||selection.isCollapsed)return;
    const anchor=selection.anchorNode?.nodeType===Node.ELEMENT_NODE?selection.anchorNode as Element:selection.anchorNode?.parentElement;
    const target=anchor?.closest?.('[data-middle-truncate]');
    const state=target&&states.get(target);
    if(!state||!target.contains(selection.focusNode)||!(event as ClipboardEvent).clipboardData)return;
    (event as ClipboardEvent).clipboardData?.setData('text/plain',state.full);event.preventDefault();
  };
  root.addEventListener('copy',copy);
  const dispose=()=>{
    if(!live)return;live=false;
    resize.disconnect();mutations.disconnect();root.removeEventListener('copy',copy);
    for(const element of elements){const state=states.get(element);if(state?.raf){cancelAnimationFrame(state.raf);state.raf=0}}
    elements.clear();
    if(disposeTruncation===dispose){disposeTruncation=null;resizeObserver=null}
  };
  disposeTruncation=dispose;
  return dispose;
}

export { initMiddleTruncate, middleTruncateText };
