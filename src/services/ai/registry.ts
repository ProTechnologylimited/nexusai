import { anthropicProvider } from "./anthropic";
import type { AiProvider } from "./provider";

const PROVIDERS: AiProvider[] = [anthropicProvider]; // add more providers here

export const getProvider = (id: string) => PROVIDERS.find((p) => p.id === id);
export const getConfiguredProviders = () => PROVIDERS.filter((p) => p.isConfigured());
export const isValidModel = (providerId: string, modelId: string) =>
  !!getProvider(providerId)?.models.some((m) => m.id === modelId);
