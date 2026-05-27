# 普洁工作室自定义后台实施方案

## 1. 目标

用自研后台替代 Decap CMS 的通用后台界面，但继续保留当前网站的核心架构：

- Astro 静态站点
- Markdown 内容文件
- GitHub Pages 部署
- GitHub Actions 自动构建发布
- GitHub 作为内容版本库

第一版目标不是做完整 CMS，而是做一个适合本项目的轻量作品管理后台，让维护者可以用定制界面管理 `src/content/works/*.md`、封面图和音频文件。

## 2. 推荐范围

第一版只做“作品管理”。

必须包含：

- GitHub 登录
- 登录状态保持
- 作品列表
- 新建作品
- 编辑作品
- 删除作品
- 上传封面图
- 上传音频文件
- Markdown 正文编辑
- 保存时提交到 GitHub `main` 分支
- 保存后触发 GitHub Pages 自动部署

暂不包含：

- 多角色权限
- 审核流
- 草稿发布流
- 多人协同编辑锁
- 数据库
- 独立对象存储
- 复杂素材库

## 3. 总体架构

```text
Browser Admin UI
  |
  | GitHub OAuth
  v
Cloudflare Worker OAuth
  |
  | returns GitHub access token
  v
Browser Admin UI
  |
  | GitHub REST API
  v
GitHub Repository
  |
  | push to main
  v
GitHub Actions
  |
  v
GitHub Pages
```

后台页面仍然部署在 GitHub Pages 上，例如：

```text
https://think2pad-qq.github.io/MountainRiverMusic/admin/
```

Cloudflare Worker 只负责 OAuth 授权，不保存业务数据。

## 4. 技术选型

### 前端

建议使用 Astro 内嵌一个轻量客户端应用。

推荐路径：

```text
src/pages/admin/index.astro
src/admin/main.ts
src/admin/api/github.ts
src/admin/lib/frontmatter.ts
src/admin/components/
```

第一版可以不用 React/Vue，使用 TypeScript + 原生 DOM 或轻量组件组织。如果开发人员更熟 React，也可以引入 React，但要避免把整个网站改成 SPA。

### OAuth

复用当前 Cloudflare Worker：

```text
scripts/decap-oauth-worker.js
```

后续可以重命名为：

```text
scripts/github-oauth-worker.js
```

后台登录流程：

1. 后台打开 Worker `/auth?provider=github&site_id=think2pad-qq.github.io`。
2. 用户在 GitHub 授权。
3. Worker `/callback` 拿到 GitHub access token。
4. Worker 通过 `postMessage` 把 `{ token }` 发回后台窗口。
5. 后台把 token 存到 `sessionStorage`。
6. 后台用 token 调 GitHub API。

第一版不建议把 token 存到 `localStorage`，避免长期残留。

### 内容读写

继续使用 Markdown frontmatter。

当前作品文件目录：

```text
src/content/works/
```

当前媒体目录：

```text
public/images/
public/audio/
```

保存内容时调用 GitHub REST API：

```text
GET /repos/{owner}/{repo}/contents/{path}
PUT /repos/{owner}/{repo}/contents/{path}
DELETE /repos/{owner}/{repo}/contents/{path}
```

## 5. 数据模型

后台表单字段应与 `public/admin/config.yml` 和 `src/content/config.ts` 保持一致。

作品字段：

```ts
type WorkForm = {
  title: string;
  subtitle?: string;
  year: number;
  duration: string;
  style: string[];
  cover: string;
  audio: string;
  featured: boolean;
  externalLinks?: {
    netease?: string;
  };
  body: string;
};
```

Markdown 输出示例：

```md
---
title: "夜行草图"
subtitle: "Demo"
year: 2026
duration: "3:27"
style:
  - 原创
  - 器乐
cover: "/MountainRiverMusic/images/example.jpg"
audio: "/MountainRiverMusic/audio/example.mp3"
featured: true
externalLinks:
  netease: ""
---

这里是正文。
```

注意：前台页面如果当前使用不带 `/MountainRiverMusic` 的路径，需要开发人员统一确认媒体路径规则，避免后台保存后前台图片或音频失效。

## 6. 功能设计

### 登录页

状态：

- 未登录：显示 GitHub 登录按钮
- 登录中：显示加载状态
- 登录失败：显示错误原因和重试按钮
- 已登录：进入作品列表

登录成功后，应调用：

```text
GET https://api.github.com/user
```

确认 token 可用，并显示当前 GitHub 用户名。

### 作品列表

数据来源：

```text
GET /repos/think2pad-qq/MountainRiverMusic/contents/src/content/works?ref=main
```

列表展示：

- 标题
- 年份
- 文件名
- 是否精选
- 最后修改时间可选，第一版可不做

操作：

- 新建
- 编辑
- 删除
- 刷新

### 编辑页

表单字段：

- 标题
- 副标题
- 年份
- 时长
- 风格标签
- 封面图
- 音频文件
- 精选
- 网易云链接
- 正文 Markdown

交互要求：

- 保存前校验必填字段
- slug 自动生成，但允许手动修改文件名
- 修改已有文件时保留原路径，除非用户明确选择重命名
- 保存成功后提示 GitHub commit 已创建

### 上传文件

封面上传路径：

```text
public/images/{safe-file-name}
```

音频上传路径：

```text
public/audio/{safe-file-name}
```

文件名规则：

- 小写
- 空格转 `-`
- 移除特殊字符
- 保留扩展名
- 同名时追加时间戳

上传方式：

```text
PUT /repos/{owner}/{repo}/contents/{path}
```

body 中的 `content` 使用 base64。

建议限制：

- 图片：不超过 5 MB
- 音频：第一版不超过 30 MB

GitHub API 对大文件不友好，后续如果音频增多，应迁移到 Cloudflare R2 或外部音频平台。

### 删除作品

删除前必须二次确认。

实现：

1. 读取文件 sha。
2. 调 GitHub DELETE contents API。
3. commit message 示例：

```text
chore(content): 删除作品 夜行草图
```

第一版只删除 Markdown 文件，不自动删除图片和音频，避免误删被其他作品复用的媒体。

## 7. GitHub API 封装

建议封装为：

```text
src/admin/api/github.ts
```

核心方法：

```ts
getCurrentUser(token)
listWorks(token)
getFile(token, path)
putFile(token, path, content, message, sha?)
deleteFile(token, path, message, sha)
uploadAsset(token, path, file, message)
```

所有请求统一加：

```text
Authorization: token <access-token>
Accept: application/vnd.github+json
X-GitHub-Api-Version: 2022-11-28
```

错误处理至少覆盖：

- 401：登录过期，要求重新登录
- 403：没有仓库写权限或 API rate limit
- 404：路径不存在或仓库权限不足
- 409：文件 sha 冲突，需要刷新后重试
- 422：提交内容格式错误

## 8. Frontmatter 处理

不要手写字符串拼接解析 YAML。

建议依赖：

```text
gray-matter
js-yaml
```

开发任务：

- `parseWorkMarkdown(markdown): WorkForm`
- `serializeWorkMarkdown(form): string`
- 单元测试覆盖数组、对象、空字段、正文保留

如果不想新增太多依赖，可以只使用 `gray-matter`，它已经能处理 frontmatter。

## 9. 安全和权限

GitHub OAuth App scope 第一版使用：

```text
repo
```

原因：当前仓库如果是 private 或未来改 private，`public_repo` 不够用。

安全要求：

- Client Secret 只放 Cloudflare Worker secret。
- 前端代码不能出现 GitHub Client Secret。
- token 只放 `sessionStorage`。
- 提供退出登录，清理 `sessionStorage`。
- 保存前必须校验当前用户对仓库有写权限。

写权限校验：

```text
GET /repos/think2pad-qq/MountainRiverMusic/collaborators/{username}/permission
```

允许：

```text
admin
write
maintain
```

## 10. UI 要求

后台应以“工作台”而不是营销页面来设计。

建议布局：

```text
顶部栏：普洁工作室 Admin / 当前用户 / 退出
左侧栏：作品 / 媒体 / 设置
主区域：列表或编辑表单
```

第一版只需要实现：

- 作品列表页
- 作品编辑页
- 登录页

视觉要求：

- 信息密度适中
- 表单清晰
- 保存按钮固定在明显位置
- 移动端可用，但优先桌面端体验
- 不使用大面积营销式 hero

## 11. 实施步骤

### 阶段一：后台基础

任务：

- 新增 `/admin` 自定义页面，暂时保留 Decap 可放到 `/admin-decap`
- 新增登录页
- 接入现有 Cloudflare Worker OAuth
- token 存储和退出登录
- 获取 GitHub 当前用户

验收：

- 能登录 GitHub
- 刷新页面后同一 session 仍保持登录
- 退出后回到登录页

### 阶段二：作品读取

任务：

- 封装 GitHub API
- 列出 `src/content/works`
- 读取 Markdown 文件
- 解析 frontmatter
- 展示作品列表

验收：

- 能看到当前两首作品
- 点击作品能进入编辑页
- 字段能正确回填

### 阶段三：作品保存

任务：

- 编辑表单
- 字段校验
- Markdown 序列化
- PUT contents API 保存
- 处理 sha 冲突

验收：

- 修改作品标题后能保存
- GitHub 仓库出现 commit
- GitHub Actions 自动部署
- 前台作品页显示新内容

### 阶段四：新建和删除

任务：

- 新建作品表单
- slug 和文件名生成
- 删除作品
- 二次确认

验收：

- 能新增作品并在前台显示
- 能删除测试作品
- 删除不会误删媒体文件

### 阶段五：媒体上传

任务：

- 图片上传
- 音频上传
- 文件名清洗
- 上传后自动填入 cover/audio 字段
- 上传进度和错误提示

验收：

- 上传封面后前台能显示图片
- 上传音频后前台能播放
- 超限文件有明确提示

## 12. 验收标准

第一版完成时必须满足：

- 使用 GitHub 登录成功进入后台。
- 后台 UI 不再依赖 Decap CMS。
- 可以管理 `src/content/works` 下的作品。
- 可以新增、编辑、删除作品。
- 可以上传封面和音频。
- 保存后 GitHub 仓库产生 commit。
- GitHub Actions 能完成部署。
- 前台页面读取保存后的内容正常。
- `npm run check` 和 `npm run build` 通过。

## 13. 风险

### GitHub API 大文件限制

GitHub 不适合长期存大量音频。第一版可以继续用，但要控制文件大小。后续建议把音频迁移到 Cloudflare R2 或音乐平台。

### OAuth token 暴露面

浏览器端调用 GitHub API 必然持有 token。通过 `sessionStorage`、最小化 scope、限制写权限账号可以降低风险。

### 并发编辑冲突

如果多人同时编辑同一作品，可能出现 sha 冲突。第一版提示刷新后重试即可。

### Markdown 格式漂移

序列化 frontmatter 可能改变 YAML 排版。需要用单元测试锁定字段结构，不要求完全保留原始排版。

## 14. 推荐工期

单人开发估算：

```text
阶段一：0.5-1 天
阶段二：0.5-1 天
阶段三：1 天
阶段四：0.5 天
阶段五：1 天
联调和修正：1 天
```

总计：

```text
4-6 个工作日
```

如果要求视觉精修、移动端细节、媒体管理增强，增加 2-4 个工作日。

## 15. 交付物

开发完成后应交付：

- 自定义后台页面
- OAuth 登录流程
- GitHub API 封装
- Frontmatter 解析和序列化模块
- 作品管理功能
- 媒体上传功能
- README 或 docs 使用说明
- 基础测试

建议保留 Decap CMS 一段时间作为备用入口，例如：

```text
/admin-decap/
```

待自定义后台稳定后，再删除 Decap 相关文件和文档。
