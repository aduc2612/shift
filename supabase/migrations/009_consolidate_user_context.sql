-- Consolidate onboarding fields into a single user_context text column.
-- Onboarding still collects structured data; the client formats it into text.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS user_context text NOT NULL DEFAULT '';

-- Backfill from existing columns.
-- Format mirrors src/features/onboarding/utils.ts buildUserContextText().
DO $$
DECLARE
  rec RECORD;
  sections text[] := ARRAY[]::text[];
  persona_label text;
  peak_label text;
  pp_items text;
  hc_items text;
  hc_effective text[];
  section_text text;
BEGIN
  FOR rec IN SELECT * FROM user_preferences LOOP
    sections := ARRAY[]::text[];

    IF rec.persona IS NOT NULL AND rec.persona <> 'other' THEN
      persona_label := CASE rec.persona
        WHEN 'student' THEN 'Student'
        WHEN 'professional' THEN 'Professional / office worker'
        WHEN 'parent' THEN 'Parent managing a household'
        WHEN 'freelancer' THEN 'Freelancer / self-employed'
        WHEN 'shift_worker' THEN 'Shift worker or irregular hours'
        ELSE rec.persona
      END;
      sections := array_append(sections, 'Role: ' || persona_label);
    END IF;

    IF rec.pain_points IS NOT NULL AND array_length(rec.pain_points, 1) > 0 THEN
      pp_items := array_to_string(
        ARRAY(
          SELECT ' + ' || CASE v
            WHEN 'delay_collapse' THEN 'One delay collapses my whole schedule'
            WHEN 'no_priorities' THEN 'I don''t know what to tackle next'
            WHEN 'afternoon_slump' THEN 'I start strong but lose steam in the afternoon'
            WHEN 'replan_too_much' THEN 'I spend more time replanning than actually doing things'
            WHEN 'unfinished_guilt' THEN 'I feel guilty about tasks I did not finish'
            WHEN 'anxiety' THEN 'My to-do list gives me more anxiety than clarity'
            ELSE v
          END
          FROM unnest(rec.pain_points) AS v
        ),
        E'\n'
      );
      sections := array_append(sections, 'Pain points:' || E'\n' || pp_items);
    END IF;

    IF 'none' = ANY(rec.hard_constraints) THEN
      sections := array_append(sections, 'Priorities: None — full flexibility');
    ELSIF rec.hard_constraints IS NOT NULL AND array_length(rec.hard_constraints, 1) > 0 THEN
      hc_effective := array(
        SELECT v FROM unnest(rec.hard_constraints) AS v WHERE v <> 'none'
      );
      IF array_length(hc_effective, 1) > 0 THEN
        hc_items := array_to_string(
          ARRAY(
            SELECT ' + ' || CASE v
              WHEN 'morning_routine' THEN 'Morning routine / gym'
              WHEN 'school' THEN 'School or class schedule'
              WHEN 'work_hours' THEN 'Work hours'
              WHEN 'childcare' THEN 'Childcare or pickups'
              WHEN 'medical' THEN 'Medication or appointments'
              ELSE v
            END
            FROM unnest(hc_effective) AS v
          ),
          E'\n'
        );
        sections := array_append(sections, 'Priorities:' || E'\n' || hc_items);
      END IF;
    END IF;

    IF rec.productivity_peak IS NOT NULL THEN
      peak_label := initcap(rec.productivity_peak);
      sections := array_append(sections, 'Productivity peak: ' || peak_label);
    END IF;

    IF rec.scheduling_context IS NOT NULL AND btrim(rec.scheduling_context) <> '' THEN
      sections := array_append(sections, 'Additional context: ' || btrim(rec.scheduling_context));
    END IF;

    section_text := array_to_string(sections, E'\n\n');

    UPDATE user_preferences
       SET user_context = section_text
     WHERE user_id = rec.user_id;
  END LOOP;
END $$;

-- Drop the now-redundant structured columns.
ALTER TABLE user_preferences
  DROP COLUMN IF EXISTS persona,
  DROP COLUMN IF EXISTS pain_points,
  DROP COLUMN IF EXISTS hard_constraints,
  DROP COLUMN IF EXISTS productivity_peak,
  DROP COLUMN IF EXISTS scheduling_context;

COMMENT ON COLUMN user_preferences.user_context IS
  'Freeform text describing the user''s role, pain points, priorities, productivity peak, and any extra context. Editable directly in settings.';
