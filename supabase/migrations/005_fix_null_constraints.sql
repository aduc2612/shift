-- Migration: Add NOT NULL constraints to pain_points and hard_constraints
-- Run this after 004_add_onboarding_fields.sql

ALTER TABLE user_preferences
  ALTER COLUMN pain_points SET NOT NULL,
  ALTER COLUMN hard_constraints SET NOT NULL;
