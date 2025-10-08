import { Test } from '@nestjs/testing';
import { UnprocessableEntityException } from '@nestjs/common';
import { FlashcardsService } from './flashcards.service';
import { OPENAI_COMPLETION_CLIENT, type CompletionClient } from './learning.constants';

const mockCompletionClient = () => {
  const completeJson = jest.fn<Promise<string>, [string, Record<string, unknown>, number]>();
  const client: CompletionClient = { completeJson };
  return { client, completeJson };
};

describe('FlashcardsService', () => {
  it('retries once when answers exceed max length and returns trimmed payload', async () => {
    const { client, completeJson } = mockCompletionClient();
    const firstResponse = {
      flashcards: Array.from({ length: 5 }).map((_, index) => ({
        index: index + 1,
        question: `Domanda ${index + 1}`,
        answer: 'Risposta molto lunga che supera i venticinque caratteri',
      })),
    };
    const secondResponse = {
      flashcards: Array.from({ length: 5 }).map((_, index) => ({
        index: index + 1,
        question: ` Domanda ${index + 1} `,
        answer: ' Risposta breve ',
      })),
    };

    completeJson.mockResolvedValueOnce(JSON.stringify(firstResponse));
    completeJson.mockResolvedValueOnce(JSON.stringify(secondResponse));

    const moduleRef = await Test.createTestingModule({
      providers: [
        FlashcardsService,
        {
          provide: OPENAI_COMPLETION_CLIENT,
          useValue: client,
        },
      ],
    }).compile();

    const service = moduleRef.get(FlashcardsService);

    const result = await service.createFlashcards({
      topic: 'Energia',
      items: [
        { term: 'energia cinetica', definition: 'energia dovuta al movimento' },
      ],
    });

    expect(result.flashcards).toHaveLength(5);
    expect(result.flashcards.every((card) => card.answer.length <= 25)).toBe(true);
    expect(result.flashcards.every((card) => !card.question.startsWith(' '))).toBe(true);
    expect(completeJson).toHaveBeenCalledTimes(2);
  });

  it('throws 422 when template response violates schema twice', async () => {
    const { client, completeJson } = mockCompletionClient();
    const invalidResponse = {
      flashcards: Array.from({ length: 3 }).map((_, index) => ({
        index: index + 1,
        question: `Domanda ${index + 1}`,
        answer: 'Risposta breve',
      })),
    };

    completeJson.mockResolvedValueOnce(JSON.stringify(invalidResponse));
    completeJson.mockResolvedValueOnce(JSON.stringify(invalidResponse));

    const moduleRef = await Test.createTestingModule({
      providers: [
        FlashcardsService,
        {
          provide: OPENAI_COMPLETION_CLIENT,
          useValue: client,
        },
      ],
    }).compile();

    const service = moduleRef.get(FlashcardsService);

    await expect(
      service.createFlashcards({
        topic: 'Energia',
        items: [
          { term: 'energia potenziale', definition: 'energia immagazzinata' },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
    expect(completeJson).toHaveBeenCalledTimes(2);
  });
});
