/* ELEGANCE_MOVE_LOGIN_PREMIUM_RUNTIME_V1 */
(() => {
  const root=document.documentElement;
  const ICON='/elegance-move-rose-gold-v9.png';
  let scheduled=false;

  function loginVisible(){
    const login=document.getElementById('login');
    if(!login) return false;
    const style=getComputedStyle(login);
    return style.display!=='none'&&style.visibility!=='hidden'&&login.getClientRects().length>0;
  }

  function decorateLogin(){
    const form=document.getElementById('loginForm');
    const card=document.querySelector('.login-card');
    if(!form||!card) return;

    card.classList.add('em-login-card-premium');
    const directChildren=[...card.children];
    const heading=directChildren.find(el=>el.tagName==='H2');
    const desc=directChildren.find(el=>el.tagName==='P'&&el.classList.contains('muted'));

    if(heading) heading.textContent='Bem-vinda de volta';
    if(desc) desc.textContent='Acesse sua conta para gerenciar vendas, clientes, estoque e financeiro.';

    if(!card.querySelector('.em-login-brand')){
      const oldHeader=directChildren.find(el=>el.tagName==='DIV'&&el.querySelector('.brandmark'));
      const brand=document.createElement('div');
      brand.className='em-login-brand';
      brand.innerHTML=`<div class="em-login-brand-icon"><img src="${ICON}" alt="Elegance Move"></div><div class="em-login-brand-copy"><small>Acesso seguro</small><strong>Elegance Move</strong></div>`;
      if(oldHeader) oldHeader.replaceWith(brand); else card.prepend(brand);
    }

    const email=form.querySelector('input[name="email"]');
    const password=form.querySelector('input[name="password"]');
    if(email){
      email.placeholder='seuemail@exemplo.com';
      email.closest('label')?.setAttribute('data-em-field','email');
    }
    if(password){
      password.placeholder='Digite sua senha';
      const label=password.closest('label');
      if(label){
        label.classList.add('em-password-field');
        if(!label.querySelector('.em-password-toggle')){
          const toggle=document.createElement('button');
          toggle.type='button';
          toggle.className='em-password-toggle';
          toggle.textContent='Mostrar';
          toggle.setAttribute('aria-label','Mostrar senha');
          toggle.addEventListener('click',()=>{
            const show=password.type==='password';
            password.type=show?'text':'password';
            toggle.textContent=show?'Ocultar':'Mostrar';
            toggle.setAttribute('aria-label',show?'Ocultar senha':'Mostrar senha');
          });
          label.appendChild(toggle);
        }
      }
    }

    const submit=form.querySelector('button[type="submit"]');
    if(submit&&!submit.disabled) submit.textContent='Entrar no sistema →';

    if(!card.querySelector('.em-login-trust')){
      const trust=document.createElement('div');
      trust.className='em-login-trust';
      trust.innerHTML='<span>Acesso seguro</span><i></i><span>Perfis controlados</span><i></i><span>Dados protegidos</span>';
      card.appendChild(trust);
    }
    if(!card.querySelector('.em-login-security')){
      const security=document.createElement('div');
      security.className='em-login-security';
      security.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V7a5 5 0 0 1 10 0v3"/><rect x="5" y="10" width="14" height="10" rx="3"/><path d="M12 14v2"/></svg><span>Ambiente protegido da Elegance Move</span>';
      card.appendChild(security);
    }
  }

  function refresh(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      const visible=loginVisible();
      root.classList.toggle('em-login-screen',visible);
      if(visible) decorateLogin();
    });
  }

  document.addEventListener('DOMContentLoaded',refresh,{once:true});
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class']});
  window.addEventListener('pageshow',refresh);
  refresh();
})();
