import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLocalDraft } from './note-policy.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const input = inputIndex >= 0 ? args[inputIndex + 1] : null;
if (!input) { console.error('用法：npm run sync -- --input <导出的 Markdown 或 JSON>'); process.exit(1); }

const source = await readFile(resolve(process.cwd(), input), 'utf8');
let candidate;
if (input.toLowerCase().endsWith('.json')) {
  candidate = JSON.parse(source);
  if (!candidate || Array.isArray(candidate) || typeof candidate !== 'object') throw new Error('一次只导入一个待确认的术语问题。');
} else {
  const text = source.replace(/\r/g, '');
  const title = (text.match(/^#\s+(.+)$/m) || [])[1] || (text.match(/^(?:问题|标题)[:：]\s*(.+)$/m) || [])[1];
  if (!title) throw new Error('请用一级标题或“问题：”标明要解释的术语问题。');
  candidate = { title, question: title };
}
if (typeof candidate.title !== 'string' || !candidate.title.trim()) throw new Error('缺少明确的术语问题标题。');
const note = createLocalDraft({
  title: candidate.title, question: candidate.question || candidate.title,
  entryType: candidate.entryType || 'term-explanation',
  date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Shanghai' })
});
const draftDirectory = resolve(root, '.sync', 'drafts');
await mkdir(draftDirectory, { recursive: true });
const draftPath = resolve(draftDirectory, `${note.id}.json`);
try {
  await writeFile(draftPath, `${JSON.stringify(note, null, 2)}\n`, { flag: 'wx' });
  console.log(`已生成仅本地可见的草稿：${note.title}。请核对是否与 AI 学习有关，并询问用户是否推送该笔记。`);
} catch (error) {
  if (error.code !== 'EEXIST') throw error;
  console.log(`已有同一问题的本地草稿，不重复导入：${note.title}`);
}
