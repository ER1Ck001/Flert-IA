// Direitos de uso do usuário (somente servidor).

import { prisma } from "@/lib/prisma";
import { getDailyLimit, getEffectivePlan, isPlanExpired, type PlanId } from "@/lib/plans";

export type Entitlement = {
  plan: PlanId;
  storedStatus: PlanId;
  expiresAt: Date | null;
  isPaid: boolean;
  isExpired: boolean;
  dailyLimit: number | null;
};

export async function getEntitlement(userId: string, now: Date = new Date()): Promise<Entitlement> {
  const sub = await prisma.subscriptionStatus.findUnique({
    where: { userId },
    select: { status: true, expiresAt: true },
  });
  const plan = getEffectivePlan(sub, now);
  return {
    plan,
    storedStatus: (sub?.status as PlanId | undefined) ?? "FREE",
    expiresAt: sub?.expiresAt ?? null,
    isPaid: plan !== "FREE",
    isExpired: isPlanExpired(sub, now),
    dailyLimit: getDailyLimit(plan),
  };
}
