import test from 'node:test';
import assert from 'node:assert/strict';
import { appendFile, cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createArc, tapePose, relativeIndex, nearestTarget, renderArchive, renderCover, wrapIndex } from '../site/archive-shelf.js';

test('archive wraps forward and backward and chooses the shortest route', () => {
  assert.equal(wrapIndex(-1, 12), 11);
  assert.equal(wrapIndex(12, 12), 0);
  assert.equal(nearestTarget(11, 0, 12), 12);
  assert.equal(nearestTarget(0, 11, 12), -1);
  assert.equal(relativeIndex(0, 35, 36), 1);
  assert.equal(relativeIndex(35, 0, 36), -1);
});

test('the central tape faces forward; distant spines shrink symmetrically into the arc', () => {
  for (const mobile of [false, true]) {
    const arc = createArc(mobile ? 210 : 310, mobile);
    const center = tapePose(0, arc);
    assert.equal(center.rotation, -90);
    assert.equal(center.open, 1);
    assert.equal(center.coverShade, 0);
    assert.equal(center.x, 0);
    const left = tapePose(-3, arc);
    const right = tapePose(3, arc);
    assert.equal(left.x, -right.x);
    assert.equal(left.y, right.y);
    assert.equal(left.z, right.z);
    assert.ok(right.z < center.z);
    assert.ok(right.y > center.y);
    assert.ok(right.spineShade > 0);
    assert.equal(tapePose(60, arc).visible, false);
  }
});

test('rotating a note into the center is continuous, finite, and repeatable', () => {
  const arc = createArc(280);
  let previous;
  for (let r = -1.5; r < 1.5; r += .01) {
    const pose = tapePose(r, arc);
    for (const key of ['x', 'y', 'z', 'rotation', 'spineShade', 'coverShade']) assert.ok(Number.isFinite(pose[key]));
    if (previous) assert.ok(Math.abs(pose.x - previous.x) < 8, 'No positional jump at a book boundary.');
    previous = pose;
  }
});

test('the arc narrows on small screens without shrinking the central cover', () => {
  const full = createArc(220, true);
  const narrow = createArc(220, true, 280);
  assert.ok(narrow.falloff < full.falloff);
  assert.equal(narrow.depth, full.depth);
  assert.equal(tapePose(0, narrow).rotation, -90);
});

test('the shelf renders every note, safe titles, real dates, and an explicit empty state', () => {
  const notes = [{ id: 'a', title: '<img onerror=alert(1)>', tags: ['A&B'], category: '术语', updated: '2026-11-13' }, { id: 'b', title: 'SSH', category: '教程', entryType: 'tutorial', updated: '2026-10-31' }];
  const html = renderArchive(notes);
  assert.equal((html.match(/class="archive-tape"/g) || []).length, 6);
  assert.equal((html.match(/data-archive-index=/g) || []).length, 2);
  assert.ok(html.includes('11.13') && html.includes('10.31'));
  assert.ok(html.includes('A&amp;B'));
  assert.ok(html.includes('&lt;img'));
  assert.ok(!html.includes('<img'));
  assert.ok(renderCover(notes[1], 1).includes('GUIDE'));
  assert.ok(renderArchive([]).includes('暂无公开笔记'));
});

test('a shelf module change invalidates the published app and retains hashed helper imports', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url));
  const fixture = await mkdtemp(join(tmpdir(), 'notebook-archive-assets-'));
  try {
    for (const directory of ['scripts', 'site', 'content']) await cp(join(root, directory), join(fixture, directory), { recursive: true });
    const buildAssets = async () => {
      execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture });
      const html = await readFile(join(fixture, 'dist/index.html'), 'utf8');
      const app = html.match(/src="\.\/(app\.[a-f0-9]+\.js)"/)[1];
      const script = await readFile(join(fixture, 'dist', app), 'utf8');
      const archive = script.match(/from '\.\/(archive-shelf\.[a-f0-9]+\.js)'/)[1];
      const archiveScript = await readFile(join(fixture, 'dist', archive), 'utf8');
      assert.match(archiveScript, /from '\.\/note-view\.[a-f0-9]+\.js'/);
      return { app, archive };
    };
    const before = await buildAssets();
    await appendFile(join(fixture, 'site/archive-shelf.js'), '\n// shelf asset regression fixture\n');
    const after = await buildAssets();
    assert.notEqual(after.archive, before.archive);
    assert.notEqual(after.app, before.app);
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
