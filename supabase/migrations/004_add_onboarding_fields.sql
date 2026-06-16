-- Add onboarding fields to user_preferences

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS persona text CHECK (
    persona IS NULL OR persona IN (
      'student', 'professional', 'parent', 'freelancer', 'shift_worker', 'other'
    )
  ),
  ADD COLUMN IF NOT EXISTS sleep_time time,
  ADD COLUMN IF NOT EXISTS pain_points text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hard_constraints text[] DEFAULT '{}';

-- Hard constraints array element check (Postgres doesn't enforce at array level,
-- but we document the valid values for application code)
COMMENT ON COLUMN user_preferences.persona IS 'One of: student, professional, parent, freelancer, shift_worker, other';
COMMENT ON COLUMN user_preferences.sleep_time IS 'When the user goes to bed (HH:MM)';
COMMENT ON COLUMN user_preferences.pain_points IS 'Array of: delay_collapse, no_priorities, afternoon_slump, replan_too_much, unfinished_guilt, anxiety';
COMMENT ON COLUMN user_preferences.hard_constraints IS 'Array of: morning_routine, school, work_hours, childcare, medical, none';
