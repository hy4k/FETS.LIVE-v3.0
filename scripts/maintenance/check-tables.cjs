/**
 * Script to check what tables exist in the database
 */
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://qqewusetilxxfvfkmsed.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxZXd1c2V0aWx4eGZ2Zmttc2VkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUzNjI2NTUsImV4cCI6MjA3MDkzODY1NX0.-x783XXpilPWC3O-cJqmdSTmhpAvObk_MSElfGdrU8s'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTables() {
  console.log('🔍 Checking which tables exist...\n')

  const tablesToCheck = [
    'profiles',
    'profiles_deprecated',
    'staff_profiles',
    'events',
    'incidents',
    'candidates',
    'vault',
    'kudos'
  ]

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`❌ ${table}: ${error.message}`)
      } else {
        console.log(`✅ ${table}: ${count || 0} records`)
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`)
    }
  }

  console.log('\n✅ Table check complete!')
}

checkTables().catch(console.error)
