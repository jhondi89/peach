import { esc, icon } from '../core';

import { wireAnchoredMenu } from './anchored-menu';

/** uno项: 值, 显示文字, puede选站标(雪碧Imagen字形名或interior嵌 PNG  data URL).  */
export type SelectOption = readonly [value: string, text: string, mark?: string | undefined];
/** `wireSelectField` continuarbien根元素: `value`, `disabled` 按Original生 select 写法读写.  */
export type SelectField = HTMLElement & { value: string; disabled: boolean };

/* Geist Select: 站interior每unoabajo拉都es它, Sinuno走Explorar dispositivo自带 select Controles. 

   Original生abajo拉弹出层由操作系统画, No认站interior色板: superficial色Temaabajo它要么跟着系统换成另uno套灰白, 
   要么Solo能用 `color-scheme` Completo按回profundo色—Configuración面板dentroesesiete此anterior就es被按成profundo色, 
   白底página面arribasiete黑. 2026-09-04 实测 vercel.com posterior: Completo站SinunoOriginal生abajo拉, 触发Dispositivoes
   button, 面板es自绘 listbox, 面板底色就espágina面底色(superficial色abajo纯白 --ds-background-100), 
   行alto 36px, 圆角 6px, 行Relleno 0 8px, Pasar el ratóny选en proceso都es 5% en proceso性Introduce充, 选en proceso项Sin勾. Peach
   行alto走站interioryaCon --control-h(38px), 面板y定复用 .popmenu  y  wireAnchoredMenu. 

   选en proceso态SoloConIntroduce充, 行interior也就Sinuno勾要占: 行primero腾出来eseuno格正bien让每uno项站标 y 
   触发Dispositivodentroeseuno落En同uno列arriba. 面板izquierdaRelleno(.popmenu  6px 加行 6px)按触发Dispositivo
   12px 凑, 两处Imagen标于es对齐到uno像素. 

   `value`, `disabled`  y  `change` tres样按Original生 select 写法DejaEn根元素arriba: 调用方读写它跟
   读写Original生abajo拉uno样, 换掉Soloes画法.  */
export function selectOptionIconHtml(mark?: string): string {
  return !mark?'':mark.startsWith('data:image/png;base64,')
    ?`<img class="gselectmark" src="${esc(mark)}" alt="" width="16" height="16">`:icon(mark,'gselectmark');
}
export function selectFieldHtml(
  options: readonly SelectOption[], current: string,
  { label = '', attr = '', className = '' }: { label?: string; attr?: string; className?: string } = {},
): string {
  const chosen:SelectOption=options.find(([value])=>String(value)===String(current))||options[0]||['',''];
  const content=([,text,mark]:SelectOption)=>`${selectOptionIconHtml(mark)}${esc(text)}`;
  const rows=options.map(([value,text,mark])=>
    `<button type="button" role="option" data-select-option="${esc(value)}"
      aria-selected="${String(value)===String(chosen[0])}" tabindex="-1"><span data-select-content>${content([value,text,mark])}</span></button>`).join('');
  return `<div class="ui-gselect${className?` ${esc(className)}`:''}" ${attr}>
    <button type="button" class="gselectfield" data-select-trigger aria-haspopup="listbox"
      aria-expanded="false" aria-label="${esc(label)}"><span data-select-label>${content(chosen)}</span>${icon('chevron-down')}</button>
    <div class="popmenu gselectmenu" role="listbox" aria-label="${esc(label)}" popover="manual" data-select-menu hidden>${rows}</div></div>`;
}

/** continuararriba selectFieldHtml 画出来unoabajo拉; 返回就es根元素, 带 value / disabled.  */
export function wireSelectField(root: HTMLElement): SelectField {
  const trigger=root.querySelector<HTMLButtonElement>('[data-select-trigger]')!;
  const menu=root.querySelector<HTMLElement>('[data-select-menu]')!,label=root.querySelector('[data-select-label]')!;
  const options=()=>[...menu.querySelectorAll<HTMLElement>('[data-select-option]')];
  const current=()=>menu.querySelector<HTMLElement>('[aria-selected="true"]');
  /* 面板至menos y 触发Dispositivouno样ancho. 菜单es fixed , ancho度No会自己跟着触发Dispositivo走, 而uno比触发Dispositivo
     还estrecho面板ver着No像同unoControles. este要continuarEn wireAnchoredMenu 之anterior: 它按当anteriorancho度定.  */
  trigger.addEventListener('click',()=>{
    const width=`${trigger.getBoundingClientRect().width}px`;
    menu.style.minWidth=width;
    if(root.hasAttribute('data-fixed-width'))menu.style.width=width;
  });
  const anchored=wireAnchoredMenu(root,trigger,menu);
  trigger.addEventListener('click',()=>{if(anchored.isOpen())current()?.focus()});
  const choose=(value:string|undefined)=>{
    const picked=options().find(option=>option.dataset.selectOption===String(value));
    if(!picked)return;
    options().forEach(option=>{
      option.setAttribute('aria-selected',String(option===picked));option.tabIndex=option===picked?0:-1});
    label.innerHTML=picked.querySelector('[data-select-content]')!.innerHTML;
  };
  options().forEach(option=>{
    option.onclick=()=>{
      const changed=option.getAttribute('aria-selected')!=='true';
      choose(option.dataset.selectOption);anchored.setOpen(false);trigger.focus();
      if(changed)root.dispatchEvent(new Event('change',{bubbles:true}));
    };
    option.onkeydown=event=>{
      if(event.key!=='ArrowDown'&&event.key!=='ArrowUp')return;
      event.preventDefault();
      const all=options(),at=all.indexOf(option);
      all[(at+(event.key==='ArrowDown'?1:-1)+all.length)%all.length]!.focus();
    };
  });
  if(current())current()!.tabIndex=0;
  Object.defineProperty(root,'value',{configurable:true,
    get:()=>current()?.dataset.selectOption??'',set:(value:string)=>choose(value)});
  Object.defineProperty(root,'disabled',{configurable:true,
    get:()=>trigger.disabled,set:(value:unknown)=>{trigger.disabled=!!value;if(value)anchored.setOpen(false)}});
  return root as SelectField;
}
