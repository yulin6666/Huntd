# huntd — 产品文档 v2.1

> 更新：2026-10-09

---

## 一、产品定义

监控目标公司的 3 类购买信号，AI 生成触达文案，Web 看板查看结果。

**3 类信号（精准，不扩展）：**

| 信号      | 含义                                                     | 数据来源                            |
| ------- | ------------------------------------------------------ | ------------------------------- |
| 招聘关键岗位  | 在招 SOC 2 / HIPAA / DevOps / Security / Compliance 相关职位 | ATS 直接 API（Greenhouse/Lever/Ashby）|
| 融资动态    | 完成任何轮次融资                                               | TechCrunch RSS + Crunchbase RSS |
| 工程负责人上任 | 新任 VP of Engineering / Head of DevOps / CISO / CTO     | Apify LinkedIn 公司页              |

> ⚠️ **v2.1 变更说明：** Indeed RSS 已被 Cloudflare 全面封锁（2026年），改用 ATS 公开 API。
> 详见「二·工作流 1」说明。

**Web 只做两件事：**
1. 看信号列表（抓到了什么，什么时候抓到的）
2. 看 AI 生成的触达文案（可复制）

公司列表在 n8n 后台或数据库直接配置，不做前端录入页面。

---

## 二、n8n 工作流设计

### 核心设计原则：并行处理多公司

串行循环 100 家公司会很慢（每家 2-3 秒 = 5 分钟+）。
用 **Split in Batches + 并发子流程** 解决。

---

### 工作流 1：`hiring-signal.json`（每日招聘监控）

#### 数据来源选型（关键决策）

**❌ 放弃：Indeed RSS**
- 2026 年已被 Cloudflare 全面封锁，任何 HTTP 请求直接 403，无法绕过。
- 不用浪费时间调试。

**✅ 主力方案：ATS 直接 API（Greenhouse / Lever / Ashby）**

大量科技公司（尤其是有 DevOps/Security/Compliance 需求的企业）使用这三个 ATS，
且它们都提供**完全公开、无需 Key、无速率限制**的 Job Board API：

```
Greenhouse:
GET https://boards-api.greenhouse.io/v1/boards/{slug}/jobs?content=true

Lever:
GET https://api.lever.co/v0/postings/{slug}?mode=json

Ashby:
GET https://api.ashbyhq.com/posting-api/job-board/{slug}
```

`{slug}` 就是公司在 ATS 上的 ID，从公司 careers 页 URL 中提取：
- `boards.greenhouse.io/stripe` → slug = `stripe`
- `jobs.lever.co/vercel` → slug = `vercel`

**✅ 补充方案：Remotive API**（远程职位补充）

```
GET https://remotive.com/api/remote-jobs?company_name={name}&search=devops+security
```
- 完全免费，无需 API Key
- 注意：服务端过滤不完全准确，需要客户端再过滤一次

**⚠️ 备用方案：JSearch via RapidAPI**（200次/月）
- 覆盖面广（聚合 Google Jobs 数据），但免费额度太少（约 6次/天），仅用于发现新目标公司

#### 数据库新增字段

`companies` 表需要增加 ATS 信息字段（见三·数据库）。

#### 工作流设计

```
┌─────────────────────────────────────────────────────┐
│  Schedule Trigger  每天 08:00                        │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Supabase Node              │
        │  SELECT * FROM companies    │
        │  WHERE is_active = true     │
        └──────────────┬──────────────┘
                       │ 返回公司数组 [{id, name, domain, ats_platform, ats_slug}, ...]
        ┌──────────────▼──────────────┐
        │  Split In Batches           │
        │  batch_size = 10            │  ← ATS API 无速率限制，可提高并发
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Loop Over Items            │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │  Switch Node                │  ← 按 ats_platform 分支
        │  greenhouse → Greenhouse API│
        │  lever      → Lever API     │
        │  ashby      → Ashby API     │
        │  remotive   → Remotive API  │
        └──────────────┬──────────────┘
                       │ 各分支 HTTP Request 后 Merge
        ┌──────────────▼──────────────┐
        │  Code Node: 统一格式 + 关键词过滤  │
        │  关键词：devops, security,       │
        │  soc2, hipaa, compliance,        │
        │  infrastructure, cloud security  │
        │  过滤：只保留 7 天内的新职位       │
        └──────────────┬──────────────┘
                       │ 有新职位？
        ┌──────────────▼──────────────┐
        │  IF Node: items.length > 0  │
        └──────┬───────────────┬──────┘
             是│               │否（跳过）
        ┌──────▼──────┐
        │  Supabase   │  去重检查
        │  SELECT id  │  WHERE company_id = ?
        │  FROM signals│ AND signal_type = 'hiring'
        │  AND signal_date = today    │
        │  AND title = ?              │
        └──────┬──────┘
               │ 不存在（新信号）
        ┌──────▼──────┐
        │  OpenRouter │  Claude 生成文案
        │  (Claude)   │
        └──────┬──────┘
               │
        ┌──────▼──────┐
        │  Supabase   │  INSERT INTO signals
        │  Insert     │
        └─────────────┘
```

#### ATS API Code Node 示例（统一格式）

```javascript
// Code Node: normalize_ats_response
// 输入：来自不同 ATS 的原始 JSON
// 输出：统一格式 [{title, company, url, posted_at, description}]

const company = $json.company; // 从上游传入
const platform = company.ats_platform;
const raw = $json.ats_response;

const KEYWORDS = ['devops', 'security', 'soc2', 'soc 2', 'hipaa',
                  'compliance', 'infrastructure', 'cloud security', 'ciso'];

function hasKeyword(text) {
  const lower = (text || '').toLowerCase();
  return KEYWORDS.some(k => lower.includes(k));
}

function parseDate(str) {
  if (!str) return null;
  return new Date(str);
}

const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

let jobs = [];

if (platform === 'greenhouse') {
  jobs = (raw.jobs || []).map(j => ({
    title: j.title,
    company: company.name,
    company_id: company.id,
    url: j.absolute_url,
    posted_at: j.updated_at,
    description: j.content || '',
  }));
} else if (platform === 'lever') {
  jobs = (Array.isArray(raw) ? raw : []).map(j => ({
    title: j.text,
    company: company.name,
    company_id: company.id,
    url: j.hostedUrl,
    posted_at: new Date(j.createdAt).toISOString(),
    description: (j.description || '') + (j.lists || []).map(l => l.content).join(' '),
  }));
} else if (platform === 'ashby') {
  jobs = (raw.jobs || []).map(j => ({
    title: j.title,
    company: company.name,
    company_id: company.id,
    url: j.jobUrl,
    posted_at: j.publishedDate,
    description: j.descriptionHtml || '',
  }));
} else if (platform === 'remotive') {
  // Remotive 需要客户端过滤公司名
  jobs = (raw.jobs || [])
    .filter(j => j.company_name.toLowerCase().includes(company.name.toLowerCase()))
    .map(j => ({
      title: j.title,
      company: company.name,
      company_id: company.id,
      url: j.url,
      posted_at: j.publication_date,
      description: j.description || '',
    }));
}

// 过滤：关键词 + 7天内
const filtered = jobs.filter(j => {
  const isRecent = !j.posted_at || parseDate(j.posted_at) > sevenDaysAgo;
  return isRecent && (hasKeyword(j.title) || hasKeyword(j.description));
});

return filtered.map(j => ({ json: j }));
```

**并发说明：**
- ATS API 无速率限制，`batch_size` 可调高到 10-20
- Greenhouse/Lever/Ashby 每次请求返回该公司全量职位，一次搞定

---

### 工作流 2：`funding-signal.json`（融资信号，每日一次）

```
Schedule Trigger 09:00
  │
  ├─→ HTTP: TechCrunch RSS https://techcrunch.com/feed/
  ├─→ HTTP: Crunchbase News RSS https://news.crunchbase.com/feed/
  │
  └─→ Merge 合并两个 RSS 结果
        │
        ▼
  Code Node: 解析文章，提取公司名（正则 + 关键词过滤 "raises" "funding" "series"）
        │
        ▼
  Supabase: 读取 companies 表所有公司名
        │
        ▼
  Code Node: 模糊匹配
  （文章里提到的公司名 vs watched_companies.name）
        │ 匹配到
        ▼
  去重检查 → Claude 生成文案 → Supabase Insert
```

**匹配逻辑（关键）：**
```javascript
const companies = $('Supabase').all().map(i => i.json);
const articles = $input.all();

const matched = [];
for (const article of articles) {
  for (const company of companies) {
    if (article.json.title.toLowerCase().includes(company.name.toLowerCase()) ||
        article.json.content.toLowerCase().includes(company.name.toLowerCase())) {
      matched.push({ ...article.json, company_id: company.id, company_name: company.name });
    }
  }
}
return matched.map(m => ({ json: m }));
```

---

### 工作流 3：`executive-signal.json`（高管变动，每周一次）

LinkedIn 数据变化慢，每天跑没意义，每周一次。

```
Schedule Trigger 每周一 10:00
  │
  ▼
Supabase: SELECT * FROM companies WHERE is_active = true
  │
  ▼
Split In Batches (batch_size = 3)  ← LinkedIn 限流严，批次小一点
  │
  ▼
Apify Actor: apify/linkedin-company-scraper
  输入: company domain / LinkedIn URL
  输出: 最新员工变动、新上任高管
  │
  ▼
Code Node: 过滤关键职位
  包含：VP Engineering, Head of DevOps, CISO,
        Chief Security, Director of Infrastructure
  AND 入职时间 < 30 天
  │
  ▼
去重检查 → Claude 生成文案 → Supabase Insert
```

---

### 后台配置公司列表（不做前端）

直接在 Supabase 的 `companies` 表里操作，两种方式：

**方式 A：Supabase Table Editor**（推荐，最快）
- 打开 Supabase 后台 → Table Editor → companies 表
- 直接粘贴数据，或用 CSV 导入功能

**方式 B：n8n 提供一个"初始化 Webhook"**
```
POST /webhook/add-companies
Body: [
  {"name": "Acme Corp", "domain": "acme.com", "ats_platform": "greenhouse", "ats_slug": "acmecorp"},
  {"name": "Beta Inc", "domain": "beta.io", "ats_platform": "lever", "ats_slug": "beta-inc"}
]
```

#### 如何找到公司的 ATS slug

1. 去公司官网找 careers/jobs 页面
2. 看 URL：
   - `boards.greenhouse.io/stripe` → platform=greenhouse, slug=stripe
   - `jobs.lever.co/vercel` → platform=lever, slug=vercel
   - `jobs.ashbyhq.com/linear` → platform=ashby, slug=linear
3. 如果用 Workday/iCIMS 等其他 ATS，先标记为 `remotive` 或留空（该公司暂时靠 Remotive 兜底）

---

## 三、数据库设计（精简版）

```sql
-- 要监控的公司（后台直接写，不做前端）
create table companies (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,          -- "Acme Corp"
  domain        text,                   -- "acme.com"
  linkedin_url  text,                   -- Apify 高管监控用
  ats_platform  text,                   -- 'greenhouse' | 'lever' | 'ashby' | 'remotive' | null
  ats_slug      text,                   -- ATS 平台上的公司 ID
  is_active     boolean default true,
  created_at    timestamptz default now()
);

-- 抓到的信号（Web 只读这个表）
create table signals (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid references companies not null,
  company_name  text not null,        -- 冗余存，查询快
  signal_type   text not null,        -- 'hiring' | 'funding' | 'executive'
  signal_title  text not null,        -- "Hiring: Head of DevOps at Acme"
  signal_url    text,
  signal_date   date not null default current_date,
  raw_summary   text,                 -- 原始抓取内容摘要
  ai_outreach   text,                 -- Claude 生成的触达文案
  created_at    timestamptz default now()
);

-- 去重索引：同一公司同类信号同一天只记录一条
create unique index signals_dedup
  on signals (company_id, signal_type, signal_title, signal_date);
```

---

## 四、Web 看板（只读，极简）

两个页面，不需要更多。

### 页面 1：信号时间线 `/`

```
┌─────────────────────────────────────────────┐
│  SignalFlow                     [今天] [本周] │
├─────────────────────────────────────────────┤
│  筛选：[全部] [招聘] [融资] [高管]  搜索公司名  │
├─────────────────────────────────────────────┤
│                                             │
│  🔴 Acme Corp                    今天 09:12 │
│  Hiring: Head of DevOps                     │
│  → 查看 AI 文案                              │
│                                             │
│  💰 Beta Inc                     今天 09:08 │
│  Raised Series B ($20M)                     │
│  → 查看 AI 文案                              │
│                                             │
│  👤 Gamma Ltd                    昨天 09:00 │
│  New CISO: John Smith (prev. at AWS)        │
│  → 查看 AI 文案                              │
│                                             │
└─────────────────────────────────────────────┘
```

### 页面 2：信号详情（抽屉或跳转）

```
┌─────────────────────────────────────────────┐
│  Acme Corp — Hiring: Head of DevOps         │
│  2026-10-09  |  来源: Greenhouse            │
├─────────────────────────────────────────────┤
│  原始信息                                    │
│  "Acme Corp is looking for Head of DevOps   │
│  to lead our cloud infrastructure..."       │
│  [查看原文链接 ↗]                             │
├─────────────────────────────────────────────┤
│  AI 触达文案                    [复制全文]   │
│                                             │
│  Hi [Name],                                 │
│                                             │
│  Noticed Acme Corp just posted for a Head   │
│  of DevOps — that usually means you're      │
│  scaling infrastructure fast...             │
│                                             │
└─────────────────────────────────────────────┘
```

### API Routes（只需要这几个）

```
GET  /api/signals          查询信号列表（支持 type / date 筛选）
GET  /api/signals/[id]     单条信号详情
GET  /api/companies        公司列表（含近 7 天信号数统计）
POST /api/n8n/trigger      手动触发某个工作流（调试用）
```

---

## 五、Claude Prompt 设计

### 招聘信号 Prompt

```
你是一个 B2B 销售文案专家。根据以下信息生成一段触达文案。

公司：{company_name}
信号：正在招聘 {job_title}
职位描述摘要：{job_summary}

要求：
- 100-150字
- 开头必须引用这个招聘信号作为联系理由
- 暗示招聘说明该公司正在扩张/有痛点
- 结尾是一个开放式问题，不是强行推销
- 不要提具体产品，留白让收件人好奇

输出格式（纯文本，不加标题）：
[文案内容]
```

### 融资信号 Prompt

```
公司：{company_name}
信号：完成 {round} 融资，金额 {amount}
新闻摘要：{article_summary}

要求：同上，开头祝贺融资，暗示融资后通常面临快速扩张的技术/安全挑战
```

### 高管变动 Prompt

```
公司：{company_name}
信号：{person_name} 刚加入担任 {title}
背景：{person_background}

要求：同上，新高管通常有 90 天内建立战功的压力，这是最好的切入点
```

---

## 六、28 天开发节点

### Week 1（Day 1-7）：招聘信号跑通

- Day 1: Supabase 建表（含 ats_platform/ats_slug 字段）+ 往 companies 表写入 5-10 家测试公司（确认其 ATS 类型）
- Day 2: n8n `hiring-signal.json` 接通 Greenhouse/Lever/Ashby API，能解析出职位
- Day 3: 关键词过滤逻辑 + 统一格式 Code Node
- Day 4: 去重逻辑 + Claude 文案生成 + 写入 signals 表
- Day 5: Next.js 项目初始化 + `/api/signals` 路由
- Day 6: 最简信号列表页（只要能看到数据就行）
- Day 7: 手动触发工作流，验证端到端

### Week 2（Day 8-14）：融资 + 高管信号

- Day 8-9: `funding-signal.json`（TechCrunch + Crunchbase RSS + 公司名匹配）
- Day 10-11: `executive-signal.json`（Apify LinkedIn 抓取 + 职位过滤）
- Day 12: 信号详情页 + AI 文案展示
- Day 13: 筛选功能（按信号类型、日期）
- Day 14: 压测：导入 50 家公司，跑一遍全部工作流

### Week 3（Day 15-21）：生产化

- Day 15: n8n 错误处理（Try/Catch + 失败写日志）
- Day 16: 工作流并发优化（Split In Batches 调参）
- Day 17: Supabase Auth（简单登录，单用户即可）
- Day 18: 部署 n8n 到 Railway
- Day 19: 部署 Next.js 到 Vercel
- Day 20-21: 生产环境联调 + Bug 修复

### Week 4（Day 22-28）：完善 + 接单

- Day 22: 信号统计页（每家公司近 30 天信号数）
- Day 23: CSV 导出
- Day 24: 录演示视频（接单用）
- Day 25-28: 发 Upwork + 找第一个付费客户

---

## 七、关键风险

| 风险                                        | 应对                                    |
| ----------------------------------------- | ------------------------------------- |
| 公司不使用 Greenhouse/Lever/Ashby，ATS 找不到     | 初始名单先筛选这三个 ATS 的公司；其余用 Remotive 兜底    |
| Ashby/Lever slug 与公司名不一致                  | 手动核实 careers URL，建库时记录 slug           |
| TechCrunch/Crunchbase RSS 公司名匹配不准          | 先跑起来，后期用 Claude 做语义匹配替代关键词匹配          |
| Apify LinkedIn 数据延迟（高管变动可能 1-2 周后才更新）     | 周级监控可接受，在 UI 里标注"数据来源有延迟"             |
| 100 家公司 3 个工作流并发跑，n8n 内存压力                | Split Batches 控制并发数，先从 10 开始调          |

---

## 八、第一步行动清单（Day 1）

1. **Supabase 建表**（执行上面的 SQL）
2. **找 5-10 家测试公司**，记录它们的 ATS 信息：
   - 去公司官网 → Careers 页面 → 查 URL 确认 ATS 类型和 slug
   - 推荐先选 Greenhouse 用户，因为其 API 最稳定
3. **往 companies 表插入测试数据**：
   ```sql
   INSERT INTO companies (name, domain, ats_platform, ats_slug) VALUES
   ('Example Corp', 'example.com', 'greenhouse', 'examplecorp'),
   ('Another Co', 'another.io', 'lever', 'another-co');
   ```
4. **验证 ATS API 可用**：直接在浏览器访问
   `https://boards-api.greenhouse.io/v1/boards/examplecorp/jobs`
   如果返回 JSON，说明 slug 正确
5. **初始化 Next.js 项目**（`pnpm create next-app huntd --typescript`）
