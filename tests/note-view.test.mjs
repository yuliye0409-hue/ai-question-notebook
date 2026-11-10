import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { escapeHtml, filterNotes, getCategories, getCarouselNotes, latestUpdate } from '../site/note-view.js';

const notes = [
  { id: 'mcp', title: 'MCP 是什么？', summary: '模型上下文协议的定义', category: 'AI 专业术语', tags: ['MCP'], updated: '2026-05-03', draft: false },
  { id: 'url', title: 'URL 是什么？', summary: '统一资源定位符', category: '相关技术名称', tags: ['URL'], updated: '2026-06-22', draft: false },
  { id: 'draft', title: '待确认定义', summary: '', category: '不公开', tags: [], updated: '2026-10-31', draft: true }
];

test('search is case insensitive, trims whitespace, and includes tags and summaries', () => {
  assert.deepEqual(filterNotes(notes, '全部', '  McP ').map(note => note.id), ['mcp']);
  assert.deepEqual(filterNotes(notes, '全部', '定位符').map(note => note.id), ['url']);
  assert.deepEqual(filterNotes(notes, '相关技术名称', 'MCP'), []);
  assert.deepEqual(filterNotes(notes, '全部', 'no-match'), []);
});

test('categories, ordering and update metadata exclude drafts without mutating input', () => {
  assert.deepEqual(getCategories(notes), ['全部', 'AI 专业术语', '相关技术名称']);
  assert.deepEqual(filterNotes(notes).map(note => note.id), ['url', 'mcp']);
  assert.equal(latestUpdate(notes), '2026-06-22');
  assert.equal(latestUpdate([]), '');
  assert.deepEqual(notes.map(note => note.id), ['mcp', 'url', 'draft']);
});

test('hero carousel includes every published glossary note and tutorial, excluding drafts', () => {
  const entries = [
    ...notes,
    { id: 'guide', entryType: 'tutorial', title: 'SSH 教程', summary: '', category: '远程开发', tags: ['SSH'], updated: '2026-10-31', draft: false },
    { id: 'draft-guide', entryType: 'tutorial', title: '草稿教程', summary: '', category: '待审核', tags: [], updated: '2026-10-31', draft: true }
  ];
  assert.deepEqual(getCarouselNotes(entries).map(note => note.id), ['guide', 'url', 'mcp']);
});

test('note text is escaped before insertion into markup', () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'alert(1)\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;');
});

test('cross-disciplinary invoice note appears in categories and supports focused search', async () => {
  const { selectPublicNotes } = await import('../scripts/note-policy.mjs');
  const entries = selectPublicNotes(JSON.parse(await readFile(new URL('../content/notes.json', import.meta.url), 'utf8')));
  assert.ok(getCategories(entries).includes('跨专业知识'));
  const matches = filterNotes(entries, '跨专业知识', '专票');
  assert.deepEqual(matches.map(note => note.id), ['vat-ordinary-and-special-invoices']);
  assert.deepEqual(filterNotes(entries, 'AI 专业术语', '专票'), []);
  assert.match(matches[0].approvalEvidence, /收录网站/);
  assert.match(JSON.stringify(matches[0].body), /2026-11-10/);
});
