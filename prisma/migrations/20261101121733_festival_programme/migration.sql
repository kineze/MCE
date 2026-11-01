-- CreateEnum
CREATE TYPE "SessionKind" AS ENUM ('PERFORMANCE', 'PANEL', 'CONVERSATION', 'WORKSHOP', 'FILM', 'COMMUNITY', 'OTHER');

-- CreateTable
CREATE TABLE "venues" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "address" VARCHAR(300),
    "mapUrl" VARCHAR(500),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "venues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programme_sessions" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" VARCHAR(2000),
    "kind" "SessionKind" NOT NULL DEFAULT 'OTHER',
    "venueId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "people" VARCHAR(500),
    "moderator" VARCHAR(160),
    "highlight" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "notes" VARCHAR(2000),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programme_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "venues_slug_key" ON "venues"("slug");

-- CreateIndex
CREATE INDEX "programme_sessions_startsAt_idx" ON "programme_sessions"("startsAt");

-- CreateIndex
CREATE INDEX "programme_sessions_venueId_idx" ON "programme_sessions"("venueId");

-- CreateIndex
CREATE INDEX "programme_sessions_published_startsAt_idx" ON "programme_sessions"("published", "startsAt");

-- AddForeignKey
ALTER TABLE "programme_sessions" ADD CONSTRAINT "programme_sessions_venueId_fkey" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Programme permissions, granted to the super administrator role when it exists.
INSERT INTO "permissions" ("id", "key", "description", "createdAt", "updatedAt")
VALUES
    (gen_random_uuid()::text, 'programme.read', 'View the festival programme, including drafts', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    (gen_random_uuid()::text, 'programme.manage', 'Create, edit, publish and delete programme sessions', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

INSERT INTO "role_permissions" ("roleId", "permissionId", "grantedAt")
SELECT r."id", p."id", CURRENT_TIMESTAMP
FROM "roles" r
CROSS JOIN "permissions" p
WHERE r."key" = 'super_admin' AND p."key" IN ('programme.read', 'programme.manage')
ON CONFLICT DO NOTHING;
