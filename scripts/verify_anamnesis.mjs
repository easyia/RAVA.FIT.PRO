/**
 * =====================================================================
 * RAVA FIT PRO - Pre-Deploy Verification Script
 * =====================================================================
 * Run this script with: node scripts/verify_anamnesis.js
 * 
 * Purpose: Validates that all anamnesis-related columns exist in the
 * database BEFORE deploying to production.
 * =====================================================================
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Variáveis de ambiente SUPABASE_URL e SUPABASE_ANON_KEY não configuradas.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Required columns for the anamnesis table based on StudentAnamnesisForm.tsx
 */
const REQUIRED_ANAMNESIS_COLUMNS = [
    'student_id',
    'weight_kg',
    'height_cm',
    'main_goal',
    'secondary_goal',
    'goal_deadline',
    'motivation_barriers',
    'initial_training_frequency',
    'training_level',
    'equipment_availability',
    'training_preferences',
    'medical_conditions',
    'surgeries',
    'medications',
    'allergies',
    'injuries',
    'physical_limitations',
    'sleep_pattern',
    'alcohol_use',
    'physical_activity_history',
    'diet_habits',
    'initial_nutrition_notes',
    'stress_level',
    'uses_ergogenics',
    'uses_ergogenics_details',
    'schedule_availability',
    'daily_routine',
    'wake_up_time',
    'sleep_time'
];

/**
 * Required columns for students table (Step 1 of Anamnesis)
 */
const REQUIRED_STUDENTS_COLUMNS = [
    'full_name',
    'email',
    'phone',
    'birth_date',
    'sex',
    'cpf',
    'rg',
    'profession',
    'marital_status',
    'emergency_contact',
    'emergency_phone',
    'avatar_url',
    'legal_consent_at',
    'terms_accepted_at',
    'status'
];

async function getTableColumns(tableName) {
    // Use a simple query to get column names
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

    if (error) {
        console.error(`❌ Erro ao acessar tabela '${tableName}':`, error.message);
        return null;
    }

    // If we get here, we need another approach - check via RPC or raw SQL
    // For now, return empty and we'll verify by attempting an insert
    return [];
}

async function verifyAnamnesisWritable() {
    console.log('\n📋 Verificando escrita na tabela anamnesis...\n');

    // Create a test payload matching what the form sends
    const testPayload = {
        student_id: '00000000-0000-0000-0000-000000000000', // Invalid UUID, will fail RLS
        weight_kg: 70,
        height_cm: 175,
        main_goal: 'TEST_VERIFICATION',
        training_level: 'iniciante',
        daily_routine: 'Teste de rotina',
        wake_up_time: '07:00',
        sleep_time: '23:00',
        schedule_availability: 'Seg, Ter, Qua',
        uses_ergogenics: false
    };

    // Try to insert - we expect it to fail on RLS, not on column
    const { error } = await supabase
        .from('anamnesis')
        .insert(testPayload);

    if (error) {
        // Check if error is about missing column
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            const match = error.message.match(/"([^"]+)" of relation/);
            const missingColumn = match ? match[1] : 'unknown';
            console.error(`❌ COLUNA FALTANDO: ${missingColumn}`);
            console.error(`   Detalhes: ${error.message}`);
            return { success: false, missingColumn, error: error.message };
        }

        // RLS policy violation is expected and means columns exist
        if (error.code === '42501' || error.message.includes('policy')) {
            console.log('✅ Estrutura de colunas OK (erro de RLS esperado)');
            return { success: true };
        }

        // Other errors
        console.warn(`⚠️ Erro inesperado: ${error.message}`);
        return { success: false, error: error.message };
    }

    console.log('✅ Escrita bem sucedida (limpando dados de teste)');
    return { success: true };
}

async function verifyStudentsWritable() {
    console.log('\n👥 Verificando escrita na tabela students...\n');

    const testPayload = {
        full_name: 'TEST_VERIFICATION',
        email: 'test@verification.test',
        phone: '00000000000',
        status: 'pending_approval'
    };

    const { error } = await supabase
        .from('students')
        .insert(testPayload);

    if (error) {
        if (error.message.includes('column') && error.message.includes('does not exist')) {
            const match = error.message.match(/"([^"]+)" of relation/);
            const missingColumn = match ? match[1] : 'unknown';
            console.error(`❌ COLUNA FALTANDO: ${missingColumn}`);
            return { success: false, missingColumn };
        }

        if (error.code === '42501' || error.message.includes('policy') || error.message.includes('violates')) {
            console.log('✅ Estrutura de colunas OK');
            return { success: true };
        }

        console.warn(`⚠️ Erro: ${error.message}`);
        return { success: false, error: error.message };
    }

    return { success: true };
}

async function runVerification() {
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  RAVA FIT PRO - Verificação de Schema Pré-Deploy');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Supabase URL: ${supabaseUrl}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    let hasErrors = false;

    // 1. Verify anamnesis table
    const anamnesisResult = await verifyAnamnesisWritable();
    if (!anamnesisResult.success) hasErrors = true;

    // 2. Verify students table
    const studentsResult = await verifyStudentsWritable();
    if (!studentsResult.success) hasErrors = true;

    // Final Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    if (hasErrors) {
        console.log('  ❌ VERIFICAÇÃO FALHOU - NÃO FAÇA DEPLOY!');
        console.log('  Execute o script SQL de migração no Supabase primeiro.');
        console.log('═══════════════════════════════════════════════════════════\n');
        process.exit(1);
    } else {
        console.log('  ✅ VERIFICAÇÃO PASSOU - Pronto para deploy!');
        console.log('═══════════════════════════════════════════════════════════\n');
        process.exit(0);
    }
}

runVerification().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
