# Database Table Analysis: profiles vs staff_profiles

## Executive Summary

The codebase currently has TWO user profile tables causing confusion:
- **profiles** (legacy table with 24 columns)
- **staff_profiles** (current table with 14 columns)

**Recommendation**: Migrate all features to use **staff_profiles** and deprecate the **profiles** table.

---

## Table Comparison

### profiles Table
**Columns** (24 total):
- access_level, avatar_url, base_centre, bio, branch_assigned, centre
- certificates_obtained, cover_image_url, created_at, department, email
- employee_id, full_name, id, join_date, leaves_taken, location
- phone, position, profile_picture_url, role, tasks_assigned
- total_overtime_hours, training_modules_completed, updated_at, user_id

**Foreign Key References** (4 tables):
1. incidents.user_id → profiles.id
2. kudos.giver_id → profiles.id
3. kudos.receiver_id → profiles.id
4. vault.author_id → profiles.id
5. vault_item_pins.user_id → profiles.id

### staff_profiles Table
**Columns** (14 total):
- avatar_url, base_centre, branch_assigned, certifications (array)
- created_at, department, email, full_name, hire_date, id
- is_online, notes, phone, role, skills (array), status
- updated_at, user_id

**Foreign Key References** (18 tables):
1. chat_messages.author_id → staff_profiles.id
2. chat_messages.recipient_id → staff_profiles.id
3. checklist_items.assigned_to → staff_profiles.id
4. checklist_items.completed_by → staff_profiles.id
5. conversation_members.user_id → staff_profiles.id
6. conversations.created_by → staff_profiles.id
7. desktop_post_comments.author_id → staff_profiles.id
8. desktop_post_likes.user_id → staff_profiles.id
9. desktop_public_posts.author_id → staff_profiles.id
10. message_read_receipts.user_id → staff_profiles.id
11. messages.sender_id → staff_profiles.id
12. post_comments.author_id → staff_profiles.id
13. post_likes.user_id → staff_profiles.id
14. posts.author_id → staff_profiles.id
15. roster_schedules.profile_id → staff_profiles.id
16. staff_schedules.staff_profile_id → staff_profiles.id
17. typing_indicators.user_id → staff_profiles.id
18. wall_comments.user_id → staff_profiles.id
19. wall_likes.user_id → staff_profiles.id
20. wall_posts.author_id → staff_profiles.id

---

## Code Usage Analysis

### Files Using **profiles** (4 files):
1. `src/App.tsx` - Connection testing only
2. `src/components/Login.tsx` - Connection testing only
3. `src/components/SettingsPage.tsx` - Profile update
4. `src/services/api.service.ts` - profilesService methods

### Files Using **staff_profiles** (11 files):
1. `src/contexts/AuthContext.tsx` - Main authentication (CRITICAL)
2. `src/services/api.service.ts` - staffService methods
3. `src/hooks/useFetsConnect.ts` - Social features
4. `src/hooks/useSocial.ts` - Social features
5. `src/hooks/useStaffManagement.ts` - Staff CRUD
6. `src/components/FetsConnectNew.tsx` - Chat/messaging
7. `src/components/FetsRoster.tsx` - Roster management
8. `src/components/FetsRosterPremium.tsx` - Roster management
9. `src/components/ProfilePictureUpload.tsx` - Avatar uploads
10. `src/components/ResourceCentre.tsx` - Resource management
11. `src/components/ShiftSwapModal.tsx` - Shift management

### Key Findings:
- **AuthContext loads from staff_profiles** - This is the source of truth
- profiles table is only used for connection testing and a few legacy features
- 18 database tables reference staff_profiles vs only 5 for profiles
- Most active features (chat, posts, roster, social) use staff_profiles

---

## Features by Table

### Features Using staff_profiles ✅
- **Authentication** (AuthContext)
- **FETS Connect** (Chat, Messaging, Conversations)
- **Social Features** (Posts, Comments, Likes, Wall)
- **Roster Management** (Schedules, Shifts)
- **Staff Management** (CRUD operations)
- **Task Management** (Checklists, Assignments)
- **Real-time Features** (Typing indicators, Presence)

### Features Using profiles ⚠️
- **Incident Management** (incidents.user_id)
- **Kudos System** (kudos.giver_id, kudos.receiver_id)
- **Resource Vault** (vault.author_id, vault_item_pins.user_id)
- **Connection Testing** (App.tsx, Login.tsx)
- **Settings Page** (Profile updates)

---

## Migration Strategy

### Phase 1: Update Database Foreign Keys (Database-side)
```sql
-- Update incidents table
ALTER TABLE incidents
  DROP CONSTRAINT incidents_reported_by_fkey;

ALTER TABLE incidents
  ADD CONSTRAINT incidents_reported_by_fkey
  FOREIGN KEY (user_id)
  REFERENCES staff_profiles(id);

-- Update kudos table
ALTER TABLE kudos
  DROP CONSTRAINT kudos_giver_id_fkey,
  DROP CONSTRAINT kudos_receiver_id_fkey;

ALTER TABLE kudos
  ADD CONSTRAINT kudos_giver_id_fkey
  FOREIGN KEY (giver_id)
  REFERENCES staff_profiles(id),
  ADD CONSTRAINT kudos_receiver_id_fkey
  FOREIGN KEY (receiver_id)
  REFERENCES staff_profiles(id);

-- Update vault table
ALTER TABLE vault
  DROP CONSTRAINT vault_author_id_fkey;

ALTER TABLE vault
  ADD CONSTRAINT vault_author_id_fkey
  FOREIGN KEY (author_id)
  REFERENCES staff_profiles(id);

-- Update vault_item_pins table
ALTER TABLE vault_item_pins
  DROP CONSTRAINT vault_item_pins_user_id_fkey;

ALTER TABLE vault_item_pins
  ADD CONSTRAINT vault_item_pins_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES staff_profiles(id);
```

### Phase 2: Update Code References
Files to update:
1. `src/App.tsx` - Change connection test from `profiles` to `staff_profiles`
2. `src/components/Login.tsx` - Change connection test
3. `src/components/SettingsPage.tsx` - Change update from `profiles` to `staff_profiles`
4. `src/services/api.service.ts` - Remove `profilesService`, keep only `staffService`
5. `src/lib/supabase.ts` - Update helper functions

### Phase 3: Update Database Types
Regenerate `src/types/database.types.ts` after database migration

### Phase 4: Deprecate profiles Table
After verification, the profiles table can be:
1. Renamed to `profiles_deprecated`
2. Backed up
3. Eventually dropped

---

## Risk Assessment

### Low Risk ✅
- All major features already use staff_profiles
- AuthContext (source of truth) already uses staff_profiles
- Foreign key changes are straightforward

### Medium Risk ⚠️
- Incidents feature needs testing after migration
- Kudos system needs verification
- Vault/Resource center needs testing

### Mitigation
1. Create database backup before migration
2. Test each feature after code changes
3. Verify foreign key constraints work
4. Run integration tests

---

## Next Steps

1. ✅ Create this analysis document
2. Create SQL migration script
3. Update code references to use staff_profiles
4. Test all affected features
5. Deploy changes
6. Monitor for issues
7. Deprecate profiles table after 30 days

---

## Conclusion

**staff_profiles** is the de facto standard table in the codebase with 18 foreign key relationships vs only 5 for profiles. The migration is straightforward and will eliminate confusion, reduce technical debt, and provide a cleaner architecture.

**Estimated Time**: 2-3 hours for complete migration and testing
**Risk Level**: Low-Medium
**Impact**: High (eliminates major source of confusion)
