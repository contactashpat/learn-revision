import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

const graphQLEndpoint = '/graphql';

const techniquesPayload = {
  techniques: [
    {
      technique: 'mnemonic_it',
      version: '1.0.0',
      language: 'it',
      inputFields: ['term', 'definition'],
      guardrails: { maxAnswerLength: 600, requiredFields: ['mnemonic', 'explanation'] },
    },
    {
      technique: 'story_it',
      version: '1.0.0',
      language: 'it',
      inputFields: ['concepts', 'targetAudience', 'learningGoal'],
      guardrails: {
        maxAnswerLength: 900,
        requiredFields: ['story', 'summary', 'keyPoints'],
      },
    },
    {
      technique: 'flashcards_index_it',
      version: '1.0.0',
      language: 'it',
      inputFields: ['topic', 'items'],
      guardrails: {
        maxAnswerLength: 750,
        requiredFields: ['flashcards'],
      },
    },
  ],
};

export const server = setupServer(
  http.post(graphQLEndpoint, async ({ request }) => {
    const body = (await request.json()) as { query?: string; variables?: Record<string, unknown> };
    const query = body.query ?? '';

    if (query.includes('TechniqueExplorer')) {
      return HttpResponse.json({ data: techniquesPayload });
    }

    if (query.includes('CreateMnemonic')) {
      return HttpResponse.json({
        data: {
          createMnemonic: {
            mnemonic: 'Ogni giorno energia risplende',
            explanation: 'Immagina il sole splendente come fonte di energia.',
            keywords: ['energia', 'sole'],
          },
        },
      });
    }

    if (query.includes('CreateStory')) {
      return HttpResponse.json({
        data: {
          createStory: {
            story: 'Una giovane inventrice scopre energia pulita per il suo villaggio.',
            summary: 'Storia motivante sulle energie rinnovabili.',
            keyPoints: ['inventrice', 'sostenibilità', 'comunità'],
          },
        },
      });
    }

    if (query.includes('CreateFlashcards')) {
      return HttpResponse.json({
        data: {
          createFlashcards: {
            topic: 'Energia',
            flashcards: [
              { index: 1, question: 'Cos è energia potenziale?', answer: 'Energia immagazzinata.' },
            ],
          },
        },
      });
    }

    if (query.includes('Coach')) {
      return HttpResponse.json({
        data: {
          coach: {
            technique: 'mnemonic_it',
            advice: 'Concentra la lezione su immagini coinvolgenti.',
            rationale: 'I principianti traggono beneficio da narrazioni memorabili.',
          },
        },
      });
    }

    return HttpResponse.json({ errors: [{ message: 'Unhandled operation' }] }, { status: 400 });
  })
);
