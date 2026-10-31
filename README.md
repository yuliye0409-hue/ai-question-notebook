# 问而知 · AI 使用笔记

从“提问”项目的真实问题中沉淀出的公开 AI 使用笔记网站。

## 本地预览

```powershell
npm run build
npm run dev
```

然后打开终端提示的本地地址。`npm run build` 会把 `site/` 和 `content/` 复制到 `dist/`，网站本身是无后端的静态站点。

## 增量同步

把从“提问”项目导出的 Markdown 或 JSON 放到一个临时文件后运行：

```powershell
npm run sync -- --input .\export.md
npm run build
```

同步脚本会用关键词筛选 AI 相关问答，生成可审核的 `content/notes.json`。它不会上传原始聊天记录，也不会把本地路径、图片附件路径和密钥写进公开内容。新增笔记会带 `draft: true`，审核后改为 `false` 再发布。

## 发布

仓库已准备好 GitHub Pages 的工作流：推送到 `main` 后自动构建并发布 `dist/`。首次发布前，在 GitHub 仓库的 Settings → Pages 中确认来源为 GitHub Actions。

## 内容边界

- 只收录 AI 工具、AI 概念、提示词、图像/视频工作流、部署与排错相关内容。
- 涉及公司内部资料、账号、密钥、客户信息和未脱敏截图的内容不公开。
- 额度、价格、模型能力等会变化的信息必须带核验日期。
