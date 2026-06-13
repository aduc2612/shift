-- Grant CRUD permissions to authenticated role
-- Required for RLS policies to work — without these, queries return "permission denied"

GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_preferences TO authenticated;
