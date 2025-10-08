export const OPENAI_COMPLETION_CLIENT = Symbol('OPENAI_COMPLETION_CLIENT');

export interface CompletionOptions {
  temperature?: number;
}

export interface CompletionClient {
  completeJson(
    prompt: string,
    schema: Record<string, unknown>,
    maxTokens: number,
    options?: CompletionOptions
  ): Promise<string>;
}
