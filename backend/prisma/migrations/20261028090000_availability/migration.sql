-- CreateEnum
CREATE TYPE "AvailabilityStatus" AS ENUM ('open_to_work', 'open_to_freelance', 'open_to_collaborate', 'custom');

-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "availabilityEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "availabilityMessage" VARCHAR(140),
ADD COLUMN     "availabilityStatus" "AvailabilityStatus" NOT NULL DEFAULT 'open_to_work';
