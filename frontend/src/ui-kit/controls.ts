/* puede操作ese几样共用Controles: 动作忙态, Geist Switch, 自绘拉, complementarInformación卡y拖动Ordenar. 
   由共享源码直continuar引用, 随 `peach-app.js` 发出; yacontinuar过忙态拦截根es模级Estado, SoloConuno.  */
import { esc, icon } from '../core';

import { wireAnchoredMenu } from './anchored-menu';

/**
 * Geist loading action: visually unavailable and inert without using native
 * `disabled`, so the trigger keeps keyboard focus while its request is running.
 */
export function setActionBusy(control:Element|null|undefined,busy=true):void{
  if(!control)return;
  if(busy){
    control.setAttribute('aria-busy','true');
    control.setAttribute('aria-disabled','true');
  }else{
    control.removeAttribute('aria-busy');
    control.removeAttribute('aria-disabled');
  }
}

const busyActionRoots=new WeakSet<Node>();

/** Block repeat pointer and keyboard activation for every shared busy action. */
export function wireBusyActions(root:Node=document):void{
  if(busyActionRoots.has(root))return;
  busyActionRoots.add(root);
  root.addEventListener('click',event=>{
    const control=(event.target as Element).closest?.('button[aria-busy="true"],[role="button"][aria-busy="true"]');
    if(!control||!root.contains(control))return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
}

/**
 * Geist Switch: 2–3 互斥视Imagen用共享 name uno组 radio, No用 Toggle. 
 *
 * JAV 卡片版 y 关注Lista版es同unoControles—SoloCon name, Opciones y 当anterior值No同, 所以模板
 * y `.iconswitch` 样共用uno; 调用方各自摆放Ubicación仍由自己类负责. 
 */
export function iconSwitchHtml(name:string,legend:string,options:readonly (readonly any[])[],current:unknown,{attr='',className='',text=false}={}):string{
  const items=options.map(([value,label,symbol])=>
    `<label title="${esc(label)}"><input type="radio" name="${esc(name)}" value="${esc(value)}" ${attr}
      ${value===current?'checked':''}><span aria-hidden="true">${text?(symbol?icon(symbol):'')+esc(label):icon(symbol)}</span><span class="sr-only">${esc(label)}</span></label>`).join('');
  return `<fieldset class="iconswitch${text?' iconswitch-text':''}${className?` ${esc(className)}`:''}"><legend class="sr-only">${esc(legend)}</legend>${items}</fieldset>`;
}

/** uno组 iconSwitchHtml 画出来 radio continuar到 apply(value) arriba.  */
export function wireIconSwitch(root:ParentNode|null|undefined,attr:string,apply:(value:string)=>void):void{
  root?.querySelectorAll<HTMLInputElement>(`[${attr}]`).forEach(input=>{
    input.onchange=()=>{if(input.checked)apply(input.value)};
  });
}

/* 自绘单值拉. Original生 `input[type=range]` 轨道, 抓手 y 刻度分散Entres套带厂商anterior缀伪
   元素dentro, 拿No到当anterior值也continuarNoarribaPasar el ratón才显形刻度; 换成uno `role="slider"` 容Dispositivo之posterior, 
   几何, Estado y Clave盘TodoEnuno处. 形状取自 feralui.dev/gradients  `.dial-slider`, 实测记En
   `docs/reference-snapshots/feralui-studio-boardui-accent-measured.md`: 30px alto, 20px 轨道, 
   每 10% uno根刻度, 3×20px 圆头抓手, 刻度y抓手Predeterminado透明, Pasar el ratón或拖动时才出现. 
   Coloruno律由 `--ink` 经 color-mix 得到, 焦点环仍走站interior `--tungsten`. 
   当anteriorUbicación写成 `--dial-at` 交给 CSS: Introduce充ancho度 y 抓手Ubicaciónes同uno数, 分两处写就会错开.  */
const DIAL_TICKS=9;
export function dialSliderHtml({value=0,min=0,max=100,step=1,label='',suffix='%',attr='',className=''}={}):string{
  const at=max>min?(value-min)/(max-min)*100:0;
  const text=`${value}${suffix}`;
  return `<div class="ui-dial${className?` ${esc(className)}`:''}" ${attr}>
    <div class="ui-dial-slider" data-dial-slider role="slider" tabindex="0" aria-label="${esc(label)}"
      aria-valuemin="${min}" aria-valuemax="${max}" aria-valuenow="${value}" aria-valuetext="${esc(text)}"
      data-dial-step="${step}" style="--dial-at:${at}%">
      <span class="ui-dial-track" aria-hidden="true"><span class="ui-dial-fill"></span></span>
      <span class="ui-dial-ticks" aria-hidden="true">${'<span></span>'.repeat(DIAL_TICKS)}</span>
      <span class="ui-dial-handle" aria-hidden="true"></span>
    </div><b class="ui-dial-value mono" data-dial-value>${esc(text)}</b></div>`;
}

/**
 * continuararriba dialSliderHtml 画出来uno拉. 
 *
 * `onInput` En拖动 y Clave盘每uno步都发, 调用方自己合y到uno帧dentro; `onChange` SoloEn松手, 
 * Clave盘落Clave y 触摸Cancelar时发uno次, 落盘归它. 两者分开eseste拉唯uno性能约定: 拖动en proceso
 * 每uno步都写 localStorage 话, uno次 60 步拖动就es 60 次Sincronizar序列化. 
 */
export function wireDialSlider(root:ParentNode,{onInput=()=>{},onChange=()=>{},suffix='%'}:{
  onInput?: (value:number)=>void; onChange?: (value:number)=>void; suffix?: string;
}={}):{readonly value:number;set(next:number):void}{
  const slider:any=root.querySelector('[data-dial-slider]'),readout=root.querySelector('[data-dial-value]');
  const track:any=root.querySelector('.ui-dial-track');
  const min=+slider.getAttribute('aria-valuemin'),max=+slider.getAttribute('aria-valuemax');
  const step=+slider.dataset.dialStep||1;
  let value=+slider.getAttribute('aria-valuenow');
  const clamp=(raw:number)=>Math.min(max,Math.max(min,Math.round(raw/step)*step));
  const paint=()=>{
    const text=`${value}${suffix}`;
    slider.style.setProperty('--dial-at',`${max>min?(value-min)/(max-min)*100:0}%`);
    slider.setAttribute('aria-valuenow',String(value));
    slider.setAttribute('aria-valuetext',text);
    if(readout)readout.textContent=text;
  };
  const set=(raw:number,notify:boolean)=>{
    const next=clamp(raw);
    if(next===value)return false;
    value=next;paint();if(notify)onInput(value);return true;
  };
  /* 轨道几何En按abajoeseuno刻量uno次就够, 之posterior每次 pointermove 都读缓存. 指针捕obtener期间este
     轨道No会跑, 而 `getBoundingClientRect()` 会强制Sincronizaruno次样yDiseño—放En每uno
     pointermove dentro, uno次拖动就esarribacien次强制Diseño, 实测占掉este链路unograndemedioTiempo.  */
  let trackBox:DOMRect|null=null;
  const fromPointer=(event:PointerEvent)=>{
    const rect=trackBox||track.getBoundingClientRect();
    const ratio=rect.width?(event.clientX-rect.left)/rect.width:0;
    set(min+(max-min)*Math.min(1,Math.max(0,ratio)),true);
  };
  slider.addEventListener('pointerdown',(event:PointerEvent)=>{
    if(event.pointerType==='mouse'&&event.button!==0)return;
    event.preventDefault();slider.focus();
    trackBox=track.getBoundingClientRect();
    slider.dataset.dragging='true';
    /* 指针捕obtener拿No到就算: uno次合成出来 pointerdown(自动化, 辅助技术)带 id
       No对应任何活动指针, `setPointerCapture` 会抛, 抛出去Completo拖动就断EnNo.uno步.  */
    try{slider.setPointerCapture(event.pointerId)}catch{}
    fromPointer(event);
  });
  slider.addEventListener('pointermove',(event:PointerEvent)=>{if(slider.dataset.dragging==='true')fromPointer(event)});
  const release=(event:PointerEvent)=>{
    if(slider.dataset.dragging!=='true')return;
    delete slider.dataset.dragging;trackBox=null;
    try{if(slider.hasPointerCapture(event.pointerId))slider.releasePointerCapture(event.pointerId)}catch{}
    onChange(value);
  };
  slider.addEventListener('pointerup',release);
  slider.addEventListener('pointercancel',release);
  /* Clave盘uno档就esuno step, 按住 Shift 走 10. Home/End 直continuar到两端: uno 0–100 拉
     用方向Clave从uno头走到另uno头要按unocienabajo, eseNo叫puede用.  */
  slider.addEventListener('keydown',(event:KeyboardEvent)=>{
    const span=event.shiftKey?10:step;
    const moves:Record<string,number>={ArrowLeft:-span,ArrowDown:-span,ArrowRight:span,ArrowUp:span};
    let next:number|null=null;
    if(event.key in moves)next=value+moves[event.key]!;
    else if(event.key==='Home')next=min;
    else if(event.key==='End')next=max;
    if(next===null)return;
    event.preventDefault();
    if(set(next,true))onChange(value);
  });
  return {get value(){return value},set(next:number){set(next,false)}};
}

/** 复杂complementarInformación复用顶层浮层 y 视口避让, 正文puede聚焦yIndependiente滚动. 
 *  `panel` 进顶层, 锚En `trigger` 旁, Pasar el ratón 150ms 或点unoabajoAbrir, `mount` dentro按 Escape 收起.  */
export function wireContextCard(mount:HTMLElement,trigger:HTMLElement,panel:HTMLElement):{
  setOpen(open:boolean):void; isOpen():boolean; hide():void;
}{
  panel.classList.add('context-card');panel.setAttribute('popover','manual');
  panel.setAttribute('role','dialog');panel.tabIndex=-1;
  trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls',panel.id);
  const floating=wireAnchoredMenu(mount,trigger,panel);
  let timer:ReturnType<typeof setTimeout>|undefined;
  const hide=()=>{clearTimeout(timer);floating.setOpen(false)};
  const enter=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(trigger.isConnected)floating.setOpen(true)},150)};
  const leave=()=>{clearTimeout(timer);timer=setTimeout(()=>{if(!panel.matches(':hover')&&!trigger.matches(':hover')&&!panel.contains(document.activeElement)&&document.activeElement!==trigger)hide()},150)};
  trigger.addEventListener('pointerenter',enter);trigger.addEventListener('pointerleave',leave);
  panel.addEventListener('pointerenter',()=>clearTimeout(timer));panel.addEventListener('pointerleave',leave);
  trigger.addEventListener('focus',enter);trigger.addEventListener('blur',leave);
  trigger.addEventListener('click',()=>clearTimeout(timer));
  mount.addEventListener('keydown',event=>{if(event.key==='Escape')hide()});
  panel.addEventListener('focusout',leave);
  trigger.addEventListener('keydown',event=>{if(event.key==='ArrowDown'&&floating.isOpen()){event.preventDefault();(panel.querySelector<HTMLElement>('a,button,[tabindex="0"]')||panel).focus()}});
  return {...floating,hide};
}

/* 拖动Ordenar: uno列带 key 行, 拖到哪uno行arribamedio截或abajomedio截就插到esedentro. 

   站interior此anteriorCon两几乎uno样实现(侧栏顺序, 导航按钮), No.tres处再抄uno遍, 落点判据, 
   拖动en proceso减淡 y ese插入线就会各演化uno. aquíSolo收"uno列行"esteuno: 拖动en proceso行加
   `dragging`, 落点行加 `drop-before` / `drop-after`, 样由调用方eseuno侧类名给. 

   `onMove(key,target,after)` 拿到es两 key  y uno方, pesado排由调用方自己做—
   顺序存En哪, 存完刷什么, 各处本来就Nouno样.  */
export function wireDragReorder(root:ParentNode,{selector,attribute,onMove}:{
  selector?: any; attribute?: any; onMove?: any;
}={}):void{
  const rows=():HTMLElement[]=>[...root.querySelectorAll<HTMLElement>(selector)];
  const clear=()=>rows().forEach(row=>row.classList.remove('dragging','drop-before','drop-after'));
  let dragging:string|null=null;
  rows().forEach(row=>{
    const key=row.getAttribute(attribute);
    row.draggable=true;
    row.addEventListener('dragstart',event=>{
      dragging=key;row.classList.add('dragging');
      event.dataTransfer!.effectAllowed='move';
      // No写 dataTransfer 话 Firefox 根本No认esteesuno次拖动; primeropáginaeseuno项 key es空串, 
      // 空串etc.于没写, 所以给它uno占. 落点判据Solover key 本身, Noveraquí写字. 
      event.dataTransfer!.setData('text/plain',key||'peach-row');
    });
    row.addEventListener('dragover',event=>{
      if(dragging===null||dragging===key)return;
      event.preventDefault();event.dataTransfer!.dropEffect='move';
      const after=event.clientY>row.getBoundingClientRect().top+row.offsetHeight/2;
      rows().forEach(item=>item.classList.remove('drop-before','drop-after'));
      row.classList.add(after?'drop-after':'drop-before');
    });
    row.addEventListener('drop',event=>{
      event.preventDefault();
      const after=row.classList.contains('drop-after'),from=dragging;
      dragging=null;clear();
      if(from!==null&&from!==key)onMove(from,key,after);
    });
    row.addEventListener('dragend',()=>{dragging=null;clear()});
  });
}
