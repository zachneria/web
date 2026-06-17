import { loadStripe, type Stripe } from "@stripe/stripe-js";

// Publishable key is safe to ship to the browser. Test-mode default; override
// with NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (set the live key in Vercel for prod).
const KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  "pk_test_51ThHLY42r5A0CfOpr8JlRGEJvouKz64Y7SsNQBwbVLB07DrtSpg7TFDBNpIhg88iTOyyIPsLvE9E9JabosRJjP5U0018uDncUq";

let promise: Promise<Stripe | null> | null = null;
export const getStripe = (): Promise<Stripe | null> => {
  if (!promise) promise = loadStripe(KEY);
  return promise;
};
