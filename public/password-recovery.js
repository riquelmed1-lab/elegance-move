(() => {
  const SUPABASE_URL = 'https://fcuqorihzypcstmcgvru.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_sQClCX3zvC1Ja2d2Oia7qA_JtRMGZuS';

  async function request(path, { method='GET', token, body } = {}) {
    const response = await fetch(SUPABASE_URL + path, {
      method,
      headers: {
        apikey: SUPABASE_KEY,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body !== undefined ? { 'Content-Type':'application/json' } : {})
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { response, data };
  }

  function authMessage(text, error=false) {
    const el = document.getElementById('authMessage');
    if (!el) return;
    el.textContent = text;
    el.style.color = error ? '#a9584e' : '#5f8a67';
  }

  function installForgotPassword() {
    const form = document.getElementById('loginForm');
    if (!form || document.getElementById('forgotPasswordBtn')) return;

    const button = document.createElement('button');
    button.id = 'forgotPasswordBtn';
    button.type = 'button';
    button.textContent = 'Esqueci minha senha';
    button.style.cssText = 'border:0;background:transparent;color:#8b6257;font:inherit;font-size:11px;font-weight:800;cursor:pointer;padding:0;text-align:right;justify-self:end;margin-top:-5px';

    const passwordInput = form.querySelector('input[name="password"]');
    const passwordLabel = passwordInput?.closest('label');
    if (passwordLabel) passwordLabel.insertAdjacentElement('afterend', button);
    else form.prepend(button);

    button.onclick = async () => {
      const emailInput = form.querySelector('input[name="email"]');
      const email = String(emailInput?.value || '').trim().toLowerCase();
      if (!email) {
        authMessage('Digite seu e-mail acima para recuperar a senha.', true);
        emailInput?.focus();
        return;
      }

      button.disabled = true;
      const original = button.textContent;
      button.textContent = 'Enviando...';
      try {
        const redirectTo = location.origin + location.pathname;
        const { response } = await request('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectTo), {
          method:'POST',
          body:{ email }
        });
        if (!response.ok && response.status !== 429) throw new Error('RECOVERY_FAILED');
        authMessage('Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha.');
      } catch {
        authMessage('Não foi possível enviar o e-mail de recuperação agora. Tente novamente em alguns minutos.', true);
      } finally {
        button.disabled = false;
        button.textContent = original;
      }
    };
  }

  function recoveryParams() {
    const hash = new URLSearchParams(location.hash.replace(/^#/, ''));
    if (hash.get('type') !== 'recovery' || !hash.get('access_token')) return null;
    return {
      accessToken: hash.get('access_token'),
      refreshToken: hash.get('refresh_token') || ''
    };
  }

  function renderNewPassword(recovery) {
    const login = document.getElementById('login');
    const app = document.getElementById('app');
    const card = document.querySelector('.login-card');
    if (!card) return false;

    if (app) app.style.display = 'none';
    if (login) login.style.display = '';

    card.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div class="brandmark"><div style="font-weight:800;color:#8b6257;font-size:13px">EM</div></div>
        <div><div class="eyebrow">Recuperação segura</div><div style="font-size:12px;font-weight:800;color:var(--dark2);margin-top:3px">Elegance Move</div></div>
      </div>
      <h2>Crie uma nova senha.</h2>
      <p class="muted" style="line-height:1.65">Defina uma nova senha para voltar a acessar sua conta.</p>
      <form id="recoveryPasswordForm" style="display:grid;gap:12px;margin-top:20px">
        <label><span class="label">Nova senha</span><input class="input" name="password" type="password" autocomplete="new-password" required minlength="8" placeholder="Mínimo de 8 caracteres"></label>
        <label><span class="label">Confirmar nova senha</span><input class="input" name="confirm" type="password" autocomplete="new-password" required minlength="8" placeholder="Repita a nova senha"></label>
        <div id="recoveryMessage" style="font-size:11px;min-height:16px"></div>
        <button class="btn btn-dark btn-full" type="submit">Salvar nova senha →</button>
      </form>
      <div class="footnote">Este link de recuperação é temporário e deve ser usado apenas por você.</div>`;

    const form = document.getElementById('recoveryPasswordForm');
    const message = (text, error=false) => {
      const el = document.getElementById('recoveryMessage');
      if (!el) return;
      el.textContent = text;
      el.style.color = error ? '#a9584e' : '#5f8a67';
    };

    form.onsubmit = async (event) => {
      event.preventDefault();
      const fd = new FormData(form);
      const password = String(fd.get('password') || '');
      const confirm = String(fd.get('confirm') || '');
      if (password.length < 8) return message('Use pelo menos 8 caracteres.', true);
      if (password !== confirm) return message('As senhas não coincidem.', true);

      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      submit.textContent = 'Salvando...';
      try {
        const { response, data } = await request('/auth/v1/user', {
          method:'PUT',
          token:recovery.accessToken,
          body:{ password }
        });
        if (!response.ok) throw new Error(data?.message || 'UPDATE_FAILED');
        history.replaceState({}, '', location.pathname + location.search);
        message('Senha alterada com sucesso. Você já pode entrar com a nova senha.');
        submit.textContent = 'Senha atualizada ✓';
        setTimeout(() => location.reload(), 1200);
      } catch {
        message('Este link expirou ou não pôde ser usado. Solicite um novo e-mail de recuperação.', true);
        submit.disabled = false;
        submit.textContent = 'Salvar nova senha →';
      }
    };
    return true;
  }

  const recovery = recoveryParams();
  if (recovery) {
    const tryRecovery = () => {
      if (renderNewPassword(recovery)) return true;
      return false;
    };
    if (!tryRecovery()) {
      const obs = new MutationObserver(() => { if (tryRecovery()) obs.disconnect(); });
      obs.observe(document.documentElement, { childList:true, subtree:true });
    }
    return;
  }

  installForgotPassword();
  const observer = new MutationObserver(installForgotPassword);
  observer.observe(document.documentElement, { childList:true, subtree:true });
})();
