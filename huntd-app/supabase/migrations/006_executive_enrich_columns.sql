-- Huntd Phase 2.1: Executive Profile Enrichment Columns
-- Created: 2026-10-17
-- Updated: 2026-10-19 — 2 searches: social profiles + activities, no AI
-- Purpose: Add enrichment fields for workflow (03b)

ALTER TABLE executive_profiles
  ADD COLUMN IF NOT EXISTS linkedin_snippet  text,
  ADD COLUMN IF NOT EXISTS twitter_url       text,
  ADD COLUMN IF NOT EXISTS github_url        text,
  ADD COLUMN IF NOT EXISTS blog_url          text,
  ADD COLUMN IF NOT EXISTS enrichment_data   jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS enriched_at       timestamptz;

-- Index for workflow: quickly find un-enriched profiles
CREATE INDEX IF NOT EXISTS idx_profiles_not_enriched
  ON executive_profiles (detected_at DESC)
  WHERE enriched_at IS NULL;
