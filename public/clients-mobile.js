/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V5 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=(el)=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=(v)=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=(el)=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};

  function ensureDetailStyle(){
    if(document.getElementById('em-client-detail-v5-style')) return;
    const style=document.createElement('style');
    style.id='em-client-detail-v5-style';
    style.textContent=`
      @media(max-width:760px){
        html.em-client-detail-open #emMobileDock{display:none!important}
        .em-client-detail-sheet{box-sizing:border-box!important;max-width:100%!important;overflow-x:hidden!important}
        .em-client-stats-v5{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:100%!important;margin:0 0 16px!important;box-sizing:border-box!important}
        .em-client-stat-v5{min-width:0!important;width:100%!important;box-sizing:border-box!important;border:1px solid rgba(150,99,85,.11)!important;border-radius:18px!important;background:#fff!important;padding:14px 13px!important;min-height:108px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;overflow:hidden!important;box-shadow:0 8px 22px rgba(81,54,47,.035)!important}
        .em-client-stat-v5-label{font-size:10px!important;line-height:1.2!important;font-weight:800!important;color:#78635c!important;margin-bottom:8px!important;white-space:normal!important}
        .em-client-stat-v5-value{font-size:21px!important;line-height:1!important;font-weight:850!important;letter-spacing:-.035em!important;color:#2e2421!important;max-width:100%!important;white-space:normal!important;overflow-wrap:anywhere!important}
        .em-client-stat-v5-sub{font-size:8px!important;line-height:1.3!important;color:#9b8881!important;margin-top:7px!important;white-space:normal!important}
        [data-em-client-original-summary="true"]{display:none!important}
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

  const defs=[
    {key:'status',label:'Status',kind:'status',sub:'Relacionamento com a cliente'},
    {key:'total comprado',label:'Total comprado',kind:'money',sub:'Histórico de compras'},
    {key:'ja recebido',label:'Já recebido',kind:'money',sub:'Pagamentos confirmados'},
    {key:'saldo em aberto',label:'Saldo em aberto',kind:'money',sub:'A receber'}
  ];
  const keys=defs.map(d=>d.key);
  const keyCount=(el)=>{const s=norm(txt(el));return keys.filter(k=>s.includes(k)).length;};

  function findDetailRoot(){
    const headings=[...document.querySelectorAll('h1,h2,h3,h4,strong,div,span')].filter(el=>visible(el)&&norm(txt(el))==='compras');
    for(const heading of headings){
      let cur=heading.parentElement;
      for(let i=0;i<10&&cur&&cur!==document.body&&cur!==document.documentElement;i++,cur=cur.parentElement){
        const s=norm(txt(cur));
        if(s.includes('whatsapp')&&s.includes('compras')&&keys.filter(k=>s.includes(k)).length>=2) return cur;
      }
    }
    return null;
  }

  function findLabel(scope,key){
    return [...scope.querySelectorAll('small,span,p,b,strong,div')]
      .filter(el=>!el.closest('.em-client-stats-v5'))
      .filter(el=>{const s=norm(txt(el));return (s===key||s.startsWith(key+' '))&&s.length<100;})
      .sort((a,b)=>a.children.length-b.children.length)[0]||null;
  }

  function commonAncestor(nodes,limit){
    let cur=nodes[0]?.parentElement||null;
    while(cur&&cur!==limit&&cur!==document.body){
      if(nodes.every(n=>cur.contains(n))) return cur;
      cur=cur.parentElement;
    }
    return null;
  }

  function directChildContaining(parent,node){
    let cur=node;
    while(cur?.parentElement&&cur.parentElement!==parent) cur=cur.parentElement;
    return cur?.parentElement===parent?cur:null;
  }

  function valueFromCard(card,def){
    const raw=txt(card);
    if(def.kind==='money'){
      const m=raw.match(/R\$\s*[\d.]+(?:,\d{2})?/i);
      return m?m[0].replace(/\s+/g,' '):'R$ 0,00';
    }
    const n=norm(raw);
    if(n.includes('inativo')) return 'Inativo';
    if(n.includes('ativo')) return 'Ativo';
    return 'Ativo';
  }

  function rebuildSummary(detail){
    ensureDetailStyle();
    if(detail.querySelector('.em-client-stats-v5')) return true;
    const labels=defs.map(d=>findLabel(detail,d.key));
    if(labels.some(x=>!x)) return false;

    let summary=commonAncestor(labels,detail);
    if(!summary||summary===detail) return false;
    while(summary.parentElement&&summary.parentElement!==detail&&keyCount(summary.parentElement)===4&&norm(txt(summary.parentElement)).includes('whatsapp')===false){
      const p=summary.parentElement;
      if(p.children.length>6) break;
      summary=p;
    }

    const cards=labels.map(label=>directChildContaining(summary,label));
    if(cards.some(x=>!x)||new Set(cards).size<4) return false;

    const values=cards.map((card,i)=>valueFromCard(card,defs[i]));
    const grid=document.createElement('section');
    grid.className='em-client-stats-v5';
    grid.setAttribute('aria-label','Resumo da cliente');
    defs.forEach((def,i)=>{
      const card=document.createElement('div');card.className='em-client-stat-v5';
      const label=document.createElement('div');label.className='em-client-stat-v5-label';label.textContent=def.label;
      const value=document.createElement('div');value.className='em-client-stat-v5-value';value.textContent=values[i];
      const sub=document.createElement('div');sub.className='em-client-stat-v5-sub';sub.textContent=def.sub;
      card.append(label,value,sub);grid.appendChild(card);
    });
    summary.dataset.emClientOriginalSummary='true';
    summary.parentElement.insertBefore(grid,summary);
    return true;
  }

  function decorateDetails(){
    const detail=findDetailRoot();
    const open=!!detail;
    root.classList.toggle('em-client-detail-open',open);
    if(!detail) return;

    detail.classList.add('em-client-detail-sheet');
    const shell=detail.closest('.modal')||detail.closest('.modal-back')||detail;
    shell.classList.add('em-client-detail-sheet');
    rebuildSummary(detail);

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
  refresh();
})();
