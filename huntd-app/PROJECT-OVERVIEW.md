# Huntd 项目总览

## 已完成的功能

### ✅ 前端（Next.js + Tailwind）
- 侧边栏导航（显示所有公司 + 职位计数）
- 筛选栏（关键词搜索、匹配状态、时间范围）
- 职位列表（响应式卡片，显示职位详情）
- 暗色主题 UI
- 可扩展架构（侧边栏预留其他模块入口）

### ✅ 后端 API
- `/api/jobs` - 职位查询接口
  - 支持按公司筛选 (`company=figma`)
  - 支持按关键词匹配筛选 (`matched=true`)
  - 支持关键词搜索 (`keyword=devops`)
  - 支持时间范围筛选 (`since=2026-10-01`)
  - 分页支持 (`limit`/`offset`)

### ✅ 数据库（Supabase）
- `companies` 表：公司配置
- `jobs` 表：职位数据（自动去重）
- `daily_queue` 表：每日输出队列（预留，用于后续触达）
- 完整索引优化

### ✅ n8n 工作流
- 每小时自动抓取（可配置间隔）
- 支持 Greenhouse + Ashby 双 ATS
- 自动关键词匹配
- ON CONFLICT 去重
- 可直接导入（`n8n/huntd-workflow.json`）

### ✅ 配置文件
- `config/companies.json` - 公司列表（9 家已验证）
- 关键词列表（devops, security, compliance 等）
- 易扩展：添加新公司只需编辑 JSON

---

## 文件清单

```
huntd-app/
├── config/
│   └── companies.json              # ★ 公司配置（在这里添加新公司）
│
├── app/
│   ├── layout.tsx                  # 根布局
│   ├── page.tsx                    # 主页（整合所有组件）
│   ├── components/
│   │   ├── Sidebar.tsx             # 侧边栏导航
│   │   ├── FilterBar.tsx           # 筛选栏
│   │   └── JobList.tsx             # 职位列表
│   └── api/jobs/
│       └── route.ts                # 职位查询 API
│
├── lib/
│   └── supabase.ts                 # Supabase 客户端 + 类型定义
│
├── n8n/
│   └── huntd-workflow.json         # ★ n8n 工作流（可直接导入）
│
├── supabase-schema.sql             # ★ 数据库建表 SQL
├── DEPLOYMENT.md                   # ★ 部署指南
├── README.md                       # 项目简介
├── start.sh                        # 快速启动脚本
└── .env.local                      # ★ 环境变量（需手动配置）
```

**标 ★ 的文件需要你手动操作**

---

## 下一步行动

### 1. 配置 Supabase（5 分钟）
```bash
# 1. 去 https://supabase.com 创建项目
# 2. 复制 SQL：cat supabase-schema.sql
# 3. 在 Supabase SQL Editor 里运行
# 4. 复制 Project URL + anon key 到 .env.local
```

### 2. 本地测试前端（1 分钟）
```bash
cd huntd-app
./start.sh  # 或 npm run dev
# 打开 http://localhost:3000
```

此时页面能打开但无数据，因为 Supabase `jobs` 表是空的。

### 3. 部署 n8n 工作流（10 分钟）
```bash
# 选项 A：Railway 一键部署 n8n（推荐）
# 1. 去 railway.app 部署 n8n 模板
# 2. 在 n8n 里导入 n8n/huntd-workflow.json
# 3. 配置 Supabase Credentials（见 DEPLOYMENT.md）
# 4. 手动触发工作流，验证数据写入

# 选项 B：本地 n8n（测试用）
docker run -it --rm \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8nio/n8n
# 打开 http://localhost:5678，导入工作流
```

### 4. 验证数据流
```bash
# 1. 在 n8n 里手动执行工作流
# 2. 在 Supabase 查看 jobs 表：
#    SELECT company_name, COUNT(*) FROM jobs GROUP BY company_name;
# 3. 刷新前端，应该能看到职位列表
```

### 5. 部署到生产环境（5 分钟）
```bash
# Vercel 部署（推荐）
vercel
# 在 Vercel Dashboard 添加环境变量：
# NEXT_PUBLIC_SUPABASE_URL
# NEXT_PUBLIC_SUPABASE_ANON_KEY
```

---

## 添加新公司的流程

### 第 1 步：验证 ATS
```bash
# Greenhouse
curl "https://boards-api.greenhouse.io/v1/boards/COMPANY_SLUG/jobs"

# Ashby
curl "https://api.ashbyhq.com/posting-api/job-board/COMPANY_SLUG"
```

### 第 2 步：更新配置
编辑 `config/companies.json`：
```json
{
  "id": "newco",
  "name": "NewCo",
  "domain": "newco.com",
  "ats": "greenhouse",
  "slug": "newco",
  "tags": ["industry"]
}
```

### 第 3 步：Supabase 插入数据
```sql
INSERT INTO companies (id, name, domain, ats_platform, ats_slug, tags)
VALUES ('newco', 'NewCo', 'newco.com', 'greenhouse', 'newco', ARRAY['industry']);
```

### 第 4 步：触发 n8n 工作流
下次自动运行（每小时）就会抓取新公司职位，或手动触发。

---

## 架构优势

### 免费
- Greenhouse/Ashby API：免费无限制
- Supabase：免费额度足够（500MB 数据库 + 2GB 带宽/月）
- Vercel：免费额度足够（100GB 带宽/月）
- Railway n8n：$5/月（或本地 Docker 免费）

### 实时性
- 每小时抓取，比 LinkedIn/Indeed 快 1-3 天
- `updated_at` 精确到秒，能检测职位修改

### 可扩展
- 侧边栏预留其他模块入口（融资、高管任命）
- n8n 工作流可轻松添加新 ATS（加 Switch 分支）
- 配置文件化，无需改代码

### 数据完整性
- ON CONFLICT 自动去重
- 保留职位历史（`first_seen_at` vs `updated_at`）
- 关键词匹配结果可追溯

---

## 已知限制

1. **不支持 Lever**：Lever API 在 2026 年已对多数公司失效，移除支持
2. **需手动添加公司**：无自动发现机制，需验证 ATS slug
3. **无 AI 文案生成**：预留了 `description_snippet` 字段，后续可接入 OpenAI
4. **无邮件推送**：预留了 `daily_queue` 表，后续可接入 SendGrid

---

## 技术栈

- **前端**: Next.js 16 (App Router) + TypeScript + Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: Supabase (PostgreSQL)
- **工作流**: n8n
- **部署**: Vercel + Railway
- **数据源**: Greenhouse API + Ashby API

---

## 相关文档

- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整部署指南
- [README.md](./README.md) - 快速开始
- [huntd-产品文档.md](../huntd-产品文档.md) - 产品需求文档
- [target-companies-ats-guide.md](../target-companies-ats-guide.md) - ATS 验证指南
