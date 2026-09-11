(() => {
  const $ = (sel) => document.querySelector(sel);
  const login = document.getElementById('login');
  const app = document.getElementById('app');
  const card = $('.login-card');

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>'"]/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));

  async function api(body) {
    const options = body ? { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) } : { cache:'no-store' };
    const response = await fetch('/api/auth', options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(data.error || 'Falha de autenticação'), { status: response.status });
    return data;
  }

  function message(text, error=false) {
    let el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = text || '';
    el.style.color = error ? '#a9584e' : '#5f8a67';
  }

  function baseHeader(kicker, title, desc) {
    return `<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div class="brandmark"><div style="font-weight:800;color:#8b6257;font-size:13px">EM</div></div>
      <div><div class="eyebrow">${kicker}</div><div style="font-size:12px;font-weight:800;color:var(--dark2);margin-top:3px">Elegance Move</div></div>
    </div>
    <h2>${title}</h2><p class="muted" style="line-height:1.65">${desc}</p>`;
  }

  function renderSetup() {
    if (!card) return;
    card.innerHTML = `${baseHeader('Primeiro acesso','Crie o administrador.','Este cadastro será o acesso principal ao sistema. A senha é armazenada somente de forma criptografada.')}
      <form id="setupForm" style="display:grid;gap:12px;margin-top:20px">
        <label><span class="label">Nome do administrador</span><input class="input" name="name" autocomplete="name" required minlength="2" placeholder="Seu nome"></label>
        <label><span class="label">E-mail</span><input class="input" name="email" type="email" autocomplete="email" required placeholder="voce@empresa.com"></label>
        <label><span class="label">Senha</span><input class="input" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Mínimo de 8 caracteres"></label>
        <label><span class="label">Confirmar senha</span><input class="input" name="confirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Repita a senha"></label>
        <div id="authMessage" style="font-size:11px;min-height:16px"></div>
        <button class="btn btn-dark btn-full" type="submit">Criar acesso e entrar →</button>
      </form>
      <div class="footnote">O primeiro administrador será o responsável pelo acesso aos dados da loja.</div>`;
    document.getElementById('setupForm').onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const fd = new FormData(form);
      const password = String(fd.get('password') || '');
      if (password !== String(fd.get('confirm') || '')) return message('As senhas não coincidem.', true);
      const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Criando acesso...';
      try {
        const result = await api({ action:'setup', name:String(fd.get('name')||'').trim(), email:String(fd.get('email')||'').trim(), password });
        await unlock(result.user);
      } catch (err) {
        message(err.status === 409 ? 'O administrador já foi configurado. Atualize a página.' : 'Não foi possível criar o acesso. Verifique os dados e tente novamente.', true);
        button.disabled = false; button.textContent = 'Criar acesso e entrar →';
      }
    };
  }

  function renderLogin() {
    if (!card) return;
    card.innerHTML = `${baseHeader('Acesso seguro','Bem-vindo.','Entre com o usuário administrador para acessar clientes, estoque, vendas e financeiro.')}
      <form id="loginForm" style="display:grid;gap:12px;margin-top:20px">
        <label><span class="label">E-mail</span><input class="input" name="email" type="email" autocomplete="username" required placeholder="Seu e-mail"></label>
        <label><span class="label">Senha</span><input class="input" name="password" type="password" autocomplete="current-password" required placeholder="Sua senha"></label>
        <div id="authMessage" style="font-size:11px;min-height:16px"></div>
        <button class="btn btn-dark btn-full" type="submit">Entrar no sistema →</button>
      </form>
      <div class="footnote">A sessão é protegida e expira automaticamente por segurança.</div>`;
    document.getElementById('loginForm').onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      const fd = new FormData(form);
      const button = form.querySelector('button'); button.disabled = true; button.textContent = 'Entrando...';
      try {
        const result = await api({ action:'login', email:String(fd.get('email')||'').trim(), password:String(fd.get('password')||'') });
        await unlock(result.user);
      } catch (err) {
        message(err.status === 401 ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar agora. Tente novamente.', true);
        button.disabled = false; button.textContent = 'Entrar no sistema →';
      }
    };
  }

  function installLogout(user) {
    const top = $('.top-actions');
    if (top && !document.getElementById('logoutBtn')) {
      const button = document.createElement('button');
      button.id = 'logoutBtn'; button.className = 'btn btn-soft'; button.textContent = 'Sair';
      button.onclick = async () => { button.disabled = true; await api({ action:'logout' }).catch(()=>{}); try{sessionStorage.clear()}catch{} location.reload(); };
      top.prepend(button);
    }
    const nameEl = $('.userbox-text b'); if (nameEl) nameEl.textContent = user?.name || 'Administrador';
    const roleEl = $('.userbox-text span'); if (roleEl) roleEl.textContent = user?.role === 'admin' ? 'Administrador' : (user?.email || 'Usuário');
  }

  async function unlock(user) {
    document.body.classList.remove('auth-pending');
    if (login) login.classList.add('hidden');
    if (app) app.classList.remove('hidden');
    installLogout(user);
    if (typeof window.showApp === 'function') await window.showApp();
  }

  async function boot() {
    document.body.classList.add('auth-pending');
    try { sessionStorage.removeItem('em-store-session-v1'); } catch {}
    if (app) app.classList.add('hidden');
    if (login) login.classList.remove('hidden');
    try {
      const status = await api();
      if (status.user) return unlock(status.user);
      document.body.classList.remove('auth-pending');
      status.configured ? renderLogin() : renderSetup();
    } catch {
      document.body.classList.remove('auth-pending');
      if (card) card.innerHTML = `${baseHeader('Conexão','Não foi possível validar o acesso.','O serviço de autenticação não respondeu. Atualize a página em alguns instantes.')}`;
    }
  }

  boot();
})();
