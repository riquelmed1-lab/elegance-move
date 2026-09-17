/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V2 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V3 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V4 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V5 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V6 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V7 — corrige apenas valores do resumo compacto */
(() => {
  const root=document.documentElement;
  let scheduled=false;

  const text=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(value)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
  const visible=(el)=>!!(el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&el.getClientRects().length);

  function content(){return document.getElementById('content')||document.querySelector('.content');}
  function loginVisible(){const login=document.getElementById('login');if(!login)return false;const s=getComputedStyle(login);return s.display!=='none'&&s.visibility!=='hidden'&&login.getClientRects().length>0;}
  function isSalesView(){
    if(loginVisible()) return false;
    const c=content();if(!c) return false;
    const h1=c.querySelector('.page-head h1,h1');
    const title=norm(text(h1));
    const active=document.querySelector('.nav button.active[data-page]')?.dataset.page||document.body.dataset.activePage||'';
    return active==='vendas'||title==='vendas';
  }

  function findPrimary(head){
    const candidates=[...head.querySelectorAll('button,.btn')];
    return head.querySelector('[data-action="new-sale"]')||candidates.find(el=>norm(text(el)).includes('nova venda'))||null;
  }

  function hideContext(c){
    const nodes=[...c.querySelectorAll('b,strong,h2,h3,p,div')].filter(el=>norm(text(el))==='venda com contexto'||norm(text(el)).startsWith('venda com contexto '));
    for(const node of nodes){
      const block=node.closest('.story-banner,.status-box,.card')||node.parentElement?.parentElement||node.parentElement||node;
      if(block){block.classList.add('em-sales-context');block.style.setProperty('display','none','important');}
    }
  }

  function metricCards(c){
    const labels=['faturamento liquido','descontos','recebido','em aberto','a receber','saldo pendente'];
    const candidates=[...c.querySelectorAll('.metric,.card')].filter(el=>{
      const t=norm(text(el));return labels.some(label=>t.startsWith(label)||t.includes(label));
    });
    return candidates.filter((el,index,arr)=>!arr.some(other=>other!==el&&other.contains(el)));
  }

  function decorateMetrics(c){
    const cards=metricCards(c);if(cards.length<3)return;
    let parent=cards[0].parentElement;
    if(!parent||!cards.every(card=>card.parentElement===parent)){
      const parents=cards.map(card=>card.parentElement).filter(Boolean);
      parent=parents.find(p=>cards.filter(card=>p.contains(card)).length>=3)||null;
    }
    if(!parent)return;
    parent.classList.add('em-sales-metrics');
    cards.forEach(card=>card.classList.add('em-sales-metric-card'));
    if(!parent.previousElementSibling?.classList?.contains('em-sales-section-label')){
      const label=document.createElement('div');label.className='em-sales-section-label';label.textContent='Resumo financeiro';parent.parentNode?.insertBefore(label,parent);
    }
  }

  function findFinalize(modal){
    return [...modal.querySelectorAll('button,.btn')].find(el=>!el.classList.contains('em-sale-checkout-finish')&&norm(text(el)).includes('finalizar'))||null;
  }

  function activeSaleModal(){
    for(const back of document.querySelectorAll('.modal-back')){
      if(!visible(back))continue;
      const modal=back.querySelector('.modal');if(!modal)continue;
      const finalize=findFinalize(modal);
      const title=norm(text(modal.querySelector('.modal-head h2,h2')));
      if(finalize&&(modal.querySelector('.pdv,.order')||title.includes('venda'))) return {back,modal,finalize};
    }
    return null;
  }

  function nativeSaleSummary(modal,finalize){
    const order=modal.querySelector('.order');
    if(order)return order;
    let node=finalize?.parentElement||null;
    while(node&&node!==modal){
      const t=norm(text(node));
      if(t.includes('total')&&(t.includes('desconto')||t.includes('quantidade')||t.includes('qtd')||t.includes('itens')||t.includes('item'))) return node;
      node=node.parentElement;
    }
    return null;
  }

  const moneyPattern=/R\$\s*[\d.]+,\d{2}/;
  const percentPattern=/\d+(?:[.,]\d+)?\s*%/;
  const quantityPattern=/-?\d+(?:[.,]\d+)?/;

  function descriptor(el){
    if(!el)return '';
    const attrs=[
      el.id,
      typeof el.className==='string'?el.className:'',
      el.getAttribute?.('name'),
      el.getAttribute?.('placeholder'),
      el.getAttribute?.('aria-label'),
      el.getAttribute?.('data-label'),
      el.getAttribute?.('title')
    ].filter(Boolean);
    let before='',after='';
    try{
      const b=getComputedStyle(el,'::before')?.content;
      const a=getComputedStyle(el,'::after')?.content;
      if(b&&b!=='none')before=b.replace(/^["']|["']$/g,'');
      if(a&&a!=='none')after=a.replace(/^["']|["']$/g,'');
    }catch{}
    return norm([text(el),...attrs,before,after].join(' '));
  }

  function rawControlValue(el){
    if(!el)return '';
    if(el.matches?.('input,select,textarea')) return String(el.value??'').trim();
    return String(
      el.getAttribute?.('aria-valuenow')||
      el.getAttribute?.('data-qty')||
      el.getAttribute?.('data-value')||
      el.getAttribute?.('value')||
      text(el)||
      ''
    ).trim();
  }

  function numberFrom(raw){
    const match=String(raw||'').replace(/\./g,'.').match(quantityPattern);
    if(!match)return NaN;
    const value=Number(match[0].replace(',','.'));
    return Number.isFinite(value)?value:NaN;
  }

  function moneyNumber(raw){
    const match=String(raw||'').match(moneyPattern);
    const source=match?.[0]||String(raw||'');
    const cleaned=source.replace(/[^\d,.-]/g,'');
    if(!cleaned)return NaN;
    const value=Number(cleaned.includes(',')?cleaned.replace(/\./g,'').replace(',','.'):cleaned);
    return Number.isFinite(value)?value:NaN;
  }

  function moneyBRL(value){
    const number=Number(value);
    if(!Number.isFinite(number))return 'R$ 0,00';
    return 'R$ '+number.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  function compactQuantity(value){
    const number=Number(value);
    if(!Number.isFinite(number)||number<0)return '0';
    return Number.isInteger(number)?String(number):String(Math.round(number*1000)/1000).replace('.',',');
  }

  function semanticNodes(scope,matcher){
    if(!scope)return [];
    return [scope,...scope.querySelectorAll('*')].filter(el=>{
      try{return matcher(descriptor(el),el);}catch{return false;}
    });
  }

  function labeledValue(scope,kind){
    const matcher=kind==='qty'
      ? d=>/(^|\s)(qtd\.?|quantidade|itens?|unidades?)(\s|:|$)/.test(d)
      : kind==='discount'
        ? d=>/(^|\s)(desconto|discount)(\s|:|$)/.test(d)
        : d=>!d.includes('subtotal')&&/(^|\s)total(\s|:|$)/.test(d);

    const nodes=semanticNodes(scope,matcher)
      .filter(el=>!el.closest?.('.em-sale-mobile-checkout'))
      .sort((a,b)=>descriptor(a).length-descriptor(b).length);

    for(const node of nodes){
      const own=rawControlValue(node);
      if(kind==='total'){
        const money=own.match(moneyPattern)?.[0];if(money)return money;
      }else if(kind==='discount'){
        const money=own.match(moneyPattern)?.[0];if(money)return money;
        const pct=own.match(percentPattern)?.[0];if(pct)return pct;
      }else{
        const contextual=own.match(/(?:qtd\.?|quantidade|itens?|unidades?)\s*:?-?\s*(\d+(?:[.,]\d+)?)/i)?.[1];
        if(contextual)return contextual;
      }

      const relatives=[
        node.nextElementSibling,
        node.previousElementSibling,
        ...node.querySelectorAll?.('input,select,textarea,[aria-valuenow],[data-value],[data-qty],strong,b,span')||[]
      ].filter(Boolean);
      if(node.parentElement) relatives.push(...node.parentElement.children);

      for(const relative of relatives){
        if(relative.closest?.('.em-sale-mobile-checkout'))continue;
        const raw=rawControlValue(relative);
        if(kind==='total'){
          const money=raw.match(moneyPattern)?.[0];if(money)return money;
        }else if(kind==='discount'){
          const money=raw.match(moneyPattern)?.[0];if(money)return money;
          const pct=raw.match(percentPattern)?.[0];if(pct)return pct;
        }else{
          const n=numberFrom(raw);
          if(Number.isFinite(n)&&n>=0&&n<10000)return compactQuantity(n);
        }
      }
    }
    return '';
  }

  function qtyFromGroup(group){
    if(!group)return NaN;
    const controls=[...group.querySelectorAll('input,select,textarea,[aria-valuenow],[data-qty],[data-value]')]
      .filter(el=>!el.closest('.em-sale-mobile-checkout'));
    for(const control of controls){
      const n=numberFrom(rawControlValue(control));
      if(Number.isFinite(n)&&n>=0&&n<10000)return n;
    }

    const candidates=[...group.querySelectorAll('span,strong,b,output')]
      .filter(el=>!el.closest('.em-sale-mobile-checkout'));
    for(const candidate of candidates){
      const n=numberFrom(rawControlValue(candidate));
      if(Number.isFinite(n)&&n>=0&&n<10000)return n;
    }

    const raw=text(group)
      .replace(/R\$\s*[\d.]+,\d{2}/g,' ')
      .replace(/[+＋−–—-]/g,' ');
    const numbers=raw.match(/\b\d+(?:[.,]\d+)?\b/g)||[];
    if(numbers.length){
      const n=Number(numbers[0].replace(',','.'));
      if(Number.isFinite(n)&&n>=0&&n<10000)return n;
    }
    return NaN;
  }

  function nativeQuantity(summary,modal){
    const labeled=labeledValue(summary,'qty');
    if(labeled){
      const n=numberFrom(labeled);
      if(Number.isFinite(n)&&n>0)return compactQuantity(n);
    }

    const scope=modal.querySelector('.pdv')||summary||modal;
    const rows=[...scope.querySelectorAll('.product-row,.cart-item,.sale-item,.order-item')]
      .filter(row=>!row.closest('.em-sale-mobile-checkout'))
      .filter((row,index,all)=>!all.some(other=>other!==row&&other.contains(row)));

    let sum=0,found=false;
    for(const row of rows){
      const group=row.querySelector('.qty,.quantity,[data-qty],[class*="qty"],[class*="quant"]');
      const q=qtyFromGroup(group);
      if(Number.isFinite(q)){sum+=q;found=true;}
    }
    if(found)return compactQuantity(sum);

    const groups=[...scope.querySelectorAll('.qty,.quantity,[data-qty],[class*="qty"],[class*="quant"]')]
      .filter(el=>!el.closest('.em-sale-mobile-checkout'))
      .filter((el,index,all)=>!all.some(other=>other!==el&&other.contains(el)));
    sum=0;found=false;
    for(const group of groups){
      const q=qtyFromGroup(group);
      if(Number.isFinite(q)){sum+=q;found=true;}
    }
    if(found)return compactQuantity(sum);

    const productRows=[...scope.querySelectorAll('[data-product-id]')]
      .filter(el=>!el.closest('.em-sale-mobile-checkout'))
      .filter((el,index,all)=>!all.some(other=>other!==el&&other.contains(el)));
    if(productRows.length)return String(productRows.length);

    return labeled||'0';
  }

  function moneyNearLabel(scope,labelName){
    const target=norm(labelName);
    const nodes=semanticNodes(scope,d=>d.includes(target))
      .filter(el=>!el.closest?.('.em-sale-mobile-checkout'))
      .sort((a,b)=>descriptor(a).length-descriptor(b).length);
    for(const node of nodes){
      const pool=[node,node.nextElementSibling,node.previousElementSibling,node.parentElement].filter(Boolean);
      for(const item of pool){
        const match=rawControlValue(item).match(moneyPattern)?.[0]||text(item).match(moneyPattern)?.[0];
        if(match)return match;
      }
    }
    return '';
  }

  function discountControl(summary){
    const controls=[...summary.querySelectorAll('input,select,textarea')]
      .filter(el=>!el.closest('.em-sale-mobile-checkout'));
    for(const control of controls){
      const parent=control.closest('label,.field,.form-field,.input-group,.form-row,.price-grid,div');
      const d=norm([descriptor(control),descriptor(parent),descriptor(control.previousElementSibling),descriptor(control.nextElementSibling)].join(' '));
      if(!d.includes('desconto')&&!d.includes('discount'))continue;
      const raw=String(control.value??'').trim();
      const n=numberFrom(raw);
      if(!Number.isFinite(n))continue;
      const wrapper=parent||control.parentElement;
      const typeControl=wrapper?.querySelector?.('select');
      const type=norm(typeControl?.value||typeControl?.selectedOptions?.[0]?.textContent||d);
      if(type.includes('percent')||type.includes('%'))return compactQuantity(n)+'%';
      return moneyBRL(Math.max(0,n));
    }
    return '';
  }

  function nativeDiscount(summary){
    const visibleValue=labeledValue(summary,'discount');
    if(visibleValue&&visibleValue!=='0'&&visibleValue!=='0%')return visibleValue;

    const subtotalText=moneyNearLabel(summary,'subtotal');
    const totalText=labeledValue(summary,'total');
    const subtotal=moneyNumber(subtotalText);
    const total=moneyNumber(totalText);
    if(Number.isFinite(subtotal)&&Number.isFinite(total)&&subtotal>=total){
      return moneyBRL(Math.max(0,subtotal-total));
    }

    const control=discountControl(summary);
    if(control)return control;

    return visibleValue||'R$ 0,00';
  }

  function nativeTotal(summary){
    return labeledValue(summary,'total')||'R$ 0,00';
  }

  function setText(el,value){if(el&&text(el)!==String(value))el.textContent=String(value);}

  function decorateSaleModal(){
    const found=activeSaleModal();
    document.body.classList.toggle('em-sale-modal-open',!!found);
    if(!found)return;

    const {modal,finalize}=found;
    modal.classList.add('em-sale-modal');
    modal.querySelectorAll('.em-sale-native-summary').forEach(el=>el.classList.remove('em-sale-native-summary'));
    modal.querySelectorAll('.em-sale-native-finalize').forEach(el=>el.classList.remove('em-sale-native-finalize'));

    const summary=nativeSaleSummary(modal,finalize);
    if(!summary)return;

    let checkout=modal.querySelector('.em-sale-mobile-checkout');
    if(!checkout){
      checkout=document.createElement('section');
      checkout.className='em-sale-mobile-checkout';
      checkout.setAttribute('aria-label','Resumo da venda');
      checkout.innerHTML='<div class="em-sale-checkout-metrics"><div class="em-sale-checkout-metric"><small>Qtd.</small><strong data-em-sale-qty>0</strong></div><div class="em-sale-checkout-metric"><small>Desconto</small><strong data-em-sale-discount>R$ 0,00</strong></div><div class="em-sale-checkout-metric em-sale-checkout-total"><small>Total</small><strong data-em-sale-total>R$ 0,00</strong></div></div><button type="button" class="em-sale-checkout-finish">Finalizar venda</button>';
      modal.appendChild(checkout);
      checkout.querySelector('.em-sale-checkout-finish')?.addEventListener('click',()=>{
        const original=findFinalize(modal);if(original&&!original.disabled)original.click();
      });
    }

    setText(checkout.querySelector('[data-em-sale-qty]'),nativeQuantity(summary,modal));
    setText(checkout.querySelector('[data-em-sale-discount]'),nativeDiscount(summary));
    setText(checkout.querySelector('[data-em-sale-total]'),nativeTotal(summary));
    const proxy=checkout.querySelector('.em-sale-checkout-finish');
    if(proxy){proxy.disabled=!!finalize.disabled;proxy.setAttribute('aria-disabled',String(!!finalize.disabled));}
  }

  function decorate(){
    decorateSaleModal();
    const c=content();if(!c)return;
    const sales=isSalesView();
    root.classList.toggle('em-sales-screen',sales);c.classList.toggle('em-sales-view',sales);
    if(!sales)return;
    const head=c.querySelector('.page-head');
    if(head){
      if(!head.querySelector('.em-sales-status')){
        const badge=document.createElement('div');badge.className='em-sales-status';badge.textContent='PDV online';
        const h1=head.querySelector('h1');if(h1)head.insertBefore(badge,h1);else head.prepend(badge);
      }
      const p=head.querySelector('p');if(p)p.textContent='Acompanhe vendas, recebimentos, descontos e valores pendentes em um só lugar.';
      const primary=findPrimary(head);if(primary){primary.classList.add('em-sales-primary');primary.textContent='+ Nova venda';}
    }
    hideContext(c);decorateMetrics(c);
    c.querySelectorAll('table.table').forEach(table=>table.closest('.table-card')?.classList.add('em-sales-history'));
  }

  function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra],.em-sale-modal button,.em-sale-modal input,.em-sale-modal select,.em-sale-modal .qty,.em-sale-modal .quantity'))setTimeout(refresh,20);},true);
  document.addEventListener('input',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  document.addEventListener('change',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  if(document.body)new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-active-page','disabled','value','aria-valuenow','data-qty']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
