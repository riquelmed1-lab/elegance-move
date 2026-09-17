/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V2 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V3 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V4 */
/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V5 */
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
    return [...modal.querySelectorAll('button,.btn')].find(el=>norm(text(el)).includes('finalizar'))||null;
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

  function nativeSaleSummary(modal,finalize){
    const order=modal.querySelector('.order');
    if(order) return order;

    let node=finalize?.parentElement||null;
    while(node&&node!==modal){
      const t=norm(text(node));
      const hasTotal=t.includes('total');
      const hasCommercial=t.includes('desconto')||t.includes('quantidade')||t.includes('qtd')||t.includes('itens')||t.includes('item');
      if(hasTotal&&hasCommercial) return node;
      node=node.parentElement;
    }
    return null;
  }

  function decorateSaleModal(){
    const found=activeSaleModal();
    document.body.classList.toggle('em-sale-modal-open',!!found);

    /* Remove o resumo paralelo das versoes anteriores: o PDV nativo e a unica fonte. */
    document.querySelectorAll('.em-sale-mobile-checkout').forEach(el=>el.remove());

    if(!found) return;
    const {modal,finalize}=found;
    modal.classList.add('em-sale-modal');

    const summary=nativeSaleSummary(modal,finalize);
    if(!summary) return;

    summary.classList.add('em-sale-native-summary');
    finalize.classList.add('em-sale-native-finalize');

    requestAnimationFrame(()=>{
      if(!summary.isConnected) return;
      const measured=Math.ceil(summary.getBoundingClientRect().height||0);
      if(measured>0){
        const reserved=Math.min(Math.max(measured,150),360);
        modal.style.setProperty('--em-native-sale-summary-h',reserved+'px');
      }
    });
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
    if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra],.em-sale-modal button,.em-sale-modal input,.em-sale-modal select')) setTimeout(refresh,20);
  },true);
  document.addEventListener('input',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  document.addEventListener('change',e=>{if(e.target.closest?.('.em-sale-modal'))setTimeout(refresh,0);},true);
  if(document.body)new MutationObserver(refresh).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-active-page','disabled']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
