/* Anime.js timeline; stack choreography inspired by Codrops ImageStackGrid.
 * Envelope sequencing inspired by Waddle. See THIRD-PARTY-NOTICES.md. */
(() => {
  let timeline = null, restored = [], stageHost = null;
  function cancel() {
    timeline?.revert(); timeline = null;
    for (const [element, value] of restored) {
      element.style.transform = value.transform;
      element.style.opacity = value.opacity;
      element.style.visibility = value.visibility;
    }
    restored = []; stageHost?.classList.remove('oss-reveal'); stageHost = null;
  }
  function remember(element) {
    restored.push([element, {transform:element.style.transform, opacity:element.style.opacity, visibility:element.style.visibility}]);
  }
  window.birthdayMotion = {
    cancel,
    reveal({cards, finale, onStage, onComplete}) {
      if (!window.anime?.createTimeline) return false;
      cancel(); stageHost = finale; finale.classList.add('oss-reveal');
      timeline = window.anime.createTimeline({autoplay:false, defaults:{ease:'inOutQuint'}});
      // Reverse the gallery-to-grid gesture: staggered cards converge into a stack.
      cards.forEach(({figure}, index) => {
        if (getComputedStyle(figure).display === 'none') return;
        remember(figure);
        const style = getComputedStyle(figure);
        const pose = {x:0,y:0,angle:parseFloat(style.getPropertyValue('--tilt')) || 0,scale:1,alpha:1};
        const x = parseFloat(style.getPropertyValue('--merge-x')) || 0;
        const y = parseFloat(style.getPropertyValue('--merge-y')) || 0;
        const paint = () => {
          figure.style.transform = `translate(calc(-50% + ${pose.x}px),calc(-50% + ${pose.y}px)) rotate(${pose.angle}deg) scale(${pose.scale})`;
          figure.style.opacity = pose.alpha;
        };
        timeline.add(pose,{x,y,angle:(index-4.5)*1.2,scale:.74,duration:1050,onUpdate:paint},360+index*45);
        timeline.add(pose,{angle:0,scale:.28,alpha:0,duration:480,ease:'inCubic',onUpdate:paint},1700+index*28);
      });
      const assembly = finale.querySelector('.letter-assembly');
      const flap = finale.querySelector('.envelope-flap');
      const seal = finale.querySelector('.envelope-seal');
      const paper = finale.querySelector('.envelope-paper');
      [assembly,flap,seal,paper].forEach(remember);
      const envelope = {alpha:0,lift:22,scale:.94,flap:0,seal:1,paper:0};
      const paintEnvelope = () => {
        assembly.style.visibility = 'visible'; assembly.style.opacity = envelope.alpha;
        assembly.style.transform = `translate(-50%,-50%) translateY(${envelope.lift}px) scale(${envelope.scale})`;
        flap.style.transform = `rotateX(${envelope.flap}deg)`;
        seal.style.opacity = envelope.seal;
        paper.style.transform = `translateY(${envelope.paper}%)`;
      };
      // Waddle's in-place opening: seal releases, flap rotates, paper rises afterwards.
      timeline.add(envelope,{alpha:1,lift:0,scale:1,duration:580,ease:'outCubic',onUpdate:paintEnvelope},1660)
        .add(envelope,{seal:0,duration:260,onUpdate:paintEnvelope},2370)
        .add(envelope,{flap:175,duration:640,ease:'inOutCubic',onUpdate:paintEnvelope},2550)
        .add(envelope,{paper:-68,duration:710,ease:'outCubic',onUpdate:paintEnvelope},2760)
        .call(()=>onStage('is-gathering'),360)
        .call(()=>onStage('is-envelope'),1750)
        .call(()=>onStage('is-letter-opening'),2550)
        .call(onComplete,3550);
      timeline.play(); return true;
    },
  };
})();
