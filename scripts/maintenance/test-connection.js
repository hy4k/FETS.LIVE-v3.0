import pg from 'pg';
const { Client } = pg;

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌ Set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const client = new Client({
  connectionString: `postgresql://postgres.qqewusetilxxfvfkmsed:${SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
  ssl: { rejectUnauthorized: false }
});

console.log('🔄 Testing connection...');
await client.connect();
const result = await client.query('SELECT COUNT(*) FROM profiles');
console.log('✅ Connected! Profiles count:', result.rows[0].count);
await client.end();
