(() => {
  const canvas = document.getElementById('particles');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const quiet = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0, height = 0, last = 0, frame = 0, night = 0, journey = 0;
  let sparks = [];
  let ambient = null;
  if (!quiet && window.tsParticles && window.loadSlim) {
    (async()=>{
      try {
        await window.loadSlim(window.tsParticles);
        ambient = await window.tsParticles.load({id:'ambientLights',options:{
          fullScreen:{enable:false},detectRetina:false,fpsLimit:40,
          pauseOnBlur:true,pauseOnOutsideViewport:true,
          background:{color:'transparent'},interactivity:{events:{onClick:{enable:false},onHover:{enable:false}}},
          particles:{number:{value:46,density:{enable:false}},color:{value:['#ffffff','#edcf8c','#c5e0ee']},
            shape:{type:'circle'},size:{value:{min:.6,max:1.7}},
            opacity:{value:{min:.15,max:.65},animation:{enable:true,speed:.35,sync:false}},
            move:{enable:true,speed:.13,direction:'top',random:true,outModes:{default:'out'}},
            links:{enable:false},shadow:{enable:false}},
          motion:{disable:true,reduce:{value:true,factor:4}},
        }});
        if(document.hidden) ambient?.pause();
      } catch(error) { console.warn('Ambient light fallback:',error); }
    })();
  }
  const motes = Array.from({ length: 46 }, () => ({
    x: Math.random(), y: Math.random(), radius: .55 + Math.random() * 1.1,
    speed: .0015 + Math.random() * .003, phase: Math.random() * Math.PI * 2,
    depth: .3 + Math.random() * .7,
  }));
  function resize() {
    width = window.innerWidth; height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (quiet) paint(0);
  }
  function paint(now) {
    const dt = Math.min((now - last) / 1000 || 0, .035); last = now;
    ctx.clearRect(0, 0, width, height);
    for (const p of ambient ? [] : motes) {
      if (!quiet) p.y = (p.y - p.speed * dt + 1) % 1;
      const rawX = p.x - journey * p.depth * .008 + Math.sin(now * .00012 + p.phase) * .008;
      const x = ((rawX % 1) + 1) % 1 * width;
      const y = p.y * height;
      const twinkle = .55 + .3 * Math.sin(now * .0006 + p.phase);
      ctx.globalAlpha = (.34 + night * .32) * twinkle;
      ctx.fillStyle = night > .5 ? '#f4e1b4' : '#ffffff';
      ctx.beginPath(); ctx.arc(x, y, p.radius, 0, Math.PI * 2); ctx.fill();
      if (night > .75 && p.radius > 1.45) {
        ctx.globalAlpha *= .25; ctx.fillRect(x - 4, y - .3, 8, .6); ctx.fillRect(x - .3, y - 4, .6, 8);
      }
    }
    sparks = sparks.filter(p => p.life > 0);
    for (const p of sparks) {
      p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 26 * dt; p.vx *= 1 - dt * .45;
      ctx.globalAlpha = Math.max(0, p.life / p.duration);
      ctx.strokeStyle = p.color; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .025, p.y - p.vy * .025); ctx.stroke();
      ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function tick(now) { frame = 0; paint(now); if (!document.hidden && !quiet && (!ambient || sparks.length)) frame = requestAnimationFrame(tick); }
  function start() { if (!frame && !document.hidden && !quiet && (!ambient || sparks.length)) frame = requestAnimationFrame(tick); }
  window.birthdayEffects = {
    setNight(value) { night = value; if (quiet) paint(0); },
    setJourney(value) { journey = value; },
    burst() {
      if (quiet) return;
      const centers = [[width * .24, height * .25], [width * .76, height * .3], [width * .5, height * .16]];
      sparks = centers.flatMap(([x, y]) => Array.from({ length: 42 }, (_, i) => {
        const angle = i * Math.PI * 2 / 42, velocity = 44 + Math.random() * 75, duration = 2.4 + Math.random() * 1.2;
        return { x, y, vx: Math.cos(angle) * velocity, vy: Math.sin(angle) * velocity, life: duration, duration, color: i % 3 ? '#edcf8c' : '#c5e0ee' };
      })); start();
    },
    reset() { sparks = [];ctx.clearRect(0,0,width,height); },
  };
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0;ambient?.pause(); } else { ambient?.play();last = performance.now(); start(); }
  });
  resize(); start();
})();
