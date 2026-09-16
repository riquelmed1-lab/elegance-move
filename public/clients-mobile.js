/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V7 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=el=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const mobile=()=>window.matchMedia('(max-width:760px)').matches||/android|iphone|ipad|ipod/i.test(navigator.userAgent);

  function ensureDetailStyle(){
    if(document.getElementById('em-client-detail-v7-style')) return;
    const style=document.createElement('style');
    style.id='em-client-detail-v7-style';
    style.textContent=`
      html.em-client-detail-open #emMobileDock{display:none!important}
      .em-client-detail-v7{box-sizing:border-box!important;max-width:100%!important;overflow-x:hidden!important}
      .em-client-summary-v7{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-flow:row!important;gap:10px!important;width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;overflow:visible!important}
      .em-client-summary-v7>*{box-sizing:border-box!important;min-width:0!important;max-width:none!important;width:100%!important;flex:none!important;float:none!important;margin-left:0!important;margin-right:0!important;transform:none!important;overflow:hidden!important}
      .em-client-summary-v7>*>*{max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;box-sizing:border-box!important}
    `;
    document.head.appendChild(style);
  }

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

  const statKeys=['status','total comprado','ja recebido','saldo em aberto'];
  const hasClientDetailText=el=>{
    const s=norm(txt(el));
    const count=statKeys.filter(k=>s.includes(k)).length;
    return s.includes('whatsapp')&&s.includes('compras')&&count>=3;
  };

  function findDetailRoot(){
    const overlays=[...document.querySelectorAll('.modal-back,[role="dialog"],.modal')].filter(visible);
    for(const el of overlays){
      if(!hasClientDetailText(el)) continue;
      if(el.classList.contains('modal-back')) return el.querySelector('.modal')||el;
      return el;
    }

    const hits=[...document.querySelectorAll('a,button,small,span,p,b,strong,div')]
      .filter(el=>visible(el)&&norm(txt(el)).includes('whatsapp'))
      .sort((a,b)=>a.children.length-b.children.length||txt(a).length-txt(b).length);

    for(const hit of hits){
      let cur=hit;
      for(let i=0;i<16&&cur&&cur!==document.body&&cur!==document.documentElement;i++,cur=cur.parentElement){
        if(hasClientDetailText(cur)){
          const modal=cur.closest('.modal')||cur.querySelector?.('.modal');
          return modal||cur;
        }
      }
    }
    return null;
  }

  function childForKey(children,key){
    return children.find(ch=>{
      const s=norm(txt(ch));
      if(key==='status') return s.includes('status')&&(s.includes('ativo')||s.includes('inativo')||s.length<140);
      return s.includes(key);
    })||null;
  }

  function findSummary(detail){
    const preferred=[...detail.querySelectorAll('.grid4,.kpi-grid')].filter(visible);
    for(const el of preferred){
      const children=[...el.children].filter(visible);
      if(children.length<4) continue;
      const matched=statKeys.map(k=>childForKey(children,k));
      if(matched.every(Boolean)&&new Set(matched).size===4) return {el,cards:matched};
    }

    const candidates=[detail,...detail.querySelectorAll('div,section,article')];
    const found=[];
    for(const el of candidates){
      if(!visible(el)) continue;
      const children=[...el.children].filter(visible);
      if(children.length<4||children.length>8) continue;
      const matched=statKeys.map(k=>childForKey(children,k));
      if(!matched.every(Boolean)||new Set(matched).size!==4) continue;
      const r=el.getBoundingClientRect();
      found.push({el,cards:matched,area:r.width*r.height});
    }
    found.sort((a,b)=>a.area-b.area);
    return found[0]||null;
  }

  function forceSummary(detail){
    ensureDetailStyle();
    const found=findSummary(detail);
    if(!found) return false;
    const {el,cards}=found;
    el.classList.add('em-client-summary-v7');
    el.style.setProperty('display','grid','important');
    el.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    el.style.setProperty('grid-auto-flow','row','important');
    el.style.setProperty('gap','10px','important');
    el.style.setProperty('width','100%','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('overflow','visible','important');
    el.style.setProperty('transform','none','important');
    cards.forEach(card=>{
      card.style.setProperty('min-width','0','important');
      card.style.setProperty('max-width','none','important');
      card.style.setProperty('width','100%','important');
      card.style.setProperty('flex','none','important');
      card.style.setProperty('box-sizing','border-box','important');
      card.style.setProperty('transform','none','important');
      card.querySelectorAll('*').forEach(node=>{
        node.style.setProperty('max-width','100%','important');
        node.style.setProperty('min-width','0','important');
        node.style.setProperty('white-space','normal','important');
        node.style.setProperty('overflow-wrap','anywhere','important');
      });
    });
    return true;
  }

  function decorateDetails(){
    if(!mobile()){
      root.classList.remove('em-client-detail-open');
      return;
    }
    const detail=findDetailRoot();
    root.classList.toggle('em-client-detail-open',!!detail);
    if(!detail) return;
    detail.classList.add('em-client-detail-v7');
    detail.style.setProperty('max-width','100%','important');
    detail.style.setProperty('overflow-x','hidden','important');
    forceSummary(detail);
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
    decorateDetails();
  }

  function refresh(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorate();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',()=>setTimeout(refresh,20),true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',refresh);
  window.addEventListener('resize',refresh,{passive:true});
  refresh();
})();
