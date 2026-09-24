/* Dark red roses + vines, generated in code. Fixed behind the story —
   visible at the edges, never over the words. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  const root=document.getElementById('rose-root');
  if(!root) return;
  const svg=document.getElementById('rose-svg');

  const defs=document.createElementNS(NS,'defs');
  defs.innerHTML=
    `<radialGradient id="petalG" cx="42%" cy="38%" r="75%">`+
    `<stop offset="0%" stop-color="#7A2E3E"/><stop offset="55%" stop-color="#552030"/>`+
    `<stop offset="100%" stop-color="#2E1219"/></radialGradient>`+
    `<radialGradient id="innerG" cx="50%" cy="45%" r="70%">`+
    `<stop offset="0%" stop-color="#9A5563"/><stop offset="60%" stop-color="#63273A"/>`+
    `<stop offset="100%" stop-color="#33141D"/></radialGradient>`;
  svg.insertBefore(defs, root);

  function E(n,attrs,parent){
    const e=document.createElementNS(NS,n);
    for(const k in attrs) e.setAttribute(k,attrs[k]);
    (parent||root).appendChild(e); return e;
  }
  // open rose, centred on 0,0
  function rose(R){
    const g=E('g',{class:'rose'});
    // sepals
    for(let i=0;i<3;i++){
      const a=i*120+30;
      E('path',{d:`M0 ${R*0.5} Q ${R*0.28} ${R*0.95} ${R*0.12} ${R*1.35} Q ${R*0.02} ${R*0.95} 0 ${R*0.5}`,
        fill:'#22301E', opacity:.9, transform:`rotate(${a})`},g);
    }
    // outer petals
    for(let i=0;i<5;i++){
      const a=i*72;
      E('ellipse',{cx:0, cy:-R*0.52, rx:R*0.44, ry:R*0.62, fill:'url(#petalG)',
        stroke:'#8B3A48','stroke-width':R*0.02, transform:`rotate(${a})`},g);
    }
    // mid petals
    for(let i=0;i<5;i++){
      const a=i*72+36;
      E('ellipse',{cx:0, cy:-R*0.34, rx:R*0.32, ry:R*0.44, fill:'url(#petalG)',
        stroke:'#7A2E3E','stroke-width':R*0.015, transform:`rotate(${a})`},g);
    }
    // inner cup
    E('ellipse',{cx:0, cy:-R*0.12, rx:R*0.26, ry:R*0.3, fill:'url(#innerG)'},g);
    // spiral heart of the bloom
    let d=''; const turns=2.6, steps=46;
    for(let i=0;i<=steps;i++){
      const t=i/steps, a=t*turns*2*Math.PI, r=R*0.05+t*R*0.2;
      d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(-R*0.1+Math.sin(a)*r).toFixed(1);
    }
    E('path',{d, fill:'none', stroke:'#C08A94','stroke-width':R*0.045,'stroke-linecap':'round', opacity:.85},g);
    return g;
  }
  function bud(R){
    const g=E('g',{class:'rose bud'});
    E('path',{d:`M0 ${-R} C ${R*0.7} ${-R*0.3} ${R*0.55} ${R*0.5} 0 ${R*0.8} C ${-R*0.55} ${R*0.5} ${-R*0.7} ${-R*0.3} 0 ${-R}`,
      fill:'url(#petalG)', stroke:'#7A2E3E','stroke-width':R*0.06},g);
    E('path',{d:`M0 ${R*0.8} Q ${-R*0.1} ${R*1.3} ${-R*0.5} ${R*1.5} M0 ${R*0.8} Q ${R*0.1} ${R*1.3} ${R*0.5} ${R*1.5}`,
      fill:'none', stroke:'#22301E','stroke-width':R*0.09,'stroke-linecap':'round'},g);
    return g;
  }
  function leaf(x,y,s,flip){
    const g=E('g',{class:'leaf', transform:`translate(${x} ${y}) scale(${flip?-s:s} ${s})`});
    E('path',{d:'M0 0 Q 26 -14 52 -4 Q 30 8 0 0 Z', fill:'#26331F', opacity:.92},g);
    E('path',{d:'M2 -1 Q 28 -8 48 -5', fill:'none', stroke:'#3A4A2E','stroke-width':1.4},g);
    return g;
  }
  function vine(d, leaves){
    E('path',{d, fill:'none', stroke:'#2C3A24','stroke-width':3, opacity:.9,
      'stroke-linecap':'round', class:'vine-stroke'},root);
    leaves.forEach(([x,y,s,f])=>leaf(x,y,s,f));
  }
  function place(g,x,y,s,rot,dur){
    g.setAttribute('transform',`translate(${x} ${y}) rotate(${rot}) scale(${s})`);
    g.style.animationDuration=dur+'s';
  }

  // corners + edges — clear of the centre column where the words live
  place(rose(95), 130, 150, 1, -12, 9);
  place(rose(115), 1320, 340, 1, 10, 11);
  place(rose(85), 150, 770, 0.95, 6, 10);
  place(rose(100), 1305, 790, 1, -8, 12);
  place(bud(30), 1120, 110, 1, 14, 8);
  place(bud(26), 290, 470, 1, -10, 9);

  // climbing vines along the margins
  vine('M40 220 C 90 340, 10 470, 60 600 C 100 700, 50 800, 80 905',
    [[62,330,1.1,0],[40,480,1.2,1],[66,640,1.0,0],[58,780,1.2,1]]);
  vine('M1400 120 C 1350 260, 1420 380, 1370 520 C 1340 610, 1390 680, 1370 760',
    [[1380,250,1.1,1],[1396,420,1.2,0],[1372,580,1.0,1],[1380,700,1.1,0]]);
})();
