-- Huntd Phase 2: 双表审核流程 (Draft → Final)
-- Created: 2026-10-17
-- Purpose: 草稿表(可编辑) + 最终表(不可编辑) 分离

-- 1. Drop 旧的 executive_candidates (status-based)
DROP TABLE IF EXISTS executive_candidates CASCADE;

-- 2. Create executive_candidates_draft (草稿表, 无 status)
CREATE TABLE executive_candidates_draft (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES global_companies NOT NULL,
  company_name  text NOT NULL,
  person_name   text NOT NULL,
  title         text NOT NULL,
  action        text DEFAULT 'appointed',  -- joined/left/appointed
  source_title  text,                      -- 新闻标题来源
  pub_date      text,
  created_at    timestamptz DEFAULT now()
);

-- Prevent duplicate drafts for same person+company+title
CREATE UNIQUE INDEX idx_draft_unique
  ON executive_candidates_draft (company_id, person_name, title);

CREATE INDEX idx_draft_company
  ON executive_candidates_draft (company_id);

-- 3. Create executive_profiles (最终表, enriched data)
CREATE TABLE IF NOT EXISTS executive_profiles (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      uuid REFERENCES global_companies NOT NULL,
  company_name    text NOT NULL,
  person_name     text NOT NULL,
  title           text NOT NULL,
  action          text DEFAULT 'appointed',
  source_title    text,
  pub_date        text,
  linkedin_url    text,
  linkedin_snippet text,
  created_at      timestamptz DEFAULT now()
);

-- Prevent duplicate profiles for same person+company+title
CREATE UNIQUE INDEX idx_profile_unique
  ON executive_profiles (company_id, person_name, title);

CREATE INDEX idx_profile_company
  ON executive_profiles (company_id);
