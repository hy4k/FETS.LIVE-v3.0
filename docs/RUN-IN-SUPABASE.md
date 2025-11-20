# Run Migration in Supabase SQL Editor

## Easiest Method

1. Go to: https://app.supabase.com/project/qqewusetilxxfvfkmsed/sql/new

2. Copy the entire contents of `FINAL-MERGE-PROFILES.sql`

3. Paste into the SQL Editor

4. Click **RUN**

5. Done!

## Why This Method?

Direct database connections require specific network configurations. The Supabase SQL Editor is the most reliable way to execute complex migrations.

## What It Does

- Merges profiles → staff_profiles
- Updates all foreign keys
- Renames profiles → profiles_deprecated
- Transactional (all or nothing)

**Takes 5 seconds to execute!**
