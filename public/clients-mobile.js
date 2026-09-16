/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V4 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

  function ensureFinalStyle(){
    if(document.getElementById('em-client-stats-final-style')) return;
    const style=document.createElement('style');
    style.id='em-client-stats-final-style';
    style.textContent=`
      @media(max-width:760px){
        .em-client-detail-sheet .em-client-stats-final{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;margin:0 0 14px!important;box-sizing:border-box!important}
        .em-client-detail-sheet .em-client-stats-final-card{min-width:0!important;width:100%!important;box-sizing:border-box!important;border:1px solid rgba(150,99,85,.10)!important;border-radius:18px!important;background:#fff!important;padding:14px 12px!important;min-height:104px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;overflow:hidden!important;box-shadow:0 8px 22px rgba(81,54,47,.035)!important}
        .em-client-detail-sheet .em-client-stats-final-label{font-size:10px!important;line-height:1.25!important;font-weight:800!important;color:#78635c!important;margin:0 0 8px!important;white-space:normal!important}
        .em-client-detail-sheet .em-client-stats-final-value{font-size:22px!important;line-height:1!important;font-weight:850!important;letter-spacing:-.035em!important;color:#2e2421!important;white-space:normal!important;overflow-wrap:anywhere!important}
        .em-client-detail-sheet .em-client-stats-final-sub{font-size:8px!important;line-height:1.35!important;color:#9b8881!important;margin-top:7px!important;white-space:normal!important}
        .em-client-detail-sheet [data-em-original-stat="true"]{display:none!important}
      }
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

  const statDefs=[
    {key:'status',label:'Status',kind:'status',sub:'Relacionamento com a cliente'},
    {key:'total comprado',label:'Total comprado',kind:'money',sub:'Histórico de compras'},
    {key:'ja recebido',label:'Já recebido',kind:'money',sub:'Pagamentos confirmados'},
    {key:'saldo em aberto',label:'Saldo em aberto',kind:'money',sub:'A receber'}
  ];
  const statKeys=statDefs.map(x=>x.key);

  function statCount(el){
    const s=norm(txt(el));
    return statKeys.filter(k=>s.includes(k)).length;
  }

  function findLabelNode(modal,key){
    const candidates=[...modal.querySelectorAll('small,span,p,b,strong,div')].filter(el=>{
      const s=norm(txt(el));
      return (s===key||s.startsWith(key+' '))&&s.length<80;
    });
    return candidates.sort((a,b)=>a.children.length-b.children.length)[0]||null;
  }

  function findOriginalCard(modal,key){
    const leaf=findLabelNode(modal,key);
    if(!leaf) return null;
    let cur=leaf;
    let best=leaf.parentElement||leaf;
    for(let i=0;i<7&&cur?.parentElement&&cur.parentElement!==modal;i++){
      const parent=cur.parentElement;
      const count=statCount(parent);
      if(count>=2) break;
      best=parent;
      cur=parent;
    }
    return best;
  }

  function extractStat(modal,def){
    const card=findOriginalCard(modal,def.key);
    if(!card) return null;
    const raw=txt(card);
    let value='—';
    if(def.kind==='money'){
      const m=raw.match(/R\$\s*[\d.]+(?:,\d{2})?/i);
      if(m) value=m[0].replace(/\s+/g,' ');
    }else{
      const n=norm(raw);
      if(n.includes('inativo')) value='Inativo';
      else if(n.includes('ativo')) value='Ativo';
      else {
        const cleaned=raw.replace(/status/i,'').trim();
        value=cleaned.split(/\s{2,}|\n/)[0]||'Ativo';
      }
    }
    return {card,value};
  }

  function buildFinalStats(modal){
    ensureFinalStyle();
    if(modal.querySelector('.em-client-stats-final')) return true;
    const extracted=statDefs.map(def=>({def,data:extractStat(modal,def)}));
    if(extracted.some(x=>!x.data)) return false;

    const body=modal.querySelector('.modal-body')||modal;
    const grid=document.createElement('section');
    grid.className='em-client-stats-final';
    grid.setAttribute('aria-label','Resumo da cliente');

    extracted.forEach(({def,data})=>{
      data.card.dataset.emOriginalStat='true';
      const card=document.createElement('div');
      card.className='em-client-stats-final-card';
      const label=document.createElement('div');
      label.className='em-client-stats-final-label';
      label.textContent=def.label;
      const value=document.createElement('div');
      value.className='em-client-stats-final-value';
      value.textContent=data.value;
      const sub=document.createElement('div');
      sub.className='em-client-stats-final-sub';
      sub.textContent=def.sub;
      card.append(label,value,sub);
      grid.appendChild(card);
    });

    const info=[...body.querySelectorAll('.card,.status-box,div')].find(el=>{
      const s=norm(txt(el));
      return s.includes('whatsapp')&&s.includes('cidade')&&s.includes('origem');
    });
    if(info&&info.parentElement===body) body.insertBefore(grid,info);
    else body.prepend(grid);
    return true;
  }

  function decorateDetails(){
    let detailOpen=false;
    document.querySelectorAll('.modal').forEach(modal=>{
      const t=norm(txt(modal));
      const isDetail=t.includes('compras')&&t.includes('whatsapp')&&statKeys.filter(k=>t.includes(k)).length>=2;
      modal.classList.toggle('em-client-detail-sheet',isDetail);
      if(!isDetail) return;
      detailOpen=true;
      buildFinalStats(modal);

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
