import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
test('notes data has stable public fields', async () => {
  const notes = JSON.parse(await readFile(resolve(root, 'content/notes.json'), 'utf8'));
  assert.ok(notes.length >= 8);
  for (const note of notes) {
    assert.match(note.id, /^[a-z0-9-]+$/);
    assert.ok(note.title && note.category && note.summary);
    assert.equal(note.draft, false);
  }
});

test('site entrypoint is mobile-ready', async () => {
  const html = await readFile(resolve(root, 'site/index.html'), 'utf8');
  assert.match(html, /viewport/);
  assert.match(html, /style\.css/);
  assert.match(html, /app\.js/);
});
