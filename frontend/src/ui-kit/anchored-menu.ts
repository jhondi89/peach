import { playUiSound } from './sounds';

interface OpenedMenu { mount: Element; menu: HTMLElement; toggle: HTMLElement; setOpen: (next: boolean) => void }

/* 锚定En触发钮en la菜单: Sin展开动画, 固定En视口interior, contenidoEn菜单interior滚动. 

   优先从触发钮derecha缘向izquierda展开, abajo方放Noabajo时改到arriba方. Todo站锚定菜单共用esteuno定y
   开关: 菜单En视口边缘表现最容易各写各, 同uno语义Deja两实现就Solo会Conuno被修.  */
let openedMenu:OpenedMenu|null=null;
const peachGlobal=globalThis as typeof globalThis & { __peachMenuCloser?: boolean };
if(!peachGlobal.__peachMenuCloser){
  peachGlobal.__peachMenuCloser=true;
  /* "点到别处就关"en la"别处"No能Solo按 mount 之exterior算. mount es定用eseuno片祖先—
     侧栏配色弹层给es `.board-sidebar-foot`, 媒体Biblioteca弹层给esCompleto `#drawer`—Configuración钮
      y 侧栏dentro其余每unoControles都Endentro面, 按 mount 算话点它们Todoes"interior点", 弹层就uno直挂着. 
     mount 缩到触发钮本身也No行: 定要按它算, 菜单开Enizquierda边还esderecha边ver就esesteuno片. 
     所以判据改成"点esNoeseste菜单自己东西": 菜单interior部y触发钮arriba算interior点, mount dentro
     别puede点Controles算exterior点, mount en la空白仍算interior点(点空白本来就什么也No该发生).  */
  const clickable='a[href],button,input,select,textarea,summary,[role=button],[role=menuitem],[tabindex]';
  document.addEventListener('click',event=>{
    if(!openedMenu)return;
    const target=event.target as Node|null;
    if(openedMenu.menu.contains(target)||openedMenu.toggle.contains(target))return;
    if(openedMenu.mount.contains(target)&&!(target instanceof Element&&target.closest(clickable)))return;
    openedMenu.setOpen(false)},true);
}
export function closeAnchoredMenu(): void {if(openedMenu)openedMenu.setOpen(false)}
/* 菜单面板开合动效来自 boardui  menu-styles.ts(登记En docs/BOARD_UI.md): 150ms
   ease-out, 透明度, scale .95  y  2px Difusouno起进出. 进场由 Board 层 CSS 按 `:not([hidden])`
   起; 退场要etc.动画放完再 hidden, display:none uno落abajo去动画就被掐掉. 哪些面板算菜单由
   CSS 决定: 读到 animation-name es none(antiguo界面, prefers-reduced-motion)就当场藏起来. 
   Todo站菜单都从este两口进出, `hidden` 才始终es"verNo见", No会Conuno自己写 150ms.  */
const leavingMenus=new WeakMap<HTMLElement,()=>void>();
export function presentMenu(menu: HTMLElement): void {
  leavingMenus.delete(menu);menu.classList.remove('leaving');
  if(menu.hidden)playUiSound('whoosh');
  menu.hidden=false;
}
export function dismissMenu(menu: HTMLElement, finish?: () => void): void {
  if(menu.hidden||leavingMenus.has(menu))return;
  const done=()=>{if(leavingMenus.get(menu)!==done)return;
    leavingMenus.delete(menu);menu.classList.remove('leaving');menu.hidden=true;if(finish)finish()};
  leavingMenus.set(menu,done);
  menu.classList.add('leaving');
  if(getComputedStyle(menu).animationName==='none'){done();return}
  menu.addEventListener('animationend',event=>{if(event.target===menu)done()},{once:true});
  // 面板En动画Terminaranterior被别Regla藏掉(比如切página)就收No到 animationend, 兜uno拍. 
  setTimeout(done,240);
}
/* puede用视口arriba沿es固定顶栏abajo缘. 顶栏En每unopágina都盖着最arriba面eseuno, 菜单顶到 8px
   会被它压掉medio截, 而且verNo出es被压住—SoloesNo.uno项凭空No见.  */
const viewportTop=()=>8+(parseFloat(getComputedStyle(document.documentElement)
  .getPropertyValue('--topH'))||0);
/**
 * esteunoabajo滚动会No会 `anchor` 带走: 滚esCompletopágina, 或者es装着它eseuno层滚动容Dispositivo. 
 * 挂En视口en la浮层(锚定菜单, ReproducirDispositivo菜单, Sugerencia框)Solo该Eneste时收起. 别处滚动挪No动
 * 锚点—primeropáginaNuevas obraseseuno排自己横着走, 每uno帧都发uno次 scroll, 捕obtener阶段照样收得到, 按"浮层
 * 之exterior"算话, 浮层刚开就被它收掉. 浮层自己滚动也No装着锚点, 自然No算. 
 */
export function scrollMovesAnchor(event: Event, anchor: Node): boolean {
  return event.target instanceof Node&&event.target.contains(anchor);
}
/* `align:'start'` 让菜单从触发钮izquierda缘往derecha开. Predeterminado往izquierda开, es因Como触发钮másmedioEnuno排
   derecha端; 触发钮紧跟Encontenidoposterior面时(资料página名字derecha边eseuno), 往izquierda开就盖住它跟着ese段
   contenido y 再往izquierdaAvatar.  */
export function wireAnchoredMenu(
  mount: HTMLElement, toggle: HTMLElement, menu: HTMLElement,
  { side = false, align = 'end' }: { side?: boolean; align?: 'start' | 'end' } = {},
): { setOpen(next: boolean): void; isOpen(): boolean; dispose(): void } {
  const position=()=>{
    // ancho度读 offsetWidth: 进场动画起手es scale(.95), getBoundingClientRect 量到es缩过框. 
    const anchor=toggle.getBoundingClientRect(),width=menu.offsetWidth;
    if(side&&innerWidth>=640){
      menu.dataset.placement='right';
      menu.style.maxHeight=Math.max(0,innerHeight-32)+'px';
      /* 贴着触发钮derecha缘开, 允许压住侧栏剩abajoeseuno段. 按侧栏derecha缘起算话, 展开态abajo
         触发钮到侧栏边还Con两cien来像素, 菜单 y 它点开eseControles之间隔着uno片空白, 读No出
         es谁弹出来.  */
      menu.style.left=Math.max(16,Math.min(anchor.right+8,innerWidth-width-16))+'px';
      menu.style.top=Math.max(16,Math.min(anchor.top,innerHeight-menu.offsetHeight-16))+'px';return;
    }
    const top=viewportTop(),under=innerHeight-8-anchor.bottom-8,over=anchor.top-8-top;
    /* abajo方放Noabajo就改到arriba方; 两侧都放Noabajo时取anchoeseuno侧, y菜单压到eseuno侧alto度, 
       contenidoEn菜单interior滚. No压alto度话它会横跨触发钮盖住自己, 点开之posterior连改es哪uno
       名字都verNo见.  */
    const naturalHeight=menu.scrollHeight+menu.offsetHeight-menu.clientHeight;
    const downward=under>=naturalHeight||under>=over;
    const height=Math.min(naturalHeight,Math.max(downward?under:over,0));
    menu.dataset.placement=downward?'bottom':'top';
    menu.style.maxHeight=height+'px';
    const preferredLeft=align==='start'||menu.classList.contains('context-card')?anchor.left:anchor.right-width;
    menu.style.left=Math.max(8,Math.min(preferredLeft,innerWidth-width-8))+'px';
    menu.style.top=(downward?anchor.bottom+8:anchor.top-8-height)+'px'};
  /* 触发钮被滚走就关掉: 菜单固定En视口dentro, 锚点跟着contenido跑, Deja着就悬Enmedio空. 
     菜单自己滚动No算—它装Noabajo时本来就要Eninterior部滚, 滚unoabajo就关etc.于底abajoese几项
     根本够No着; 别处eseuno排横滚也No算, 判据见 `scrollMovesAnchor`.  */
  const closeFromViewport=(event:Event)=>{if(scrollMovesAnchor(event,toggle))setOpen(false)};
  /* 带 popover 菜单进顶层. `position:fixed` SoloEnSin被祖先continuar管时才相对视口: 祖先arriba
     uno transform, filter 或 backdrop-filter 就会成Como它Contiene, 算bien视口坐标于es
     Completo体偏移, 还要被ese祖先 overflow 裁掉. Configuración面板卡片正eseste祖先—入场动画
     fill-mode 让 transform uno直挂Enarriba面—菜单于es开EnverNo见地方, 读起来就es"点No开".  */
  const inTopLayer=menu.hasAttribute('popover');
  /* 开着没开着记Enaquí, Nover `hidden`: 退场ese 150ms dentro面板还En, hidden 还es false, 
     按 hidden 判会"En curso收"当成"开着", 再点unoabajo触发钮就关ya经En关.  */
  let open=false,disposed=false;
  const setOpen=(next:boolean)=>{
    if(disposed)return;
    if(next){
      if(openedMenu&&openedMenu.mount!==mount)openedMenu.setOpen(false);
      open=true;presentMenu(menu);if(inTopLayer&&!menu.matches(':popover-open'))menu.showPopover();position();
      window.addEventListener('resize',position);
      window.addEventListener('scroll',closeFromViewport,{capture:true,passive:true});
    }else{
      open=false;
      window.removeEventListener('resize',position);
      window.removeEventListener('scroll',closeFromViewport,true);
      dismissMenu(menu,()=>{menu.style.left='';menu.style.top='';menu.style.maxHeight='';
        if(inTopLayer&&menu.matches(':popover-open'))menu.hidePopover()});
    }
    toggle.setAttribute('aria-expanded',String(next));
    openedMenu=next?{mount,menu,toggle,setOpen}:(openedMenu&&openedMenu.mount===mount?null:openedMenu)};
  const click=(event:MouseEvent)=>{event.stopPropagation();setOpen(!open)};
  const keydown=(event:KeyboardEvent)=>{
    if(event.key==='Escape'&&open){event.stopPropagation();setOpen(false);toggle.focus()}};
  toggle.addEventListener('click',click);
  mount.addEventListener('keydown',keydown);
  const dispose=()=>{
    if(disposed)return;
    disposed=true;open=false;
    toggle.removeEventListener('click',click);
    mount.removeEventListener('keydown',keydown);
    window.removeEventListener('resize',position);
    window.removeEventListener('scroll',closeFromViewport,true);
    if(openedMenu?.menu===menu)openedMenu=null;
    leavingMenus.delete(menu);menu.classList.remove('leaving');menu.hidden=true;
    if(inTopLayer&&menu.matches(':popover-open'))menu.hidePopover();
    menu.style.left='';menu.style.top='';menu.style.maxHeight='';
    toggle.setAttribute('aria-expanded','false');
  };
  return {setOpen,isOpen:()=>open,dispose};
}
