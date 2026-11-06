-- Adds Arcade Independence Square as a programme venue. Safe to apply where it already exists.
INSERT INTO "venues" ("id", "slug", "name", "sortOrder", "createdAt", "updatedAt")
VALUES (gen_random_uuid()::text, 'arcade-independence-square', 'Arcade Independence Square', 6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;
