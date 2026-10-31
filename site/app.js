const app = document.querySelector('#app');
const state = { notes: [], category: '全部', query: '', active: null };
const REPO_URL = 'https://github.com/yuliye0409-hue/ai-question-notebook';
const iconSearch = '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>';
const iconArrow = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M5 12h13"/><path d="m13 6 6 6-6 6"/></svg>';

function escapeHtml(value = '') {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function getCategories() { return ['全部', ...new Set(state.notes.map(note => note.category))]; }

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
  const totalCategories = categories.length - 1;
  app.innerHTML = `
    <header class="site-header">
      <div class="header-inner">
        <a class="brand" href="./" aria-label="返回首页"><span class="brand-mark">问</span><span class="brand-name">问而知</span></a>
        <nav class="site-nav" aria-label="主导航"><a class="nav-link active" href="#notes">笔记</a><a class="nav-link" href="#method">整理方法</a><a class="nav-link" href="${REPO_URL}" target="_blank" rel="noreferrer">仓库 ↗</a></nav>
        <div class="header-actions"><span class="header-status"><i></i>持续更新</span><a class="button button-dark button-sm" href="${REPO_URL}" target="_blank" rel="noreferrer">查看项目</a></div>
      </div>
    </header>
    <main id="main">
      <section class="hero-band">
        <div class="hero-inner">
          <div class="hero-copy"><p class="eyebrow">AI_NOTEBOOK / PUBLIC</p><h1>把问题变成<br><span>可复用的答案。</span></h1><p class="hero-lede">从“提问”项目里持续整理 AI 工具、提示词、图像与视频工作流，以及真正解决过的问题。</p><div class="hero-actions"><a class="button button-dark" href="#notes">浏览笔记 ${iconArrow}</a><a class="text-link" href="${REPO_URL}" target="_blank" rel="noreferrer">查看 GitHub 仓库 ${iconArrow}</a></div></div>
          <div class="hero-visual" aria-hidden="true"><div class="mesh mesh-one"></div><div class="mesh mesh-two"></div><div class="mesh mesh-three"></div><div class="hero-terminal"><div class="terminal-bar"><span></span><span></span><span></span><b>sync.log</b></div><code><em>01</em>  collect  new questions<br><em>02</em>  distill  useful patterns<br><em>03</em>  publish  when ready<span class="cursor">_</span></code></div></div>
        </div>
      </section>
      <section class="stats-strip" aria-label="笔记统计"><div><strong>${state.notes.length}</strong><span>公开笔记</span></div><div><strong>${totalCategories}</strong><span>主题分类</span></div><div><strong>09:00</strong><span>每日同步</span></div><div><strong>CD</strong><span>自动发布</span></div></section>
      <section class="content-section" id="notes" aria-labelledby="notes-title">
        <div class="section-head"><div><p class="eyebrow">INDEX / NOTES</p><h2 id="notes-title">最近整理</h2></div><label class="search">${iconSearch}<input id="search" type="search" placeholder="搜索笔记" value="${escapeHtml(state.query)}" aria-label="搜索笔记"></label></div>
        <div class="category-tabs" role="tablist" aria-label="按主题筛选">${categories.map(category => `<button class="tab ${state.category === category ? 'active' : ''}" data-category="${escapeHtml(category)}" role="tab" aria-selected="${state.category === category}">${escapeHtml(category)}</button>`).join('')}</div>
        <div class="notes-list">${notes.length ? notes.map(renderCard).join('') : '<p class="empty">没有找到匹配的笔记，换个关键词试试。</p>'}</div>
        <p class="result-count">显示 ${notes.length} / ${state.notes.length} 篇公开笔记</p>
      </section>
      <section class="method-band" id="method"><div class="method-inner"><div><p class="eyebrow">THE METHOD</p><h2>收集、提炼、<br>持续发布。</h2></div><div class="method-copy"><p>每一条笔记都从真实问题开始：保留结论，补齐步骤，标注时效，去除不应该公开的内容。</p><div class="method-steps"><span><b>01</b> 收集问题</span><span><b>02</b> 整理答案</span><span><b>03</b> 自动部署</span></div></div></div></section>
    </main>
    <footer class="site-footer"><div><span class="footer-mark">问而知</span><p>一份持续更新的 AI 使用笔记。</p></div><div class="footer-meta"><span>公开分享</span><a href="${REPO_URL}" target="_blank" rel="noreferrer">GitHub ↗</a><span>更新于 ${escapeHtml(new Date().toLocaleDateString('zh-CN'))}</span></div></footer>
    <div class="drawer-backdrop ${state.active ? 'open' : ''}" data-close></div><article class="drawer ${state.active ? 'open' : ''}" aria-label="笔记详情" ${state.active ? '' : 'inert'}><button class="drawer-close" aria-label="关闭笔记" data-close>×</button>${state.active ? renderArticle(state.active) : ''}</article>`;
  bindEvents();
}

function renderCard(note) {
  return `<article class="note-row"><div class="note-index">${escapeHtml(note.updated.slice(0, 4))}</div><div class="note-main"><div class="note-meta"><span class="note-category">${escapeHtml(note.category)}</span><span class="dot">·</span><time datetime="${escapeHtml(note.updated)}">${escapeHtml(note.updated)}</time></div><h3><button data-note="${escapeHtml(note.id)}">${escapeHtml(note.title)}</button></h3><p>${escapeHtml(note.summary)}</p><div class="tag-row">${(note.tags || []).slice(0, 3).map(tag => `<span>#${escapeHtml(tag)}</span>`).join('')}</div></div><button class="row-arrow" data-note="${escapeHtml(note.id)}" aria-label="打开 ${escapeHtml(note.title)}">${iconArrow}</button></article>`;
}

function renderArticle(note) {
  return `<div class="article-meta"><span class="note-category">${escapeHtml(note.category)}</span><span class="dot">·</span><time datetime="${escapeHtml(note.updated)}">整理于 ${escapeHtml(note.updated)}</time></div><h2>${escapeHtml(note.title)}</h2><p class="article-lede">${escapeHtml(note.summary)}</p><div class="article-body">${renderBody(note.body)}</div>${note.sourceThread ? `<a class="source-link" href="https://chatgpt.com/" target="_blank" rel="noreferrer">来源：提问项目中的相关问答 ↗</a>` : ''}`;
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
    app.innerHTML = `<main class="error-state"><p class="eyebrow">LOAD_ERROR</p><h1>笔记暂时打不开</h1><p>${escapeHtml(error.message)}。请运行 <code>node scripts/build.mjs</code> 后再预览。</p></main>`;
  }
}

init();
