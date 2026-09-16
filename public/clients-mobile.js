/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V10 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=el=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};

  function loginVisible(){
    const login=document.getElementById('login');
    if(!login) return false;
    const s=getComputedStyle(login);
    return s.display!=='none'&&s.visibility!=='hidden'&&login.getClientRects().length>0;
  }

  function isClients(){
    if(loginVisible()) return false;
    const active=document.body.dataset.activePage||document.querySelector('.nav button.active[data-page]')?.dataset.page||'';
    if(active==='clientes') return true;
    const h1=content()?.querySelector('.page-head h1,h1');
    return norm(txt(h1))==='clientes';
  }

  function findPrimary(head){
    const buttons=[...head.querySelectorAll('button,.btn')];
    return head.querySelector('[data-action="new-client"],[data-action="new-customer"]')||buttons.find(b=>{const t=norm(txt(b));return t.includes('novo cliente')||t.includes('nova cliente')||t.includes('cadastrar cliente');})||null;
  }

  function classifyClientRows(c){
    c.querySelectorAll('table.table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')].map(th=>txt(th));
      table.querySelectorAll('tbody tr').forEach(row=>{
        row.classList.add('em-client-card-row');
        [...row.children].forEach((td,i)=>{
          const label=td.dataset.label||headers[i]||'';
          if(label) td.dataset.label=label;
          const key=norm(label);
          td.classList.remove('em-client-name','em-client-whatsapp','em-client-city','em-client-last','em-client-total','em-client-status','em-client-actions');
          if(key.includes('cliente')||key==='nome') td.classList.add('em-client-name');
          else if(key.includes('whatsapp')||key.includes('telefone')) td.classList.add('em-client-whatsapp');
          else if(key.includes('cidade')) td.classList.add('em-client-city');
          else if(key.includes('ultima compra')) td.classList.add('em-client-last');
          else if(key.includes('total gasto')||key.includes('total comprado')) td.classList.add('em-client-total');
          else if(key.includes('status')) td.classList.add('em-client-status');
          else if(key.includes('acoes')) td.classList.add('em-client-actions');
        });
      });
    });
  }

  function findClientDetail(){
    const modals=[...document.querySelectorAll('.modal,[role="dialog"],.modal-back')].filter(visible);
    for(const el of modals){
      const s=norm(txt(el));
      if(s.includes('whatsapp')&&s.includes('compras')) return el.classList.contains('modal-back')?(el.querySelector('.modal')||el):el;
    }
    return null;
  }

  function hideBrokenMetrics(){
    if(!window.matchMedia('(max-width:760px)').matches) return;
    const detail=findClientDetail();
    if(!detail) return;

    detail.querySelectorAll('.em-client-summary-v8,.em-client-summary-v9').forEach(el=>el.remove());
    detail.querySelectorAll('[data-em-client-stat-hidden]').forEach(el=>el.removeAttribute('data-em-client-stat-hidden'));

    const direct=[...detail.querySelectorAll('.grid4,.kpi-grid,.premium-kpi-secondary,.em-client-detail-metrics')].filter(visible);
    direct.forEach(el=>el.style.setProperty('display','none','important'));

    if(direct.length===0){
      const keys=['status','total comprado','ja recebido','saldo em aberto'];
      const candidates=[...detail.querySelectorAll('div,section,article')].filter(visible);
      const target=candidates.find(el=>{
        const children=[...el.children].filter(visible);
        if(children.length<4||children.length>6) return false;
        const s=norm(txt(el));
        return keys.filter(k=>s.includes(k)).length>=3;
      });
      if(target) target.style.setProperty('display','none','important');
    }

    detail.style.setProperty('overflow-x','hidden','important');
  }

  function decorate(){
    const c=content();
    if(c){
      const active=isClients();
      root.classList.toggle('em-clients-screen',active);
      c.classList.toggle('em-clients-view',active);
      if(active){
        const head=c.querySelector('.page-head');
        if(head){
          if(!head.querySelector('.em-clients-status')){
            const badge=document.createElement('div');badge.className='em-clients-status';badge.textContent='Cadastro organizado';
            const h1=head.querySelector('h1');if(h1) head.insertBefore(badge,h1);else head.prepend(badge);
          }
          const p=head.querySelector('p');if(p)p.textContent='Encontre clientes rapidamente, acompanhe contatos e mantenha o relacionamento organizado.';
          const primary=findPrimary(head);if(primary){primary.classList.add('em-clients-primary');if(norm(txt(primary)).includes('cliente'))primary.textContent='+ Novo cliente';}
        }
        classifyClientRows(c);
      }
    }
    hideBrokenMetrics();
  }

  function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',()=>setTimeout(refresh,25),true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',refresh);
  window.addEventListener('resize',refresh,{passive:true});
  refresh();
})();
