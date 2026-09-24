/* Gift opens on scroll — nothing is locked behind a click.
   Cake plays its quiet scene on scroll. Touching the objects is optional delight only. */
(function(){
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  const flame=document.getElementById('flame'), smoke=document.getElementById('smoke'),
        line=document.getElementById('wish-line'), cake=document.querySelector('.cake');
  let out=false;
  function blowOut(){
    if(out||!flame) return; out=true;
    flame.classList.add('out'); smoke?.classList.add('show');
    line?.classList.add('kept');
    try{navigator.vibrate&&navigator.vibrate(15)}catch(e){}
  }
  if(cake){
    // scene plays itself: lit while she reads, then the wish is kept
    new IntersectionObserver((es,obs)=>es.forEach(e=>{
      if(e.isIntersecting && !reduced){ setTimeout(blowOut, 7000); obs.disconnect(); }
      else if(e.isIntersecting && reduced){ blowOut(); obs.disconnect(); }
    }),{threshold:0.5}).observe(cake);
    flame?.addEventListener('click',blowOut); // optional early wish
  }
})();
