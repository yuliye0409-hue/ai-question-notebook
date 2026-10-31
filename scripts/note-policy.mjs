import { createHash } from 'node:crypto';

export const ENTRY_TYPES = ['term-explanation', 'name-explanation'];

export function isDefinitionQuestion(question) {
  const text = String(question).trim();
  const definition = /是什么|什么意思|什么含义|含义是什么|全称|简称|指的是什么|解释一下|解释.{0,30}(含义|名称|术语)|怎么理解|如何理解|分别.*(什么|含义)|\bwhat (?:is|are)\b|\bdefine\b/i;
  const workRequest = /满意度|调查问卷|培训文档|如何(?!理解)|怎么(?!理解)|帮我.{0,20}(搭建|制作|生成|优化|修改|部署|安装)|次数|上限|额度|保持产品一致|粘贴.{0,20}(图片|Figma)/i;
  return definition.test(text) && !workRequest.test(text);
}

export function createLocalDraft({ title, question = title, entryType = 'term-explanation', date }) {
  if (!ENTRY_TYPES.includes(entryType)) throw new Error('只接收专业术语解释或相关名称解释。');
  if (!isDefinitionQuestion(question)) throw new Error('该问题不是明确的术语或名称解释，不生成待推送笔记。');
  const id = `draft-${createHash('sha256').update(`${entryType}\n${question.trim()}`).digest('hex').slice(0, 16)}`;
  return {
    id, entryType, title: title.trim(), question: question.trim(),
    category: '待审核术语', tags: ['待审核'], date, updated: date,
    draft: true, publishDecision: 'pending',
    summary: '待补齐解释、核对关联性并取得逐条发布确认。',
    body: []
  };
}

export function selectPublicNotes(notes) {
  if (!Array.isArray(notes)) throw new Error('notes.json 必须是笔记数组。');
  return notes.filter(note => ENTRY_TYPES.includes(note.entryType)
    && note.draft === false
    && !['pending', 'rejected'].includes(note.publishDecision));
}

// Tutorials are opt-in: never import ordinary work questions as glossary notes.
export function selectPublicTutorials(tutorials) {
  if (!Array.isArray(tutorials)) throw new Error('tutorials.json 必须是教程数组。');
  return tutorials.filter(note => note.entryType === 'tutorial'
    && note.draft === false
    && note.publishDecision === 'approved'
    && typeof note.approvalEvidence === 'string'
    && note.approvalEvidence.trim().length > 0);
}
