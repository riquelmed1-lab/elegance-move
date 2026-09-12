(() => {
  const esc = (value) => String(value ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  let busy = false;

  const config = () => window.__SUPABASE_CONFIG__ || null;

  const notify = (text, error = false) => {
    if (typeof window.toast === 'function') return window.toast(text, error ? 'err' : undefined);
    alert(text);
  };

  const modalRoot = () => {
    let root = document.getElementById('modalRoot');
    if (!root) {
      root = document.createElement('div');
      root.id = 'modalRoot';
      document.body.appendChild(root);
    }
    return root;
  };

  const closeModal = () => { modalRoot().innerHTML = ''; };

  function showModal() {
    const root = modalRoot();
    root.innerHTML = `<div class="modal-back"><div class="modal wide"><div class="modal-head"><div><div class="eyebrow">Migração segura</div><h2>Ativar acesso Supabase</h2></div><button type="button" id="supaActivationClose" class="iconbtn">×</button></div><div class="modal-body">
      <div class="story-banner" style="margin-top:0"><div class="story-step">09</div><div><b>Novo banco, sem desligar o sistema atual</b><p>Crie sua conta no Supabase. O login antigo continua funcionando até concluirmos e validarmos toda a migração.</p></div></div>
      <form id="supaActivationForm" class="form-grid" style="margin-top:16px">
        <label><span class="label">Seu nome</span><input class="input" name="name" required minlength="2" autocomplete="name" placeholder="Nome do administrador"></label>
        <label><span class="label">E-mail</span><input class="input" name="email" type="email" required autocomplete="email" placeholder="Seu e-mail"></label>
        <label><span class="label">Nova senha do Supabase</span><input class="input" name="password" type="password" required minlength="8" autocomplete="new-password" placeholder="Mínimo de 8 caracteres"></label>
        <label><span class="label">Confirmar nova senha</span><input class="input" name="confirm" type="password" required minlength="8" autocomplete="new-password" placeholder="Repita a senha"></label>
        <label class="span2"><span class="label">Código de ativação</span><input class="input" name="code" required minlength="24" autocomplete="off" placeholder="Cole o código de ativação fornecido"></label>
        <div class="span2 status-box"><b>Como funciona</b><p class="muted" style="font-size:10px;line-height:1.65;margin:7px 0 0">Na primeira tentativa, o Supabase pode enviar um e-mail de confirmação. Se isso acontecer, confirme o e-mail, volte ao Elegance Move e envie este mesmo formulário novamente. Na segunda tentativa o sistema entra no Supabase e transforma sua conta no primeiro Administrador.</p></div>
        <div id="supaActivationMessage" class="span2" style="font-size:11px;min-height:18px"></div>
        <div class="form-actions"><button type="button" id="supaActivationCancel" class="btn btn-soft">Cancelar</button><button type="submit" id="supaActivationSubmit" class="btn btn-dark">Criar / concluir ativação</button></div>
      </form>
    </div></div></div>`;

    document.getElementById('supaActivationClose').onclick = closeModal;
    document.getElementById('supaActivationCancel').onclick = closeModal;
    root.querySelector('.modal-back')?.addEventListener('mousedown', e => { if (e.target === e.currentTarget) closeModal(); });
    document.getElementById('supaActivationForm').onsubmit = activate;
  }

  const setMessage = (text, error = false) => {
    const el = document.getElementById('supaActivationMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = error ? '#a9584e' : '#4f7657';
  };

  async function authRequest(path, body) {
    const cfg = config();
    if (!cfg?.url || !cfg?.key) throw new Error('Configuração do Supabase não encontrada.');
    const response = await fetch(`${cfg.url}${path}`, {
      method: 'POST',
      headers: { 'apikey': cfg.key, 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data?.msg || data?.message || data?.error_description || data?.error || 'Falha no Supabase'), { status: response.status, data });
    return data;
  }

  async function signIn(email, password) {
    return authRequest('/auth/v1/token?grant_type=password', { email, password });
  }

  async function signUp(name, email, password) {
    const redirect = encodeURIComponent(location.origin + '/');
    return authRequest(`/auth/v1/signup?redirect_to=${redirect}`, { email, password, data: { full_name: name } });
  }

  async function claimAdmin(accessToken, code) {
    const cfg = config();
    const response = await fetch(`${cfg.url}/rest/v1/rpc/claim_first_admin`, {
      method: 'POST',
      headers: {
        'apikey': cfg.key,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data?.message || data?.hint || 'Não foi possível promover a conta.'), { status: response.status, data });
    return data;
  }

  async function verifyProfile(accessToken, userId) {
    const cfg = config();
    const response = await fetch(`${cfg.url}/rest/v1/profiles?select=id,full_name,role,active&id=eq.${encodeURIComponent(userId)}`, {
      headers: { 'apikey': cfg.key, 'Authorization': `Bearer ${accessToken}` },
      cache: 'no-store'
    });
    const data = await response.json().catch(() => []);
    if (!response.ok) throw new Error('Não foi possível validar o perfil criado.');
    return Array.isArray(data) ? data[0] : null;
  }

  async function activate(event) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const fd = new FormData(form);
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim().toLowerCase();
    const password = String(fd.get('password') || '');
    const confirm = String(fd.get('confirm') || '');
    const code = String(fd.get('code') || '').trim();
    if (password !== confirm) return setMessage('As senhas não coincidem.', true);
    if (password.length < 8) return setMessage('A senha precisa ter pelo menos 8 caracteres.', true);

    const button = document.getElementById('supaActivationSubmit');
    busy = true;
    button.disabled = true;
    button.textContent = 'Ativando...';
    setMessage('Validando seu acesso no Supabase...');

    try {
      let sessionData = null;
      try {
        sessionData = await signIn(email, password);
      } catch (loginError) {
        if (loginError.status !== 400 && loginError.status !== 401) throw loginError;
      }

      if (!sessionData?.access_token) {
        setMessage('Criando sua conta no Supabase...');
        const signup = await signUp(name, email, password);
        if (!signup?.access_token) {
          setMessage('Conta criada. Confira sua caixa de e-mail e confirme o cadastro. Depois volte aqui e envie este mesmo formulário novamente.');
          return;
        }
        sessionData = signup;
      }

      const userId = sessionData?.user?.id;
      if (!userId || !sessionData?.access_token) throw new Error('Sessão Supabase incompleta.');

      setMessage('Conta confirmada. Promovendo para Administrador...');
      await claimAdmin(sessionData.access_token, code);
      const profile = await verifyProfile(sessionData.access_token, userId);
      if (!profile || profile.role !== 'admin' || profile.active !== true) throw new Error('A conta foi criada, mas o perfil administrativo não foi confirmado.');

      setMessage('Ativação concluída: sua conta Supabase agora é Administrador.');
      const card = document.getElementById('supabaseMigrationCard');
      if (card) {
        card.dataset.status = 'activated';
        const badge = card.querySelector('[data-supa-status]');
        if (badge) { badge.className = 'tag ok'; badge.textContent = 'Administrador ativado'; }
      }
      notify('Supabase ativado com perfil Administrador.');
      setTimeout(closeModal, 1400);
    } catch (err) {
      const text = String(err?.message || 'Falha na ativação.');
      if (/already exists|registered|User already/i.test(text)) {
        setMessage('Esta conta já existe. Confirme o e-mail, se ainda não confirmou, e tente novamente com a mesma senha.', true);
      } else if (/Invalid activation code/i.test(text)) {
        setMessage('Código de ativação inválido. Confira o código e tente novamente.', true);
      } else if (/no longer available|already exists/i.test(text)) {
        setMessage('A ativação inicial já foi utilizada. Se esta é sua conta, a etapa já foi concluída.', true);
      } else if (/Email not confirmed|not confirmed/i.test(text)) {
        setMessage('Seu e-mail ainda não foi confirmado no Supabase. Confirme o e-mail recebido e tente novamente.', true);
      } else {
        setMessage(text, true);
      }
    } finally {
      busy = false;
      if (button && document.body.contains(button)) {
        button.disabled = false;
        button.textContent = 'Criar / concluir ativação';
      }
    }
  }

  function decorate() {
    if (document.body.dataset.userRole !== 'admin') return;
    const grid = document.querySelector('.system-grid');
    if (!grid || document.getElementById('supabaseMigrationCard')) return;
    const section = document.createElement('section');
    section.className = 'card card-pad';
    section.id = 'supabaseMigrationCard';
    section.innerHTML = `<div class="eyebrow">Nova infraestrutura</div><h2 class="serif" style="font-size:24px;margin:7px 0 16px">Migração para Supabase</h2><div class="status-box"><span class="tag" data-supa-status>Pronto para ativar</span><div style="margin-top:12px;font-weight:800">Ative seu primeiro acesso administrativo</div><p class="muted" style="font-size:12px;line-height:1.6;margin-bottom:0">O novo PostgreSQL, RLS e perfis já estão preparados. Esta etapa cria seu acesso no Supabase sem desligar o sistema atual.</p></div><button id="activateSupabaseBtn" type="button" class="btn btn-dark btn-full" style="margin-top:14px">Ativar meu acesso Supabase</button>`;
    grid.appendChild(section);
    document.getElementById('activateSupabaseBtn').onclick = showModal;
  }

  const observer = new MutationObserver(() => decorate());
  observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-user-role'] });
  document.addEventListener('click', () => queueMicrotask(decorate), true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', decorate); else decorate();
})();
