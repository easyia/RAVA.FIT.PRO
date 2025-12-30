-- Migration to add missing columns to the students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_phone text;
