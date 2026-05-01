# Ovwebnotes v1.0.1

一个支持 **云端数据库** 和 **本地文件系统** 双存储模式的 Markdown 笔记应用。灵感来源于 Obsidian，提供所见即所得的编辑体验，同时支持 Git 版本控制和多 Vault 管理。

## 功能特性

- 📝 **所见即所得编辑器** — 基于 Vditor，支持 Markdown / 即时渲染 / 分屏预览
- ☁️ **双存储模式** — Cloud（PostgreSQL 数据库）与 Vault（本地 .md 文件）自由切换
- 🌲 **文件树管理** — 树状视图浏览笔记，支持文件夹展开/折叠
- 📁 **多 Vault 管理** — 挂载多个本地目录，可视化目录浏览器选择路径
- 🔄 **数据同步** — 本地 ↔ 云端一键上传/下载
- 🔀 **Git 版本控制** — 绑定远程仓库，支持推送/拉取/自动同步
- 🏷️ **标签与文件夹** — 按标签和文件夹分类筛选笔记
- 🌙 **深色模式** — 支持浅色/深色/跟随系统
- 🔍 **全文搜索** — 标题和内容关键词搜索
- ⚡ **性能优化** — 延迟加载笔记内容，提升加载速度

## 技术栈

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| Vue 3 | ^3.4.21 | 渐进式 JavaScript 框架 |
| TypeScript | ~5.4.5 | 类型安全 |
| Vite | ^5.2.8 | 构建工具 |
| Pinia | ^2.1.7 | 状态管理 |
| Vue Router | ^4.3.0 | 路由管理 |
| Vditor | ^3.10.8 | Markdown 编辑器 |
| Axios | ^1.6.8 | HTTP 客户端 |
| Tailwind CSS | ^3.4.3 | 原子化 CSS 框架 |
| @tailwindcss/typography | ^0.5.12 | prose 排版插件 |

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| NestJS | ^10.3.0 | Node.js 后端框架 |
| Prisma | ^5.9.0 | ORM |
| PostgreSQL | 14+ | 主数据库 |
| Redis | 7+ | 缓存/会话 |
| simple-git | ^3.22.0 | Git 操作 |
| @nestjs/swagger | ^7.2.0 | API 文档 |
| @nestjs/schedule | ^4.0.0 | 定时任务 |
| Multer | ^1.4.5-lts.1 | 文件上传 |

### 项目结构

```
obsidian-hybrid-notes/
├── client/                     # 前端 Vue 3 项目
│   ├── src/
│   │   ├── api/                # API 接口封装
│   │   ├── components/         # 组件
│   │   │   ├── common/         # 通用组件（StorageToggle, TagBadge）
│   │   │   ├── git/            # Git 状态和同步组件
│   │   │   ├── layout/         # 布局组件（AppLayout, AppHeader, AppSidebar）
│   │   │   └── notes/          # 笔记组件（NoteEditor, NoteList, NoteCard）
│   │   ├── composables/        # 组合式函数
│   │   ├── router/             # 路由配置
│   │   ├── stores/             # Pinia 状态管理
│   │   ├── types/              # TypeScript 类型定义
│   │   └── views/              # 页面视图
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   └── package.json
├── server/                     # 后端 NestJS 项目
│   ├── src/
│   │   ├── ai/                 # AI 功能模块
│   │   ├── files/              # 文件管理模块
│   │   ├── git/                # Git 版本控制模块
│   │   ├── ingest/             # 数据导入模块
│   │   ├── notes/              # 笔记 CRUD 模块
│   │   ├── storage/            # 存储层（FileAdapter + DbAdapter）
│   │   ├── vault/              # Vault 管理模块
│   │   ├── webhooks/           # Webhook 模块
│   │   └── app.module.ts
│   ├── prisma/
│   │   └── schema.prisma       # 数据库模型
│   ├── .env
│   └── package.json
└── README.md
```

## 数据库模型

```
┌─────────────────────────────────────────┐
│                 Note                     │
├─────────────────────────────────────────┤
│ id          String (UUID)    PK         │
│ title       String                      │
│ content     String (Text)               │
│ tags        String[]                    │
│ is_cloud    Boolean        Indexed      │
│ folderPath  String         Indexed      │
│ filePath    String                      │
│ createdAt   DateTime                    │
│ updatedAt   DateTime                    │
├─────────────────────────────────────────┤
│ attachments → Attachment[]              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              Attachment                  │
├─────────────────────────────────────────┤
│ id          String (UUID)    PK         │
│ noteId      String          FK→Note     │
│ fileName    String                      │
│ filePath    String                      │
│ fileType    String                      │
│ size        Int                         │
│ is_cloud    Boolean                     │
│ createdAt   DateTime                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│              SyncLog                    │
├─────────────────────────────────────────┤
│ id          String (UUID)    PK         │
│ status      String                      │
│ message     String                      │
│ createdAt   DateTime                    │
└─────────────────────────────────────────┘
```

## 环境要求

| 依赖 | 最低版本 |
|------|---------|
| Node.js | 18.x |
| PostgreSQL | 14+ |
| Redis | 7+ |
| Git | 2.x |
| npm 或 pnpm | 最新版 |

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd obsidian-hybrid-notes
```

### 2. 配置后端

```bash
cd server

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
```

编辑 `server/.env`：

```env
DATABASE_URL=postgresql://用户名:密码@localhost:5432/obsidian_notes
REDIS_URL=redis://localhost:6379
VAULT_PATH=./vaults
PORT=3000
NODE_ENV=production
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npx prisma generate

# 执行数据库迁移
npx prisma migrate dev --name init
```

### 4. 配置前端

```bash
cd ../client

# 安装依赖
npm install
```

### 5. 启动开发服务

```bash
# 终端 1：启动后端
cd server
npm run start:dev

# 终端 2：启动前端
cd client
npm run dev
```

访问 http://localhost:5173 即可使用。

## Docker 部署

项目已包含完整的 Docker 配置文件，无需手动创建任何文件，只需执行以下命令即可完成部署。

### 前置条件

- 已安装 [Docker](https://docs.docker.com/get-docker/) 和 [Docker Compose](https://docs.docker.com/compose/install/)

### 一键部署

```bash
# 克隆项目
git clone <repository-url>
cd obsidian-hybrid-notes

# 构建并启动所有服务（首次构建约需 3-5 分钟）
docker compose up -d --build

# 查看服务状态（等待 backend 显示 Up）
docker compose ps

# 查看后端启动日志（确认出现 "Application is running"）
docker compose logs backend -f
```

启动成功后，访问 **http://localhost** 即可使用。

### 包含的服务

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| PostgreSQL | ohn-postgres | 5432 | 数据库，数据持久化到 Docker Volume |
| Redis | ohn-redis | 6379 | 缓存 |
| 后端 API | ohn-backend | 3000 | NestJS 服务 |
| 前端 | ohn-frontend | 80 | Nginx 静态托管 + API 反向代理 |

### 常用操作

```bash
# 查看日志
docker compose logs -f

# 查看某个服务日志
docker compose logs backend --tail 50

# 重启某个服务
docker compose restart backend

# 重新构建并启动
docker compose up -d --build

# 停止所有服务
docker compose down

# 停止并清除数据（⚠️ 会删除数据库数据）
docker compose down -v
```

### 自定义配置

如需修改数据库密码、端口等，编辑项目根目录的 `docker-compose.yml` 中 `environment` 部分即可。

### 项目中的 Docker 相关文件

| 文件 | 说明 |
|------|------|
| `docker-compose.yml` | 服务编排配置 |
| `server/Dockerfile` | 后端镜像构建 |
| `client/Dockerfile` | 前端镜像构建 |
| `client/nginx.conf` | Nginx 反向代理配置 |
| `server/.dockerignore` | 后端构建排除文件 |
| `client/.dockerignore` | 前端构建排除文件 |

## API 接口

启动后访问 http://localhost:3000/api/docs 查看 Swagger API 文档。

### 主要接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/notes` | 获取笔记列表 |
| POST | `/api/notes` | 创建笔记 |
| GET | `/api/notes/:id` | 获取单个笔记 |
| PUT | `/api/notes/:id` | 更新笔记 |
| DELETE | `/api/notes/:id` | 删除笔记 |
| GET | `/api/notes/search` | 搜索笔记 |
| GET | `/api/notes/tags` | 获取所有标签 |
| POST | `/api/notes/:id/export` | 云端笔记导出到本地 |
| POST | `/api/notes/:id/import` | 本地笔记导入到云端 |
| GET | `/api/vaults` | 获取所有 Vault 配置 |
| POST | `/api/vaults` | 添加 Vault |
| POST | `/api/vaults/:id/switch` | 切换 Vault |
| DELETE | `/api/vaults/:id` | 删除 Vault |
| GET | `/api/vaults/browse` | 浏览目录 |
| GET | `/api/git/status` | Git 状态 |
| POST | `/api/git/sync` | Git 同步 |

## 生产环境注意事项

1. **数据库安全**：修改默认数据库密码，限制远程访问
2. **环境变量**：不要将 `.env` 文件提交到版本控制
3. **HTTPS**：生产环境建议使用 Nginx/Caddy 配置 SSL 证书
4. **备份**：定期备份 PostgreSQL 数据和 Vault 文件目录
5. **日志**：配置日志轮转，避免日志文件过大
6. **资源限制**：Docker 部署时建议配置内存和 CPU 限制

## License

MIT
