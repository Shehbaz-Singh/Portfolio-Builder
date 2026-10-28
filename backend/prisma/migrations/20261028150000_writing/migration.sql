-- CreateEnum
CREATE TYPE "PostType" AS ENUM ('post', 'link');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'published');

-- AlterTable
ALTER TABLE "Profile" ALTER COLUMN "sectionConfig" SET DEFAULT '[{"key":"about","visible":true},{"key":"skills","visible":true},{"key":"experience","visible":true},{"key":"projects","visible":true},{"key":"education","visible":true},{"key":"testimonials","visible":false},{"key":"writing","visible":false}]';

-- CreateTable
CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "type" "PostType" NOT NULL DEFAULT 'post',
    "excerpt" VARCHAR(300),
    "body" TEXT,
    "externalUrl" TEXT,
    "coverImageUrl" TEXT,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Post_profileId_status_publishedAt_idx" ON "Post"("profileId", "status", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Post_profileId_slug_key" ON "Post"("profileId", "slug");

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing profiles get the new section in their layout, hidden until the owner switches it on.
UPDATE "Profile"
SET "sectionConfig" = "sectionConfig" || '[{"key":"writing","visible":false}]'::jsonb
WHERE NOT ("sectionConfig" @> '[{"key":"writing"}]'::jsonb);
