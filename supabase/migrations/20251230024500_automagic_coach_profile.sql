-- Migration to automatically create coach profile on signup
-- This solves the Foreign Key constraint violation when creating students

-- 1. Create the function
CREATE OR REPLACE FUNCTION public.handle_new_coach()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.coaches (id, name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'display_name', 'Novo Treinador'), 
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_coach();

-- 3. Backfill existing users who don't have a coach profile yet
INSERT INTO public.coaches (id, name, email)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'display_name', 'Novo Treinador'), email
FROM auth.users
ON CONFLICT (id) DO NOTHING;
