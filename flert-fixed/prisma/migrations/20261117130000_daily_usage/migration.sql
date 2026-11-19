-- CreateTable
CREATE TABLE "daily_usage" (
    "userId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "refunds" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_usage_pkey" PRIMARY KEY ("userId","day")
);

-- AddForeignKey
ALTER TABLE "daily_usage" ADD CONSTRAINT "daily_usage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

