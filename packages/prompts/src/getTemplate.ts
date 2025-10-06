import { z } from 'zod';
import mnemonicItV1 from '../templates/mnemonic_it/v1.json' assert { type: 'json' };
import storyItV1 from '../templates/story_it/v1.json' assert { type: 'json' };
import flashcardsIndexItV1 from '../templates/flashcards_index_it/v1.json' assert { type: 'json' };

export const TEMPLATE_TECHNIQUES = [
  'mnemonic_it',
  'story_it',
  'flashcards_index_it'
] as const;

export type TemplateTechnique = (typeof TEMPLATE_TECHNIQUES)[number];

const MAX_ALLOWED_ANSWER_LENGTH = 1200;

type JsonSchema = Record<string, unknown>;

const templateSchema = z.object({
  technique: z.enum(TEMPLATE_TECHNIQUES),
  version: z.string().min(1),
  language: z.literal('it'),
  prompt: z.string().min(10),
  inputFields: z.array(z.string().min(1)).nonempty(),
  guardrails: z.object({
    maxAnswerLength: z
      .number()
      .int()
      .positive()
      .max(MAX_ALLOWED_ANSWER_LENGTH),
    requiredFields: z.array(z.string().min(1)).nonempty()
  }),
  responseSchema: z.custom<JsonSchema>((value) => typeof value === 'object' && value !== null, {
    message: 'responseSchema must be an object'
  })
});

export type PromptTemplate = z.infer<typeof templateSchema>;

const rawTemplates: Record<TemplateTechnique, Record<string, unknown>> = {
  mnemonic_it: {
    '1.0.0': mnemonicItV1
  },
  story_it: {
    '1.0.0': storyItV1
  },
  flashcards_index_it: {
    '1.0.0': flashcardsIndexItV1
  }
};

const compareVersions = (a: string, b: string): number => {
  const split = (value: string) => value.split('.').map((segment) => Number.parseInt(segment, 10) || 0);
  const [aMajor, aMinor = 0, aPatch = 0] = split(a);
  const [bMajor, bMinor = 0, bPatch = 0] = split(b);

  if (aMajor !== bMajor) return aMajor - bMajor;
  if (aMinor !== bMinor) return aMinor - bMinor;
  return aPatch - bPatch;
};

const ensureGuardrailsConsistency = (template: PromptTemplate): PromptTemplate => {
  const schema = template.responseSchema as JsonSchema;
  const requiredFromSchema = Array.isArray((schema as { required?: unknown }).required)
    ? ((schema as { required?: string[] }).required ?? [])
    : [];
  const properties = (schema as { properties?: Record<string, unknown> }).properties ?? {};

  for (const field of template.guardrails.requiredFields) {
    if (!requiredFromSchema.includes(field)) {
      throw new Error(
        `Template ${template.technique}@${template.version} is missing required field "${field}" in responseSchema.required`
      );
    }
    if (!Object.prototype.hasOwnProperty.call(properties, field)) {
      throw new Error(
        `Template ${template.technique}@${template.version} is missing property definition for "${field}"`
      );
    }
  }

  return template;
};

const validatedTemplates: Map<TemplateTechnique, Map<string, PromptTemplate>> = new Map();

for (const technique of TEMPLATE_TECHNIQUES) {
  const versions = rawTemplates[technique];
  const versionEntries = Object.entries(versions).map(([version, definition]) => {
    const template = ensureGuardrailsConsistency(templateSchema.parse(definition));
    return [version, Object.freeze(template)] as const;
  });

  versionEntries.sort(([versionA], [versionB]) => compareVersions(versionA, versionB));
  validatedTemplates.set(technique, new Map(versionEntries));
}

const cloneTemplate = (template: PromptTemplate): PromptTemplate =>
  JSON.parse(JSON.stringify(template)) as PromptTemplate;

export const getTemplate = (technique: TemplateTechnique, version?: string): PromptTemplate => {
  const techniqueTemplates = validatedTemplates.get(technique);

  if (!techniqueTemplates) {
    throw new Error(`Unknown technique: ${technique}`);
  }

  if (version) {
    const template = techniqueTemplates.get(version);
    if (!template) {
      throw new Error(`Unknown version ${version} for technique ${technique}`);
    }
    return cloneTemplate(template);
  }

  const latest = Array.from(techniqueTemplates.values()).at(-1);
  if (!latest) {
    throw new Error(`No templates registered for technique ${technique}`);
  }

  return cloneTemplate(latest);
};
