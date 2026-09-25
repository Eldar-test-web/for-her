/* Dark roses climbing on winding vines + lilies for the finale.
   Every bloom grows out of a vine; the rose heart sits dead-centre. */
(function(){
  const NS='http://www.w3.org/2000/svg';
  let seed=23;
  const rnd=()=>{ seed=(seed*1664525+1013904223)>>>0; return seed/4294967296; };
  function E(n,attrs,parent){
    const e=document.createElementNS(NS,n);
    for(const k in attrs) e.setAttribute(k,attrs[k]);
    parent.appendChild(e); return e;
  }
  function defsFor(svg,root){
    const defs=document.createElementNS(NS,'defs');
    defs.innerHTML=
      `<radialGradient id="petalG" cx="46%" cy="30%" r="80%">`+
      `<stop offset="0%" stop-color="#B05768"/><stop offset="45%" stop-color="#732739"/>`+
      `<stop offset="80%" stop-color="#3E1620"/><stop offset="100%" stop-color="#220C12"/></radialGradient>`+
      `<radialGradient id="deepG" cx="50%" cy="35%" r="80%">`+
      `<stop offset="0%" stop-color="#7C3040"/><stop offset="60%" stop-color="#471824"/>`+
      `<stop offset="100%" stop-color="#1C090E"/></radialGradient>`+
      `<radialGradient id="coreG" cx="50%" cy="50%" r="65%">`+
      `<stop offset="0%" stop-color="#E29AA5"/><stop offset="55%" stop-color="#7E2F3F"/>`+
      `<stop offset="100%" stop-color="#2A0E14"/></radialGradient>`+
      `<linearGradient id="leafG" x1="0" y1="0" x2="1" y2="1">`+
      `<stop offset="0%" stop-color="#3A4D2D"/><stop offset="100%" stop-color="#141B11"/></linearGradient>`+
      `<radialGradient id="lilyG" cx="50%" cy="30%" r="85%">`+
      `<stop offset="0%" stop-color="#EFD9CC"/><stop offset="45%" stop-color="#C08388"/>`+
      `<stop offset="80%" stop-color="#5E2233"/><stop offset="100%" stop-color="#2A1016"/></radialGradient>`;
    svg.insertBefore(defs, root);
  }

  // one cupped petal, base at 0,0 opening upward
  function cup(parent,w,h,fill,stroke){
    E('path',{d:`M0 0 C ${-w} ${-h*0.28} ${-w*0.92} ${-h*0.95} ${-w*0.18} ${-h} `+
      `C ${-w*0.05} ${-h*0.72} ${w*0.05} ${-h*0.72} ${w*0.18} ${-h} `+
      `C ${w*0.92} ${-h*0.95} ${w} ${-h*0.28} 0 0 Z`,
      fill, stroke,'stroke-width':Math.max(1,w*0.03),'stroke-linejoin':'round'},parent);
    E('path',{d:`M0 ${-h*0.08} C ${-w*0.1} ${-h*0.4} ${-w*0.08} ${-h*0.7} 0 ${-h*0.9}`,
      fill:'none', stroke:'#160608','stroke-width':Math.max(1,w*0.03), opacity:.55,'stroke-linecap':'round'},parent);
    E('path',{d:`M${-w*0.18} ${-h} C ${-w*0.05} ${-h*0.72} ${w*0.05} ${-h*0.72} ${w*0.18} ${-h}`,
      fill:'none', stroke:'#D89AA4','stroke-width':Math.max(1,w*0.022), opacity:.5,'stroke-linecap':'round'},parent);
  }
  // rose heart — concentric, exactly centred on (0,0) of its group
  function roseHeart(parent,R){
    const c=E('g',{transform:`translate(0 ${-R*0.34})`},parent);
    const ring=(n,rr,ww,hh,fill,stroke,off)=>{
      for(let i=0;i<n;i++){
        const p=E('g',{transform:`rotate(${(off+i*360/n+(rnd()-.5)*8).toFixed(1)}) translate(0 ${(-rr).toFixed(1)})`},c);
        cup(p,ww,hh,fill,stroke);
      }
    };
    ring(6,R*0.30,R*0.46,R*0.95,'url(#deepG)','#1A070C',8);
    ring(5,R*0.26,R*0.40,R*0.78,'url(#petalG)','#2A0D13',44);
    ring(4,R*0.20,R*0.30,R*0.58,'url(#petalG)','#331019',20);
    E('ellipse',{cx:0, cy:0, rx:R*0.24, ry:R*0.19, fill:'#150608', opacity:.92},c);
    E('ellipse',{cx:0, cy:0, rx:R*0.155, ry:R*0.12, fill:'url(#coreG)'},c);
    let d=''; const turns=2.8, steps=52;
    for(let i=0;i<=steps;i++){
      const t=i/steps, a=t*turns*2*Math.PI, r=R*0.018+t*R*0.105;
      d+=(i?'L':'M')+(Math.cos(a)*r).toFixed(1)+' '+(Math.sin(a)*r).toFixed(1);
    }
    E('path',{d, fill:'none', stroke:'#EFB9C1','stroke-width':R*0.026,'stroke-linecap':'round', opacity:.92},c);
    E('circle',{cx:-R*0.045, cy:-R*0.045, r:R*0.02, fill:'#fff', opacity:.85},c);
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
  }
  function G(){ return document.createElementNS(NS,'g'); }
  // open bloom (no stem — it grows on a vine)
  function bloom(R){
    const g=G();
    roseHeart(g,R);
    [[-R*0.52,-R*0.96],[R*0.56,-R*0.84]].forEach(([x,y])=>{
      E('circle',{cx:x, cy:y, r:R*0.034, fill:'#EBC6CC', opacity:.55},g);
      E('circle',{cx:x-R*0.012, cy:y-R*0.012, r:R*0.012, fill:'#fff', opacity:.8},g);
    });
    return g;
  }
  function bud(R){
    const g=G();
    for(let i=0;i<3;i++){
      E('path',{d:`M0 ${R*0.5} Q ${R*0.5} ${R*1.1} ${R*0.2} ${R*1.7} Q 0 ${R*1.15} 0 ${R*0.5}`,
        fill:'#22301E', transform:`rotate(${i*120+90})`},g);
    }
    E('path',{d:`M0 ${-R} C ${R*0.75} ${-R*0.2} ${R*0.6} ${R*0.6} 0 ${R*0.9} `+
      `C ${-R*0.6} ${R*0.6} ${-R*0.75} ${-R*0.2} 0 ${-R} Z`,
      fill:'url(#petalG)', stroke:'#5A1E2B','stroke-width':R*0.05},g);
    E('path',{d:`M0 ${-R*0.8} C ${R*0.3} ${-R*0.2} ${R*0.28} ${R*0.4} 0 ${R*0.7}`,
      fill:'none', stroke:'#D89AA4','stroke-width':R*0.04, opacity:.6,'stroke-linecap':'round'},g);
    return g;
  }
  // different flower for the ending: deep blush lily
  function lily(R){
    const g=G();
    for(let i=0;i<6;i++){
      const p=E('g',{transform:`rotate(${i*60+(rnd()-.5)*6}) translate(0 ${-R*0.12})`},g);
      const w=R*0.30, h=R*0.95;
      E('path',{d:`M0 0 C ${-w} ${-h*0.35} ${-w*0.62} ${-h*0.8} 0 ${-h} `+
        `C ${w*0.62} ${-h*0.8} ${w} ${-h*0.35} 0 0 Z`,
        fill:'url(#lilyG)', stroke:'#33101A','stroke-width':Math.max(1,R*0.014)},p);
      for(let s=0;s<5;s++){
        E('circle',{cx:(rnd()-.5)*w*0.9, cy:-h*(0.25+rnd()*0.5), r:R*0.016,
          fill:'#4A1622', opacity:.65},p);
      }
    }
    for(let i=0;i<5;i++){
      const a=i*72+12, rad=a*Math.PI/180, x2=Math.cos(rad)*R*0.62, y2=Math.sin(rad)*R*0.62;
      E('line',{x1:0, y1:0, x2:x2.toFixed(1), y2:y2.toFixed(1), stroke:'#D8C9A8','stroke-width':R*0.025,'stroke-linecap':'round'},g);
      E('ellipse',{cx:x2.toFixed(1), cy:y2.toFixed(1), rx:R*0.05, ry:R*0.028, fill:'#8B4A2B',
        transform:`rotate(${a} ${x2.toFixed(1)} ${y2.toFixed(1)})`},g);
    }
    E('circle',{cx:0, cy:0, r:R*0.06, fill:'#EBD9C8'},g);
    return g;
  }
  // second flower type for the ending: loose blush peony
  function peony(R){
    const g=G();
    const layer=(n,rr,wr,hr,off)=>{
      for(let i=0;i<n;i++){
        const p=E('g',{transform:`rotate(${(off+i*360/n+(rnd()-.5)*10).toFixed(1)}) translate(0 ${(-rr).toFixed(1)})`},g);
        E('ellipse',{cx:0, cy:-hr*0.4, rx:wr, ry:hr, fill:'url(#petalG)',
          stroke:'#2A0D13','stroke-width':Math.max(1,R*0.012)},p);
      }
    };
    layer(9,R*0.42,R*0.30,R*0.44,5);
    layer(7,R*0.30,R*0.26,R*0.38,30);
    layer(5,R*0.18,R*0.20,R*0.30,12);
    for(let i=0;i<12;i++){
      const a=rnd()*Math.PI*2, r=rnd()*R*0.14;
      E('circle',{cx:(Math.cos(a)*r).toFixed(1), cy:(-R*0.1+Math.sin(a)*r).toFixed(1),
        r:R*0.028, fill:'#E3C9A0'},g);
    }
    E('circle',{cx:0, cy:-R*0.1, r:R*0.05, fill:'#7E2F3F'},g);
    return g;
  }
  // tiny blossom sprig
  function sprig(len){
    const g=G();
    E('path',{d:`M0 0 Q 6 ${-len*0.5} 0 ${-len}`, fill:'none',
      stroke:'#2E3D26','stroke-width':2.5,'stroke-linecap':'round'},g);
    [[0.35,-1],[0.55,1],[0.75,-1],[1,0]].forEach(([t,s])=>{
      const bx=s*8, by=-len*t;
      for(let i=0;i<5;i++){
        const a=i*72;
        E('circle',{cx:(bx+Math.cos(a*Math.PI/180)*4.5).toFixed(1),
          cy:(by+Math.sin(a*Math.PI/180)*4.5).toFixed(1), r:3.4, fill:'#8B3A48'},g);
      }
      E('circle',{cx:bx, cy:by, r:2.6, fill:'#E3C9A0'},g);
    });
    return g;
  }
  function swayWrap(parent,x,y,tilt,s,dur){
    const w=E('g',{transform:`translate(${x} ${y}) rotate(${tilt}) scale(${s})`, class:'flw-sway'},parent);
    w.style.animationDuration=dur+'s';
    return w;
  }

  // ---------- main field: two intertwining vines ----------
  const svg=document.getElementById('flower-svg'), root=document.getElementById('flower-root');
  if(svg&&root){
    defsFor(svg,root);
    // vine A: top-left → down → across
    const vA=E('path',{d:'M-20 120 C 220 150, 330 330, 310 520 C 295 670, 380 760, 470 860',
      fill:'none', stroke:'#2C3A24','stroke-width':6,'stroke-linecap':'round'},root);
    // vine B: right → up, crossing A
    const vB=E('path',{d:'M1460 640 C 1240 620, 1150 430, 1200 260 C 1230 150, 1130 90, 1060 30',
      fill:'none', stroke:'#2C3A24','stroke-width':6,'stroke-linecap':'round'},root);
    // leaves + blooms along the vines via real path geometry
    [[vA,[0.08,0.22,0.36,0.5,0.64,0.78,0.9]],[vB,[0.1,0.25,0.4,0.55,0.7,0.85]]].forEach(([path,ts],vi)=>{
      const L=path.getTotalLength();
      ts.forEach((t,i)=>{
        const p=path.getPointAtLength(t*L), q=path.getPointAtLength(Math.min(L,(t+0.01)*L));
        const ang=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
        leaf(root,p.x,p.y,52+(i%3)*10,ang+(i%2?38:-38)+(vi?-14:0));
      });
    });
    const La=vA.getTotalLength(), Lb=vB.getTotalLength();
    const at=(path,L,t)=>{ const p=path.getPointAtLength(t*L); return [p.x,p.y]; };
    // blooms grow out of vine A — each turned a different way
    let [ax1,ay1]=at(vA,La,0.22); swayWrap(root,ax1-46,ay1-40,-22,1.05,9).appendChild(bloom(110));
    let [ax2,ay2]=at(vA,La,0.45); swayWrap(root,ax2+42,ay2-38,14,0.9,10).appendChild(bloom(88));
    let [ax4,ay4]=at(vA,La,0.58); swayWrap(root,ax4-40,ay4-30,-6,0.7,7).appendChild(bloom(66));
    let [ax3,ay3]=at(vA,La,0.82); swayWrap(root,ax3+34,ay3-34,24,0.5,8).appendChild(bud(30));
    // blooms grow out of vine B
    let [bx1,by1]=at(vB,Lb,0.28); swayWrap(root,bx1+44,by1-40,18,1,11).appendChild(bloom(104));
    let [bx3,by3]=at(vB,Lb,0.52); swayWrap(root,bx3-42,by3-36,-14,0.75,9).appendChild(bloom(72));
    let [bx2,by2]=at(vB,Lb,0.74); swayWrap(root,bx2+30,by2-30,30,0.55,9).appendChild(bud(32));
    let [bx4,by4]=at(vB,Lb,0.90); swayWrap(root,bx4-24,by4-24,-26,0.45,10).appendChild(bud(24));
    // a third shoot, bottom-right
    const vC=E('path',{d:'M1470 905 C 1360 880, 1310 800, 1330 720',
      fill:'none', stroke:'#2C3A24','stroke-width':5,'stroke-linecap':'round'},root);
    const Lc=vC.getTotalLength();
    [0.3,0.6].forEach((t,i)=>{
      const p=vC.getPointAtLength(t*Lc);
      leaf(root,p.x,p.y,50,i?-30:28);
    });
    const pc=vC.getPointAtLength(0.85*Lc);
    swayWrap(root,pc.x-10,pc.y-40,12,0.8,8).appendChild(bloom(78));
    // extra blooms on the tall vines
    let [ax6,ay6]=at(vA,La,0.08); swayWrap(root,ax6+40,ay6-36,20,0.6,10).appendChild(bloom(64));
    let [bx5,by5]=at(vB,Lb,0.55); swayWrap(root,bx5-40,by5-30,-20,0.6,8).appendChild(bloom(62));
    // vine E: hanging from the top, right of centre
    const vE=E('path',{d:'M900 -20 C 880 140, 950 280, 920 430 C 905 520, 940 590, 925 660',
      fill:'none', stroke:'#2C3A24','stroke-width':5,'stroke-linecap':'round'},root);
    const Le=vE.getTotalLength();
    [0.25,0.5,0.75].forEach((t,i)=>{
      const p=vE.getPointAtLength(t*Le);
      leaf(root,p.x,p.y,50,i%2?30:-28);
    });
    const atE=(t)=>{ const p=vE.getPointAtLength(t*Le); return [p.x,p.y]; };
    let [ex1,ey1]=atE(0.38); swayWrap(root,ex1-42,ey1-36,-18,0.85,9).appendChild(bloom(84));
    let [ex2,ey2]=atE(0.68); swayWrap(root,ex2+40,ey2-32,16,0.7,10).appendChild(bloom(68));
    let [ex3,ey3]=atE(0.90); swayWrap(root,ex3-6,ey3-26,-6,0.5,8).appendChild(bud(26));
    // vine F: left diagonal
    const vF=E('path',{d:'M-20 380 C 140 400, 260 320, 400 360 C 470 378, 530 360, 600 375',
      fill:'none', stroke:'#2C3A24','stroke-width':5,'stroke-linecap':'round'},root);
    const Lf=vF.getTotalLength();
    [0.3,0.65].forEach((t,i)=>{
      const p=vF.getPointAtLength(t*Lf);
      leaf(root,p.x,p.y,52,i?32:-30);
    });
    const atF=(t)=>{ const p=vF.getPointAtLength(t*Lf); return [p.x,p.y]; };
    let [fx1,fy1]=atF(0.45); swayWrap(root,fx1,fy1-40,22,0.8,11).appendChild(bloom(76));
    let [fx2,fy2]=atF(0.80); swayWrap(root,fx2+30,fy2-28,-20,0.5,9).appendChild(bud(26));
    // trailing shoot across the top
    const vT=E('path',{d:'M560 -10 C 700 50, 830 20, 960 55 C 1040 75, 1100 60, 1180 80',
      fill:'none', stroke:'#2A3623','stroke-width':5,'stroke-linecap':'round'},root);
    const Lt=vT.getTotalLength();
    [0.15,0.38,0.6,0.82].forEach((t,i)=>{
      const p=vT.getPointAtLength(t*Lt);
      leaf(root,p.x,p.y,56+(i%2)*10,i%2?14:-12);
    });
  }

  // ---------- ending: intertwined vines, three kinds of flowers ----------
  const esvg=document.getElementById('end-svg'), eroot=document.getElementById('end-root');
  if(esvg&&eroot){
    defsFor(esvg,eroot);
    E('path',{d:'M-20 290 C 300 250, 600 300, 900 265 C 1100 245, 1280 270, 1460 250',
      fill:'none', stroke:'#2C3A24','stroke-width':5,'stroke-linecap':'round'},eroot);
    E('path',{d:'M-20 310 C 250 275, 550 315, 850 280 C 1050 260, 1250 290, 1460 270',
      fill:'none', stroke:'#26331F','stroke-width':3.5,'stroke-linecap':'round'},eroot);
    [[180,225,74,-14],[420,195,88,8],[640,175,94,-4],[880,185,86,12],[1100,200,80,16],[1300,225,70,-18]].forEach(([x,y,R,tilt],i)=>{
      const w=swayWrap(eroot,x,y,tilt,1,8+i*1.1);
      E('path',{d:`M0 40 C 6 90, -4 120, 2 160`, stroke:'#2A3623','stroke-width':6,
        fill:'none','stroke-linecap':'round'},w);
      const b=G(); w.appendChild(b); b.appendChild(lily(R));
      leaf(w,-26,96,52,-32); leaf(w,26,110,48,30);
    });
    // blush peonies between the lilies
    [[530,240,56,10],[970,235,60,-12]].forEach(([x,y,R,tilt],i)=>{
      const w=swayWrap(eroot,x,y,tilt,1,9+i*1.4);
      E('path',{d:`M0 30 C -4 70, 4 100, 0 130`, stroke:'#2A3623','stroke-width':5,
        fill:'none','stroke-linecap':'round'},w);
      const b=G(); w.appendChild(b); b.appendChild(peony(R));
      leaf(w,-22,80,46,-30); leaf(w,22,92,42,28);
    });
    // blossom sprigs rising between
    [[300,290,90,-8],[750,295,100,6],[1200,290,92,10]].forEach(([x,y,s,tilt],i)=>{
      const w=swayWrap(eroot,x,y,tilt,1,7+i);
      w.appendChild(sprig(s));
    });
    const wb=swayWrap(eroot,120,255,16,0.8,7); wb.appendChild(bud(26));
    const wb2=swayWrap(eroot,1360,250,-16,0.8,8); wb2.appendChild(bud(26));
  }
})();
