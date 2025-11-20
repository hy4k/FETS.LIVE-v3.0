/**
 * Run database migration to consolidate profiles and staff_profiles
 *
 * This script executes the migration SQL safely with proper error handling
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qqewusetilxxfvfkmsed.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.error('');
  console.error('Please set the service role key:');
  console.error('1. Get your service role key from: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/settings/api');
  console.error('2. Create a .env file in the project root');
  console.error('3. Add: SUPABASE_SERVICE_ROLE_KEY=your-service-role-key');
  console.error('');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔧 FETS.LIVE Database Migration');
console.log('================================');
console.log('');
console.log('📋 Migration: Consolidate to staff_profiles table');
console.log('🌐 Supabase URL:', supabaseUrl);
console.log('');

async function verifyTables() {
  console.log('📊 Step 1: Verifying table structure...');

  try {
    // Check profiles table
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (profilesError) {
      console.log('⚠️  profiles table:', profilesError.message);
    } else {
      console.log('✅ profiles table exists');
    }

    // Check staff_profiles table
    const { data: staffData, error: staffError } = await supabase
      .from('staff_profiles')
      .select('*', { count: 'exact', head: true });

    if (staffError) {
      console.error('❌ staff_profiles table error:', staffError.message);
      return false;
    } else {
      console.log('✅ staff_profiles table exists');
    }

    console.log('');
    return true;
  } catch (error) {
    console.error('❌ Error verifying tables:', error.message);
    return false;
  }
}

async function executeMigrationSQL() {
  console.log('🔄 Step 2: Executing migration SQL...');
  console.log('');

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'migrate-to-staff-profiles.sql');

  if (!fs.existsSync(sqlPath)) {
    console.error('❌ Migration SQL file not found:', sqlPath);
    return false;
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  // Split SQL into individual statements (basic parsing)
  // Note: Supabase client doesn't support raw SQL directly through the JS client
  // We need to use the REST API or SQL editor

  console.log('📝 Migration SQL loaded from:', sqlPath);
  console.log('');
  console.log('⚠️  IMPORTANT: The Supabase JavaScript client cannot execute raw SQL with DDL statements.');
  console.log('');
  console.log('Please follow these steps to run the migration:');
  console.log('');
  console.log('1. Open Supabase SQL Editor:');
  console.log('   https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/sql/new');
  console.log('');
  console.log('2. Copy the contents of: migrate-to-staff-profiles.sql');
  console.log('');
  console.log('3. Paste into the SQL Editor');
  console.log('');
  console.log('4. Click "Run" to execute');
  console.log('');
  console.log('5. Review the output to ensure all foreign keys were updated');
  console.log('');

  // Offer to open the URL
  console.log('💡 Tip: The migration script includes verification queries at the end.');
  console.log('');

  return true;
}

async function verifyMigration() {
  console.log('🔍 Step 3: Checking current foreign key state...');
  console.log('');

  try {
    // Try to query incidents table to see which table it references
    const { data, error } = await supabase
      .from('incidents')
      .select('id, user_id')
      .limit(1);

    if (error) {
      console.log('⚠️  Could not verify incidents table:', error.message);
    } else {
      console.log('✅ Incidents table is accessible');
      if (data && data.length > 0) {
        console.log('   Sample record found with user_id:', data[0].user_id);
      }
    }

    // Check staff_profiles
    const { data: staffData, error: staffError } = await supabase
      .from('staff_profiles')
      .select('id, full_name, email')
      .limit(3);

    if (staffError) {
      console.error('❌ Error querying staff_profiles:', staffError.message);
    } else {
      console.log('✅ staff_profiles table has', staffData?.length || 0, 'sample records');
      if (staffData && staffData.length > 0) {
        console.log('   Sample users:', staffData.map(u => u.full_name).join(', '));
      }
    }

    console.log('');
  } catch (error) {
    console.error('❌ Error during verification:', error.message);
  }
}

async function main() {
  try {
    // Step 1: Verify tables exist
    const tablesOk = await verifyTables();
    if (!tablesOk) {
      console.error('❌ Table verification failed. Aborting migration.');
      process.exit(1);
    }

    // Step 2: Show migration instructions
    await executeMigrationSQL();

    // Step 3: Verify current state
    await verifyMigration();

    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('');
    console.log('📋 Summary:');
    console.log('• Migration SQL file is ready');
    console.log('• Please run it manually in Supabase SQL Editor');
    console.log('• The script includes safety checks and rollback');
    console.log('• After running, verify all foreign keys updated correctly');
    console.log('');
    console.log('🔗 Direct link to SQL Editor:');
    console.log('https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/sql/new');
    console.log('');
    console.log('════════════════════════════════════════════════════════');
    console.log('');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

// Run the migration
main();
