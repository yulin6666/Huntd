-- Huntd 数据库建表 SQL
-- 在 Supabase Dashboard → SQL Editor 中运行

-- 公司表（从 config/companies.json 导入）
CREATE TABLE IF NOT EXISTS companies (
  id TEXT PRIMARY KEY,              -- 即 config 里的 id（如 "figma"）
  name TEXT NOT NULL,
  domain TEXT,
  ats_platform TEXT NOT NULL,       -- "greenhouse" | "ashby"
  ats_slug TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 职位表
CREATE TABLE IF NOT EXISTS jobs (
  id TEXT PRIMARY KEY,              -- {company_id}_{ats_job_id}，唯一标识，用于去重
  company_id TEXT NOT NULL REFERENCES companies(id),
  company_name TEXT NOT NULL,
  title TEXT NOT NULL,
  location TEXT,
  url TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  description_snippet TEXT,         -- 职位描述前500字符，用于 AI 文案
  is_matched BOOLEAN DEFAULT false, -- 是否命中关键词
  matched_keywords TEXT[] DEFAULT '{}',
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),  -- 首次抓到的时间
  updated_at TIMESTAMPTZ DEFAULT NOW(),     -- ATS 里的 updated_at
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 每日输出队列（受控触达，不重复发送）
CREATE TABLE IF NOT EXISTS daily_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL REFERENCES jobs(id),
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,              -- NULL = 未发送
  status TEXT DEFAULT 'pending'     -- "pending" | "sent" | "skipped"
);

-- 索引
CREATE INDEX IF NOT EXISTS jobs_company_id_idx ON jobs(company_id);
CREATE INDEX IF NOT EXISTS jobs_is_matched_idx ON jobs(is_matched);
CREATE INDEX IF NOT EXISTS jobs_first_seen_at_idx ON jobs(first_seen_at DESC);
CREATE INDEX IF NOT EXISTS jobs_updated_at_idx ON jobs(updated_at DESC);

-- 导入初始公司数据
INSERT INTO companies (id, name, domain, ats_platform, ats_slug, tags) VALUES
('vanta',     'Vanta',     'vanta.com',      'ashby',      'vanta',     ARRAY['compliance','security']),
('tailscale', 'Tailscale', 'tailscale.com',  'greenhouse', 'tailscale', ARRAY['networking','security']),
('datadog',   'Datadog',   'datadoghq.com',  'greenhouse', 'datadog',   ARRAY['monitoring','infrastructure']),
('stripe',    'Stripe',    'stripe.com',     'greenhouse', 'stripe',    ARRAY['fintech','infrastructure']),
('figma',     'Figma',     'figma.com',      'greenhouse', 'figma',     ARRAY['design','collaboration']),
('gitlab',    'GitLab',    'gitlab.com',     'greenhouse', 'gitlab',    ARRAY['devops','platform']),
('brex',      'Brex',      'brex.com',       'greenhouse', 'brex',      ARRAY['fintech','payments']),
('anthropic', 'Anthropic', 'anthropic.com',  'greenhouse', 'anthropic', ARRAY['ai','safety']),
('linear',    'Linear',    'linear.app',     'ashby',      'linear',    ARRAY['productivity','tools'])
ON CONFLICT (id) DO NOTHING;
