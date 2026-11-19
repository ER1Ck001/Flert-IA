-- CreateTable
CREATE TABLE "processed_payments" (
    "checkoutId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "SubscriptionPlan" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "processed_payments_pkey" PRIMARY KEY ("checkoutId")
);

-- CreateIndex
CREATE INDEX "processed_payments_userId_idx" ON "processed_payments"("userId");

-- AddForeignKey
ALTER TABLE "processed_payments" ADD CONSTRAINT "processed_payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

