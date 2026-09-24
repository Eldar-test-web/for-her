// Subtle generative ambient pad — no external files. Starts only after user gesture.
(function(){
  let ctx=null, master=null, on=false;
  const btn=()=>document.getElementById('sound-btn');
  const label=()=>document.getElementById('sound-label');
  function build(){
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    master=ctx.createGain(); master.gain.value=0;
    const filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=720; filt.Q.value=.4;
    master.connect(filt); filt.connect(ctx.destination);
    [[110,.5],[164.81,.32],[220,.22],[277.18,.12]].forEach(([f,g],i)=>{
      const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f;
      o.detune.value=(i-1.5)*4;
      const gg=ctx.createGain(); gg.gain.value=g;
      const lfo=ctx.createOscillator(); lfo.frequency.value=.05+i*.03;
      const lg=ctx.createGain(); lg.gain.value=.08;
      lfo.connect(lg); lg.connect(gg.gain);
      o.connect(gg); gg.connect(master); o.start(); lfo.start();
    });
  }
  function toggle(){
    const b=btn(); if(!b) return;
    if(!ctx) build();
    if(ctx.state==='suspended') ctx.resume();
    on=!on; b.setAttribute('aria-pressed', String(on));
    label().textContent=on?'sound on':'sound off';
    const t=ctx.currentTime;
    master.gain.cancelScheduledValues(t);
    master.gain.linearRampToValueAtTime(on?0.055:0, t+2.2);
    window.__soundOn=on;
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#sound-btn')) toggle();
  });
  // gentle auto-hint: enable on first heart touch at low volume
  document.addEventListener('pointerdown', function once(){
    document.removeEventListener('pointerdown', once);
  });
})();
