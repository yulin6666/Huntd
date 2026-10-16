# 目标公司 ATS 清单 & API 验证指南

> 创建：2026-10-10
> 用途：Huntd 招聘信号监控 — 测试阶段初始公司列表

---

## 一、目标公司清单（10 家）

选取标准：知名创业公司 + 业务涉及安全/合规/基础设施，大概率在招 DevOps/Security/Compliance 岗位。

| # | 公司 | 业务 | ATS | slug | 当前职位数 | 验证 URL |
|---|------|------|-----|------|----------|---------|
| 1 | **Vanta** | 合规自动化（SOC2/HIPAA） | Ashby | `vanta` | 83 | https://api.ashbyhq.com/posting-api/job-board/vanta |
| 2 | **Tailscale** | 零信任网络 | Greenhouse | `tailscale` | 61 | https://boards-api.greenhouse.io/v1/boards/tailscale/jobs |
| 3 | **Datadog** | 监控/可观测性 | Greenhouse | `datadog` | 435 | https://boards-api.greenhouse.io/v1/boards/datadog/jobs |
| 4 | **Stripe** | 支付基础设施 | Greenhouse | `stripe` | 729 | https://boards-api.greenhouse.io/v1/boards/stripe/jobs |
| 5 | **Figma** | 设计协作工具 | Greenhouse | `figma` | 150 | https://boards-api.greenhouse.io/v1/boards/figma/jobs |
| 6 | **GitLab** | DevOps 平台 | Greenhouse | `gitlab` | 221 | https://boards-api.greenhouse.io/v1/boards/gitlab/jobs |
| 7 | **Brex** | 金融科技（企业支付） | Greenhouse | `brex` | 277 | https://boards-api.greenhouse.io/v1/boards/brex/jobs |
| 8 | **Anthropic** | AI 安全研究 | Greenhouse | `anthropic` | 645 | https://boards-api.greenhouse.io/v1/boards/anthropic/jobs |
| 9 | **Linear** | 项目管理工具 | Ashby | `linear` | 31 | https://api.ashbyhq.com/posting-api/job-board/linear |

> ✅ **验证时间：2026-10-10** — 所有 API 已验证可用
> ⚠️ **Lever API 失效**：所有 Lever 公司（Snyk/Lacework/Teleport 等）返回 404，暂时移除

> ⚠️ **注意**：slug 需要通过下方步骤验证，公司可能更换过 ATS 或 slug 与公司名略有不同。

---

## 二、API 验证方法

### 方法 A：浏览器直接访问（最快，30 秒验证一家）

直接把 URL 粘贴进浏览器地址栏：

**Greenhouse：**
```
https://boards-api.greenhouse.io/v1/boards/{slug}/jobs
```

成功响应（200）：
```json
{
  "jobs": [
    {
      "id": 12345,
      "title": "Senior DevOps Engineer",
      "absolute_url": "https://boards.greenhouse.io/vanta/jobs/12345",
      "updated_at": "2026-10-08T14:00:00Z",
      ...
    }
  ],
  "meta": { "total": 47 }
}
```

失败响应（404）：
```json
{ "status": 404, "error": "Resource not found" }
```
→ slug 不对，需要去官网 careers 页面重新找

---

**Lever：**
```
https://api.lever.co/v0/postings/{slug}?mode=json
```

成功响应（200）：
```json
[
  {
    "id": "abc-123",
    "text": "Infrastructure Engineer",
    "hostedUrl": "https://jobs.lever.co/vercel/abc-123",
    "createdAt": 1728345600000,
    ...
  }
]
```

失败响应：返回空数组 `[]` 或 404

---

**Ashby：**
```
https://api.ashbyhq.com/posting-api/job-board/{slug}
```

成功响应（200）：
```json
{
  "jobs": [
    {
      "id": "xyz",
      "title": "DevOps Engineer",
      "jobUrl": "https://jobs.ashbyhq.com/linear/xyz",
      "publishedDate": "2026-10-01",
      ...
    }
  ]
}
```

---

### 方法 B：curl 命令（命令行验证，适合批量）

```bash
# Greenhouse — 检查是否有职位 + 统计数量
curl -s "https://boards-api.greenhouse.io/v1/boards/vanta/jobs" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ {len(d[\"jobs\"])} jobs found')"

# Lever
curl -s "https://api.lever.co/v0/postings/vercel?mode=json" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ {len(d)} jobs found')"

# Ashby
curl -s "https://api.ashbyhq.com/posting-api/job-board/linear" | \
  python3 -c "import sys,json; d=json.load(sys.stdin); print(f'✅ {len(d[\"jobs\"])} jobs found')"
```

---

### 方法 C：如果 slug 不对，怎么找正确的 slug

1. 去公司官网，找 `Careers` 或 `Jobs` 页面
2. 通常会跳转到 ATS 页面，URL 规律如下：

| ATS | careers URL 格式 | slug 提取方式 |
|-----|----------------|-------------|
| Greenhouse | `boards.greenhouse.io/{slug}` | URL 最后一段 |
| Greenhouse（自定义域名）| `careers.company.com` | 页面源码搜索 `greenhouse.io/boards/` |
| Lever | `jobs.lever.co/{slug}` | URL 最后一段 |
| Ashby | `jobs.ashbyhq.com/{slug}` | URL 最后一段 |

**自定义域名的情况（常见）：**

公司可能用 `careers.vanta.com` 而不直接暴露 Greenhouse URL。
在页面上右键 → 查看源代码，搜索 `greenhouse.io` 找到真实 slug：

```html
<!-- 源码里会有类似这样的内容 -->
<script src="https://boards.greenhouse.io/embed/job_board/js?for=vanta"></script>
```
这里的 `for=vanta` 就是 slug。

---

## 三、验证结果记录表

运行完验证后，在这里记录实际结果：

| 公司 | 验证时间 | 结果 | ATS | slug | 当前职位数 | 备注 |
|------|---------|------|-----|------|----------|------|
| Vanta | 2026-10-10 | ✅ | Ashby | vanta | 83 | 合规自动化龙头 |
| Tailscale | 2026-10-10 | ✅ | Greenhouse | tailscale | 61 | 零信任网络 |
| Datadog | 2026-10-10 | ✅ | Greenhouse | datadog | 435 | 监控/可观测性 |
| Stripe | 2026-10-10 | ✅ | Greenhouse | stripe | 729 | 支付基础设施 |
| Figma | 2026-10-10 | ✅ | Greenhouse | figma | 150 | 设计协作 |
| GitLab | 2026-10-10 | ✅ | Greenhouse | gitlab | 221 | DevOps 平台 |
| Brex | 2026-10-10 | ✅ | Greenhouse | brex | 277 | 金融科技 |
| Anthropic | 2026-10-10 | ✅ | Greenhouse | anthropic | 645 | AI 安全 |
| Linear | 2026-10-10 | ✅ | Ashby | linear | 31 | 项目管理 |

**合计：9 家公司，2,632 个职位**

---

## 四、SQL：导入验证通过的公司

```sql
INSERT INTO companies (name, domain, ats_platform, ats_slug, is_active) VALUES
('Vanta', 'vanta.com', 'ashby', 'vanta', true),
('Tailscale', 'tailscale.com', 'greenhouse', 'tailscale', true),
('Datadog', 'datadoghq.com', 'greenhouse', 'datadog', true),
('Stripe', 'stripe.com', 'greenhouse', 'stripe', true),
('Figma', 'figma.com', 'greenhouse', 'figma', true),
('GitLab', 'gitlab.com', 'greenhouse', 'gitlab', true),
('Brex', 'brex.com', 'greenhouse', 'brex', true),
('Anthropic', 'anthropic.com', 'greenhouse', 'anthropic', true),
('Linear', 'linear.app', 'ashby', 'linear', true);
```

**分布统计：**
- Greenhouse: 7 家（Tailscale, Datadog, Stripe, Figma, GitLab, Brex, Anthropic）
- Ashby: 2 家（Vanta, Linear）
- ~~Lever: 0 家（API 全部失效，2026-10-10 确认）~~

**总职位数：2,632** — 足够测试关键词过滤和 AI 文案生成。

---

## 五、关键词过滤参考（招聘信号判断）

这些公司的职位，匹配以下关键词才算有效信号：

```
devops, devsecops, sre, site reliability,
security engineer, cloud security, appsec, application security,
soc2, soc 2, hipaa, compliance, gdpr,
infrastructure, platform engineer, ciso, chief security,
head of security, vp of engineering, director of infrastructure,
vault, terraform, kubernetes security, zero trust
```

职位标题只要命中一个即为有效信号。
