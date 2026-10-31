import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const input = inputIndex >= 0 ? args[inputIndex + 1] : null;
if (!input) { console.error('用法：npm run sync -- --input <导出的 Markdown 或 JSON>'); process.exit(1); }

const source = await readFile(resolve(process.cwd(), input), 'utf8');
const keywords = ['ai', '人工智能', '模型', '提示词', 'mcp', 'api', 'figma', '生图', '图生视频', 'seedance', 'flow', 'github', '网页', '部署', '自动化', '钉钉', 'nano banana'];
const text = source.replace(/\r/g, '');
const title = (text.match(/^#\s+(.+)$/m) || [])[1] || (text.match(/(?:我的问题|问题|标题)[:：]\s*(.+)/i) || [])[1] || '新的 AI 问题';
const question = text.split(/\n+/).find(line => keywords.some(keyword => line.toLowerCase().includes(keyword))) || title;
const notesPath = resolve(root, 'content', 'notes.json');
const notes = JSON.parse(await readFile(notesPath, 'utf8'));
const id = `draft-${Date.now()}`;
const note = {
  id,
  title: title.trim(),
  category: '待整理',
  tags: ['待审核'],
  date: new Date().toISOString().slice(0, 10),
  updated: new Date().toISOString().slice(0, 10),
  draft: true,
  summary: `从导出内容识别到的问题：${question.trim()}`,
  body: [
    { type: 'heading', text: '待整理' },
    { type: 'paragraph', text: '这是由增量同步脚本生成的草稿。请先补充结论、步骤和来源，再把 draft 改为 false。' }
  ]
};
notes.unshift(note);
await writeFile(notesPath, `${JSON.stringify(notes, null, 2)}\n`);
console.log(`已生成草稿：${note.title}`);
