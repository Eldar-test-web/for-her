// Gift open + candle wish
(function(){
  const box=document.getElementById('gift-box');
  const letter=document.getElementById('gift-letter');
  if(box) box.addEventListener('click',()=>{
    const open=box.classList.toggle('open');
    box.setAttribute('aria-expanded',String(open));
    box.querySelector('.gift-hint').textContent=open?'':'open';
    if(open&&letter){letter.hidden=false;letter.animate(
      [{opacity:0,transform:'translateY(14px)',filter:'blur(6px)'},{opacity:1,transform:'none',filter:'none'}],
      {duration:1100,easing:'ease',fill:'both'});letter.scrollIntoView({behavior:'smooth',block:'nearest'});}
  });
  const wish=document.getElementById('wish-btn');
  const flame=document.getElementById('flame');
  const smoke=document.getElementById('smoke');
  const line=document.getElementById('wish-line');
  if(wish) wish.addEventListener('click',()=>{
    flame.classList.add('out'); smoke.classList.add('show');
    wish.disabled=true; wish.textContent='wish kept';
    wish.style.opacity=.5;
    if(line){line.hidden=false;line.animate(
      [{opacity:0,filter:'blur(8px)'},{opacity:1,filter:'none'}],{duration:1600,fill:'both'});
      try{navigator.vibrate&&navigator.vibrate(20)}catch(e){}
    }
  },{once:false});
})();
