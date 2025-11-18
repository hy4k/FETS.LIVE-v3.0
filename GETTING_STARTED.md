# 🚀 Getting Started with Brainstorm Feature

## Quick Checklist

### Step 1: Run Database Migration ⚠️ REQUIRED

The brainstorm feature needs 3 new database tables. You must run this migration first!

#### Get Your Supabase Access Token

1. Visit: https://supabase.com/dashboard
2. Click your profile icon (top right)
3. Select **"Access Tokens"**
4. Copy your token (or generate a new one)

#### Run the Migration

**On Windows (PowerShell/CMD):**
```powershell
# Set the environment variable
set SUPABASE_ACCESS_TOKEN=your-token-here

# Run the migration
node scripts/run-brainstorm-migration.js
```

**On Mac/Linux:**
```bash
# Set the environment variable
export SUPABASE_ACCESS_TOKEN="your-token-here"

# Run the migration
node scripts/run-brainstorm-migration.js
```

**Alternative: Manual SQL Execution**

If the script doesn't work:
1. Go to: https://supabase.com/dashboard/project/qqewusetilxxfvfkmsed
2. Navigate to: **SQL Editor**
3. Open file: `scripts/create-brainstorm-tables.sql`
4. Copy all content
5. Paste in SQL Editor
6. Click **Run**

#### Verify Success

You should see output like:
```
✅ Loaded SQL migration file
🔄 Running database migration...
✅ Migration completed successfully!

Created tables:
  - brainstorm_sessions
  - brainstorm_notes
  - brainstorm_events
```

---

### Step 2: Start Development Server

```bash
cd fets-point
pnpm dev
```

The app will start at: http://localhost:5173

---

### Step 3: Test the Feature

1. **Login** to your FETS.LIVE account
2. Navigate to **My Desk** (from main menu)
3. Click the **Brainstorm** tab (💡 lightbulb icon)
4. You should see:
   - Left side: Team Ideas section
   - Right side: Important Dates calendar

---

### Step 4: Try Creating Content

#### Add Your First Sticky Note

1. Type an idea in the text box
2. Click a color circle (yellow, blue, green, etc.)
3. Choose a category icon (💡 idea, 🚩 priority, ⭐ action, ❓ question)
4. Click **Add** or press Enter

Your note should appear instantly!

#### Add a Calendar Event

1. Click the **+** button on the calendar
2. Fill in:
   - Event title
   - Date
   - Event type (deadline, milestone, meeting, reminder)
3. Click **Add Event**

The event should appear on the calendar!

---

### Step 5: Test Real-time Collaboration

To verify real-time updates work:

1. Open the app in 2 different browser windows
2. Login as 2 different users (or use incognito mode)
3. Both navigate to My Desk → Brainstorm
4. Add a note in one window
5. **It should appear instantly in the other window!** ✨

---

## 🎉 You're All Set!

The brainstorm feature is now fully functional. Your team can:

- ✅ Share ideas with color-coded sticky notes
- ✅ Categorize thoughts (ideas, priorities, actions, questions)
- ✅ Collaborate in real-time
- ✅ Track important dates on a shared calendar
- ✅ Edit and manage their own content

---

## 📖 Additional Resources

- **Quick Start Guide:** [BRAINSTORM_QUICKSTART.md](BRAINSTORM_QUICKSTART.md)
- **Full Documentation:** [BRAINSTORM_FEATURE.md](BRAINSTORM_FEATURE.md)
- **Implementation Summary:** [BRAINSTORM_IMPLEMENTATION_SUMMARY.md](BRAINSTORM_IMPLEMENTATION_SUMMARY.md)

---

## ❓ Troubleshooting

### "No active brainstorm session" message

**Solution:** The database migration didn't run properly. Check that:
- The 3 tables exist in Supabase Dashboard
- Default sessions were created
- Your branch has an active session

### Notes not appearing in real-time

**Solution:** Enable Supabase Realtime:
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for `brainstorm_notes` and `brainstorm_events` tables

### Can't create notes/events

**Solution:** Check authentication:
- Ensure you're logged in
- Check browser console for errors
- Verify your profile is loaded in `staff_profiles` table

---

## 🆘 Need Help?

1. Check the documentation files above
2. Review browser console for error messages
3. Check Supabase logs in Dashboard
4. Contact your development team

---

**Happy Brainstorming! 💡🎨📅**
