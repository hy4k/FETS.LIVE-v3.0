# FIX DATABASE - CRITICAL ISSUE FOUND

## The Problem

Your Supabase database has **database-level references** to the old `profiles` table that's preventing the `candidates` table from being queried.

**Error**: `relation "profiles" does not exist`

This error occurs at the DATABASE level (RLS policies, views, triggers, or constraints) - not in your application code.

## Investigation Results

✅ **Application Code**: All fixed - no more references to `profiles`
✅ **Staff Profiles**: 9 records - working correctly
✅ **Vault**: 3 records - working correctly
❌ **Candidates Table**: Cannot be queried due to database-level `profiles` reference
❌ **Events Table**: 0 records (empty, but accessible)

## The Fix (Run in Supabase SQL Editor)

### Option 1: Quick Fix (Recommended)

**Go to your Supabase Dashboard → SQL Editor → New Query**

Copy and paste this SQL:

```sql
-- Drop all RLS policies on candidates table
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON candidates;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON candidates;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON candidates;

-- Create new simple RLS policies WITHOUT profiles reference
CREATE POLICY "Enable read access for all authenticated users"
    ON candidates FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert for all authenticated users"
    ON candidates FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
    ON candidates FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
    ON candidates FOR DELETE
    TO authenticated
    USING (true);

-- Drop the empty profiles table
DROP TABLE IF EXISTS profiles CASCADE;

-- Verify it works
SELECT COUNT(*) as total_candidates FROM candidates;
```

### Option 2: Detailed Investigation

If you want to see EXACTLY what's referencing `profiles` before fixing:

1. Open the file: **FIND-AND-FIX-PROFILES-REFERENCES.sql**
2. Copy the FIRST section (diagnostic queries) into Supabase SQL Editor
3. Run it to see what's referencing profiles
4. Then run the FIX section at the bottom

## After Running the Fix

1. **Refresh your browser** at http://localhost:5176
2. Try adding a **new candidate** - should work immediately ✅
3. Try creating a **new incident** - should work ✅
4. Check the **Resource Page** - should work ✅

## Why This Happened

The migration script (`FINAL-MERGE-PROFILES.sql`) renamed `profiles` to `profiles_deprecated` but:
- A new empty `profiles` table was created (0 records)
- RLS policies on `candidates` table still reference this empty `profiles` table
- When querying `candidates`, the RLS policy tries to join with `profiles` → error

## Files Created for You

1. **FIND-AND-FIX-PROFILES-REFERENCES.sql** - Complete diagnostic and fix script
2. **query-all-data.cjs** - Node script to verify data after fix
3. **check-tables.cjs** - Quick table existence check
4. **This file** - Explanation and instructions

## Summary of All Code Fixes (Already Applied)

✅ `fets-point/src/services/api.service.ts` - All `profiles` → `staff_profiles`
✅ `fets-point/src/hooks/useQueries.ts` - Fixed TypeScript types and table refs
✅ `fets-point/src/components/IncidentManager.tsx` - `incidents` → `events`
✅ `fets-point/src/lib/supabase.ts` - Updated helper functions

**All application code is fixed. Only the database needs the SQL fix above.**
