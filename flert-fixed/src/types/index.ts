export const SUBSCRIPTION_PLANS = {
  FREE: "FREE",
  PREMIUM: "PREMIUM",
  LIFETIME: "LIFETIME",
} as const;

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS;

export interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  subscriptionStatus: SubscriptionPlan;
}

export interface AnalysisHistory {
  id: string;
  title: string | null;
  style: string;
  date: string;
  suggestions: string[];
}
