/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V6 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=(el)=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const mobile=()=>window.matchMedia('(max-width:760px)').matches||/android|iphone|ipad|ipod/i.test(navigator.userAgent);

  function ensureDetailStyle(){
    if(document.getElementById('em-client-detail-v6-style')) return;
    const style=document.createElement('style');
    style.id='em-client-detail-v6-style';
    style.textContent=`
      html.em-client-detail-open #emMobileDock{display:none!important}
      .em-client-detail-sheet{box-sizing:border-box!important;max-width:100%!important;overflow-x:hidden!important}
      .em-client-native-summary-v6{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;grid-auto-flow:row!important;gap:10px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important;overflow:visible!important;transform:none!important}
      .em-client-native-summary-v6>.em-client-native-stat-v6{box-sizing:border-box!important;min-width:0!important;max-width:none!important;width:100%!important;flex:none!important;float:none!important;margin-left:0!important;margin-right:0!important;transform:none!important;overflow:hidden!important}
      .em-client-native-summary-v6>.em-client-native-stat-v6 *{max-width:100%!important;min-width:0!important;white-space:normal!important;overflow-wrap:anywhere!important;box-sizing:border-box!important}
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

  function findTextLeaf(needle){
    const all=[...document.querySelectorAll('a,button,small,span,p,b,strong,div')];
    const hits=all.filter(el=>{
      if(!visible(el)) return false;
      const s=norm(txt(el));
      return s.includes(needle)&&s.length<180;
    });
    hits.sort((a,b)=>a.children.length-b.children.length||txt(a).length-txt(b).length);
    return hits[0]||null;
  }

  function findDetailRoot(){
    const whatsapp=findTextLeaf('whatsapp');
    if(!whatsapp) return null;
    let cur=whatsapp;
    for(let i=0;i<14&&cur&&cur!==document.body&&cur!==document.documentElement;i++,cur=cur.parentElement){
      const s=norm(txt(cur));
      if(s.includes('whatsapp')&&s.includes('compras')&&(s.includes('total comprado')||s.includes('saldo em aberto')||s.includes('ja recebido'))) return cur;
    }
    return null;
  }

  function matchesStatChild(child,key){
    const s=norm(txt(child));
    if(key==='status') return s.includes('status')&&(s.includes('ativo')||s.includes('inativo')||s.length<120);
    return s.includes(key);
  }

  function findNativeSummary(detail){
    const candidates=[];
    const nodes=[detail,...detail.querySelectorAll('div,section,article')];
    for(const el of nodes){
      if(!visible(el)||el.classList.contains('em-client-stats-v5')) continue;
      const children=[...el.children].filter(visible);
      if(children.length<4||children.length>8) continue;
      const matched=statKeys.map(key=>children.find(ch=>matchesStatChild(ch,key))).filter(Boolean);
      if(matched.length!==4||new Set(matched).size!==4) continue;
      const r=el.getBoundingClientRect();
      candidates.push({el,matched,area:r.width*r.height,text:txt(el).length});
    }
    candidates.sort((a,b)=>a.area-b.area||a.text-b.text);
    return candidates[0]||null;
  }

  function clearLegacy(detail){
    detail.querySelectorAll('.em-client-stats-v5').forEach(el=>el.remove());
    detail.querySelectorAll('[data-em-client-original-summary]').forEach(el=>el.removeAttribute('data-em-client-original-summary'));
    detail.querySelectorAll('.em-client-native-summary-v6').forEach(el=>{
      el.classList.remove('em-client-native-summary-v6');
      [...el.children].forEach(ch=>ch.classList.remove('em-client-native-stat-v6'));
    });
  }

  function forceNativeSummary(detail){
    ensureDetailStyle();
    clearLegacy(detail);
    const found=findNativeSummary(detail);
    if(!found) return false;
    const {el,matched}=found;
    el.classList.add('em-client-native-summary-v6');
    el.style.setProperty('display','grid','important');
    el.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    el.style.setProperty('grid-auto-flow','row','important');
    el.style.setProperty('gap','10px','important');
    el.style.setProperty('width','100%','important');
    el.style.setProperty('max-width','100%','important');
    el.style.setProperty('min-width','0','important');
    el.style.setProperty('overflow','visible','important');
    el.style.setProperty('transform','none','important');
    for(const card of matched){
      card.classList.add('em-client-native-stat-v6');
      card.style.setProperty('min-width','0','important');
      card.style.setProperty('max-width','none','important');
      card.style.setProperty('width','100%','important');
      card.style.setProperty('flex','none','important');
      card.style.setProperty('box-sizing','border-box','important');
      card.style.setProperty('transform','none','important');
    }
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
    detail.classList.add('em-client-detail-sheet');
    const shell=detail.closest('.modal')||detail.closest('.modal-back')||detail.closest('[role="dialog"]');
    if(shell) shell.classList.add('em-client-detail-sheet');
    forceNativeSummary(detail);

    [...detail.querySelectorAll('.card,.status-box,div')].forEach(card=>{
      const s=norm(txt(card));
      if(s.includes('whatsapp')&&s.includes('cidade')&&s.includes('origem')&&s.length<500) card.classList.add('em-client-detail-info');
    });
    const purchases=[...detail.querySelectorAll('h1,h2,h3,h4,strong,div')].find(h=>norm(txt(h))==='compras');
    if(purchases) purchases.classList.add('em-client-purchases-title');
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
  document.addEventListener('click',()=>setTimeout(refresh,25),true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-active-page']});
  window.addEventListener('pageshow',refresh);
  window.addEventListener('resize',refresh,{passive:true});
  refresh();
})();
