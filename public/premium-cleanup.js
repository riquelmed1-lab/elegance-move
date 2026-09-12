(() => {
  const norm=(s='')=>String(s).trim().toLowerCase();
  const redundant=new Set(['faturamento líquido','lucro bruto (vendas)','lucro bruto vendas']);

  function cleanSecondary(){
    document.querySelectorAll('.premium-kpi-secondary > .metric').forEach(metric=>{
      const label=norm(metric.querySelector('small')?.textContent||'');
      metric.classList.toggle('premium-financial-duplicate',redundant.has(label));
    });
  }

  function refreshCloudStatusCopy(){
    const box=document.querySelector('.side-status');
    if(!box)return;
    const full=norm(box.textContent||'');
    if(!full.includes('base local ativa'))return;
    const title=box.querySelector('b');
    const desc=box.querySelector('p');
    if(title) title.textContent='Supabase online';
    if(desc) desc.textContent='Dados da loja sincronizados e protegidos na nuvem.';
  }

  let queued=false;
  function apply(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{
      queued=false;
      cleanSecondary();
      refreshCloudStatusCopy();
    });
  }

  document.addEventListener('DOMContentLoaded',apply,{once:true});
  const root=document.getElementById('content')||document.documentElement;
  new MutationObserver(apply).observe(root,{childList:true,subtree:true});
  apply();
})();
