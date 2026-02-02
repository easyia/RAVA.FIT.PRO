
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
    console.log('Applying migration: Add modified_foods to meal_logs...');
    const { data, error } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE public.meal_logs ADD COLUMN IF NOT EXISTS modified_foods JSONB;'
    });

    if (error) {
        if (error.message.includes('function exec_sql() does not exist')) {
            console.error('Error: exec_sql function not found. Please run the SQL in migrations folder manually in Supabase SQL Editor.');
        } else {
            console.error('Error applying migration:', error);
        }
    } else {
        console.log('Migration applied successfully!');
    }
}

applyMigration();
