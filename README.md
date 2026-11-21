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

生产构建输出到 `dist/`。项目使用 HashRouter，无需额外配置 SPA 路由回退。

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

PPT 和 PDF 由开发、预览及 Vercel 配置返回内嵌响应头。浏览器能否原生展示 PPT 取决于浏览器本身；PDF 是在线预览首选。页面另提供原始 PPT 下载入口。不要使用 Office Online Viewer 转发需身份验证的课程资料。

## 私人 Vercel 部署

GitHub 仓库应设为 **Private**。这与线上访问保护相互独立：Vercel 项目必须启用 **Vercel Authentication**，Deployment Protection 范围设为 **All Deployments**，覆盖生产、预览及自动生成的部署 URL。只保留个人 Vercel 账号访问，不邀请其他成员、不创建 Shareable Links、不开放绕过保护的入口。

Vercel 建议设置：

- Framework Preset：Vite
- Install Command：`pnpm install --frozen-lockfile`
- Build Command：`pnpm build`
- Output Directory：`dist`

验证保护时，除首页外，还应使用未认证浏览器直接请求 `/course-materials/lecture-01.pptx.pptx` 和 `/course-materials/pdf/lecture-01.pdf` 等静态资源 URL，确认返回登录/保护页面而不是课件文件。不要启用 Office Online Viewer，因为它无法读取受保护资源，也会把资料交给第三方预览服务。

`vercel.json` 为 PPT/PDF 指定 MIME 类型、`Content-Disposition: inline` 和 `Cache-Control: private, no-store`。静态资源仍依赖 Vercel Deployment Protection 提供身份验证；响应头本身不是访问控制。

## GitHub 文件策略

提交应用源码、课程 JSON、`public/course-materials/`、锁文件、构建配置和部署配置。`.gitignore` 排除 `node_modules/`、构建产物、环境变量、备份和 `source-materials/` 原始材料。仓库必须保持 Private；即便如此，课程资料副本仍属于私人学习材料，应避免复制到公共仓库或第三方服务。

不要提交 `.env`、真实密钥、个人配置、日志、缓存或 `backups/`。当前项目无需部署密钥或运行时环境变量。

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
