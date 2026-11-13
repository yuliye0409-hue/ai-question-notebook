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
    'design-md-basics', 'rest-api-and-github-actions', 'sandbox-basics', 'url-basics',
    'vat-ordinary-and-special-invoices'
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

test('hero uses an accessible curved archive with manual controls, pause and reduced motion', async () => {
  const script = await readFile(resolve(root, 'site/app.js'), 'utf8');
  const shelf = await readFile(resolve(root, 'site/archive-shelf.js'), 'utf8');
  const stylesheet = await readFile(resolve(root, 'site/style.css'), 'utf8');
  assert.match(script, /getCarouselNotes\(state\.notes\)/);
  assert.match(shelf, /data-archive-step="-1"/);
  assert.match(shelf, /data-archive-step="1"/);
  assert.match(shelf, /暂停自动翻阅/);
  assert.match(shelf, /pointercancel/);
  assert.match(shelf, /ArrowLeft/);
  assert.match(shelf, /aria-live="polite"/);
  assert.match(stylesheet, /perspective: 1400px/);
  assert.doesNotMatch(stylesheet, /note-marquee|\.term-window/);
  assert.match(script, /clipPath: readerClip/);
  assert.match(stylesheet, /prefers-reduced-motion: reduce/);
});

test('sync display requires confirmation instead of a daily schedule', async () => {
  const script = await readFile(resolve(root, 'site/app.js'), 'utf8');
  assert.doesNotMatch(script, /09:00|每日同步/);
  assert.match(script, /30 min/);
  assert.match(script, /结束确认后等待/);
  assert.match(script, /推送后发布/);
});
