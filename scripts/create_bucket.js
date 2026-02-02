import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Helper to parse .env manually
const env = fs.readFileSync('.env', 'utf8')
    .split('\n')
    .reduce((acc, line) => {
        const [key, ...val] = line.split('=');
        if (key && val) acc[key.trim()] = val.join('=').trim();
        return acc;
    }, {});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Faltando URL ou SERVICE_ROLE_KEY no .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBucket() {
    console.log(`Tentando criar o bucket 'meals' em ${supabaseUrl}...`);

    const { data, error } = await supabase.storage.createBucket('meals', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
        fileSizeLimit: 5242880
    });

    if (error) {
        if (error.message.includes('already exists')) {
            console.log("O bucket 'meals' já existe.");
        } else {
            console.error("Erro ao criar bucket:", error.message);
        }
    } else {
        console.log("Bucket 'meals' criado com sucesso:", data);
    }
}

createBucket();
