const https = require('https');
const fs = require('fs');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qqewusetilxxfvfkmsed.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
  console.log('Please add it to your .env file');
  process.exit(1);
}

// Read the SQL file
const sqlContent = fs.readFileSync('./scripts/fix-checklist-template-items-schema.sql', 'utf8');

console.log('🔄 Running checklist_template_items schema migration...\n');

const url = new URL('/rest/v1/rpc/exec_sql', SUPABASE_URL);

const postData = JSON.stringify({
  query: sqlContent
});

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': SERVICE_ROLE_KEY,
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Migration completed successfully!');
      console.log('\nThe checklist_template_items table now has:');
      console.log('  - question_type: TEXT column for question types');
      console.log('  - dropdown_options: TEXT[] column for dropdown/radio options');
      console.log('  - Valid question types: checkbox, text, number, dropdown, date, time, textarea, radio');
      console.log('\n✅ You can now create custom checklists with different question types!');
    } else {
      console.error('❌ Migration failed with status:', res.statusCode);
      console.error('Response:', data);
      console.log('\n⚠️  Alternative: Run the SQL script manually in Supabase SQL Editor');
      console.log('📄 Script location: scripts/fix-checklist-template-items-schema.sql');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error executing migration:', error.message);
  console.log('\n⚠️  Alternative: Run the SQL script manually in Supabase SQL Editor');
  console.log('📄 Script location: scripts/fix-checklist-template-items-schema.sql');
  console.log('\nSteps:');
  console.log('1. Go to: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/sql/new');
  console.log('2. Copy the contents of scripts/fix-checklist-template-items-schema.sql');
  console.log('3. Paste and run the SQL in the editor');
});

req.write(postData);
req.end();
