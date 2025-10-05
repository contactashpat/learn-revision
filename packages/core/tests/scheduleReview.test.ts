import { describe, expect, it } from 'vitest';
import { scheduleReview, type CardState } from '../src/scheduleReview';

const baseState = (overrides: Partial<CardState>): CardState => ({
  grade: 'good',
  easiness: 2.5,
  interval: 1,
  reps: 1,
  reviewedAt: new Date('2024-01-01T00:00:00.000Z'),
  ...overrides
});

describe('scheduleReview', () => {
  it('returns next day review and resets repetitions on again', () => {
    const state = baseState({ grade: 'again', interval: 10, reps: 5 });
    const result = scheduleReview(state);

    expect(result.reps).toBe(0);
    expect(result.interval).toBe(1);
    expect(result.easiness).toBeCloseTo(1.7, 1);
    expect(result.nextDueAt.toISOString()).toBe('2024-01-02T00:00:00.000Z');
  });

  it('applies a shorter multiplier for hard reviews', () => {
    const state = baseState({ grade: 'hard', interval: 10, reps: 3 });
    const result = scheduleReview(state);

    expect(result.reps).toBe(4);
    expect(result.interval).toBe(12);
    expect(result.easiness).toBeCloseTo(2.36, 2);
    expect(result.nextDueAt.toISOString()).toBe('2024-01-13T00:00:00.000Z');
  });

  it('keeps easiness stable and scales interval for good reviews', () => {
    const state = baseState({ grade: 'good', interval: 6, reps: 2 });
    const result = scheduleReview(state);

    expect(result.reps).toBe(3);
    expect(result.interval).toBe(15);
    expect(result.easiness).toBeCloseTo(2.5, 2);
    expect(result.nextDueAt.toISOString()).toBe('2024-01-16T00:00:00.000Z');
  });

  it('boosts interval and easiness for easy reviews', () => {
    const state = baseState({ grade: 'easy', interval: 15, reps: 3 });
    const result = scheduleReview(state);

    expect(result.reps).toBe(4);
    expect(result.interval).toBeGreaterThan(20);
    expect(result.easiness).toBeGreaterThan(2.5);
    const expectedDue = new Date(new Date(state.reviewedAt).getTime() + result.interval * 86_400_000);
    expect(result.nextDueAt.toISOString()).toBe(expectedDue.toISOString());
  });

  it('throws when reviewedAt is invalid', () => {
    const state = baseState({ reviewedAt: 'not-a-date' });
    expect(() => scheduleReview(state)).toThrow('Invalid reviewedAt value');
  });
});
