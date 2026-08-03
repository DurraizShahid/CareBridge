import OpenAI from "openai";

const OPENCODE_BASE_URL_DEFAULT = "http://localhost:20128/v1";

let opencodeClient: OpenAI | null = null;

export function getOpenCodeClient(): OpenAI {
  if (!opencodeClient) {
    opencodeClient = new OpenAI({
      apiKey: process.env.OPENCODE_API_KEY ?? "local",
      baseURL: process.env.OPENCODE_BASE_URL ?? OPENCODE_BASE_URL_DEFAULT,
      timeout: 60_000,
      maxRetries: 0,
    });
  }
  return opencodeClient;
}

export function getOpenCodeModel(): string {
  return process.env.OPENCODE_MODEL ?? "auto/best-coding";
}
