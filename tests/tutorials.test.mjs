import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, cp, mkdtemp, appendFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { getCollectionNotes, filterNotes } from '../site/note-view.js';
import { selectPublicTutorials, selectPublicNotes, createLocalDraft } from '../scripts/note-policy.mjs';

const approved = {
  id: 'approved-tutorial', entryType: 'tutorial', draft: false,
  publishDecision: 'approved', approvalEvidence: '用户明确要求将本教程收录到网站。',
  title: '通过 SSH 访问远程项目', category: '远程开发', tags: ['SSH'],
  summary: 'Windows 和 Mac 的同网与异网访问。', updated: '2026-10-31'
};

test('tutorial publication requires explicit approval and does not relax glossary imports', () => {
  assert.deepEqual(selectPublicTutorials([
    approved,
    { ...approved, id: 'draft', draft: true },
    { ...approved, id: 'pending', publishDecision: 'pending' },
    { ...approved, id: 'rejected', publishDecision: 'rejected' },
    { ...approved, id: 'missing-decision', publishDecision: undefined },
    { ...approved, id: 'missing-evidence', approvalEvidence: '' },
    { ...approved, id: 'wrong-evidence', approvalEvidence: [] },
    { ...approved, id: 'work', entryType: 'workflow' }
  ]).map(note => note.id), ['approved-tutorial']);
  assert.deepEqual(selectPublicNotes([approved]), []);
  assert.throws(() => selectPublicTutorials({}), /必须是教程数组/);
  assert.throws(() => createLocalDraft({ title: '如何配置 SSH？', entryType: 'tutorial' }), /只接收/);
});

test('tutorial and glossary directories have independent categories, search and draft filtering', () => {
  const entries = [
    approved,
    { ...approved, id: 'draft-tutorial', draft: true },
    { id: 'term', entryType: 'term-explanation', title: 'SSH 是什么？', summary: '协议解释', category: '相关技术名称', tags: ['SSH'], draft: false, updated: '2026-10-31' }
  ];
  const terms = getCollectionNotes(entries);
  const tutorials = getCollectionNotes(entries, 'tutorials');
  assert.deepEqual(terms.map(note => note.id), ['term']);
  assert.deepEqual(tutorials.map(note => note.id), ['approved-tutorial']);
  assert.deepEqual(filterNotes(terms, '全部', 'Mac'), []);
  assert.deepEqual(filterNotes(tutorials, '全部', 'Mac').map(note => note.id), ['approved-tutorial']);
  assert.equal(entries.length, 3);
});

test('approved SSH tutorial covers both host systems, local and remote networks without personal data', async () => {
  const tutorials = JSON.parse(await readFile(new URL('../content/tutorials.json', import.meta.url), 'utf8'));
  assert.equal(tutorials.length, 1);
  assert.equal(selectPublicTutorials(tutorials).length, 1);
  const tutorial = tutorials[0];
  assert.equal(tutorial.id, 'codex-ssh-windows-mac-local-and-remote');
  assert.match(tutorial.approvalEvidence, /结束提问，这个可以做成笔记收录到网站，增加一个教程目录/);
  const content = JSON.stringify(tutorial.body);
  for (const phrase of ['Windows', 'Mac', '同一', '不同', 'Tailscale', 'authorized_keys', '主机密钥', 'codex --version']) {
    assert.ok(content.includes(phrase), `missing ${phrase}`);
  }
  assert.doesNotMatch(content, /19708|AppData|thread_history|01a18fee|BEGIN OPENSSH PRIVATE KEY/);
});

test('site exposes a separate tutorial navigation target and accessible search', async () => {
  const script = await readFile(new URL('../site/app.js', import.meta.url), 'utf8');
  assert.match(script, /href="#tutorials"/);
  assert.match(script, /id="tutorials"/);
  assert.match(script, /id="tutorial-search"/);
  assert.match(script, /aria-controls="tutorials-grid"/);
  assert.match(script, /getCollectionNotes\(state\.notes, 'tutorials'\)/);
});

test('tutorial reader helpers and styles receive cache-safe URLs after changes', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'notebook-tutorial-assets-'));
  const root = fileURLToPath(new URL('..', import.meta.url));
  try {
    for (const directory of ['scripts', 'site', 'content']) {
      await cp(join(root, directory), join(fixture, directory), { recursive: true });
    }
    const assets = async () => {
      execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture });
      const html = await readFile(join(fixture, 'dist/index.html'), 'utf8');
      const app = html.match(/src="\.\/(app\.[a-f0-9]+\.js)"/)?.[1];
      const style = html.match(/href="\.\/(style\.[a-f0-9]+\.css)"/)?.[1];
      assert.ok(app && style);
      const script = await readFile(join(fixture, 'dist', app), 'utf8');
      const view = script.match(/from '\.\/(note-view\.[a-f0-9]+\.js)'/)?.[1];
      assert.ok(view);
      await readFile(join(fixture, 'dist', view), 'utf8');
      return { app, style, view };
    };
    const before = await assets();
    await appendFile(join(fixture, 'site/note-view.js'), '\n// asset regression fixture\n');
    await appendFile(join(fixture, 'site/style.css'), '\n/* asset regression fixture */\n');
    const after = await assets();
    assert.notEqual(before.view, after.view);
    assert.notEqual(before.app, after.app);
    assert.notEqual(before.style, after.style);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
});
