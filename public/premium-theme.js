(() => {
  const icons={
    revenue:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
    wallet:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 7h15a3 3 0 0 1 3 3v8H5a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3h13v4"/><path d="M16 11h5v4h-5a2 2 0 1 1 0-4Z"/></svg>',
    clock:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/></svg>',
    trend:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 17 6-6 4 4 7-8"/><path d="M15 7h5v5"/></svg>',
    expense:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6"/></svg>',
    box:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 7 9 5 9-5-9-4-9 4Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10"/></svg>',
    bag:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
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
  function iconForMetric(label=''){
    const t=label.toLowerCase();
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
      if(ico&&svg&&!ico.dataset.premiumIcon){ico.innerHTML=svg;ico.dataset.premiumIcon='1';}
    });
    document.querySelectorAll('.nav-ico svg').forEach(svg=>{svg.style.cssText='width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round'});
  }
  function decorateMetrics(root=document){
    root.querySelectorAll('.metric').forEach(metric=>{
      const label=metric.querySelector('small')?.textContent?.trim()||'';
      if(!metric.querySelector('.premium-metric-icon')){const span=document.createElement('span');span.className='premium-metric-icon';span.innerHTML=iconForMetric(label);metric.prepend(span)}
      if(label.toLowerCase().includes('lucro líquido')) metric.classList.add('premium-profit');
    });
  }
  function ensureBrandCard(dash){
    if(dash.querySelector('.premium-brand-card')) return;
    const card=document.createElement('aside');card.className='premium-brand-card';card.innerHTML='<div class="premium-brand-mark">EM</div><h3>Moda que move mulheres.</h3><p>Beleza, confiança e estilo caminham juntos. Uma gestão mais clara para fazer a Elegance Move crescer com leveza.</p><span class="premium-brand-chip">Elegância em movimento</span>';dash.appendChild(card);
  }
  function organizeDashboard(){
    const content=document.getElementById('content');if(!content)return;
    const active=document.querySelector('.nav button.active[data-page]')?.dataset?.page||'';document.body.dataset.activePage=active;content.classList.toggle('premium-dashboard',active==='dashboard');if(active!=='dashboard')return;
    const dash=content.querySelector('.dash-layout'),kpi=dash?.querySelector('.kpi-grid');if(!dash||!kpi)return;
    decorateMetrics(content);
    const metrics=[...kpi.querySelectorAll(':scope > .metric')];
    const pick=(needle)=>metrics.find(m=>(m.querySelector('small')?.textContent||'').trim().toLowerCase()===needle);
    const primary=[pick('faturamento do mês'),pick('recebido'),pick('a receber'),pick('lucro líquido do mês')].filter(Boolean);
    if(primary.length<4)metrics.forEach(m=>{if(primary.length<4&&!primary.includes(m))primary.push(m)});
    primary.forEach(m=>kpi.appendChild(m));
    let secondary=content.querySelector('.premium-kpi-secondary');if(!secondary){secondary=document.createElement('div');secondary.className='premium-kpi-secondary';dash.insertAdjacentElement('afterend',secondary)}
    metrics.filter(m=>!primary.includes(m)).forEach(m=>secondary.appendChild(m));
    ensureBrandCard(dash);
  }
  function refineTopbar(){const userbox=document.querySelector('.userbox');if(userbox&&!userbox.querySelector('.premium-user-chevron')){const span=document.createElement('span');span.className='premium-user-chevron';span.textContent='⌄';span.style.cssText='font-size:12px;color:#8d7973;margin-left:2px';userbox.appendChild(span)}}
  let queued=false;function apply(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorateNav();decorateMetrics();organizeDashboard();refineTopbar()})}
  const observer=new MutationObserver(apply);observer.observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('DOMContentLoaded',apply,{once:true});apply();
})();
