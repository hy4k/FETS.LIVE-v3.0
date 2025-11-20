// Check branch data in staff_profiles table
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
  console.log('Please set it in your .env file or pass it as an environment variable')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkBranchData() {
  console.log('🔍 Checking branch data in staff_profiles...\n')

  // Get all staff profiles excluding super admins
  const { data: profiles, error } = await supabase
    .from('staff_profiles')
    .select('id, full_name, branch_assigned, base_centre, role, email')
    .not('full_name', 'in', '("MITHUN","NIYAS","Mithun","Niyas")')
    .order('full_name')

  if (error) {
    console.error('❌ Error fetching profiles:', error.message)
    return
  }

  console.log(`Found ${profiles.length} staff profiles:\n`)

  // Group by branch_assigned values
  const byBranchAssigned = {}
  const byBaseCentre = {}
  const mismatches = []

  profiles.forEach(profile => {
    // Count by branch_assigned
    const ba = profile.branch_assigned || 'null'
    byBranchAssigned[ba] = (byBranchAssigned[ba] || 0) + 1

    // Count by base_centre
    const bc = profile.base_centre || 'null'
    byBaseCentre[bc] = (byBaseCentre[bc] || 0) + 1

    // Check for mismatches
    if (profile.branch_assigned !== profile.base_centre) {
      mismatches.push({
        name: profile.full_name,
        branch_assigned: profile.branch_assigned || 'null',
        base_centre: profile.base_centre || 'null'
      })
    }

    console.log(`  ${profile.full_name.padEnd(30)} | branch_assigned: ${(profile.branch_assigned || 'null').padEnd(10)} | base_centre: ${(profile.base_centre || 'null').padEnd(10)}`)
  })

  console.log('\n📊 Summary:')
  console.log('\nBy branch_assigned:')
  Object.entries(byBranchAssigned).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`)
  })

  console.log('\nBy base_centre:')
  Object.entries(byBaseCentre).forEach(([key, count]) => {
    console.log(`  ${key}: ${count}`)
  })

  if (mismatches.length > 0) {
    console.log(`\n⚠️  Found ${mismatches.length} mismatches:`)
    mismatches.forEach(m => {
      console.log(`  ${m.name}: branch_assigned="${m.branch_assigned}" vs base_centre="${m.base_centre}"`)
    })

    console.log('\n💡 To fix: Copy base_centre values to branch_assigned')
  } else {
    console.log('\n✅ All branch_assigned and base_centre values match!')
  }
}

checkBranchData().catch(console.error)
