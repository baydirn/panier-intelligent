-- CreateUser table
CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "displayName" TEXT,
  "tier" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateSharedList table
CREATE TABLE IF NOT EXISTS "SharedList" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "ownerId" TEXT NOT NULL REFERENCES "User"("id"),
  "title" TEXT NOT NULL,
  "shareCode" TEXT NOT NULL UNIQUE,
  "data" JSONB NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateSharedListMember table
CREATE TABLE IF NOT EXISTS "SharedListMember" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "listId" TEXT NOT NULL REFERENCES "SharedList"("id"),
  "userId" TEXT NOT NULL REFERENCES "User"("id"),
  "role" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE ("listId", "userId")
);

-- CreatePartnerStore table
CREATE TABLE IF NOT EXISTS "PartnerStore" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "priorityBoost" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreatePriceHistory table
CREATE TABLE IF NOT EXISTS "PriceHistory" (
  "id" SERIAL NOT NULL PRIMARY KEY,
  "productId" TEXT NOT NULL,
  "storeCode" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'CAD',
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "listId" TEXT REFERENCES "SharedList"("id")
);

-- CreateIndex on User
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

-- CreateIndex on SharedList
CREATE INDEX IF NOT EXISTS "SharedList_ownerId_idx" ON "SharedList"("ownerId");
CREATE INDEX IF NOT EXISTS "SharedList_shareCode_idx" ON "SharedList"("shareCode");

-- CreateIndex on SharedListMember
CREATE INDEX IF NOT EXISTS "SharedListMember_listId_idx" ON "SharedListMember"("listId");
CREATE INDEX IF NOT EXISTS "SharedListMember_userId_idx" ON "SharedListMember"("userId");

-- CreateIndex on PartnerStore
CREATE INDEX IF NOT EXISTS "PartnerStore_code_idx" ON "PartnerStore"("code");

-- CreateIndex on PriceHistory
CREATE INDEX IF NOT EXISTS "PriceHistory_productId_idx" ON "PriceHistory"("productId");
CREATE INDEX IF NOT EXISTS "PriceHistory_storeCode_idx" ON "PriceHistory"("storeCode");
CREATE INDEX IF NOT EXISTS "PriceHistory_listId_idx" ON "PriceHistory"("listId");
