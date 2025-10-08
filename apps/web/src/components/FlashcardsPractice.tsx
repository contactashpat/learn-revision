import { useEffect, useRef } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFlashcardsMutation } from '../api/operations';

const flashcardSchema = z.object({
  topic: z.string().min(2, 'Provide the flashcard topic'),
  items: z
    .array(
      z.object({
        term: z.string().min(1, 'Term is required'),
        definition: z.string().min(2, 'Definition is required'),
      })
    )
    .min(1, 'Add at least one flashcard item'),
});

type FlashcardFormValues = z.infer<typeof flashcardSchema>;

interface FlashcardsPracticeProps {
  guardrails?: {
    maxAnswerLength: number;
    requiredFields: string[];
  };
}

const FlashcardsPractice = ({ guardrails }: FlashcardsPracticeProps) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FlashcardFormValues>({
    resolver: zodResolver(flashcardSchema),
    defaultValues: {
      topic: '',
      items: [{ term: '', definition: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  const mutation = useMutation({
    mutationFn: createFlashcardsMutation,
    onSuccess: () => {
      resultRef.current?.focus();
    },
  });

  const onSubmit = (values: FlashcardFormValues) => {
    mutation.mutate({ input: values });
  };

  useEffect(() => {
    if (errors.items?.root && errors.items.root.message) {
      // ensure general array error is announced
      resultRef.current?.focus();
    }
  }, [errors.items?.root]);

  return (
    <section className="form-section" aria-labelledby="flashcards-heading">
      <h2 id="flashcards-heading">Flashcards practice</h2>
      <p>Create indexed Italian flashcards from your topic and raw term definitions.</p>
      {guardrails && (
        <p>
          <strong>Guardrails:</strong> up to {guardrails.maxAnswerLength} characters – required fields:{' '}
          {guardrails.requiredFields.join(', ')}
        </p>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="form-grid">
        <div>
          <label htmlFor="topic">Topic</label>
          <input id="topic" {...register('topic')} />
          {errors.topic && <p className="error-text">{errors.topic.message}</p>}
        </div>

        <div>
          <fieldset>
            <legend>Flashcard items</legend>
            {fields.map((field, index) => (
              <div className="flashcard" key={field.id}>
                <label htmlFor={`item-term-${index}`}>Term #{index + 1}</label>
                <input id={`item-term-${index}`} {...register(`items.${index}.term`)} />
                {errors.items?.[index]?.term && (
                  <p className="error-text">{errors.items[index]?.term?.message}</p>
                )}

                <label htmlFor={`item-definition-${index}`}>Definition #{index + 1}</label>
                <textarea
                  id={`item-definition-${index}`}
                  rows={3}
                  {...register(`items.${index}.definition`)}
                />
                {errors.items?.[index]?.definition && (
                  <p className="error-text">{errors.items[index]?.definition?.message}</p>
                )}

                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} aria-label={`Remove flashcard ${index + 1}`}>
                    Remove
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => append({ term: '', definition: '' })}
              aria-label="Add another flashcard"
            >
              Add another card
            </button>
            {errors.items?.root && <p className="error-text">{errors.items.root.message}</p>}
          </fieldset>
        </div>

        <div>
          <button type="submit" disabled={mutation.isLoading}>
            {mutation.isLoading ? 'Curating flashcards…' : 'Create flashcards'}
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
          aria-labelledby="flashcards-results-heading"
        >
          <h2 id="flashcards-results-heading">Flashcards generated</h2>
          <p>
            <strong>Topic:</strong> {mutation.data.createFlashcards.topic}
          </p>
          <div className="flashcards" role="list">
            {mutation.data.createFlashcards.flashcards.map((flashcard) => (
              <article role="listitem" className="flashcard" key={flashcard.index}>
                <h3>
                  #{flashcard.index} – {flashcard.question}
                </h3>
                <p>{flashcard.answer}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default FlashcardsPractice;
