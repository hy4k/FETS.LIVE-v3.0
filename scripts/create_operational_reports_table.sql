-- Create the operational_reports table
create table if not exists operational_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  period text not null, -- 'week', 'month', 'quarter'
  health_score numeric,
  resolution_velocity numeric,
  critical_issues integer,
  metrics jsonb, -- detailed stats
  insights jsonb, -- array of text insights
  report_text text -- the full generated text report
);

-- Enable RLS
alter table operational_reports enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
  on operational_reports for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on operational_reports for insert
  to authenticated
  with check (auth.uid() = created_by);
