-- Migration: Add health profile history tracking
-- Purpose: Store historical changes to user height and weight for analytics

-- Add profile columns to users table if they don't exist
ALTER TABLE users
ADD COLUMN IF NOT EXISTS height_cm numeric,
ADD COLUMN IF NOT EXISTS weight_kg numeric,
ADD COLUMN IF NOT EXISTS medical_conditions text;

-- Create user_health_profile_history table
CREATE TABLE IF NOT EXISTS user_health_profile_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  height_cm numeric,
  weight_kg numeric,
  medical_conditions text,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_user_health_profile_history_user_id 
ON user_health_profile_history(user_id);

CREATE INDEX IF NOT EXISTS idx_user_health_profile_history_created_at 
ON user_health_profile_history(created_at DESC);
