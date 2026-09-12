(() => {
  const icons={
    revenue:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h15a3 3 0 0 1 3 3v8H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h13v4"/><path d="M16 11h5v4h-5a2 2 0 1 1 0-4Z"/></svg>',
    clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
    trend:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 17 6-6 4 4 7-8"/><path d="M15 7h5v5"/></svg>',
    expense:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>',
    box:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 9 5 9-5-9-4-9 4Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></svg>',
    bag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    users:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>',
    tag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 13 13 20 4 11V4h7l9 9Z"/><circle cx="8.5" cy="8.5" r="1.2"/></svg>',
    chart:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V9M10 19V5M16 19v-7M22 19H2"/></svg>'
  };
  const navIcons={
    dashboard:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    clientes:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M17 5a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v2"/></svg>',
    vendas:'<svg viewBox="0 0 24 24"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    orcamentos:'<svg viewBox="0 0 24 24"><path d="M5 3h14v18H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    receber:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/></svg>',
    estoque:'<svg viewBox="0 0 24 24"><path d="m3 7 9 5 9-5-9-4-9 4Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></svg>',
    entradas:'<svg viewBox="0 0 24 24"><path d="M12 3v12M7 10l5 5 5-5"/><path d="M4 20h16"/></svg>',
    caixa:'<svg viewBox="0 0 24 24"><path d="M3 7h18v12H3z"/><path d="M7 11h5M16 11h2"/></svg>',
    sistema:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1a7 7 0 0 0-1.8-1L14.4 3h-4.8l-.4 3.1a7 7 0 0 0-1.8 1L5 6.1 3 9.5 5 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7 7 0 0 0 1.8 1l.4 3.1h4.8l.4-3.1a7 7 0 0 0 1.8-1l2.4 1 2-3.4L18.9 13a7 7 0 0 0 .1-1Z"/></svg>'
  };
  const sparkPaths=['M1 28 C10 27 14 20 22 22 S34 31 43 19 S55 23 63 13 S75 18 88 7','M1 27 C11 18 18 27 29 19 S42 21 49 12 S63 26 72 15 S81 10 88 8','M1 28 C10 24 17 25 24 17 S36 29 46 18 S61 15 70 20 S80 13 88 8','M1 26 C12 30 20 20 28 22 S40 11 49 18 S63 21 72 11 S81 9 88 5'];

  function norm(s=''){return String(s).trim().toLowerCase()}
  function iconForMetric(label=''){
    const t=norm(label);
    if(t.includes('clientes')) return icons.users;
    if(t.includes('ticket')) return icons.tag;
    if(t.includes('pedido')) return icons.bag;
    if(t.includes('recebido')) return icons.wallet;
    if(t.includes('a receber')||t.includes('aberto')) return icons.clock;
    if(t.includes('lucro')) return icons.trend;
    if(t.includes('despesa')) return icons.expense;
    if(t.includes('estoque')) return icons.box;
    if(t.includes('compras')||t.includes('investido')) return icons.bag;
    if(t.includes('faturamento')||t.includes('receita')) return icons.revenue;
    return icons.chart;
  }
  function decorateNav(){
    document.querySelectorAll('.nav button[data-page]').forEach(btn=>{
      const ico=btn.querySelector('.nav-ico'),svg=navIcons[btn.dataset.page];
      if(ico&&svg&&!ico.dataset.premiumIcon){ico.innerHTML=svg;ico.dataset.premiumIcon='1'}
    });
  }
  function decorateMetrics(root=document){
    [...root.querySelectorAll('.metric')].forEach((metric,index)=>{
      const label=metric.querySelector('small')?.textContent?.trim()||'';
      if(!metric.querySelector('.premium-metric-icon')){
        const span=document.createElement('span');span.className='premium-metric-icon';span.innerHTML=iconForMetric(label);metric.prepend(span);
      }
      if(!metric.querySelector('.premium-sparkline') && metric.closest('.kpi-grid')){
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('class','premium-sparkline');svg.setAttribute('viewBox','0 0 90 32');svg.setAttribute('aria-hidden','true');
        const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d',sparkPaths[index%sparkPaths.length]);svg.appendChild(path);metric.appendChild(svg);
      }
      if(norm(label).includes('lucro líquido')) metric.classList.add('premium-profit');
    });
  }
  function ensureSidebarStory(){
    const sidebar=document.querySelector('.sidebar'),nav=sidebar?.querySelector('.nav');
    if(!sidebar||!nav||sidebar.querySelector('.premium-side-story'))return;
    const box=document.createElement('div');box.className='premium-side-story';box.innerHTML='<div class="premium-side-story-copy"><strong>Moda que<br>move mulheres</strong><span></span><p>Mais que moda,<br>realizamos momentos.</p></div>';
    nav.insertAdjacentElement('afterend',box);
  }
  function ensureMotto(){
    const top=document.querySelector('.topbar .top-actions');if(!top||document.querySelector('.premium-motto'))return;
    const m=document.createElement('div');m.className='premium-motto';m.textContent='Elegância em cada conquista · ♡';top.insertAdjacentElement('beforebegin',m);
  }
  function ensureBrandCard(dash){
    if(dash.querySelector('.premium-brand-card'))return;
    const card=document.createElement('aside');card.className='premium-brand-card';card.innerHTML='<div class="premium-brand-overlay"><div class="premium-brand-logo">ELEGANCE<br><span>MOVE</span></div><i></i><h3>Moda que inspira, mulheres que realizam.</h3><p>Beleza, confiança, estilo e liberdade em movimento.</p><span class="premium-brand-chip">Elegância em movimento</span></div>';
    dash.appendChild(card);
  }
  function parseMoney(text=''){
    const clean=String(text).replace(/[^0-9,.-]/g,'').replace(/\./g,'').replace(',','.');const n=Number(clean);return Number.isFinite(n)?n:0;
  }
  function enhanceCategoryCard(card){
    if(!card||card.dataset.premiumDonut==='1')return;
    const stack=card.querySelector('.list-stack'),rows=[...(stack?.querySelectorAll('.list-row')||[])];
    if(!stack||!rows.length)return;
    const items=rows.map(r=>({name:r.querySelector('.list-row-main b')?.textContent?.trim()||'Categoria',value:parseMoney(r.querySelector('.list-row-value')?.textContent)}));
    const total=items.reduce((a,b)=>a+b.value,0);if(total<=0)return;
    let cursor=0;const tones=['#a96856','#c88774','#dda896','#edd0c5','#f1dfd8','#f6ebe7'];
    const stops=items.map((item,i)=>{const start=cursor,end=cursor+(item.value/total)*100;cursor=end;return `${tones[i%tones.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`}).join(',');
    const wrap=document.createElement('div');wrap.className='premium-donut-layout';
    wrap.innerHTML=`<div class="premium-donut" style="--donut:${stops}"><div><small>Total</small><b>${new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0}).format(total)}</b></div></div><div class="premium-donut-legend">${items.map((item,i)=>`<div><span style="--dot:${tones[i%tones.length]}"></span><b>${item.name}</b><em>${Math.round(item.value/total*100)}%</em></div>`).join('')}</div>`;
    stack.classList.add('premium-original-list');stack.insertAdjacentElement('afterend',wrap);card.dataset.premiumDonut='1';
  }
  function enhanceTopClients(card){
    if(!card||card.dataset.premiumClients==='1')return;
    [...card.querySelectorAll('.list-row')].forEach((row,i)=>{
      const main=row.querySelector('.list-row-main');if(!main)return;
      const b=main.querySelector('b');if(b)b.textContent=b.textContent.replace(/^\d+º\s*·\s*/, '');
      const rank=document.createElement('span');rank.className='premium-rank';rank.textContent=String(i+1);row.prepend(rank);
      const avatar=document.createElement('span');avatar.className='premium-client-avatar';avatar.textContent=(b?.textContent||'C').trim().slice(0,1).toUpperCase();main.prepend(avatar);
    });card.dataset.premiumClients='1';
  }
  function enhanceProducts(card){
    if(!card||card.dataset.premiumProducts==='1')return;
    [...card.querySelectorAll('.list-row')].forEach(row=>{
      const thumb=document.createElement('span');thumb.className='premium-product-thumb';thumb.innerHTML='<svg viewBox="0 0 24 24"><path d="M9 4 7 7 3 9l2 5v6h14v-6l2-5-4-2-2-3-3 2-3-2Z"/></svg>';row.prepend(thumb);
    });card.dataset.premiumProducts='1';
  }
  function enhanceLowerCards(lower){
    if(!lower)return;
    const cards=[...lower.children];
    const find=t=>cards.find(c=>norm(c.querySelector('h2')?.textContent).includes(t));
    const ordered=[find('vendas por categoria'),find('top 3 clientes'),find('produtos mais vendidos'),find('últimos pedidos')||find('contas a receber'),find('estoque baixo')].filter(Boolean);
    const same=ordered.every((c,i)=>lower.children[i]===c);
    if(!same) ordered.forEach(c=>lower.appendChild(c));
    enhanceCategoryCard(find('vendas por categoria'));enhanceTopClients(find('top 3 clientes'));enhanceProducts(find('produtos mais vendidos'));
    ordered.forEach((c,i)=>c.classList.add('premium-lower-card',`premium-lower-${i+1}`));
  }
  function organizeDashboard(){
    const content=document.getElementById('content');if(!content)return;
    const active=document.querySelector('.nav button.active[data-page]')?.dataset?.page||'';document.body.dataset.activePage=active;
    content.classList.toggle('premium-dashboard',active==='dashboard');if(active!=='dashboard')return;
    const dash=content.querySelector('.dash-layout'),kpi=dash?.querySelector('.kpi-grid');if(!dash||!kpi)return;
    decorateMetrics(content);
    const metrics=[...kpi.querySelectorAll(':scope > .metric')];
    const choose=labels=>labels.map(l=>metrics.find(m=>norm(m.querySelector('small')?.textContent)===l)).filter(Boolean);
    let primary=choose(['faturamento do mês','recebido','a receber','lucro líquido do mês']);
    if(primary.length<4)primary=choose(['faturamento do mês','clientes ativos','ticket médio','novos pedidos']);
    metrics.forEach(m=>{if(primary.length<4&&!primary.includes(m))primary.push(m)});
    const desired=primary.slice(0,4),current=[...kpi.children].filter(x=>x.classList.contains('metric'));
    if(!(desired.length===current.length&&desired.every((m,i)=>current[i]===m)))desired.forEach(m=>kpi.appendChild(m));
    let secondary=content.querySelector('.premium-kpi-secondary');
    if(!secondary){secondary=document.createElement('div');secondary.className='premium-kpi-secondary';dash.insertAdjacentElement('afterend',secondary)}
    metrics.filter(m=>!desired.includes(m)).forEach(m=>{if(m.parentElement!==secondary)secondary.appendChild(m)});
    ensureBrandCard(dash);enhanceLowerCards(content.querySelector('.dashboard-lower'));
    const ph=content.querySelector('.page-head h1');if(ph&&ph.textContent!=='Dashboard')ph.textContent='Dashboard';
    const pp=content.querySelector('.page-head p');if(pp)pp.textContent='Bem-vinda de volta! Aqui está um resumo da sua boutique hoje.';
  }
  function refineTopbar(){
    const userbox=document.querySelector('.userbox');if(userbox&&!userbox.querySelector('.premium-user-chevron')){const s=document.createElement('span');s.className='premium-user-chevron';s.textContent='⌄';userbox.appendChild(s)}
    ensureMotto();
  }
  let scheduled=false;
  function apply(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;decorateNav();ensureSidebarStory();refineTopbar();organizeDashboard()})}
  document.addEventListener('DOMContentLoaded',()=>{
    const content=document.getElementById('content'),nav=document.getElementById('desktopNav');
    if(content)new MutationObserver(apply).observe(content,{childList:true});
    if(nav)new MutationObserver(apply).observe(nav,{childList:true});
    apply();
  },{once:true});
  apply();
})();