(() => {
  const mq=window.matchMedia('(max-width:760px)');
  const core=['dashboard','vendas','clientes','estoque'];
  const labels={dashboard:'Início',vendas:'Vendas',clientes:'Clientes',estoque:'Estoque'};
  const icons={
    dashboard:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    vendas:'<svg viewBox="0 0 24 24"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    clientes:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>',
    estoque:'<svg viewBox="0 0 24 24"><path d="m3 7 9 5 9-5-9-4-9 4Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></svg>',
    more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/></svg>'
  };
  const navButtons=()=>[...document.querySelectorAll('.nav button[data-page]')].filter(b=>getComputedStyle(b).display!=='none');
  const sourceFor=page=>document.querySelector(`.nav button[data-page="${page}"]`);
  const titleOf=btn=>String(btn?.textContent||btn?.dataset.page||'').replace(/\s+/g,' ').trim();
  function go(page){const btn=sourceFor(page);if(btn){btn.click();closeMore();setTimeout(syncActive,0)}}
  function ensureDock(){
    if(document.getElementById('emMobileDock'))return;
    const dock=document.createElement('nav');dock.id='emMobileDock';dock.setAttribute('aria-label','Navegação principal no celular');
    dock.innerHTML=core.map(p=>`<button type="button" data-em-page="${p}">${icons[p]}<span>${labels[p]}</span></button>`).join('')+`<button type="button" data-em-more>${icons.more}<span>Mais</span></button>`;
    document.body.appendChild(dock);
    dock.querySelectorAll('[data-em-page]').forEach(b=>b.onclick=()=>go(b.dataset.emPage));
    dock.querySelector('[data-em-more]').onclick=openMore;
  }
  function ensureMore(){
    if(document.getElementById('emMobileMore'))return;
    const wrap=document.createElement('div');wrap.id='emMobileMore';wrap.innerHTML='<div class="em-mobile-sheet"><div class="em-mobile-sheet-head"><span>Mais opções</span><button type="button" data-em-close aria-label="Fechar">×</button></div><div class="em-mobile-grid"></div></div>';
    document.body.appendChild(wrap);wrap.querySelector('[data-em-close]').onclick=closeMore;wrap.addEventListener('click',e=>{if(e.target===wrap)closeMore()});
  }
  function fillMore(){
    ensureMore();const grid=document.querySelector('#emMobileMore .em-mobile-grid');if(!grid)return;
    const extra=navButtons().filter(b=>!core.includes(b.dataset.page));
    let html=extra.map(b=>`<button type="button" data-em-extra="${b.dataset.page}">${titleOf(b)}</button>`).join('');
    const canInstall=typeof window.__EM_PWA_CAN_INSTALL__==='function'&&window.__EM_PWA_CAN_INSTALL__();
    if(canInstall) html+=`<button type="button" data-em-install-app style="background:#f6e8e3;border-color:#e5cfc7;color:#744d43;font-weight:800">Instalar aplicativo</button>`;
    grid.innerHTML=html||'<div style="padding:12px;font-size:11px;color:#8d7a74">Sem outras opções disponíveis.</div>';
    grid.querySelectorAll('[data-em-extra]').forEach(b=>b.onclick=()=>go(b.dataset.emExtra));
    grid.querySelector('[data-em-install-app]')?.addEventListener('click',()=>{closeMore();window.__EM_PWA_OPEN_INSTALL__?.();});
  }
  function openMore(){fillMore();document.getElementById('emMobileMore')?.classList.add('open')}
  function closeMore(){document.getElementById('emMobileMore')?.classList.remove('open')}
  function syncActive(){
    const active=document.querySelector('.nav button.active[data-page]')?.dataset.page||document.body.dataset.activePage||'';
    document.querySelectorAll('#emMobileDock [data-em-page]').forEach(b=>b.classList.toggle('active',b.dataset.emPage===active));
    const more=document.querySelector('#emMobileDock [data-em-more]');if(more)more.classList.toggle('active',!!active&&!core.includes(active));
  }
  function labelTables(root=document){
    root.querySelectorAll?.('table.table').forEach(table=>{const heads=[...table.querySelectorAll('thead th')].map(h=>h.textContent.trim());table.querySelectorAll('tbody tr').forEach(row=>[...row.children].forEach((td,i)=>{if(td.tagName==='TD'&&!td.dataset.label)td.dataset.label=heads[i]||''}))});
  }
  let queued=false;function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;if(mq.matches){document.body.classList.add('em-mobile-ready');ensureDock();ensureMore();labelTables();syncActive()}else{document.body.classList.remove('em-mobile-ready');closeMore()}})}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',e=>{if(e.target.closest?.('.nav button[data-page]'))setTimeout(refresh,0)},true);
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});
  mq.addEventListener?.('change',refresh);refresh();
})();
