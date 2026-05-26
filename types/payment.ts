import { User } from "./index";

export type StorePlan = "monthly" | "yearly";

export interface StorePlanOption {
  plan: StorePlan;
  title: string;
  price: string;
  period: string;
  badge?: string;
}

export interface PaywallModalProps {
  visible: boolean;
  onClose: () => void;
  reason?: string;
}

export interface StoreBillingUser extends Pick<User, "id" | "_id" | "email" | "username"> {}
