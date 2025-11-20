-- Sync branch_assigned from base_centre for all staff profiles
-- This ensures backward compatibility after the field name change

-- Update all records where branch_assigned is null but base_centre has a value
UPDATE staff_profiles
SET branch_assigned = base_centre
WHERE branch_assigned IS NULL AND base_centre IS NOT NULL;

-- Also update records where they differ (to ensure consistency)
UPDATE staff_profiles
SET branch_assigned = base_centre
WHERE base_centre IS NOT NULL
  AND (branch_assigned IS NULL OR branch_assigned != base_centre);

-- Show the results
SELECT
  'calicut' as branch,
  COUNT(*) as count
FROM staff_profiles
WHERE branch_assigned = 'calicut'
  AND full_name NOT IN ('MITHUN', 'NIYAS', 'Mithun', 'Niyas')

UNION ALL

SELECT
  'cochin' as branch,
  COUNT(*) as count
FROM staff_profiles
WHERE branch_assigned = 'cochin'
  AND full_name NOT IN ('MITHUN', 'NIYAS', 'Mithun', 'Niyas')

UNION ALL

SELECT
  'null/other' as branch,
  COUNT(*) as count
FROM staff_profiles
WHERE (branch_assigned IS NULL OR branch_assigned NOT IN ('calicut', 'cochin'))
  AND full_name NOT IN ('MITHUN', 'NIYAS', 'Mithun', 'Niyas');
