-- Add ai_decides_time column (nullable initially)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_decides_time boolean;

-- Backfill existing rows to false (pre-AI tasks had explicit times)
UPDATE tasks SET ai_decides_time = false WHERE ai_decides_time IS NULL;

-- Set default for future inserts and enforce NOT NULL
ALTER TABLE tasks ALTER COLUMN ai_decides_time SET DEFAULT true;
ALTER TABLE tasks ALTER COLUMN ai_decides_time SET NOT NULL;

COMMENT ON COLUMN tasks.ai_decides_time IS 'When true, AI determines start/end times during reschedule. User time inputs disabled in edit mode.';
