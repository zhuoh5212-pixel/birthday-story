/* Lenis smooths one continuous horizontal world. Native fallback lives in story.js. */
(() => {
  if (!window.Lenis || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const viewport = document.getElementById('viewport');
  const lenis = new window.Lenis({wrapper:viewport,content:document.getElementById('world'),
    orientation:'horizontal',gestureOrientation:'both',smoothWheel:true,
    syncTouch:true,syncTouchLerp:.14,touchInertiaExponent:1.2,lerp:.085,
    autoRaf:false,overscroll:false});
  let frame = 0, paused = false;
  function tick(time) { frame = 0; lenis.raf(time); if (!paused && !document.hidden) frame = requestAnimationFrame(tick); }
  function start() { if (!frame && !paused && !document.hidden) frame = requestAnimationFrame(tick); }
  window.birthdayScroll = {
    to(left, {immediate=false}={}) { lenis.scrollTo(left,{immediate,duration:.85,force:true}); },
    resize() { lenis.resize(); },
    pause() { paused=true;lenis.stop();cancelAnimationFrame(frame);frame=0; },
    resume() { paused=false;lenis.start();start(); },
  };
  document.addEventListener('visibilitychange',()=>{
    if (document.hidden) { cancelAnimationFrame(frame);frame=0; }
    else start();
  });
  start();
})();
