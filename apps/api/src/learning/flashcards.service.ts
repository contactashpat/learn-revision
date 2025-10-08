import { Inject, Injectable, UnprocessableEntityException } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020';
import type { ValidateFunction } from 'ajv';
import { z } from 'zod';
import { getTemplate, type PromptTemplate, type TemplateTechnique } from '@learn/prompts';
import { OPENAI_COMPLETION_CLIENT, type CompletionClient } from './learning.constants';
import { CreateFlashcardsInput } from './dto/learning.inputs';
import { FlashcardsPayloadModel } from './models/learning.models';

const flashcardItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

const flashcardsInputSchema = z.object({
  topic: z.string().min(1),
  items: z.array(flashcardItemSchema).min(1),
});

type FlashcardsInput = z.infer<typeof flashcardsInputSchema>;

const flashcardResultItemSchema = z.object({
  index: z.number().int().min(1),
  question: z.string().min(5),
  answer: z.string().min(1).max(25),
});

const flashcardsResultSchema = z.object({
  flashcards: z.array(flashcardResultItemSchema).min(5).max(7),
});

type FlashcardsResult = z.infer<typeof flashcardsResultSchema>;

class FlashcardsValidationError extends Error {
  constructor(message: string, readonly cause?: unknown) {
    super(message);
    this.name = 'FlashcardsValidationError';
  }
}

@Injectable()
export class FlashcardsService {
  private static readonly TECHNIQUE: TemplateTechnique = 'flashcards_index_it';
  private readonly ajv = new Ajv2020({ allErrors: true, strict: false });
  private readonly schemaCache = new Map<string, ValidateFunction>();

  constructor(
    @Inject(OPENAI_COMPLETION_CLIENT)
    private readonly completionClient: CompletionClient,
  ) {}

  async createFlashcards(
    input: CreateFlashcardsInput,
    version?: string,
  ): Promise<FlashcardsPayloadModel> {
    const parsedInput = flashcardsInputSchema.parse(input);
    const template = getTemplate(FlashcardsService.TECHNIQUE, version);

    const attempts = 2;
    let lastError: FlashcardsValidationError | null = null;

    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const result = await this.generateFromTemplate(parsedInput, template);
        return {
          topic: parsedInput.topic,
          flashcards: result.flashcards.map((card) => ({
            index: card.index,
            question: card.question.trim(),
            answer: card.answer.trim(),
          })),
        };
      } catch (error) {
        if (error instanceof FlashcardsValidationError) {
          lastError = error;
          continue;
        }
        throw error;
      }
    }

    const message = lastError?.message ?? 'Unable to generate flashcards';
    throw new UnprocessableEntityException(message);
  }

  private async generateFromTemplate(
    input: FlashcardsInput,
    template: PromptTemplate,
  ): Promise<FlashcardsResult> {
    const prompt = this.renderPrompt(template, input);
    const raw = await this.completionClient.completeJson(
      prompt,
      template.responseSchema,
      this.estimateMaxTokens(template.guardrails.maxAnswerLength),
    );

    const json = this.parseResponse(raw);
    this.validateTemplateResponse(template, json);
    this.enforceGuardrails(template, json);

    const parsed = flashcardsResultSchema.safeParse(json);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map((issue) => {
          const path = issue.path.length > 0 ? issue.path.join('.') : '<root>';
          return `${path} ${issue.message}`;
        })
        .join('; ');
      throw new FlashcardsValidationError(`Flashcards validation failed: ${issues}`, parsed.error);
    }

    return parsed.data;
  }

  private renderPrompt(template: PromptTemplate, input: Record<string, unknown>): string {
    return [
      template.prompt.trim(),
      'Input payload:',
      JSON.stringify(input, null, 2),
      'Respond strictly with JSON matching the provided response schema.',
    ].join('\n\n');
  }

  private validateTemplateResponse(template: PromptTemplate, data: unknown): void {
    const key = `${template.technique}:${template.version}`;
    const validator = this.compileSchema(key, template.responseSchema);

    if (!validator(data)) {
      const message = (validator.errors || [])
        .map((error) => `${error.instancePath || '<root>'} ${error.message}`)
        .join('; ');
      throw new FlashcardsValidationError(`Response validation failed: ${message}`, validator.errors);
    }
  }

  private enforceGuardrails(template: PromptTemplate, data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      throw new FlashcardsValidationError('Guardrail enforcement failed: expected an object response');
    }

    const payload = data as Record<string, unknown>;

    for (const field of template.guardrails.requiredFields) {
      if (!(field in payload)) {
        throw new FlashcardsValidationError(`Guardrail violation: missing required field "${field}"`);
      }
    }

    const totalLength = JSON.stringify(payload).length;
    if (totalLength > template.guardrails.maxAnswerLength) {
      throw new FlashcardsValidationError('Guardrail violation: maxAnswerLength exceeded');
    }
  }

  private parseResponse(raw: string): unknown {
    const trimmed = raw.trim();

    try {
      return JSON.parse(trimmed);
    } catch (error) {
      const start = trimmed.indexOf('{');
      const end = trimmed.lastIndexOf('}');
      if (start !== -1 && end !== -1 && end > start) {
        const candidate = trimmed.slice(start, end + 1);
        try {
          return JSON.parse(candidate);
        } catch {
          throw new FlashcardsValidationError('Failed to parse JSON response from OpenAI', error);
        }
      }

      throw new FlashcardsValidationError('Failed to parse JSON response from OpenAI', error);
    }
  }

  private compileSchema(key: string, schema: Record<string, unknown>): ValidateFunction {
    const cached = this.schemaCache.get(key);
    if (cached) {
      return cached;
    }

    const validator = this.ajv.compile(schema);
    this.schemaCache.set(key, validator);
    return validator;
  }

  private estimateMaxTokens(maxAnswerLength: number): number {
    return Math.max(128, Math.ceil(maxAnswerLength / 4));
  }
}
