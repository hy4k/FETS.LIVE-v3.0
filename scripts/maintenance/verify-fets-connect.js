// Verify FETS Connect Database Setup
// This script checks tables, policies, and indexes for FETS Connect

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://qqewusetilxxfvfkmsed.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  console.log('Please set it in your environment or .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// FETS Connect tables that need to be verified
const FETS_CONNECT_TABLES = [
  'posts',
  'post_likes',
  'post_comments',
  'user_tasks',
  'kudos',
  'conversations',
  'conversation_members',
  'messages',
  'message_read_receipts',
  'typing_indicators'
];

async function checkTableExists(tableName) {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (error && error.code === 'PGRST116') {
      return { exists: false, error: 'Table does not exist' };
    }
    if (error && error.code === '42P01') {
      return { exists: false, error: 'Table does not exist' };
    }
    if (error) {
      return { exists: true, error: error.message };
    }
    return { exists: true, error: null };
  } catch (err) {
    return { exists: false, error: err.message };
  }
}

async function checkRLSPolicies(tableName) {
  try {
    // Query to check RLS policies
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          schemaname, 
          tablename, 
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = '${tableName}';
      `
    });

    if (error) {
      // Try alternative method - check if RLS is enabled
      const { data: rlsData, error: rlsError } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);
      
      if (rlsError) {
        return { hasRLS: 'unknown', policies: [], error: error.message };
      }
      return { hasRLS: 'likely enabled', policies: [], error: null };
    }

    return { 
      hasRLS: data && data.length > 0 ? 'enabled' : 'disabled',
      policies: data || [],
      error: null 
    };
  } catch (err) {
    return { hasRLS: 'unknown', policies: [], error: err.message };
  }
}

async function checkIndexes(tableName) {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = '${tableName}';
      `
    });

    if (error) {
      return { indexes: [], error: error.message };
    }

    return { indexes: data || [], error: null };
  } catch (err) {
    return { indexes: [], error: err.message };
  }
}

async function verifyFetsConnect() {
  console.log('🔍 Verifying FETS Connect Database Setup...\n');
  console.log('=' .repeat(80));
  
  const results = {
    tables: {},
    summary: {
      total: FETS_CONNECT_TABLES.length,
      existing: 0,
      missing: 0,
      withRLS: 0,
      withoutRLS: 0,
      errors: []
    }
  };

  // Check each table
  for (const tableName of FETS_CONNECT_TABLES) {
    console.log(`\n📋 Checking table: ${tableName}`);
    console.log('-'.repeat(80));
    
    // Check if table exists
    const tableCheck = await checkTableExists(tableName);
    
    if (!tableCheck.exists) {
      console.log(`   ❌ Table does not exist: ${tableCheck.error}`);
      results.tables[tableName] = {
        exists: false,
        error: tableCheck.error
      };
      results.summary.missing++;
      results.summary.errors.push(`${tableName}: Table missing`);
      continue;
    }
    
    console.log(`   ✅ Table exists`);
    results.summary.existing++;
    
    // Check RLS policies
    const rlsCheck = await checkRLSPolicies(tableName);
    
    if (rlsCheck.error) {
      console.log(`   ⚠️  RLS Status: ${rlsCheck.hasRLS} (${rlsCheck.error})`);
    } else {
      console.log(`   ✅ RLS Status: ${rlsCheck.hasRLS}`);
      console.log(`   📜 Policies found: ${rlsCheck.policies.length}`);
      
      if (rlsCheck.policies.length > 0) {
        rlsCheck.policies.forEach(policy => {
          console.log(`      - ${policy.policyname} (${policy.cmd})`);
        });
        results.summary.withRLS++;
      } else {
        console.log(`      ⚠️  No policies found - RLS might be enabled but no policies set`);
        results.summary.withoutRLS++;
      }
    }
    
    // Check indexes
    const indexCheck = await checkIndexes(tableName);
    
    if (indexCheck.error) {
      console.log(`   ⚠️  Indexes: Unable to check (${indexCheck.error})`);
    } else {
      console.log(`   📊 Indexes: ${indexCheck.indexes.length} found`);
      if (indexCheck.indexes.length > 0) {
        indexCheck.indexes.forEach(idx => {
          console.log(`      - ${idx.indexname}`);
        });
      }
    }
    
    results.tables[tableName] = {
      exists: true,
      rls: rlsCheck,
      indexes: indexCheck
    };
  }

  // Print summary
  console.log('\n');
  console.log('=' .repeat(80));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total tables checked: ${results.summary.total}`);
  console.log(`✅ Existing tables: ${results.summary.existing}`);
  console.log(`❌ Missing tables: ${results.summary.missing}`);
  console.log(`🔒 Tables with RLS policies: ${results.summary.withRLS}`);
  console.log(`⚠️  Tables without RLS policies: ${results.summary.withoutRLS}`);
  
  if (results.summary.errors.length > 0) {
    console.log('\n❌ ERRORS FOUND:');
    results.summary.errors.forEach(err => console.log(`   - ${err}`));
  }
  
  // Overall status
  console.log('\n');
  if (results.summary.missing === 0 && results.summary.existing === results.summary.total) {
    console.log('🎉 All FETS Connect tables exist!');
    
    if (results.summary.withRLS === results.summary.total) {
      console.log('🔒 All tables have RLS policies configured!');
      console.log('✅ FETS Connect database is properly configured!');
    } else {
      console.log('⚠️  Some tables are missing RLS policies.');
      console.log('💡 Run the fets-connect-setup.sql script to add missing policies.');
    }
  } else {
    console.log('❌ FETS Connect database is incomplete!');
    console.log('💡 Some tables are missing. Please run the setup script.');
  }
  
  console.log('\n' + '=' .repeat(80));
  
  return results;
}

// Run verification
verifyFetsConnect()
  .then(() => {
    console.log('\n✅ Verification complete!');
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
