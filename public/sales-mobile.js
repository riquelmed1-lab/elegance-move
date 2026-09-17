/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V2 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V3 */
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
      if(block){
        block.classList.add('em-sales-context');
        block.style.setProperty('display','none','important');
      }
    }
  }

  function metricCards(c){
    const labels=['faturamento liquido','descontos','recebido','em aberto','a receber','saldo pendente'];
    const candidates=[...c.querySelectorAll('.metric,.card')].filter(el=>{
      const t=norm(text(el));
      return labels.some(label=>t.startsWith(label)||t.includes(label));
    });
    return candidates.filter((el,index,arr)=>!arr.some(other=>other!==el&&other.contains(el)));
  }

  function decorateMetrics(c){
    const cards=metricCards(c);
    if(cards.length<3) return;
    let parent=cards[0].parentElement;
    if(!parent||!cards.every(card=>card.parentElement===parent)){
      const parents=cards.map(card=>card.parentElement).filter(Boolean);
      parent=parents.find(p=>cards.filter(card=>p.contains(card)).length>=3)||null;
    }
    if(!parent) return;

    parent.classList.add('em-sales-metrics');
    cards.forEach(card=>card.classList.add('em-sales-metric-card'));

    if(!parent.previousElementSibling?.classList?.contains('em-sales-section-label')){
      const label=document.createElement('div');
      label.className='em-sales-section-label';
      label.textContent='Resumo financeiro';
      parent.parentNode?.insertBefore(label,parent);
    }
  }

  function findFinalize(modal){
    return [...modal.querySelectorAll('button,.btn')].find(el=>!el.classList.contains('em-sale-checkout-finish')&&norm(text(el)).includes('finalizar'))||null;
  }

  function activeSaleModal(){
    for(const back of document.querySelectorAll('.modal-back')){
      if(!visible(back)) continue;
      const modal=back.querySelector('.modal');
      if(!modal) continue;
      const finalize=findFinalize(modal);
      const title=norm(text(modal.querySelector('.modal-head h2,h2')));
      if(finalize&&(modal.querySelector('.pdv,.order')||title.includes('venda'))) return {back,modal,finalize};
    }
    return null;
  }

  function moneyFrom(node){
    const matches=text(node).match(/R\$\s*[\d.]+,\d{2}/g);
    return matches?.length?matches[matches.length-1]:'';
  }

  function labeledMoney(rootNode,label){
    const candidates=[...rootNode.querySelectorAll('div,p,span,label,small,b,strong')].filter(el=>{
      const t=norm(text(el));
      return t.includes(label)&&t.length<100;
    });
    for(const el of candidates){
      const own=moneyFrom(el);
      if(own) return own;
      const parent=el.parentElement;
      const parentMoney=moneyFrom(parent);
      if(parentMoney) return parentMoney;
    }
    return '';
  }

  function saleQuantity(modal){
    const order=modal.querySelector('.order')||modal;
    const qtyNodes=[...order.querySelectorAll('.qty')];
    let sum=0,found=false;
    for(const node of qtyNodes){
      const input=node.querySelector('input');
      let value=input?Number(input.value):NaN;
      if(!Number.isFinite(value)){
        const match=text(node).match(/\b\d+\b/);
        value=match?Number(match[0]):NaN;
      }
      if(Number.isFinite(value)&&value>=0){sum+=value;found=true;}
    }
    if(found) return sum;
    const explicit=[...order.querySelectorAll('div,p,span,small,b,strong')].find(el=>{
      const t=norm(text(el));return (t.startsWith('quantidade')||t.startsWith('qtd'))&&t.length<60;
    });
    const match=text(explicit).match(/\b\d+\b/);
    return match?Number(match[0]):0;
  }

  function saleDiscount(modal){
    const order=modal.querySelector('.order')||modal;
    const money=labeledMoney(order,'desconto');
    if(money) return money;
    const candidate=[...order.querySelectorAll('div,p,span,label,small,b,strong')].find(el=>norm(text(el)).includes('desconto')&&text(el).length<80);
    const percent=text(candidate).match(/\d+(?:[.,]\d+)?\s*%/);
    return percent?percent[0]:'R$ 0,00';
  }

  function saleTotal(modal){
    const order=modal.querySelector('.order')||modal;
    const direct=order.querySelector('.order-total');
    return moneyFrom(direct)||labeledMoney(order,'total')||'R$ 0,00';
  }

  function setText(el,value){if(el&&text(el)!==String(value))el.textContent=String(value);}

  function decorateSaleModal(){
    const found=activeSaleModal();
    document.body.classList.toggle('em-sale-modal-open',!!found);
    if(!found) return;
    const {modal,finalize}=found;
    modal.classList.add('em-sale-modal');

    let checkout=modal.querySelector('.em-sale-mobile-checkout');
    if(!checkout){
      checkout=document.createElement('section');
      checkout.className='em-sale-mobile-checkout';
      checkout.setAttribute('aria-label','Resumo da venda');
      checkout.innerHTML='<div class="em-sale-checkout-metrics"><div class="em-sale-checkout-metric"><small>Qtd.</small><strong data-em-sale-qty>0</strong></div><div class="em-sale-checkout-metric"><small>Desconto</small><strong data-em-sale-discount>R$ 0,00</strong></div><div class="em-sale-checkout-metric em-sale-checkout-total"><small>Total</small><strong data-em-sale-total>R$ 0,00</strong></div></div><button type="button" class="em-sale-checkout-finish">Finalizar venda</button>';
      modal.appendChild(checkout);
      checkout.querySelector('.em-sale-checkout-finish')?.addEventListener('click',()=>{
        const original=findFinalize(modal);
        if(original&&!original.disabled) original.click();
      });
    }

    setText(checkout.querySelector('[data-em-sale-qty]'),saleQuantity(modal));
    setText(checkout.querySelector('[data-em-sale-discount]'),saleDiscount(modal));
    setText(checkout.querySelector('[data-em-sale-total]'),saleTotal(modal));
    const proxy=checkout.querySelector('.em-sale-checkout-finish');
    if(proxy){
      proxy.disabled=!!finalize.disabled;
      proxy.setAttribute('aria-disabled',String(!!finalize.disabled));
    }
  }

  function decorate(){
    decorateSaleModal();
    const c=content();if(!c)return;
    const sales=isSalesView();
    root.classList.toggle('em-sales-screen',sales);
    c.classList.toggle('em-sales-view',sales);
    if(!sales) return;

    const head=c.querySelector('.page-head');
    if(head){
      if(!head.querySelector('.em-sales-status')){
        const badge=document.createElement('div');
        badge.className='em-sales-status';
        badge.textContent='PDV online';
        const h1=head.querySelector('h1');
        if(h1) head.insertBefore(badge,h1); else head.prepend(badge);
      }
      const p=head.querySelector('p');
      if(p) p.textContent='Acompanhe vendas, recebimentos, descontos e valores pendentes em um só lugar.';
      const primary=findPrimary(head);
      if(primary){
        primary.classList.add('em-sales-primary');
        primary.textContent='+ Nova venda';
      }
    }

    hideContext(c);
    decorateMetrics(c);
    c.querySelectorAll('table.table').forEach(table=>table.closest('.table-card')?.classList.add('em-sales-history'));
  }

  function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',e=>{
    if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra],.qty,.em-sale-modal button')) setTimeout(refresh,20);
  },true);
  document.addEventListener('input',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  document.addEventListener('change',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  if(document.body)new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-active-page','disabled']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
