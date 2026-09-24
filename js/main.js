// Back-to-top drifts home quietly. Nothing else needs a handler:
// the story is scroll; the heart answers touch itself; the gift and cake play on their own.
document.getElementById('to-top')?.addEventListener('click',e=>{
  e.preventDefault();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollTo({top:0,behavior:reduced?'auto':'smooth'});
});
