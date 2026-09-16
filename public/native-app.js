/* ELEGANCE_MOVE_NATIVE_APP_RUNTIME_V1 */
(() => {
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const root=document.documentElement;
  const content=()=>document.getElementById('content')||document.querySelector('.content');

  function markStandalone(){
    root.classList.toggle('em-app-standalone',standalone());
  }

  function ensureAppChrome(){
    if(!standalone()||root.classList.contains('em-login-screen')) return;
    const topLeft=document.querySelector('.top-left');
    if(topLeft&&!topLeft.querySelector('.em-app-brand')){
      const brand=document.createElement('div');
      brand.className='em-app-brand';
      brand.innerHTML='<div class="em-app-brand-icon"><img src="/elegance-move-rose-gold-v9.png" alt=""></div><div class="em-app-brand-copy"><strong>Elegance Move</strong><span>Gestão da boutique</span></div>';
      topLeft.appendChild(brand);
    }
    const dashboard=document.querySelector('#content.premium-dashboard,.content.premium-dashboard');
    const head=dashboard?.querySelector('.page-head');
    if(head&&!head.querySelector('.em-dashboard-status')){
      const status=document.createElement('div');
      status.className='em-dashboard-status';
      status.textContent='Sistema online';
      const h1=head.querySelector('h1');
      if(h1) head.insertBefore(status,h1); else head.prepend(status);
    }
  }

  function animateView(){
    if(!standalone()) return;
    const el=content();
    if(!el) return;
    el.classList.remove('em-app-view');
    void el.offsetWidth;
    el.classList.add('em-app-view');
  }

  function navFeedback(){
    if(!standalone()) return;
    root.classList.add('em-nav-press');
    setTimeout(()=>root.classList.remove('em-nav-press'),120);
  }

  document.addEventListener('click',e=>{
    const trigger=e.target.closest?.('#emMobileDock button,.nav button[data-page],[data-em-extra]');
    if(!trigger) return;
    navFeedback();
    setTimeout(()=>{ensureAppChrome();animateView();},45);
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    markStandalone();
    ensureAppChrome();
    requestAnimationFrame(animateView);
  },{once:true});

  const observer=new MutationObserver(()=>requestAnimationFrame(ensureAppChrome));
  observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','style']});

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change',()=>{
    markStandalone();
    ensureAppChrome();
    animateView();
  });

  markStandalone();
  ensureAppChrome();
})();
