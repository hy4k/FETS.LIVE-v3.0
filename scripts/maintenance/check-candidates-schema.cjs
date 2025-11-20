/**
 * Check candidates table schema and constraints
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkCandidates() {
  console.log('🔍 Investigating candidates table...\n')

  // Try simple count first
  console.log('1. Simple COUNT query:')
  try {
    const { count, error } = await supabase
      .from('candidates')
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.error('   ❌ Error:', error.message)
      console.error('   Code:', error.code)
      console.error('   Details:', error.details)
    } else {
      console.log(`   ✅ Total candidates: ${count}\n`)
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  // Try selecting just IDs
  console.log('2. Select just IDs:')
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('id')
      .limit(5)

    if (error) {
      console.error('   ❌ Error:', error.message)
    } else {
      console.log(`   ✅ Found ${data?.length || 0} records`)
      if (data) console.log('   IDs:', data.map(d => d.id))
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  // Try selecting specific columns
  console.log('\n3. Select specific columns:')
  try {
    const { data, error } = await supabase
      .from('candidates')
      .select('id, full_name, status')
      .limit(5)

    if (error) {
      console.error('   ❌ Error:', error.message)
      console.error('   Full error:', JSON.stringify(error, null, 2))
    } else {
      console.log(`   ✅ Found ${data?.length || 0} records`)
      if (data && data.length > 0) {
        data.forEach(c => console.log(`   - ${c.full_name} (${c.status})`))
      }
    }
  } catch (err) {
    console.error('   ❌ Exception:', err.message)
  }

  // Try raw RPC call to bypass RLS
  console.log('\n4. Testing RLS bypass:')
  try {
    const { data, error } = await supabase.rpc('log_date_discrepancies')

    if (error) {
      console.log('   ℹ️  RPC not available (expected):', error.message)
    } else {
      console.log('   Data:', data)
    }
  } catch (err) {
    console.log('   ℹ️  RPC test skipped')
  }

  console.log('\n✅ Investigation complete!')
}

checkCandidates().catch(console.error)
