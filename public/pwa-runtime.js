(() => {
  if(!('serviceWorker' in navigator)) return;
  const register=()=>navigator.serviceWorker.register('/sw.js',{scope:'/'}).catch(()=>{});
  if(document.readyState==='complete') register(); else window.addEventListener('load',register,{once:true});

  let deferredPrompt=null;
  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    window.__EM_PWA_INSTALL__=async()=>{
      if(!deferredPrompt) return false;
      deferredPrompt.prompt();
      const choice=await deferredPrompt.userChoice.catch(()=>null);
      deferredPrompt=null;
      return choice?.outcome==='accepted';
    };
    document.documentElement.classList.add('pwa-install-available');
  });
  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    document.documentElement.classList.remove('pwa-install-available');
    document.documentElement.classList.add('pwa-installed');
  });
})();
