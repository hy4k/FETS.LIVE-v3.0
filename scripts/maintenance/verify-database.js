import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTM2MjY1NSwiZXhwIjoyMDcwOTM4NjU1fQ.LJePJfsskt3HvoJvo9cWWDGaE0fOstb0tlmyYm5sWPo';

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔍 VERIFYING DATABASE STRUCTURE\n');
console.log('='.repeat(60));

const tablesToCheck = [
  'staff_profiles',
  'posts',
  'post_likes',
  'post_comments',
  'user_tasks',
  'kudos',
  'chat_messages',
  'conversations',
  'conversation_members',
  'messages',
  'message_read_receipts',
  'push_subscriptions'
];

async function verifyTables() {
  console.log('📋 Checking Tables:\n');

  for (const table of tablesToCheck) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table.padEnd(30)} - ${error.message}`);
      } else {
        console.log(`✅ ${table.padEnd(30)} - Accessible`);
      }
    } catch (err) {
      console.log(`❌ ${table.padEnd(30)} - ${err.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Verification Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Test FetsConnect features in your application');
  console.log('   2. Check if posts, comments, and likes work properly');
  console.log('   3. Verify chat messaging functionality');
  console.log('   4. Review RLS policies in Supabase Dashboard if needed');
}

verifyTables().catch(console.error);
