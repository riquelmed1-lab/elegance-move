(() => {
  const norm=(s='')=>String(s).trim().toLowerCase();
  function dashboardContent(){
    const candidates=[document.getElementById('content'),...document.querySelectorAll('.content')].filter(Boolean);
    return candidates.find(el=>el.querySelector('.dash-layout'))||null;
  }
  function getLabel(metric){return norm(metric.querySelector('small')?.textContent||'')}
  function ensureDashboardClass(content){
    if(!content)return false;
    const hasDash=!!content.querySelector('.dash-layout');
    content.classList.toggle('premium-dashboard',hasDash);
    document.body.dataset.activePage=hasDash?'dashboard':(document.querySelector('.nav button.active[data-page]')?.dataset?.page||'');
    return hasDash;
  }
  function ensureBrandCard(dash){
    if(!dash||dash.querySelector('.premium-brand-card'))return;
    const card=document.createElement('aside');
    card.className='premium-brand-card';
    card.innerHTML='<div class="premium-brand-overlay"><div class="premium-brand-logo">ELEGANCE<br><span>MOVE</span></div><i></i><h3>Moda que inspira, mulheres que realizam.</h3><p>Beleza, confiança, estilo e liberdade em movimento.</p><span class="premium-brand-chip">Elegância em movimento</span></div>';
    dash.appendChild(card);
  }
  function organizeMetrics(content){
    const dash=content?.querySelector('.dash-layout');
    const kpi=dash?.querySelector('.kpi-grid');
    if(!dash||!kpi)return;
    let secondary=content.querySelector('.premium-kpi-secondary');
    if(!secondary){secondary=document.createElement('div');secondary.className='premium-kpi-secondary';dash.insertAdjacentElement('afterend',secondary)}
    const metrics=[...kpi.querySelectorAll(':scope > .metric'),...secondary.querySelectorAll(':scope > .metric')];
    const preferred=['faturamento do mês','recebido','a receber','lucro líquido do mês'];
    const fallback=['faturamento do mês','clientes ativos','ticket médio','novos pedidos'];
    const select=labels=>labels.map(l=>metrics.find(m=>getLabel(m)===l)).filter(Boolean);
    let primary=select(preferred);
    if(primary.length<4)primary=select(fallback);
    for(const m of metrics){if(primary.length>=4)break;if(!primary.includes(m))primary.push(m)}
    primary=primary.slice(0,4);
    for(const m of primary){if(m.parentElement!==kpi)kpi.appendChild(m)}
    for(const m of metrics){if(!primary.includes(m)&&m.parentElement!==secondary)secondary.appendChild(m)}
    ensureBrandCard(dash);
  }
  function sanitizeMetricSvg(content){
    content?.querySelectorAll('.premium-metric-icon svg').forEach(svg=>{
      svg.setAttribute('width','17');svg.setAttribute('height','17');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
      svg.style.cssText='display:block!important;width:17px!important;height:17px!important;max-width:17px!important;max-height:17px!important;fill:none!important;stroke:currentColor!important;overflow:visible!important';
      svg.querySelectorAll('*').forEach(el=>{el.style.fill='none';el.style.stroke='currentColor';});
    });
    content?.querySelectorAll('.premium-sparkline').forEach(svg=>{
      svg.setAttribute('width','92');svg.setAttribute('height','34');svg.setAttribute('preserveAspectRatio','none');
      svg.style.cssText='position:absolute!important;right:12px!important;bottom:9px!important;width:92px!important;height:34px!important;max-width:92px!important;max-height:34px!important;fill:none!important;overflow:visible!important';
      svg.querySelectorAll('path').forEach(p=>{p.style.fill='none';p.style.stroke='#b87967';p.style.strokeWidth='1.35';});
    });
  }
  let raf=0;
  function repair(){
    if(raf)return;
    raf=requestAnimationFrame(()=>{
      raf=0;
      const content=dashboardContent();
      if(!ensureDashboardClass(content))return;
      organizeMetrics(content);
      sanitizeMetricSvg(content);
    });
  }
  document.addEventListener('DOMContentLoaded',repair,{once:true});
  const observer=new MutationObserver(repair);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  repair();
})();
