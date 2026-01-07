-- Migration: Add Coach Approval System
-- Description: Adds status and is_admin fields to coaches table for waitlist/approval functionality

-- 1. Add status column to coaches table
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending_approval' 
CHECK (status IN ('pending_approval', 'approved', 'rejected'));

-- 2. Add is_admin column to coaches table
ALTER TABLE public.coaches 
ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- 3. Update existing coaches to be approved (so they don't get locked out)
UPDATE public.coaches SET status = 'approved' WHERE status IS NULL OR status = 'pending_approval';

-- 4. Set your account as admin (will be updated with your ID after first run)
-- You can manually update this in Supabase: UPDATE coaches SET is_admin = true WHERE email = 'your-email@example.com';

-- 5. Update the trigger to create new coaches with pending_approval status
CREATE OR REPLACE FUNCTION public.handle_new_coach()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.coaches (id, name, email, status, is_admin)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Novo Treinador'), 
    NEW.email,
    'pending_approval',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS Policy: Admin can view all coaches for approval management
CREATE POLICY "Admin can view all coaches" 
ON public.coaches FOR SELECT 
USING (
  auth.uid() IN (SELECT id FROM public.coaches WHERE is_admin = true)
  OR auth.uid() = id
);

-- 7. RLS Policy: Admin can update coach status
CREATE POLICY "Admin can update coach status" 
ON public.coaches FOR UPDATE 
USING (
  auth.uid() IN (SELECT id FROM public.coaches WHERE is_admin = true)
);

-- 8. Create index for faster status queries
CREATE INDEX IF NOT EXISTS idx_coaches_status ON public.coaches(status);
CREATE INDEX IF NOT EXISTS idx_coaches_is_admin ON public.coaches(is_admin);
