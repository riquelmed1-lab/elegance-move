/* ELEGANCE_MOVE_CLIENT_DETAIL_FORCE_RUNTIME_V1 */
(() => {
  const root=document.documentElement;
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  let queued=false;

  function visible(el){
    if(!el) return false;
    const s=getComputedStyle(el);
    return s.display!=='none'&&s.visibility!=='hidden'&&el.getClientRects().length>0;
  }

  function cardForLabel(modal,label){
    const key=norm(label);
    const nodes=[...modal.querySelectorAll('small,b,strong,span,div,p')];
    const labelNode=nodes.find(n=>norm(txt(n))===key || norm(txt(n)).startsWith(key));
    if(!labelNode) return null;
    let node=labelNode;
    for(let i=0;i<5&&node&&node!==modal;i++,node=node.parentElement){
      const t=norm(txt(node));
      if(t.includes(key) && (node.classList.contains('metric')||node.classList.contains('card')||node.children.length<=5)) return node;
    }
    return labelNode.parentElement;
  }

  function apply(){
    root.classList.remove('em-client-detail-force-open');
    document.querySelectorAll('.em-client-detail-force-back').forEach(el=>el.classList.remove('em-client-detail-force-back'));
    document.querySelectorAll('.em-client-detail-force-sheet').forEach(el=>el.classList.remove('em-client-detail-force-sheet'));

    const backs=[...document.querySelectorAll('.modal-back')].filter(visible);
    const back=backs.find(el=>{const t=norm(txt(el));return t.includes('whatsapp')&&t.includes('compras')&&(t.includes('total comprado')||t.includes('saldo em aberto')||t.includes('ja recebido'));});
    if(!back) return;
    const modal=back.querySelector('.modal')||back.firstElementChild;
    if(!modal) return;

    root.classList.add('em-client-detail-force-open');
    back.classList.add('em-client-detail-force-back');
    modal.classList.add('em-client-detail-force-sheet');

    const labels=['status','total comprado','ja recebido','saldo em aberto'];
    const cards=labels.map(l=>cardForLabel(modal,l)).filter(Boolean);
    const unique=[...new Set(cards)];
    if(unique.length>=3){
      let parent=unique[0].parentElement;
      if(!unique.every(c=>c.parentElement===parent)){
        const candidates=[...modal.querySelectorAll('div,section')];
        parent=candidates.find(el=>unique.every(c=>el.contains(c))&&el!==modal)||parent;
      }
      if(parent){
        parent.classList.add('em-client-detail-force-grid');
        unique.forEach(c=>c.classList.add('em-client-detail-force-card'));
      }
    }

    [...modal.querySelectorAll('.card,.status-box,div')].forEach(el=>{
      const t=norm(txt(el));
      if(t.includes('whatsapp')&&t.includes('cidade')&&t.includes('origem')&&t.length<500) el.classList.add('em-client-detail-force-info');
    });
    [...modal.querySelectorAll('h1,h2,h3')].forEach(h=>{if(norm(txt(h))==='compras')h.classList.add('em-client-detail-force-title');});
  }

  function refresh(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});}
  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  document.addEventListener('click',()=>setTimeout(refresh,30),true);
  new MutationObserver(refresh).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class','style']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
