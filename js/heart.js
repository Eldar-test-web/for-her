import * as THREE from 'three';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 640px)').matches;

function textTexture(word, { px=64, color='#F2ECE6', glow='rgba(201,180,154,.55)', font='600 44px Georgia, serif', w=512, h=128 }={}){
  const c=document.createElement('canvas'); c.width=w; c.height=h;
  const g=c.getContext('2d');
  g.clearRect(0,0,w,h);
  g.font=font; g.textAlign='center'; g.textBaseline='middle';
  g.shadowColor=glow; g.shadowBlur=14;
  g.fillStyle=color;
  g.fillText(word, w/2, h/2+2);
  const t=new THREE.CanvasTexture(c);
  t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4;
  return t;
}

// parametric 2D heart outline, then volumised
function heartSamples(count){
  const outline=[];
  const M=420;
  for(let i=0;i<M;i++){
    const t=(i/M)*Math.PI*2;
    const x=16*Math.pow(Math.sin(t),3);
    const y=13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t);
    outline.push([x,y]);
  }
  const pts=[];
  for(let i=0;i<count;i++){
    const o=outline[(Math.random()*M)|0];
    const inward=Math.pow(Math.random(),0.6); // bias to surface, some fill
    const cx=o[0]*(1-inward*0.92), cy=o[1]*(1-inward*0.92);
    const jx=(Math.random()-.5)*1.1, jy=(Math.random()-.5)*1.1;
    const edge=Math.min(1,Math.hypot(cx,cy)/17);
    const z=(Math.random()-.5)*7*(1-edge*0.55);
    pts.push([ (cx+jx)*0.32, (cy+jy)*0.32, z*0.32 ]);
  }
  return pts;
}

function webglOK(){
  try{
    const c=document.createElement('canvas');
    return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));
  }catch(e){return false}
}

function build(canvas, { finalMode=false, density=1 }={}){
  const renderer=new THREE.WebGLRenderer({canvas, alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, isMobile?1.6:2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  const scene=new THREE.Scene();
  // warm fog for depth — dark room
  scene.fog=new THREE.FogExp2(0x080708, 0.016);
  const cam=new THREE.PerspectiveCamera(33,1,.1,200);
  cam.position.set(0,0.4,finalMode?26:44);

  const group=new THREE.Group(); scene.add(group);

  const total=Math.round((isMobile?520:1150)*density);
  const samples=heartSamples(total);
  const nSmall=Math.round(total*0.82);

  function cloud(indices, tex, size, opacity){
    const pos=new Float32Array(indices.length*3);
    const col=new Float32Array(indices.length*3);
    const cFront=new THREE.Color(0xF2ECE6), cMid=new THREE.Color(0x8B4A58), cBack=new THREE.Color(0x4A202B);
    const tmp=new THREE.Color();
    indices.forEach((si,k)=>{
      const [x,y,z]=samples[si];
      pos[k*3]=x; pos[k*3+1]=y+0.4; pos[k*3+2]=z;
      const f=THREE.MathUtils.clamp(z/2.4,-1,1);
      if(f>=0) tmp.copy(cMid).lerp(cFront, 0.25+f*0.75);
      else tmp.copy(cMid).lerp(cBack, -f*0.85);
      // champagne accents: every ~9th word glows warmer
      if(si%9===0) tmp.lerp(new THREE.Color(0xC9B49A), .45);
      col[k*3]=tmp.r; col[k*3+1]=tmp.g; col[k*3+2]=tmp.b;
    });
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.BufferAttribute(pos,3));
    g.setAttribute('color',new THREE.BufferAttribute(col,3));
    const m=new THREE.PointsMaterial({
      map:tex, size, transparent:true, opacity, vertexColors:true,
      depthWrite:false, sizeAttenuation:true, alphaTest:0.02
    });
    const p=new THREE.Points(g,m);
    group.add(p);
    return p;
  }

  const texLove=textTexture('I LOVE YOU',{color:'#EFE4D8'});
  const texYou=textTexture('LOVE',{color:'#C9B49A',font:'600 64px Georgia, serif'});
  const idx=[...Array(total).keys()];
  const small=cloud(idx.slice(0,nSmall), texLove, isMobile?0.85:0.72, 0.92);
  const big=cloud(idx.slice(nSmall), texYou, isMobile?1.35:1.15, 0.95);

  // faint volumetric core — gives shadow/depth only, words remain the visible structure
  const coreGeo=new THREE.SphereGeometry(3.4,24,18);
  // deform sphere into heart-ish blob by scaling top lobes
  const coreMat=new THREE.MeshBasicMaterial({color:0x1A1014, transparent:true, opacity:0.55, depthWrite:true});
  const core=new THREE.Mesh(coreGeo,coreMat);
  core.scale.set(1.25,1.05,0.55); core.position.y=0.6;
  group.add(core);
  group.children.forEach(()=>{});
  // ensure words render after core
  small.renderOrder=2; big.renderOrder=3;

  // faint warm key glow sprite behind heart (illumination, not neon)
  const glowC=document.createElement('canvas'); glowC.width=glowC.height=256;
  const gg=glowC.getContext('2d');
  const grad=gg.createRadialGradient(128,128,0,128,128,128);
  grad.addColorStop(0,'rgba(200,140,120,.20)'); grad.addColorStop(.5,'rgba(120,51,68,.10)'); grad.addColorStop(1,'rgba(0,0,0,0)');
  gg.fillStyle=grad; gg.fillRect(0,0,256,256);
  const glowTex=new THREE.CanvasTexture(glowC);
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,transparent:true,opacity:.9,depthWrite:false}));
  glow.scale.set(22,22,1); glow.position.z=-6; scene.add(glow);

  // state
  let tx=0,ty=0,mx=0,my=0, dragY=0,dragX=0,tdy=0,tdx=0, pulse=0,pulseT=0;
  let visible=true, t0=performance.now(), intro=0;
  addEventListener('pointermove',e=>{tx=(e.clientX/innerWidth-.5)*2;ty=(e.clientY/innerHeight-.5)*2},{passive:true});
  let dragging=false,lx=0,ly=0;
  canvas.addEventListener('pointerdown',e=>{dragging=true;lx=e.clientX;ly=e.clientY;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;tdy+=(e.clientX-lx)*.008;tdx+=(e.clientY-ly)*.005;lx=e.clientX;ly=e.clientY},{passive:true});
  addEventListener('pointerup',()=>dragging=false);
  function fire(){
    pulseT=1;
    document.body.classList.add('ignited');
    setTimeout(()=>document.body.classList.remove('ignited'),2600);
    const you=document.getElementById('you');
    if(!finalMode&&you) setTimeout(()=>you.scrollIntoView({behavior:reduced?'auto':'smooth'}),700);
    try{navigator.vibrate&&navigator.vibrate(12)}catch(e){}
  }
  canvas.addEventListener('click',fire);
  document.getElementById('heart-btn')?.addEventListener('click',fire);

  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting),{threshold:0.02}).observe(canvas);
  document.addEventListener('visibilitychange',()=>visible=!document.hidden);

  function resize(){
    const r=canvas.getBoundingClientRect();
    if(r.width<2)return;
    renderer.setSize(r.width,r.height,false);
    cam.aspect=r.width/r.height; cam.updateProjectionMatrix();
  }
  resize(); addEventListener('resize',resize);

  // scroll dolly: hero pulls back slightly, finale pushes macro
  let scrollZ=0;
  if(!reduced) addEventListener('scroll',()=>{
    const y=scrollY, h=innerHeight;
    scrollZ = finalMode ? 0 : Math.min(6, (y/h)*4);
  },{passive:true});

  let raf=0;
  function tick(now){
    raf=requestAnimationFrame(tick);
    if(!visible)return;
    const t=(now-t0)/1000;
    intro=Math.min(1,intro+0.0035); // slow emergence from darkness
    mx+=(tx-mx)*.035; my+=(ty-my)*.035;
    dragY+=(tdy-dragY)*.06; dragX+=(tdx-dragX)*.06; tdy*=.94; tdx*=.94;
    pulseT*=.94; pulse=Math.sin(Math.min(1,pulseT)*Math.PI);
    const slow=reduced?0:1;
    group.rotation.y=(finalMode?t*.20:t*.14)*slow + Math.sin(t*.3)*.12*slow + mx*.30 + dragY;
    group.rotation.x=Math.sin(t*.45)*.06*slow + my*.12 + dragX;
    group.position.y=Math.sin(t*.7)*.30*slow;
    const targetZ=(finalMode? 15 : 30) + (finalMode? Math.sin(t*.25)*1.2 : 0) - scrollZ*0 + (finalMode?0:(1-intro)*14);
    cam.position.z+=((finalMode?15:30)-cam.position.z)*.02;
    // close inspection mode when finale in view handled by finalMode base 15
    const ease=intro*intro*(3-2*intro);
    small.material.opacity=.92*ease; big.material.opacity=.95*ease;
    const baseS1=isMobile?.85:.72, baseS2=isMobile?1.35:1.15;
    small.material.size=baseS1*(1+pulse*.35);
    big.material.size=baseS2*(1+pulse*.5);
    glow.material.opacity=.35+.55*ease;
    renderer.render(scene,cam);
  }
  if(reduced){ resize(); small.material.opacity=.92; big.material.opacity=.95; renderer.render(scene,cam); }
  else tick(performance.now());
}

if(!webglOK()){
  document.querySelectorAll('canvas[id^="heart"]').forEach(c=>c.style.display='none');
  document.querySelectorAll('.heart-fallback').forEach(f=>f.hidden=false);
}else{
  try{ build(document.getElementById('heart-canvas'),{}); }catch(e){
    document.getElementById('heart-canvas').style.display='none';
    document.querySelector('.heart-fallback').hidden=false;
  }
  try{
    // lazy-init finale when near viewport
    const fc=document.getElementById('heart-final');
    const io=new IntersectionObserver(es=>es.forEach(e=>{
      if(e.isIntersecting){ try{build(fc,{finalMode:true,density:.8})}catch(err){} io.disconnect(); }
    }),{rootMargin:'600px'});
    io.observe(fc);
  }catch(e){}
}
