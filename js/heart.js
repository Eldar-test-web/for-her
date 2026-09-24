import * as THREE from 'three';

/* The heart is ONLY text. No mesh, no silhouette, no glow sprite.
   Remove every Points/InstancedMesh below and nothing heart-shaped remains. */

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 640px)').matches;

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}

// Taubin-style implicit heart: elegant lobes, valley, tapered base
function F(x,y,z){ const a=x*x+2.25*y*y+z*z-1; return a*a*a - x*x*z*z*z - 0.1125*y*y*z*z*z; }
function gradN(x,y,z){
  const e=0.0015;
  const gx=F(x+e,y,z)-F(x-e,y,z), gy=F(x,y+e,z)-F(x,y-e,z), gz=F(x,y,z+e)-F(x,y,z-e);
  const l=Math.hypot(gx,gy,gz)||1;
  return [gx/l,gy/l,gz/l];
}
function sampleSurface(n, rand){
  const pts=[]; let guard=0;
  while(pts.length<n && guard<n*500){
    guard++;
    const x=(rand()*2-1)*1.6, y=(rand()*2-1)*1.75-0.08, z=(rand()*2-1)*1.3;
    if(Math.abs(F(x,y,z))<0.05) pts.push({p:[x,y,z], n:gradN(x,y,z)});
  }
  return pts;
}

function wordTexture(word, px=88){
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
  const rand = mulberry32(finalMode? 77 : 7); // stable composition
  const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, isMobile?1.6:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;

  const scene=new THREE.Scene();
  const cam=new THREE.PerspectiveCamera(33,1,.1,100);
  const Z_WIDE = finalMode? 8.2 : 8.6;
  cam.position.set(0, 0.15, finalMode? 8.2 : 13.5); // opens far, then approaches

  // cinematic warm lighting — illuminated, never glowing
  scene.add(new THREE.AmbientLight(0x3a2530, 0.85));
  const key=new THREE.DirectionalLight(0xffd9b0, 1.5); key.position.set(4,6,8); scene.add(key);
  const rim=new THREE.DirectionalLight(0x9a5a64, 0.65); rim.position.set(-7,2,-6); scene.add(rim);
  const low=new THREE.DirectionalLight(0x4a202b, 0.5); low.position.set(0,-6,3); scene.add(low);

  const group=new THREE.Group(); scene.add(group);

  const TOTAL = isMobile? 950 : 3400;
  const samples=sampleSurface(TOTAL, rand);
  // shuffle so word-kinds interleave organically
  for(let i=samples.length-1;i>0;i--){const j=(rand()*(i+1))|0;[samples[i],samples[j]]=[samples[j],samples[i]];}

  const texPhrase=wordTexture('I LOVE YOU', 84);
  const texLove=wordTexture('LOVE', 104);
  const texYou=wordTexture('YOU', 104);

  const up=new THREE.Vector3(0,1,0), alt=new THREE.Vector3(1,0,0);
  function fillMesh(geo, mat, list, w, h){
    const m=new THREE.InstancedMesh(geo,mat,list.length);
    const M=new THREE.Matrix4(), bx=new THREE.Vector3(), by=new THREE.Vector3(), bz=new THREE.Vector3();
    const t1=new THREE.Vector3(), t2=new THREE.Vector3(), P=new THREE.Vector3();
    const ivory=new THREE.Color(0xf3ece6), rose=new THREE.Color(0x9a6a70), champ=new THREE.Color(0xc8b399);
    const cc=new THREE.Color();
    list.forEach((s,k)=>{
      bz.set(...s.n);
      t1.crossVectors(Math.abs(bz.y)>0.93?alt:up, bz).normalize();
      t2.crossVectors(bz,t1).normalize();
      // flow around the form + small organic variance
      const th=Math.atan2(s.p[1],s.p[0])*0.5 + (rand()-0.5)*0.55;
      const c=Math.cos(th), si=Math.sin(th);
      bx.copy(t1).multiplyScalar(c).addScaledVector(t2,si);
      by.copy(t2).multiplyScalar(c).addScaledVector(t1,-si);
      const sc=(0.8+rand()*0.45);
      P.set(s.p[0]*1.5, s.p[1]*1.5, s.p[2]*1.5);
      M.makeBasis(bx.multiplyScalar(w*sc), by.multiplyScalar(h*sc), bz);
      M.setPosition(P);
      m.setMatrixAt(k,M);
      // front words catch light, back words fall into wine shadow
      const f=THREE.MathUtils.clamp(s.n[2],-1,1);
      if(f>=0) cc.copy(rose).lerp(ivory,0.35+f*0.65);
      else cc.copy(rose).multiplyScalar(1+f*0.45);
      if(k%9===0) cc.lerp(champ,0.5);
      m.setColorAt(k,cc);
    });
    m.instanceMatrix.needsUpdate=true;
    if(m.instanceColor) m.instanceColor.needsUpdate=true;
    m.frustumCulled=false;
    group.add(m);
    return m;
  }

  const nP=Math.round(samples.length*0.72), nL=Math.round(samples.length*0.14);
  const matOpts={ roughness:0.88, metalness:0.0, alphaTest:0.32, side:THREE.FrontSide };
  const meshP=fillMesh(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texPhrase,...matOpts}), samples.slice(0,nP), 0.52, 0.0975);
  const meshL=fillMesh(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texLove,...matOpts}), samples.slice(nP,nP+nL), 0.34, 0.064);
  const meshY=fillMesh(new THREE.PlaneGeometry(1,1), new THREE.MeshStandardMaterial({map:texYou,...matOpts}), samples.slice(nP+nL), 0.30, 0.056);
  [meshP,meshL,meshY].forEach(m=>m.renderOrder=1);

  // ---- interaction: breathe, drift, drag, scroll — never a button ----
  let tx=0,ty=0,mx=0,my=0,dy=0,dx=0,tdy=0,tdx=0,pulse=0;
  let visible=true; const t0=performance.now();
  let camZ=cam.position.z, camTarget=Z_WIDE, intro=0;
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
  let dragging=false,lx=0,ly=0;
  canvas.style.touchAction='pan-y';
  canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;canvas.style.cursor='grabbing'});
  addEventListener('pointermove',e=>{
    if(!dragging)return; tdy+=(e.clientX-lx)*0.006; tdx+=(e.clientY-ly)*0.004; lx=e.clientX; ly=e.clientY;
  },{passive:true});
  addEventListener('pointerup',()=>{dragging=false;canvas.style.cursor='grab'});
  canvas.style.cursor='grab';
  canvas.addEventListener('click',()=>{ pulse=1; rim.intensity=1.4; setTimeout(()=>rim.intensity=0.65,900);
    document.body.classList.add('ignited'); setTimeout(()=>document.body.classList.remove('ignited'),2600); });

  // finale camera journey: wide -> medium -> close, driven by scroll
  if(finalMode){
    const sec=document.getElementById('finale');
    const onScroll=()=>{
      if(!sec) return;
      const r=sec.getBoundingClientRect(), h=innerHeight;
      const prog=THREE.MathUtils.clamp(1-(r.top+r.height*0.5)/h, 0, 1);
      camTarget = prog<0.35 ? 8.2 : prog<0.7 ? 5.6 : 3.9;
    };
    addEventListener('scroll',onScroll,{passive:true}); onScroll();
  } else {
    addEventListener('scroll',()=>{
      const y=scrollY, h=innerHeight||1;
      tdy += 0; // keep
      camTarget = Z_WIDE - Math.min(1.4,(y/h)*1.1); // barely leans in as you leave
    },{passive:true});
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

  let raf=0;
  function tick(now){
    raf=requestAnimationFrame(tick);
    if(!visible) return;
    const t=(now-t0)/1000;
    intro=Math.min(1,intro+0.0028); // slow emergence from black
    const ease=intro*intro*(3-2*intro);
    mx+=(tx-mx)*0.03; my+=(ty-my)*0.03;
    dy+=(tdy-dy)*0.06; dx+=(tdx-dx)*0.06; tdy*=0.93; tdx*=0.93;
    pulse*=0.95;
    const slow=reduced?0:1;
    group.rotation.y=(finalMode?t*0.16:t*0.11)*slow + Math.sin(t*0.3)*0.1*slow + mx*0.28 + dy;
    group.rotation.x=Math.sin(t*0.42)*0.05*slow + my*0.1 + dx;
    group.position.y=Math.sin(t*0.65)*0.22*slow;
    const s=1+pulse*0.025*Math.sin(t*6);
    group.scale.set(s,s,s);
    camZ+=(camTarget-camZ)*0.02;
    // opening dolly: far -> resting distance while veil lifts
    const openZ = finalMode? camZ : camZ + (1-ease)*5;
    cam.position.z=openZ;
    renderer.render(scene,cam);
  }
  if(reduced){ resize(); cam.position.z=Z_WIDE; group.rotation.y=0.5; renderer.render(scene,cam); }
  else tick(performance.now());

  // veil lift for the opening scene
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
