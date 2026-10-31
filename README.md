# 问而知 · AI 使用笔记

从“提问”项目的真实问题中整理的 AI 专业术语与相关技术名称解释。

在线地址：<https://yuliye0409-hue.github.io/ai-question-notebook/>

## 本地预览

```powershell
npm run build
npm run dev
```

然后打开终端提示的本地地址。`npm run build` 会把 `site/` 和 `content/` 复制到 `dist/`，网站本身是无后端的静态站点。

如果本机没有 npm，也可以直接运行 `node scripts/build.mjs`，再用任意静态服务器打开 `dist/`。

## 确认后同步

不再按每天固定时刻发布。符合范围的条目先逐条展示摘要，询问是否推送该笔记；另行询问是否结束提问。只有具体笔记获准且用户明确确认结束后，才安排 30 分钟后执行的一次性同步。结束不等于同意发布，允许一条不代表允许其他笔记。等待期间继续提问时，取消旧任务并重新等候结束确认。

未确认前不自动提交、push 或部署。只有调度工具实际创建成功后，才能报告已安排；仅修改本说明不会开启后台监听或开始计时。完整规则见 [同步约定](docs/sync-policy.md)，本地会话通过项目 `AGENTS.md` 执行。

## 手动导入草稿

把从“提问”项目导出的 Markdown 或 JSON 放到一个临时文件后运行：

```powershell
npm run sync -- --input .\export.md
npm run build
```

导入脚本只为明确的术语或名称解释问题生成本地草稿，路径为 `.sync/drafts/`（已被 Git 忽略）。同一问题重复导入不覆盖已有草稿。JSON 输入格式为单个对象，包含 `title`、可选 `question` 和 `entryType`（`term-explanation` 或 `name-explanation`）；Markdown 输入须用一级标题或“问题：”标明具体问题。它只做保守候选筛选，不代表已核实 AI 关联性或用户批准。

草稿默认 `draft: true`、`publishDecision: "pending"`，不会混入可推送的 `content/notes.json`。核对解释、去重及敏感信息后，展示摘要并单独取得用户批准，再移入公开内容目录、标记 `publishDecision: "approved"` 并记录批准依据；最后等待结束确认及 30 分钟。构建还会排除草稿、待批准、被拒绝和非术语类型的条目。

## 发布

仓库已准备好 GitHub Pages 的工作流：推送到 `main` 后自动构建并发布 `dist/`。首次发布前，在 GitHub 仓库的 Settings → Pages 中确认来源为 GitHub Actions。

## 内容边界

- 只收录 AI 专业术语与相关技术名称的定义、全称、含义和区别。
- 不收录工作流程、培训问卷、制作任务、部署教程、排错或额度问题；正文含 AI 名称不构成收录理由。
- 每条待发布笔记必须单独征求是否推送，不能用“本轮提问结束”代替发布批准。
- 涉及公司内部资料、账号、密钥、客户信息和未脱敏截图的内容不公开。
- 名称解释涉及会变化的能力时须注明核验日期，不扩写为价格、额度或工具推荐文章。
