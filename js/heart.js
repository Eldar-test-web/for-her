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

function wordTexture(word, px=92){
  const c=document.createElement('canvas'); c.width=1024; c.height=192;
  const g=c.getContext('2d');
  g.clearRect(0,0,1024,192);
  g.font=`500 ${px}px Georgia, 'Times New Roman', serif`;
  g.textAlign='center'; g.textBaseline='middle';
  try{ g.letterSpacing='6px'; }catch(e){}
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
  const key=new THREE.DirectionalLight(0xffd9b0, 1.5); key.position.set(4,6,8); scene.add(key);
  const rimL=new THREE.DirectionalLight(0x9a5a64, 0.6); rimL.position.set(-7,2,-6); scene.add(rimL);
  const low=new THREE.DirectionalLight(0x4a202b, 0.5); low.position.set(0,-6,3); scene.add(low);

  const group=new THREE.Group(); scene.add(group);

  // ---- sample the silhouette ----
  const outline=heartOutline();
  let minX=9,maxX=-9,minY=9,maxY=-9;
  outline.forEach(p=>{minX=Math.min(minX,p[0]);maxX=Math.max(maxX,p[0]);minY=Math.min(minY,p[1]);maxY=Math.max(maxY,p[1]);});
  const DEPTH=0.5;
  const N = isMobile? {front:700, rim:450, back:250} : {front:2400, rim:1800, back:800};

  function facePoints(n, z, dir){
    const pts=[]; let guard=0;
    while(pts.length<n && guard<n*60){
      guard++;
      const x=minX+rand()*(maxX-minX), y=minY+rand()*(maxY-minY);
      if(!inPoly(x,y,outline)) continue;
      // denser toward the silhouette so edges read crisply
      pts.push({p:[x+(rand()-.5)*0.03, y+0.1+(rand()-.5)*0.03, z+(rand()-.5)*0.05],
        n:[(rand()-.5)*0.3*dir, (rand()-.5)*0.3, dir]});
    }
    return pts;
  }
  // rim: words run along the edge, facing outward — the heart's profile.
  // outward = away from the shape centroid (robust to winding direction)
  function rimPoints(n){
    const pts=[]; const layers=5;
    let cx=0, cy=0; outline.forEach(p=>{cx+=p[0];cy+=p[1];}); cx/=outline.length; cy/=outline.length;
    for(let i=0;i<n;i++){
      const o=outline[(rand()*outline.length)|0];
      let nx=o[0]-cx, ny=(o[1]-cy);
      const nl=Math.hypot(nx,ny)||1; nx/=nl; ny/=nl;
      let tx=-ny, ty=nx; // tangent along the edge
      const z=-DEPTH + (i%layers)/(layers-1)*DEPTH*2;
      pts.push({p:[o[0]+nx*0.02, o[1]+ny*0.02, z], t:[tx,ty], n:[nx,ny,0]});
    }
    return pts;
  }

  const front=facePoints(N.front, DEPTH, 1);
  const back=facePoints(N.back, -DEPTH, -1);
  const rimPts=rimPoints(N.rim);

  const texPhrase=wordTexture('I LOVE YOU', 84);
  const texLove=wordTexture('LOVE', 108);
  const texYou=wordTexture('YOU', 108);

  const M=new THREE.Matrix4();
  const bx=new THREE.Vector3(), by=new THREE.Vector3(), bz=new THREE.Vector3(), P=new THREE.Vector3();
  const ivory=new THREE.Color(0xf3ece6), rose=new THREE.Color(0x8a5a62), champ=new THREE.Color(0xc8b399);
  const cc=new THREE.Color();

  function shade(k, facing){
    if(facing>=0) cc.copy(rose).lerp(ivory,0.55);
    else cc.copy(rose).multiplyScalar(0.6);
    if(k%8===0) cc.lerp(champ,0.5);
    return cc;
  }
  function fillFace(geo, mat, list, w, h, dir, accentEvery=0, accentW=0){
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
      const isAccent=accentEvery&&k%accentEvery===0;
      const sc=0.85+rand()*0.4, ww=(isAccent?accentW:w)*sc, hh=h*sc*(isAccent?1.35:1);
      P.set(...s.p);
      M.makeBasis(ax.multiplyScalar(ww), ay.multiplyScalar(hh), bz);
      M.setPosition(P);
      m.setMatrixAt(k,M);
      m.setColorAt(k,shade(k,dir));
    });
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor) m.instanceColor.needsUpdate=true;
    m.frustumCulled=false;
    group.add(m);
    return m;
  }
  function fillRim(geo, mat, list, w, h, texKind){
    const m=new THREE.InstancedMesh(geo,mat,list.length);
    list.forEach((s,k)=>{
      bz.set(s.n[0],s.n[1],s.n[2]).normalize();
      bx.set(s.t[0],s.t[1],0); // words run along the edge
      by.set(0,0,1);
      // keep rim words upright-ish: flip when running right-to-left underneath
      if(bx.x<0) bx.multiplyScalar(-1);
      const sc=0.8+rand()*0.35;
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

  const matOpts={ roughness:0.88, metalness:0.0, alphaTest:0.3, side:THREE.DoubleSide };
  // front: dense field of I LOVE YOU with larger LOVE accents
  const nF=front.length, nAcc=Math.round(nF*0.14);
  const frontMain=front.slice(nAcc), frontAcc=front.slice(0,nAcc);
  fillFace(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texPhrase,...matOpts}), frontMain, 0.50, 0.094, 1);
  fillFace(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texLove,...matOpts}), frontAcc, 0.42, 0.079, 1);
  fillFace(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texPhrase,...matOpts}), back, 0.50, 0.094, -1);
  // rim: LOVE / YOU alternating around the profile
  const rimL1=rimPts.filter((_,i)=>i%2===0), rimL2=rimPts.filter((_,i)=>i%2!==0);
  fillRim(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texLove,...matOpts}), rimL1, 0.36, 0.068);
  fillRim(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texYou,...matOpts}), rimL2, 0.33, 0.062);

  // ---- alive and calm: slow self-rotation + inertial drag ----
  let tx=0,ty=0,mx=0,my=0,spin=0,spinV=0;
  let visible=true; const t0=performance.now();
  let camZ=cam.position.z, camTarget=Z_REST, intro=0;
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
  let dragging=false,lx=0;
  canvas.style.touchAction='pan-y'; canvas.style.cursor='grab';
  canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;canvas.style.cursor='grabbing'});
  addEventListener('pointermove',e=>{
    if(!dragging)return; spinV+=(e.clientX-lx)*0.0045; lx=e.clientX;
  },{passive:true});
  addEventListener('pointerup',()=>{dragging=false;canvas.style.cursor='grab'});
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

  let raf=0, pulse=0;
  function tick(now){
    raf=requestAnimationFrame(tick);
    if(!visible) return;
    const t=(now-t0)/1000;
    intro=Math.min(1,intro+0.0028);
    const ease=intro*intro*(3-2*intro);
    mx+=(tx-mx)*0.03; my+=(ty-my)*0.03;
    const slow=reduced?0:1;
    // slow self-rotation (~one turn per 30s) + flick-to-spin inertia + cursor breath
    spinV*=0.96; spin+=((finalMode?0.16:0.21)*slow + spinV + mx*0.02);
    pulse*=0.95;
    group.rotation.y=spin;
    group.rotation.x=Math.sin(t*0.42)*0.05*slow + my*0.08;
    group.position.y=Math.sin(t*0.65)*0.2*slow;
    const s=1+pulse*0.025*Math.sin(t*6);
    group.scale.set(s,s,s);
    camZ+=(camTarget-camZ)*0.02;
    cam.position.z = finalMode? camZ : camZ + (1-ease)*5;
    renderer.render(scene,cam);
  }
  if(reduced){ resize(); cam.position.z=Z_REST; group.rotation.y=0.25; renderer.render(scene,cam); }
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
