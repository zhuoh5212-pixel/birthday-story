/* StPageFlip turns only the cover. The full letter remains in native scrollable HTML. */
(() => {
  const dialog = document.getElementById('birthdayReveal');
  const host = document.getElementById('letterBook');
  const content = document.getElementById('letterContent');
  const cover = document.getElementById('letterCover');
  const quiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let book = null, timer = 0, reading = false;
  // StPageFlip 2.0.7 has an unconditional render loop. A scoped scheduler suspends it
  // while the cover is closed, hidden, or replaced by the readable letter.
  let frame=0, callback=null, sleeping=true;
  const frames = window.birthdayBookFrames = {
    request(fn) { callback=fn;if(!sleeping && !frame && !document.hidden) frame=requestAnimationFrame(time=>{frame=0;const next=callback;callback=null;next?.(time);});return frame; },
    pause() { sleeping=true;cancelAnimationFrame(frame);frame=0; },
    resume() { sleeping=false;if(callback) this.request(callback); },
  };
  function dimensions() {
    const w = Math.min(480, dialog.clientWidth-44, (innerHeight*.65)*.70);
    return {width:Math.max(100,w),height:Math.max(140,w/.70)};
  }
  function showText() {
    clearTimeout(timer);timer=0;
    if (!dialog.open || !reading) return;
    dialog.classList.add('is-reading'); content.hidden=false;
    document.getElementById('letterScroll').scrollTop=0;
    content.focus({preventScroll:true});
    document.getElementById('closeCard').focus({preventScroll:true});
    book?.getRender().finishAnimation();frames.pause();
  }
  function init() {
    if (quiet || !window.St?.PageFlip || book) return;
    const size = dimensions(); host.style.width=`${size.width}px`;host.style.height=`${size.height}px`;
    try {
      book = new window.St.PageFlip(host,{...size,size:'fixed',usePortrait:true,
        showCover:true,autoSize:false,flippingTime:920,maxShadowOpacity:.22,
        useMouseEvents:false,mobileScrollSupport:false,drawShadow:true});
      const originalImage=document.getElementById('letterCoverImage');
      book.loadFromHTML(host.querySelectorAll('.book-page'));
      // Portrait mode clones a cover while turning; never duplicate its identifier.
      host.querySelectorAll('#letterCoverImage').forEach(node=>{if(node!==originalImage)node.removeAttribute('id');});
      dialog.classList.add('has-book');
    } catch (error) { console.warn('Cover fallback:',error);book=null;dialog.classList.remove('has-book'); }
  }
  function reset() {
    clearTimeout(timer);timer=0;reading=false;dialog.classList.remove('is-reading');
    content.hidden=false;
    if (book) { book.getRender().finishAnimation();book.turnToPage(0); }
    frames.pause();
  }
  window.birthdayBook = {
    open() { reset();init();if(book && !quiet) {content.hidden=true;frames.resume();} },
    read() {
      if (!book || quiet) return false;
      if (reading) return true;
      reading=true;frames.resume();book.flipNext('bottom');timer=setTimeout(showText,1100);return true;
    },
    reset,
    pause() { clearTimeout(timer);timer=0;book?.getRender().finishAnimation();frames.pause(); },
  };
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden) frames.pause();
    else if (reading && !dialog.classList.contains('is-reading')) showText();
    else if(dialog.open && !dialog.classList.contains('is-reading')) frames.resume();
  });
  window.addEventListener('resize',()=>{
    if(!book || !dialog.open) return;
    const size=dimensions();host.style.width=`${size.width}px`;host.style.height=`${size.height}px`;
    Object.assign(book.getSettings(),size);book.update();
  });
})();
