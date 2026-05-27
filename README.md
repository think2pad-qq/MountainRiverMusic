# 普洁工作室

“普洁工作室”是一个面向原创音乐、配乐与声音叙事的个人音乐人官网。项目使用 Astro 构建，部署到 GitHub Pages。

## 技术栈

- Astro
- TypeScript
- Markdown 内容集合
- GitHub Pages

## 本地开发

```bash
npm install
npm run dev
```

本地预览地址通常是 `http://localhost:4321/MountainRiverMusic/`。

## 构建检查

```bash
npm run build
```

构建产物输出到 `dist/`。

## 内容维护

作品内容位于：

```text
src/content/works/
```

新增作品时，复制一个现有 Markdown 文件并修改 frontmatter 即可。每个作品会自动生成独立详情页。

## 部署

项目包含 GitHub Actions 工作流：

```text
.github/workflows/deploy.yml
```

推送到 `main` 分支后会自动构建并部署到 GitHub Pages。

仓库的 Pages 来源需要设置为 `GitHub Actions`。如果线上仍显示旧页面，先检查 GitHub 仓库的 `Settings -> Pages` 配置。

线上地址：

```text
https://think2pad-qq.github.io/MountainRiverMusic/
```

## 文档

网站建设方案见：

```text
docs/website-technical-plan.md
```
