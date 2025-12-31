-- Migration to update staff_profiles table with new fields for comprehensive user management

-- 1. Add new columns
ALTER TABLE staff_profiles 
ADD COLUMN IF NOT EXISTS contact_number TEXT,
ADD COLUMN IF NOT EXISTS position TEXT,
ADD COLUMN IF NOT EXISTS joining_date DATE,
ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS trainings_attended JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS future_trainings JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS remarks TEXT;

-- 2. Ensure branch_assigned can handle 'kannur' 
-- Note: If branch_assigned is a text column, this is fine. If it's an enum, we might need to add 'kannur'.
-- Assuming text for flexibility based on previous code usage (const branchNames: Record<string, string>).

-- 3. Add comment for clarity
COMMENT ON COLUMN staff_profiles.certificates IS 'Array of { name: string, validity: string }';
COMMENT ON COLUMN staff_profiles.trainings_attended IS 'Array of { name: string, date: string }';
COMMENT ON COLUMN staff_profiles.future_trainings IS 'Array of { name: string, due_date: string }';
