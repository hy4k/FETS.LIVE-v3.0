# Brainstorm Feature - Visual Guide

## 🎨 What the Feature Looks Like

### Main Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│  MY DESK                                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  [💬 FETS Connect]  [🗃️ Resource Centre]  [💡 Brainstorm] ← NEW TAB    │
│                                                                           │
├──────────────────────────────────────┬──────────────────────────────────┤
│                                      │                                   │
│  TEAM IDEAS (Left Side)              │  IMPORTANT DATES (Right Side)    │
│                                      │                                   │
│  ┌────────────────────────────────┐  │  ┌──────────────────────────────┐│
│  │ Share your idea...             │  │  │ [←] July 2025 [→]        [+] ││
│  │ [🟨🟦🟩🟪🟣🟧] [💡🚩⭐❓] [Add]│  │  │                              ││
│  └────────────────────────────────┘  │  │  S  M  T  W  T  F  S         ││
│                                      │  │        1  2  3  4  5         ││
│  👤 Alice Johnson                    │  │  6  7  8  9 10 11 12         ││
│  ┌──────┐ ┌──────┐ ┌──────┐         │  │ 13 14 15 16 17 18 19         ││
│  │ 🟨    │ │ 🟦    │ │ 🟩    │         │  │ 20●21 22 23 24 25 26         ││
│  │Outside│ │My top │ │I might│         │  │ 27 28 29 30 31              ││
│  │of work│ │priori │ │need   │         │  │                              ││
│  │...💡  │ │ties...│ │help...│         │  │ ● = Event on this day        ││
│  └──────┘ └──────┘ └──────┘         │  └──────────────────────────────┘│
│                                      │                                   │
│  👤 Bob Smith                        │  UPCOMING EVENTS                  │
│  ┌──────┐ ┌──────┐                  │  ┌──────────────────────────────┐│
│  │ 🟪    │ │ 🟧    │                  │  │ Project Deadline             ││
│  │Resear │ │URGENT │                  │  │ Jul 21, 2025           [🗑️] ││
│  │ch     │ │Bug fix│                  │  ├──────────────────────────────┤│
│  │topic  │ │needed │                  │  │ Team Meeting                 ││
│  │...🔍  │ │...🚩  │                  │  │ Jul 28, 2025           [🗑️] ││
│  └──────┘ └──────┘                  │  └──────────────────────────────┘│
│                                      │                                   │
└──────────────────────────────────────┴──────────────────────────────────┘
```

---

## 🎯 Feature Components

### 1. Sticky Note Colors

```
🟨 Yellow  - Default/General ideas
🟦 Blue    - Technical/Strategic thinking
🟩 Green   - Approved/Good to go
🟪 Pink    - Creative/Design ideas
🟣 Purple  - Research/Analysis
🟧 Orange  - Urgent/Important
```

### 2. Category Icons

```
💡 Idea     - General ideas and suggestions
🚩 Priority - High-priority items that need attention
⭐ Action   - Action items to be completed
❓ Question - Questions for team discussion
```

### 3. User Interactions

#### Creating a Note
```
1. Type idea → 2. Pick color → 3. Choose category → 4. Click Add
   ┌────────┐    ┌──────┐      ┌──────┐             ┌─────┐
   │ [Type] │    │ 🟨🟦  │      │ 💡🚩  │             │ Add │
   └────────┘    └──────┘      └──────┘             └─────┘
```

#### Editing Your Note
```
Hover over note → Click pencil icon → Edit text → Click checkmark
   ┌────────┐       ┌─────┐        ┌──────┐      ┌─────┐
   │ Note   │       │ ✏️   │        │ Edit │      │ ✓   │
   └────────┘       └─────┘        └──────┘      └─────┘
```

#### Deleting Your Note
```
Hover over note → Click trash icon → Confirm (note disappears)
   ┌────────┐       ┌─────┐
   │ Note   │       │ 🗑️   │        ✨ *poof*
   └────────┘       └─────┘
```

---

## 📅 Calendar Features

### Adding an Event
```
Click [+] → Fill form → Click Add Event
   ┌────┐    ┌──────────────┐    ┌──────────┐
   │ +  │    │ Title:       │    │ Add Event│
   └────┘    │ Date:        │    └──────────┘
             │ Type:        │
             └──────────────┘
```

### Calendar Navigation
```
[←] Previous Month    Current Month: July 2025    Next Month [→]
   ┌────┐             ┌────────────┐               ┌────┐
   │ ←  │             │ July 2025  │               │  → │
   └────┘             └────────────┘               └────┘
```

### Event Indicators
```
Regular Day: [ 15 ]      Day with Event: [15●]      Today: [15] (highlighted)
```

---

## 👥 Real-time Collaboration Flow

```
User A (Browser 1)                    User B (Browser 2)
─────────────────                     ─────────────────
│                                     │
│ 1. Creates sticky note              │
│    "New feature idea"               │
│    ▼                                │
│    Saves to database ──────────────→│ 2. Real-time update
│                                     │    ▼
│                                     │    Note appears instantly!
│                                     │
│ 3. Adds calendar event              │
│    "Launch date: Aug 1"             │
│    ▼                                │
│    Saves to database ──────────────→│ 4. Real-time update
│                                     │    ▼
│                                     │    Event appears on calendar!
```

---

## 🏗️ Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  BRAINSTORM COMPONENT (Brainstorm.tsx)                       │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Sticky Notes   │  │ Calendar       │  │ Event List     │ │
│  │ Section        │  │ Widget         │  │ Widget         │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                          ▲    ▼
                   ┌──────────────────┐
                   │  React Query     │
                   │  Hooks           │
                   │  (useBrainstorm) │
                   └──────────────────┘
                          ▲    ▼
                   ┌──────────────────┐
                   │  Service Layer   │
                   │  (brainstorm     │
                   │   Service)       │
                   └──────────────────┘
                          ▲    ▼
            ┌─────────────────────────────┐
            │  SUPABASE DATABASE          │
            │  ┌────────────────────────┐ │
            │  │ brainstorm_sessions    │ │
            │  │ brainstorm_notes       │ │ ◄── Real-time enabled
            │  │ brainstorm_events      │ │ ◄── Real-time enabled
            │  └────────────────────────┘ │
            └─────────────────────────────┘
```

---

## 🔐 Security Model

```
┌─────────────────────────────────────────────────────────┐
│  USER AUTHENTICATION                                    │
│  ┌──────────┐                                           │
│  │  Login   │ → Supabase Auth → staff_profiles table   │
│  └──────────┘                                           │
└─────────────────────────────────────────────────────────┘
                    ▼
┌─────────────────────────────────────────────────────────┐
│  ROW LEVEL SECURITY (RLS) POLICIES                      │
│                                                          │
│  ✅ Can View:  Sessions/Events from own branch          │
│  ✅ Can Create: Notes/Events in own branch              │
│  ✅ Can Edit:   Only own notes/events                   │
│  ✅ Can Delete: Only own notes/events                   │
│                                                          │
│  ❌ Cannot:    Access other branches' data              │
│  ❌ Cannot:    Edit others' content                     │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Data Flow

### Creating a Note

```
1. USER TYPES IDEA
   ↓
2. SELECTS COLOR & CATEGORY
   ↓
3. CLICKS "ADD"
   ↓
4. REACT COMPONENT
   └→ Calls: createNote.mutate(...)
      ↓
5. REACT QUERY HOOK
   └→ Calls: brainstormService.createNote(...)
      ↓
6. SERVICE LAYER
   └→ Executes: supabase.from('brainstorm_notes').insert(...)
      ↓
7. SUPABASE DATABASE
   └→ Stores note with RLS validation
      ↓
8. REAL-TIME BROADCAST
   └→ Notifies all connected clients
      ↓
9. ALL USERS SEE UPDATE
   └→ Query invalidated, UI refreshes
```

---

## 🎨 Color Palette

```css
/* Sticky Note Colors */
Yellow:  bg-yellow-100, border-yellow-300, text-yellow-900
Blue:    bg-blue-100,   border-blue-300,   text-blue-900
Green:   bg-green-100,  border-green-300,  text-green-900
Pink:    bg-pink-100,   border-pink-300,   text-pink-900
Purple:  bg-purple-100, border-purple-300, text-purple-900
Orange:  bg-orange-100, border-orange-300, text-orange-900

/* Primary Actions */
Amber:   bg-amber-600, hover:bg-amber-700 (buttons)
```

---

## 📱 Responsive Behavior

### Desktop (1024px+)
```
┌─────────────────────────────────────────────┐
│ [Team Ideas - 66%]  │  [Calendar - 33%]    │
│                     │                       │
│ Notes grid          │  Month view           │
│ 3 columns           │  Events list          │
└─────────────────────────────────────────────┘
```

### Tablet (768px - 1023px)
```
┌─────────────────────────────────────────────┐
│ [Team Ideas - Full Width]                   │
│ Notes grid - 2 columns                      │
├─────────────────────────────────────────────┤
│ [Calendar - Full Width]                     │
│ Month view + Events                         │
└─────────────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────┐
│ [Team Ideas]        │
│ Notes - 1 column    │
├─────────────────────┤
│ [Calendar]          │
│ Compact month view  │
│                     │
│ [Events List]       │
│ Scrollable          │
└─────────────────────┘
```

---

## ✨ Animation & Transitions

```
Note Creation:
  opacity: 0 → 1 (fade in)
  scale: 0.9 → 1 (grow)
  duration: 200ms

Note Deletion:
  opacity: 1 → 0 (fade out)
  scale: 1 → 0.9 (shrink)
  duration: 200ms

Hover Effects:
  shadow: sm → md (elevation)
  transition: 200ms ease

Edit Mode:
  background: subtle highlight
  border: focus ring (amber)
```

---

## 🎯 User Journey Map

```
STEP 1: Discovery
User navigates to My Desk → Sees new "Brainstorm" tab → Clicks it

STEP 2: First Impression
Sees clean interface with sticky notes and calendar → Reads placeholder text

STEP 3: First Action
Types an idea → Picks yellow color → Selects 💡 icon → Clicks "Add"

STEP 4: Success Feedback
Note appears instantly → Success toast shows "Note added" → User smiles 😊

STEP 5: Collaboration
Colleague's note appears in real-time → User thinks "Wow, this is cool!"

STEP 6: Engagement
User adds more notes → Edits previous note → Adds calendar event

STEP 7: Team Adoption
Team starts using it daily → Ideas flow → Innovation happens! 🚀
```

---

## 📈 Expected Usage Patterns

```
Daily Use:
├─ Morning: Check calendar for today's events
├─ During Day: Add ideas as they come
├─ Team Meetings: Reference brainstorm board
└─ End of Week: Review and archive ideas

Peak Times:
├─ Monday mornings (weekly planning)
├─ Before team meetings
└─ End of sprint (retrospectives)

Common Actions:
├─ Add idea: 60%
├─ Add event: 20%
├─ Edit note: 10%
├─ Delete note: 10%
```

---

**This visual guide helps you understand the brainstorm feature at a glance!** 👀✨
