/* Local instrumental; starts only after a trusted visitor gesture. */
(() => {
  const audio=document.getElementById('backgroundMusic');
  const button=document.getElementById('musicToggle');
  const buttons=[button,document.getElementById('letterMusicToggle')];
  const voice=document.getElementById('birthdayAudio');
  let wanted=true, started=false, starting=false, volume=.24, fade=0;
  audio.volume=volume;
  function update() {
    const playing=!audio.paused;
    for(const control of buttons){
      control.classList.toggle('is-playing',playing);
      control.setAttribute('aria-pressed',String(playing));
      control.setAttribute('aria-label',playing?'暫停背景音樂':'播放背景音樂');
      control.title=playing?'暫停音樂':'播放音樂';
    }
  }
  async function play() {
    if(!wanted || starting || document.hidden) return;
    starting=true;
    try {await audio.play();started=true;}catch {}finally {starting=false;update();}
  }
  function gesture(event) {
    if(!event.isTrusted || event.target.closest?.('.music-toggle') || !wanted || started) return;
    play();
  }
  ['pointerdown','touchstart','wheel','keydown'].forEach(type=>document.addEventListener(type,gesture,{passive:true}));
  buttons.forEach(control=>control.addEventListener('click',()=>{
    wanted=audio.paused;if(wanted)play();else audio.pause();update();
  }));
  audio.addEventListener('play',update);audio.addEventListener('pause',update);
  // Keep the background quiet if a voice message is added later.
  function duck(target) {
    clearInterval(fade);
    fade=setInterval(()=>{audio.volume+= (target-audio.volume)*.16;if(Math.abs(audio.volume-target)<.004){audio.volume=target;clearInterval(fade);}},40);
  }
  voice.addEventListener('play',()=>duck(.06));['pause','ended'].forEach(type=>voice.addEventListener(type,()=>duck(volume)));
  document.addEventListener('visibilitychange',()=>{if(document.hidden)audio.pause();else if(started&&wanted)play();});
  document.getElementById('restart').addEventListener('click',()=>{audio.currentTime=0;if(wanted&&started)play();});
  update();
})();
