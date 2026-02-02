-- Add end_date column to training_programs table
ALTER TABLE training_programs 
ADD COLUMN IF NOT EXISTS end_date date;
