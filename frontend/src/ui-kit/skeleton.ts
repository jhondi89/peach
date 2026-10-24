/* 骨架: Completo占, 索引占, Configuraciónpágina占, 落进 DOM posterior按实际尺寸补齐, 过显示门槛才露面, 
   到货时占换成真contenido. 由共享源码直continuar引用, 随 `peach-app.js` 发出.  */
import { esc } from '../core';

/**
 * 占换成真contenido: antiguoeseuno屏抬成盖En容Dispositivoen launo层淡出, Nuevocontenido同时从Difusodentro清晰起来. 
 *
 * `write()` 负责Nuevocontenido写进 `container`. 容DispositivodentroSin骨架时直continuar写, No套esteuno层—
 * 翻página, Filtrareste类"contenido换contenido"No属于este动效, 套arriba去每换uno次FiltrarCompletopágina都糊unoabajo. 
 */
export function revealSkeleton(container:any,write:()=>void):void{
  if(!container)return;
  /* 还没到显示门槛就ya经取完: 直continuar落contenido. 隐藏en proceso占从no被人ver见, No该Como它再
     播uno段"骨架退场"; este也让很rápido本地Por favor求完TodoSin骨架闪烁.  */
  if(container.querySelector('.skeleton-awaiting')){write();return}
  const hasSkeleton=container.querySelector('.skeleton,[data-skeleton],.skeletoncard,.countskeleton');
  if(!hasSkeleton||!container.firstChild){write();return}
  const fade=document.createElement('div');
  fade.className='skelfade';
  fade.setAttribute('aria-hidden','true');
  while(container.firstChild)fade.append(container.firstChild);
  write();
  container.classList.add('skelreveal');
  container.prepend(fade);
  container.getBoundingClientRect();
  container.classList.add('revealing');
  const drop=()=>{fade.remove();container.classList.remove('skelreveal','revealing')};
  const done=(event:Event)=>{if(event.target!==fade)return;fade.removeEventListener('transitionend',done);drop()};
  fade.addEventListener('transitionend',done);
  setTimeout(()=>{if(fade.isConnected){fade.removeEventListener('transitionend',done);drop()}},1000);
}

export function configurationSkeletonHtml():string{
  const groups:[string,number][]=[['General',2],['Medios',2],['Descargas',2],['Red y acceso',3],['Mantenimiento',3]];
  return `<div class="ui-configpage" data-skeleton="configuration" role="status" aria-label="CargandoConfiguración">${groups.map(([label,count])=>`<h2 class="ui-configgroup" aria-hidden="true">${label}</h2>${Array.from({length:count},()=>`<div class="configfieldset config-skeleton-card" aria-hidden="true"><div class="geist-fieldset-content"><span class="skeleton"></span><span class="skeleton"></span><span class="skeleton"></span></div><footer class="geist-fieldset-footer"><span class="skeleton"></span></footer></div>`).join('')}`).join('')}</div>`;
}

/** Geist Skeleton: reserve a large content region while its structure is loading. */
/* `count` Solo对 cards 生效: 数Sí骨架说出口结构预告, seis对en laSíPósterCuadrícula, 
   而行政界面往往SoloCon两tresgrande区. más画CargarCompletado就消失, eseNoSí占 resultado(s)Sí误报. 
   `cardRatio` SíTarjetaPortadaanchoalto比, 交给调用方按真卡版给: Imagen grande版正封Sí竖, 
   骨架照 16:9 铺话, contenidouno到Completo屏Tarjeta都要被拉altouno截.  */
export function skeletonHtml(label='Cargandocontenido',{className='',variant='panel',count=6,fill=true,gridClass='',gridSize='',cardRatio=0}={}):string{
  const kind=new Set(['panel','cards','dashboard']).has(variant)?variant:'panel';
  const body=kind==='cards'
    ?Array.from({length:Math.max(1,count)},
      ()=>`<span class="skeletoncard"><i></i><s></s><b></b><em></em><u></u></span>`).join('')
    :kind==='dashboard'
      /* 指标带SíEstadísticasyPreferencias两página真正Primero屏contenido, cuatro格Posición y Alto都Sí定死. 
         骨架从grande区Iniciar画, etc.Datos到货再从arriba面挤进unoResultado 96px 带子, Completopágina往abajo跳uno次.  */
      ?`<span class="ui-skeletondashstrip">${Array.from({length:4},
          ()=>`<span><i></i><b></b><em></em></span>`).join('')}</span>
        <span class="ui-skeletondashhero"><i></i><b></b></span>
        <span class="ui-skeletondashpanel"><i></i><b></b><em></em></span>
        <span class="ui-skeletondashpanel"><i></i><b></b><em></em></span>`
    :`<span class="skeleton" style="width:38%"></span>
      <span class="skeleton" style="width:100%"></span>
      <span class="skeleton" style="width:100%"></span>
      <span class="skeleton" style="width:72%"></span>`;
  /* data-skeleton Síeste imagen(es)骨架身. profundo链Iniciar先画uno imagen(es), 路由到 resultado(s)posterior各página再画uno imagen(es), 
     CompletopáginaActualizar就会连闪两段动画; 调用方拿esteClave判断"Ya经Sí同uno imagen(es)", Omitirpesado画.  */
  return `<div class="skeletonpanel skeleton-${kind}${className?` ${esc(className)}`:''}"
    data-skeleton="${esc(kind)}${className?`/${esc(className)}`:''}"${kind==='cards'&&fill?' data-fill=""':''}
    role="status" aria-label="${esc(label)}"><span class="sr-only">${esc(label)}</span>
    <div${gridClass?` class="${esc(gridClass)}"`:''}${gridSize?` data-size="${esc(gridSize)}"`:''}${
      kind==='cards'&&Number(cardRatio)>0?` style="--skeleton-card-ratio:${Number(cardRatio)}"`:''} aria-hidden="true">${body}</div></div>`;
}

/** Indexar占 resultado(s)复用最终Cuadrícula, Avatar y GlosarioTamaño.  */
/** Indexarpágina占 resultado(s): 名册Cuadrícula, Alfabeto或Nube de etiquetas, Tamaño取最终eseuno副. primero屏 y páginainterior换档共用esteuno.  */
export function indexSkeletonHtml({kind,layout='big',mode='alphabet'}:{kind?:string;layout?:string;mode?:string}={}):string{
  const people=kind!=='tags',company=kind==='studios'||kind==='agencies';
  const cell=people
    ?'<span class="icell"><span class="ring skeleton"></span><span class="nm skeleton">&nbsp;</span><span class="n skeleton">&nbsp;</span></span>'
    :'<span class="alphatag"><span class="skeleton"></span><span class="n skeleton"></span></span>';
  const grid=people?`igrid" data-cells="${company?'company':'people'}" data-layout="${esc(layout)}`:'ui-alphalist';
  /* AlfabetoSíunoGrupouno imagen(es)卡: 每Grupo两行占 resultado(s), 铺tresGrupo, 形状同página面Llegarposterior开头ese几Grupo; 
     它No走 `data-fill`—eseResultado补Sí单 imagen(es)Cuadrícula, unoGrupo补到视口abajo沿反而No像.  */
  const body=!people&&mode==='cloud'
    ?`<div class="tagwall index-tags">${Array.from({length:60},(_,i)=>
      `<span class="tg skeleton" style="width:${[92,128,76,108,144][i%5]}px">&nbsp;</span>`).join('')}</div>`
    :people?`<div class="${grid}">${cell.repeat(12)}</div>`
    :`<section class="ui-alphagroup"><span class="indexletterskeleton skeleton"></span><div class="${grid}">${cell.repeat(10)}</div></section>`.repeat(3);
  const label='CargandoIndexar';
  return `<div class="skeletonpanel index-skeleton" data-skeleton="index/${esc(kind)}/${esc(layout)}/${esc(mode)}"${people?' data-fill=""':''}
    role="status" aria-label="${label}"><span class="sr-only">${label}</span><section aria-hidden="true">${body}</section></div>`;
}

/* 骨架数由Contenedor当abajoAncho决定, No写死uno数: 横向uno行铺到derecha缘Como止, Cuadrícula补Lleno
   Completo行. 写死话ancho屏Últimouno行Dejauno截豁口, estrecho屏 y Teléfono端又más出uno堆要横滑才ver得见
   占 resultado(s); 算出来就No必再Como断点各写uno套. Ancho序列SoloSí让胶囊largocortoNouno, 像真词.  */
const SKELETON_SLOT:Record<string,(width:number)=>string>={
  av:()=>`<span class="av avskeleton"><span class="ring"></span><span class="nm">&nbsp;</span></span>`,
  brandpill:width=>`<span class="brandpill brandskeleton" style="width:${width}px"><span class="mk"></span></span>`,
  pill:width=>`<span class="pill tagskeleton" style="width:${width}px"></span>`,
};
const SKELETON_SLOT_WIDTHS:Record<string,number[]>={
  av:[0],
  brandpill:[132,158,118,146,124,164,138],
  pill:[92,68,104,76,88,64,96,72,100,80,68,92,76,84],
};

/* bajo于esteuno段Por favor求直continuarMostrarcontenido. Peach DatosmásEnEsta máquina, 立即占 resultado(s)画出来会让几diez毫segundo(s)
   Normal读取ver成uno次闪烁; 超过门槛才Descripciónpágina面确实Necesarioetc.Pendiente. Solo藏最exterior层占 resultado(s), interior título(s)结构仍先
   参yDiseño y  fit 计算, 因此真正出现时No会再pesado排.  */
export const SKELETON_REVEAL_DELAY=180;
const SKELETON_REVEAL_SELECTOR='[data-skeleton],[data-skeleton-tier],.countskeleton';
function armSkeletonReveal(root:any){
  if(!root)return;
  const all:HTMLElement[]=[...(root.matches?.(SKELETON_REVEAL_SELECTOR)?[root]:[]),
    ...root.querySelectorAll(SKELETON_REVEAL_SELECTOR)];
  const targets=all.filter(node=>!all.some(parent=>parent!==node&&parent.contains(node)));
  for(const target of targets){
    /* Ya经武装过Omitiresteuno就bien. 写 `return` 会让同uno批dentro排En它posterior面占 resultado(s)
       uno都拿No到LatenciaMarcar, 补进来esemedio屏骨架直continuar闪出来.  */
    if(target.dataset.skeletonReveal)continue;
    target.dataset.skeletonReveal='pending';
    target.classList.add('skeleton-awaiting');
    setTimeout(()=>{
      if(!target.isConnected||target.dataset.skeletonReveal!=='pending')return;
      target.dataset.skeletonReveal='shown';
      target.classList.remove('skeleton-awaiting');
    },SKELETON_REVEAL_DELAY);
  }
}

const SKELETON_TIER_LIMIT=64;
/* 横向骨架铺到溢出Contenedorderecha缘Como止. 每量uno次Ancho就Síuno次CompletopáginaDiseño, 逐追加, 逐量话uno排
   要Diseñodiez几dosdiez次, 冷Iniciar实测uno排unocienmás毫segundo(s). 所以按轮来: 先铺uno轮Ancho序列, 量uno次, 按
   量到平均Ancho缺ese截uno次补齐, 再量uno次Confirmar. 几排走同uno轮, 先Todo量再Todo写, 合起来也
   SoloDiseñoeste几次. arriba限SoloSí死循环护栏.  */
function fillSkeletonTiers(jobs:any[]){
  /* 同uno排会再补uno次(名单到, Contenedor改ancho): Ya经越过derecha缘ese排No再追加. Vacío排No必先量.  */
  jobs=jobs.filter(job=>job.row&&SKELETON_SLOT[job.kind]&&(!job.row.children.length||job.row.scrollWidth<=job.row.clientWidth))
    .map(job=>({...job,start:job.row.children.length,added:0}));
  const add=(job:any,count:number)=>{
    const slot=SKELETON_SLOT[job.kind]!,widths=SKELETON_SLOT_WIDTHS[job.kind]!;
    let html='';
    for(const end=Math.min(SKELETON_TIER_LIMIT,job.added+count);job.added<end;job.added++)html+=slot(widths[job.added%widths.length]!);
    job.row.insertAdjacentHTML('beforeend',html);
  };
  for(const job of jobs)add(job,SKELETON_SLOT_WIDTHS[job.kind]!.length);
  for(let round=0;round<4;round++){
    const short=jobs.filter(job=>job.added<SKELETON_TIER_LIMIT&&job.row.scrollWidth<=job.row.clientWidth).map(job=>{
      const first=job.row.children[job.start].getBoundingClientRect(),last=job.row.lastElementChild.getBoundingClientRect();
      const each=Math.max(1,(last.right-first.left)/job.added);
      return [job,Math.ceil((job.row.getBoundingClientRect().right-last.right)/each)+1];
    });
    if(!short.length)break;
    for(const [job,count] of short)add(job,Math.max(1,count));
  }
  for(const job of jobs)armSkeletonReveal(job.row);
}
export function fillSkeletonTier(row:Element|null,kind:string):void{fillSkeletonTiers([{row,kind}])}

/** 骨架落进 DOM 之posterior按实际Tamaño补齐: 横向uno行铺Lleno, TarjetaCuadrícula补到Completo行且盖住视口余量.  */
export function fitSkeleton(root:any):void{
  if(!root)return;
  const scoped=(selector:string):HTMLElement[]=>[...(root.matches?.(selector)?[root]:[]),...root.querySelectorAll(selector)];
  fillSkeletonTiers(scoped('[data-skeleton-tier]').map(row=>({row,kind:row.dataset.skeletonTier})));
  for(const grid of scoped('.skeletonpanel[data-fill]>div,.index-skeleton[data-fill]>section>div')){
    const first=grid.firstElementChild,style=getComputedStyle(grid);
    /* 横排Recomendado行NoSíCuadrícula, 列数Ninguno从谈起, 按Completo行补会它裁成uno imagen(es).  */
    if(!first||style.display!=='grid')continue;
    const columns=style.gridTemplateColumns.split(' ').filter(Boolean).length;
    const rowGap=parseFloat(style.rowGap)||0,cardHeight=first.getBoundingClientRect().height;
    if(!columns||!cardHeight)continue;
    /* 骨架说Sí"este地方etc.abajo会被IntroduceLleno", 所以铺到视口abajo沿; cuatro行Sí护栏, 
       再más也Síuno屏之exteriorverNo见占 resultado(s), 白占动画.  */
    const room=window.innerHeight-grid.getBoundingClientRect().top;
    const rows=Math.max(1,Math.min(4,Math.ceil((room+rowGap)/(cardHeight+rowGap))));
    const want=columns*rows;
    while(grid.children.length>want)grid.lastElementChild!.remove();
    while(grid.children.length<want)grid.appendChild(first.cloneNode(true));
  }
  armSkeletonReveal(root);
}
