-- Migration: Legal Compliance & Contracts
-- Created: 2026-01-05
-- Purpose: Support LGPD consent tracking and digital contract signatures.

-- 1. Add Legal Consent fields to Students table
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS legal_consent_at timestamptz, -- Date when LGPD/Health data usage was accepted
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz, -- Date when ToS was accepted
ADD COLUMN IF NOT EXISTS legal_metadata jsonb; -- Store IP, User Agent, etc for audit

-- 2. Add Contract Signature to Subscriptions
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS contract_accepted_at timestamptz, -- Date when the specific plan contract was signed
ADD COLUMN IF NOT EXISTS contract_snapshot text; -- Store the version of the contract text agreed upon

-- 3. Add public profile fields for Coach (for the Public Link)
ALTER TABLE public.coaches
ADD COLUMN IF NOT EXISTS public_bio text,
ADD COLUMN IF NOT EXISTS social_instagram text,
ADD COLUMN IF NOT EXISTS slug text UNIQUE; -- Friendly URL identifier (optional, using ID first)

-- Index for performance on public lookups
CREATE INDEX IF NOT EXISTS idx_coaches_slug ON public.coaches(slug);
