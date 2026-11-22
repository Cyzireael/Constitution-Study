# Personal Law Study Platform

个人法律学习平台，当前正式启用宪法学课程。课程知识仅依据用户提供的材料；资料未覆盖的问题应明确标注，不推测老师观点或标准答案。

技术栈：React、TypeScript、Vite、React Router。当前无后端、云数据库或 AI API。

## 本地运行

环境要求：Node.js 22.12 或更高版本、pnpm 11。

```powershell
pnpm install
pnpm dev
```

打开 Vite 输出的本地地址。检查与构建命令：

```powershell
pnpm typecheck
pnpm build
pnpm preview
```

生产构建输出到 `dist/`。开发地址保持在根路径；生产预览使用 Pages 子路径 `http://127.0.0.1:4173/Constitution-Study/`。项目使用 HashRouter，无需额外配置 SPA 路由回退。

## 项目结构

```text
public/                  图标和由 Vite 发布的静态课件
  course-materials/      第 1—7 讲原始 PPT 与 PDF 预览副本
src/
  config/                全站名称和描述
  core/                  学科注册、存储键和旧数据迁移
  subjects/              学科配置和课程数据
    constitution/        宪法学课程、知识点和讲次资源映射
  components/            共用布局、编辑器和主题选择器
  pages/                 六个学习页面
  styles/                全局和响应式样式
  themes/                CSS 变量主题
backups/                 本地备份，不提交到仓库
source-materials/        原始 PPT，本地留存，不提交到仓库
```

浏览器中用户编辑、核对状态和学习记录保存在 LocalStorage。数据按学科命名空间隔离；旧迁移键与本地备份保留。LocalStorage 按设备和浏览器分别保存，电脑与手机访问同一网址不会自动同步。跨设备同步需要后续单独设计云端数据库和身份认证。

## 课程资料与预览

`src/subjects/constitution/lectures.ts` 统一维护讲次、原始课件和 PDF 预览 URL。部署需要包含 `public/course-materials/` 中的 PPT 与 `public/course-materials/pdf/` 中对应的 PDF。来源页码仍指向原始 PPT 幻灯片。

PPT 和 PDF 由本地开发、预览配置返回内嵌响应头。浏览器能否原生展示 PPT 取决于浏览器本身；PDF 是在线预览首选。页面另提供原始 PPT 下载入口。

## GitHub Pages 发布

网站发布地址为 [https://cyzireael.github.io/Constitution-Study/](https://cyzireael.github.io/Constitution-Study/)。

GitHub Pages 是公开静态网站，不提供本项目的个人身份验证。任何人都可能访问网页、查看公开仓库源码及提交历史、下载 `public/course-materials/` 中的 PPT 和 PDF。仓库改为 Public 后，网页与课件都不应视作私人内容；提交历史中的作者姓名和邮箱也可能公开。

仓库 Settings > Pages 的发布来源需设为 **GitHub Actions**。`.github/workflows/pages.yml` 在推送 `main` 或手动触发时，使用 `package.json` 中固定的 pnpm 版本安装依赖、运行类型检查和生产构建，并发布 `dist/`。生产构建使用 `/Constitution-Study/` 子路径，开发服务器仍使用 `/`；应用继续使用 HashRouter，无需 SPA 路由回退。

首次发布前，在 GitHub 仓库 Settings > Pages 中选择 **GitHub Actions**。工作流部署成功后，可在以上网址访问网站。PDF 与 PPT 是公开静态文件，可直接从该网站访问和下载。

GitHub Pages 只托管静态文件，不提供服务器端身份认证、云数据库或跨设备 LocalStorage 同步。不要在公开部署中存放秘密、私人笔记、凭据或未获准公开的课程材料。

## GitHub 文件策略

提交应用源码、课程 JSON、`public/course-materials/`、锁文件、构建配置和部署配置。`.gitignore` 排除 `node_modules/`、构建产物、环境变量、备份和 `source-materials/` 原始材料。网站运行需要的课件副本和 PDF 会随仓库公开。

不要提交 `.env`、真实密钥、个人凭据、日志、缓存或 `backups/`。当前项目无需部署密钥或运行时环境变量。

## 页面

| 页面 | 地址 |
| --- | --- |
| 学习主页 | `/#/` |
| 知识点库 | `/#/knowledge` |
| 章节练习 | `/#/exercises` |
| 主观题训练 | `/#/subjective` |
| 错题本 | `/#/wrong-questions` |
| 学习进度 | `/#/progress` |

平台包含六个主要页面、主题切换、学科选择、知识点来源追踪、编辑、恢复、人工核对和课程 JSON 导入导出。章节练习、主观题作答、错题归集、收藏及学习进度记录仍按项目规划逐步实现。
