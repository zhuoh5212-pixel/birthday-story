const story = window.BIRTHDAY_STORY;
const memories = story.memories;
const MEMORY_START = 3;
const MEMORY_SPACING = 1.15;
const FINAL_POSITION = MEMORY_START + memories.length * MEMORY_SPACING;
const viewport = document.getElementById('viewport');
const world = document.getElementById('world');
const actor = document.getElementById('actor');
const chicken = document.getElementById('chicken');
const speech = document.getElementById('speech');
const impact = document.getElementById('impact');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const clamp = (n, low = 0, high = 1) => Math.max(low, Math.min(high, n));
const range = (n, from, to) => clamp((n - from) / (to - from));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const photoImages = [];
const photoFrames = [];
const roadItems = [];
const supplyAssets = ['balloons', 'ribbon', 'candles', 'bow'];
const loadedPhotos = new Set();
let step = 0;
let ticking = false;
let spokenIndex = -1;
let latestJourney = 0;
let lastScrollTime = 0;

// Load the current photo and its neighbours as the journey advances.
const memoryHost = document.getElementById('memories');
for (const [i, photo] of memories.entries()) {
  const section = document.createElement('section');
  section.className = 'story-beat memory';
  section.style.left = `calc(var(--step) * ${MEMORY_START + i * MEMORY_SPACING})`;
  section.setAttribute('aria-label', `回憶 ${i + 1}：${photo.title || photo.filename}`);
  const figure = document.createElement('figure'); figure.className = 'photo-frame';
  photoFrames.push({ element: figure, width: photo.width, height: photo.height });
  const slot = document.createElement('div'); slot.className = 'photo-slot';
  const image = document.createElement('img'); image.alt = photo.title || `我們的第 ${i + 1} 張回憶照片`; image.decoding = 'async';
  image.width = photo.width; image.height = photo.height;
  image.dataset.src = photo.src; photoImages.push(image); slot.append(image);
  const roadItem = document.createElement('div'); roadItem.className = 'road-item';
  const supply = document.createElement('img');
  supply.src = `assets/objects/${supplyAssets[i % 4]}.svg`; supply.alt = '';
  roadItem.append(supply); roadItem.setAttribute('aria-hidden', 'true');
  roadItems.push(roadItem);
  figure.append(slot); section.append(figure, roadItem); memoryHost.append(section);
}
const finale = document.getElementById('finale');
finale.style.left = `calc(var(--step) * ${FINAL_POSITION})`;
const constellation = document.getElementById('constellation');
const constellationFrames = [];
const positions = [[17,21,-9],[83,20,8],[15,70,5],[85,70,-6],[30,10,6],[69,87,-7],[6,43,-5],[95,43,7],[38,85,3],[68,11,-6]];
const picks = [0,54,14,46,7,40,23,30,33,48];
for (const [i, position] of positions.entries()) {
  const figure = document.createElement('figure'); figure.className = 'constellation-photo';
  const image = document.createElement('img'); image.alt = ''; image.dataset.src = memories[picks[i]].src;
  figure.style.setProperty('--x', `${position[0]}%`); figure.style.setProperty('--y', `${position[1]}%`);
  figure.style.setProperty('--tilt', `${position[2]}deg`); figure.style.setProperty('--delay', `${.6 + i * .1}s`);
  figure.append(image); constellation.append(figure); constellationFrames.push({ figure, image, photo: memories[picks[i]] });
}
let wished = false;
let partyReady = false;
let finaleStarted = false;
let captured = false;
let catchStarted = false;
let endingLine = '';
let lastReadMemory = null;
let endingTimers = [];
let pickupTimer = 0;
let snapFinalePending = false;
let revealTimers = [];
let revealing = false;
const collected = new Set();
const surprise = window.BIRTHDAY_SURPRISE;
const surpriseCard = document.getElementById('birthdayReveal');
const letterScroll = document.getElementById('letterScroll');
const revealStatus = document.getElementById('revealStatus');
document.getElementById('letterCoverImage').src = surprise.coverImage;
document.getElementById('envelopePreview').src = surprise.coverImage;
document.getElementById('letterHeading').textContent = surprise.heading;
document.getElementById('letterMessage').textContent = surprise.message;
if (surprise.audio) { const audio = document.getElementById('birthdayAudio'); audio.src = surprise.audio; audio.hidden = false; }
if (surprise.giftImage) { const image = document.getElementById('giftImage'); image.src = surprise.giftImage; image.hidden = false; }
function collectMemory(index) {
  if (collected.has(index)) return;
  collected.add(index);
  const offset = latestJourney - (MEMORY_START + index * MEMORY_SPACING);
  if (offset <= .72 && !reduceMotion) {
    roadItems[index].classList.add('is-collected');
    clearTimeout(pickupTimer);
    actor.classList.add('is-picking');
    pickupTimer = setTimeout(() => actor.classList.remove('is-picking'), 660);
  } else roadItems[index].classList.add('is-gone');
}
function later(delay, action) {
  endingTimers.push(setTimeout(() => { if (finaleStarted) { action(); update(); } }, reduceMotion ? 0 : delay));
}
function beginFinale() {
  if (finaleStarted) return;
  finaleStarted = true; endingLine = '終於追到啦！';
  clearTimeout(pickupTimer); actor.classList.remove('is-picking');
  finale.classList.add('is-catching');
  snapFinalePending = Math.abs(viewport.scrollLeft - FINAL_POSITION * step) > 2;
  for (const card of constellationFrames) card.image.src = card.image.dataset.src;
  later(350, () => { catchStarted = true; actor.classList.add('is-catching'); });
  later(1050, () => { captured = true; endingLine = '麻麻甜甜快樂!'; finale.classList.add('is-gift-open'); actor.classList.remove('is-catching'); });
  later(1400, () => { finale.classList.add('is-decorating'); actor.classList.add('is-decorating'); });
  later(2800, () => {
    partyReady = true; finale.classList.add('is-party-ready');
    document.body.classList.add('is-party-ready'); actor.classList.remove('is-decorating');
    document.getElementById('wishButton').disabled = false;
    document.getElementById('reopenCard').hidden = false;
    document.getElementById('reopenCard').textContent = '打開這封信';
    window.birthdayEffects?.burst();
  });
  later(4600, () => { endingLine = ''; });
}
function stopFinale() {
  window.birthdayBook?.reset();window.birthdayScroll?.resume();
  resetLetterReveal();
  endingTimers.forEach(clearTimeout); endingTimers = [];
  finaleStarted = false; partyReady = false; captured = false; catchStarted = false; wished = false; endingLine = '';
  snapFinalePending = false;
  for (const name of ['is-catching', 'is-gift-open', 'is-decorating', 'is-party-ready', 'is-wished']) finale.classList.remove(name);
  for (const name of ['is-catching', 'is-decorating']) actor.classList.remove(name);
  document.body.classList.remove('is-party-ready');
  document.getElementById('wishButton').disabled = true;
  document.getElementById('wishButton').setAttribute('aria-expanded', 'false');
  document.getElementById('wishPrompt').textContent = '許個願。';
  document.getElementById('reopenCard').hidden = true;
  if (surpriseCard.open) surpriseCard.close();
  surpriseCard.setAttribute('aria-hidden', 'true');
  document.getElementById('birthdayAudio').pause();
  for (const card of constellationFrames) card.image.removeAttribute('src');
}
function openCard() {
  window.birthdayScroll?.pause();
  surpriseCard.setAttribute('aria-hidden', 'false');
  if (!surpriseCard.open) surpriseCard.showModal();
  window.birthdayBook?.open();
}
function resetLetterReveal() {
  window.birthdayMotion?.cancel();
  revealTimers.forEach(clearTimeout); revealTimers = []; revealing = false;
  for (const name of ['is-gathering', 'is-envelope', 'is-letter-opening']) finale.classList.remove(name);
  document.body.classList.remove('is-unwrapping');
  revealStatus.textContent = '';
}
function finishLetterReveal() {
  if (!revealing || !wished || !journeyState(latestJourney).finished) return;
  openCard();
  document.getElementById('reopenCard').hidden=false;
  document.getElementById('reopenCard').textContent='再打開這封信';
  resetLetterReveal();
}
function revealLetter() {
  resetLetterReveal();
  letterScroll.scrollTop = 0;
  if (reduceMotion) {
    document.getElementById('reopenCard').hidden = false;
    openCard(); return;
  }
  revealing = true;
  document.body.classList.add('is-unwrapping');
  revealStatus.textContent = '回憶照片正在聚成一封信。';
  const revealLater = (delay, action) => revealTimers.push(setTimeout(() => {
    if (revealing && wished && journeyState(latestJourney).finished) action();
  }, delay));
  // A suspended animation engine must never prevent reading the actual letter.
  revealLater(4200,finishLetterReveal);
  try {
    if (window.birthdayMotion?.reveal({cards:constellationFrames,finale,
      onStage:name=>finale.classList.add(name),onComplete:finishLetterReveal})) return;
  } catch(error) { console.warn('Letter animation fallback:',error);window.birthdayMotion?.cancel(); }
  revealLater(360, () => finale.classList.add('is-gathering'));
  revealLater(1750, () => finale.classList.add('is-envelope'));
  revealLater(2550, () => finale.classList.add('is-letter-opening'));
  revealLater(3550,finishLetterReveal);
}
function closeCard() {
  window.birthdayBook?.pause();
  surpriseCard.close(); surpriseCard.setAttribute('aria-hidden', 'true');
  window.birthdayScroll?.resume();
  document.getElementById('birthdayAudio').pause();
}
function fitPhoto(width, height, photoWidth, photoHeight, opening = false) {
  const portrait = width < 800 && height > 520;
  const padding = (portrait ? opening ? 9 : 7 : opening ? 11 : 9) + 1;
  const ratio = photoWidth / photoHeight;
  const maxWidth = width * (opening ? portrait ? .84 : .60 : portrait ? .84 : .49);
  const maxHeight = height * (opening ? portrait ? .58 : .66 : portrait ? .49 : height <= 520 ? .60 : .65);
  const imageWidth = Math.min(maxWidth - 2 * padding, (maxHeight - 2 * padding) * ratio);
  return { width: imageWidth + 2 * padding, height: imageWidth / ratio + 2 * padding, imageWidth, imageHeight: imageWidth / ratio, padding };
}
function fitFrames() {
  const width = step, height = window.innerHeight;
  for (const frame of photoFrames) frame.element.style.width = `${fitPhoto(width, height, frame.width, frame.height).width}px`;
  document.getElementById('openingFrame').style.width = `${fitPhoto(width, height, story.openingWidth, story.openingHeight, true).width}px`;
  const road = roadItemLayout(width, height);
  for (const item of roadItems) {
    item.style.left = `${road.localX}px`; item.style.bottom = `${road.bottom}px`;
  }
  const layout = partyLayout(width, height);
  finale.style.setProperty('--cake-scale', String(layout.cakeScale));
  finale.style.setProperty('--cake-top', `${layout.cakeTop}px`);
  finale.style.setProperty('--center-height', `${layout.centerHeight}px`);
  constellationFrames.forEach((card, index) => {
    const maxH = height * (layout.portrait ? index >= 4 ? .10 : .17 : layout.short ? .18 : .22);
    const maxW = layout.portrait ? Math.min(78, width * .18) : layout.short ? 86 : Math.min(width * .10, 138);
    const cardWidth = Math.min(maxW, (maxH - 8) * card.photo.width / card.photo.height + 8);
    card.figure.style.setProperty('--card-width', `${cardWidth}px`); card.figure.style.setProperty('--mobile-width', `${cardWidth}px`);
    card.figure.style.setProperty('--x', `${layout.positions[index][0]}%`); card.figure.style.setProperty('--y', `${layout.positions[index][1]}%`);
    card.figure.style.setProperty('--merge-x', `${width * (.5 - layout.positions[index][0] / 100)}px`);
    card.figure.style.setProperty('--merge-y', `${height * (.46 - layout.positions[index][1] / 100)}px`);
    card.figure.style.setProperty('--merge-delay', `${index * 45}ms`);
  });
}
function roadItemLayout(width, height) {
  const portrait = width < 800 && height > 520;
  const actorWidth = portrait ? Math.min(width * .29, 155) : height <= 520 ? Math.min(width * .18, 140) : clamp(width * .19, 140, 245);
  const actorLeft = width * (portrait ? .06 : .13);
  const contactX = actorLeft + actorWidth * .88;
  return { contactX, localX: contactX + width * .39, bottom: height * (portrait ? .18 : height <= 520 ? .16 : .17) + actorWidth * .055 };
}
function partyLayout(width, height) {
  const portrait = width < 800 && height > 520, short = height <= 520;
  const centerHeight = Math.min(460, height * (short ? .68 : .64));
  const cakeTop = short ? 58 : portrait ? 100 : 108;
  const cakeScale = Math.min(portrait ? .94 : short ? .76 : 1.1, width * (portrait ? .61 : .40) / 300, (centerHeight - cakeTop - 55) / 255);
  const positions = portrait
    ? [[18,24],[82,24],[13,64],[87,64],[33,9],[67,9],[8,44],[92,44],[29,80],[73,80]]
    : short ? [[25,25],[75,25],[26,68],[74,68],[35,16],[65,16],[8,44],[92,44],[29,80],[73,80]]
    : [[26,25],[74,25],[26,58],[74,58],[35,18],[65,18],[16,43],[84,43],[34,78],[68,78]];
  return { portrait, short, centerHeight, cakeTop, cakeScale, positions };
}
function loadNearby(index) {
  for (const i of loadedPhotos) {
    if (i < index - 2 || i > index + 3) { photoImages[i].removeAttribute('src'); loadedPhotos.delete(i); }
  }
  for (let i = Math.max(0, index - 1); i <= Math.min(memories.length - 1, index + 2); i++) {
    const image = photoImages[i]; if (!image.getAttribute('src')) image.src = image.dataset.src;
    loadedPhotos.add(i);
  }
}
loadNearby(0);
function journeyState(journey) {
  const index = Math.round((journey - MEMORY_START) / MEMORY_SPACING);
  const offset = journey - (MEMORY_START + index * MEMORY_SPACING);
  const memoryVisible = index >= 0 && index < memories.length && offset >= -.2 && offset <= .39;
  return { index, memoryVisible, finished: journey >= FINAL_POSITION - .25 };
}
function sizeWorld() {
  const previousJourney = step ? viewport.scrollLeft / step : 0;
  step = viewport.clientWidth || window.innerWidth;
  world.style.setProperty('--step', `${step}px`);
  world.style.width = `${step * (FINAL_POSITION + 1)}px`;
  fitFrames();
  window.birthdayScroll?.resize();
  scrollWorld(previousJourney * step,true); update();
}
function scrollWorld(left, immediate=false) {
  if (window.birthdayScroll) window.birthdayScroll.to(left,{immediate});
  else viewport.scrollTo({left,behavior:immediate || reduceMotion ? 'auto' : 'smooth'});
}
function update() {
  ticking = false;
  const journey = viewport.scrollLeft / step; latestJourney = journey;
  const maximum = Math.max(1, viewport.scrollWidth - viewport.clientWidth);
  const fraction = clamp(viewport.scrollLeft / maximum);
  progressBar.style.transform = `scaleX(${fraction})`;
  progress.setAttribute('aria-valuenow', String(Math.round(100 * fraction)));
  const state = journeyState(journey); loadNearby(clamp(state.index, 0, memories.length - 1));
  document.body.classList.toggle('is-opening', journey < .45);
  document.documentElement.style.setProperty('--opening-fade', String(1 - range(journey, 0, .6)));
  for (const i of loadedPhotos) photoFrames[i].element.classList.toggle('is-active', state.memoryVisible && state.index === i);
  if (lastReadMemory !== null) {
    const anchor = MEMORY_START + lastReadMemory * MEMORY_SPACING;
    if (journey > anchor + .39) { collectMemory(lastReadMemory); lastReadMemory = null; }
    else if (journey < anchor - .21) lastReadMemory = null;
  }
  if (state.memoryVisible) lastReadMemory = state.index;
  if (state.finished) beginFinale(); else if (finaleStarted) stopFinale();
  const night = range(journey, FINAL_POSITION - 1.35, FINAL_POSITION - .05);
  document.documentElement.style.setProperty('--night', String(night));
  const ridgePeriod = step * 1.2;
  document.documentElement.style.setProperty('--far-drift', `${-(viewport.scrollLeft * .055 % ridgePeriod)}px`);
  document.documentElement.style.setProperty('--near-drift', `${-(viewport.scrollLeft * .11 % ridgePeriod)}px`);
  document.documentElement.style.setProperty('--cloud-drift', `${Math.sin(journey * .12) * 80}px`);
  document.body.classList.toggle('is-night', night > .5);
  document.body.classList.toggle('is-ending', state.finished);
  window.birthdayEffects?.setNight(night); window.birthdayEffects?.setJourney(journey);
  const drop = range(journey, .72, 1.07);
  if (journey <= .72) {
    actor.style.opacity = '0'; actor.style.transform = `translateY(${-window.innerHeight}px) rotate(-26deg)`;
  } else {
    actor.style.opacity = String(range(journey, .72, .77));
    const rise = range(journey, 1.09, 1.37);
    const easedDrop = 1 - Math.pow(1 - drop, 2.4);
    const y = -(1 - easedDrop) * window.innerHeight * 1.12;
    actor.style.transform = `translateY(${y}px) rotate(${-26 * (1 - drop) + 10 * Math.sin(rise * Math.PI)}deg) scaleY(${1 - .18 * Math.sin(rise * Math.PI)})`;
  }
  impact.classList.toggle('is-visible', journey > 1.04 && journey < 1.3);
  actor.classList.toggle('is-looking', state.memoryVisible || state.finished);
  actor.classList.toggle('is-running', journey > 1.54 && !state.memoryVisible && !state.finished && performance.now() - lastScrollTime < 190);
  chicken.classList.toggle('is-visible', journey > 1.42 && !state.memoryVisible && (!state.finished || !captured));
  chicken.classList.toggle('is-catching', state.finished && catchStarted && !captured);
  let line = '';
  if (state.memoryVisible) line = memories[state.index].message;
  else if (journey > .82 && journey < 1.07) line = '咦？有人跟著掉出來了。';
  else if (journey >= 1.07 && journey < 1.43) line = '牠好像發現了甚麼……';
  else if (journey > 1.54 && journey < 2.6) line = '等等我，雞腿！';
  else if (state.finished && !wished && !partyReady) line = endingLine;
  speech.classList.toggle('is-visible', Boolean(line));
  if (speech.textContent !== line) speech.textContent = line;
  spokenIndex = state.memoryVisible ? state.index : -1;
  document.getElementById('previous').disabled = journey < .02;
  document.getElementById('next').disabled = state.finished;
  if (snapFinalePending) {
    snapFinalePending = false;
    scrollWorld(FINAL_POSITION * step);
  }
}
viewport.addEventListener('scroll', () => {
  lastScrollTime = performance.now(); if (ticking) return;
  ticking = true; requestAnimationFrame(update);
}, { passive: true });
setInterval(() => { if (performance.now() - lastScrollTime >= 190) actor.classList.remove('is-running'); }, 200);
viewport.addEventListener('wheel', event => {
  if (window.birthdayScroll) return;
  if (event.ctrlKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
  event.preventDefault();
  const unit = event.deltaMode === 1 ? 18 : event.deltaMode === 2 ? step : 1;
  viewport.scrollLeft += event.deltaY * unit;
}, { passive: false });
const stops = [0, 1.12, 2.05, ...memories.map((_, i) => MEMORY_START + i * MEMORY_SPACING), FINAL_POSITION];
function navigate(direction) {
  const target = direction > 0 ? stops.find(p => p > latestJourney + .15) : [...stops].reverse().find(p => p < latestJourney - .15);
  if (target === undefined) return;
  scrollWorld(target * step);
}
document.getElementById('previous').addEventListener('click', () => navigate(-1));
document.getElementById('next').addEventListener('click', () => navigate(1));
document.getElementById('wishButton').addEventListener('click', () => {
  if (wished || !partyReady) return;
  wished = true;
  for (const card of constellationFrames) card.image.src = card.image.dataset.src;
  finale.classList.add('is-wished');
  document.getElementById('wishButton').setAttribute('aria-expanded', 'true');
  document.getElementById('wishButton').disabled = true;
  document.getElementById('reopenCard').hidden = true;
  speech.classList.remove('is-visible');
  revealLetter();
});
document.getElementById('readLetter').addEventListener('click', () => {
  if (window.birthdayBook?.read()) return;
  const content = document.getElementById('letterContent');
  content.focus({ preventScroll: true });
  content.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
});
document.getElementById('restart').addEventListener('click', () => {
  stopFinale();
  collected.clear(); lastReadMemory = null;
  clearTimeout(pickupTimer);
  for (const item of roadItems) { item.classList.remove('is-collected'); item.classList.remove('is-gone'); }
  actor.classList.remove('is-picking');
  window.birthdayEffects?.reset();
  window.birthdayBook?.reset();window.birthdayScroll?.resume();
  scrollWorld(0,true);
});
document.getElementById('reopenCard').addEventListener('click', () => {
  if (!wished) {document.getElementById('wishButton').click();return;}
  if (revealing) {finishLetterReveal();return;}
  openCard();
});
document.getElementById('closeCard').addEventListener('click', closeCard);
surpriseCard.addEventListener('cancel', () => {
  window.birthdayBook?.pause();window.birthdayScroll?.resume();
  surpriseCard.setAttribute('aria-hidden', 'true'); document.getElementById('birthdayAudio').pause();
});
let touchStart = null;
viewport.addEventListener('touchstart', event => {
  if (window.birthdayScroll) return;
  if (event.touches.length !== 1) { touchStart = null; return; }
  const touch = event.touches[0]; touchStart = { x: touch.clientX, y: touch.clientY, scroll: viewport.scrollLeft };
}, { passive: true });
viewport.addEventListener('touchmove', event => {
  if (window.birthdayScroll) return;
  if (!touchStart || event.touches.length !== 1) return;
  const dx = event.touches[0].clientX - touchStart.x, dy = event.touches[0].clientY - touchStart.y;
  if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 6) {
    if (event.cancelable) event.preventDefault(); viewport.scrollLeft = touchStart.scroll - dy;
  }
}, { passive: false });
viewport.addEventListener('touchend', () => { touchStart = null; }, { passive: true });
viewport.addEventListener('keydown', event => {
  if (event.target.tagName === 'BUTTON') return;
  const direction = ['ArrowRight', 'PageDown', ' '].includes(event.key) ? 1 : ['ArrowLeft', 'PageUp'].includes(event.key) ? -1 : 0;
  if (!direction) return; event.preventDefault(); navigate(direction);
});
window.addEventListener('resize', sizeWorld);
sizeWorld();
