import { Inject, Injectable } from '@nestjs/common';
import Ajv2020 from 'ajv/dist/2020';
import type { ValidateFunction } from 'ajv';
import { z } from 'zod';
import {
  getTemplate,
  TEMPLATE_TECHNIQUES,
  type PromptTemplate,
  type TemplateTechnique,
} from '@learn/prompts';
import { OPENAI_COMPLETION_CLIENT } from './learning.constants';
import type { CompletionClient } from './learning.constants';
import {
  CoachLevel,
  CoachResponseModel,
  FlashcardsPayloadModel,
  MnemonicPayloadModel,
  StoryPayloadModel,
  TechniqueTemplateModel,
} from './models/learning.models';
import {
  CoachInput,
  CreateFlashcardsInput,
  CreateMnemonicInput,
  CreateStoryInput,
} from './dto/learning.inputs';

const mnemonicInputSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

type MnemonicInput = z.infer<typeof mnemonicInputSchema>;

type MnemonicResult = {
  mnemonic: string;
  explanation: string;
  keywords: string[];
};

const storyInputSchema = z.object({
  concepts: z.array(z.string().min(1)).min(1),
  targetAudience: z.string().min(1),
  learningGoal: z.string().min(1),
});

type StoryInput = z.infer<typeof storyInputSchema>;

type StoryResult = {
  story: string;
  summary: string;
  keyPoints: string[];
};

const flashcardItemSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
});

const flashcardsInputSchema = z.object({
  topic: z.string().min(1),
  items: z.array(flashcardItemSchema).min(1),
});

type FlashcardsInput = z.infer<typeof flashcardsInputSchema>;

type FlashcardsResult = {
  flashcards: Array<{
    index: number;
    question: string;
    answer: string;
  }>;
};

const coachInputSchema = z.object({
  topic: z.string().min(1),
  level: z.nativeEnum(CoachLevel),
});

type CoachInputValidated = z.infer<typeof coachInputSchema>;

const coachResponseSchema: Record<string, unknown> = {
  type: 'object',
  properties: {
    technique: { type: 'string', enum: [...TEMPLATE_TECHNIQUES] },
    advice: { type: 'string', minLength: 20 },
    rationale: { type: 'string', minLength: 10 },
  },
  required: ['technique', 'advice', 'rationale'],
  additionalProperties: false,
};

type CoachModelResult = {
  technique: TemplateTechnique;
  advice: string;
  rationale: string;
};

@Injectable()
export class LearningService {
  private readonly ajv = new Ajv2020({ allErrors: true, strict: false });
  private readonly schemaCache = new Map<string, ValidateFunction>();

  constructor(
    @Inject(OPENAI_COMPLETION_CLIENT)
    private readonly completionClient: CompletionClient,
  ) {}

  async listTechniques(): Promise<TechniqueTemplateModel[]> {
    return TEMPLATE_TECHNIQUES.map((technique) => {
      const template = getTemplate(technique);
      return {
        technique: template.technique,
        version: template.version,
        language: template.language,
        prompt: template.prompt,
        inputFields: template.inputFields,
        guardrails: template.guardrails,
      } satisfies TechniqueTemplateModel;
    });
  }

  async coach(input: CoachInput): Promise<CoachResponseModel> {
    const parsed = coachInputSchema.parse(input);
    const prompt = this.renderCoachPrompt(parsed);
    const raw = await this.completionClient.completeJson(
      prompt,
      coachResponseSchema,
      512,
    );

    const json = this.parseResponse(raw) as Record<string, unknown>;
    this.validateWithSchema('coach', coachResponseSchema, json);

    const result = json as CoachModelResult;

    return {
      topic: parsed.topic,
      level: parsed.level,
      technique: result.technique,
      advice: result.advice.trim(),
      rationale: result.rationale.trim(),
    } satisfies CoachResponseModel;
  }

  async createMnemonic(
    input: CreateMnemonicInput,
    version?: string,
  ): Promise<MnemonicPayloadModel> {
    const parsed = mnemonicInputSchema.parse(input);
    const data = await this.generateFromTemplate<MnemonicInput, MnemonicResult>(
      'mnemonic_it',
      parsed,
      version,
    );

    return {
      mnemonic: data.mnemonic.trim(),
      explanation: data.explanation.trim(),
      keywords: data.keywords,
    } satisfies MnemonicPayloadModel;
  }

  async createStory(
    input: CreateStoryInput,
    version?: string,
  ): Promise<StoryPayloadModel> {
    const parsed = storyInputSchema.parse(input);
    const data = await this.generateFromTemplate<StoryInput, StoryResult>(
      'story_it',
      parsed,
      version,
    );

    return {
      story: data.story.trim(),
      summary: data.summary.trim(),
      keyPoints: data.keyPoints,
    } satisfies StoryPayloadModel;
  }

  async createFlashcards(
    input: CreateFlashcardsInput,
    version?: string,
  ): Promise<FlashcardsPayloadModel> {
    const parsed = flashcardsInputSchema.parse(input);
    const data = await this.generateFromTemplate<FlashcardsInput, FlashcardsResult>(
      'flashcards_index_it',
      parsed,
      version,
    );

    const flashcards = data.flashcards.map((card) => ({
      index: card.index,
      question: card.question.trim(),
      answer: card.answer.trim(),
    }));

    return {
      topic: parsed.topic,
      flashcards,
    } satisfies FlashcardsPayloadModel;
  }

  private async generateFromTemplate<TInput extends Record<string, unknown>, TResult>(
    technique: TemplateTechnique,
    input: TInput,
    version?: string,
  ): Promise<TResult> {
    const template = getTemplate(technique, version);
    const prompt = this.renderPrompt(template, input);
    const raw = await this.completionClient.completeJson(
      prompt,
      template.responseSchema,
      this.estimateMaxTokens(template.guardrails.maxAnswerLength),
    );

    const json = this.parseResponse(raw);
    this.validateTemplateResponse(template, json);
    this.enforceGuardrails(template, json);

    return json as TResult;
  }

  private renderPrompt(template: PromptTemplate, input: Record<string, unknown>): string {
    return [
      template.prompt.trim(),
      'Input payload:',
      JSON.stringify(input, null, 2),
      'Respond strictly with JSON matching the provided response schema.',
    ].join('\n\n');
  }

  private renderCoachPrompt(input: CoachInputValidated): string {
    return [
      'You are an expert learning coach specialising in spaced repetition and storytelling.',
      `Topic: ${input.topic}`,
      `Learner level: ${input.level}`,
      'Suggest the most suitable technique from the available set and explain how to proceed.',
      'Respond strictly with JSON containing technique, advice, and rationale fields.',
    ].join('\n');
  }

  private validateTemplateResponse(template: PromptTemplate, data: unknown): void {
    const key = `${template.technique}:${template.version}`;
    const validator = this.compileSchema(key, template.responseSchema);

    if (!validator(data)) {
      const message = (validator.errors || [])
        .map((error) => `${error.instancePath || '<root>'} ${error.message}`)
        .join('; ');
      throw new Error(`Response validation failed: ${message}`);
    }
  }

  private validateWithSchema(key: string, schema: Record<string, unknown>, data: unknown): void {
    const validator = this.compileSchema(key, schema);
    if (!validator(data)) {
      const message = (validator.errors || [])
        .map((error) => `${error.instancePath || '<root>'} ${error.message}`)
        .join('; ');
      throw new Error(`Response validation failed: ${message}`);
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

  private enforceGuardrails(template: PromptTemplate, data: unknown): void {
    if (typeof data !== 'object' || data === null) {
      throw new Error('Guardrail enforcement failed: expected an object response');
    }

    const payload = data as Record<string, unknown>;

    for (const field of template.guardrails.requiredFields) {
      if (!(field in payload)) {
        throw new Error(`Guardrail violation: missing required field "${field}"`);
      }
    }

    const totalLength = JSON.stringify(payload).length;
    if (totalLength > template.guardrails.maxAnswerLength) {
      throw new Error('Guardrail violation: maxAnswerLength exceeded');
    }
  }

  private estimateMaxTokens(maxAnswerLength: number): number {
    return Math.max(128, Math.ceil(maxAnswerLength / 4));
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
        return JSON.parse(candidate);
      }

      throw new Error('Failed to parse JSON response from OpenAI');
    }
  }
}
