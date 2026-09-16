/* ELEGANCE_MOVE_NATIVE_APP_RUNTIME_V1 */
(() => {
  const standalone=()=>window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
  const root=document.documentElement;
  const content=()=>document.getElementById('content')||document.querySelector('.content');

  function markStandalone(){
    root.classList.toggle('em-app-standalone',standalone());
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
    setTimeout(animateView,45);
  },true);

  document.addEventListener('DOMContentLoaded',()=>{
    markStandalone();
    requestAnimationFrame(animateView);
  },{once:true});

  window.matchMedia('(display-mode: standalone)').addEventListener?.('change',()=>{
    markStandalone();
    animateView();
  });

  markStandalone();
})();
