import test from 'node:test';
import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

test('published note changes get fresh browser asset URLs and retain their full content', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'notebook-cache-'));
  try {
    for (const directory of ['scripts', 'site', 'content']) {
      await cp(join(root, directory), join(fixture, directory), { recursive: true });
    }
    const build = () => execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture });
    const readAssets = async () => {
      const html = await readFile(join(fixture, 'dist/index.html'), 'utf8');
      const appFile = html.match(/src="\.\/(app\.[a-f0-9]+\.js)"/)?.[1];
      assert.ok(appFile, 'The published page must reference a versioned script.');
      const script = await readFile(join(fixture, 'dist', appFile), 'utf8');
      const notesFile = script.match(/fetch\('\.\/(notes\.[a-f0-9]+\.json)'/)?.[1];
      assert.ok(notesFile, 'The script must request versioned note data.');
      assert.match(script, /cache: 'no-store'/);
      const notes = JSON.parse(await readFile(join(fixture, 'dist', notesFile), 'utf8'));
      const compatibilityNotes = JSON.parse(await readFile(join(fixture, 'dist/notes.json'), 'utf8'));
      assert.deepEqual(notes, compatibilityNotes);
      return { appFile, notesFile, notes };
    };

    build();
    const before = await readAssets();
    const sourcePath = join(fixture, 'content/notes.json');
    const sourceNotes = JSON.parse(await readFile(sourcePath, 'utf8'));
    const publishedNote = sourceNotes.find(note => note.draft === false && note.publishDecision === 'approved');
    assert.ok(publishedNote);
    publishedNote.summary += ' 缓存刷新回归验证。';
    await writeFile(sourcePath, JSON.stringify(sourceNotes));
    build();
    const after = await readAssets();

    assert.notEqual(after.appFile, before.appFile, 'The page must stop requesting the previous script.');
    assert.notEqual(after.notesFile, before.notesFile, 'The browser must stop requesting the previous data.');
    assert.equal(after.notes.length, before.notes.length);
    assert.deepEqual(after.notes.find(note => note.id === publishedNote.id), publishedNote);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
