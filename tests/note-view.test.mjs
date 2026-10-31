import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, filterNotes, getCategories, latestUpdate } from '../site/note-view.js';

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

test('note text is escaped before insertion into markup', () => {
  assert.equal(escapeHtml('<img src="x" onerror=\'alert(1)\'>&'), '&lt;img src=&quot;x&quot; onerror=&#39;alert(1)&#39;&gt;&amp;');
});
