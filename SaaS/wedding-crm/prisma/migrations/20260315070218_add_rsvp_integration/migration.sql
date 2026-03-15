-- AlterTable
ALTER TABLE "Wedding" ADD COLUMN "rsvpApiKey" TEXT;
ALTER TABLE "Wedding" ADD COLUMN "rsvpPlatformUrl" TEXT;
ALTER TABLE "Wedding" ADD COLUMN "rsvpWeddingId" TEXT;

-- CreateTable
CREATE TABLE "RSVPGuest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "weddingId" TEXT NOT NULL,
    "rsvpGuestId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "side" TEXT,
    "groupTag" TEXT,
    "isVip" BOOLEAN NOT NULL DEFAULT false,
    "dietaryPref" TEXT,
    "overallStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "rsvpData" TEXT,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RSVPGuest_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "Wedding" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "RSVPGuest_weddingId_rsvpGuestId_key" ON "RSVPGuest"("weddingId", "rsvpGuestId");

-- CreateIndex
CREATE UNIQUE INDEX "RSVPGuest_weddingId_phone_key" ON "RSVPGuest"("weddingId", "phone");
