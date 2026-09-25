import * as THREE from 'three';

/* The heart is ONLY text: words on the front face, words on the back,
   words wrapping the rim. No mesh, no silhouette, no glow.
   Remove the three InstancedMeshes below and nothing heart-shaped remains. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 640px)').matches;

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// Classic upright heart: round lobes at top, tapered point at bottom.
function heartOutline(){
  const s=new THREE.Shape(); const x=0,y=0;
  s.moveTo(x+5,y+5);
  s.bezierCurveTo(x+5,y+5,x+4,y,x,y);
  s.bezierCurveTo(x-6,y,x-6,y+7,x-6,y+7);
  s.bezierCurveTo(x-6,y+11,x-3,y+15.4,x+5,y+19);
  s.bezierCurveTo(x+12,y+15.4,x+16,y+11,x+16,y+7);
  s.bezierCurveTo(x+16,y+7,x+16,y,x+10,y);
  s.bezierCurveTo(x+7,y,x+5,y+5,x+5,y+5);
  // centre + scale + flip upright: raw spans x -6..16, y 0..19
  // (wide lobes at low y, tip at high y) → tip to the bottom, lobes on top
  return s.getSpacedPoints(900).map(p=>[(p.x-5)*0.16,(9.5-p.y)*0.16]);
}
function inPoly(px,py,poly){
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const xi=poly[i][0],yi=poly[i][1],xj=poly[j][0],yj=poly[j][1];
    if(((yi>py)!==(yj>py))&&(px<(xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

function wordTexture(word, px=118){
  const c=document.createElement('canvas'); c.width=1024; c.height=192;
  const g=c.getContext('2d');
  g.clearRect(0,0,1024,192);
  g.font=`600 ${px}px Georgia, 'Times New Roman', serif`;
  g.textAlign='center'; g.textBaseline='middle';
  try{ g.letterSpacing='10px'; }catch(e){}
  g.fillStyle='#ffffff';
  g.fillText(word,512,100);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8;
  return t;
}

function webglOK(){
  try{
    const c=document.createElement('canvas');
    return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));
  }catch(e){return false}
}

function build(canvas, { finalMode=false }={}){
  const rand = mulberry32(finalMode? 77 : 7); // same artwork every visit
  const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, isMobile?1.6:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(33,1,.1,100);
  const Z_REST = finalMode? 8.2 : 8.4;
  cam.position.set(0, 0.1, finalMode? 8.2 : 13.5);

  scene.add(new THREE.AmbientLight(0x3a2530, 0.9));
  const key=new THREE.DirectionalLight(0xffd9b0, 1.8); key.position.set(4,6,8); scene.add(key);
  const frontFill=new THREE.DirectionalLight(0xffe9d0, 0.55); frontFill.position.set(-1,0.5,10); scene.add(frontFill);
  const rimL=new THREE.DirectionalLight(0x9a5a64, 0.6); rimL.position.set(-7,2,-6); scene.add(rimL);
  const low=new THREE.DirectionalLight(0x4a202b, 0.5); low.position.set(0,-6,3); scene.add(low);

  const group=new THREE.Group(); scene.add(group);

  // ---- sample the silhouette ----
  const outline=heartOutline();
  let minX=9,maxX=-9,minY=9,maxY=-9;
  outline.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  const DEPTH=1.0; // true volumetric solid: domed faces + full walls + inner body
  const N = isMobile? {front:300, wall:450, back:170, fill:250} : {front:700, wall:1200, back:400, fill:800};

  function facePoints(n, z, dir){
    const pts=[]; let guard=0;
    let ccx=0, ccy=0; outline.forEach(p=>{ccx+=p[0];ccy+=p[1];}); ccx/=outline.length; ccy/=outline.length;
    let maxR=0.001; outline.forEach(p=>{maxR=Math.max(maxR,Math.hypot(p[0]-ccx,p[1]-ccy));});
    const BULGE=0.55; // deep convex cushion — the face curves toward her
    while(pts.length<n && guard<n*60){
      guard++;
      const x=minX+rand()*(maxX-minX), y=minY+rand()*(maxY-minY);
      if(!inPoly(x,y,outline)) continue;
      const dx=(x-ccx)/maxR, dy=(y-ccy)/maxR;
      const r2=Math.min(1,dx*dx+dy*dy);
      const lift=BULGE*(1-r2)*dir;
      pts.push({p:[x+(rand()-.5)*0.03, y+0.1+(rand()-.5)*0.03, z+lift+(rand()-.5)*0.04],
        n:[dx*1.1+(rand()-.5)*0.2, dy*1.1+(rand()-.5)*0.2, dir]});
    }
    return pts;
  }
  // wall rings: the full depth tiled layer by layer, each layer a scaled
  // copy of the verified silhouette — the solid reads from every angle
  function wallPoints(){
    const pts=[]; const layers=isMobile?7:10;
    let cx=0, cy=0; outline.forEach(p=>{cx+=p[0];cy+=p[1];}); cx/=outline.length; cy/=outline.length;
    const step=isMobile?9:6;
    for(let L=0;L<layers;L++){
      const z=-DEPTH+(L+0.5)/layers*DEPTH*2;
      const s=Math.sqrt(Math.max(0.12,1-Math.pow(z/(DEPTH*1.12),2)));
      for(let i=0;i<outline.length;i+=step){
        const o=outline[i];
        const px=cx+(o[0]-cx)*s, py=cy+(o[1]-cy)*s+0.1;
        let nx=o[0]-cx, ny=(o[1]-cy);
        const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
        pts.push({p:[px+nx*0.03, py+ny*0.03, z], t:[-ny,nx], n:[nx,ny,(z/DEPTH)*0.7]});
      }
    }
    return pts;
  }
  // inner body: random-orientation words filling the solid, so oblique
  // views never look hollow — darker, like the inside of the object
  function fillerPoints(n){
    const pts=[];
    let cx=0, cy=0; outline.forEach(p=>{cx+=p[0];cy+=p[1];}); cx/=outline.length; cy/=outline.length;
    let guard=0;
    while(pts.length<n && guard<n*80){
      guard++;
      const z=(rand()*2-1)*DEPTH*0.85;
      const s=Math.sqrt(Math.max(0.1,1-Math.pow(z/(DEPTH*1.12),2)));
      const x=minX+rand()*(maxX-minX), y=minY+rand()*(maxY-minY);
      const ux=cx+(x-cx)/s, uy=cy+(y-cy)/s;
      if(!inPoly(ux,uy,outline)) continue;
      const th=rand()*Math.PI*2, ph=Math.acos(2*rand()-1);
      pts.push({p:[x,y+0.1,z],
        n:[Math.sin(ph)*Math.cos(th),Math.sin(ph)*Math.sin(th),Math.cos(ph)], inner:true});
    }
    return pts;
  }

  const front=facePoints(N.front, DEPTH, 1);
  const back=facePoints(N.back, -DEPTH, -1);
  const wallsAll=wallPoints();
  const walls=wallsAll.filter((_,i)=>i%Math.max(1,Math.round(wallsAll.length/N.wall))===0);
  const filler=fillerPoints(N.fill);

  const texPhrase=wordTexture('I LOVE YOU', 108);

  const M=new THREE.Matrix4();
  const bx=new THREE.Vector3(), by=new THREE.Vector3(), bz=new THREE.Vector3(), P=new THREE.Vector3();
  const ivory=new THREE.Color(0xf7f0e8), rose=new THREE.Color(0x8a5a62),
        champ=new THREE.Color(0xe3c9a0), blush=new THREE.Color(0xd08a94);
  const cc=new THREE.Color();

  // colour-coded words: mostly bright ivory, some champagne, some blush —
  // neighbours differ, so single words can be picked out
  function shade(k, facing, inner){
    if(inner){ cc.setHex(0x6e3a44); return cc; }
    if(facing>=0) cc.copy(rose).lerp(ivory,0.85);
    else cc.copy(rose).multiplyScalar(0.7);
    if(k%7===3) cc.copy(champ);
    else if(k%11===5) cc.copy(blush);
    return cc;
  }
  function fillFace(geo, mat, list, w, h, dir){
    const m=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((s,k)=>{
      bz.set(s.n[0],s.n[1],s.n[2]).normalize();
      const upRef=Math.abs(bz.z)>0.9?new THREE.Vector3(0,1,0):new THREE.Vector3(0,0,1);
      bx.crossVectors(upRef,bz).normalize();
      by.crossVectors(bz,bx).normalize();
      // face words stay upright & readable — tiny tilt only
      const tilt=(rand()-.5)*0.1, c=Math.cos(tilt), si=Math.sin(tilt);
      const ax=bx.clone().multiplyScalar(c).addScaledVector(by,si);
      const ay=by.clone().multiplyScalar(c).addScaledVector(bx,-si);
      const sc=0.9+rand()*0.3, ww=w*sc, hh=h*sc;
      P.set(...s.p);
      M.makeBasis(ax.multiplyScalar(ww), ay.multiplyScalar(hh), bz);
      M.setPosition(P);
      m.setMatrixAt(k,M);
      m.setColorAt(k,shade(k,dir,s.inner));
    });
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor) m.instanceColor.needsUpdate=true;
    m.frustumCulled=false;
    group.add(m);
    return m;
  }
  function fillRim(geo, mat, list, w, h){
    const m=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((s,k)=>{
      bz.set(s.n[0],s.n[1],s.n[2]).normalize();
      bx.set(s.t[0],s.t[1],0); // words run along the edge
      by.set(0,0,1);
      // keep side words reading left-to-right wherever possible
      if(bx.x<0) bx.multiplyScalar(-1);
      const sc=0.9+rand()*0.25;
      P.set(...s.p);
      M.makeBasis(bx.multiplyScalar(w*sc), by.multiplyScalar(h*sc), bz);
      M.setPosition(P);
      m.setMatrixAt(k,M);
      m.setColorAt(k,shade(k+3,0.4));
    });
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor) m.instanceColor.needsUpdate=true;
    m.frustumCulled=false;
    group.add(m);
    return m;
  }

  const matOpts={ roughness:0.82, metalness:0.0, alphaTest:0.3, side:THREE.DoubleSide,
    emissive:0xffffff, emissiveIntensity:0.42 }; // letters stay readable in shadow
  function stdMat(tex){ return new THREE.MeshStandardMaterial({...matOpts, map:tex, emissiveMap:tex}); }
  // closed solid, everything reads I LOVE YOU: faces + walls + inner body
  fillFace(new THREE.PlaneGeometry(1,1), stdMat(texPhrase), front, 0.62, 0.117, 1);
  fillFace(new THREE.PlaneGeometry(1,1), stdMat(texPhrase), back, 0.62, 0.117, -1);
  fillRim(new THREE.PlaneGeometry(1,1), stdMat(texPhrase), walls, 0.44, 0.11);
  fillFace(new THREE.PlaneGeometry(1,1), stdMat(texPhrase), filler, 0.5, 0.094, 0);

  // golden micro-dust suspended inside the heart — fills the gaps between words
  let dust=null;
  if(!reduced){
    const dc=document.createElement('canvas'); dc.width=dc.height=64;
    const dg=dc.getContext('2d');
    const grd=dg.createRadialGradient(32,32,0,32,32,32);
    grd.addColorStop(0,'rgba(255,236,205,1)'); grd.addColorStop(0.4,'rgba(216,178,138,.7)');
    grd.addColorStop(1,'rgba(216,178,138,0)');
    dg.fillStyle=grd; dg.fillRect(0,0,64,64);
    const dtex=new THREE.CanvasTexture(dc); dtex.colorSpace=THREE.SRGBColorSpace;
    const DN=isMobile?110:320, dp=new Float32Array(DN*3);
    let placed=0, guard=0;
    while(placed<DN && guard<DN*80){
      guard++;
      const x=minX+rand()*(maxX-minX), y=minY+rand()*(maxY-minY);
      if(!inPoly(x,y,outline)) continue;
      dp[placed*3]=x; dp[placed*3+1]=y+0.1; dp[placed*3+2]=(rand()-.5)*DEPTH*1.4;
      placed++;
    }
    const dgeo=new THREE.BufferGeometry();
    dgeo.setAttribute('position',new THREE.BufferAttribute(dp,3));
    dust=new THREE.Points(dgeo,new THREE.PointsMaterial({map:dtex,size:0.075,transparent:true,
      opacity:0.5,depthWrite:false,blending:THREE.AdditiveBlending,color:0xd8b28a}));
    dust.frustumCulled=false; dust.renderOrder=0;
    group.add(dust);
  }

  // ---- alive and calm: slow self-rotation + inertial drag + hover bloom ----
  let tx=0,ty=0,mx=0,my=0,spin=0.6,spinV=0,hover=0;
  let visible=true, last=performance.now(); const t0=last;
  let camZ=cam.position.z, camTarget=Z_REST, camX=0, camY=0.1, intro=0;
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
  let dragging=false,lx=0;
  canvas.style.touchAction='pan-y'; canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;canvas.style.cursor='grabbing'});
  addEventListener('pointermove',e=>{
    if(!dragging)return; spinV+=(e.clientX-lx)*0.0035; lx=e.clientX; // flick to spin
  },{passive:true});
  addEventListener('pointerup',()=>{dragging=false;canvas.style.cursor='grab'});
  canvas.addEventListener('pointerenter',()=>{hover=1});
  canvas.addEventListener('pointerleave',()=>{hover=0});
  canvas.addEventListener('click',()=>{ pulse=1; rimL.intensity=1.3; setTimeout(()=>rimL.intensity=0.6,900);
    document.body.classList.add('ignited'); setTimeout(()=>document.body.classList.remove('ignited'),2600); });

  if(finalMode){
    const sec=document.getElementById('finale');
    const onScroll=()=>{
      if(!sec) return;
      const r=sec.getBoundingClientRect(), h=innerHeight;
      const prog=THREE.MathUtils.clamp(1-(r.top+r.height*0.5)/h, 0, 1);
      camTarget = prog<0.35 ? 8.2 : prog<0.7 ? 5.6 : 3.9;
    };
    addEventListener('scroll',onScroll,{passive:true}); onScroll();
  }

  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting),{threshold:0.02}).observe(canvas);
  document.addEventListener('visibilitychange',()=>visible=!document.hidden);

  function resize(){
    const r=canvas.getBoundingClientRect();
    if(r.width<2)return;
    renderer.setSize(r.width,r.height,false);
    cam.aspect=r.width/r.height; cam.updateProjectionMatrix();
  }
  resize(); addEventListener('resize',resize);

  let raf=0, pulse=0, hoverEase=0;
  function tick(now){
    raf=requestAnimationFrame(tick);
    if(!visible){ last=now; return; }
    const dt=Math.min(0.05,(now-last)/1000); last=now; // seconds — speed is real time
    const t=(now-t0)/1000;
    intro=Math.min(1,intro+dt*0.17);
    const ease=intro*intro*(3-2*intro);
    mx+=(tx-mx)*Math.min(1,dt*2); my+=(ty-my)*Math.min(1,dt*2);
    const slow=reduced?0:1;
    // one gentle turn ≈ 30s. drag adds flick velocity that melts away.
    spinV*=Math.exp(-2.4*dt); spin+=((finalMode?0.05:0.055)*slow + spinV + mx*0.02)*dt;
    hoverEase+=(hover-hoverEase)*Math.min(1,dt*3.5);
    pulse*=Math.exp(-3*dt);
    group.rotation.y=spin;
    group.rotation.x=Math.sin(t*0.42)*0.05*slow + my*0.08;
    group.position.y=Math.sin(t*0.65)*0.2*slow;
    const s=(1+pulse*0.02*Math.sin(t*6))*(1+hoverEase*0.13); // grows under her cursor
    group.scale.set(s,s,s);
    if(dust){ dust.rotation.y=-t*0.03; dust.material.opacity=0.42+0.14*Math.sin(t*1.2); }
    camZ+=(camTarget-camZ)*Math.min(1,dt*1.4);
    cam.position.z = finalMode? camZ : camZ + (1-ease)*5;
    // gentle camera parallax — the lens breathes with her cursor, depth reads
    camX+=((mx*0.7)-camX)*Math.min(1,dt*1.2);
    camY+=((0.1-my*0.4)-camY)*Math.min(1,dt*1.2);
    cam.position.x=camX; cam.position.y=camY;
    cam.lookAt(0,0.1,0);
    renderer.render(scene,cam);
  }
  if(reduced){ resize(); cam.position.z=Z_REST; group.rotation.y=0.25; cam.lookAt(0,0.1,0); renderer.render(scene,cam); }
  else tick(performance.now());

  if(!finalMode){
    const veil=document.getElementById('intro-veil');
    if(veil) requestAnimationFrame(()=>veil.classList.add('lift'));
  }
}

if(!webglOK()){
  document.querySelectorAll('canvas[id^="heart"]').forEach(c=>c.style.display='none');
  document.querySelectorAll('.heart-fallback').forEach(f=>f.hidden=false);
  document.getElementById('intro-veil')?.classList.add('lift');
}else{
  try{ build(document.getElementById('heart-canvas'),{}); }
  catch(e){
    document.getElementById('heart-canvas').style.display='none';
    document.querySelector('.heart-fallback').hidden=false;
    document.getElementById('intro-veil')?.classList.add('lift');
  }
  try{
    const fc=document.getElementById('heart-final');
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ try{build(fc,{finalMode:true})}catch(err){} io.disconnect(); }
    }),{rootMargin:'700px'});
    io.observe(fc);
  }catch(e){}
}
