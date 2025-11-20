# FETS.LIVE Profile Migration Package

## 📦 What's Included

This package contains everything needed to merge the `profiles` and `staff_profiles` tables into a single, unified table.

## 🎯 Quick Links

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[QUICK-START.md](QUICK-START.md)** | TL;DR version | Just want to run it |
| **[MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)** | Complete guide | Need full details |
| **[MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)** | Executive summary | Need overview |
| **[MIGRATION-CHECKLIST.md](MIGRATION-CHECKLIST.md)** | Step-by-step checklist | During execution |
| **[TABLE_ANALYSIS.md](TABLE_ANALYSIS.md)** | Original analysis | Understanding the problem |

## 📁 Files Overview

### Migration Scripts
- `FINAL-MERGE-PROFILES.sql` - Main migration SQL script
- `run-final-migration.ps1` - PowerShell execution wrapper
- `verify-migration-status.sql` - Pre/post verification script

### Code Updates (Already Applied)
- `fets-point/src/types/database.types.ts` - Updated type definitions
- `fets-point/src/lib/supabase.ts` - Updated helper functions
- `.mcp.json` - Updated MCP server configuration

### Documentation
- `MIGRATION-GUIDE.md` - Comprehensive migration guide
- `MIGRATION-SUMMARY.md` - Executive summary
- `MIGRATION-CHECKLIST.md` - Execution checklist
- `QUICK-START.md` - Quick reference
- `README-MIGRATION.md` - This file

## 🚀 Quick Start

### Option 1: I Just Want to Run It
```powershell
# 1. Backup database in Supabase Dashboard
# 2. Run migration
.\run-final-migration.ps1
# 3. Test features
```

### Option 2: I Want to Understand First
1. Read [MIGRATION-SUMMARY.md](MIGRATION-SUMMARY.md)
2. Review [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)
3. Follow [MIGRATION-CHECKLIST.md](MIGRATION-CHECKLIST.md)

## 🎓 Understanding the Problem

### Before Migration
```
Two tables causing confusion:
├── profiles (legacy)
│   ├── 24 columns
│   ├── 5 foreign key references
│   └── Used by: incidents, kudos, vault
│
└── staff_profiles (current)
    ├── 14 columns
    ├── 20+ foreign key references
    └── Used by: chat, posts, roster, etc.
```

### After Migration
```
Single source of truth:
└── staff_profiles
    ├── All user data
    ├── 25+ foreign key references
    └── Used by: ALL features
```

## ✅ What Gets Fixed

- ✅ No more confusion about which table to use
- ✅ Consistent foreign key relationships
- ✅ Single source of truth for user data
- ✅ Cleaner, more maintainable code
- ✅ Better data integrity

## 🔧 Technical Details

### Tables Updated
1. `incidents.user_id` → staff_profiles.id
2. `kudos.giver_id` → staff_profiles.id
3. `kudos.receiver_id` → staff_profiles.id
4. `vault.author_id` → staff_profiles.id
5. `vault_item_pins.user_id` → staff_profiles.id

### Code Updated
- ✅ Type definitions
- ✅ Helper functions
- ✅ MCP configuration

### No Code Changes Needed
- ✅ AuthContext (already uses staff_profiles)
- ✅ Most components (already use staff_profiles)

## 📊 Migration Process

```
1. Backup Database
   ↓
2. Run Verification (Before)
   ↓
3. Execute Migration
   ↓
4. Run Verification (After)
   ↓
5. Test Features
   ↓
6. Monitor (7-30 days)
   ↓
7. Cleanup (Drop deprecated table)
```

## ⏱️ Time Estimates

| Phase | Duration |
|-------|----------|
| Preparation | 30 minutes |
| Execution | 5-10 minutes |
| Testing | 1-2 hours |
| Monitoring | 7-30 days |
| Cleanup | 5 minutes |

## 🛡️ Safety Features

- ✅ **Transactional** - All or nothing
- ✅ **Reversible** - Rollback script included
- ✅ **Validated** - Checks for valid users
- ✅ **Verified** - Before/after verification
- ✅ **Logged** - Detailed execution output

## 🎯 Success Criteria

Migration is successful when:
- ✅ All foreign keys point to staff_profiles
- ✅ profiles renamed to profiles_deprecated
- ✅ All features tested and working
- ✅ No data loss
- ✅ No broken references

## 📝 Testing Checklist

After migration, test:
- [ ] Login/Logout
- [ ] Incident management
- [ ] Kudos system
- [ ] Vault/Resources
- [ ] Roster management
- [ ] Chat/Messaging
- [ ] Social features

## 🆘 Support

### If Something Goes Wrong
1. Check error logs in Supabase Dashboard
2. Review verification script output
3. Check [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md) troubleshooting section
4. Use rollback script if needed

### Rollback
```sql
-- See ROLLBACK SCRIPT section in FINAL-MERGE-PROFILES.sql
```

## 📚 Additional Resources

- **Supabase Dashboard**: https://app.supabase.com/project/qqewusetilxxfvfkmsed
- **MCP Server**: Configured in `.mcp.json`
- **Original Analysis**: See `TABLE_ANALYSIS.md`

## 🎉 Benefits

### Immediate
- Single source of truth
- Consistent relationships
- No more confusion

### Long-term
- Reduced technical debt
- Easier maintenance
- Better data integrity
- Simplified onboarding

## 📞 Contact

For questions or issues:
1. Review documentation in this package
2. Check Supabase logs
3. Review error messages
4. Consult development team

## 🏁 Ready to Start?

1. **Read**: [QUICK-START.md](QUICK-START.md) or [MIGRATION-GUIDE.md](MIGRATION-GUIDE.md)
2. **Backup**: Create database backup
3. **Execute**: Run `.\run-final-migration.ps1`
4. **Test**: Follow [MIGRATION-CHECKLIST.md](MIGRATION-CHECKLIST.md)
5. **Monitor**: Watch for issues
6. **Cleanup**: Drop deprecated table after 30 days

---

## 📋 File Manifest

```
Migration Package Contents:
├── SQL Scripts
│   ├── FINAL-MERGE-PROFILES.sql (Main migration)
│   └── verify-migration-status.sql (Verification)
│
├── Execution Scripts
│   └── run-final-migration.ps1 (PowerShell runner)
│
├── Documentation
│   ├── README-MIGRATION.md (This file)
│   ├── MIGRATION-GUIDE.md (Complete guide)
│   ├── MIGRATION-SUMMARY.md (Executive summary)
│   ├── MIGRATION-CHECKLIST.md (Execution checklist)
│   ├── QUICK-START.md (Quick reference)
│   └── TABLE_ANALYSIS.md (Original analysis)
│
├── Code Updates (Already Applied)
│   ├── fets-point/src/types/database.types.ts
│   ├── fets-point/src/lib/supabase.ts
│   └── .mcp.json
│
└── Legacy Scripts (Reference Only)
    ├── migrate-to-staff-profiles.sql
    ├── fix-data-final.sql
    └── sync-profile-data.js
```

---

**Version**: 1.0  
**Status**: ✅ Ready for Production  
**Last Updated**: 2025  
**Risk Level**: Low-Medium  
**Reversible**: Yes  

**🚀 Let's consolidate those tables!**
