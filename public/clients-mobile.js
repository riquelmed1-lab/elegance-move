/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
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

  function decorate(){
    const c=content(); if(!c) return;
    const active=isClients();
    root.classList.toggle('em-clients-screen',active);
    c.classList.toggle('em-clients-view',active);
    if(!active) return;

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

    c.querySelectorAll('table.table').forEach(table=>{
      const headers=[...table.querySelectorAll('thead th')].map(th=>txt(th));
      table.querySelectorAll('tbody tr').forEach(row=>{
        [...row.children].forEach((td,i)=>{if(!td.dataset.label&&headers[i]) td.dataset.label=headers[i];});
      });
    });
  }

  function refresh(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{scheduled=false;decorate();});
  }

  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('[data-page],#emMobileDock button,[data-em-extra]')) setTimeout(refresh,20);},true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style','data-active-page']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
