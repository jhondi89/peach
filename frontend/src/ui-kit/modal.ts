/* Geist Modal 两正文: uno句待Confirmar话(`confirmModal`)y要Introduceuno表单(`formModal`). 
   由共享源码直continuar引用, 随 `peach-app.js` 发出; 壳y React 子树Abrires同uno, 
   Título id 序号因此Todopágina连续.  */
import { setActionBusy } from './controls';
import { noteHtml } from './markup';
import { playUiSound } from './sounds';
import { attachOverlayScrollbar } from './overlay-scrollbar';

/* Geist Modal 另uno正文: 要Introduceuno表单, 而Noesuno句待Confirmar话. 

   壳, 遮罩, 焦点陷阱, Escape  y 关掉posterior焦点还给触发钮Todo来自 confirmModal 用ese身
   `.geist-modal`, 两者差别SoloCon正文 y 主按钮做什么. 所以弹层几何SoloConuno处: Título
   20px/26px  h3, 正文 20px Relleno, 操作粘En底两端对齐, 主按钮Enderechaabajo角. 

   返回值en la `dialog` 交给调用方continuar自己行事件, `done` En弹层关掉时兑现.  */
let formModalSeq=0;
export function formModal({title,description='',body='',confirmLabel,cancelLabel='Cancelar',
                           onConfirm=null,confirmDisabled=false}:{
  title?: string; description?: string; body?: string; confirmLabel?: string; cancelLabel?: string;
  onConfirm?: (()=>unknown)|null; confirmDisabled?: boolean;
}={}):{dialog:HTMLDialogElement;confirmButton:any;done:Promise<{confirmed:boolean;result?:unknown}>;close:()=>void}{
  const trigger=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.className='ui-geist-modal';
  const titleId=`geist-form-title-${++formModalSeq}`;
  dialog.setAttribute('aria-labelledby',titleId);
  dialog.innerHTML=`<form class="ui-geist-modal-form" novalidate>
      <div class="ui-geist-modal-body"><h3 id="${titleId}"></h3>${description?'<p></p>':''}
        <div class="ui-geist-modal-fields">${body}</div><div data-modal-error></div></div>
      <footer class="geist-modal-footer">
        <div><button type="button" class="geist-button" data-modal-cancel></button></div>
        <div><button type="submit" class="geist-button primary" data-modal-confirm></button></div>
      </footer></form>`;
  dialog.querySelector('h3')!.textContent=title as string;
  if(description)dialog.querySelector('.ui-geist-modal-body p')!.textContent=description;
  const cancel:any=dialog.querySelector('[data-modal-cancel]');
  const accept:any=dialog.querySelector('[data-modal-confirm]');
  const failure:any=dialog.querySelector('[data-modal-error]');
  cancel.textContent=cancelLabel;
  accept.textContent=confirmLabel;
  accept.disabled=!!confirmDisabled;
  document.body.append(dialog);
  let settled:{confirmed:boolean;result?:unknown}|null=null,busy=false;
  const done=new Promise<{confirmed:boolean;result?:unknown}>(resolve=>dialog.addEventListener('close',()=>{
    dialog.remove();
    if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus();
    resolve(settled||{confirmed:false});
  },{once:true}));
  cancel.onclick=()=>{if(!busy)dialog.close()};
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
  // 遮罩en la点击落En <dialog> 自己身arriba; aquíSinNopuede逆动作, 允许点exterior面关掉. 
  dialog.addEventListener('click',event=>{if(event.target===dialog&&!busy)dialog.close()});
  dialog.querySelector('form')!.onsubmit=async event=>{
    event.preventDefault();
    if(busy||accept.disabled)return;
    if(!onConfirm){settled={confirmed:true};dialog.close();return}
    failure.innerHTML='';busy=true;setActionBusy(accept);
    try{
      settled={confirmed:true,result:await onConfirm()};
      dialog.close();
    }catch(error:any){
      failure.innerHTML=noteHtml(error.message||'Operación no completada',{variant:'error'});
      setActionBusy(accept,false);
    }finally{busy=false}
  };
  dialog.showModal();
  playUiSound('pop');
  (dialog.querySelector<HTMLElement>('.ui-geist-modal-fields input:not([type="checkbox"])')||accept).focus();
  return {dialog,confirmButton:accept,done,close:()=>dialog.close()};
}

/* Geist Modal: uno次写操作落BibliotecaanteriorConfirmar. 

   实测 https://vercel.com/geist/modal(2026-09-04): 卡片 540px ancho, 12px 圆角, estrecho屏两侧
   各Deja 10px, 正文 20px Relleno, 14px/20px, Títuloes 20px/26px  600 字pesado h3, 底部操作
   12px Relleno, 粘En底, 两端对齐, 按钮 32px alto, 6px 圆角, 14px/500, 遮罩纯黑No带Difuso. 
   Título写成陈述句而Noes问句; 主按钮esyTítulo同uno动词"动词+名词", CancelarClave就写"Cancelar"; 
   Éxitoposterior Toast y主按钮共用ese动词. 

   用Original生 <dialog> 承载: 焦点陷阱, Escape, Fondo inert  y 关掉posterior焦点还给触发钮都由它给, 
   自己搭uno遍Solo会menos掉其en procesouno两样. onConfirm Fallo时弹层No关, Original因DejaEnOriginaletc.Reintentar.  */
let modalSeq=0;
export function confirmModal(options:{
  title: string; body: string; confirmLabel: string; cancelLabel?: string; danger?: boolean;
  items?: readonly string[];
  onConfirm?: () => Promise<unknown>;
}):Promise<{confirmed:boolean;result?:unknown}>;
export function confirmModal({title,body,items=[],confirmLabel,cancelLabel='Cancelar',onConfirm=null,danger=false}:{
  title?: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean;
  items?: readonly string[];
  onConfirm?: (()=>unknown)|null;
}={}):Promise<{confirmed:boolean;result?:unknown}>{
  const trigger=document.activeElement;
  const dialog=document.createElement('dialog');
  dialog.className='ui-geist-modal';
  const titleId=`geist-modal-title-${++modalSeq}`;
  dialog.setAttribute('aria-labelledby',titleId);
  dialog.innerHTML=`<div class="ui-geist-modal-body">
      <h3 id="${titleId}"></h3><p></p><div data-modal-error></div></div>
    <footer class="geist-modal-footer">
      <div><button type="button" class="geist-button" data-modal-cancel></button></div>
      <div><button type="button" class="geist-button primary" data-modal-confirm></button></div>
    </footer>`;
  dialog.querySelector('h3')!.textContent=title as string;
  dialog.querySelector('.ui-geist-modal-body p')!.textContent=body as string;
  let list: HTMLUListElement | null = null;
  if(items.length){
    const host=document.createElement('div');
    host.className='ui-geist-modal-list';
    list=document.createElement('ul');
    list.setAttribute('aria-label','所选Registro');
    list.tabIndex=0;
    for(const text of items){
      const item=document.createElement('li');
      item.textContent=text;
      list.append(item);
    }
    host.append(list);
    dialog.querySelector('[data-modal-error]')!.before(host);
  }
  const cancel:any=dialog.querySelector('[data-modal-cancel]');
  const accept:any=dialog.querySelector('[data-modal-confirm]');
  if(danger){accept.classList.remove('primary');accept.classList.add('danger')}
  const failure:any=dialog.querySelector('[data-modal-error]');
  cancel.textContent=cancelLabel;
  accept.textContent=confirmLabel;
  document.body.append(dialog);
  return new Promise(resolve=>{
    let settled:{confirmed:boolean;result?:unknown}|null=null;
    let busy=false;
    dialog.addEventListener('close',()=>{
      dialog.remove();
      if(trigger instanceof HTMLElement&&trigger.isConnected)trigger.focus();
      resolve(settled||{confirmed:false});
    },{once:true});
    cancel.onclick=()=>{if(!busy)dialog.close()};
    dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault()});
    /* 遮罩en la点击落En <dialog> 自己身arriba, 卡片en la落En子元素arriba. este动作puedeDeshacer, 
       按 Geist 判据允许点exterior面关掉.  */
    dialog.addEventListener('click',event=>{if(event.target===dialog&&!busy&&!danger)dialog.close()});
    accept.onclick=async()=>{
      if(busy)return;
      if(!onConfirm){settled={confirmed:true};dialog.close();return}
      failure.innerHTML='';
      busy=true;
      setActionBusy(accept);
      try{
        settled={confirmed:true,result:await onConfirm()};
        dialog.close();
      }catch(error:any){
        failure.innerHTML=noteHtml(error.message||'Operación no completada',{variant:'error'});
        setActionBusy(accept,false);
      }finally{busy=false}
    };
    dialog.showModal();
    attachOverlayScrollbar(list);
    playUiSound('pop');
    (danger?cancel:accept).focus();
  });
}
