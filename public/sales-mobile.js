/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V2 */
(() => {
  const root=document.documentElement;
  let scheduled=false;

  const text=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(value)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();

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
      const direct=[...el.children].map(child=>norm(text(child))).join(' ');
      return labels.some(label=>t.startsWith(label)||direct.startsWith(label)||t.includes(label));
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

  function decorate(){
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
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra]'))setTimeout(refresh,20);},true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-active-page']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
