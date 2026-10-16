-- Huntd Phase 1: Core Signal Pipeline Schema
-- Created: 2026-10-12
-- Purpose: Setup global_companies and signals tables for multi-signal monitoring

-- =============================================================================
-- 1. Global Companies Table
-- =============================================================================
-- This table stores all companies being monitored by n8n workflows
-- It is user-agnostic: n8n monitors all active companies and writes signals
-- User filtering happens via RLS and user_companies join table (Phase 3)

CREATE TABLE IF NOT EXISTS global_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text,
  linkedin_url text,
  ats_platform text,  -- 'greenhouse' | 'ashby' | null
  ats_slug text,      -- ATS-specific company identifier for API calls
  tags text[],        -- Optional tags for categorization (e.g., ['fintech', 'security'])
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Index for n8n workflow queries
CREATE INDEX IF NOT EXISTS idx_global_companies_active
  ON global_companies (is_active)
  WHERE is_active = true;

-- =============================================================================
-- 2. Signals Table
-- =============================================================================
-- Unified storage for all 3 signal types: hiring, funding, executive
-- Each signal includes raw data + AI-generated outreach text

CREATE TABLE IF NOT EXISTS signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,  -- References global_companies, but not FK to allow flexibility
  company_name text NOT NULL,  -- Denormalized for easy display
  signal_type text NOT NULL,  -- 'hiring' | 'funding' | 'executive'
  signal_title text NOT NULL,  -- Display title (e.g., "Hiring: Head of DevOps at Tailscale")
  signal_url text,  -- Source URL (job posting, news article, LinkedIn profile)
  signal_date date NOT NULL DEFAULT current_date,  -- When the signal was detected
  raw_summary text,  -- Original content/description from source
  ai_outreach text,  -- Claude-generated outreach message (100-150 words)
  created_at timestamptz DEFAULT now()
);

-- Unique constraint: prevent duplicate signals
-- Same company + same type + same title + same day = duplicate
CREATE UNIQUE INDEX IF NOT EXISTS signals_dedup
  ON signals (company_id, signal_type, signal_title, signal_date);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_signals_company_id ON signals (company_id);
CREATE INDEX IF NOT EXISTS idx_signals_type ON signals (signal_type);
CREATE INDEX IF NOT EXISTS idx_signals_date ON signals (signal_date DESC);
CREATE INDEX IF NOT EXISTS idx_signals_created ON signals (created_at DESC);

-- =============================================================================
-- 3. Populate Initial Companies
-- =============================================================================
-- 9 validated companies from target-companies-ats-guide.md
-- All have working ATS APIs verified as of 2026-10-10

INSERT INTO global_companies (name, domain, ats_platform, ats_slug, is_active, tags) VALUES
('Vanta', 'vanta.com', 'ashby', 'vanta', true, ARRAY['security', 'compliance', 'saas']),
('Tailscale', 'tailscale.com', 'greenhouse', 'tailscale', true, ARRAY['security', 'networking', 'infrastructure']),
('Datadog', 'datadoghq.com', 'greenhouse', 'datadog', true, ARRAY['monitoring', 'observability', 'infrastructure']),
('Stripe', 'stripe.com', 'greenhouse', 'stripe', true, ARRAY['fintech', 'payments', 'infrastructure']),
('Figma', 'figma.com', 'greenhouse', 'figma', true, ARRAY['design', 'collaboration', 'saas']),
('GitLab', 'gitlab.com', 'greenhouse', 'gitlab', true, ARRAY['devops', 'git', 'cicd']),
('Brex', 'brex.com', 'greenhouse', 'brex', true, ARRAY['fintech', 'payments', 'saas']),
('Anthropic', 'anthropic.com', 'greenhouse', 'anthropic', true, ARRAY['ai', 'security', 'research']),
('Linear', 'linear.app', 'ashby', 'linear', true, ARRAY['project-management', 'saas'])
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. Notes on Existing Tables
-- =============================================================================
-- The existing 'jobs' table remains intact for backward compatibility
-- New workflows will write to 'signals' table
-- The 'jobs' table can serve as a detailed cache for hiring data if needed
