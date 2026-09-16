/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V1 */
/* ELEGANCE_MOVE_CLIENTS_MOBILE_RUNTIME_V8 */
(() => {
  const root=document.documentElement;
  let scheduled=false;
  const content=()=>document.getElementById('content')||document.querySelector('.content');
  const txt=el=>String(el?.textContent||'').replace(/\s+/g,' ').trim();
  const norm=v=>String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const visible=el=>{if(!el||!el.isConnected)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;};
  const mobile=()=>window.matchMedia('(max-width:760px)').matches||/android|iphone|ipad|ipod/i.test(navigator.userAgent);

  function ensureDetailStyle(){
    if(document.getElementById('em-client-detail-v8-style')) return;
    const style=document.createElement('style');
    style.id='em-client-detail-v8-style';
    style.textContent=`
      @media(max-width:760px){
        html.em-client-detail-open #emMobileDock{display:none!important}
        .em-client-detail-v8{max-width:100%!important;overflow-x:hidden!important;box-sizing:border-box!important}
        .em-client-summary-v8{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px!important;width:100%!important;max-width:100%!important;min-width:0!important;margin:0 0 14px!important;box-sizing:border-box!important}
        .em-client-stat-v8{min-width:0!important;width:100%!important;box-sizing:border-box!important;border:1px solid rgba(150,99,85,.10)!important;border-radius:18px!important;background:#fff!important;padding:13px 12px!important;min-height:104px!important;display:flex!important;flex-direction:column!important;justify-content:center!important;align-items:flex-start!important;overflow:hidden!important;box-shadow:0 8px 22px rgba(81,54,47,.035)!important}
        .em-client-stat-v8-label{font-size:9px!important;line-height:1.2!important;font-weight:800!important;color:#806c65!important;margin:0 0 7px!important;white-space:normal!important}
        .em-client-stat-v8-value{font-size:20px!important;line-height:1!important;font-weight:850!important;letter-spacing:-.035em!important;color:#2e2421!important;white-space:normal!important;overflow-wrap:anywhere!important}
        .em-client-stat-v8-sub{font-size:8px!important;line-height:1.3!important;color:#9a8882!important;margin-top:7px!important;white-space:normal!important}
        [data-em-client-stat-hidden="true"]{display:none!important}
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
    {id:'status',label:'Status',sub:'Relacionamento com a cliente',match:s=>s.includes('status'),value:s=>s.includes('inativo')?'Inativo':s.includes('ativo')?'Ativo':'Ativo'},
    {id:'total',label:'Total comprado',sub:'Histórico de compras',match:s=>s.includes('total')&&(s.includes('compr')||s.includes('gasto'))},
    {id:'received',label:'Já recebido',sub:'Pagamentos confirmados',match:s=>(s.includes('ja receb')||s.includes('recebido'))&&!s.includes('saldo')},
    {id:'balance',label:'Saldo em aberto',sub:'A receber',match:s=>s.includes('saldo')&&(s.includes('abert')||s.includes('receb'))}
  ];

  function findDetail(){
    const overlays=[...document.querySelectorAll('.modal-back,.modal,[role="dialog"]')].filter(visible);
    const matches=overlays.filter(el=>{const s=norm(txt(el));return s.includes('whatsapp')&&s.includes('compras');});
    if(!matches.length) return null;
    matches.sort((a,b)=>{
      const am=a.matches('.modal,[role="dialog"]')?0:1;
      const bm=b.matches('.modal,[role="dialog"]')?0:1;
      if(am!==bm) return am-bm;
      const ar=a.getBoundingClientRect(),br=b.getBoundingClientRect();
      return ar.width*ar.height-br.width*br.height;
    });
    const pick=matches[0];
    return pick.classList.contains('modal-back')?(pick.querySelector('.modal')||pick):pick;
  }

  function findLabelNode(detail,def){
    const nodes=[...detail.querySelectorAll('small,span,p,b,strong,div')]
      .filter(el=>!el.closest('.em-client-summary-v8'))
      .filter(visible)
      .filter(el=>def.match(norm(txt(el))))
      .filter(el=>txt(el).length<120);
    nodes.sort((a,b)=>a.children.length-b.children.length||txt(a).length-txt(b).length);
    return nodes[0]||null;
  }

  function belongsToOtherDef(el,current){
    const s=norm(txt(el));
    return defs.some(d=>d!==current&&d.match(s));
  }

  function cardFromLabel(detail,label,def){
    let cur=label;
    let best=label.parentElement||label;
    for(let i=0;i<7&&cur?.parentElement&&cur.parentElement!==detail;i++){
      const parent=cur.parentElement;
      if(belongsToOtherDef(parent,def)) break;
      best=parent;
      cur=parent;
    }
    return best;
  }

  function moneyValue(card){
    const m=txt(card).match(/R\$\s*[\d.]+(?:,\d{2})?/i);
    return m?m[0].replace(/\s+/g,' '):'R$ 0,00';
  }

  function commonParent(cards){
    if(!cards.length) return null;
    let cur=cards[0].parentElement;
    while(cur){
      if(cards.every(c=>cur.contains(c))) return cur;
      cur=cur.parentElement;
    }
    return null;
  }

  function buildDetailSummary(detail){
    ensureDetailStyle();
    if(detail.querySelector('.em-client-summary-v8')) return true;

    const items=[];
    for(const def of defs){
      const label=findLabelNode(detail,def);
      if(!label) return false;
      const card=cardFromLabel(detail,label,def);
      if(!card) return false;
      const raw=norm(txt(card));
      const value=def.id==='status'?def.value(raw):moneyValue(card);
      items.push({def,card,value});
    }
    const cards=items.map(x=>x.card);
    if(new Set(cards).size!==4) return false;

    const grid=document.createElement('section');
    grid.className='em-client-summary-v8';
    grid.setAttribute('aria-label','Resumo da cliente');
    for(const {def,value} of items){
      const card=document.createElement('div');card.className='em-client-stat-v8';
      const label=document.createElement('div');label.className='em-client-stat-v8-label';label.textContent=def.label;
      const val=document.createElement('div');val.className='em-client-stat-v8-value';val.textContent=value;
      const sub=document.createElement('div');sub.className='em-client-stat-v8-sub';sub.textContent=def.sub;
      card.append(label,val,sub);grid.appendChild(card);
    }

    const body=detail.querySelector('.modal-body')||detail;
    const parent=commonParent(cards);
    if(parent&&parent!==detail&&parent!==body){
      const s=norm(txt(parent));
      const matches=defs.filter(d=>d.match(s)).length;
      if(matches>=3&&s.length<650) parent.dataset.emClientStatHidden='true';
      else cards.forEach(c=>c.dataset.emClientStatHidden='true');
    }else cards.forEach(c=>c.dataset.emClientStatHidden='true');

    const info=[...body.querySelectorAll('div,.card,.status-box')].find(el=>{
      const s=norm(txt(el));return s.includes('whatsapp')&&s.includes('cidade')&&s.includes('origem')&&s.length<550;
    });
    if(info&&info.parentElement===body) body.insertBefore(grid,info);
    else {
      const firstVisible=[...body.children].find(ch=>visible(ch)&&!ch.matches('.modal-head'));
      if(firstVisible) body.insertBefore(grid,firstVisible); else body.prepend(grid);
    }
    return true;
  }

  function decorateDetails(){
    if(!mobile()){root.classList.remove('em-client-detail-open');return;}
    const detail=findDetail();
    root.classList.toggle('em-client-detail-open',!!detail);
    if(!detail) return;
    detail.classList.add('em-client-detail-v8');
    detail.style.setProperty('max-width','100%','important');
    detail.style.setProperty('overflow-x','hidden','important');
    buildDetailSummary(detail);
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
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('pageshow',refresh);
  window.addEventListener('resize',refresh,{passive:true});
  refresh();
})();
