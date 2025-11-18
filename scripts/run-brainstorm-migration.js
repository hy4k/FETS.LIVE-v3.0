#!/usr/bin/env node
/**
 * Run the brainstorm feature database migration
 * Requires SUPABASE_ACCESS_TOKEN environment variable
 */

const fs = require('fs')
const path = require('path')

const DEFAULT_REF = 'qqewusetilxxfvfkmsed'

async function runMigration() {
  const token = process.env.SUPABASE_ACCESS_TOKEN
  if (!token) {
    console.error('❌ SUPABASE_ACCESS_TOKEN is not set')
    console.log('\nPlease set your Supabase access token:')
    console.log('  export SUPABASE_ACCESS_TOKEN="your-token-here"')
    process.exit(1)
  }

  // Read the SQL file
  const sqlPath = path.join(__dirname, 'create-brainstorm-tables.sql')
  let sql
  try {
    sql = fs.readFileSync(sqlPath, 'utf8')
    console.log('✅ Loaded SQL migration file')
  } catch (error) {
    console.error('❌ Failed to read SQL file:', error.message)
    process.exit(1)
  }

  // Execute the migration
  const url = `https://api.supabase.com/v1/projects/${DEFAULT_REF}/database/query`

  console.log('🔄 Running database migration...')
  console.log('   Project:', DEFAULT_REF)

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': token,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ query: sql })
    })

    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error(`❌ Request failed: ${resp.status} ${resp.statusText}`)
      if (text) console.error('   Details:', text)
      process.exit(1)
    }

    const data = await resp.json()
    console.log('✅ Migration completed successfully!')
    console.log('\nCreated tables:')
    console.log('  - brainstorm_sessions')
    console.log('  - brainstorm_notes')
    console.log('  - brainstorm_events')
    console.log('\nDefault sessions created for each branch.')

    if (data.error) {
      console.error('\n⚠️  Warning:', data.error)
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

runMigration().catch(err => {
  console.error('❌ Unexpected error:', err?.message || String(err))
  process.exit(1)
})
