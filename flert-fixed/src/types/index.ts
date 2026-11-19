// Tipos de plano vêm da fonte única em @/lib/plans.
export type { PlanId as SubscriptionPlan, PaidPlan } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  subscriptionStatus: PlanId;
}

export interface AnalysisHistory {
  id: string;
  title: string | null;
  style: string;
  date: string;
  suggestions: string[];
}
