import { escapeHtml, filterNotes, getCategories, getCarouselNotes, getCollectionNotes, latestUpdate } from './note-view.js';

const app = document.querySelector('#app');
const state = { notes: [], category: '全部', query: '', tutorialCategory: '全部', tutorialQuery: '', active: null };
const REPO_URL = 'https://github.com/yuliye0409-hue/ai-question-notebook';
const iconArrow = '<svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const iconSearch = '<svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const iconBook = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><path d="M12 5v15M3 4c4-1 6 0 9 2 3-2 5-3 9-2v14c-4-1-6 0-9 2-3-2-5-3-9-2Z"/></svg>';
const iconPrevious = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M19 12H5m6 6-6-6 6-6"/></svg>';
const iconPause = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M9 5v14M15 5v14"/></svg>';
const iconPlay = '<svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="m8 5 12 7-12 7z"/></svg>';
let returnFocus = null;

function renderBody(body = []) {
  return body.map(block => {
    if (block.type === 'heading') return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === 'code') return `<pre><code>${escapeHtml(block.text)}</code></pre>`;
    if (block.type === 'list') return `<ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    if (block.type === 'callout') return `<aside class="callout"><strong>${escapeHtml(block.label)}</strong>${escapeHtml(block.text)}</aside>`;
    return '';
  }).join('');
}

function render() {
  const glossary = getCollectionNotes(state.notes);
  const tutorials = getCollectionNotes(state.notes, 'tutorials');
  const carouselNotes = getCarouselNotes(state.notes);
  const categories = getCategories(glossary);
  const tutorialCategories = getCategories(tutorials);
  const updated = latestUpdate(glossary);
  app.innerHTML = `
    <header class="site-header"><div class="header-inner">
      <a class="brand" href="./" aria-label="问而知，返回首页"><span class="brand-mark">${iconBook}</span><span>问而知<span class="brand-caption">AI 与跨专业知识笔记</span></span></a>
      <nav aria-label="主导航"><a class="nav-link" href="#notes">术语笔记</a><a class="nav-link" href="#tutorials">教程目录</a><a class="nav-link" href="#method">关于收录</a></nav>
      <a class="repo-link" href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub <span aria-hidden="true">↗</span></a>
    </div></header>
    <main id="main">
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-topline"><span>一份慢慢积累的知识笔记</span><span class="hero-edition">个人笔记 / 公开分享</span></div>
        <div class="hero-copy"><p class="eyebrow"><span class="status-dot"></span>从真实提问中整理</p><h1 id="hero-title">少一点陌生名词，<br><em>多一点理解。</em></h1><p class="hero-lede">把 AI 术语、技术名称与跨专业概念，<br class="mobile-break">解释清楚，留待下次查阅。</p><a class="button button-light" href="#notes">翻开笔记 ${iconArrow}</a></div>
        ${renderCarousel(carouselNotes)}
        <div class="hero-foot"><span>问过的，慢慢弄懂。</span><div class="shelf-controls" role="group" aria-label="笔记轮播控制"><button class="shelf-control" data-carousel-step="-1" aria-label="上一条笔记" title="上一条笔记">${iconPrevious}</button><button class="shelf-control" data-carousel-toggle aria-label="暂停自动滚动" title="暂停自动滚动" aria-pressed="false">${iconPause}</button><button class="shelf-control" data-carousel-step="1" aria-label="下一条笔记" title="下一条笔记">${iconArrow}</button></div></div>
      </section>
      <section class="content-section" id="notes" aria-labelledby="notes-title">
        <div class="section-head"><div><p class="eyebrow">THE NOTEBOOK</p><h2 id="notes-title">笔记索引<span class="section-total">${String(glossary.length).padStart(2, '0')}</span></h2><p class="section-description">定义、全称、含义，以及容易混淆的区别。</p></div><span class="collection-meta">${categories.length - 1} 个分类${updated ? ` <span aria-hidden="true">/</span> 最近整理 ${escapeHtml(updated)}` : ''}</span></div>
        <div class="index-toolbar"><div class="category-filters" role="group" aria-label="按主题筛选">${categories.map(category => `<button class="filter-button" data-category="${escapeHtml(category)}" aria-pressed="${state.category === category}">${escapeHtml(category)}<span>${category === '全部' ? glossary.length : glossary.filter(note => note.category === category).length}</span></button>`).join('')}</div><label class="search">${iconSearch}<input id="search" type="search" placeholder="搜索术语、名称…" aria-label="搜索笔记" aria-controls="notes-grid" autocomplete="off"><kbd aria-hidden="true">/</kbd></label></div>
        <div class="notes-grid" id="notes-grid"></div><p class="result-count" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
      <section class="content-section tutorial-section" id="tutorials" aria-labelledby="tutorials-title">
        <div class="section-head"><div><p class="eyebrow">PRACTICAL GUIDES</p><h2 id="tutorials-title">教程目录<span class="section-total">${String(tutorials.length).padStart(2, '0')}</span></h2><p class="section-description">从理解到操作，只整理明确获准收录的实践教程。</p></div><span class="collection-meta">独立于术语索引 · 按篇确认</span></div>
        <div class="index-toolbar"><div class="category-filters" role="group" aria-label="按教程主题筛选">${tutorialCategories.map(category => `<button class="filter-button" data-tutorial-category="${escapeHtml(category)}" aria-pressed="${state.tutorialCategory === category}">${escapeHtml(category)}<span>${category === '全部' ? tutorials.length : tutorials.filter(note => note.category === category).length}</span></button>`).join('')}</div><label class="search">${iconSearch}<input id="tutorial-search" type="search" placeholder="搜索教程、系统、场景…" aria-label="搜索教程" aria-controls="tutorials-grid" autocomplete="off"></label></div>
        <div class="notes-grid" id="tutorials-grid"></div><p class="tutorial-result-count result-count" role="status" aria-live="polite" aria-atomic="true"></p>
      </section>
      <section class="method-section" id="method" aria-labelledby="method-title"><div class="method-intro"><p class="eyebrow">A NOTE ON NOTES</p><h2 id="method-title">只留下值得<br>再看一遍的内容。</h2><p>术语索引收录 AI 专业术语、相关技术名称与跨专业知识。<br>跨专业条目逐条确认，教程仍单独归档。</p></div><div class="method-details"><div><span class="method-number">01</span><h3>从一个问题开始</h3><p>解释与实践分开整理，不自动收录日常工作过程。</p></div><div><span class="method-number">02</span><h3>每条笔记，单独确认</h3><p>先确认是否推送，再另行确认本次提问结束。</p></div><div><span class="method-number">03</span><h3>结束确认后等待 <span class="time-label">30 min</span></h3><p>获准笔记才安排同步，GitHub 推送后发布。</p></div><p class="method-disclaimer">以上为整理约定，网站不会自行监听对话或启动计时。</p></div></section>
    </main>
    <footer class="site-footer"><a class="brand footer-brand" href="./">${iconBook}<span>问而知</span></a><p>把不懂的，变成自己的。</p><a href="${REPO_URL}" target="_blank" rel="noreferrer">公开笔记 · GitHub ↗</a></footer>
    <dialog class="reader" aria-labelledby="article-title"><div class="reader-toolbar"><span>${iconBook} 笔记 / 阅读</span><button class="icon-button" data-close aria-label="关闭笔记"><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div><div id="reader-content"></div></dialog>`;
  renderResults();
  bindEvents();
}

function renderCard(note, index) {
  return `<article class="note-card"><div class="card-topline"><span>${note.entryType === 'tutorial' ? 'GUIDE' : 'NOTE'} / ${String(index + 1).padStart(2, '0')}</span>${iconBook}</div><p class="card-terms">${(note.tags || []).slice(0, 2).map(escapeHtml).join(' <span aria-hidden="true">/</span> ')}</p><h3><button class="note-open" data-note="${escapeHtml(note.id)}">${escapeHtml(note.title)}</button></h3><p class="card-summary">${escapeHtml(note.summary)}</p><div class="card-bottom"><div><span class="note-category">${escapeHtml(note.category)}</span><time datetime="${escapeHtml(note.updated)}">${escapeHtml(note.updated)}</time></div><span class="card-arrow" aria-hidden="true">${iconArrow}</span></div></article>`;
}

function renderCarousel(notes) {
  if (!notes.length) return '<div class="term-shelf term-shelf-empty" aria-label="公开笔记">暂无公开笔记</div>';
  const renderSlide = (note, index) => `<button class="term-slip slip-${index % 3 + 1}" data-note="${escapeHtml(note.id)}" aria-label="${note.entryType === 'tutorial' ? '阅读教程' : '阅读笔记'}：${escapeHtml(note.title)}"><span class="slip-top"><span>${note.entryType === 'tutorial' ? '教程' : '术语摘记'} / ${String(index + 1).padStart(2, '0')}</span>${iconArrow}</span><strong>${escapeHtml(note.tags?.[0] || note.title)}</strong><span class="slip-title">${escapeHtml(note.title)}</span><span class="slip-lines" aria-hidden="true"><i></i><i></i></span></button>`;
  const slides = notes.map((note, index) => renderSlide(note, index)).join('');
  const duplicates = notes.map((note, index) => renderSlide(note, index)).join('');
  const duration = Math.max(18000, notes.length * 5000);
  return `<section class="term-shelf" aria-label="全部公开笔记轮播" aria-roledescription="走马灯"><div class="term-window" data-carousel-window><div class="term-track" data-note-count="${notes.length}" style="--carousel-duration:${duration}ms"><div class="term-sequence">${slides}</div><div class="term-sequence term-track-copy" aria-hidden="true" inert>${duplicates}</div></div></div></section>`;
}

function renderResults() {
  const glossary = getCollectionNotes(state.notes);
  const notes = filterNotes(glossary, state.category, state.query);
  document.querySelector('#notes-grid').innerHTML = notes.length ? notes.map(renderCard).join('') : `<div class="empty-state">${iconSearch}<h3>暂时没有找到这条笔记</h3><p>试试其他名称，或清除筛选看看全部笔记。</p><button class="button button-dark" data-reset>清除筛选</button></div>`;
  document.querySelector('#notes .result-count').textContent = `显示 ${notes.length} / ${glossary.length} 篇公开笔记`;
  document.querySelectorAll('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === state.category)));
  const tutorials = getCollectionNotes(state.notes, 'tutorials');
  const guides = filterNotes(tutorials, state.tutorialCategory, state.tutorialQuery);
  document.querySelector('#tutorials-grid').innerHTML = guides.length ? guides.map(renderCard).join('') : `<div class="empty-state">${iconSearch}<h3>暂时没有找到这篇教程</h3><p>试试其他系统或场景名称。</p><button class="button button-dark" data-tutorial-reset>清除教程筛选</button></div>`;
  document.querySelector('.tutorial-result-count').textContent = `显示 ${guides.length} / ${tutorials.length} 篇公开教程`;
  document.querySelectorAll('[data-tutorial-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.tutorialCategory === state.tutorialCategory)));
}

function renderArticle(note) {
  const related = getCollectionNotes(state.notes, note.entryType === 'tutorial' ? 'tutorials' : 'notes').filter(item => item.id !== note.id).slice(0, 2);
  return `<article class="article-content"><div class="article-meta"><span>${escapeHtml(note.category)}</span><time datetime="${escapeHtml(note.updated)}">整理于 ${escapeHtml(note.updated)}</time></div><h2 id="article-title" tabindex="-1">${escapeHtml(note.title)}</h2><p class="article-lede">${escapeHtml(note.summary)}</p><div class="article-body">${renderBody(note.body)}</div><div class="article-end"><span>— 本条笔记完 —</span><button data-close>返回索引 ${iconArrow}</button></div>${related.length ? `<aside class="related-notes" aria-label="继续阅读"><p class="eyebrow">继续翻阅</p>${related.map(item => `<button data-note="${escapeHtml(item.id)}">${escapeHtml(item.title)} ${iconArrow}</button>`).join('')}</aside>` : ''}</article>`;
}

function openNote(id) {
  const note = state.notes.find(item => item.id === id);
  if (!note) return;
  const dialog = document.querySelector('.reader');
  if (!dialog.open) returnFocus = document.activeElement;
  state.active = note;
  document.querySelector('#reader-content').innerHTML = renderArticle(note);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('is-reading');
  dialog.scrollTop = 0;
  document.querySelector('#article-title').focus({ preventScroll: true });
}

function bindEvents() {
  app.addEventListener('click', event => {
    const note = event.target.closest('[data-note]');
    const category = event.target.closest('[data-category]');
    const tutorialCategory = event.target.closest('[data-tutorial-category]');
    if (note) openNote(note.dataset.note);
    if (category) { state.category = category.dataset.category; renderResults(); }
    if (tutorialCategory) { state.tutorialCategory = tutorialCategory.dataset.tutorialCategory; renderResults(); }
    if (event.target.closest('[data-close]')) document.querySelector('.reader').close();
    if (event.target.closest('[data-reset]')) {
      state.query = ''; state.category = '全部';
      document.querySelector('#search').value = '';
      renderResults(); document.querySelector('#search').focus();
    }
    if (event.target.closest('[data-tutorial-reset]')) {
      state.tutorialQuery = ''; state.tutorialCategory = '全部';
      document.querySelector('#tutorial-search').value = '';
      renderResults(); document.querySelector('#tutorial-search').focus();
    }
    if (event.target.closest('[data-carousel-step]')) stepCarousel(Number(event.target.closest('[data-carousel-step]').dataset.carouselStep));
    if (event.target.closest('[data-carousel-toggle]')) toggleCarousel();
  });
  document.querySelector('#search').addEventListener('input', event => { state.query = event.target.value; renderResults(); });
  document.querySelector('#tutorial-search').addEventListener('input', event => { state.tutorialQuery = event.target.value; renderResults(); });
  const dialog = document.querySelector('.reader');
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    state.active = null; document.body.classList.remove('is-reading');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
  });
  document.addEventListener('keydown', event => {
    const editing = event.target.closest('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !editing && !dialog.open && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault(); document.querySelector('#search').focus();
    }
  });
  bindCarousel();
}

let carouselPaused = false;
let carouselIndex = 0;
let carouselMotion = null;
let carouselPlaybackSync = null;
let carouselOpacityUpdate = null;

function bindCarousel() {
  const track = document.querySelector('.term-track');
  const windowElement = document.querySelector('[data-carousel-window]');
  const toggle = document.querySelector('[data-carousel-toggle]');
  if (!track || !toggle) return;
  carouselPaused = false;
  carouselIndex = 0;
  carouselMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const count = Number(track.dataset.noteCount);
  toggle.hidden = carouselMotion.matches;
  const visibleBySequence = new Map();
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const visible = entry.isIntersecting && entry.intersectionRatio >= 0.55;
      const slide = entry.target;
      const sequence = slide.parentElement;
      if (sequence.classList.contains('term-track-copy')) {
        const visibleSlides = visibleBySequence.get(sequence) || new Set();
        if (visible) visibleSlides.add(slide);
        else visibleSlides.delete(slide);
        visibleBySequence.set(sequence, visibleSlides);
        const hidden = visibleSlides.size === 0;
        sequence.inert = hidden;
        sequence.setAttribute('aria-hidden', String(hidden));
      }
      slide.inert = !visible;
      slide.setAttribute('aria-hidden', String(!visible));
      if (visible) slide.removeAttribute('tabindex');
      else slide.setAttribute('tabindex', '-1');
    }
  }, { root: windowElement, threshold: [0.55] });
  track.querySelectorAll('.term-slip').forEach(slide => observer.observe(slide));
  const updateOpacity = () => {
    const bounds = document.querySelector('.hero').getBoundingClientRect();
    track.querySelectorAll('.term-slip').forEach(slide => {
      const rect = slide.getBoundingClientRect();
      const fadeDistance = Math.max(60, Math.min(rect.width * 0.45, 110));
      const safeLeft = bounds.left + 12;
      const safeRight = bounds.right - 12;
      const fadeIn = Math.max(0, Math.min(1, (rect.left - safeLeft) / fadeDistance));
      const fadeOut = Math.max(0, Math.min(1, (safeRight - rect.right) / fadeDistance));
      const opacity = Math.min(fadeIn, fadeOut);
      slide.style.opacity = opacity.toFixed(3);
    });
  };
  carouselOpacityUpdate = updateOpacity;
  let opacityFrame = 0;
  const animateOpacity = () => {
    opacityFrame = 0;
    updateOpacity();
    if (!carouselPaused && !carouselMotion.matches && !windowElement.matches(':hover, :focus-within')) {
      opacityFrame = requestAnimationFrame(animateOpacity);
    }
  };
  const scheduleOpacity = () => {
    if (!opacityFrame) opacityFrame = requestAnimationFrame(animateOpacity);
  };
  const syncPlayback = () => {
    const animation = track.getAnimations()[0];
    if (carouselPaused || carouselMotion.matches || windowElement.matches(':hover, :focus-within')) {
      animation?.pause();
      if (opacityFrame) cancelAnimationFrame(opacityFrame);
      opacityFrame = 0;
      updateOpacity();
    } else {
      animation?.play();
      scheduleOpacity();
    }
  };
  carouselPlaybackSync = syncPlayback;
  windowElement.addEventListener('pointerenter', syncPlayback);
  windowElement.addEventListener('pointerleave', syncPlayback);
  windowElement.addEventListener('focusin', syncPlayback);
  windowElement.addEventListener('focusout', syncPlayback);
  carouselMotion.addEventListener('change', () => {
    toggle.hidden = carouselMotion.matches;
    if (carouselMotion.matches) {
      track.getAnimations().forEach(animation => animation.cancel());
      track.style.setProperty('--carousel-offset', '0px');
      if (opacityFrame) cancelAnimationFrame(opacityFrame);
      opacityFrame = 0;
      updateOpacity();
    } else {
      track.style.removeProperty('--carousel-offset');
      syncPlayback();
    }
  });
  window.addEventListener('resize', () => {
    if (carouselMotion.matches) track.style.setProperty('--carousel-offset', `${-carouselIndex * carouselStepSize(track)}px`);
    updateOpacity();
  }, { passive: true });
  updateOpacity();
  if (!carouselMotion.matches) scheduleOpacity();
  toggleCarouselButton(toggle);
}

function carouselStepSize(track) {
  const card = track.querySelector('.term-slip');
  const gap = parseFloat(getComputedStyle(track.querySelector('.term-sequence')).columnGap) || 0;
  return (card?.offsetWidth || 0) + gap;
}

function stepCarousel(direction) {
  const track = document.querySelector('.term-track');
  if (!track) return;
  const animation = track.getAnimations()[0];
  const count = Number(track.dataset.noteCount);
  if (carouselMotion?.matches || !animation) {
    carouselIndex = (carouselIndex + direction + count) % count;
    track.style.setProperty('--carousel-offset', `${-carouselIndex * carouselStepSize(track)}px`);
    carouselOpacityUpdate?.();
    return;
  }
  const duration = Number(animation.effect?.getTiming().duration);
  if (!Number.isFinite(duration) || duration <= 0) return;
  animation.pause();
  const currentTime = Number(animation.currentTime) || 0;
  animation.currentTime = ((currentTime + direction * duration / count) % duration + duration) % duration;
  if (!carouselPaused && !document.querySelector('[data-carousel-window]').matches(':hover, :focus-within')) animation.play();
}

function toggleCarousel() {
  const track = document.querySelector('.term-track');
  const toggle = document.querySelector('[data-carousel-toggle]');
  if (!track || !toggle || carouselMotion?.matches) return;
  carouselPaused = !carouselPaused;
  track.getAnimations()[0]?.[carouselPaused ? 'pause' : 'play']();
  toggleCarouselButton(toggle);
  carouselPlaybackSync?.();
}

function toggleCarouselButton(toggle) {
  if (!toggle) return;
  toggle.innerHTML = carouselPaused ? iconPlay : iconPause;
  toggle.setAttribute('aria-label', carouselPaused ? '继续自动滚动' : '暂停自动滚动');
  toggle.title = carouselPaused ? '继续自动滚动' : '暂停自动滚动';
  toggle.setAttribute('aria-pressed', String(carouselPaused));
}

async function init() {
  try {
    const response = await fetch('./notes.json', { cache: 'no-store' });
    if (!response.ok) throw new Error(`notes.json: ${response.status}`);
    state.notes = await response.json();
    render();
  } catch (error) {
    app.innerHTML = `<main class="error-state"><p class="eyebrow">LOAD ERROR</p><h1>笔记暂时打不开</h1><p>${escapeHtml(error.message)}</p><p>请刷新重试；本地预览请先运行 <code>node scripts/build.mjs</code>。</p></main>`;
  }
}

init();
