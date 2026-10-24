/* 滚动eseuno组: 横排滚轮转向, 拖动y橡皮筋, 横排自动滚动, 选en proceso底板滑动, Geist Scroller, 
   以及按名单批量挂覆盖滚动. 由共享源码直continuar引用, 随 `peach-app.js` 发出; 
   ya绑定横排, 自动滚动ese几排y弹簧取值都es模级Estado, SoloConuno.  */
import { esc } from '../core';

import { attachOverlayScrollbar } from './overlay-scrollbar';

const horizontalControls=new Map<Element,any>();
let horizontalCleanup:MutationObserver|null|undefined;
/* 两次滚轮事件隔más久算Siguiente次手势. 触控板惯性尾巴uno格uno格地来, 间隔En几diez毫秒; 
   人停abajo来再滚uno次, en proceso间隔比estelargo得más.  */
const WHEEL_GESTURE_GAP=240;
/* uno格滚轮至menoseste么grande才平滑着走. 鼠标滚轮uno格esCompletoCompletouno段(Windows arriba 100px 起), 直continuar
   改 `scrollLeft` 会uno格uno格地跳, 而página面自己滚时候每uno格都esuno段动画; 触控板uno次Solo
   给几像素, uno秒几diez次, 本来就es连续, 再套动画Solo会拖lento跟手.  */
const WHEEL_SMOOTH_STEP=50;
/* 平滑eseuno段由esteuno排自己逐帧走, No用 `scrollTo({behavior:'smooth'})`: ese动画每continuaruno格
   都从ceroVelocidadpesadoNuevo起步, 连续转滚轮时uno格uno顿, 实测每两格之间Con两tres帧完Todo停住. aquí每帧
   朝终点走剩abajo距离uno截(Tiempo常数 70ms), Nuevouno格Solo终点往anterior挪, Velocidad度连着走, No断档.  */
const WHEEL_GLIDE_MS=70;
/* 横排滚到头还往anterior推, contenidomás走unopequeño段再弹回来. transitions.dev Sinesteuno配方, 越界移
   借 UIScrollView ese橡皮筋公 `(1 - 1/(x·c/d + 1))·d`(c = 0.55, use-gesture 
   `rubberband` es同uno): 推得越远越推No动, 怎么推也到No容Dispositivoese么ancho. 弹回走站interiorese
   采样弹簧 `--spring-pane`, 冲过Original再荡回来,  y Filtrarese底板uno手感.  */
const RUBBER_BAND=.55;
/* 滚轮Sin"手还按着"eseuno段, 推到头eseunoabajo按esteuno格力度弹uno次: uno格滚轮当作手拖它
   tres成medio, 放En最más 480px ancho橡皮筋arriba算. ancho屏AnteriorCompleto排unomilmás像素, 按Completo排算, uno格
   推出去量会grande到像esCompleto排滑脱.  */
const WHEEL_PULL=.35;
const WHEEL_PULL_SPAN=480;
export function rubberBand(distance:number,dimension:number):number{
  if(!distance||!(dimension>0))return 0;
  return Math.sign(distance)*(1-1/(Math.abs(distance)*RUBBER_BAND/dimension+1))*dimension;
}
/* 移挂Enesteuno排子元素arriba(`.edgepull>*`, 读 `--edge-pull`), No挂En容Dispositivo自己身arriba: 容Dispositivo
   uno挪, 贴着它渐隐遮罩 y exterior面eseuno层边界跟着uno起走, derecha移时还会Completopágina撑出横向滚动. 
   动画SoloEn越界eseunoabajo挂类名, 平时子元素arriba什么都Nomás.  */
function edgeBounce(el:HTMLElement){
  let spring:Animation|null=null,pulled=0;
  const idle=()=>typeof el.animate!=='function'||matchMedia('(prefers-reduced-motion:reduce)').matches;
  const settle=()=>{spring=null;if(!pulled)el.classList.remove('edgepull')};
  const play=(frames:Keyframe[],duration:number)=>{
    spring?.cancel();el.classList.add('edgepull');
    spring=el.animate(frames,{duration});
    spring.onfinish=settle;
  };
  return {
    /* 拖动跟手: 越界másmenos就按橡皮筋收成másmenos, 松手 `release` 弹回.  */
    drag(excess:number){
      if(idle())return;
      spring?.cancel();spring=null;
      pulled=-rubberBand(excess,el.clientWidth);
      el.classList.toggle('edgepull',!!pulled);
      if(pulled)el.style.setProperty('--edge-pull',`${pulled}px`);else el.style.removeProperty('--edge-pull');
    },
    release(){
      if(!pulled)return;
      const from=pulled,ease=glideEase();pulled=0;el.style.removeProperty('--edge-pull');
      play([{'--edge-pull':`${from}px`,easing:ease.easing},{'--edge-pull':'0px'}],ease.duration);
    },
    /* 滚轮顶到头: 冲出去eseuno段减Velocidad, 荡回来ese段走弹簧. uno次手势Solo弹unoabajo, 调用方判.  */
    kick(delta:number){
      if(idle()||pulled)return;
      const peak=-rubberBand(delta*WHEEL_PULL,Math.min(el.clientWidth,WHEEL_PULL_SPAN));
      if(!peak)return;
      const ease=glideEase();
      play([{'--edge-pull':'0px',easing:'cubic-bezier(.2,.8,.4,1)'},
        {'--edge-pull':`${peak}px`,offset:.3,easing:ease.easing},{'--edge-pull':'0px'}],ease.duration*1.6);
    },
  };
}
/** 同uno容DispositivoSolo绑定uno次. 指针Enesteuno排arriba时滚轮Solo滚esteuno排, 滚到头弹unoabajo, No带着Completopágina走.  */
/** 会超ancho横向滚动层: 两端按滚动Ubicación渐隐, 竖向滚轮转成横向, `drag` Como真时puede拖.  */
export function wireHorizontalScroller(el:any,{drag=false,fade=true}={}):any{
  if(!el)return;
  const existing=horizontalControls.get(el);
  if(existing){existing.options.drag ||= drag;existing.options.fade ||= fade;existing.update();return existing}
  const options={drag,fade},abort=new AbortController(),bounce=edgeBounce(el);
  let start:{x:number;left:number}|null=null,moved=0,heldUntil=0,target=0,kicked=false,glide=0,glideAt=0,pos=0,pending=0;
  /* 值没变就No写: 自动滚动每uno帧都触发uno次 `scroll`, 同值pesado写属性照样让样pesado算uno遍.  */
  const mark=(key:string,value:string)=>{if(el.dataset[key]!==value)el.dataset[key]=value};
  const scrollable=()=>['auto','scroll','hidden'].includes(getComputedStyle(el).overflowX);
  const update=()=>{if(options.fade){const active=scrollable();mark('overflowLeft',String(active&&el.scrollLeft>1));mark('overflowRight',String(active&&el.scrollLeft+el.clientWidth<el.scrollWidth-1))}};
  const listen=(target:EventTarget,event:string,handler:(event:any)=>void,extra={})=>target.addEventListener(event,handler,{...extra,signal:abort.signal});
  listen(el,'scroll',update,{passive:true});
  const kick=(delta:number)=>{if(!kicked){kicked=true;bounce.kick(delta)}};
  const stopGlide=()=>{cancelAnimationFrame(glide);glide=0;pending=0};
  /* Ubicación自己记unopequeño数: uno帧Solo走cero点几像素时, `scrollLeft` 读回来es取Completoposterior值. 
     推过头eseunoabajoetc.走到头再弹, medio路就弹ver起来es没到头先弹.  */
  const frame=(now:number)=>{
    const dt=Math.min(Math.max(now-glideAt,0),64);glideAt=now;
    pos+=(target-pos)*(1-Math.exp(-dt/WHEEL_GLIDE_MS));
    if(Math.abs(target-pos)<.5)pos=target;
    el.scrollLeft=pos;
    if(pos!==target){glide=requestAnimationFrame(frame);return}
    glide=0;
    if(pending){const delta=pending;pending=0;kick(delta)}
  };
  /* página面ese边开头手势拦No住: Chrome uno串滚轮事件认作同uno次手势, No.unoabajo没被拦abajo, 
     posterior面ese些就再也拦No住. página面滚着滚着让esteuno排经过指针底abajo时, este些Original样Deja给página面. 
     Enesteuno排arriba开头手势Completo段都归esteuno排: 还没滚完, 滚到头以posterior, 都No剩abajo交给página面; 
     要滚Completopágina, 指针挪到esteuno排exterior面去. 推过头就弹unoabajo, uno次手势Solo弹uno次: 触控板惯性
     尾巴uno格uno格地撞En边arriba, 每格都弹就esuno串抖动.  */
  listen(el,'wheel',event=>{
    const max=el.scrollWidth-el.clientWidth;
    if(event.defaultPrevented||!event.cancelable||Math.abs(event.deltaY)<=Math.abs(event.deltaX)||max<=0||!scrollable())return;
    event.preventDefault();
    const now=performance.now(),step=Math.abs(event.deltaY);
    if(now>heldUntil)kicked=false;
    heldUntil=now+WHEEL_GESTURE_GAP;
    // 平滑eseuno段还Enmedio路时, Siguiente格从Anterior格终点continuar着算. 
    const from=glide?target:el.scrollLeft,want=from+event.deltaY;
    target=Math.min(max,Math.max(0,want));
    const over=want===target?0:event.deltaY;
    if(step<WHEEL_SMOOTH_STEP||target===from){
      if(target!==from){stopGlide();el.scrollLeft=target}
      if(over&&!glide)kick(over);else if(over)pending=over;
      return;
    }
    if(over)pending=over;
    if(!glide){pos=el.scrollLeft;glideAt=performance.now();glide=requestAnimationFrame(frame)}
  },{passive:false});
  listen(el,'mousedown',event=>{if(!options.drag||event.button!==0||el.scrollWidth-el.clientWidth<=1)return;event.stopPropagation();stopGlide();start={x:event.pageX,left:el.scrollLeft};moved=0;el.style.cursor='grabbing'});
  listen(window,'mousemove',event=>{
    if(!start)return;
    const dx=event.pageX-start.x,want=start.left-dx,max=el.scrollWidth-el.clientWidth;
    moved=Math.max(moved,Math.abs(dx));el.scrollLeft=want;
    bounce.drag(want<0?want:want>max?want-max:0);
    event.preventDefault();
  });
  listen(window,'mouseup',()=>{if(start)bounce.release();start=null;el.style.cursor=''});
  listen(el,'click',event=>{if(moved>6){event.stopPropagation();event.preventDefault();moved=0}},{capture:true});
  const resize=new ResizeObserver(update);
  const observe=()=>{resize.observe(el);for(const child of el.children)resize.observe(child);update()};
  const contents=new MutationObserver(()=>{resize.disconnect();observe()});
  contents.observe(el,{childList:true,characterData:true,subtree:true});observe();
  const control={options,update,destroy(){abort.abort();stopGlide();resize.disconnect();contents.disconnect();horizontalControls.delete(el);el.style.cursor='';if(!horizontalControls.size){horizontalCleanup?.disconnect();horizontalCleanup=null}}};
  horizontalControls.set(el,control);
  if(!horizontalCleanup){horizontalCleanup=new MutationObserver(()=>{for(const [node,item] of horizontalControls)if(!node.isConnected)item.destroy()});horizontalCleanup.observe(document.body,{childList:true,subtree:true})}
  update();return control;
}

/* uno排横卡自己缓缓往anterior走, 走到头停unoabajo再往回走. uno秒 24px esver得出En动, 又No催人读
   Velocidad度: uno 168px 卡siete秒走过去. 两端各停两秒, 最posterioruno y No.uno都ver得清.  */
const AUTO_SCROLL_SPEED=24;
const AUTO_SCROLL_DWELL=2000;
/* 人手动过之posterior隔más久再continuar着走: 刚滚到想verese, esteuno排马arriba又自己挪走, etc.于跟人抢.  */
const AUTO_SCROLL_RESUME=3000;
const autoScrollers=new Map<Element,()=>void>();
const autoScrollWakeups=new Set<()=>void>();
let autoScrollVisibility:MutationObserver|null=null;
/**
 * 横排自动滚动. 指针停Enarriba面, 焦点Endentro面, esteuno排NoEn屏幕arriba, página面切到posterior时都停; 
 * 人滚过或拖过之posterior从人停abajoUbicacióncontinuar着走. 系统要求减menos动态效果时No动. 
 */
export function wireAutoScroll(el:any):void{
  if(!el||autoScrollers.has(el))return;
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)return;
  const abort=new AbortController();
  let pos=el.scrollLeft,dir=1,last=0,frame=0,hovered=false,holdUntil=0;
  const listen=(target:EventTarget,type:string,fn:()=>void)=>target.addEventListener(type,fn,{passive:true,signal:abort.signal});
  /* EnNoEn屏幕arriba每帧量uno次, No另挂观察Dispositivo: página面观察DispositivoSoloDeja给"载入更más"eseuno. 
     滚出屏幕posterior循环停abajo, página面再滚动时由abajo面捕obtener监听叫醒.  */
  const onscreen=()=>{const r=el.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight};
  const running=()=>el.isConnected&&!hovered&&!document.hidden&&
    (!document.body.hasAttribute('data-detail-open')||!!el.closest('#stage'))&&!el.matches(':focus-within')&&onscreen();
  const tick=(now:number)=>{
    frame=0;
    if(!el.isConnected){stop();return}
    if(!running())return;
    frame=requestAnimationFrame(tick);
    const dt=last?Math.min(now-last,64):0;last=now;
    const max=el.scrollWidth-el.clientWidth;
    if(now<holdUntil||max<=1)return;
    /* Ubicación自己记unopequeño数: uno帧Solo走cero点几像素, `scrollLeft` 读回来es取Completoposterior值, 
       拿它continuar着加会uno直Original地No动.  */
    pos=Math.min(max,Math.max(0,pos+dir*AUTO_SCROLL_SPEED*dt/1000));
    el.scrollLeft=pos;
    if(pos>=max||pos<=0){dir=pos>=max?-1:1;holdUntil=now+AUTO_SCROLL_DWELL}
  };
  // pesado画换掉esteuno排时, 挂En document en la监听要EnSiguiente次叫醒时跟着撤掉. 
  const wake=()=>{if(!el.isConnected)stop();else if(!frame&&running()){last=0;frame=requestAnimationFrame(tick)}};
  const hold=()=>{holdUntil=performance.now()+AUTO_SCROLL_RESUME};
  // 读回来 y 自己记差No到uno像素就es自己eseuno帧; 差得máses人滚, 从人停abajo地方continuar着走. 
  listen(el,'scroll',()=>{if(Math.abs(el.scrollLeft-pos)>1){pos=el.scrollLeft;hold()}});
  listen(el,'pointerenter',()=>{hovered=true});
  listen(el,'pointerleave',()=>{hovered=false;hold();wake()});
  listen(el,'focusout',()=>setTimeout(wake,0));
  listen(document,'visibilitychange',wake);
  document.addEventListener('scroll',wake,{capture:true,passive:true,signal:abort.signal});
  wake();
  function stop(){cancelAnimationFrame(frame);frame=0;abort.abort();autoScrollers.delete(el);autoScrollWakeups.delete(wake);
    if(!autoScrollers.size){autoScrollVisibility?.disconnect();autoScrollVisibility=null}}
  autoScrollers.set(el,stop);
  autoScrollWakeups.add(wake);
  if(!autoScrollVisibility){autoScrollVisibility=new MutationObserver(()=>autoScrollWakeups.forEach(resume=>resume()));
    autoScrollVisibility.observe(document.body,{attributes:true,attributeFilter:['data-detail-open']})}
}
export function stopAutoScroll(el:Element):void{autoScrollers.get(el)?.()}

/* uno排dentro标出"当anteriores哪uno"ese底板, Todo站SoloConesteuno动法: 滑过去, 冲过落点, 荡回来. 
   Filtrararribaese玻璃, 抽屉eseuno列, 分段Controlesdentroese白底, En人眼dentroes同uno件事, 各写uno段就会
   各自漂移成tres手感. 
   弹簧曲线 y 它Duración都写En `board.css`  `--spring-pane` arriba, aquíSolo读uno次: ese串数esuno次
   弹簧模拟采样Resultado, 抄No.dos就没人再改得动它.  */
let paneSpring:{easing:string;duration:number}|null=null;
export function glideEase():{easing:string;duration:number}{
  if(!paneSpring){
    const css=getComputedStyle(document.documentElement);
    paneSpring={easing:css.getPropertyValue('--spring-pane').trim()||'ease',
      duration:parseFloat(css.getPropertyValue('--spring-pane-ms'))||300};
  }
  return paneSpring;
}
/* 移走 `translate`, 形变走 `scale`, 两Independiente属性各挂uno段动画, No挤进同uno
   `transform`: uno属性arribaSolo放得Siguiente段, 而este两abajoTiempo形状Noes同uno曲线—移冲过
   落点再荡回来, 抻开esen proceso途最grande, 两头归uno. 分开写, 两段仍然都En合成线程arriba. 
   都No碰 `width`: ancho度esDiseño属性, 逐帧改它etc.于让CompletoDocumentaciónpesadoNuevo排版uno遍, 合成线程碰No
   到它, 主线程uno忙este底板就跟着卡住. 
   `from` 给 null 就Solo落No动画: No.uno次出现eseNo该从别处飞进来.  */
export function moveGlidePane(
  pane:HTMLElement,
  from:{x:number;y:number;w:number;h:number}|null,
  box:{x:number;y:number;w:number;h:number},
  axis:'x'|'y'='x',
):void{
  /* Original地pesado量也要撤掉还En跑移y形变, 动画No能Continuar覆盖Nuevo落点.  */
  pane.getAnimations().forEach(a=>a.cancel());
  pane.style.width=`${box.w}px`;pane.style.height=`${box.h}px`;
  const span=axis==='y'?'h':'w',head=axis==='y'?'y':'x';
  const settled=`${box.x}px ${box.y}px`;
  if(from&&from[head]!==box[head]&&!matchMedia('(prefers-reduced-motion:reduce)').matches){
    const ease=glideEase();
    pane.animate([{translate:axis==='y'?`${box.x}px ${from.y}px`:`${from.x}px ${box.y}px`},
      {translate:settled}],{duration:ease.duration,easing:ease.easing,fill:'none'});
    /* uno被拽着走软东西, 跑起来En跑方向arriba抻开, 停abajo来收回去. 抻másmenos按esteuno跳跨
       自己几身算, 封Enunomedio身: 再远也No该更largo, ese时候读起来Noes被拉largo同uno
       , es换arriba来另uno. 峰值压Enanteriortres成—加Velocidadeseuno段才拉得动它. 
       形变SoloEnesteuno排排布方向arriba: 另uno根轴尺寸esesteuno排给定, Enese儿拉扯会让它ver
       起来Noesesteuno排en la东西.  */
    const reach=Math.min(Math.abs(box[head]-from[head])/box[span],1.5),grow=1+reach*.12;
    pane.animate([{scale:'1 1',offset:0},
      {scale:axis==='y'?`1 ${grow}`:`${grow} 1`,offset:.3},{scale:'1 1',offset:1}],
      {duration:ease.duration,easing:'ease-in-out',fill:'none'});
  }
  pane.style.translate=settled;
}

/** Geist Scroller: one-axis overflow with edge fades as the scroll affordance. */
export function scrollerHtml(content:string,{className='',label='Contenido desplazable',overflow='y'}={}){
  const axis=new Set(['x','y','both']).has(overflow)?overflow:'y';
  return `<div class="ui-geist-scroller${className?` ${esc(className)}`:''}" data-geist-scroller>
    <div class="ui-geist-scroller-overlay" aria-hidden="true"></div>
    <div class="ui-geist-scroller-container" data-overflow="${axis}" tabindex="0" aria-label="${esc(label)}">${content}</div>
  </div>`;
}

function updateScroller(wrapper:Element){
  const container=wrapper.querySelector(':scope > .ui-geist-scroller-container');
  const overlay=wrapper.querySelector(':scope > .ui-geist-scroller-overlay');
  if(!container||!overlay)return;
  overlay.classList.toggle('ui-can-scroll-top',container.scrollTop>1);
  overlay.classList.toggle('ui-can-scroll-bottom',container.scrollTop+container.clientHeight<container.scrollHeight-1);
  overlay.classList.toggle('can-scroll-left',container.scrollLeft>1);
  overlay.classList.toggle('can-scroll-right',container.scrollLeft+container.clientWidth<container.scrollWidth-1);
}

/** Wire newly rendered scrollers without duplicating listeners after a rerender. */
export function wireScrollers(root:ParentNode=document):void{
  root.querySelectorAll('[data-geist-scroller]').forEach(wrapper=>{
    const container=wrapper.querySelector<HTMLElement>(':scope > .ui-geist-scroller-container');
    if(!container)return;
    if(!container.dataset.scrollerWired){
      container.dataset.scrollerWired='true';
      container.addEventListener('scroll',()=>updateScroller(wrapper),{passive:true});
      container.addEventListener('load',()=>updateScroller(wrapper),true);
    }
    requestAnimationFrame(()=>updateScroller(wrapper));
  });
}

/** 挂覆盖滚动滚动容Dispositivo. ListaSolo写Enesteuno处, 样ese边认es挂arriba之posterior属性. 
 *
 * `[data-stage-scroll]` esDetalles浮窗dentro所Concontenidoexterior层. estrecho屏abajoCompletocontenido自己纵向滚, 滚得es它而Noes
 * `<dialog data-stage>` 本身: 轨道必须es滚动容Dispositivo兄弟, 而 dialog En顶层, 挂En它
 * 父级en la轨道会落到遮罩底abajo. ancho屏abajo它No溢出, 组件自己量得出来, 轨道No显示.  */
const OVERLAY_SCROLLERS=[
  '[data-stage-side-content]','[data-stage-scroll]','.tagpickbody','[data-mix-list]','.playlistpicklist',
  '[data-player-stats]',
  '.vjs-peach-settings-menu','.ui-geist-scroller-container','.metricstrip','.ui-tastesummaries',
  '.ui-skeletondashstrip','.followpagination',
  '.reviewtabs','.ftablewrap','.ui-board-local-nav','[data-manage-menu]',
  '.follow-workspace-switch','.fmanagenav','[role="listbox"]',
].join(',');
/* Board 层dentro会超ancho横向滚动层: 两端按滚动Ubicación渐隐Descripción"ese边还Con", 鼠标停Enarriba面时竖向
   滚轮转成横向. 边线Deja给exterior层框, 渐隐Solo落Enesteuno层. 
   aquí登记都es `frontend/` 或 board.css 画出来层, 它们No经过 `wireAllDrag` ese按 id
   点名清单, 漏登记就es"ver得见, 够No着": uno排分区En 390px abajo溢出两cienmás像素, 
   却既Sin渐隐也Nocontinuar滚轮. 组件自己量溢出, No溢出ancho度arriba登记etc.于空转, 所以按puede能
   溢出层登记, No按某uno断点登记. React 档página面自己用 `overflow-x-auto`, No进este清单.  */
const BOARD_EDGE_SCROLLERS='.reviewtabs,.ftablewrap,.ui-board-local-nav,[data-manage-menu],'
  +'.follow-workspace-switch,.fmanagenav';

/** esteuno批 DOM dentro所Con该Con覆盖滚动容Dispositivocontinuararriba; Repetir调用SolocontinuarNuevo出现ese些.  */
export function wireOverlayScrollbars(root:ParentNode=document):void{
  root.querySelectorAll<HTMLElement>(OVERLAY_SCROLLERS).forEach(el=>{
    if(el.matches(BOARD_EDGE_SCROLLERS)){
      wireHorizontalScroller(el);return;
    }
    attachOverlayScrollbar(el);
  });
}
