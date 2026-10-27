-- The theme set is now editorial, bento, soft, executive and creative. Profiles on a removed theme
-- move to the closest new one, and new profiles start on editorial.
ALTER TABLE "Profile" ALTER COLUMN "theme" SET DEFAULT 'editorial';

UPDATE "Profile"
SET "theme" = CASE "theme"
  WHEN 'minimal' THEN 'editorial'
  WHEN 'dark' THEN 'bento'
  WHEN 'classic' THEN 'executive'
END
WHERE "theme" IN ('minimal', 'dark', 'classic');
