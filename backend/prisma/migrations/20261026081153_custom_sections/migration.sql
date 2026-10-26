-- CreateTable
CREATE TABLE "CustomSection" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CustomSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomSectionItem" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "url" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CustomSectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomSection_profileId_idx" ON "CustomSection"("profileId");

-- CreateIndex
CREATE INDEX "CustomSectionItem_sectionId_idx" ON "CustomSectionItem"("sectionId");

-- AddForeignKey
ALTER TABLE "CustomSection" ADD CONSTRAINT "CustomSection_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomSectionItem" ADD CONSTRAINT "CustomSectionItem_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "CustomSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
