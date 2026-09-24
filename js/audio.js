/* Generative music — dark, warm, slow. No buttons anywhere:
   it begins by itself after her first touch/scroll and stays quiet. */
(function(){
  let started=false;
  function start(){
    if(started) return; started=true;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      const ctx=new AC();
      if(ctx.state==='suspended') ctx.resume();
      const master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
      master.gain.linearRampToValueAtTime(0.055, ctx.currentTime+5);

      // low warm pad through a breathing lowpass
      const filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=520; filt.Q.value=0.4;
      filt.connect(master);
      const flfo=ctx.createOscillator(); flfo.frequency.value=0.05;
      const flg=ctx.createGain(); flg.gain.value=160;
      flfo.connect(flg); flg.connect(filt.frequency); flfo.start();
      [[110,.30],[164.81,.20],[220,.14],[261.63,.10]].forEach(([f,g],i)=>{
        const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=f; o.detune.value=(i-1.5)*3;
        const gg=ctx.createGain(); gg.gain.value=g;
        const lfo=ctx.createOscillator(); lfo.frequency.value=0.04+i*0.027;
        const lg=ctx.createGain(); lg.gain.value=g*0.35;
        lfo.connect(lg); lg.connect(gg.gain);
        o.connect(gg); gg.connect(filt); o.start(); lfo.start();
      });

      // space for the piano: soft feedback delay
      const dly=ctx.createDelay(1.2); dly.delayTime.value=0.46;
      const fb=ctx.createGain(); fb.gain.value=0.34;
      const wet=ctx.createGain(); wet.gain.value=0.35;
      dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);

      // a slow walking motif in A minor — composed, never random jumps
      const motif=[220, 261.63, 329.63, 261.63, 293.66, 329.63, 392, 329.63, 261.63, 246.94, 220, 196];
      let step=0;
      function pluck(freq, when, vol){
        const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=freq;
        const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2;
        const g=ctx.createGain(); const g2=ctx.createGain(); g2.gain.value=0.25;
        const peak=vol;
        g.gain.setValueAtTime(0,when);
        g.gain.linearRampToValueAtTime(peak,when+0.03);
        g.gain.exponentialRampToValueAtTime(0.0004,when+3.4);
        o.connect(g); o2.connect(g2); g2.connect(g);
        g.connect(master); g.connect(dly);
        o.start(when); o2.start(when); o.stop(when+3.6); o2.stop(when+3.6);
      }
      (function next(){
        const t=ctx.currentTime+0.15;
        pluck(motif[step%motif.length], t, 0.11);
        if(step%4===3) pluck(motif[step%motif.length]/2, t+0.02, 0.06); // low root, every 4th note
        step+= (Math.random()<0.72?1:2);
        setTimeout(next, 5200+Math.random()*5200);
      })();
    }catch(e){/* silence is acceptable */}
  }
  ['pointerdown','keydown','wheel','touchstart'].forEach(ev=>
    addEventListener(ev, start, {once:true, passive:true}));
})();
