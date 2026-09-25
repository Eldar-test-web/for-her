/* Gift opens on scroll — nothing is locked behind a click.
   Every candle dies on its own: hover/touch one flame and only it goes out. */
(function(){
  const box=document.getElementById('gift-box');
  if(box){
    // opens by itself as she arrives
    new IntersectionObserver((es,obs)=>es.forEach(e=>{
      if(e.isIntersecting){ box.classList.add('open'); box.setAttribute('aria-hidden','true'); obs.disconnect(); }
    }),{threshold:0.45}).observe(box);
    // optional: touching it breathes the light, never required
    box.addEventListener('click',()=>{
      box.classList.toggle('open');
      try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}
    });
  }
  const units=[...document.querySelectorAll('.candle-unit')];
  const line=document.getElementById('wish-line');
  function checkAll(){
    if(units.length && units.every(u=>u.dataset.out==='1')) line?.classList.add('kept');
  }
  units.forEach(u=>{
    const fl=u.querySelector('.flame'), sm=u.querySelector('.smoke'), ha=u.querySelector('.halo');
    function out(){
      if(!fl || u.dataset.out==='1') return;
      u.dataset.out='1';
      fl.classList.add('out'); sm?.classList.add('show');
      if(ha) ha.style.opacity='0'; // its light goes with it — no exceptions
      try{navigator.vibrate&&navigator.vibrate(10)}catch(e){}
      checkAll();
    }
    u.addEventListener('pointerenter',out);          // mouse passes over → only this one
    u.querySelector('.flame-wrap')?.addEventListener('click',out); // touch: tap the flame
  });
})();
