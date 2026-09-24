// Reveals, sequencers (one-thought-at-a-time), poems, constellation, nav, glow
(function(){
  const C = window.CONTENT || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // reveal on scroll
  const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.18});
  document.querySelectorAll('.reveal,.reveal-line').forEach(el=>io.observe(el));

  // generic one-at-a-time sequencer
  function sequencer(lineEl,numEl,nextBtn,items,kickerEl,kickerFn){
    let i=0;
    function show(n,animate=true){
      i=(n+items.length)%items.length;
      const apply=()=>{
        lineEl.textContent=items[i];
        if(numEl) numEl.textContent=String(i+1).padStart(2,'0');
        if(kickerEl&&kickerFn) kickerEl.textContent=kickerFn(i);
      };
      if(animate&&!reduced&&lineEl.animate){
        lineEl.animate([{opacity:0,filter:'blur(8px)',transform:'translateY(10px)'},{opacity:1,filter:'none',transform:'none'}],{duration:650,easing:'ease',fill:'both'}).onfinish=apply;
        // apply mid-way for smoothness
        setTimeout(apply,120);
      } else apply();
    }
    nextBtn?.addEventListener('click',()=>show(i+1));
    lineEl.closest('.stage')?.addEventListener('click',e=>{ if(e.target.closest('button'))return; show(i+1); });
    addEventListener('keydown',e=>{
      if(e.key===' '&&lineEl.getBoundingClientRect().top<innerHeight&&lineEl.getBoundingClientRect().bottom>0){e.preventDefault();show(i+1);}
    });
    show(0,false);
    return {show};
  }

  const allThoughts=[...(C.legacy19||[]),...(C.sequencer||[])];
  const tt=document.getElementById('thought-total'); if(tt) tt.textContent=allThoughts.length;
  sequencer(
    document.getElementById('thought-line'),document.getElementById('thought-num'),
    document.getElementById('thought-next'),allThoughts,
    document.getElementById('thought-kicker'),
    i=> i<19 ? `19 / ${String(i+1).padStart(2,'0')} — a first thought` : `deeper · ${String(i+1).padStart(2,'0')} / ${allThoughts.length}`
  );
  const wt=document.getElementById('why-total'); if(wt) wt.textContent=(C.why||[]).length;
  sequencer(document.getElementById('why-line'),document.getElementById('why-num'),document.getElementById('why-next'),C.why||[]);
  sequencer(document.getElementById('never-line'),document.getElementById('never-num'),document.getElementById('never-next'),C.neverEnough||[]);

  // notice grid
  const ng=document.getElementById('notice-grid');
  (C.noticings||[]).forEach((t,i)=>{
    const d=document.createElement('p'); d.className='notice'; d.textContent=t; d.style.transitionDelay=(i*60)+'ms';
    ng?.appendChild(d); if(d) io.observe(d);
  });
  // fragments
  const fr=document.getElementById('frag-row');
  (C.fragments||[]).forEach(f=>{
    const s=document.createElement('span'); s.textContent=f; fr?.appendChild(s);
  });
  // poems tabs
  const tabs=document.querySelector('.poem-tabs'), pt=document.getElementById('poem-title'), pl=document.getElementById('poem-lines');
  function showPoem(i){
    const p=(C.poems||[])[i]; if(!p)return;
    pt.textContent=p.title;
    pl.innerHTML=p.lines.map(l=>`<p>${l}</p>`).join('');
    tabs?.querySelectorAll('button').forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-selected',String(k===i))});
    if(!reduced&&pl.animate) pl.animate([{opacity:0,filter:'blur(6px)'},{opacity:1,filter:'none'}],{duration:600,fill:'both'});
  }
  (C.poems||[]).forEach((p,i)=>{
    const b=document.createElement('button'); b.textContent=p.title; b.setAttribute('role','tab');
    b.addEventListener('click',()=>showPoem(i)); tabs?.appendChild(b);
  });
  showPoem(0);
  // final poem
  const fp=document.getElementById('final-poem-lines');
  if(fp) fp.innerHTML=(C.finalPoem||[]).map(l=>`<p>${l||'&nbsp;'}</p>`).join('');
  // tri lists
  const fill=(id,arr,n)=>{const ul=document.getElementById(id); (arr||[]).slice(0,n).forEach(t=>{const li=document.createElement('li');li.textContent=t;ul?.appendChild(li)})};
  fill('ordinary-list',C.ordinary,8); fill('memory-list',C.memories,8); fill('whatif-list',C.whatif,6);

  // constellation: 36 dots, each a compliment; found counter; faint heart forms
  const field=document.getElementById('const-field'), cline=document.getElementById('const-line'), cc=document.getElementById('const-count');
  const pool=[...(C.legacy19||[]),...(C.sequencer||[])];
  const found=new Set();
  if(field){
    for(let i=0;i<36;i++){
      const b=document.createElement('button');
      // heart-ish distribution: parametric
      const t=(i/36)*Math.PI*2;
      const hx=16*Math.pow(Math.sin(t),3), hy=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
      const px=50+hx*1.55+ (Math.random()-.5)*6, py=46-hy*1.35+(Math.random()-.5)*6;
      b.style.left=px+'%'; b.style.top=py+'%';
      b.setAttribute('aria-label','Reveal compliment '+(i+1));
      const sent=pool[(i*7)%pool.length];
      b.addEventListener('click',()=>{
        cline.textContent=sent; found.add(i);
        b.classList.add('lit'); cc.textContent=found.size;
        if(found.size>=6) field.classList.add('formed');
      });
      field.appendChild(b);
    }
  }

  // nav
  const links=[...document.querySelectorAll('#story-nav a')];
  const secs=['beginning','you','why','gift','before-you-go'].map(id=>document.getElementById(id));
  const sio=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting) links.forEach(l=>l.classList.toggle('active',l.dataset.sec===e.target.id));
  }),{rootMargin:'-40% 0px -55% 0px'});
  secs.forEach(s=>s&&sio.observe(s));
  let t; addEventListener('scroll',()=>{document.body.classList.add('reading');clearTimeout(t);t=setTimeout(()=>document.body.classList.remove('reading'),1400)},{passive:true});

  // cursor glow + magnetic
  const glow=document.getElementById('cursor-glow');
  let gx=innerWidth/2,gy=200,tx= gx,ty=gy;
  addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY},{passive:true});
  (function loop(){gx+=(tx-gx)*.06;gy+=(ty-gy)*.06;if(glow)glow.style.transform=`translate(${gx-260}px,${gy-260}px)`;requestAnimationFrame(loop)})();
  document.querySelectorAll('.btn,#heart-btn,#wish-btn').forEach(b=>{
    b.addEventListener('pointermove',e=>{const r=b.getBoundingClientRect();b.style.translate=`${(e.clientX-r.left-r.width/2)*.12}px ${(e.clientY-r.top-r.height/2)*.18}px`});
    b.addEventListener('pointerleave',()=>b.style.translate='0px 0px');
  });
  document.getElementById('year').textContent=new Date().getFullYear();
  setTimeout(()=>document.getElementById('loader')?.classList.add('done'),900);
})();
