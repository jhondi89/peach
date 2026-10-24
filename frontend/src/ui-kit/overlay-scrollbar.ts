interface Lane { axis: 'x' | 'y'; track: HTMLDivElement; thumb: HTMLDivElement; range: number; travel: number }

/**
 * 覆盖滚动: 滑浮Encontenidoarriba, uno列ancho度都No占. 
 *
 * yaCon `.geist-scroller` 解决es另unomedio问题—它用两端渐隐Descripción"还能往abajo", 
 * peroSin滑, 读No出esteuno列Conmáslargo, 自己停En哪儿, 而且要求contenido套进它自己包装层. 
 * aquíSolo往既Con滚动容Dispositivo父元素arriba挂轨道, No动contenido结构, 两者puede以叠加使用. 
 *
 * 轨道必须es容Dispositivo兄弟: 跟着contenidouno起滚轨道etc.于Sin轨道. 宿主因此得es定祖先, 
 * 而且Nouno定 y 容Dispositivouno样grande(Configuración面板卡片还含着Título栏), 所以轨道Ubicación每次都按
 * 两 rect 量出来, No假设它们同框. 两轴各uno轨道, 谁溢出谁显示—同uno容Dispositivo
 * puede能EnNo同版abajo换轴(ColaLista `[data-mix-list]` En带ColaDetalles格dentro就es横滚). 
 * Completopáginaeseunoes唯uno例exterior: `html` Sin元素父级, 轨道挂进 body y由 `.page` 改成
 * fixed, UbicaciónSolo认视口, No用量. 
 * 几何按 2026-09-05 实测 vercel.com 侧栏: 
 * 滑largo = puede视largo / contenidolargo × 轨道largo, 移 = 滚动Progreso × (轨道largo − 滑largo). 
 * 返回uno手动pesado算函数, 给ese些既No改容Dispositivo尺寸也No改子树情形(例如换Fuente de letraposteriorpesado排). 
 */
export function attachOverlayScrollbar(
  container: HTMLElement | null, { variant = '' }: { variant?: string } = {},
): (() => void) | null {
  if(!container||container.dataset.overlayScrollbar)return null;
  const root=container===document.documentElement;
  const host=root?document.body:container.parentElement;
  if(!host)return null;
  container.dataset.overlayScrollbar='true';
  // 轨道按宿主Relleno框定, static 宿主会它甩到更exterior层某祖先arriba去. 
  if(!root&&getComputedStyle(host).position==='static')host.style.position='relative';
  // 局部纵向滚动Unificado显示边缘Sugerencia, Completopágina使用粘性导航层次. 
  const edges=root?null:document.createElement('div');
  if(edges){
    edges.className='ui-ov-edges';
    edges.setAttribute('aria-hidden','true');
    edges.innerHTML='<span class="ui-ov-edge-top"></span><span class="ui-ov-edge-bottom"></span>';
    host.append(edges);
  }
  const axes:Lane['axis'][]=root?['y']:['y','x'];
  const lanes=axes.map((axis):Lane=>{
    const track=document.createElement('div');
    // 两类名写Todo, 别拼 `ov-${axis}`: 样表SeleccionarDispositivo要能En源码dentro查到消费者. 
    track.className=`ovtrack ${axis==='y'?'ov-y':'ov-x'}${variant?` ${variant}`:''}`;
    const thumb=document.createElement('div');
    thumb.className='ovthumb';
    track.append(thumb);
    host.append(track);
    return {axis,track,thumb,range:0,travel:0};
  });
  /* 容DispositivoEn宿主en la偏移, Solo能按Diseño盒子量. `getBoundingClientRect()` 给es变换posterior
     几何, 而abajo面要拿它跟 `clientWidth` este类Diseño值相减—弹层开合动画正卡片按
     `scale(.85)` 缩着ese 300ms dentro, 两者NoEn同uno坐标系, 算出来轨道Ubicación会落进
     容Dispositivointerior部. 实测Configuración弹层primero帧derechaMargen 41px(应Como 0), 直到滚unoabajo触发pesado算才跳回derecha
     边缘, ver着像"滚动从izquierda边跑到derecha边". `offsetLeft`/`offsetTop` No受变换影响, 
     沿 offsetParent 链累加到宿主Como止; 走No到宿主(宿主Noes定祖先)才退回量 rect.  */
  const offsetWithin=()=>{
    let left=0,top=0,node:Element|null=container;
    while(node&&node!==host){
      const box=node as HTMLElement;left+=box.offsetLeft;top+=box.offsetTop;node=box.offsetParent}
    if(node===host)return {left,top};
    const hostRect=host.getBoundingClientRect(),rect=container.getBoundingClientRect();
    return {left:rect.left-hostRect.left-host.clientLeft,
      top:rect.top-hostRect.top-host.clientTop};
  };
  const place=({axis,track}:Lane)=>{
    if(root)return;
    const {left,top}=offsetWithin();
    if(axis==='y'){
      track.style.top=`${top+8}px`;
      track.style.height=`${Math.max(0,container.clientHeight-16)}px`;
      track.style.right=`${host.clientWidth-left-container.clientWidth}px`;
    }else{
      track.style.left=`${left+8}px`;
      track.style.width=`${Math.max(0,container.clientWidth-16)}px`;
      track.style.bottom=`${host.clientHeight-top-container.clientHeight}px`;
    }
  };
  let verticalRange=0,edgeState='';
  // 滚动Solo读取Ubicación; 容Dispositivoy轨道尺寸由尺寸, contenido变化 y 手动pesado算Actualizar. 
  const paintPosition=()=>{
    const top=container.scrollTop,left=container.scrollLeft;
    if(edges){
      const above=verticalRange>1&&top>1;
      const below=verticalRange>1&&top<verticalRange-1;
      const state=`${above}:${below}`;
      if(state!==edgeState){
        edgeState=state;
        edges.hidden=!above&&!below;
        edges.classList.toggle('ui-can-scroll-top',above);
        edges.classList.toggle('ui-can-scroll-bottom',below);
        if(above||below){
          container.style.setProperty('--scroll-edge-top',above?'16px':'0px');
          container.style.setProperty('--scroll-edge-bottom',below?'16px':'0px');
        }else{
          container.style.removeProperty('--scroll-edge-top');
          container.style.removeProperty('--scroll-edge-bottom');
        }
        container.toggleAttribute('data-scroll-edges',above||below);
      }
    }
    lanes.forEach(({axis,thumb,range,travel})=>{
      if(range<=1)return;
      const offset=travel>0?Math.max(0,Math.min(1,(axis==='y'?top:left)/range))*travel:0;
      thumb.style.transform=`translate${axis==='y'?'Y':'X'}(${offset}px)`;
    });
  };
  let pendingFrame:number|null=null;
  const schedulePosition=()=>{
    if(pendingFrame!==null)return;
    pendingFrame=requestAnimationFrame(()=>{pendingFrame=null;paintPosition()});
  };
  const sync=()=>{
    verticalRange=container.scrollHeight-container.clientHeight;
    if(edges){
      const {left,top}=offsetWithin();
      edges.style.left=`${left}px`;
      edges.style.top=`${top}px`;
      edges.style.width=`${container.clientWidth}px`;
      edges.style.height=`${container.clientHeight}px`;
    }
    lanes.forEach(lane=>{
      const {axis,track,thumb}=lane,vertical=axis==='y';
      const size=vertical?container.clientHeight:container.clientWidth;
      const content=vertical?container.scrollHeight:container.scrollWidth;
      const range=content-size;
      lane.range=range;
      lane.travel=0;
      if(range<=1){track.hidden=true;return}
      // 先显再量: 藏起来轨道largo度es 0, 拿它当"量No到"会自己永久锁En隐藏态. 
      track.hidden=false;
      place(lane);
      const trackSize=vertical?track.clientHeight:track.clientWidth;
      if(!trackSize)return;
      // corto到抓No住滑etc.于Sin滑: contenido特别largo时给它unoabajo限, 代价es滑Ubicacióny
      // 滚动ProgresoNo再严格线性, peropuede拖动比puede换算pesado要. 
      const thumbSize=Math.max(24,Math.min(trackSize,size/content*trackSize));
      lane.travel=trackSize-thumbSize;
      thumb.style[vertical?'height':'width']=`${thumbSize}px`;
    });
    paintPosition();
  };
  const scroller:EventTarget=root?document:container;
  scroller.addEventListener('scroll',schedulePosition,{passive:true});
  const resize=new ResizeObserver(sync);
  resize.observe(container);
  if(!root)container.addEventListener('load',sync,true);
  // contenidolargocorto变pero容Dispositivo盒子没变(抽屉pesado建, 分区展开), 容Dispositivo自己 ResizeObserver uno声No响. 
  // Completopáginaeseuno改ver body: 它alto度就escontenidoalto度, 而En documentElement arriba挂 subtree 
  // MutationObserver etc.于每渲染uno卡都强制uno次pesado排. 
  if(root)resize.observe(document.body);
  else{
    const observed=new Set<Element>();
    const contentChanged=()=>{
      const children=new Set(container.children);
      observed.forEach(child=>{if(!children.has(child)){resize.unobserve(child);observed.delete(child)}});
      children.forEach(child=>{if(!observed.has(child)){resize.observe(child);observed.add(child)}});
      sync();
    };
    // contenido自身alto度变化也Actualizar几何, 折叠过渡yFuente de letrapesado排Sin需Esperando滚动. 
    contentChanged();
    container.addEventListener('transitionend',sync);
    new MutationObserver(contentChanged).observe(container,{childList:true});
  }
  lanes.forEach(({axis,track,thumb})=>track.addEventListener('pointerdown',event=>{
    const vertical=axis==='y';
    const trackRect=track.getBoundingClientRect(),thumbRect=thumb.getBoundingClientRect();
    const travel=(vertical?trackRect.height-thumbRect.height:trackRect.width-thumbRect.width);
    const range=vertical?container.scrollHeight-container.clientHeight
      :container.scrollWidth-container.clientWidth;
    if(travel<=0||range<=0)return;
    const point=(moved:PointerEvent)=>vertical?moved.clientY:moved.clientX;
    const head=vertical?thumbRect.top:thumbRect.left,tail=vertical?thumbRect.bottom:thumbRect.right;
    // 按En滑arriba就保持按住eseuno点, 按En轨道空白处则滑en proceso心挪过来. 
    const grab=point(event)>=head&&point(event)<=tail?point(event)-head
      :(vertical?thumbRect.height:thumbRect.width)/2;
    const origin=vertical?trackRect.top:trackRect.left;
    const to=(moved:PointerEvent)=>{const at=Math.max(0,Math.min(range,(point(moved)-origin-grab)/travel*range));
      if(vertical)container.scrollTop=at;else container.scrollLeft=at};
    const stop=()=>{track.classList.remove('dragging');
      track.removeEventListener('pointermove',to);track.removeEventListener('pointerup',stop);
      track.removeEventListener('pointercancel',stop)};
    track.classList.add('dragging');
    track.setPointerCapture(event.pointerId);
    track.addEventListener('pointermove',to);
    track.addEventListener('pointerup',stop);
    track.addEventListener('pointercancel',stop);
    to(event);
    event.preventDefault();
  }));
  sync();
  return sync;
}
