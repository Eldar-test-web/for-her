import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 640px)').matches;

function makeHeartShape(){
  const s = new THREE.Shape();
  const x = 0, y = 0;
  s.moveTo(x + 5, y + 5);
  s.bezierCurveTo(x + 5, y + 5, x + 4, y, x, y);
  s.bezierCurveTo(x - 6, y, x - 6, y + 7, x - 6, y + 7);
  s.bezierCurveTo(x - 6, y + 11, x - 3, y + 15.4, x + 5, y + 19);
  s.bezierCurveTo(x + 12, y + 15.4, x + 16, y + 11, x + 16, y + 7);
  s.bezierCurveTo(x + 16, y + 7, x + 16, y, x + 10, y);
  s.bezierCurveTo(x + 7, y, x + 5, y + 5, x + 5, y + 5);
  return s;
}

function webglOK(){
  try{
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl')||c.getContext('experimental-webgl')));
  }catch(e){ return false; }
}

function createScene(canvas, { interactive=false, final=false }={}){
  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio||1, isMobile?1.6:2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = final?1.0:1.12;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 100);
  cam.position.set(0, 0.6, final?30:32);

  // lights — warm room, no neon
  scene.add(new THREE.AmbientLight(0x2a1a1e, 1.1));
  const key = new THREE.DirectionalLight(0xffe3c0, final?1.6:2.1);
  key.position.set(6, 8, 10); scene.add(key);
  const rim = new THREE.PointLight(0x7d3043, 60, 60); rim.position.set(-8, 3, -4); scene.add(rim);
  const fill = new THREE.PointLight(0xc9a87a, 18, 40); fill.position.set(0, -2, 9); scene.add(fill);
  const under = new THREE.PointLight(0x4a1f2b, 30, 40); under.position.set(0, -6, 2); scene.add(under);

  const group = new THREE.Group(); scene.add(group);

  const shape = makeHeartShape();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 4.6, bevelEnabled:true, bevelThickness:1.5, bevelSize:1.15, bevelSegments:isMobile?3:5,
    curveSegments:isMobile?18:36, steps:1
  });
  geo.center();
  geo.computeVertexNormals();

  const heartMat = new THREE.MeshPhysicalMaterial({
    color: final?0x521f2b:0x5e2432,
    roughness:.34, metalness:.18,
    clearcoat:1, clearcoatRoughness:.28,
    sheen:.6, sheenColor:new THREE.Color(0xc9a87a), sheenRoughness:.6,
    emissive:new THREE.Color(0x2a0e14), emissiveIntensity:.35
  });
  const heart = new THREE.Mesh(geo, heartMat);
  heart.scale.setScalar(.42);
  heart.rotation.z = Math.PI; // upright (shape is upside-down by construction)
  group.add(heart);

  // soft shadow catcher
  const shadowGeo = new THREE.PlaneGeometry(16,16);
  const shadowMat = new THREE.ShadowMaterial({opacity:.0});
  const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
  shadowPlane.position.y=-5; shadowPlane.rotation.x=-Math.PI/2; scene.add(shadowPlane);

  // I LOVE YOU — 3D type resting on the heart face
  let textMesh=null;
  const textMat = new THREE.MeshStandardMaterial({
    color:0xf3ece7, emissive:0xc9a87a, emissiveIntensity:final?.55:.4,
    roughness:.4, metalness:.1
  });
  function placeText(mesh){
    mesh.geometry.computeBoundingBox();
    const bb=mesh.geometry.boundingBox, w=bb.max.x-bb.min.x;
    mesh.geometry.translate(-bb.min.x-w/2, 0, 0);
    mesh.position.set(0, .5, 3.35); // just off the front face
    mesh.rotation.z = 0;
    group.add(mesh); textMesh=mesh;
  }
  new FontLoader().load(
    'https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_regular.typeface.json',
    font=>{
      try{
        const tg=new TextGeometry('I LOVE YOU',{
          font, size:1.05, height:.32, curveSegments:6,
          bevelEnabled:true, bevelThickness:.02, bevelSize:.015, bevelSegments:2
        });
        const m=new THREE.Mesh(tg,textMat);
        m.scale.set(1.15,.95,1);
        placeText(m);
      }catch(e){ fallbackText(); }
    }, undefined, ()=>fallbackText()
  );
  function fallbackText(){
    // engraved-look canvas plane fused to heart
    const c=document.createElement('canvas'); c.width=1024; c.height=256;
    const g=c.getContext('2d');
    g.clearRect(0,0,1024,256);
    g.font='300 118px "Cormorant Garamond", Georgia, serif';
    g.textAlign='center'; g.textBaseline='middle';
    g.fillStyle='#f3ece7'; g.shadowColor='rgba(201,168,122,.8)'; g.shadowBlur=26;
    g.fillText('I  L O V E  Y O U',512,138);
    const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(8.4,2.1),
      new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:.94,depthWrite:false}));
    m.position.set(0,.45,3.4); group.add(m); textMesh=m;
  }

  // warm dust — restrained, 90 points
  const N = reduced?0:(isMobile?60:110);
  let pts=null, vel=null;
  if(N){
    const pos=new Float32Array(N*3);
    vel=new Float32Array(N*3);
    for(let i=0;i<N;i++){
      const r=6+Math.random()*9, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=(Math.random()-.5)*10; pos[i*3+2]=r*Math.sin(ph)*Math.sin(th)-2;
      vel[i*3]=(Math.random()-.5)*.05; vel[i*3+1]=.02+Math.random()*.06; vel[i*3+2]=(Math.random()-.5)*.05;
    }
    const pg=new THREE.BufferGeometry(); pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    pts=new THREE.Points(pg,new THREE.PointsMaterial({color:0xd9b98c,size:.09,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending}));
    scene.add(pts);
  }

  // interaction state
  let mx=0,my=0,tx=0,ty=0, ignite=0, igniteTarget=0, visible=true, t0=performance.now();
  if(interactive){
    addEventListener('pointermove',e=>{
      tx=(e.clientX/innerWidth-.5)*2; ty=(e.clientY/innerHeight-.5)*2;
    },{passive:true});
    const fire=()=>{
      igniteTarget=1;
      document.body.classList.add('ignited');
      setTimeout(()=>{ document.getElementById('you')?.scrollIntoView({behavior: reduced?'auto':'smooth'}); }, 900);
      setTimeout(()=>{ igniteTarget=0; document.body.classList.remove('ignited'); }, 4200);
    };
    canvas.addEventListener('click',fire);
    document.getElementById('heart-btn')?.addEventListener('click',fire);
    canvas.addEventListener('touchstart',e=>{ mx+=.05; },{passive:true});
  }
  new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting)).observe(canvas);
  document.addEventListener('visibilitychange',()=>visible=!document.hidden);

  function resize(){
    const r=canvas.getBoundingClientRect();
    if(r.width<2) return;
    renderer.setSize(r.width,r.height,false);
    cam.aspect=r.width/r.height; cam.updateProjectionMatrix();
  }
  resize(); addEventListener('resize',resize);

  let raf=0;
  function tick(now){
    raf=requestAnimationFrame(tick);
    if(!visible) return;
    const t=(now-t0)/1000;
    mx+=(tx-mx)*.04; my+=(ty-my)*.04;
    ignite+=(igniteTarget-ignite)*.03;
    const slow = reduced?0:1;
    group.rotation.y = (final? t*.22*slow : Math.sin(t*.4)*.32*slow + t*.12*slow) + mx*.28;
    group.rotation.x = Math.sin(t*.5)*.07*slow + my*.14 + (final?-.06:0);
    group.position.y = Math.sin(t*.8)*.28*slow;
    heartMat.emissiveIntensity = .35 + ignite*1.1 + Math.sin(t*1.2)*.05;
    textMat.emissiveIntensity = (final?.55:.4) + ignite*1.4;
    key.intensity = (final?1.6:2.1) + ignite*1.6;
    fill.intensity = 18 + ignite*40;
    if(pts && !reduced){
      const p=pts.geometry.attributes.position;
      const burst = 1 + ignite*6;
      for(let i=0;i<p.count;i++){
        let y=p.getY(i)+vel[i*3+1]*burst*.4;
        if(y>7) y=-7;
        p.setY(i,y); p.setX(i,p.getX(i)+vel[i*3]*burst*.3);
      }
      p.needsUpdate=true;
      pts.material.opacity=.42+ignite*.4;
    }
    renderer.render(scene,cam);
  }
  if(reduced){ resize(); renderer.render(scene,cam); }
  else tick(performance.now());
  return { dispose(){ cancelAnimationFrame(raf); geo.dispose(); renderer.dispose(); } };
}

if(!webglOK()){
  document.querySelectorAll('canvas').forEach(c=>c.style.display='none');
  document.querySelectorAll('.heart-fallback').forEach(f=>f.hidden=false);
}else{
  try{ createScene(document.getElementById('heart-canvas'),{interactive:true}); }
  catch(e){
    document.getElementById('heart-canvas').style.display='none';
    document.querySelector('.heart-fallback').hidden=false;
  }
  try{ createScene(document.getElementById('heart-final'),{final:true}); }
  catch(e){ document.getElementById('heart-final').style.display='none'; }
}
