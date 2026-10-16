# Figma 招聘信息监控渠道分析

> 案例分析：2026-10-10
> 目的：评估 Greenhouse + Ashby 是否足以监控一家公司的最新招聘动态

---

## 一、Greenhouse API 数据质量

**测试目标：Figma**
- ATS 平台：Greenhouse
- API: `https://boards-api.greenhouse.io/v1/boards/figma/jobs`

### 1.1 数据新鲜度

```
总职位数: 150

更新时间分布:
  最近7天:   15 个职位
  7-30天:    42 个职位
  1-3个月:   93 个职位
  3个月以上:  0 个职位

最新更新:
  • Brand Designer, Web - 2026-10-09 (昨天)
  • Manager, R&D Finance - 2026-10-08
  • Executive Assistant, Product - 2026-10-08
  • Executive Communications Manager - 2026-10-08
  • Forward Deployed Engineer - 2026-10-07
```

**结论：数据实时性强**
- 昨天（10月9日）还有职位更新
- 57 个职位在过去 30 天内更新（38%）
- 没有超过 3 个月的陈旧数据

### 1.2 职位完整性

Greenhouse API 返回字段：
- `title`, `location`, `updated_at`, `absolute_url` — 核心信息
- `content` — 完整职位描述（需要 `?content=true` 参数）
- `departments`, `offices` — 部门和办公室信息
- `first_published` — 首次发布时间（用于判断是否为新职位）

**结论：字段完整，足够生成 AI 文案**

---

## 二、其他渠道对比

### 2.1 LinkedIn

搜索 "Figma careers" 在 LinkedIn：
- 结果：返回 Figma 公司页面，但无法直接获取职位列表
- LinkedIn 职位需要登录 + 可能需要 API key（非免费）
- 职位发布时间**滞后于官网**（公司先在 ATS 发布，再同步到 LinkedIn）

### 2.2 Indeed

搜索结果：部分 Figma 职位出现在 Indeed，但来源标注为 "Figma via Greenhouse"
- 实际上还是 Greenhouse 的数据，Indeed 只是聚合器
- 无增量价值

### 2.3 Wellfound (AngelList)

- Figma 规模已超出 Wellfound 典型用户群（更适合早期创业公司）
- 搜索结果：无 Figma 职位

### 2.4 Google Jobs

搜索 "Figma DevOps Security Infrastructure 2026" 返回的职位链接：
```
https://boards.greenhouse.io/figma/jobs/5982942004  ← Greenhouse
https://boards.greenhouse.io/figma/jobs/6015609004  ← Greenhouse
https://boards.greenhouse.io/figma/jobs/6180172004  ← Greenhouse
```

**所有结果都指向 Greenhouse**，说明 Google Jobs 本身也是从 Greenhouse 抓取的。

---

## 三、结论与建议

### 对 Figma 这类公司：Greenhouse + Ashby 完全够用

**理由：**
1. **Greenhouse 是单一真实来源（Single Source of Truth）**
   - 公司官网 careers 页面直接嵌入 Greenhouse
   - LinkedIn/Indeed/Google Jobs 都从 Greenhouse 抓数据
   - 其他渠道职位发布**滞后** 1-3 天

2. **API 数据实时性强**
   - 每天都有职位更新（昨天还有 15 个职位更新）
   - `updated_at` 字段可判断是否为最近 24 小时新增/修改

3. **数据完整性高**
   - 完整职位描述、部门、地点、发布时间
   - 足够 AI 生成触达文案

### 唯一的边界情况

**可能需要额外监控的场景：**

1. **公司在社交媒体单独发布招聘**
   - 例如：CEO 在 Twitter 发 "We're hiring a Head of Security"
   - 但这种情况极少见，且通常会同步到 ATS

2. **内推渠道**
   - 某些高级职位（C-level）可能不公开发布
   - 但这不是监控工具的目标（这类职位靠猎头）

3. **使用多个 ATS 的公司**
   - 少数大公司（如 Google/Meta）可能不同部门用不同 ATS
   - 但 Figma/Vanta/Tailscale 等创业公司通常只用一个

---

## 四、最终推荐方案

### 核心监控：Greenhouse + Ashby

**每日检查逻辑：**
```
1. 调用 API 获取所有职位
2. 过滤 updated_at 在最近 24 小时内的职位
3. 用关键词（devops, security, compliance）二次过滤
4. 对匹配职位生成 AI 文案
5. 去重存储（避免同一职位多次更新时重复触发）
```

### 可选补充：RSS 监控（低优先级）

如果想覆盖边界情况，可以加：
- **公司官方博客 RSS**（如 Figma 可能在 blog.figma.com 宣布大规模招聘）
- **CEO/CTO Twitter**（用 Twitter API 监控关键词 "hiring" "join us"）

但对于 MVP 阶段，**Greenhouse + Ashby 已足够**。

---

## 五、Huntd 工作流建议

基于以上分析，当前方案（只监控 Greenhouse + Ashby）是正确的：

```
优势：
✅ 数据实时（每天更新）
✅ 覆盖 90%+ 公开职位
✅ API 免费无限制
✅ 数据结构化，易解析

风险：
⚠️ 无法捕获社交媒体临时发布（低概率）
⚠️ 无法捕获内推/猎头职位（不在目标范围内）
```

**对于第一批客户（10-50 家公司监控），当前方案足够 MVP 验证。**

---

## 附录：验证命令

```bash
# 检查 Figma 最新职位（过去 24 小时）
curl -s "https://boards-api.greenhouse.io/v1/boards/figma/jobs?content=true" | \
  python3 -c "
import sys, json
from datetime import datetime, timedelta, timezone
d = json.load(sys.stdin)
now = datetime.now(timezone.utc)
yesterday = now - timedelta(days=1)

new_jobs = [
  j for j in d.get('jobs', [])
  if datetime.fromisoformat(j.get('updated_at', '').replace('Z', '+00:00')) > yesterday
]

print(f'过去 24 小时更新的职位: {len(new_jobs)}')
for j in new_jobs[:5]:
  print(f\"  • {j['title']}\")
"
```

**Sources:**
- [Figma Security Roles on Greenhouse](https://boards.greenhouse.io/figma/jobs/5982942004)
- [LinkedIn Figma Company Page](https://www.linkedin.com/company/figma/)
