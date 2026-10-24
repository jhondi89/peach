/* Original地换态uno组辅助: 字形互换, 文字换行, 读数错峰, 清空Introducir框, 计数徽标yTítulo逐行揭示. 
   由共享源码直continuar引用, 随 `peach-app.js` 发出; 计数徽标Anterior次值es模级Estado, SoloConuno. 

   形状 y  CSS En同Directorio `motion.css`(文字换行eseunoEn `web/css/25-motion.css`), esedentro也写着每uno
   来源y取值. esteuno层Solo负责
   "什么时候换": 动画本身uno律交给 CSS, JS No读也No写具体毫秒数.  */
import { esc, icon } from '../core';

/**
 * 两字形叠Enuno格dentro, 换态Solo改容Dispositivoen la `data-icon-state`. 
 *
 * 直continuar `innerHTML=icon(...)` 地方都puede以换成它: pesado写 innerHTML 会antiguo字形连同它En curso
 * 走动画uno起丢掉, Nuevo字形也Sin起点puede走, 读出来esuno次Grave切. 
 */
export function iconSwapHtml(a:string,b:string,state:'a'|'b'|(string&{})='a',{className='',iconClass='',label=''}={}):string{
  return `<span class="iconswap${className?' '+esc(className):''}" data-icon-swap data-icon-state="${state==='b'?'b':'a'}"${
    label?` aria-label="${esc(label)}"`:''}><span data-icon="a">${icon(a,iconClass)}</span><span data-icon="b">${icon(b,iconClass)}</span></span>`;
}
/**  `iconSwapHtml` 画出来eseuno切到 a 或 b; `root` puede以es它本身或它祖先.  */
export function setIconSwap(root:any,state:'a'|'b'|boolean|(string&{})):any{
  const el=root&&(root.matches?.('[data-icon-swap]')?root:root.querySelector?.('[data-icon-swap]'));
  if(el)el.dataset.iconState=state==='b'||state===true?'b':'a';
  return el;
}

/**
 * uno行字换成另uno行字: antiguo字往arriba糊掉, Nuevo字从abajo方回到Original. 
 *
 * 值没变就什么也No做—同uno次pesado绘dentro同样字再写uno遍es常态, 跟着抖unoabajo会让página面ver起来
 * uno直En变. primero次写入(esteuno格还空着)也No放动画: eseescontenidoNo.uno次出现, 归骨架eseuno段. 
 */
export function swapText(el:any,text:unknown,{html=false}={}):void{
  if(!el)return;
  const next=String(text??''),write=()=>{if(html)el.innerHTML=next;else el.textContent=next};
  const previous=el.dataset.swapText;
  if(previous===next&&(el.textContent||'').length)return;
  el.dataset.swapText=next;
  el.classList.add('textswap');
  if(previous===undefined||previous===next){write();return}
  el.classList.remove('entering');
  el.classList.add('leaving');
  const enter=()=>{
    el.classList.remove('leaving');
    write();
    el.classList.add('entering');
    el.getBoundingClientRect();
    el.classList.remove('entering');
  };
  const done=(event:Event)=>{if(event.target!==el)return;el.removeEventListener('transitionend',done);enter()};
  el.addEventListener('transitionend',done);
  /* 兜底: `--motion-swap` 归cero或元素此刻Nopuede见时 `transitionend` No会来, 
     No兜话esteuno行就永远停En透明.  */
  setTimeout(()=>{if(el.classList.contains('leaving')){el.removeEventListener('transitionend',done);enter()}},400);
}

/**
 * 读数按错峰largo出来.  `text` 拆成uno字符, 数字各占uno档延迟, 分隔符跟着anterioruno档. 
 *
 *  y  `swapText` uno样SoloEn值真变时触发, primero次写入No放动画. 
 */
export function popCount(el:any,text:unknown):void{
  if(!el)return;
  const next=String(text??''),previous=el.dataset.popCount;
  if(previous===next&&el.firstElementChild)return;
  el.dataset.popCount=next;
  let at=-1;
  el.innerHTML=`<span class="digits">${[...next].map(ch=>{
    if(/\d/.test(ch))at+=1;
    return `<span style="--digit-at:${Math.max(at,0)}">${esc(ch)}</span>`;
  }).join('')}</span>`;
  /* Anterior值没登记过(esteuno格No.uno次出现)或压根没变, 就Solo字写arriba去. 调用点Completopesado绘时
     Anterior次读数写回 `dataset.popCount` 再调, esteuno格才知道自己es换值还es刚建出来.  */
  if(previous===undefined||previous===next)return;
  const group=el.firstElementChild;
  group.getBoundingClientRect();
  group.classList.add('popping');
}

/**
 * 清空Introducir框, 框dentroese段字往arriba飘着糊掉. 
 *
 * Introducir框 value esuno瞬间没, 动画Solo能挂En别处: aquí照着它此刻Ubicación y Fuente de letra摆uno同样
 * 字, 让eseuno去飘, 真正Introducir框当场就空, 光标 y Introducir法uno刻也Noetc.. `host` 缺省取
 * Introducir框父元素, 它必须es定祖先, 否则esteuno层会飘到página面izquierdaarriba角去. 
 */
export function dissolveValue(input:any,host:any=input&&input.parentElement,
  {text=input&&input.value,scrollLeft=input&&input.scrollLeft||0}:{text?:string;scrollLeft?:number}={}):()=>void{
  if(!input||!host)return ()=>{};
  host.querySelectorAll(':scope > .cleardissolve').forEach((node:Element)=>node.remove());
  input.classList.remove('dissolving');
  input.value='';
  if(!text||!input.isConnected)return ()=>{};
  const box=input.getBoundingClientRect(),frame=host.getBoundingClientRect();
  if(!box.width)return ()=>{};
  const ghost=document.createElement('span');
  ghost.className='cleardissolve';
  ghost.setAttribute('aria-hidden','true');
  const value=document.createElement('span');
  value.dataset.dissolveValue='';
  value.textContent=text;
  value.style.transform=`translateX(-${Math.max(0,scrollLeft)}px)`;
  ghost.append(value);
  const style=getComputedStyle(input);
  Object.assign(ghost.style,{left:`${box.left-frame.left-host.clientLeft}px`,
    top:`${box.top-frame.top-host.clientTop}px`,width:`${box.width}px`,height:`${box.height}px`,
    boxSizing:'border-box',padding:style.padding,font:style.font,lineHeight:style.lineHeight,
    letterSpacing:style.letterSpacing,textAlign:style.textAlign,direction:style.direction});
  input.classList.add('dissolving');
  host.append(ghost);
  let active=true,timer:ReturnType<typeof setTimeout>|null=null;
  const drop=()=>{
    if(!active)return;
    active=false;
    if(timer!==null)clearTimeout(timer);
    ghost.removeEventListener('animationend',drop);
    ghost.remove();
    if(!host.querySelector(':scope > .cleardissolve'))input.classList.remove('dissolving');
  };
  ghost.addEventListener('animationend',drop);
  /* 兜底: `--motion-reveal` 归cero或esteuno刻元素Nopuede见时 `animationend` No会来, 
     No兜话esteCopiar品就永远盖EnIntroducir框arriba.  */
  timer=setTimeout(drop,1000);
  return drop;
}

/* 计数徽标Anterior次esmásmenos. 徽标所Eneseuno排每次Filtrar都Completopesado画, 节点本身DejaNo住Anterior值, 
   所以记Enaquí, Clave由调用方给Rango加徽标自己Clave拼成.  */
const badgeCounts=new Map<string,string>();
/**
 * uno排计数徽标dentro值真变ese几弹unoabajo, 其余No动. 
 *
 * primero次见到某unoNo弹: esees它No.uno次出现EnesteRangodentro, Completo排uno起弹esuno屏烟花, 而它要说
 * es"esteuno刚变". `scope` 区分同unoClaveEnNo同排en la计数(顶部Filtrar y 抽屉各Conuno). 
 */
export function popBadges(root:any,scope=''):void{
  if(!root)return;
  root.querySelectorAll('[data-count-badge]').forEach((el:HTMLElement)=>{
    const key=`${scope}\u0000${el.dataset.countBadge}`,next=el.textContent||'';
    const previous=badgeCounts.get(key);
    badgeCounts.set(key,next);
    el.classList.add('countbadge');
    if(previous===undefined||previous===next)return;
    el.classList.add('popped');
    el.getBoundingClientRect();
    el.classList.remove('popped');
  });
}

/**
 * uno段Título从Difusodentro逐行揭示出来. 
 *
 * 按行No按词: 逐词要Completo句拆成uno串 `<span>`, Copiar出来文字会跟着散架, 而este几处Título
 * 正es最常被Copiar走ese几段字. 走完类名 y 行序uno起摘掉, 终点帧NoDejaabajo `filter`. 
 */
export function revealTexts(root:any,selector='[data-reveal-line]'):void{
  if(!root)return;
  const lines:HTMLElement[]=[...root.querySelectorAll(selector)];
  if(!lines.length)return;
  /* 起止两Estado都挂En行自己身arriba, No挂Enexterior面eseuno层: este几处TítulodentroConuno对es `<body>` 
     直continuar子元素(página面Título y 它Descripción行), 要共同祖先就Solo剩 body 本身.  */
  lines.forEach((el,i)=>{el.classList.remove('revealing');el.classList.add('revealline');
    el.style.setProperty('--reveal-at',String(i))});
  lines[0]!.getBoundingClientRect();
  lines.forEach(el=>el.classList.add('revealing'));
  const drop=()=>lines.forEach(el=>{el.classList.remove('revealline','revealing');
    el.style.removeProperty('--reveal-at')});
  const last=lines[lines.length-1]!;
  const done=(event:Event)=>{if(event.target!==last)return;last.removeEventListener('transitionend',done);drop()};
  last.addEventListener('transitionend',done);
  setTimeout(()=>{if(last.classList.contains('revealline')){last.removeEventListener('transitionend',done);drop()}},1200);
}
