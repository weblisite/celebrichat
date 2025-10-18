-- Add is_public column to photos for public gallery toggling
ALTER TABLE photos ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;
