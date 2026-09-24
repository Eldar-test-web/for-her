/* Scroll-only story. No buttons reveal love content. Scrolling is the interaction. */
(function(){
  const C = window.CONTENT || {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  }),{threshold:0.2, rootMargin:'0px 0px -8% 0px'});

  function watch(root){ root.querySelectorAll('.reveal,.reveal-line,.thought,.notice-line,.frag,.poem,.why-line,.never-line,.plain-line,.mill-line').forEach(el=>io.observe(el)); }
  watch(document);

  function el(tag, cls, text){ const d=document.createElement(tag); if(cls)d.className=cls; if(text!=null)d.textContent=text; return d; }

  // 02 — long editorial scroll of thoughts, varied rhythm, no numbers
  const sizes=['size-xl','size-md','size-lg','size-sm','size-lg','size-md','size-xl','size-sm','size-md','size-lg'];
  const aligns=['align-center','align-left','align-center','align-right','align-left','align-center','align-right','align-center','align-left','align-center'];
  const thoughts=document.getElementById('thoughts');
  [...(C.legacy19||[]),...(C.sequencer||[])].forEach((t,i)=>{
    const a=el('article','thought '+sizes[i%sizes.length]+' '+aligns[(i*3+1)%aligns.length]);
    a.appendChild(el('p','',t));
    thoughts?.appendChild(a);
  });

  // 03 — noticing lines
  const noticings=document.getElementById('noticings');
  (C.noticings||[]).forEach((t,i)=>{
    const p=el('p','notice-line'+(i%2?' off':''),t);
    noticings?.appendChild(p);
  });

  // 04 — fragments + poems in flow
  const fr=document.getElementById('frag-row');
  (C.fragments||[]).forEach(f=>fr?.appendChild(el('span','frag',f)));
  const pf=document.getElementById('poems-flow');
  (C.poems||[]).forEach(p=>{
    const a=el('article','poem');
    a.appendChild(el('h3','serif',p.title));
    p.lines.forEach(l=>a.appendChild(el('p','',l)));
    pf?.appendChild(a);
  });

  // 05 — why, shallow to deep as written
  const wf=document.getElementById('why-flow');
  (C.why||[]).forEach(t=>wf?.appendChild(el('p','why-line',t)));

  // 07/08 — quiet plain lines
  const ol=document.getElementById('ordinary-list');
  (C.ordinary||[]).forEach(t=>ol?.appendChild(el('p','plain-line',t)));
  const ml=document.getElementById('memory-list');
  (C.memories||[]).forEach(t=>ml?.appendChild(el('p','plain-line dim-line',t)));

  // 09
  const nf=document.getElementById('never-flow');
  (C.neverEnough||[]).forEach(t=>nf?.appendChild(el('p','never-line',t)));

  // 10 — final poem
  const fp=document.getElementById('final-poem-lines');
  if(fp) (C.finalPoem||[]).forEach(l=>fp.appendChild(el('p','',l)));

  watch(document);

  // faint cursor warmth (desktop only, subtle)
  const glow=document.getElementById('cursor-glow');
  if(glow && matchMedia('(pointer:fine)').matches){
    let gx=innerWidth/2,gy=200,tx=gx,ty=gy;
    addEventListener('pointermove',e=>{tx=e.clientX;ty=e.clientY},{passive:true});
    (function loop(){gx+=(tx-gx)*0.05;gy+=(ty-gy)*0.05;glow.style.transform=`translate(${gx-260}px,${gy-260}px)`;requestAnimationFrame(loop)})();
  } else if(glow){ glow.style.display='none'; }

  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  setTimeout(()=>document.getElementById('loader')?.classList.add('done'),900);
})();
