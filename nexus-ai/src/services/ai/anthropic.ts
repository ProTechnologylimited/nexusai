import { AiProvider, AiProviderError } from "./provider";

// Calls the Messages API over HTTPS from the server only. Key is read from ANTHROPIC_API_KEY.
export const anthropicProvider: AiProvider = {
  id: "anthropic",
  label: "Anthropic Claude",
  models: [
    { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5" },
    { id: "claude-haiku-5-5", label: "Claude Haiku 5.5" },
    { id: "claude-opus-5-5", label: "Claude Opus 5.5" },
  ],
  isConfigured: () => !!process.env.ANTHROPIC_API_KEY,
  async generate({ model, system, prompt, maxTokens = 1024 }) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new AiProviderError("The AI provider is not configured.");

    let res: Response;
    try {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }),
        signal: AbortSignal.timeout(45_000),
      });
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "TimeoutError";
      throw new AiProviderError(timedOut ? "The AI provider timed out." : "Could not reach the AI provider.");
    }
    if (!res.ok) throw new AiProviderError(`The AI provider returned an error (HTTP ${res.status}).`);

    const data = (await res.json()) as {
      content?: { type: string; text?: string }[];
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = (data.content ?? []).filter((b) => b.type === "text").map((b) => b.text ?? "").join("");
    if (!text) throw new AiProviderError("The AI provider returned an empty response.");
    return { text, inputTokens: data.usage?.input_tokens, outputTokens: data.usage?.output_tokens };
  },
};
