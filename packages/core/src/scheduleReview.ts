const MILLISECONDS_IN_A_DAY = 86_400_000;
const MIN_EASINESS = 1.3;
const EASY_BONUS = 1.3;
const HARD_FACTOR = 1.2;

export const REVIEW_QUALITY = {
  again: 0,
  hard: 3,
  good: 4,
  easy: 5
} as const;

export type ReviewGrade = keyof typeof REVIEW_QUALITY;

export interface CardState {
  grade: ReviewGrade;
  easiness: number;
  interval: number;
  reps: number;
  reviewedAt: Date | string;
}

export interface ReviewSchedule {
  nextDueAt: Date;
  easiness: number;
  interval: number;
  reps: number;
}

const sm2Adjustment = (quality: number, currentEasiness: number): number => {
  const delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  const adjusted = currentEasiness + delta;
  return adjusted < MIN_EASINESS ? MIN_EASINESS : adjusted;
};

const toDate = (value: Date | string): Date => {
  const parsed = typeof value === 'string' ? new Date(value) : new Date(value.getTime());
  if (Number.isNaN(parsed.getTime())) {
    throw new TypeError('Invalid reviewedAt value; expected a valid date');
  }
  return parsed;
};

const addDays = (date: Date, days: number): Date => {
  const result = new Date(date.getTime() + days * MILLISECONDS_IN_A_DAY);
  return result;
};

export const scheduleReview = (cardState: CardState): ReviewSchedule => {
  const { grade } = cardState;
  const quality = REVIEW_QUALITY[grade];

  if (quality === undefined) {
    throw new TypeError(`Unsupported grade: ${String(grade)}`);
  }

  const currentEasiness = Number.isFinite(cardState.easiness) ? cardState.easiness : 2.5;
  const currentInterval = Number.isFinite(cardState.interval) ? cardState.interval : 0;
  const currentReps = Number.isFinite(cardState.reps) ? cardState.reps : 0;

  const updatedEasiness = sm2Adjustment(quality, currentEasiness);
  let reps = currentReps;
  let interval: number;

  if (grade === 'again') {
    reps = 0;
    interval = 1;
  } else {
    reps += 1;
    const safeInterval = currentInterval > 0 ? currentInterval : 1;

    if (reps === 1) {
      interval = 1;
    } else if (reps === 2) {
      const base = grade === 'easy' ? 6 * EASY_BONUS : 6;
      interval = Math.max(1, Math.round(base));
    } else if (grade === 'hard') {
      interval = Math.max(1, Math.round(safeInterval * HARD_FACTOR));
    } else if (grade === 'easy') {
      interval = Math.max(1, Math.round(safeInterval * updatedEasiness * EASY_BONUS));
    } else {
      interval = Math.max(1, Math.round(safeInterval * updatedEasiness));
    }
  }

  const reviewedAt = toDate(cardState.reviewedAt);
  const nextDueAt = addDays(reviewedAt, interval);

  return {
    nextDueAt,
    easiness: updatedEasiness,
    interval,
    reps
  };
};
