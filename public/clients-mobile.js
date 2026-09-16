/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V3 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

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

  const statLabels=['status','total comprado','ja recebido','saldo em aberto'];
  const labelCount=(el)=>{
    const s=norm(txt(el));
    return statLabels.filter(label=>s.includes(label)).length;
  };

  function findStatCard(modal,label){
    const nodes=[...modal.querySelectorAll('*')].filter(el=>{
      const s=norm(txt(el));
      return (s===label||s.startsWith(label+' '))&&s.length<90;
    });
    const leaf=nodes.sort((a,b)=>a.children.length-b.children.length)[0];
    if(!leaf) return null;
    let cur=leaf;
    while(cur&&cur.parentElement&&cur.parentElement!==modal){
      const parent=cur.parentElement;
      if(labelCount(parent)>=2) break;
      cur=parent;
    }
    return cur===modal?null:cur;
  }

  function forceMetricLayout(modal){
    const cards=statLabels.map(label=>findStatCard(modal,label)).filter(Boolean);
    const unique=[...new Set(cards)];
    if(unique.length<4) return false;

    let parent=unique[0].parentElement;
    while(parent&&parent!==modal&&!unique.every(card=>parent.contains(card))) parent=parent.parentElement;
    if(!parent||parent===modal) return false;

    parent.dataset.emClientStats='true';
    parent.style.setProperty('display','grid','important');
    parent.style.setProperty('grid-template-columns','repeat(2,minmax(0,1fr))','important');
    parent.style.setProperty('gap','10px','important');
    parent.style.setProperty('width','100%','important');
    parent.style.setProperty('max-width','100%','important');
    parent.style.setProperty('overflow','visible','important');

    unique.forEach((card,index)=>{
      card.dataset.emClientStat=statLabels[index]||'metric';
      card.style.setProperty('width','100%','important');
      card.style.setProperty('min-width','0','important');
      card.style.setProperty('max-width','100%','important');
      card.style.setProperty('box-sizing','border-box','important');
      card.style.setProperty('overflow','hidden','important');
      card.style.setProperty('padding','14px 12px','important');
      card.style.setProperty('min-height','102px','important');
      card.style.setProperty('height','auto','important');
      card.querySelectorAll('*').forEach(child=>{
        child.style.setProperty('max-width','100%','important');
        child.style.setProperty('white-space','normal','important');
        child.style.setProperty('overflow-wrap','anywhere','important');
      });
    });
    return true;
  }

  function decorateDetails(){
    let detailOpen=false;
    document.querySelectorAll('.modal').forEach(modal=>{
      const t=norm(txt(modal));
      const isDetail=t.includes('compras')&&t.includes('whatsapp')&&statLabels.filter(k=>t.includes(k)).length>=2;
      modal.classList.toggle('em-client-detail-sheet',isDetail);
      if(!isDetail) return;
      detailOpen=true;
      forceMetricLayout(modal);

      [...modal.querySelectorAll('.card,.status-box')].forEach(card=>{
        const s=norm(txt(card));
        if(s.includes('whatsapp')&&(s.includes('cidade')||s.includes('origem')||s.includes('observacoes'))) card.classList.add('em-client-detail-info');
      });
      const purchases=[...modal.querySelectorAll('h1,h2,h3')].find(h=>norm(txt(h))==='compras');
      if(purchases) purchases.classList.add('em-client-purchases-title');
    });
    root.classList.toggle('em-client-detail-open',detailOpen);
  }

  function decorate(){
    const c=content(); if(!c) return;
    const active=isClients();
    root.classList.toggle('em-clients-screen',active);
    c.classList.toggle('em-clients-view',active);
    if(active){
      const head=c.querySelector('.page-head');
      if(head){
        if(!head.querySelector('.em-clients-status')){
          const badge=document.createElement('div');
          badge.className='em-clients-status';
          badge.textContent='Cadastro organizado';
          const h1=head.querySelector('h1');
          if(h1) head.insertBefore(badge,h1); else head.prepend(badge);
        }
        const p=head.querySelector('p');
        if(p) p.textContent='Encontre clientes rapidamente, acompanhe contatos e mantenha o relacionamento organizado.';
        const primary=findPrimary(head);
        if(primary){
          primary.classList.add('em-clients-primary');
          if(norm(txt(primary)).includes('cliente')) primary.textContent='+ Novo cliente';
        }
      }
      classifyClientRows(c);
    }
    decorateDetails();
  }

  function refresh(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate();});
  }

  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',()=>setTimeout(refresh,30),true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-active-page']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
