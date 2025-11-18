-- Brainstorming Feature Tables
-- This enables team collaboration with sticky notes and shared calendar

-- Brainstorm Sessions Table
CREATE TABLE IF NOT EXISTS brainstorm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  branch_location TEXT NOT NULL CHECK (branch_location IN ('calicut', 'irinjalakuda', 'kodungallur', 'global')),
  created_by UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sticky Notes Table
CREATE TABLE IF NOT EXISTS brainstorm_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  user_id UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  color TEXT DEFAULT 'yellow' CHECK (color IN ('yellow', 'blue', 'green', 'pink', 'purple', 'orange')),
  category TEXT CHECK (category IN ('idea', 'priority', 'action', 'question')),
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Important Dates/Events Table
CREATE TABLE IF NOT EXISTS brainstorm_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES brainstorm_sessions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type TEXT DEFAULT 'deadline' CHECK (event_type IN ('deadline', 'milestone', 'meeting', 'reminder')),
  created_by UUID REFERENCES staff_profiles(id) ON DELETE CASCADE,
  branch_location TEXT NOT NULL CHECK (branch_location IN ('calicut', 'irinjalakuda', 'kodungallur', 'global')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_branch ON brainstorm_sessions(branch_location);
CREATE INDEX IF NOT EXISTS idx_brainstorm_sessions_status ON brainstorm_sessions(status);
CREATE INDEX IF NOT EXISTS idx_brainstorm_notes_session ON brainstorm_notes(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_notes_user ON brainstorm_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_events_session ON brainstorm_events(session_id);
CREATE INDEX IF NOT EXISTS idx_brainstorm_events_date ON brainstorm_events(event_date);
CREATE INDEX IF NOT EXISTS idx_brainstorm_events_branch ON brainstorm_events(branch_location);

-- Enable Row Level Security
ALTER TABLE brainstorm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE brainstorm_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for brainstorm_sessions
CREATE POLICY "Users can view sessions from their branch"
  ON brainstorm_sessions FOR SELECT
  USING (
    branch_location = 'global' OR
    branch_location IN (
      SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create sessions in their branch"
  ON brainstorm_sessions FOR INSERT
  WITH CHECK (
    branch_location IN (
      SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own sessions"
  ON brainstorm_sessions FOR UPDATE
  USING (created_by IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));

-- RLS Policies for brainstorm_notes
CREATE POLICY "Users can view notes from accessible sessions"
  ON brainstorm_notes FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM brainstorm_sessions WHERE
        branch_location = 'global' OR
        branch_location IN (
          SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can create notes in accessible sessions"
  ON brainstorm_notes FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM brainstorm_sessions WHERE
        branch_location = 'global' OR
        branch_location IN (
          SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
        )
    )
  );

CREATE POLICY "Users can update their own notes"
  ON brainstorm_notes FOR UPDATE
  USING (user_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own notes"
  ON brainstorm_notes FOR DELETE
  USING (user_id IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));

-- RLS Policies for brainstorm_events
CREATE POLICY "Users can view events from their branch"
  ON brainstorm_events FOR SELECT
  USING (
    branch_location = 'global' OR
    branch_location IN (
      SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create events in their branch"
  ON brainstorm_events FOR INSERT
  WITH CHECK (
    branch_location IN (
      SELECT branch_assigned FROM staff_profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own events"
  ON brainstorm_events FOR UPDATE
  USING (created_by IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own events"
  ON brainstorm_events FOR DELETE
  USING (created_by IN (SELECT id FROM staff_profiles WHERE user_id = auth.uid()));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_brainstorm_sessions_updated_at
  BEFORE UPDATE ON brainstorm_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorm_notes_updated_at
  BEFORE UPDATE ON brainstorm_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_brainstorm_events_updated_at
  BEFORE UPDATE ON brainstorm_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a default session for each branch
INSERT INTO brainstorm_sessions (title, description, branch_location, status)
VALUES
  ('Team Ideas & Innovation', 'Share your ideas and collaborate with the team', 'calicut', 'active'),
  ('Team Ideas & Innovation', 'Share your ideas and collaborate with the team', 'irinjalakuda', 'active'),
  ('Team Ideas & Innovation', 'Share your ideas and collaborate with the team', 'kodungallur', 'active'),
  ('Global Innovation Hub', 'Organization-wide brainstorming and innovation', 'global', 'active')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE brainstorm_sessions IS 'Brainstorming sessions for team collaboration';
COMMENT ON TABLE brainstorm_notes IS 'Sticky notes created by users during brainstorming';
COMMENT ON TABLE brainstorm_events IS 'Important dates and milestones for brainstorm sessions';
