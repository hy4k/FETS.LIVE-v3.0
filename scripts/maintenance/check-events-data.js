/**
 * Script to check if data exists in events and incidents tables
 */
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseKey) {
  console.error('❌ No Supabase key found. Please set SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking database tables...\n')

  // Check events table
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, title, priority, status, event_date, created_at')
    .limit(5)

  console.log('📊 EVENTS TABLE:')
  if (eventsError) {
    console.error('   ❌ Error:', eventsError.message)
  } else {
    console.log(`   ✅ Found ${events?.length || 0} records (showing first 5)`)
    if (events && events.length > 0) {
      events.forEach(e => {
        console.log(`      - ${e.title} (${e.status}) [${e.priority}] - ${e.event_date}`)
      })
    }
  }

  console.log('\n')

  // Check incidents table
  const { data: incidents, error: incidentsError } = await supabase
    .from('incidents')
    .select('id, title, status, reporter, created_at')
    .limit(5)

  console.log('📊 INCIDENTS TABLE:')
  if (incidentsError) {
    console.error('   ❌ Error:', incidentsError.message)
  } else {
    console.log(`   ✅ Found ${incidents?.length || 0} records (showing first 5)`)
    if (incidents && incidents.length > 0) {
      incidents.forEach(i => {
        console.log(`      - ${i.title} (${i.status}) - Reporter: ${i.reporter}`)
      })
    }
  }

  console.log('\n')

  // Check candidates table
  const { data: candidates, error: candidatesError } = await supabase
    .from('candidates')
    .select('id, full_name, status, exam_date')
    .limit(5)

  console.log('📊 CANDIDATES TABLE:')
  if (candidatesError) {
    console.error('   ❌ Error:', candidatesError.message)
  } else {
    console.log(`   ✅ Found ${candidates?.length || 0} records (showing first 5)`)
    if (candidates && candidates.length > 0) {
      candidates.forEach(c => {
        console.log(`      - ${c.full_name} (${c.status}) - ${c.exam_date}`)
      })
    }
  }

  console.log('\n')

  // Check staff_profiles
  const { data: staff, error: staffError } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role')
    .limit(5)

  console.log('📊 STAFF_PROFILES TABLE:')
  if (staffError) {
    console.error('   ❌ Error:', staffError.message)
  } else {
    console.log(`   ✅ Found ${staff?.length || 0} records (showing first 5)`)
    if (staff && staff.length > 0) {
      staff.forEach(s => {
        console.log(`      - ${s.full_name} (${s.role})`)
      })
    }
  }

  console.log('\n✅ Data check complete!')
}

checkData().catch(console.error)
