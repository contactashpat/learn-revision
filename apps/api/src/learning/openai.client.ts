import { Provider } from '@nestjs/common';
import OpenAI from 'openai';
import type { ChatCompletionContentPart } from 'openai/resources/chat/completions';
import { CompletionClient, OPENAI_COMPLETION_CLIENT } from './learning.constants';

class OpenAiResponseClient implements CompletionClient {
  constructor(private readonly client: OpenAI) {}

  async completeJson(
    prompt: string,
    schema: Record<string, unknown>,
    maxTokens: number,
  ): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a structured assistant that always responds with JSON matching the provided schema.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'structured_output',
          schema,
        },
      },
      max_tokens: Math.max(128, maxTokens),
    });

    const message = response.choices[0]?.message;
    if (!message) {
      throw new Error('OpenAI returned no completion choices');
    }

    const { content } = message;
    const body = Array.isArray(content)
      ? content.map((part: ChatCompletionContentPart) => ('text' in part ? part.text : '')).join('')
      : content ?? '';

    if (!body.trim()) {
      throw new Error('OpenAI returned an empty response');
    }

    return body;
  }
}

export const openAiCompletionClientProvider: Provider<CompletionClient> = {
  provide: OPENAI_COMPLETION_CLIENT,
  useFactory: (): CompletionClient => {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return {
        async completeJson() {
          throw new Error('OpenAI API key is not configured');
        },
      } satisfies CompletionClient;
    }

    return new OpenAiResponseClient(
      new OpenAI({
        apiKey,
      }),
    );
  },
};
