-- CreateEnum
CREATE TYPE "ReplyTime" AS ENUM ('same_day', 'within_2_days', 'within_a_week');

-- CreateEnum
CREATE TYPE "PreferredContact" AS ENUM ('email', 'linkedin', 'phone', 'any_visible_link');

-- AlterTable: the card starts switched off, with a closed week, for every existing profile
ALTER TABLE "Profile" ADD COLUMN     "preferredContact" "PreferredContact",
ADD COLUMN     "replyTime" "ReplyTime",
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "workCardEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "workNote" VARCHAR(140),
ADD COLUMN     "workingHours" JSONB NOT NULL DEFAULT '{"mon":[],"tue":[],"wed":[],"thu":[],"fri":[],"sat":[],"sun":[]}';
