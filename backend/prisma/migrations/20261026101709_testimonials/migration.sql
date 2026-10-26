-- CreateEnum
CREATE TYPE "TestimonialStatus" AS ENUM ('pending', 'approved', 'rejected');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "acceptTestimonials" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "sectionConfig" SET DEFAULT '[{"key":"about","visible":true},{"key":"skills","visible":true},{"key":"experience","visible":true},{"key":"projects","visible":true},{"key":"education","visible":true},{"key":"testimonials","visible":false}]';

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "authorRole" TEXT,
    "authorCompany" TEXT,
    "message" TEXT NOT NULL,
    "contactEmail" TEXT,
    "status" "TestimonialStatus" NOT NULL DEFAULT 'pending',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Testimonial_profileId_status_idx" ON "Testimonial"("profileId", "status");

-- AddForeignKey
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Existing profiles get the new section, hidden, after the others.
UPDATE "Profile"
SET "sectionConfig" = "sectionConfig" || '[{"key":"testimonials","visible":false}]'::jsonb
WHERE NOT ("sectionConfig" @> '[{"key":"testimonials"}]'::jsonb);
