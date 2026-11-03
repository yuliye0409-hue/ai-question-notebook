import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
test('notes data has stable public fields', async () => {
  const notes = JSON.parse(await readFile(resolve(root, 'content/notes.json'), 'utf8'));
  assert.deepEqual(notes.map(note => note.id).sort(), [
    'base-url-and-mcp', 'codex-agents-skills-and-acceptance-criteria',
    'design-md-basics', 'rest-api-and-github-actions', 'sandbox-basics', 'url-basics'
  ]);
  for (const note of notes) {
    assert.match(note.id, /^[a-z0-9-]+$/);
    assert.ok(note.title && note.category && note.summary);
    assert.equal(note.draft, false);
    assert.ok(['term-explanation', 'name-explanation'].includes(note.entryType));
  }
});

test('site entrypoint is mobile-ready', async () => {
  const html = await readFile(resolve(root, 'site/index.html'), 'utf8');
  assert.match(html, /viewport/);
  assert.match(html, /style\.css/);
  assert.match(html, /app\.js/);
});

test('browser modules use extensions supported by the preview server', async () => {
  const script = await readFile(resolve(root, 'site/app.js'), 'utf8');
  const imports = [...script.matchAll(/from ['"]\.\/([^'"]+)['"]/g)];
  assert.ok(imports.length > 0);
  for (const [, name] of imports) {
    assert.match(name, /\.js$/);
    assert.ok((await readFile(resolve(root, 'site', name), 'utf8')).length > 0);
  }
});

test('hero carousel covers all public entries, fades whole cards without a clipping mask, and respects reduced motion', async () => {
  const script = await readFile(resolve(root, 'site/app.js'), 'utf8');
  const stylesheet = await readFile(resolve(root, 'site/style.css'), 'utf8');
  assert.match(script, /getCarouselNotes\(state\.notes\)/);
  assert.match(script, /data-carousel-step="-1"/);
  assert.match(script, /data-carousel-step="1"/);
  assert.match(script, /暂停自动滚动/);
  assert.match(script, /const fadeIn =/);
  assert.match(script, /const fadeOut =/);
  assert.match(script, /pointerenter/);
  assert.match(stylesheet, /@keyframes note-marquee/);
  assert.match(stylesheet, /\.term-window \{ overflow: visible;/);
  assert.doesNotMatch(stylesheet, /\.term-window[^\n]*mask-image/);
  assert.match(stylesheet, /prefers-reduced-motion: reduce/);
});

test('sync display requires confirmation instead of a daily schedule', async () => {
  const script = await readFile(resolve(root, 'site/app.js'), 'utf8');
  assert.doesNotMatch(script, /09:00|每日同步/);
  assert.match(script, /30 min/);
  assert.match(script, /结束确认后等待/);
  assert.match(script, /推送后发布/);
});
