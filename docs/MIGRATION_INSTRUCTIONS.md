# Custom Checklist Database Migration Instructions

## Problem
The `checklist_template_items` table is missing the `question_type` and `dropdown_options` columns that the frontend code expects.

## Solution
Run the SQL migration script to add these columns to the database.

## Option 1: Run via Supabase Dashboard (RECOMMENDED)

1. Go to your Supabase SQL Editor:
   https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed/sql/new

2. Open the file: `scripts/fix-checklist-template-items-schema.sql`

3. Copy the entire contents of that SQL file

4. Paste it into the Supabase SQL Editor

5. Click "Run" to execute the migration

6. You should see success messages indicating:
   - ✅ Added question_type column
   - ✅ Added dropdown_options column
   - ✅ Migrated data from old columns (if they existed)
   - ✅ Added check constraint for valid question types

## Option 2: Run via Node Script (If you have SERVICE_ROLE_KEY)

1. Add your `SUPABASE_SERVICE_ROLE_KEY` to a `.env` file in the root directory:
   ```
   VITE_SUPABASE_URL=https://qqewusetilxxfvfkmsed.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

2. Run the migration script:
   ```bash
   node run-checklist-migration.cjs
   ```

## What the Migration Does

The migration adds two new columns to the `checklist_template_items` table:

1. **question_type** (TEXT): Stores the type of question
   - Valid types: checkbox, text, number, dropdown, date, time, textarea, radio

2. **dropdown_options** (TEXT[]): Stores options for dropdown and radio button questions
   - Only used when question_type is 'dropdown' or 'radio'

## After Migration

Once the migration is complete:

1. ✅ You'll be able to create custom checklists with different question types in FETS Manager
2. ✅ The questions will render correctly when filling out checklists in Command Centre
3. ✅ All 8 question types will work: checkbox, text, number, dropdown, date, time, textarea, radio

## Testing

After running the migration:

1. Go to FETS Manager → Checklist Management
2. Create a new custom checklist with different question types
3. Go to Command Centre → Custom Checklists
4. Click "Start" on your custom checklist
5. Verify that all question types render correctly

## Troubleshooting

If you get an error about columns already existing:
- ✅ That's OK! The script is designed to be safe and won't duplicate columns

If you get permission errors:
- Use Option 1 (Supabase Dashboard) instead
- Make sure you're logged in as the project owner

## Support

If you encounter any issues:
1. Check the browser console for error messages
2. Verify the migration ran successfully in Supabase Dashboard
3. Check that the columns exist by running:
   ```sql
   SELECT column_name, data_type
   FROM information_schema.columns
   WHERE table_name = 'checklist_template_items'
   ORDER BY column_name;
   ```
