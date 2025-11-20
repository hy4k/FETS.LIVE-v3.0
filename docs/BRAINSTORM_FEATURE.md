# Brainstorm Feature Documentation

## Overview

The **Brainstorm** feature is a collaborative team ideation tool integrated into the My Desk page. It enables team members to:
- Share ideas using color-coded sticky notes
- Collaborate in real-time with branch colleagues
- Track important dates and milestones on a shared calendar
- Categorize ideas (idea, priority, action, question)

## Architecture

### Database Schema

Three new tables have been created:

1. **brainstorm_sessions** - Container for brainstorming sessions
   - Supports multi-branch filtering
   - Tracks session status (active, archived, completed)

2. **brainstorm_notes** - Sticky notes created by users
   - Color coding (yellow, blue, green, pink, purple, orange)
   - Category tagging (idea, priority, action, question)
   - User ownership for edit/delete permissions

3. **brainstorm_events** - Important dates and milestones
   - Event types (deadline, milestone, meeting, reminder)
   - Displayed on integrated calendar

### Features

#### Sticky Notes System
- **Add Notes**: Users can create sticky notes with custom colors and categories
- **Edit/Delete**: Users can only edit/delete their own notes
- **Real-time Updates**: Notes appear instantly for all team members using Supabase Realtime
- **Grouped by User**: Notes are organized by the team member who created them

#### Calendar Integration
- **Month View**: Navigate through months with previous/next buttons
- **Event Markers**: Days with events show a red dot indicator
- **Add Events**: Quick modal to add important dates
- **Upcoming Events List**: Shows next 10 events below calendar
- **Event Types**: Categorize as deadline, milestone, meeting, or reminder

#### Branch-Aware Collaboration
- Users only see sessions and events from their assigned branch
- Global sessions are visible to all users
- RLS policies enforce branch-level data access

## Installation

### 1. Run Database Migration

You need a Supabase access token to run the migration:

#### Get Your Access Token
1. Go to https://supabase.com/dashboard
2. Click on your profile icon (top right)
3. Select "Access Tokens"
4. Generate a new token or copy existing one

#### Run Migration (Option 1: Using Script)
```bash
# Set your access token
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Run the migration
node scripts/run-brainstorm-migration.js
```

#### Run Migration (Option 2: Manual SQL)
If you prefer to run the SQL manually:
1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
2. Navigate to SQL Editor
3. Copy contents of `scripts/create-brainstorm-tables.sql`
4. Paste and execute

### 2. Verify Installation

After migration, check that these tables exist:
- `brainstorm_sessions`
- `brainstorm_notes`
- `brainstorm_events`

Default sessions should be created for each branch:
- Calicut: "Team Ideas & Innovation"
- Irinjalakuda: "Team Ideas & Innovation"
- Kodungallur: "Team Ideas & Innovation"
- Global: "Global Innovation Hub"

## Usage

### Accessing Brainstorm

1. Navigate to **My Desk** from the main menu
2. Click the **Brainstorm** tab (lightbulb icon)
3. You'll see the brainstorming interface with:
   - Left side: Team Ideas section
   - Right side: Important Dates calendar

### Creating Sticky Notes

1. Type your idea in the text area
2. Select a color by clicking one of the color circles
3. Choose a category icon:
   - 💡 Idea - General ideas and suggestions
   - 🚩 Priority - High-priority items
   - ⭐ Action - Action items to complete
   - ❓ Question - Questions for discussion
4. Click **Add** or press Enter

### Managing Your Notes

- **Edit**: Hover over your note and click the edit (pencil) icon
- **Delete**: Hover over your note and click the trash icon
- **View Only**: Other users' notes are read-only

### Adding Important Dates

1. Click the **+** button on the calendar header
2. Fill in:
   - Event title
   - Date
   - Event type (deadline, milestone, meeting, reminder)
3. Click **Add Event**

### Calendar Features

- **Navigate Months**: Use left/right arrows to change months
- **Today Indicator**: Current day is highlighted in amber
- **Event Indicators**: Red dots show days with events
- **Upcoming Events**: List below calendar shows next events
- **Delete Events**: Hover over your events to see delete button

## Technical Details

### File Structure

```
fets-point/
├── src/
│   ├── components/
│   │   ├── Brainstorm.tsx          # Main component
│   │   └── MyDeskNew.tsx           # Updated with Brainstorm tab
│   ├── hooks/
│   │   └── useBrainstorm.ts        # React Query hooks
│   └── services/
│       └── api.service.ts          # Added brainstormService
scripts/
├── create-brainstorm-tables.sql     # Database schema
└── run-brainstorm-migration.js      # Migration runner
```

### Service Layer (`brainstormService`)

Located in `src/services/api.service.ts`:

**Session Methods:**
- `getSessions(branchLocation?)` - Fetch active sessions
- `createSession(session)` - Create new session
- `updateSession(id, updates)` - Update session

**Note Methods:**
- `getNotes(sessionId)` - Fetch all notes for session
- `createNote(note)` - Add new sticky note
- `updateNote(id, updates)` - Update note content/color
- `deleteNote(id)` - Remove note

**Event Methods:**
- `getEvents(branchLocation?)` - Fetch events for branch
- `createEvent(event)` - Add calendar event
- `updateEvent(id, updates)` - Update event details
- `deleteEvent(id)` - Remove event

### React Query Hooks

Located in `src/hooks/useBrainstorm.ts`:

**Query Hooks:**
- `useBrainstormSessions(branchLocation)` - Sessions query
- `useBrainstormNotes(sessionId)` - Notes query with real-time
- `useBrainstormEvents(branchLocation)` - Events query with real-time

**Mutation Hooks:**
- `useCreateBrainstormNote()` - Create note mutation
- `useUpdateBrainstormNote()` - Update note mutation
- `useDeleteBrainstormNote()` - Delete note mutation
- `useCreateBrainstormEvent()` - Create event mutation
- `useUpdateBrainstormEvent()` - Update event mutation
- `useDeleteBrainstormEvent()` - Delete event mutation

### Real-time Collaboration

The feature uses Supabase Realtime subscriptions:

**Notes Subscription:**
```typescript
supabase
  .channel(`brainstorm-notes:${sessionId}`)
  .on('postgres_changes', {
    event: '*',
    table: 'brainstorm_notes',
    filter: `session_id=eq.${sessionId}`
  }, callback)
```

**Events Subscription:**
```typescript
supabase
  .channel('brainstorm-events')
  .on('postgres_changes', {
    event: '*',
    table: 'brainstorm_events'
  }, callback)
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with policies:

**brainstorm_sessions:**
- Users can view sessions from their branch or global
- Users can create sessions in their assigned branch
- Users can only update their own sessions

**brainstorm_notes:**
- Users can view notes from accessible sessions
- Users can create notes in accessible sessions
- Users can only update/delete their own notes

**brainstorm_events:**
- Users can view events from their branch or global
- Users can create events in their assigned branch
- Users can only update/delete their own events

### Authentication

All operations require authenticated users:
- Uses `auth.uid()` to identify current user
- Foreign keys reference `staff_profiles.id`
- User profile data populated via joins

## Troubleshooting

### Migration Fails

**Error: SUPABASE_ACCESS_TOKEN not set**
- Solution: Export your access token before running migration
- Get token from: https://supabase.com/dashboard → Profile → Access Tokens

**Error: Table already exists**
- Solution: Tables were already created, no action needed
- Verify by checking Supabase Dashboard → Database → Tables

### Notes Not Appearing

**Check Session:**
- Verify active session exists for your branch
- Check browser console for errors
- Refresh the page

**Check Permissions:**
- Ensure you're authenticated (profile loaded)
- Verify branch assignment in staff_profiles

### Real-time Not Working

**Realtime Not Enabled:**
- Go to Supabase Dashboard → Database → Replication
- Enable replication for `brainstorm_notes` and `brainstorm_events`

**Network Issues:**
- Check browser network tab for websocket connections
- Verify Supabase project status

## Future Enhancements

Potential improvements:
- [ ] Session templates for different brainstorming types
- [ ] Export brainstorm sessions as PDF/docs
- [ ] Voting system for ideas
- [ ] Tag/label system for better organization
- [ ] Search and filter notes
- [ ] Archive completed sessions
- [ ] Notification system for new events
- [ ] Attach files/images to notes
- [ ] Integration with task management

## Support

For issues or questions:
1. Check this documentation
2. Review browser console for errors
3. Check Supabase logs in Dashboard
4. Contact development team

---

**Created:** 2025
**Version:** 1.0.0
**Status:** Production Ready
