# Huntd — SaaS 产品规划 v3.1

> **对标：Harmonic.ai 的垂直细分版本**
> **定位：DevOps/Security 工具销售团队专用的买入信号平台**
> **更新日期：2026-10-12**

---

## 一、产品定位

**Huntd = 专为 DevOps/Security/Compliance 工具销售团队打造的买入信号平台**

卖 Kubernetes、云安全、SOC 2 合规工具的销售，每天需要找高意向客户。Huntd 监控 3 类购买信号，每天自动推送 + AI 生成触达文案，帮销售直接找到"现在正在花钱"的公司。

---

## 二、核心能力（必须做，不可裁剪）

这是产品的价值核心，Phase 1 必须全部跑通：

| 信号类型 | 含义 | 数据来源 |
|---------|------|---------|
| **招聘关键岗位** | 在招 SOC 2 / HIPAA / DevOps / Security / Compliance 相关职位 | Greenhouse / Ashby ATS 公开 API |
| **融资动态** | 完成任何轮次融资 | TechCrunch RSS + Crunchbase RSS |
| **工程负责人上任** | 新任 VP of Engineering / Head of DevOps / CISO / CTO | Apify LinkedIn 公司页 |

每条信号配套：
- 原始摘要（职位名/融资金额/人名+背景）
- AI 生成的触达文案（100-150 字，可直接发给客户）

---

## 三、分阶段计划

### Phase 1：核心能力跑通（Week 1-2）

**目标：3 类信号真实运行，数据写入数据库，能在本地/简单页面看到结果**

不做任何 SaaS 功能（不做付费、不做注册、不做复杂 UI），只专注数据管道。

---

#### Step 1：数据库 Schema（Day 1）

```sql
-- 监控的公司
create table companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  domain        text,
  linkedin_url  text,
  ats_platform  text,  -- 'greenhouse' | 'ashby' | null
  ats_slug      text,
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- 3 类信号统一入口
create table signals (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies not null,
  company_name  text not null,
  signal_type   text not null,  -- 'hiring' | 'funding' | 'executive'
  signal_title  text not null,  -- 展示用标题
  signal_url    text,
  signal_date   date not null default current_date,
  raw_summary   text,           -- 原始内容摘要
  ai_outreach   text,           -- Claude 生成的触达文案
  created_at    timestamptz default now()
);

-- 去重：同公司同类型同标题同一天只记一条
create unique index signals_dedup
  on signals (company_id, signal_type, signal_title, signal_date);
```

初始数据：往 companies 表写入 9 家已验证的公司（Vanta/Tailscale/Datadog/Stripe/Figma/GitLab/Brex/Anthropic/Linear）。

---

#### Step 2：招聘信号工作流（Day 2-3）

**数据源：Greenhouse + Ashby ATS 公开 API（无需 Key）**

```
Schedule: 每天 08:00
  │
  ▼
Supabase: SELECT * FROM companies WHERE is_active = true AND ats_platform IS NOT NULL
  │
  ▼
Split In Batches (size=10)
  │
  ▼
Switch: 按 ats_platform 分支
  ├── greenhouse → GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true
  └── ashby      → GET https://api.ashbyhq.com/posting-api/job-board/{slug}
  │
  ▼
Code Node: 统一格式 + 关键词过滤
  关键词：devops, devsecops, sre, security engineer, cloud security,
          appsec, soc2, hipaa, compliance, infrastructure, platform engineer,
          ciso, head of security, vp of engineering, zero trust
  只保留 7 天内的职位（updated_at 字段）
  │
  ▼
IF: 有匹配职位？
  │ 是
  ▼
去重检查（SELECT 是否已存在）
  │ 不存在
  ▼
OpenRouter (Claude Haiku): 生成触达文案
  │
  ▼
Supabase INSERT INTO signals
```

**输出示例：**
```
signal_type: 'hiring'
signal_title: 'Hiring: Head of DevOps at Tailscale'
signal_url: https://boards.greenhouse.io/tailscale/jobs/xxx
raw_summary: 'Tailscale is looking for a Head of DevOps to lead...'
ai_outreach: 'Hi [Name], noticed Tailscale just posted for a Head of DevOps...'
```

---

#### Step 3：融资信号工作流（Day 4-5）

**数据源：TechCrunch RSS + Crunchbase News RSS（免费，无需 Key）**

```
Schedule: 每天 09:00
  │
  ├── GET https://techcrunch.com/feed/
  └── GET https://news.crunchbase.com/feed/
  │
  ▼
Merge 两个 RSS 结果
  │
  ▼
Code Node: 解析文章，提取公司名
  过滤关键词：'raises', 'funding', 'series', 'seed', 'valuation'
  │
  ▼
Supabase: SELECT name FROM companies
  │
  ▼
Code Node: 模糊匹配（文章中是否提到监控公司）
  │ 匹配到
  ▼
去重检查 → OpenRouter 生成文案 → INSERT INTO signals
```

**匹配逻辑：**
```javascript
for (const article of articles) {
  for (const company of companies) {
    const inTitle = article.title.toLowerCase().includes(company.name.toLowerCase())
    const inBody  = article.content.toLowerCase().includes(company.name.toLowerCase())
    if (inTitle || inBody) {
      // 匹配成功，提取融资金额（正则）
    }
  }
}
```

---

#### Step 4：工程高管上任信号（Day 6-7）

**数据源：Apify LinkedIn Company Scraper**

> ⚠️ 注意：Apify 有使用成本（约 $0.5-1/次），周级运行控制成本

```
Schedule: 每周一 10:00
  │
  ▼
Supabase: SELECT * FROM companies WHERE linkedin_url IS NOT NULL
  │
  ▼
Split In Batches (size=3)  ← LinkedIn 严格限流，批次要小
  │
  ▼
Apify Actor: apify/linkedin-company-scraper
  输入: linkedin_url
  输出: 最近的员工变动、新上任人员
  │
  ▼
Code Node: 过滤关键职位 + 入职时间
  职位包含：VP Engineering, Head of DevOps, CISO,
            Chief Security Officer, Director of Infrastructure,
            VP of Platform, Head of SRE
  入职时间 < 30 天
  │
  ▼
去重检查 → OpenRouter 生成文案 → INSERT INTO signals
```

---

#### Step 5：AI 触达文案 Prompt（3 类信号各一个）

**招聘信号：**
```
You are a B2B sales copywriter specializing in DevOps/Security tools.

Company: {company_name}
Signal: They just posted a job for {job_title}
Job summary: {job_summary}

Write a short outreach message (100-150 words):
- Start by referencing this specific job posting as the reason for reaching out
- Imply this hiring signal means they're scaling infrastructure or facing pain points
- End with an open-ended question (not a hard sell)
- Don't mention any specific product
- Tone: direct, human, not salesy

Output plain text only, no subject line, no signature.
```

**融资信号：**
```
Company: {company_name}
Signal: Just raised {round} — {amount}
News summary: {article_summary}

Same format as above. Start by congratulating the raise.
Imply that fast growth after funding usually brings infrastructure/security challenges.
```

**高管上任信号：**
```
Company: {company_name}
Signal: {person_name} just joined as {title}
Background: {person_background}

Same format. New executives have 90 days to show results —
this is the best window to reach out with relevant solutions.
```

---

#### Step 6：验证端到端（Day 7）

手动触发 3 个工作流，检查：
- [ ] signals 表有真实数据（至少 20 条）
- [ ] 3 类信号都有覆盖
- [ ] ai_outreach 字段有内容，质量可用
- [ ] 去重逻辑正常（重复触发不会写入重复数据）

**Phase 1 完成标准：** 3 类信号自动跑通，数据写入 Supabase，AI 文案质量可用

---

### Phase 2：Web 看板（Week 2-3）

**目标：能在浏览器里看到信号 + 文案，流程完整可演示**

现有代码（JobList/FilterBar/Sidebar）可以直接改造复用。

---

#### Step 7：API 路由（Day 8-9）

基于现有 `/api/jobs/route.ts` 的模式，新增：

```
GET /api/signals          查询信号列表（type / date / company 筛选）
GET /api/signals/[id]     单条信号详情（含 ai_outreach）
GET /api/companies        公司列表（含近 7 天信号数统计）
```

---

#### Step 8：UI 改造（Day 10-12）

**页面 1：信号时间线 `/`**
```
┌─────────────────────────────────────────┐
│  Huntd                  [Today] [Week]  │
├─────────────────────────────────────────┤
│  [All] [Hiring] [Funding] [Executive]  │
├─────────────────────────────────────────┤
│  🔴 Hiring                  Today 09:12 │
│  Head of DevOps — Tailscale             │
│  → View outreach →                      │
│                                         │
│  💰 Funding                 Today 09:08 │
│  Series B ($20M) — Acme Corp            │
│  → View outreach →                      │
│                                         │
│  👤 Executive               Yesterday   │
│  New CISO: John Smith — Vanta           │
│  → View outreach →                      │
└─────────────────────────────────────────┘
```

**页面 2：信号详情（抽屉或跳转）**
```
┌─────────────────────────────────────────┐
│  Tailscale — Head of DevOps             │
│  2026-10-11  |  Source: Greenhouse      │
├─────────────────────────────────────────┤
│  Raw Signal                             │
│  "Tailscale is hiring a Head of DevOps  │
│  to lead their zero-trust infra team..."│
│  [View original ↗]                      │
├─────────────────────────────────────────┤
│  AI Outreach Draft        [Copy] [Regen]│
│                                         │
│  Hi [Name],                             │
│  Noticed Tailscale just posted for a    │
│  Head of DevOps — that usually signals  │
│  you're scaling infra fast...           │
└─────────────────────────────────────────┘
```

---

#### Step 9：UI 切换为英文（Day 12）

面向海外销售客户，UI 全部改为英文（代码里的中文注释可以保留）。

---

#### Step 10：端到端演示流程验证（Day 13-14）

- [ ] 打开首页，能看到真实信号列表
- [ ] 点击信号，能看到 AI 文案
- [ ] 复制文案，粘贴到编辑器，内容质量可用
- [ ] 筛选功能正常（按类型/日期/公司）

**Phase 2 完成标准：** 完整的看板可以演示，有真实数据，AI 文案可直接使用

---

### Phase 3：SaaS 平台（Week 3-4）

**目标：能注册、能付费、能上线**

**前提：Phase 1 + Phase 2 必须稳定，再进入这一阶段**

---

#### Step 11：认证（Day 15-16）

- Supabase Auth（邮箱注册/登录）
- middleware 保护路由（未登录跳转 `/login`）
- 登录后看完整信号

---

#### Step 12：定价 + 付费订阅（Day 17-19）

**三档订阅：**

| 方案 | 价格 | 监控公司数 | 信号类型 |
|------|------|-----------|---------|
| Starter | $49/月 | 25 家 | 招聘 |
| Growth | $149/月 | 100 家 | 招聘 + 融资 |
| Pro | $399/月 | 无限 | 全部 3 类 |

- 14 天免费试用（需信用卡）
- Stripe Checkout + Webhook 处理订阅状态
- `/settings` 页面管理订阅（Stripe Customer Portal）

> ⚠️ 国内账号注册 Stripe 可能有审核问题，提前注册，备用方案：Lemon Squeezy

---

#### Step 13：邮件通知（Day 20）

- Resend（免费 3000 封/月）
- n8n 每天 08:30 推送前一天新信号摘要给活跃用户

---

#### Step 14：Landing Page + 部署（Day 21-24）

- Landing Page（Hero + 功能 + 定价 + CTA）
- Next.js → Vercel（CI/CD 自动）
- n8n → Railway
- 监控：n8n 工作流 Try/Catch + 失败告警

---

#### Step 15：上线（Day 25-28）

- 自测 48 小时
- Bug 修复
- 正式上线

---

## 四、成本结构

| 服务 | MVP 阶段费用 |
|------|------------|
| Vercel | $0（Hobby）|
| Supabase | $0（Free）|
| Railway (n8n) | ~$5/月 |
| OpenRouter (Claude Haiku) | ~$3/月（3000 条文案）|
| Apify (LinkedIn) | ~$5/月（周级运行）|
| Resend | $0（3000 封/月）|
| **合计** | **~$13/月** |

---

## 五、当前代码状态

### 已完成
- ✅ Next.js 初始化（Tailwind + TypeScript）
- ✅ `/api/jobs` 路由（Supabase 查询，含筛选参数）
- ✅ 主页 UI 框架（Sidebar + FilterBar + JobList）
- ✅ 9 家测试公司 ATS slug 验证完毕
- ✅ n8n 招聘信号工作流设计文档

### 立即行动（Phase 1 第一步）

1. Supabase 执行 Section 三·Step 1 的 SQL 建表
2. Railway 部署 n8n
3. n8n 实现招聘信号工作流（Greenhouse + Ashby）
4. 验证：手动触发 → 数据写入 signals 表 → 本地页面可见

---

## 六、里程碑

| 阶段 | 完成标准 | 预计时间 |
|------|---------|---------|
| Phase 1 完成 | 3 类信号自动跑通，signals 表有真实数据 | Day 7 |
| Phase 2 完成 | Web 看板可演示，AI 文案质量可用 | Day 14 |
| Phase 3 完成 | 能注册、能付费、生产环境稳定运行 | Day 28 |
| **第一个付费用户** | — | Month 2 |
