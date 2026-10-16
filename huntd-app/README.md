# Huntd — 公司购买信号监控

**架构：n8n（每小时抓取）→ Supabase → Next.js 前端**

## 快速开始

```bash
npm install
# 先填写 .env.local 里的 Supabase 密钥
npm run dev
```

详见 [DEPLOYMENT.md](./DEPLOYMENT.md) 完整部署说明。

## 项目结构

```
huntd-app/
├── config/
│   └── companies.json       # 公司列表配置（在这里添加新公司）
├── app/
│   ├── components/
│   │   ├── Sidebar.tsx      # 侧边栏导航
│   │   ├── FilterBar.tsx    # 职位筛选栏
│   │   └── JobList.tsx      # 职位列表
│   ├── api/jobs/route.ts    # 职位查询 API
│   └── page.tsx             # 主页
├── lib/
│   └── supabase.ts          # Supabase 客户端
├── n8n/
│   └── huntd-workflow.json  # n8n 工作流（可直接导入）
└── supabase-schema.sql      # 数据库建表 SQL
```

## 数据流

```
companies.json
     ↓
n8n 工作流（每小时）
     ↓ Greenhouse API / Ashby API
规范化 + 关键词匹配
     ↓
Supabase（ON CONFLICT → 去重）
     ↓
Next.js API Route → 前端
```
