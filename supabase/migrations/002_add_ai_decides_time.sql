ALTER TABLE tasks ADD COLUMN IF NOT EXISTS ai_decides_time boolean NOT NULL DEFAULT true;
COMMENT ON COLUMN tasks.ai_decides_time IS 'When true, AI determines start/end times during reschedule. User time inputs disabled in edit mode.';
