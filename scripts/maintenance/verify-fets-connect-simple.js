// Simple FETS Connect Database Verification
// Checks if tables exist and provides recommendations

const https = require('https');

const SUPABASE_URL = 'https://qqewusetilxxfvfkmsed.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTQyNDI5MDksImV4cCI6MjAyOTgxODkwOX0.j6J5vBN7m9A7gzWqLHqPNPHKE3PhJLNK4eGkqKfQqbw';

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
  'typing_indicators',
  'staff_profiles'
];

function makeRequest(table) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'qqewusetilxxfvfkmsed.supabase.co',
      port: 443,
      path: `/rest/v1/${table}?select=*&limit=0`,
      method: 'GET',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'count=exact'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          table,
          statusCode: res.statusCode,
          exists: res.statusCode === 200 || res.statusCode === 206,
          hasRLS: res.statusCode === 401 || res.statusCode === 403,
          contentRange: res.headers['content-range'],
          data: data
        });
      });
    });

    req.on('error', (error) => {
      reject({ table, error: error.message });
    });

    req.end();
  });
}

async function verifyFetsConnect() {
  console.log('🔍 Verifying FETS Connect Database Setup...\n');
  console.log('Project: https://qqewusetilxxfvfkmsed.supabase.co');
  console.log('=' .repeat(80));
  
  const results = {
    existing: [],
    missing: [],
    withRLS: [],
    accessible: [],
    errors: []
  };

  console.log('\n📋 Checking tables...\n');

  for (const table of FETS_CONNECT_TABLES) {
    try {
      const result = await makeRequest(table);
      
      if (result.exists) {
        console.log(`✅ ${table.padEnd(30)} - EXISTS`);
        results.existing.push(table);
        
        if (result.statusCode === 200) {
          results.accessible.push(table);
          console.log(`   └─ 🔓 Accessible (no RLS or permissive policies)`);
        } else if (result.hasRLS) {
          results.withRLS.push(table);
          console.log(`   └─ 🔒 Protected by RLS`);
        }
      } else if (result.statusCode === 404) {
        console.log(`❌ ${table.padEnd(30)} - MISSING`);
        results.missing.push(table);
      } else if (result.statusCode === 401 || result.statusCode === 403) {
        console.log(`⚠️  ${table.padEnd(30)} - EXISTS (RLS protected)`);
        results.existing.push(table);
        results.withRLS.push(table);
      } else {
        console.log(`❓ ${table.padEnd(30)} - STATUS ${result.statusCode}`);
        results.errors.push(`${table}: Unexpected status ${result.statusCode}`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(30)} - ERROR: ${err.error || err.message}`);
      results.errors.push(`${table}: ${err.error || err.message}`);
    }
  }

  // Print summary
  console.log('\n' + '=' .repeat(80));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(80));
  console.log(`Total tables to check: ${FETS_CONNECT_TABLES.length}`);
  console.log(`✅ Existing tables: ${results.existing.length}/${FETS_CONNECT_TABLES.length}`);
  console.log(`❌ Missing tables: ${results.missing.length}`);
  console.log(`🔒 Tables with RLS: ${results.withRLS.length}`);
  console.log(`🔓 Accessible tables: ${results.accessible.length}`);
  
  if (results.missing.length > 0) {
    console.log('\n❌ MISSING TABLES:');
    results.missing.forEach(t => console.log(`   - ${t}`));
  }
  
  if (results.errors.length > 0) {
    console.log('\n⚠️  ERRORS:');
    results.errors.forEach(e => console.log(`   - ${e}`));
  }
  
  // Recommendations
  console.log('\n' + '=' .repeat(80));
  console.log('💡 RECOMMENDATIONS');
  console.log('=' .repeat(80));
  
  if (results.missing.length > 0) {
    console.log('❌ Some tables are missing!');
    console.log('   Action: Create missing tables by running the setup script');
    console.log('   Script: fets-connect-setup.sql');
  } else {
    console.log('✅ All FETS Connect tables exist!');
  }
  
  if (results.existing.length > 0 && results.withRLS.length < results.existing.length) {
    console.log('\n⚠️  Some tables may not have RLS policies configured');
    console.log('   Action: Apply RLS policies by running fets-connect-setup.sql');
    console.log('   This ensures proper security for the FETS Connect page');
  } else if (results.withRLS.length === results.existing.length) {
    console.log('\n✅ RLS appears to be configured on all tables');
    console.log('   The FETS Connect page should be secure');
  }
  
  console.log('\n' + '=' .repeat(80));
  console.log('📝 NEXT STEPS');
  console.log('=' .repeat(80));
  
  if (results.missing.length === 0 && results.existing.length === FETS_CONNECT_TABLES.length) {
    console.log('1. ✅ All tables exist - good job!');
    console.log('2. 🔍 Check if FETS Connect page is loading properly');
    console.log('3. 🧪 Test posting, liking, commenting, tasks, kudos, and chat');
    console.log('4. 🔒 Verify users can only see/modify their own data');
    console.log('5. 📊 Check browser console for any errors');
  } else {
    console.log('1. ❌ Run fets-connect-setup.sql in Supabase SQL Editor');
    console.log('2. 🔄 Re-run this verification script');
    console.log('3. 🧪 Test the FETS Connect page functionality');
  }
  
  console.log('\n' + '=' .repeat(80));
  
  return results;
}

// Run verification
console.log('\n');
verifyFetsConnect()
  .then((results) => {
    console.log('\n✅ Verification complete!\n');
    if (results.missing.length > 0 || results.errors.length > 0) {
      process.exit(1);
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ Verification failed:', err);
    process.exit(1);
  });
