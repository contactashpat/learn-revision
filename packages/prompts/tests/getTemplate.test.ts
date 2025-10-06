import { describe, expect, it } from 'vitest';
import { getTemplate, TEMPLATE_TECHNIQUES, type PromptTemplate } from '../src';

const expectGuardrails = (template: PromptTemplate) => {
  const { guardrails, responseSchema } = template;
  expect(guardrails.maxAnswerLength).toBeGreaterThan(0);
  expect(Array.isArray(guardrails.requiredFields)).toBe(true);
  const schemaRequired = Array.isArray((responseSchema as { required?: unknown }).required)
    ? ((responseSchema as { required?: string[] }).required ?? [])
    : [];
  for (const field of guardrails.requiredFields) {
    expect(schemaRequired).toContain(field);
    const properties = (responseSchema as { properties?: Record<string, unknown> }).properties ?? {};
    expect(properties).toHaveProperty(field);
  }
};

describe('getTemplate', () => {
  it('returns the latest version when none is specified', () => {
    const template = getTemplate('mnemonic_it');
    expect(template.version).toBe('1.0.0');
    expect(template.technique).toBe('mnemonic_it');
    expect(template.language).toBe('it');
    expectGuardrails(template);
  });

  it('returns a deep clone of the stored template', () => {
    const template = getTemplate('story_it');
    template.guardrails.requiredFields.push('oops');

    const fresh = getTemplate('story_it');
    expect(fresh.guardrails.requiredFields).not.toContain('oops');
  });

  it('allows requesting a specific version when available', () => {
    const template = getTemplate('flashcards_index_it', '1.0.0');
    expect(template.version).toBe('1.0.0');
    expect(template.guardrails.maxAnswerLength).toBeLessThanOrEqual(1200);
  });

  it('throws on unknown techniques', () => {
    // @ts-expect-error intentionally invalid technique
    expect(() => getTemplate('unknown-technique')).toThrow('Unknown technique');
  });

  it('throws on unknown versions', () => {
    expect(() => getTemplate('mnemonic_it', '9.9.9')).toThrow('Unknown version');
  });

  it('exposes the list of supported techniques', () => {
    expect(TEMPLATE_TECHNIQUES).toEqual(['mnemonic_it', 'story_it', 'flashcards_index_it']);
  });
});
