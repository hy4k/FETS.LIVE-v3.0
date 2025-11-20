import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s';

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔍 Checking Profile Data Synchronization\n');

async function syncProfiles() {
  // Check profiles table
  console.log('1️⃣ Checking profiles table...');
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email');

  console.log(`   Found ${profiles?.length || 0} profiles`);
  if (profiles && profiles.length > 0) {
    console.log('   Sample:', profiles[0]);
  }

  // Check staff_profiles table
  console.log('\n2️⃣ Checking staff_profiles table...');
  const { data: staffProfiles } = await supabase
    .from('staff_profiles')
    .select('id, user_id, full_name, email');

  console.log(`   Found ${staffProfiles?.length || 0} staff profiles`);
  if (staffProfiles && staffProfiles.length > 0) {
    console.log('   Sample:', staffProfiles[0]);
  }

  // Check kudos table
  console.log('\n3️⃣ Checking kudos table...');
  const { data: kudosRecords } = await supabase
    .from('kudos')
    .select('*');

  console.log(`   Found ${kudosRecords?.length || 0} kudos records`);
  if (kudosRecords && kudosRecords.length > 0) {
    console.log('   Sample IDs:');
    kudosRecords.forEach(k => {
      console.log(`     giver: ${k.giver_id}, receiver: ${k.receiver_id}`);
    });
  }

  // Check user_tasks table
  console.log('\n4️⃣ Checking user_tasks table...');
  const { data: tasks } = await supabase
    .from('user_tasks')
    .select('*');

  console.log(`   Found ${tasks?.length || 0} task records`);
  if (tasks && tasks.length > 0) {
    console.log('   Sample IDs:');
    tasks.forEach(t => {
      console.log(`     assigned_to: ${t.assigned_to}, assigned_by: ${t.assigned_by}`);
    });
  }

  // Find mismatches
  console.log('\n5️⃣ Finding ID mismatches...');
  const staffProfileIds = new Set(staffProfiles?.map(sp => sp.id) || []);
  const staffProfileUserIds = new Set(staffProfiles?.map(sp => sp.user_id) || []);
  const profileIds = new Set(profiles?.map(p => p.id) || []);

  console.log(`\n   Staff profile IDs: ${[...staffProfileIds].slice(0, 2).join(', ')}...`);
  console.log(`   Staff profile user_ids: ${[...staffProfileUserIds].slice(0, 2).join(', ')}...`);
  console.log(`   Profile IDs: ${[...profileIds].slice(0, 2).join(', ')}...`);

  // Check if kudos IDs are in profiles or staff_profiles
  if (kudosRecords && kudosRecords.length > 0) {
    const giverInStaff = staffProfileIds.has(kudosRecords[0].giver_id);
    const giverInProfiles = profileIds.has(kudosRecords[0].giver_id);
    const giverInUserIds = staffProfileUserIds.has(kudosRecords[0].giver_id);

    console.log('\n   Kudos giver_id location:');
    console.log(`     In staff_profiles.id? ${giverInStaff}`);
    console.log(`     In staff_profiles.user_id? ${giverInUserIds}`);
    console.log(`     In profiles.id? ${giverInProfiles}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 DIAGNOSIS');
  console.log('='.repeat(60));

  console.log('\n💡 Solution: Update kudos and user_tasks to use staff_profiles.id');
  console.log('\n   The issue is that kudos/user_tasks are using auth.uid()');
  console.log('   but need to use staff_profiles.id instead.');
  console.log('\n   I will update the frontend hooks to map user_id → staff_profile.id');
}

syncProfiles().catch(console.error);
