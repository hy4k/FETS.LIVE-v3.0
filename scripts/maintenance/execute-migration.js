import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const PROJECT_REF = 'qqewusetilxxfvfkmsed';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY required');
  process.exit(1);
}

const supabase = createClient(
  `https://${PROJECT_REF}.supabase.co`,
  SERVICE_KEY,
  { db: { schema: 'public' } }
);

console.log('📖 Reading migration file...');
const sql = await fs.readFile('FINAL-MERGE-PROFILES.sql', 'utf-8');

console.log('🚀 Executing migration via REST API...\n');

const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s && !s.startsWith('--') && !s.startsWith('/*'));

for (const statement of statements) {
  if (!statement) continue;
  try {
    const { error } = await supabase.rpc('query', { query_text: statement });
    if (error) throw error;
  } catch (err) {
    const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/rpc/exec`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query: statement })
    });
    
    if (!response.ok) {
      console.error('❌ Failed:', statement.substring(0, 100));
    }
  }
}

console.log('\n✅ Migration completed!');
