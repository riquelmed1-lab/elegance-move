/* ELEGANCE_MOVE_SALES_MOBILE_RUNTIME_V1 */
(() => {
  const root=document.documentElement;
  let scheduled=false;

  const text=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(value)=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

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
    return head.querySelector('[data-action="new-sale"]')||candidates.find(el=>norm(text(el)).includes('nova venda'))||candidates.find(el=>norm(text(el)).includes('nova')&&norm(text(el)).includes('venda'))||null;
  }

  function findMetrics(c){
    const grids=[...c.querySelectorAll('.grid4,.kpi-grid,.premium-kpi-secondary')];
    return grids.find(grid=>{
      const t=norm(text(grid));
      return ['faturamento liquido','descontos','recebido','a receber','saldo pendente'].filter(label=>t.includes(label)).length>=2;
    })||null;
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
      if(primary){primary.classList.add('em-sales-primary');if(!norm(text(primary)).includes('nova venda')) primary.textContent='+ Nova venda';}
    }

    [...c.querySelectorAll('.story-banner,.status-box,.card')].forEach(el=>{
      if(norm(text(el)).includes('venda com contexto')) el.classList.add('em-sales-context');
    });

    const metrics=findMetrics(c);
    if(metrics){
      metrics.classList.add('em-sales-metrics');
      if(!metrics.previousElementSibling?.classList?.contains('em-sales-section-label')){
        const label=document.createElement('div');
        label.className='em-sales-section-label';
        label.textContent='Resumo financeiro';
        metrics.parentNode?.insertBefore(label,metrics);
      }
    }

    c.querySelectorAll('table.table').forEach(table=>table.closest('.table-card')?.classList.add('em-sales-history'));
  }

  function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra]'))setTimeout(refresh,20);},true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-active-page']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
