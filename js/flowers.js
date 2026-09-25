/* Premium dark roses, built petal by petal in code.
   Layered cups, rim light, veined leaves, thorned stems, dew. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const root=document.getElementById('flower-root');
  if(!root) return;
  const svg=document.getElementById('flower-svg');
  let seed=11;
  const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };

  const defs=document.createElementNS(NS,'defs');
  defs.innerHTML=
    `<radialGradient id="petalG" cx="46%" cy="30%" r="80%">`+
    `<stop offset="0%" stop-color="#B05768"/><stop offset="45%" stop-color="#732739"/>`+
    `<stop offset="80%" stop-color="#3E1620"/><stop offset="100%" stop-color="#220C12"/></radialGradient>`+
    `<radialGradient id="deepG" cx="50%" cy="35%" r="80%">`+
    `<stop offset="0%" stop-color="#7C3040"/><stop offset="60%" stop-color="#471824"/>`+
    `<stop offset="100%" stop-color="#1C090E"/></radialGradient>`+
    `<radialGradient id="coreG" cx="50%" cy="42%" r="72%">`+
    `<stop offset="0%" stop-color="#D98A97"/><stop offset="55%" stop-color="#7E2F3F"/>`+
    `<stop offset="100%" stop-color="#2A0E14"/></radialGradient>`+
    `<linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">`+
    `<stop offset="0%" stop-color="#3A4D2D"/><stop offset="100%" stop-color="#141B11"/></linearGradient>`;
  svg.insertBefore(defs, root);

  function E(n,attrs,parent){
    const e=document.createElementNS(NS,n);
    for(const k in attrs) e.setAttribute(k,attrs[k]);
    (parent||root).appendChild(e); return e;
  }
  // one cupped petal, base at 0,0 opening upward
  function cup(parent,w,h,fill,stroke,sw){
    E('path',{d:`M0 0 C ${-w} ${-h*0.28} ${-w*0.92} ${-h*0.95} ${-w*0.18} ${-h} `+
      `C ${-w*0.05} ${-h*0.72} ${w*0.05} ${-h*0.72} ${w*0.18} ${-h} `+
      `C ${w*0.92} ${-h*0.95} ${w} ${-h*0.28} 0 0 Z`,
      fill, stroke,'stroke-width':sw,'stroke-linejoin':'round'},parent);
    // fold shadow down the middle
    E('path',{d:`M0 ${-h*0.08} C ${-w*0.1} ${-h*0.4} ${-w*0.08} ${-h*0.7} 0 ${-h*0.9}`,
      fill:'none', stroke:'#160608','stroke-width':Math.max(1,w*0.03), opacity:.55,'stroke-linecap':'round'},parent);
    // rim light along the top edge
    E('path',{d:`M${-w*0.18} ${-h} C ${-w*0.05} ${-h*0.72} ${w*0.05} ${-h*0.72} ${w*0.18} ${-h}`,
      fill:'none', stroke:'#D89AA4','stroke-width':Math.max(1,w*0.022), opacity:.5,'stroke-linecap':'round'},parent);
  }
  function rose(R){
    const g=E('g',{class:'flw'});
    // stem + thorns first (behind)
    E('path',{d:`M0 ${R*0.55} C ${R*0.12} ${R*1.1} ${-R*0.1} ${R*1.5} ${R*0.05} ${R*2.1}`,
      fill:'none', stroke:'#2A3623','stroke-width':R*0.075,'stroke-linecap':'round'},g);
    for(let i=0;i<3;i++){
      const t=0.35+i*0.25, sx=R*0.1*(1-t*1.4), sy=R*(0.55+t*1.4);
      E('path',{d:`M${sx} ${sy} l ${R*0.09} ${-R*0.02} l ${-R*0.05} ${R*0.08} Z`, fill:'#1B2417'},g);
    }
    leaf(g,-R*0.02,R*1.35,R*0.75,-24); leaf(g,R*0.06,R*1.7,R*0.7,30);
    const ring=(n,rr,ww,hh,fill,stroke,off)=>{
      for(let i=0;i<n;i++){
        const a=off+i*360/n+(rnd()-.5)*9;
        const p=E('g',{transform:`rotate(${a.toFixed(1)}) translate(0 ${(-rr).toFixed(1)})`},g);
        cup(p,ww,hh,fill,stroke,Math.max(1,R*0.012));
      }
    };
    ring(6,R*0.30,R*0.46,R*0.95,'url(#deepG)','#1A070C',8);   // back cups
    ring(5,R*0.26,R*0.40,R*0.78,'url(#petalG)','#2A0D13',44);  // mid cups
    ring(4,R*0.20,R*0.30,R*0.58,'url(#petalG)','#331019',20);  // inner cups
    // throat shadow + glowing core
    E('ellipse',{cx:0, cy:-R*0.34, rx:R*0.24, ry:R*0.19, fill:'#150608', opacity:.9},g);
    E('ellipse',{cx:0, cy:-R*0.36, rx:R*0.16, ry:R*0.12, fill:'url(#coreG)'},g);
    let d=''; const turns=2.8, steps=52;
    for(let i=0;i<=steps;i++){
      const t=i/steps, a=t*turns*2*Math.PI, r=R*0.02+t*R*0.11;
      d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(-R*0.36+Math.sin(a)*r).toFixed(1);
    }
    E('path',{d, fill:'none', stroke:'#E4A9B2','stroke-width':R*0.028,'stroke-linecap':'round', opacity:.9},g);
    // dew on two outer petals
    [[-R*0.5,-R*0.62],[R*0.55,-R*0.5]].forEach(([x,y])=>{
      E('circle',{cx:x, cy:y, r:R*0.035, fill:'#EBC6CC', opacity:.55},g);
      E('circle',{cx:x-R*0.012, cy:y-R*0.012, r:R*0.012, fill:'#fff', opacity:.8},g);
    });
    return g;
  }
  function leaf(parent,x,y,len,ang){
    const g=E('g',{transform:`translate(${x} ${y}) rotate(${ang})`},parent);
    E('path',{d:`M0 0 C ${len*0.3} ${-len*0.18} ${len*0.7} ${-len*0.2} ${len} 0 `+
      `C ${len*0.7} ${len*0.2} ${len*0.3} ${len*0.18} 0 0 Z`,
      fill:'url(#leafG)', stroke:'#0E130C','stroke-width':1.5},g);
    E('path',{d:`M${len*0.04} 0 L${len*0.94} 0`, stroke:'#4E6039','stroke-width':1.3, opacity:.8},g);
    for(let i=1;i<=3;i++){
      const px=len*0.2*i;
      E('path',{d:`M${px} 0 l ${len*0.12} ${-len*0.09} M${px} 0 l ${len*0.12} ${len*0.09}`,
        stroke:'#3A4A2C','stroke-width':1, opacity:.7},g);
    }
    return g;
  }
  function bud(R){
    const g=E('g',{class:'flw'});
    E('path',{d:`M0 ${R} C ${R*0.15} ${R*1.8} ${-R*0.1} ${R*2.4} ${R*0.05} ${R*3}`,
      fill:'none', stroke:'#2A3623','stroke-width':R*0.16,'stroke-linecap':'round'},g);
    for(let i=0;i<3;i++){
      const a=(i*120+90);
      E('path',{d:`M0 ${R*0.5} Q ${R*0.5} ${R*1.1} ${R*0.2} ${R*1.7} Q 0 ${R*1.15} 0 ${R*0.5}`,
        fill:'#22301E', transform:`rotate(${a})`},g);
    }
    E('path',{d:`M0 ${-R} C ${R*0.75} ${-R*0.2} ${R*0.6} ${R*0.6} 0 ${R*0.9} `+
      `C ${-R*0.6} ${R*0.6} ${-R*0.75} ${-R*0.2} 0 ${-R} Z`,
      fill:'url(#petalG)', stroke:'#5A1E2B','stroke-width':R*0.05},g);
    E('path',{d:`M0 ${-R*0.8} C ${R*0.3} ${-R*0.2} ${R*0.28} ${R*0.4} 0 ${R*0.7}`,
      fill:'none', stroke:'#D89AA4','stroke-width':R*0.04, opacity:.6,'stroke-linecap':'round'},g);
    return g;
  }
  // build-then-place (tilt baked in, sway via CSS on wrapper)
  function bloom(kind,R,x,y,s,dur,tilt){
    const g=(kind==='bud'?bud(R):rose(R));
    const wrap=E('g',{transform:`translate(${x} ${y}) rotate(${tilt}) scale(${s})`});
    wrap.appendChild(g);
    wrap.setAttribute('class','flw-sway');
    wrap.style.animationDuration=dur+'s';
    root.appendChild(wrap);
  }
  bloom('rose',150, 175, 300, 1, 9, -10);
  bloom('rose',130, 1290, 430, 1, 11, 8);
  bloom('rose',95, 205, 745, 0.95, 10, 5);
  bloom('bud',34, 1130, 130, 1, 8, 12);
  bloom('bud',30, 1235, 765, 1, 9, -8);
  // trailing vine across the top
  const v=E('g',{class:'flw-sway'}); v.style.animationDuration='12s'; root.appendChild(v);
  E('path',{d:'M560 -10 C 700 50, 830 20, 960 55 C 1040 75, 1100 60, 1180 80',
    fill:'none', stroke:'#2A3623','stroke-width':5,'stroke-linecap':'round'},v);
  [[660,32,60,-15],[770,38,68,12],[880,48,62,-8],[985,62,70,10],[1090,66,58,-12]].forEach(([x,y,l,a])=>leaf(v,x,y,l,a));
})();
