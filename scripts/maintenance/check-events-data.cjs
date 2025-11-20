/**
 * Script to check if data exists in events and incidents tables
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkData() {
  console.log('🔍 Checking database tables...\n')

  // Check events table
  const { data: events, error: eventsError, count: eventsCount } = await supabase
    .from('events')
    .select('id, title, priority, status, event_date, created_at', { count: 'exact' })
    .limit(5)

  console.log('📊 EVENTS TABLE:')
  if (eventsError) {
    console.error('   ❌ Error:', eventsError.message)
  } else {
    console.log(`   ✅ Total: ${eventsCount || 0} records (showing first 5)`)
    if (events && events.length > 0) {
      events.forEach(e => {
        console.log(`      - ${e.title} (${e.status}) [${e.priority}] - ${e.event_date}`)
      })
    }
  }

  console.log('\n')

  // Check incidents table
  const { data: incidents, error: incidentsError, count: incidentsCount } = await supabase
    .from('incidents')
    .select('id, title, status, reporter, created_at', { count: 'exact' })
    .limit(5)

  console.log('📊 INCIDENTS TABLE:')
  if (incidentsError) {
    console.error('   ❌ Error:', incidentsError.message)
  } else {
    console.log(`   ✅ Total: ${incidentsCount || 0} records (showing first 5)`)
    if (incidents && incidents.length > 0) {
      incidents.forEach(i => {
        console.log(`      - ${i.title} (${i.status}) - Reporter: ${i.reporter}`)
      })
    }
  }

  console.log('\n')

  // Check candidates table
  const { data: candidates, error: candidatesError, count: candidatesCount } = await supabase
    .from('candidates')
    .select('id, full_name, status, exam_date', { count: 'exact' })
    .limit(5)

  console.log('📊 CANDIDATES TABLE:')
  if (candidatesError) {
    console.error('   ❌ Error:', candidatesError.message)
  } else {
    console.log(`   ✅ Total: ${candidatesCount || 0} records (showing first 5)`)
    if (candidates && candidates.length > 0) {
      candidates.forEach(c => {
        console.log(`      - ${c.full_name} (${c.status}) - ${c.exam_date}`)
      })
    }
  }

  console.log('\n')

  // Check staff_profiles
  const { data: staff, error: staffError, count: staffCount } = await supabase
    .from('staff_profiles')
    .select('id, full_name, role', { count: 'exact' })
    .limit(5)

  console.log('📊 STAFF_PROFILES TABLE:')
  if (staffError) {
    console.error('   ❌ Error:', staffError.message)
  } else {
    console.log(`   ✅ Total: ${staffCount || 0} records (showing first 5)`)
    if (staff && staff.length > 0) {
      staff.forEach(s => {
        console.log(`      - ${s.full_name} (${s.role})`)
      })
    }
  }

  console.log('\n✅ Data check complete!')
}

checkData().catch(console.error)
