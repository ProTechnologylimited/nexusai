// Proposed starting prices, not verified market prices. Change freely.
export const PLANS = [
  { id: "FREE", name: "Free", priceUsd: 0, features: ["Limited AI usage", "Basic dashboard", "One basic agent", "Limited test workflows"] },
  { id: "STARTER", name: "Starter", priceUsd: 19, features: ["More AI usage", "Basic workflow automation", "Lead management", "Essential analytics"] },
  { id: "GROWTH", name: "Growth", priceUsd: 49, features: ["Multiple AI agents", "Expanded automation limits", "Marketing and CRM tools", "Advanced reporting"] },
  { id: "BUSINESS", name: "Business", priceUsd: 149, features: ["Higher usage limits", "Team features", "Advanced workflows", "Priority support, when available"] },
] as const;
