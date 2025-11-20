# Quick Start: Profile Migration

## TL;DR

Run this to merge `profiles` → `staff_profiles`:

```powershell
# 1. Verify current state
psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" -f verify-migration-status.sql

# 2. Run migration
.\run-final-migration.ps1

# 3. Verify completion
psql "postgresql://postgres:[YOUR_PASSWORD]@db.qqewusetilxxfvfkmsed.supabase.co:5432/postgres" -f verify-migration-status.sql
```

## What This Does

- ✅ Merges all user data into `staff_profiles`
- ✅ Updates all foreign keys
- ✅ Renames `profiles` → `profiles_deprecated`
- ✅ No data loss
- ✅ Reversible

## Files Created

| File | Purpose |
|------|---------|
| `FINAL-MERGE-PROFILES.sql` | Main migration script |
| `run-final-migration.ps1` | PowerShell runner |
| `verify-migration-status.sql` | Check before/after |
| `MIGRATION-GUIDE.md` | Full documentation |
| `QUICK-START.md` | This file |

## Before Migration

```sql
-- Foreign keys point to profiles
incidents.user_id → profiles.id
kudos.giver_id → profiles.id
kudos.receiver_id → profiles.id
vault.author_id → profiles.id
vault_item_pins.user_id → profiles.id
```

## After Migration

```sql
-- Foreign keys point to staff_profiles
incidents.user_id → staff_profiles.id
kudos.giver_id → staff_profiles.id
kudos.receiver_id → staff_profiles.id
vault.author_id → staff_profiles.id
vault_item_pins.user_id → staff_profiles.id
```

## Code Changes

Already updated:
- ✅ `database.types.ts` - Type definitions
- ✅ `supabase.ts` - Helper functions
- ✅ `.mcp.json` - MCP server config

No changes needed:
- ✅ `AuthContext.tsx` - Already uses staff_profiles
- ✅ Most components - Already use staff_profiles

## Testing Checklist

After migration, test:
- [ ] Login/Logout
- [ ] Create incident
- [ ] Give kudos
- [ ] Upload to vault
- [ ] View roster
- [ ] Send chat message
- [ ] Create post

## Rollback

If needed:
```sql
-- See ROLLBACK SCRIPT in FINAL-MERGE-PROFILES.sql
```

## Support

Questions? Check:
1. `MIGRATION-GUIDE.md` - Full details
2. `TABLE_ANALYSIS.md` - Original analysis
3. Error logs in Supabase Dashboard

## Timeline

- ⏱️ Migration: 5-10 minutes
- ⏱️ Testing: 1-2 hours
- ⏱️ Monitoring: 7-30 days
- ⏱️ Cleanup: 5 minutes (drop deprecated table)

---

**Ready to migrate?** Run `.\run-final-migration.ps1`
