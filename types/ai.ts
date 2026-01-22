export interface GeminiCallOptions {
  prompt: string;
  responseSchema: any;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}
