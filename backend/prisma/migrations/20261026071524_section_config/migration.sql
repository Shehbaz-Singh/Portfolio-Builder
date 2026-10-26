-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "sectionConfig" JSONB NOT NULL DEFAULT '[{"key":"about","visible":true},{"key":"skills","visible":true},{"key":"experience","visible":true},{"key":"projects","visible":true},{"key":"education","visible":true}]';
