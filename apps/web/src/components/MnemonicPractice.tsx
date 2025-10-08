import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createMnemonicMutation, type MnemonicResult } from '../api/operations';

const mnemonicSchema = z.object({
  term: z.string().min(2, 'Provide the Italian term to remember'),
  definition: z.string().min(4, 'Add a brief definition or hint'),
});

type MnemonicFormValues = z.infer<typeof mnemonicSchema>;

interface MnemonicPracticeProps {
  guardrails?: {
    maxAnswerLength: number;
    requiredFields: string[];
  };
}

const MnemonicPractice = ({ guardrails }: MnemonicPracticeProps) => {
  const resultRef = useRef<HTMLDivElement>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MnemonicFormValues>({
    resolver: zodResolver(mnemonicSchema),
    defaultValues: { term: '', definition: '' },
  });

  const mutation = useMutation<MnemonicResult, Error, { input: MnemonicFormValues; version?: string }>({
    mutationFn: (variables) => createMnemonicMutation(variables),
    onSuccess: () => {
      resultRef.current?.focus();
    },
  });

  const onSubmit = (values: MnemonicFormValues) => {
    mutation.mutate({ input: values });
  };

  useEffect(() => {
    if (!mutation.isLoading && !mutation.isError && mutation.isSuccess) {
      reset(undefined, { keepValues: true });
    }
  }, [mutation.isLoading, mutation.isError, mutation.isSuccess, reset]);

  return (
    <section className="form-section" aria-labelledby="mnemonic-studio-heading">
      <h2 id="mnemonic-studio-heading">Mnemonic practice</h2>
      <p>
        Craft a vivid Italian mnemonic to remember a tricky concept. Focus on imagery, emotion, and
        association.
      </p>
      {guardrails && (
        <p>
          <strong>Guardrails:</strong> up to {guardrails.maxAnswerLength} characters – required fields:{' '}
          {guardrails.requiredFields.join(', ')}
        </p>
      )}

      <form className="form-grid" onSubmit={handleSubmit(onSubmit)} aria-describedby="mnemonic-help">
        <div>
          <label htmlFor="term">Term to remember</label>
          <input id="term" {...register('term')} autoComplete="off" />
          {errors.term && <p className="error-text">{errors.term.message}</p>}
        </div>
        <div>
          <label htmlFor="definition">Definition / hint</label>
          <textarea id="definition" rows={4} {...register('definition')} />
          {errors.definition && <p className="error-text">{errors.definition.message}</p>}
        </div>
        <div>
          <button type="submit" disabled={mutation.isLoading} aria-live="polite">
            {mutation.isLoading ? 'Generating…' : 'Create mnemonic'}
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
          aria-labelledby="mnemonic-results-heading"
        >
          <h2 id="mnemonic-results-heading">Mnemonic generated</h2>
          <p>{mutation.data.createMnemonic.mnemonic}</p>
          <p>{mutation.data.createMnemonic.explanation}</p>
          <section aria-label="Keywords">
            <ul>
              {mutation.data.createMnemonic.keywords.map((keyword) => (
                <li key={keyword}>{keyword}</li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </section>
  );
};

export default MnemonicPractice;
