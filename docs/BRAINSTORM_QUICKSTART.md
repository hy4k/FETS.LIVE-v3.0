# Brainstorm Feature - Quick Start Guide

## What Was Created

A complete collaborative brainstorming tool for team ideation with real-time updates!

### Features
- **Sticky Notes System** with color coding and categories
- **Real-time Collaboration** - see updates instantly
- **Shared Calendar** for important dates and milestones
- **Branch-Aware** - collaborate with your team
- **User-Friendly UI** - intuitive and beautiful

## Setup (Required!)

### Run the Database Migration

Before using the feature, you need to create the database tables:

```bash
# 1. Get your Supabase Access Token
# Go to: https://supabase.com/dashboard → Profile → Access Tokens

# 2. Set the token in your environment
export SUPABASE_ACCESS_TOKEN="your-token-here"

# 3. Run the migration
node scripts/run-brainstorm-migration.js
```

**Alternative:** Run SQL manually in Supabase Dashboard
- Copy: `scripts/create-brainstorm-tables.sql`
- Paste into: Supabase Dashboard → SQL Editor
- Execute

## How to Use

### 1. Access the Feature
1. Go to **My Desk** page
2. Click the **Brainstorm** tab (💡 icon)

### 2. Add Ideas
1. Type your idea in the text box
2. Choose a color (yellow, blue, green, pink, purple, orange)
3. Pick a category:
   - 💡 **Idea** - General ideas
   - 🚩 **Priority** - High priority
   - ⭐ **Action** - Action items
   - ❓ **Question** - Questions
4. Click **Add** or press Enter

### 3. Manage Notes
- **Edit**: Click pencil icon on your notes
- **Delete**: Click trash icon on your notes
- Notes are grouped by team member

### 4. Track Important Dates
1. Click **+** on calendar
2. Enter event details
3. View upcoming events in the list

## Files Created

```
📁 FETS.LIVE-2025/
├── 📄 scripts/
│   ├── create-brainstorm-tables.sql       ← Database schema
│   └── run-brainstorm-migration.js        ← Migration script
├── 📁 fets-point/src/
│   ├── 📄 components/
│   │   ├── Brainstorm.tsx                 ← Main component
│   │   └── MyDeskNew.tsx                  ← Updated (added tab)
│   ├── 📄 hooks/
│   │   └── useBrainstorm.ts               ← React Query hooks
│   └── 📄 services/
│       └── api.service.ts                 ← Updated (added service)
├── 📄 BRAINSTORM_FEATURE.md               ← Full documentation
└── 📄 BRAINSTORM_QUICKSTART.md            ← This file
```

## Color Coding

- **Yellow** 🟨 - Default/General ideas
- **Blue** 🟦 - Technical/Strategic
- **Green** 🟩 - Approved/Good to go
- **Pink** 🟪 - Creative/Design
- **Purple** 🟣 - Research/Analysis
- **Orange** 🟧 - Urgent/Important

## Real-time Magic

- Notes appear **instantly** for all team members
- Calendar events sync **automatically**
- No refresh needed!

## Next Steps

1. ✅ Run the database migration (required!)
2. ✅ Start your dev server: `pnpm dev`
3. ✅ Navigate to My Desk → Brainstorm
4. ✅ Start collaborating!

## Need Help?

See [BRAINSTORM_FEATURE.md](BRAINSTORM_FEATURE.md) for:
- Complete architecture details
- API documentation
- Troubleshooting guide
- Security information

---

**Happy Brainstorming! 💡**
