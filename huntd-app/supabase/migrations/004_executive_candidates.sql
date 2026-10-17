-- Huntd Phase 2: Executive Candidates (Review Queue)
-- Created: 2026-10-17
-- Purpose: Staging table for AI-extracted executive movements awaiting human review

CREATE TABLE IF NOT EXISTS executive_candidates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id    uuid REFERENCES global_companies NOT NULL,
  company_name  text NOT NULL,
  person_name   text NOT NULL,
  title         text NOT NULL,
  action        text DEFAULT 'appointed',  -- joined/left/appointed
  source_title  text,                      -- 新闻标题来源
  pub_date      text,
  status        text DEFAULT 'pending',    -- pending/approved/rejected/enriched
  created_at    timestamptz DEFAULT now()
);

-- Prevent duplicate candidates for the same person+company+title
CREATE UNIQUE INDEX IF NOT EXISTS idx_exec_candidates_unique
  ON executive_candidates (company_id, person_name, title)
  WHERE status != 'rejected';

-- Fast lookup for pending/approved candidates
CREATE INDEX IF NOT EXISTS idx_exec_candidates_status
  ON executive_candidates (status);
