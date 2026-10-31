import test from 'node:test';
import assert from 'node:assert/strict';
import { createLocalDraft, isDefinitionQuestion, selectPublicNotes } from '../scripts/note-policy.mjs';

test('accepts definition questions, not work requests containing AI keywords', () => {
  for (const question of ['MCP 是什么？', 'Base URL 和 MCP 分别是什么？', 'URL 是什么？', '如何理解 Token？']) {
    assert.equal(isDefinitionQuestion(question), true, question);
  }
  for (const question of ['AI 生图 SOP 培训后如何设计满意度问卷？', '帮我搭建 AI 网站', '如何保持 Seedance 产品一致性？', 'Flow 的额度是多少？', 'Figma 修改后能不能同步网页？']) {
    assert.equal(isDefinitionQuestion(question), false, question);
  }
});

test('drafts require a separate publication decision and have stable IDs', () => {
  const input = { title: 'MCP 是什么？', date: '2026-10-31' };
  const draft = createLocalDraft(input);
  assert.equal(draft.draft, true);
  assert.equal(draft.publishDecision, 'pending');
  assert.equal(createLocalDraft(input).id, draft.id);
  assert.deepEqual(draft.body, []);
  assert.throws(() => createLocalDraft({ title: '帮我搭建 AI 网站' }), /不是明确/);
  assert.throws(() => createLocalDraft({ ...input, entryType: 'workflow' }), /只接收/);
});

test('public build excludes drafts, refused notes, pending approvals and work notes', () => {
  const entry = { id: 'test', entryType: 'term-explanation', draft: false };
  assert.deepEqual(selectPublicNotes([
    { ...entry, id: 'existing-public' },
    { ...entry, id: 'new-approved', publishDecision: 'approved' },
    { ...entry, id: 'draft', draft: true },
    { ...entry, id: 'pending', publishDecision: 'pending' },
    { ...entry, id: 'refused', publishDecision: 'rejected' },
    { ...entry, id: 'work', entryType: 'workflow' },
    { ...entry, id: 'untyped', entryType: undefined }
  ]).map(note => note.id), ['existing-public', 'new-approved']);
  assert.throws(() => selectPublicNotes({}), /必须是笔记数组/);
});
