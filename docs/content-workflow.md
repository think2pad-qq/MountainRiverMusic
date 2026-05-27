# 内容管理工作流

## 概述

**创作 → 上传 → 写配置 → 提交 → 自动部署**

本地编辑 Markdown，媒体文件传到 R2，推送到 GitHub 后 Cloudflare Pages 自动发布。

---

## 准备工作

### 已注册信息

| 资源 | 地址 |
|------|------|
| 网站 | `https://mountainrivermusic.pages.dev` |
| GitHub 仓库 | `think2pad-qq/MountainRiverMusic` |
| R2 图片桶 | `https://pub-87eb1f986b9944959ac542319a76a55e.r2.dev` |
| R2 音频桶 | `https://pub-f0672857274c48cb88a2e2264110b0d4.r2.dev` |
| Cloudflare API 令牌 | 存在浏览器 / 密码管理器中 |

### 媒体文件要求

| 类型 | 格式 | 说明 |
|------|------|------|
| 封面图 | **WebP** | 浏览器支持好、体积小。不用 JPG/PNG |
| 音频 | MP3 / WAV / OGG / M4A | 根据浏览器兼容性选，推荐 MP3 |
| 文件名 | **英文** | 避免 URL 编码问题，如 `my-song.mp3` |

---

## 完整步骤

### Step 1：准备媒体文件

- 封面图用 WebP 格式（可用 Photoshop / 在线转换工具输出）
- 音频用英文文件名，如 `wind-fire.mp3`
- 文件放在本地任意位置，无需复制到项目目录

### Step 2：上传到 R2

**方式 A：通过网页（推荐，最简单）**

1. 打开 https://dash.cloudflare.com → **R2**
2. 找到对应桶
   - 封面图/头像 → `mountain-river-images`
   - 音频文件 → `mountain-river-audio`
3. 点击 **Upload** → 选择文件 → 上传
4. 上传后文件自动获得公网地址：
   ```
   图片: https://pub-87eb1f986b9944959ac542319a76a55e.r2.dev/文件名.webp
   音频: https://pub-f0672857274c48cb88a2e2264110b0d4.r2.dev/文件名.mp3
   ```

**方式 B：通过 curl 命令（通过我操作更快）**

直接在对话里告诉我文件路径，我帮你传。示例：
```bash
# 传图片
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/51daa07c9fb31ecc717176b170d4011e/r2/buckets/mountain-river-images/objects/文件名.webp" \
  -H "Authorization: Bearer <令牌>" \
  -H "Content-Type: image/webp" \
  --data-binary @"本地路径\文件名.webp"

# 传音频
curl -X PUT "https://api.cloudflare.com/client/v4/accounts/51daa07c9fb31ecc717176b170d4011e/r2/buckets/mountain-river-audio/objects/文件名.mp3" \
  -H "Authorization: Bearer <令牌>" \
  -H "Content-Type: audio/mpeg" \
  --data-binary @"本地路径\文件名.mp3"
```

### Step 3：新建 / 编辑 Markdown 作品文件

文件位置：`src/content/works/` 目录

**新建作品**：复制现有文件改名
```bash
# 在项目根目录下执行
copy src\content\works\night-sketch.md src\content\works\my-new-work.md
```

完整示例模板：
```markdown
---
title: "作品标题"
subtitle: "一句话简介"
year: 2026
style: ["风格1", "风格2"]
duration: "3:27"
cover: "https://pub-87eb1f986b9944959ac542319a76a55e.r2.dev/my-image.webp"
audio: "https://pub-f0672857274c48cb88a2e2264110b0d4.r2.dev/my-song.mp3"
showOnHome: false
useAsHeroCover: false
useAsHeroPlayer: false
externalLinks:
  netease: "https://music.163.com/song/xxx"
---

作品描述正文，支持 Markdown 格式。
可以写多段。
```

**关于首页展示字段**：
- `showOnHome: true` → 出现在首页「近期作品」列表
- `useAsHeroCover: true` → 这首的封面作为首页大图
- `useAsHeroPlayer: true` → 这首的音频作为首页默认播放器
- 三个字段均默认 `false`，全关时仅出现在「作品库」

**关于 `externalLinks`**：
- 字段名必须是英文 `netease`
- 页面显示为"网易云音乐"
- 可选，没有就不写

**关于路径**：
- `cover` 和 `audio` 字段直接填 R2 公网 URL
- 不再使用 `/MountainRiverMusic/` 本地路径

### Step 4：提交到 GitHub

```bash
# 在项目根目录下执行
git add src/content/works/你的文件.md
git commit -m "feat: 添加新作品《作品标题》"
git push origin main
```

### Step 5：等待自动部署

推送后 Cloudflare Pages 自动构建（约 1-2 分钟），完成后访问：
```
https://mountainrivermusic.pages.dev
```

检查：
- 新作品卡片是否显示
- 封面图是否加载
- 播放器是否可播放

---

## 常见操作速查

### 添加新作品

```
准备图片.webp + 音频.mp3 → 上传到 R2 → 新建 .md 文件 → push
```

### 修改已有作品

```
编辑 src/content/works/xxx.md → push
```

### 替换封面图

```
上传新图片到 R2（同名覆盖或新文件名）→ 修改 .md 中 cover 字段 → push
```

### 替换音频

```
上传新音频到 R2（同名覆盖或新文件名）→ 修改 .md 中 audio 字段 → push
```

### 删除作品

```
git rm src/content/works/xxx.md → git commit → git push
```

---

## 注意事项

1. **WebP 优先**：永远用 WebP 格式的图片，不要用 JPG/PNG
2. **英文文件名**：音频和图片都用英文文件名，避免中文 URL 问题
3. **R2 文件不可删除后恢复**：删之前确认不再需要
4. **构建检查**：推送前可以在本地 `npm run build` 检查有无报错
5. **关于我**：需要我帮忙上传文件到 R2 时，直接把文件路径发给我就行
