# Huntd 部署指南

## 一、前置准备

### 1.1 Supabase 初始化

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目（选择离你最近的区域）
3. 进入 SQL Editor，执行 `supabase-schema.sql` 里的所有 SQL

```bash
# 在 huntd-app 目录
cat supabase-schema.sql
# 复制所有内容，在 Supabase SQL Editor 里运行
```

4. 获取项目密钥：
   - 进入 Settings → API
   - 复制 **Project URL** 和 **anon public** key
   - 填入 `.env.local`

### 1.2 配置环境变量

```bash
cd huntd-app
cp .env.local .env.local.example  # 备份模板
vim .env.local
```

填入真实密钥：
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

---

## 二、本地开发

```bash
cd huntd-app
npm install
npm run dev
```

打开 http://localhost:3000

**此时页面是空的，因为 Supabase `jobs` 表里还没数据。需要先运行 n8n 工作流抓取职位。**

---

## 三、n8n 工作流部署（Railway）

### 3.1 在 Railway 部署 n8n

1. 登录 [Railway](https://railway.app/)
2. New Project → Deploy n8n (模板市场有现成的)
3. 部署完成后，记下 n8n 的公网 URL（如 `https://xxx.railway.app`）

### 3.2 导入工作流

1. 打开 n8n 界面（`https://xxx.railway.app`）
2. 点击右上角 **Import from File**
3. 上传 `n8n/huntd-workflow.json`

### 3.3 配置 Supabase Credentials

工作流里的 **"写入 Supabase"** 节点需要连接数据库：

1. 点击节点 → Credentials → **Create New**
2. 填写：
   - **Host**: 从 Supabase Settings → Database → Connection String 里找到
     - 格式：`db.xxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: 创建 Supabase 项目时设置的密码
   - **SSL**: 勾选 `Use SSL`

### 3.4 修改配置文件 URL

工作流第二个节点 **"加载公司配置"** 默认从 GitHub raw URL 读取 `config/companies.json`。

有两个选项：

**选项 A：托管在 GitHub**
1. 把 `config/companies.json` 提交到 GitHub 仓库
2. 获取 raw URL（如 `https://raw.githubusercontent.com/your-name/huntd-app/main/config/companies.json`）
3. 在 n8n 工作流里替换这个 URL

**选项 B：本地托管**
- 把配置文件传到 Vercel 的 public 目录，通过 `https://your-app.vercel.app/companies.json` 访问

### 3.5 启动工作流

点击工作流右上角 **Active** 开关 → 打开

工作流会：
- 每小时自动运行一次
- 从 Greenhouse + Ashby 抓取所有职位
- 关键词匹配
- 写入 Supabase（自动去重）

---

## 四、前端部署（Vercel）

```bash
cd huntd-app
npm run build  # 本地测试构建

# 部署到 Vercel
vercel  # 登录并部署
```

在 Vercel Dashboard 添加环境变量：
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 五、验证流程

### 5.1 手动触发 n8n 工作流
1. 在 n8n 界面点击工作流
2. 点击 **Execute Workflow** 按钮
3. 观察每个节点的执行结果

### 5.2 检查 Supabase 数据
```sql
SELECT company_name, COUNT(*) as count
FROM jobs
GROUP BY company_name
ORDER BY count DESC;
```

应该看到 9 家公司，总共约 2600+ 职位。

### 5.3 打开前端
- 本地：http://localhost:3000
- 线上：https://your-app.vercel.app

侧边栏应该显示所有公司 + 职位数量。

---

## 六、添加新公司

1. 编辑 `config/companies.json`，添加新公司条目：
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

2. 在 Supabase 执行：
```sql
INSERT INTO companies (id, name, domain, ats_platform, ats_slug, tags)
VALUES ('newco', 'NewCo', 'newco.com', 'greenhouse', 'newco', ARRAY['industry']);
```

3. 等待下一次 n8n 自动运行，或手动触发工作流

---

## 七、常见问题

### Q: n8n 工作流报错 "UPSERT failed"
A: 检查 Supabase Credentials 是否正确，特别是 SSL 选项

### Q: 前端显示 "暂无职位数据"
A: 1) 先运行一次 n8n 工作流；2) 检查 `.env.local` 密钥是否正确

### Q: 如何修改关键词列表？
A: 编辑 `config/companies.json` 里的 `keywords` 数组，或直接修改 n8n 工作流的 Code 节点

### Q: 工作流跑一次需要多久？
A: 9 家公司约 1-2 分钟（每个 API 请求耗时 0.5-2秒）

---

## 八、后续扩展

当前架构已支持：
- ✅ 侧边栏导航（后续可添加 融资信号、高管任命 等模块）
- ✅ 多 ATS 支持（添加新 ATS 只需在 Switch 节点加分支）
- ✅ 关键词筛选
- ✅ 时间范围筛选
- ✅ 自动去重

后续功能：
- [ ] 每日邮件推送（从 `daily_queue` 表读取）
- [ ] AI 生成触达文案（调用 OpenAI API）
- [ ] 融资信号监控（Crunchbase API）
- [ ] 高管任命监控（LinkedIn API）
