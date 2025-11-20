/**
 * Comprehensive script to query ALL data from Supabase
 * Using service role key for full access
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
// Try to use service role key from environment, fallback to anon key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
                    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function queryAllData() {
  console.log('🔍 Querying ALL data from Supabase...\n')
  console.log('Using key type:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SERVICE ROLE' : 'ANON')
  console.log('='+ '='.repeat(60) + '\n')

  // 1. CANDIDATES
  console.log('📊 CANDIDATES TABLE:')
  try {
    const { data: candidates, error, count } = await supabase
      .from('candidates')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('   ❌ Error:', error.message)
      console.error('   Details:', JSON.stringify(error, null, 2))
    } else {
      console.log(`   ✅ Total records: ${count}`)
      if (candidates && candidates.length > 0) {
        console.log(`   📝 Showing first ${candidates.length} records:\n`)
        candidates.forEach((c, i) => {
          console.log(`   ${i+1}. ${c.full_name}`)
          console.log(`      - Status: ${c.status}`)
          console.log(`      - Exam: ${c.exam_name || 'N/A'} on ${c.exam_date || 'N/A'}`)
          console.log(`      - Branch: ${c.branch_location || 'N/A'}`)
          console.log(`      - User ID: ${c.user_id}`)
          console.log()
        })
      } else {
        console.log('   ℹ️  No candidates found')
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 2. EVENTS (Incidents)
  console.log('📊 EVENTS TABLE (Incidents):')
  try {
    const { data: events, error, count } = await supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('   ❌ Error:', error.message)
      console.error('   Details:', JSON.stringify(error, null, 2))
    } else {
      console.log(`   ✅ Total records: ${count}`)
      if (events && events.length > 0) {
        console.log(`   📝 Showing first ${events.length} records:\n`)
        events.forEach((e, i) => {
          console.log(`   ${i+1}. ${e.title}`)
          console.log(`      - Status: ${e.status}`)
          console.log(`      - Priority: ${e.priority}`)
          console.log(`      - Category: ${e.category}`)
          console.log(`      - Branch: ${e.branch_location || 'N/A'}`)
          console.log()
        })
      } else {
        console.log('   ℹ️  No events found')
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 3. STAFF PROFILES
  console.log('📊 STAFF_PROFILES TABLE:')
  try {
    const { data: staff, error, count } = await supabase
      .from('staff_profiles')
      .select('id, full_name, role, email, branch_assigned', { count: 'exact' })
      .order('full_name', { ascending: true })

    if (error) {
      console.error('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Total records: ${count}`)
      if (staff && staff.length > 0) {
        staff.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.full_name} (${s.role})`)
          console.log(`      - ID: ${s.id}`)
          console.log(`      - Email: ${s.email || 'N/A'}`)
          console.log(`      - Branch: ${s.branch_assigned || 'N/A'}`)
        })
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  console.log('\n' + '='.repeat(60) + '\n')

  // 4. VAULT
  console.log('📊 VAULT TABLE:')
  try {
    const { data: vault, error, count } = await supabase
      .from('vault')
      .select('id, title, type, author_id', { count: 'exact' })
      .eq('is_deleted', false)

    if (error) {
      console.error('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Total records: ${count}`)
      if (vault && vault.length > 0) {
        vault.forEach((v, i) => {
          console.log(`   ${i+1}. ${v.title} (${v.type})`)
        })
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  console.log('\n✅ Query complete!\n')
}

queryAllData().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
