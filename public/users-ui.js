(() => {
  const esc = (v) => String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const ROLE_LABEL = { admin:'Administrador', manager:'Gerente', seller:'Vendedor' };
  const ROLE_DESC = {
    admin:'Acesso completo, inclusive usuários, financeiro e configurações.',
    manager:'Operação da loja, estoque, entradas, caixa, vendas e relatórios. Não gerencia usuários.',
    seller:'Clientes, orçamentos e vendas. Sem custos, lucro, entradas, caixa ou configurações.'
  };

  const api = async (body) => {
    const options = body ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : { cache:'no-store' };
    const response = await fetch('/api/users', options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Falha na gestão de usuários'), { status:response.status, code:data.error });
    return data;
  };

  const auditApi = async (limit=50) => {
    const response = await fetch(`/api/audit?limit=${Math.max(1,Math.min(100,Number(limit)||50))}`, { cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Falha ao carregar histórico'), { status:response.status, code:data.error });
    return data;
  };

  const authStatus = async () => {
    const response = await fetch('/api/auth', { cache:'no-store' });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error('Falha ao validar sessão');
    return data;
  };

  const notify = (text, error=false) => {
    if (typeof window.toast === 'function') return window.toast(text, error ? 'err' : undefined);
    let el = document.getElementById('usersUiToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'usersUiToast';
      Object.assign(el.style,{position:'fixed',top:'16px',right:'16px',zIndex:'9999',maxWidth:'360px',padding:'12px 14px',borderRadius:'12px',font:'600 12px Manrope,system-ui',boxShadow:'0 14px 34px rgba(0,0,0,.18)'});
      document.body.appendChild(el);
    }
    el.style.background = error ? '#fff0ee' : '#f2f8f3';
    el.style.color = error ? '#8d3f37' : '#416b49';
    el.textContent = text;
    clearTimeout(el._t); el._t = setTimeout(()=>el.remove(),3500);
  };

  const modalRoot = () => {
    let root = document.getElementById('modalRoot');
    if (!root) { root = document.createElement('div'); root.id = 'modalRoot'; document.body.appendChild(root); }
    return root;
  };

  const close = () => { modalRoot().innerHTML = ''; };

  const show = ({ey='Sistema',title,body,wide=false}) => {
    const root = modalRoot();
    root.innerHTML = `<div class="modal-back"><div class="modal ${wide?'wide':''}"><div class="modal-head"><div><div class="eyebrow">${esc(ey)}</div><h2>${esc(title)}</h2></div><button type="button" id="usersUiClose" class="iconbtn">×</button></div><div class="modal-body">${body}</div></div></div>`;
    document.getElementById('usersUiClose').onclick = close;
    const back = root.querySelector('.modal-back');
    back?.addEventListener('mousedown', e => { if (e.target === e.currentTarget) close(); });
  };

  const fmt = (v) => {
    if (!v) return 'Nunca';
    try { return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(v)); }
    catch { return String(v); }
  };

  const rowsHtml = (users,selfId) => users.map(u => `<tr><td><b>${esc(u.name)}</b><div class="muted" style="font-size:9px;margin-top:4px">${esc(u.email)}</div></td><td><span class="tag ${u.role==='admin'?'vip':u.role==='manager'?'ok':'low'}">${ROLE_LABEL[u.role]||u.role}</span></td><td>${u.active?'<span class="tag ok">Ativo</span>':'<span class="tag low">Inativo</span>'}</td><td>${esc(fmt(u.lastLoginAt))}</td><td><div class="actions"><button type="button" class="iconbtn" data-users-edit="${u.id}" title="Editar">✎</button>${u.id===selfId?'':`<button type="button" class="iconbtn" data-users-reset="${u.id}" title="Redefinir senha">⌘</button>`}</div></td></tr>`).join('');

  const auditTitle = action => ({
    'state.update':'Dados da loja atualizados',
    'user.create':'Usuário criado',
    'user.update':'Usuário atualizado',
    'user.password_reset':'Senha redefinida'
  }[action] || 'Atividade registrada');

  const auditIcon = action => action==='user.password_reset'?'⌘':action==='user.create'?'+':action==='user.update'?'✎':'↻';

  function auditDetail(log){
    const p=log?.payload||{};
    if(log.action==='state.update'){
      const areas=[
        ['clients_changed','clientes'],['products_changed','produtos'],['sales_changed','vendas'],
        ['quotes_changed','orçamentos'],['expenses_changed','despesas'],['entries_changed','entradas']
      ].filter(([key])=>p[key]===true).map(([,label])=>label);
      const revision=(p.previous_revision!=null&&p.revision!=null)?`Revisão ${p.previous_revision} → ${p.revision}`:'';
      const changed=areas.length?`Alterado: ${areas.join(', ')}.`:'Atualização operacional registrada.';
      return [changed,revision].filter(Boolean).join(' ');
    }
    if(log.action==='user.create') return `Novo acesso com perfil ${ROLE_LABEL[p.role]||p.role||'definido'}.`;
    if(log.action==='user.password_reset') return 'Senha administrativa redefinida; o conteúdo da senha não é armazenado no histórico.';
    if(log.action==='user.update'){
      const parts=[];
      if(p.roleFrom!==p.roleTo) parts.push(`perfil ${ROLE_LABEL[p.roleFrom]||p.roleFrom||'—'} → ${ROLE_LABEL[p.roleTo]||p.roleTo||'—'}`);
      if(p.activeFrom!==p.activeTo) parts.push(p.activeTo?'acesso reativado':'acesso desativado');
      if(p.nameChanged) parts.push('nome atualizado');
      if(p.emailChanged) parts.push('e-mail atualizado');
      return parts.length?parts.join(' · '):'Dados do usuário revisados.';
    }
    return 'Evento administrativo registrado pelo sistema.';
  }

  const auditHtml = logs => logs.length ? logs.map(log=>`<article class="users-audit-item"><div class="users-audit-icon">${esc(auditIcon(log.action))}</div><div class="users-audit-copy"><b>${esc(auditTitle(log.action))}</b><p>${esc(auditDetail(log))}</p></div><div class="users-audit-meta"><b>${esc(log.actor?.name||'Sistema')}</b><span>${esc(fmt(log.createdAt))}</span></div></article>`).join('') : '<div class="users-audit-empty">Nenhuma atividade foi registrada ainda.</div>';

  async function openAudit(){
    show({ey:'Segurança',title:'Histórico de atividades',wide:true,body:'<div class="empty">Carregando histórico...</div>'});
    try{
      const result=await auditApi(50), logs=Array.isArray(result.logs)?result.logs:[];
      show({ey:'Segurança',title:'Histórico de atividades',wide:true,body:`<div class="users-audit-head"><div><b>Rastreabilidade administrativa</b><p>Veja as alterações mais recentes no sistema. Senhas, tokens e dados secretos nunca são exibidos neste histórico.</p></div><button type="button" id="usersUiAuditBack" class="btn btn-soft">← Usuários e acessos</button></div><div class="users-audit-list">${auditHtml(logs)}</div>`});
      document.getElementById('usersUiAuditBack').onclick=openList;
    }catch(err){
      show({ey:'Segurança',title:'Histórico de atividades',wide:true,body:`<div class="users-audit-empty">Não foi possível carregar o histórico agora.</div><div style="margin-top:12px"><button type="button" id="usersUiAuditBack" class="btn btn-soft">← Usuários e acessos</button></div>`});
      document.getElementById('usersUiAuditBack').onclick=openList;
    }
  }

  async function openList() {
    show({title:'Usuários e acessos',wide:true,body:'<div class="empty">Carregando usuários...</div>'});
    try {
      const result = await api();
      const users = result.users || [];
      show({ey:'Sistema',title:'Usuários e acessos',wide:true,body:`<div class="story-banner" style="margin-top:0"><div class="story-step">08</div><div><b>Acesso certo para cada função</b><p>Administrador controla tudo; Gerente opera a loja; Vendedor trabalha clientes, orçamentos e vendas sem custos e lucro.</p></div></div><div class="users-ui-toolbar"><div><b>${users.length} usuário(s)</b><div class="muted" style="font-size:10px;margin-top:3px">Acessos cadastrados no banco online.</div></div><div class="users-ui-toolbar-actions"><button type="button" id="usersUiAudit" class="btn btn-soft">Histórico de atividades</button><button type="button" id="usersUiNew" class="btn btn-dark">＋ Novo usuário</button></div></div><div class="card table-card"><div class="table-wrap"><table class="table"><thead><tr><th>Usuário</th><th>Perfil</th><th>Status</th><th>Último acesso</th><th>Ações</th></tr></thead><tbody>${rowsHtml(users,result.currentUserId)}</tbody></table></div></div><div class="status-box" style="margin-top:14px"><b>Permissões</b><p class="muted" style="font-size:10px;line-height:1.6;margin-bottom:0"><b>Administrador:</b> acesso completo. <b>Gerente:</b> operação completa sem usuários. <b>Vendedor:</b> clientes, orçamentos e vendas, sem dados de custo e financeiro administrativo.</p></div>`});
      document.getElementById('usersUiAudit').onclick = openAudit;
      document.getElementById('usersUiNew').onclick = () => openForm(null);
      document.querySelectorAll('[data-users-edit]').forEach(btn => btn.onclick = () => openForm(users.find(u => u.id === btn.dataset.usersEdit), result.currentUserId));
      document.querySelectorAll('[data-users-reset]').forEach(btn => btn.onclick = () => openReset(users.find(u => u.id === btn.dataset.usersReset)));
    } catch (err) {
      close();
      notify(err.status===403?'Somente administradores podem gerenciar usuários.':'Não foi possível carregar os usuários.',true);
    }
  }

  function openForm(user,selfId) {
    const editing = Boolean(user), self = user?.id === selfId;
    show({ey:'Acessos',title:editing?'Editar usuário':'Novo usuário',body:`<form id="usersUiForm" class="form-grid"><label><span class="label">Nome</span><input class="input" name="name" required minlength="2" value="${esc(user?.name||'')}" placeholder="Nome do usuário"></label><label><span class="label">E-mail</span><input class="input" name="email" type="email" required value="${esc(user?.email||'')}" placeholder="usuario@empresa.com"></label><label><span class="label">Perfil</span><select class="input" name="role" ${self?'disabled':''}><option value="seller" ${user?.role==='seller'?'selected':''}>Vendedor</option><option value="manager" ${user?.role==='manager'?'selected':''}>Gerente</option><option value="admin" ${user?.role==='admin'?'selected':''}>Administrador</option></select></label>${editing?`<label><span class="label">Status</span><select class="input" name="active" ${self?'disabled':''}><option value="true" ${user?.active?'selected':''}>Ativo</option><option value="false" ${!user?.active?'selected':''}>Inativo</option></select></label>`:`<label><span class="label">Senha provisória</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"></label>`}<div class="span2 status-box"><b id="usersUiRoleHelp">${esc(ROLE_DESC[user?.role||'seller'])}</b></div><div id="usersUiMessage" class="span2" style="font-size:10px;color:#a9584e;min-height:14px"></div><div class="form-actions"><button type="button" id="usersUiCancel" class="btn btn-soft">Cancelar</button><button type="submit" class="btn btn-dark">${editing?'Salvar alterações':'Criar usuário'}</button></div></form>`});
    const form = document.getElementById('usersUiForm');
    const role = form.elements.role;
    role.onchange = () => document.getElementById('usersUiRoleHelp').textContent = ROLE_DESC[role.value] || '';
    document.getElementById('usersUiCancel').onclick = openList;
    form.onsubmit = async e => {
      e.preventDefault(); const fd = new FormData(form); const submit=form.querySelector('[type=submit]'); submit.disabled=true;
      const payload = editing ? {action:'update',id:user.id,name:String(fd.get('name')||'').trim(),email:String(fd.get('email')||'').trim(),role:self?user.role:String(fd.get('role')||'seller'),active:self?true:String(fd.get('active'))!=='false'} : {action:'create',name:String(fd.get('name')||'').trim(),email:String(fd.get('email')||'').trim(),role:String(fd.get('role')||'seller'),password:String(fd.get('password')||'')};
      try { await api(payload); notify(editing?'Usuário atualizado.':'Usuário criado.'); await openList(); }
      catch(err){ document.getElementById('usersUiMessage').textContent = err.code==='Email already exists'?'Já existe um usuário com este e-mail.':err.code==='At least one active admin is required'?'É obrigatório manter pelo menos um administrador ativo.':'Não foi possível salvar. Revise os dados.'; submit.disabled=false; }
    };
  }

  function openReset(user) {
    if (!user) return;
    show({ey:'Segurança',title:'Redefinir senha',body:`<form id="usersUiReset" class="form-grid"><div class="span2 status-box"><b>${esc(user.name)}</b><div class="muted" style="font-size:10px;margin-top:4px">${esc(user.email)}</div></div><label class="span2"><span class="label">Nova senha provisória</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"></label><div id="usersUiMessage" class="span2" style="font-size:10px;color:#a9584e;min-height:14px"></div><div class="form-actions"><button type="button" id="usersUiCancel" class="btn btn-soft">Cancelar</button><button type="submit" class="btn btn-dark">Redefinir senha</button></div></form>`});
    document.getElementById('usersUiCancel').onclick = openList;
    document.getElementById('usersUiReset').onsubmit = async e => { e.preventDefault(); const fd=new FormData(e.currentTarget), button=e.currentTarget.querySelector('[type=submit]'); button.disabled=true; try{ await api({action:'reset-password',id:user.id,password:String(fd.get('password')||'')}); notify('Senha redefinida. As sessões anteriores foram encerradas.'); await openList(); }catch{ document.getElementById('usersUiMessage').textContent='Não foi possível redefinir a senha.'; button.disabled=false; } };
  }

  document.addEventListener('click', async (event) => {
    const button = event.target.closest?.('#manageUsersBtn');
    if (!button) return;
    event.preventDefault(); event.stopImmediatePropagation();
    button.disabled = true;
    try {
      const status = await authStatus();
      if (!status.user || status.user.role !== 'admin') return notify('Somente administradores podem gerenciar usuários.',true);
      await openList();
    } catch { notify('Não foi possível abrir o gerenciamento de usuários.',true); }
    finally { button.disabled = false; }
  }, true);
})();
