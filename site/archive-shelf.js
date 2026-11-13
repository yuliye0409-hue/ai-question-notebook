import { escapeHtml } from './note-view.js';

export const wrapIndex = (value, count) => count > 0 ? ((value % count) + count) % count : 0;
export const relativeIndex = (value, position, count) => wrapIndex(value - position + count / 2, count) - count / 2;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smoothstep = value => value * value * (3 - 2 * value);

// Integrating the screen scale packs distant spines together without cropping them.
export function createArc(height, mobile = false, availableWidth = Infinity) {
  const spine = height * 142 / 840;
  const depth = height * 474 / 900;
  const gap = height * 0.035;
  const falloff = Math.min(height * (mobile ? 1.05 : 1.3), availableWidth * 0.37);
  const scale = distance => 1 / (1 + (Math.abs(distance) / falloff) ** 1.6);
  const integral = [0];
  for (let u = 2; u <= 3 * falloff + 2; u += 2) integral.push(integral.at(-1) + 2 * scale(u));
  return { height, spine, depth, gap, falloff, scale, integral };
}

export function tapePose(relative, arc, lift = 0) {
  const { height, spine, depth, gap, falloff, scale, integral } = arc;
  const distance = Math.abs(relative);
  const open = smoothstep(Math.max(0, 1 - distance));
  const bend = distance < 1 ? (relative + Math.sin(Math.PI * relative) / Math.PI) / 2 : Math.sign(relative) * 0.5;
  const u = relative * (spine + gap) + (depth - spine + 1.4 * gap) * bend;
  const sc = scale(u);
  const k = 1 / sc;
  const lookup = Math.min(Math.abs(u) / 2, integral.length - 1);
  const lo = Math.floor(lookup);
  const xScreen = Math.sign(u) * (integral[lo] + ((integral[lo + 1] ?? integral[lo]) - integral[lo]) * (lookup - lo));
  return {
    x: xScreen * k,
    y: (height * 0.5 * (1 - sc) * 0.42 + open * height * 0.012 - lift * height * 0.05) * k,
    z: 1400 * (1 - k) + open * height * 0.1,
    rotation: Math.sign(u) * Math.min(1, Math.abs(u) / falloff) * 26 * (1 - open) - 90 * open,
    spineShade: Math.min(0.6, open * 0.55 + (1 - sc) * 0.32),
    coverShade: (1 - open) * 0.82,
    visible: Math.abs(u) <= falloff * 1.95,
    open
  };
}

export function nearestTarget(position, index, count) {
  return position + relativeIndex(index, wrapIndex(position, count), count);
}

const colors = ['#243e79', '#8e3d2c', '#53665a', '#a18346', '#334c57', '#6f4b49'];
export const coverColor = index => colors[wrapIndex(index, colors.length)];
const sequenceNumber = index => String(index + 1).padStart(2, '0');

function coverArt(index) {
  const motifs = [
    '<circle cx="100" cy="105" r="70"/><circle cx="100" cy="105" r="46"/><circle cx="100" cy="105" r="22"/><path d="M22 105h156M100 28v154"/>',
    '<path d="M26 158V52h46v106m56 0V52h46v106M12 105h176M48 26l104 158M152 26L48 184"/>',
    '<path d="M28 166V44h144v122H28m0-81h144M72 44v122M128 44v122"/><circle cx="100" cy="105" r="59"/>',
    '<path d="M25 159L100 34l75 125H25m25-20h100M63 117h74M76 96h48M88 74h24"/>',
    '<path d="M22 64h156M22 105h156M22 146h156M63 23v164M137 23v164"/><circle cx="100" cy="105" r="63"/>',
    '<circle cx="76" cy="105" r="54"/><circle cx="124" cy="105" r="54"/><path d="M20 170h160M100 24v162"/>'
  ];
  return `<svg class="cover-art" viewBox="0 0 200 210" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.3">${motifs[index % motifs.length]}</g></svg>`;
}

export function renderCover(note, index) {
  const title = note.tags?.[0] || note.title;
  return `<span class="cover-kicker">问而知 / KNOWLEDGE ARCHIVE</span><span class="cover-name${title.length > 8 ? ' cover-name-long' : ''}">${escapeHtml(title)}</span><span class="cover-category">${escapeHtml(note.category)}</span>${coverArt(index)}<span class="cover-bottom"><span>${escapeHtml((note.updated || note.date || '').slice(0, 4))}<br>VOL. ${sequenceNumber(index)}</span><span class="cover-seal">${note.entryType === 'tutorial' ? 'GUIDE' : 'NOTE'}</span></span>`;
}

export function renderArchive(notes) {
  if (!notes.length) return '<p class="archive-empty">暂无公开笔记，收录后会出现在书架上。</p>';
  const tapes = Array.from({ length: 3 }, (_, copy) => notes.map((note, index) => {
    const title = note.tags?.[0] || note.title;
    return `<button type="button" class="archive-tape" data-tape="${copy * notes.length + index}" tabindex="-1" aria-label="选择笔记：${escapeHtml(note.title)}" style="--tape-ink:${coverColor(index)}"><span class="tape-spine"><span class="spine-number">${sequenceNumber(index)}</span><span class="spine-title">${escapeHtml(title)}</span><span class="spine-mark">问而知</span></span><span class="tape-cover">${renderCover(note, index)}</span></button>`;
  }).join('')).join('');
  return `<div class="archive-library" data-archive>
    <div class="archive-backdrop" aria-hidden="true"><span>知识</span><span>手记</span></div>
    <div class="archive-scene" tabindex="0" role="group" aria-roledescription="旋转书架" aria-label="笔记书架，左右方向键切换，Enter 阅读。可横向拖动。">
      <div class="archive-floor" aria-hidden="true"></div><div class="archive-measure" aria-hidden="true"></div><div class="archive-stage">${tapes}</div>
    </div>
    <div class="archive-caption-row"><button class="archive-arrow" data-archive-step="-1" aria-label="上一条笔记">←</button><div class="archive-caption" aria-live="polite" aria-atomic="true"><p class="archive-position"></p><div class="archive-title-mask"><button class="archive-title" data-archive-open></button></div><p class="archive-meta"></p></div><button class="archive-arrow" data-archive-step="1" aria-label="下一条笔记">→</button></div>
    <div class="archive-timeline" role="group" aria-label="按笔记整理日期浏览">${notes.map((note, index) => `<button data-archive-index="${index}" aria-label="选择${escapeHtml(note.updated || note.date || '')}整理的笔记：${escapeHtml(note.title)}"><span class="timeline-tick"></span><span class="timeline-label">${escapeHtml((note.updated || note.date || '').slice(5).replace('-', '.'))}</span></button>`).join('')}<span class="timeline-dot" aria-hidden="true"></span></div>
    <div class="archive-foot"><span>拖动书脊翻阅 · 点击封面阅读</span><button class="archive-play" data-archive-toggle aria-label="暂停自动翻阅" aria-pressed="false">暂停翻阅 <span aria-hidden="true">Ⅱ</span></button><a href="#notes">查看全部笔记 ↗</a></div>
  </div>`;
}

export function bindArchive(root, notes, { openNote, isReading }) {
  if (!root || !notes.length) return null;
  const scene = root.querySelector('.archive-scene');
  const stage = root.querySelector('.archive-stage');
  const tapes = [...stage.querySelectorAll('.archive-tape')];
  const title = root.querySelector('[data-archive-open]');
  const position = root.querySelector('.archive-position');
  const meta = root.querySelector('.archive-meta');
  const dot = root.querySelector('.timeline-dot');
  const timelineButtons = [...root.querySelectorAll('[data-archive-index]')];
  const toggle = root.querySelector('[data-archive-toggle]');
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = notes.length;
  let s = count;
  let target = s;
  let active = -1;
  let arc;
  let raf = 0;
  let lastTime = 0;
  let autoTimer = 0;
  let paused = false;
  let inView = true;
  let hovered = false;
  let focused = false;
  let drag = null;
  let suppressClick = false;
  let hoveredTape = null;
  let tiltX = 0;
  let tiltY = 0;
  let aimX = 0;
  let aimY = 0;
  let labelStride = 1;
  const lifts = tapes.map(() => 0);

  const canPlay = () => !paused && !motion.matches && !hovered && !focused && !drag && !isReading() && inView && !document.hidden && count > 1;
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (canPlay()) autoTimer = setTimeout(() => { target = Math.round(target) + 1; wake(); }, 6500);
  }
  function wake() {
    clearTimeout(autoTimer);
    if (!raf && inView && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function measure() {
    arc = createArc(root.querySelector('.archive-measure').offsetHeight, scene.clientWidth < 768, scene.clientWidth);
    root.style.setProperty('--spine-width', `${arc.spine}px`);
    root.style.setProperty('--cover-width', `${arc.depth}px`);
    labelStride = Math.max(1, Math.ceil(count / Math.max(2, Math.floor(scene.clientWidth / 62))));
    updateLabels();
    wake();
  }
  function updateLabels() {
    timelineButtons.forEach((button, index) => {
      button.querySelector('.timeline-label').style.visibility = index === active || index === count - 1 || index % labelStride === 0 ? 'visible' : 'hidden';
    });
  }
  function updateCaption() {
    const index = wrapIndex(Math.round(s), count);
    if (index === active) return;
    const initial = active < 0;
    const direction = active < 0 || target >= s ? 1 : -1;
    active = index;
    title.textContent = notes[index].title;
    position.textContent = `${sequenceNumber(index)} / ${String(count).padStart(2, '0')} — ${notes[index].entryType === 'tutorial' ? '实践教程' : '知识笔记'}`;
    meta.textContent = `${notes[index].updated || notes[index].date || ''} — ${notes[index].category}`;
    timelineButtons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
    updateLabels();
    if (!initial && !motion.matches) {
      title.getAnimations().forEach(animation => animation.cancel());
      title.animate([{ transform: `translateY(${direction * 105}%)` }, { transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)' });
    }
  }
  function frame(time) {
    raf = 0;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = time;
    if (motion.matches || Math.abs(target - s) < 0.0005) s = target;
    else s += (target - s) * (1 - Math.exp(-(drag ? 18 : 5.2) * dt));
    if (Math.abs(s) > count * 4) {
      const shift = Math.floor(s / count) * count;
      s -= shift; target -= shift;
    }
    const ease = motion.matches ? 1 : 1 - Math.exp(-7 * dt);
    tiltX += (aimX - tiltX) * ease;
    tiltY += (aimY - tiltY) * ease;
    updateCaption();
    let lifting = false;
    tapes.forEach((tape, i) => {
      const r = relativeIndex(i, s, tapes.length);
      const liftTarget = tape === hoveredTape && Math.abs(r) > 0.5 ? 1 : 0;
      lifts[i] += (liftTarget - lifts[i]) * (motion.matches ? 1 : 1 - Math.exp(-12 * dt));
      lifting ||= Math.abs(liftTarget - lifts[i]) > 0.01;
      const pose = tapePose(r, arc, lifts[i]);
      tape.style.visibility = pose.visible ? 'visible' : 'hidden';
      tape.style.transform = `translate3d(${pose.x}px,${pose.y}px,${pose.z}px) rotateX(${tiltX * pose.open}deg) rotateY(${pose.rotation + tiltY * pose.open}deg)`;
      tape.style.zIndex = String(Math.round(3000 + pose.z));
      tape.style.setProperty('--spine-shade', pose.spineShade);
      tape.style.setProperty('--cover-shade', pose.coverShade);
      const selected = i === wrapIndex(Math.round(s), tapes.length);
      tape.classList.toggle('is-active', selected);
      tape.tabIndex = selected ? 0 : -1;
      // The duplicate shelf is decorative; keyboard and screen readers use the
      // selected cover plus the explicit, uniquely labelled date controls.
      tape.setAttribute('aria-hidden', String(!selected));
      tape.setAttribute('aria-pressed', String(selected));
      if (selected) tape.setAttribute('aria-label', `阅读笔记：${notes[active].title}`);
    });
    const fractional = wrapIndex(s, count);
    // The ruler is an ordered note index; duplicate dates remain distinct notes.
    dot.style.left = `${(fractional + 0.5) / count * 100}%`;
    if (Math.abs(target - s) > 0.0005 || lifting || Math.abs(tiltX - aimX) > 0.01 || Math.abs(tiltY - aimY) > 0.01) wake();
    else { lastTime = 0; scheduleAuto(); }
  }
  function select(index) {
    target = nearestTarget(Math.round(target), wrapIndex(index, count), count);
    wake();
  }
  function step(direction) { target = Math.round(target) + direction; wake(); }
  function readActive() {
    target = Math.round(s);
    const index = wrapIndex(target, count);
    const tape = tapes[wrapIndex(target, tapes.length)];
    openNote(notes[index].id, tape.querySelector('.tape-cover'));
    clearTimeout(autoTimer);
  }
  root.addEventListener('click', event => {
    if (suppressClick) { suppressClick = false; return; }
    const tape = event.target.closest('[data-tape]');
    if (tape) {
      const r = relativeIndex(Number(tape.dataset.tape), s, tapes.length);
      if (Math.abs(r) < 0.35 && Math.abs(target - s) < 0.35) readActive();
      else { target = Math.round(s + r); wake(); }
    }
    const arrow = event.target.closest('[data-archive-step]');
    if (arrow) step(Number(arrow.dataset.archiveStep));
    const tick = event.target.closest('[data-archive-index]');
    if (tick) select(Number(tick.dataset.archiveIndex));
    if (event.target.closest('[data-archive-open]')) readActive();
    if (event.target.closest('[data-archive-toggle]')) {
      paused = !paused;
      toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '继续自动翻阅' : '暂停自动翻阅');
      toggle.innerHTML = paused ? '继续翻阅 <span aria-hidden="true">▷</span>' : '暂停翻阅 <span aria-hidden="true">Ⅱ</span>';
      scheduleAuto();
    }
  });
  scene.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault(); step(event.key === 'ArrowLeft' ? -1 : 1);
    } else if (event.key === 'Enter' || (event.key === ' ' && event.target.closest('[data-tape]'))) { event.preventDefault(); readActive(); }
  });
  root.addEventListener('pointerenter', () => { hovered = true; clearTimeout(autoTimer); });
  root.addEventListener('pointerleave', () => { hovered = false; hoveredTape = null; aimX = aimY = 0; wake(); });
  root.addEventListener('focusin', () => { focused = true; clearTimeout(autoTimer); });
  root.addEventListener('focusout', event => { focused = root.contains(event.relatedTarget); scheduleAuto(); });
  scene.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    drag = { id: event.pointerId, x: event.clientX, y: event.clientY, start: target, moved: false };
  });
  scene.addEventListener('pointermove', event => {
    if (drag) {
      const dx = event.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(event.clientY - drag.y)) {
        drag.moved = true; scene.setPointerCapture(event.pointerId); scene.classList.add('is-dragging');
      }
      if (drag.moved) { target = drag.start - dx / (arc.spine + arc.gap); wake(); }
      return;
    }
    hoveredTape = event.target.closest('[data-tape]');
    const bounds = scene.getBoundingClientRect();
    const x = event.clientX - (bounds.left + bounds.width / 2);
    const y = event.clientY - (bounds.top + bounds.height / 2);
    const onCover = Math.abs(x) < arc.depth * 0.55 && Math.abs(y) < arc.height * 0.55;
    aimY = motion.matches ? 0 : clamp(x / arc.depth * (onCover ? 12 : 1), -7, 7);
    aimX = motion.matches || !onCover ? 0 : clamp(-y / arc.height * 8, -4, 4);
    wake();
  });
  function endDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    scene.classList.remove('is-dragging');
    if (moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 200);
      target = Math.round(target); wake();
    }
    else scheduleAuto();
  }
  scene.addEventListener('pointerup', endDrag);
  scene.addEventListener('pointercancel', endDrag);
  scene.addEventListener('lostpointercapture', endDrag);
  // A click released outside the shelf must also clear a pending drag.
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  scene.addEventListener('wheel', event => {
    // Only horizontal intent scrubs the shelf; vertical wheel still scrolls the notebook.
    if (isReading() || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return;
    event.preventDefault();
    target += clamp(event.deltaX / (arc.spine + arc.gap) * 0.3, -1, 1);
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { target = Math.round(target); wake(); }, 160);
    wake();
  }, { passive: false });
  let wheelTimer = 0;
  motion.addEventListener('change', () => { toggle.hidden = motion.matches; aimX = aimY = 0; wake(); });
  document.addEventListener('visibilitychange', () => { clearTimeout(autoTimer); if (!document.hidden) wake(); });
  const visibility = new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView) wake();
    else { clearTimeout(autoTimer); cancelAnimationFrame(raf); raf = 0; lastTime = 0; }
  });
  visibility.observe(root);
  new ResizeObserver(measure).observe(scene);
  toggle.hidden = motion.matches;
  measure();
  return { resume: scheduleAuto, pause: () => clearTimeout(autoTimer) };
}
