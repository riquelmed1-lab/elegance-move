(() => {
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const isIOS=/iphone|ipad|ipod/i.test(navigator.userAgent);
  const isMobile=/android|iphone|ipad|ipod/i.test(navigator.userAgent)||window.matchMedia('(max-width:760px)').matches;
  const DISMISS_KEY='em-pwa-install-dismissed-at';
  const DAY=86400000;
  let deferredPrompt=null;

  function registerServiceWorker(){
    if(!('serviceWorker' in navigator)) return;
    const register=()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
    if(document.readyState==='complete') register(); else window.addEventListener('load',register,{once:true});
  }

  function injectStyles(){
    if(document.getElementById('em-pwa-install-style')) return;
    const style=document.createElement('style');
    style.id='em-pwa-install-style';
    style.textContent=`
      #emPwaBanner,#emPwaSheet{font-family:Manrope,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
      #emPwaBanner{display:none;position:fixed;left:12px;right:12px;bottom:calc(82px + env(safe-area-inset-bottom));z-index:125;background:rgba(255,253,252,.98);border:1px solid rgba(143,93,80,.16);border-radius:18px;padding:12px;box-shadow:0 18px 42px rgba(57,37,32,.18);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);align-items:center;gap:11px}
      #emPwaBanner.show{display:flex}
      #emPwaBanner .em-pwa-icon{width:46px;height:46px;min-width:46px;border-radius:13px;background:#f2dfd9;display:grid;place-items:center;overflow:hidden}
      #emPwaBanner .em-pwa-icon img{width:100%;height:100%;display:block}
      #emPwaBanner .em-pwa-copy{min-width:0;flex:1}
      #emPwaBanner .em-pwa-copy b{display:block;color:#453632;font-size:12px;line-height:1.2;margin-bottom:3px}
      #emPwaBanner .em-pwa-copy span{display:block;color:#8f7a73;font-size:8.6px;line-height:1.35}
      #emPwaBanner .em-pwa-actions{display:flex;align-items:center;gap:6px}
      #emPwaBanner button{border:0;border-radius:10px;min-height:36px;padding:0 11px;font:800 8.5px Manrope,system-ui;cursor:pointer}
      #emPwaBanner [data-em-pwa-install]{background:#8f5d50;color:white}
      #emPwaBanner [data-em-pwa-dismiss]{background:#f6ece8;color:#7a5a51;padding:0 9px}
      #emPwaSheet{display:none;position:fixed;inset:0;z-index:160;background:rgba(41,29,25,.38);padding:14px;align-items:flex-end;justify-content:center}
      #emPwaSheet.open{display:flex}
      #emPwaSheet .em-pwa-sheet-card{width:min(100%,460px);background:#fffdfc;border:1px solid rgba(143,93,80,.16);border-radius:24px 24px 18px 18px;padding:16px 16px calc(18px + env(safe-area-inset-bottom));box-shadow:0 24px 60px rgba(44,29,25,.24)}
      #emPwaSheet .em-pwa-handle{width:40px;height:4px;border-radius:99px;background:#dfd0cb;margin:0 auto 13px}
      #emPwaSheet .em-pwa-title{display:flex;align-items:center;gap:11px;margin-bottom:12px}
      #emPwaSheet .em-pwa-title img{width:50px;height:50px;border-radius:14px}
      #emPwaSheet h3{margin:0;color:#3f322f;font-size:18px;line-height:1.15;letter-spacing:-.02em}
      #emPwaSheet p{margin:4px 0 0;color:#8c7871;font-size:10px;line-height:1.5}
      #emPwaSheet .em-pwa-steps{display:grid;gap:8px;margin:13px 0}
      #emPwaSheet .em-pwa-step{display:grid;grid-template-columns:30px minmax(0,1fr);gap:10px;align-items:start;padding:10px;border-radius:13px;background:#faf4f1;border:1px solid #f0e4df}
      #emPwaSheet .em-pwa-step strong{width:30px;height:30px;border-radius:9px;background:#f1ddd6;color:#805347;display:grid;place-items:center;font-size:10px}
      #emPwaSheet .em-pwa-step b{display:block;color:#4e3e39;font-size:10px;margin-bottom:2px}
      #emPwaSheet .em-pwa-step span{display:block;color:#8e7a73;font-size:8.8px;line-height:1.4}
      #emPwaSheet .em-pwa-sheet-actions{display:grid;grid-template-columns:1fr;gap:8px;margin-top:13px}
      #emPwaSheet .em-pwa-primary,#emPwaSheet .em-pwa-secondary{border:0;border-radius:13px;min-height:46px;font:800 10px Manrope,system-ui}
      #emPwaSheet .em-pwa-primary{background:#8f5d50;color:#fff}
      #emPwaSheet .em-pwa-secondary{background:#f7eeea;color:#76574e}
      @media(min-width:761px){#emPwaBanner{left:auto;right:18px;bottom:18px;width:390px}}
    `;
    document.head.appendChild(style);
  }

  function ensureUI(){
    injectStyles();
    if(!document.getElementById('emPwaBanner')){
      const banner=document.createElement('div');
      banner.id='emPwaBanner';
      banner.innerHTML=`<div class="em-pwa-icon"><img src="/pwa-icon.svg" alt=""></div><div class="em-pwa-copy"><b>Instale o Elegance Move</b><span>Acesso mais rápido, tela cheia e experiência de aplicativo.</span></div><div class="em-pwa-actions"><button type="button" data-em-pwa-install>Instalar</button><button type="button" data-em-pwa-dismiss aria-label="Agora não">×</button></div>`;
      document.body.appendChild(banner);
      banner.querySelector('[data-em-pwa-install]').onclick=()=>openInstall();
      banner.querySelector('[data-em-pwa-dismiss]').onclick=()=>dismissBanner();
    }
    if(!document.getElementById('emPwaSheet')){
      const sheet=document.createElement('div');
      sheet.id='emPwaSheet';
      document.body.appendChild(sheet);
      sheet.addEventListener('click',e=>{if(e.target===sheet) closeSheet();});
    }
  }

  function dismissedRecently(){
    const ts=Number(localStorage.getItem(DISMISS_KEY)||0);
    return ts && Date.now()-ts<7*DAY;
  }
  function dismissBanner(){
    localStorage.setItem(DISMISS_KEY,String(Date.now()));
    document.getElementById('emPwaBanner')?.classList.remove('show');
  }
  function closeSheet(){document.getElementById('emPwaSheet')?.classList.remove('open')}

  function showBanner(){
    if(isStandalone()||!isMobile||dismissedRecently()) return;
    ensureUI();
    setTimeout(()=>document.getElementById('emPwaBanner')?.classList.add('show'),1400);
  }

  function iosMarkup(){
    return `<div class="em-pwa-sheet-card"><div class="em-pwa-handle"></div><div class="em-pwa-title"><img src="/pwa-icon.svg" alt=""><div><h3>Instalar Elegance Move</h3><p>No iPhone, a instalação é feita pelo Safari.</p></div></div><div class="em-pwa-steps"><div class="em-pwa-step"><strong>1</strong><div><b>Abra no Safari</b><span>Se estiver no WhatsApp ou outro navegador, abra esta página no Safari.</span></div></div><div class="em-pwa-step"><strong>2</strong><div><b>Toque em Compartilhar</b><span>Use o ícone de compartilhamento na barra do Safari.</span></div></div><div class="em-pwa-step"><strong>3</strong><div><b>Adicionar à Tela de Início</b><span>Confirme o nome “Elegance Move” e toque em Adicionar.</span></div></div></div><div class="em-pwa-sheet-actions"><button class="em-pwa-primary" type="button" data-em-pwa-ok>Entendi</button></div></div>`;
  }

  function genericMarkup(){
    return `<div class="em-pwa-sheet-card"><div class="em-pwa-handle"></div><div class="em-pwa-title"><img src="/pwa-icon.svg" alt=""><div><h3>Instalar Elegance Move</h3><p>Use como aplicativo, com acesso direto pela tela inicial.</p></div></div><div class="em-pwa-steps"><div class="em-pwa-step"><strong>✓</strong><div><b>Acesso rápido</b><span>Abra o sistema direto pelo ícone do celular.</span></div></div><div class="em-pwa-step"><strong>✓</strong><div><b>Tela cheia</b><span>Mais espaço para vendas, clientes e estoque.</span></div></div></div><div class="em-pwa-sheet-actions"><button class="em-pwa-primary" type="button" data-em-pwa-confirm>Instalar aplicativo</button><button class="em-pwa-secondary" type="button" data-em-pwa-cancel>Agora não</button></div></div>`;
  }

  async function promptInstall(){
    if(!deferredPrompt) return false;
    deferredPrompt.prompt();
    const choice=await deferredPrompt.userChoice.catch(()=>null);
    deferredPrompt=null;
    document.documentElement.classList.remove('pwa-install-available');
    return choice?.outcome==='accepted';
  }

  function openInstall(){
    if(isStandalone()) return;
    ensureUI();
    const sheet=document.getElementById('emPwaSheet');
    sheet.innerHTML=isIOS?iosMarkup():genericMarkup();
    sheet.classList.add('open');
    sheet.querySelector('[data-em-pwa-ok]')?.addEventListener('click',closeSheet);
    sheet.querySelector('[data-em-pwa-cancel]')?.addEventListener('click',()=>{dismissBanner();closeSheet();});
    sheet.querySelector('[data-em-pwa-confirm]')?.addEventListener('click',async()=>{
      const ok=await promptInstall();
      if(ok){localStorage.removeItem(DISMISS_KEY);closeSheet();document.getElementById('emPwaBanner')?.classList.remove('show');}
    });
  }

  window.__EM_PWA_OPEN_INSTALL__=openInstall;
  window.__EM_PWA_IS_INSTALLED__=isStandalone;
  window.__EM_PWA_CAN_INSTALL__=()=>!isStandalone()&&(isIOS||!!deferredPrompt);

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    window.__EM_PWA_INSTALL__=promptInstall;
    document.documentElement.classList.add('pwa-install-available');
    showBanner();
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    localStorage.removeItem(DISMISS_KEY);
    document.documentElement.classList.remove('pwa-install-available');
    document.documentElement.classList.add('pwa-installed');
    document.getElementById('emPwaBanner')?.classList.remove('show');
    closeSheet();
  });

  document.addEventListener('DOMContentLoaded',()=>{
    registerServiceWorker();
    ensureUI();
    if(isIOS&&!isStandalone()) showBanner();
  },{once:true});

  if(document.readyState!=='loading'){
    registerServiceWorker();
    ensureUI();
    if(isIOS&&!isStandalone()) showBanner();
  }
})();
