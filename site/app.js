const app = document.querySelector('#app');
const state = { notes: [], category: '全部', query: '', active: null };

const iconSearch = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function getCategories() {
  return ['全部', ...new Set(state.notes.map(note => note.category))];
}

function filteredNotes() {
  const query = state.query.trim().toLowerCase();
  return state.notes.filter(note => {
    if (note.draft) return false;
    const inCategory = state.category === '全部' || note.category === state.category;
    const haystack = [note.title, note.summary, note.category, ...(note.tags || [])].join(' ').toLowerCase();
    return inCategory && (!query || haystack.includes(query));
  }).sort((a, b) => String(b.updated).localeCompare(String(a.updated)));
}

function renderBody(body = []) {
  return body.map(block => {
    if (block.type === 'heading') return `<h3>${escapeHtml(block.text)}</h3>`;
    if (block.type === 'paragraph') return `<p>${escapeHtml(block.text)}</p>`;
    if (block.type === 'code') return `<pre>${escapeHtml(block.text)}</pre>`;
    if (block.type === 'list') return `<ul>${block.items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
    if (block.type === 'callout') return `<aside class="callout"><strong>${escapeHtml(block.label)}</strong>${escapeHtml(block.text)}</aside>`;
    return '';
  }).join('');
}

function render() {
  const notes = filteredNotes();
  const categories = getCategories();
  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar" aria-label="笔记导航">
        <a class="brand" href="./" aria-label="返回首页">
          <span class="brand-mark">问<br>知</span>
          <span class="brand-copy"><strong>问而知</strong><small>AI 使用笔记</small></span>
        </a>
        <div>
          <p class="nav-title">按主题阅读</p>
          <nav class="category-nav">
            ${categories.map(category => `<button class="category-btn ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}">${escapeHtml(category)}</button>`).join('')}
          </nav>
        </div>
        <div class="sidebar-foot">从“提问”项目的真实问题中整理。<br>内容持续增量更新，公开分享前会经过脱敏和审核。</div>
      </aside>
      <main class="main" id="main">
        <div class="topbar"><label class="search">${iconSearch}<input id="search" type="search" placeholder="搜索概念、工具或关键词" value="${escapeHtml(state.query)}" aria-label="搜索笔记"></label></div>
        <section class="hero">
          <div><p class="eyebrow">A living notebook · 2026</p><h1>把每一次提问，<br>变成下一次<em>会用。</em></h1><p class="hero-lede">记录 AI 工具、提示词、图像与视频工作流、网页部署和那些真正帮我解决问题的经验。</p></div>
          <div class="hero-note"><small>今天的提醒</small><p>先把问题讲清楚，再让工具开始工作。</p></div>
        </section>
        <section class="content" aria-labelledby="notes-title">
          <div class="content-head"><h2 id="notes-title">最近整理</h2><p class="result-count">${notes.length} 篇公开笔记</p></div>
          <div class="notes-grid">${notes.length ? notes.map(renderCard).join('') : '<p class="empty">没有找到匹配的笔记，换个关键词试试。</p>'}</div>
        </section>
        <footer class="footer">公开笔记站 · 内容来自“提问”项目的 AI 相关问答 · 更新于 ${escapeHtml(new Date().toLocaleDateString('zh-CN'))}</footer>
      </main>
    </div>
    <div class="drawer-backdrop ${state.active ? 'open' : ''}" data-close></div>
    <article class="drawer ${state.active ? 'open' : ''}" aria-label="笔记详情" ${state.active ? '' : 'inert'}>
      <button class="drawer-close" aria-label="关闭笔记" data-close>×</button>
      ${state.active ? renderArticle(state.active) : ''}
    </article>`;
  bindEvents();
}

function renderCard(note) {
  return `<article class="note-card"><div class="meta-row"><span class="tag">${escapeHtml(note.category)}</span><time datetime="${escapeHtml(note.updated)}">${escapeHtml(note.updated)}</time></div><h3><button data-note="${escapeHtml(note.id)}">${escapeHtml(note.title)}</button></h3><p class="note-summary">${escapeHtml(note.summary)}</p><div class="tag-row">${(note.tags || []).slice(0, 3).map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}</div></article>`;
}

function renderArticle(note) {
  return `<div class="article-meta"><span class="tag">${escapeHtml(note.category)}</span><time datetime="${escapeHtml(note.updated)}">整理于 ${escapeHtml(note.updated)}</time></div><h2>${escapeHtml(note.title)}</h2><p class="note-summary">${escapeHtml(note.summary)}</p><div class="article-body">${renderBody(note.body)}</div>${note.sourceThread ? `<a class="source-link" href="https://chatgpt.com/" target="_blank" rel="noreferrer">来源：提问项目中的相关问答 ↗</a>` : ''}</article>`;
}

function bindEvents() {
  document.querySelectorAll('[data-category]').forEach(button => button.addEventListener('click', () => { state.category = button.dataset.category; state.active = null; render(); }));
  document.querySelectorAll('[data-note]').forEach(button => button.addEventListener('click', () => { state.active = state.notes.find(note => note.id === button.dataset.note); render(); setTimeout(() => document.querySelector('.drawer-close')?.focus(), 0); }));
  document.querySelectorAll('[data-close]').forEach(element => element.addEventListener('click', () => { state.active = null; render(); }));
  const search = document.querySelector('#search');
  search?.addEventListener('input', event => { state.query = event.target.value; render(); const next = document.querySelector('#search'); next?.focus(); next?.setSelectionRange(state.query.length, state.query.length); });
  document.addEventListener('keydown', handleKeydown, { once: true });
}

function handleKeydown(event) { if (event.key === 'Escape' && state.active) { state.active = null; render(); } }

async function init() {
  try {
    const response = await fetch('./notes.json');
    if (!response.ok) throw new Error(`notes.json: ${response.status}`);
    state.notes = await response.json();
    render();
  } catch (error) {
    app.innerHTML = `<main class="content"><p class="eyebrow">加载失败</p><h1>笔记暂时打不开</h1><p>${escapeHtml(error.message)}。请运行 <code>npm run build</code> 后再预览。</p></main>`;
  }
}

init();
