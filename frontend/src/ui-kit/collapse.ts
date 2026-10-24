/**
 * Geist Collapse: Original生 `<details>` No过渡alto度, 所以 summary 以exteriorcontenido包进
 * `.ui-fcollapse`, 开合时量 `scrollHeight` 写 inline `height` 让它过渡. 
 * (试过 `::details-content`, ese路会吞掉contenido, ya弃. )
 *
 * 同uno `details` Solocontinuaruno次, pesado绘posteriorOriginal样再调用es安Todo. 
 */
export function wireCollapse(
  root: ParentNode | null | undefined, selector: string, idPrefix: string, triggerSelector = 'summary',
): void {
  root?.querySelectorAll<HTMLDetailsElement>(selector).forEach((details,index)=>{
    if(details.querySelector(':scope > .ui-fcollapse'))return;
    const body=document.createElement('div');body.className='ui-fcollapse';
    /* Relleno放Eninterior层 .fcollapsebody: .ui-fcollapse 自身No带 padding, height 才能真正
       过渡到 0, 否则 border-box 会卡EnRellenoarriba, 收起último尾跳unoabajo.  */
    const inner=document.createElement('div');inner.className='fcollapsebody';
    [...details.children].forEach(child=>{
      if(child.tagName==='SUMMARY')return;
      inner.appendChild(child);
    });
    body.appendChild(inner);details.appendChild(body);
    const summary=details.querySelector(triggerSelector)!;
    if(triggerSelector!=='summary')details.querySelector('summary')!.addEventListener('click',event=>event.preventDefault());
    let expanded=details.open;
    body.id=`${idPrefix}-${index}`;
    body.inert=!expanded;
    /* alto度过渡要 `overflow:hidden`, puede展开着No动时它还En裁—dentro面最posterioreseuno行卡片落影
       正bien落Enabajo沿exterior, 被切掉medio, 读出来esesteuno列没排完. 过渡跑完(或unoEmpezar就es展开)
       就摘掉ese道裁边; 收起eseunoabajo先装回去, 否则contenido会Enalto度收到 0 过程en procesouno直露Enexterior面.  */
    if(expanded)body.classList.add('ui-fcollapse-settled');
    summary.setAttribute('aria-controls',body.id);
    summary.setAttribute('aria-expanded',String(expanded));
    summary.addEventListener('click',event=>{
      event.preventDefault();
      expanded=!expanded;
      summary.setAttribute('aria-expanded',String(expanded));
      setCollapseOpen(details,body,expanded);
    });
  });
}

/**
 * uno Collapse 开到或收到 `expanded`, `body` es summary posterior面ese层容Dispositivo, `.ui-fcollapse` 由aquí挂arriba. 
 * `wireCollapse`, React Configuraciónpágina `Disclosure` y侧栏Agrupar共用esteuno; 过渡途en proceso又被反向点按时, anterioruno次收尾No再做. 
 */
const collapseRuns=new WeakMap<HTMLElement,number>();
export function setCollapseOpen(details: HTMLDetailsElement, body: HTMLElement, expanded: boolean): void {
  body.classList.add('ui-fcollapse');
  const run=(collapseRuns.get(body)||0)+1;collapseRuns.set(body,run);
  const isCurrent=()=>collapseRuns.get(body)===run;
  if(expanded){
    body.inert=false;
    const start=details.open?body.getBoundingClientRect().height:0;
    details.open=true;
    growCollapse(body,start,isCurrent);
  }else{
    body.inert=true;body.classList.remove('ui-fcollapse-settled');
    body.style.height=body.getBoundingClientRect().height+'px';body.getBoundingClientRect();
    body.style.height='0px';
    settleHeight(body,()=>{if(isCurrent()){details.open=false;body.style.height=''}});
  }
}

/* alto度过渡跑完再收尾; 减menos动效时Sin transitionend, 260ms 兜底.  */
function settleHeight(body: HTMLElement, fn: () => void): void {
  let done=false,timer:ReturnType<typeof setTimeout>|undefined;
  const finish=(e?:TransitionEvent)=>{
    if(e&&e.propertyName!=='height')return;
    if(done)return;done=true;
    body.removeEventListener('transitionend',finish);clearTimeout(timer);
    fn();
  };
  body.addEventListener('transitionend',finish);
  timer=setTimeout(finish,260);
}

/**
 * `.ui-fcollapse` 从 `start` largo到contenido此刻alto度, 跑完交回 `auto` y摘掉裁边. Collapse 展开y
 * 侧栏名单摊开共用esteuno. `isCurrent` 返回 false Descripciónen proceso途又被收起, 收尾就No做. 
 */
export function growCollapse(body: HTMLElement, start: number, isCurrent: () => boolean = ()=>true): void {
  body.classList.remove('ui-fcollapse-settled');
  body.style.height=start+'px';body.getBoundingClientRect();
  body.style.height=body.scrollHeight+'px';
  settleHeight(body,()=>{if(isCurrent()){body.style.height='auto';body.classList.add('ui-fcollapse-settled')}});
}
