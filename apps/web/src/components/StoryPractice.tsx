import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createStoryMutation, type StoryResult } from '../api/operations';

const storySchema = z.object({
  conceptsInput: z.string().min(5, 'Add at least one concept (one per line)'),
  targetAudience: z.string().min(3, 'Describe the target audience'),
  learningGoal: z.string().min(5, 'Outline the learning goal'),
});

type StoryFormValues = z.infer<typeof storySchema>;

interface StoryPracticeProps {
  guardrails?: {
    maxAnswerLength: number;
    requiredFields: string[];
  };
}

const StoryPractice = ({ guardrails }: StoryPracticeProps) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: { conceptsInput: '', targetAudience: '', learningGoal: '' },
  });

  const mutation = useMutation<
    StoryResult,
    Error,
    { input: { concepts: string[]; targetAudience: string; learningGoal: string }; version?: string }
  >({
    mutationFn: (variables) => createStoryMutation(variables),
    onSuccess: () => {
      resultRef.current?.focus();
    },
  });

  const onSubmit = (values: StoryFormValues) => {
    const concepts = values.conceptsInput
      .split(/\n|,/)
      .map((concept) => concept.trim())
      .filter(Boolean);
    mutation.mutate({
      input: {
        concepts,
        targetAudience: values.targetAudience,
        learningGoal: values.learningGoal,
      },
    });
  };

  useEffect(() => {
    if (!mutation.isLoading && !mutation.isError && mutation.isSuccess) {
      reset(undefined, { keepValues: true });
    }
  }, [mutation.isLoading, mutation.isError, mutation.isSuccess, reset]);

  return (
    <section className="form-section" aria-labelledby="story-studio-heading">
      <h2 id="story-studio-heading">Story practice</h2>
      <p>
        Create a short Italian story that includes your core concepts and delivers a clear takeaway
        for learners.
      </p>
      {guardrails && (
        <p>
          <strong>Guardrails:</strong> up to {guardrails.maxAnswerLength} characters – required fields:{' '}
          {guardrails.requiredFields.join(', ')}
        </p>
      )}

      <form className="form-grid" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="conceptsInput">Concepts (one per line)</label>
          <textarea id="conceptsInput" rows={4} {...register('conceptsInput')} />
          {errors.conceptsInput && <p className="error-text">{errors.conceptsInput.message}</p>}
        </div>
        <div>
          <label htmlFor="targetAudience">Target audience</label>
          <input id="targetAudience" {...register('targetAudience')} />
          {errors.targetAudience && <p className="error-text">{errors.targetAudience.message}</p>}
        </div>
        <div>
          <label htmlFor="learningGoal">Learning goal</label>
          <textarea id="learningGoal" rows={3} {...register('learningGoal')} />
          {errors.learningGoal && <p className="error-text">{errors.learningGoal.message}</p>}
        </div>
        <div>
          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Drafting story…' : 'Create story'}
          </button>
        </div>
      </form>

      {mutation.isError && (
        <div role="alert" className="error-text">
          {(mutation.error as Error).message}
        </div>
      )}

      {mutation.data && (
        <div
          ref={resultRef}
          className="results-panel"
          tabIndex={-1}
          aria-live="polite"
          aria-labelledby="story-results-heading"
        >
          <h2 id="story-results-heading">Story generated</h2>
          <p>{mutation.data.createStory.story}</p>
          <h3>Summary</h3>
          <p>{mutation.data.createStory.summary}</p>
          <h3>Key points</h3>
          <ul>
            {mutation.data.createStory.keyPoints.map((point: string) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};

export default StoryPractice;
