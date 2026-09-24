// Scroll reveals, verse progression, nav hide, cursor glow, magnetic buttons
(function(){
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.2});
  document.querySelectorAll('.reveal,.reveal-line,.why-grid article').forEach(el=>{el.classList.add('reveal');io.observe(el)});

  const verses=[...document.querySelectorAll('.verse')];
  const num=document.getElementById('verse-num');
  const vio=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){e.target.classList.add('active');
      const i=verses.indexOf(e.target);
      if(num) num.textContent=String(i+1).padStart(2,'0');
    } else if(e.boundingClientRect.top>0){e.target.classList.remove('active')}
  }),{threshold:.55});
  verses.forEach(v=>vio.observe(v));

  // nav active + auto-hide while reading
  const links=[...document.querySelectorAll('#story-nav a')];
  const secs=['beginning','you','why','gift','before-you-go'].map(id=>document.getElementById(id));
  const sio=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){links.forEach(l=>l.classList.toggle('active',l.dataset.sec===e.target.id))}
  }),{rootMargin:'-40% 0px -55% 0px'});
  secs.forEach(s=>s&&sio.observe(s));
  let t; addEventListener('scroll',()=>{
    document.body.classList.add('reading');clearTimeout(t);
    t=setTimeout(()=>document.body.classList.remove('reading'),1400);
  },{passive:true});

  // cursor glow
  const glow=document.getElementById('cursor-glow');
  let gx=innerWidth/2,gy=200,tx=gx,ty=gy;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY},{passive:true});
  (function loop(){gx+=(tx-gx)*.06;gy+=(ty-gy)*.06;
    if(glow) glow.style.transform=`translate(${gx-260}px,${gy-260}px)`;requestAnimationFrame(loop)})();

  // magnetic buttons
  document.querySelectorAll('.btn,#heart-btn,#wish-btn').forEach(b=>{
    b.addEventListener('pointermove',e=>{
      const r=b.getBoundingClientRect();
      const x=(e.clientX-r.left-r.width/2)*.12, y=(e.clientY-r.top-r.height/2)*.18;
      b.style.translate=`${x}px ${y}px`;
    });
    b.addEventListener('pointerleave',()=>b.style.translate='0px 0px');
  });
  document.getElementById('year').textContent=new Date().getFullYear();
  setTimeout(()=>document.getElementById('loader').classList.add('done'),900);
})();
