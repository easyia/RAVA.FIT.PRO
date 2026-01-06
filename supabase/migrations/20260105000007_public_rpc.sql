-- Migration: Public RPC for Coach Profile
-- Created: 2026-01-05

CREATE OR REPLACE FUNCTION get_public_coach_profile(p_coach_id uuid)
RETURNS TABLE (id uuid, name text, avatar_url text, public_bio text, social_instagram text)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT id, name, avatar_url, public_bio, social_instagram 
  FROM public.coaches 
  WHERE id = p_coach_id;
$$;
