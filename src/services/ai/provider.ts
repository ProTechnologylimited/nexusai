export type AiRequest = { model: string; system: string; prompt: string; maxTokens?: number };
export type AiResult = { text: string; inputTokens?: number; outputTokens?: number };

export interface AiProvider {
  id: string;
  label: string;
  models: { id: string; label: string }[];
  isConfigured(): boolean;
  generate(req: AiRequest): Promise<AiResult>;
}

export class AiProviderError extends Error {}
