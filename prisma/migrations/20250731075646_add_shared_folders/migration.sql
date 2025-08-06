-- CreateEnum
CREATE TYPE "AccessType" AS ENUM ('PREVIEW', 'PREVIEW_DOWNLOAD');

-- CreateTable
CREATE TABLE "SharedFolder" (
    "id" TEXT NOT NULL,
    "folderId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessType" "AccessType" NOT NULL DEFAULT 'PREVIEW',

    CONSTRAINT "SharedFolder_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "SharedFolder" ADD CONSTRAINT "SharedFolder_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
