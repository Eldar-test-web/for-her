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
      master.gain.linearRampToValueAtTime(0.05, ctx.currentTime+4);

      // soft breath underneath — pure sines, very low, never brassy
      const filt=ctx.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=380; filt.Q.value=0.3;
      filt.connect(master);
      const flfo=ctx.createOscillator(); flfo.frequency.value=0.06;
      const flg=ctx.createGain(); flg.gain.value=110;
      flfo.connect(flg); flg.connect(filt.frequency); flfo.start();
      [[110,.16],[164.81,.11],[220,.08]].forEach(([f,g],i)=>{
        const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=f; o.detune.value=(i-1)*2;
        const gg=ctx.createGain(); gg.gain.value=g;
        o.connect(gg); gg.connect(filt); o.start();
      });

      // space for the piano: soft feedback delay
      const dly=ctx.createDelay(1.2); dly.delayTime.value=0.42;
      const fb=ctx.createGain(); fb.gain.value=0.32;
      const wet=ctx.createGain(); wet.gain.value=0.4;
      dly.connect(fb); fb.connect(dly); dly.connect(wet); wet.connect(master);

      // felt-piano voice: triangle + soft octave, slow bloom, long tail
      function pluck(freq, when, vol){
        const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=freq;
        const o2=ctx.createOscillator(); o2.type='sine'; o2.frequency.value=freq*2;
        const g=ctx.createGain(); const g2=ctx.createGain(); g2.gain.value=0.3;
        g.gain.setValueAtTime(0,when);
        g.gain.linearRampToValueAtTime(vol,when+0.02);
        g.gain.exponentialRampToValueAtTime(0.0004,when+3.0);
        o.connect(g); o2.connect(g2); g2.connect(g);
        g.connect(master); g.connect(dly);
        o.start(when); o2.start(when); o.stop(when+3.2); o2.stop(when+3.2);
      }
      // a slow walking motif in A minor — melody leads, pad only breathes
      const motif=[220, 261.63, 329.63, 293.66, 261.63, 329.63, 392, 329.63, 261.63, 246.94, 220, 196, 220, 261.63];
      let step=0;
      (function next(){
        const t=ctx.currentTime+0.1;
        pluck(motif[step%motif.length], t, 0.16);
        if(step%4===1) pluck(motif[(step+2)%motif.length]*2, t+0.35, 0.05); // faint high answer
        step+=1;
        setTimeout(next, 2600+Math.random()*2600);
      })();
    }catch(e){/* silence is acceptable */}
  }
  ['pointerdown','keydown','wheel','touchstart'].forEach(ev=>
    addEventListener(ev, start, {once:true, passive:true}));
})();
