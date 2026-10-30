-- AlterTable: the "Add to contacts" vCard starts switched off, without the photo, for every profile
ALTER TABLE "Profile" ADD COLUMN     "contactCardEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contactCardPhoto" BOOLEAN NOT NULL DEFAULT false;
