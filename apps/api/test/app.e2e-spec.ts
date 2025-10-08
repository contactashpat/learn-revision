import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import {
  CompletionClient,
  OPENAI_COMPLETION_CLIENT,
} from '../src/learning/learning.constants';

const graphql = (query: string, variables?: Record<string, unknown>) => ({ query, variables });

describe('Learning GraphQL API (e2e)', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;
  const mockCompleteJson = jest.fn<Promise<string>, [string, Record<string, unknown>, number]>();

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const mockClient: CompletionClient = {
      completeJson: mockCompleteJson,
    };

    moduleFixture.overrideProvider(OPENAI_COMPLETION_CLIENT).useValue(mockClient);

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(() => {
    mockCompleteJson.mockReset();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns available techniques metadata', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .send(
        graphql(`
          query Techniques {
            techniques {
              technique
              version
              language
              guardrails {
                maxAnswerLength
                requiredFields
              }
            }
          }
        `),
      )
      .expect(200);

    const { data } = response.body;
    expect(Array.isArray(data.techniques)).toBe(true);
    expect(data.techniques).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ technique: 'mnemonic_it' }),
        expect.objectContaining({ technique: 'story_it' }),
        expect.objectContaining({ technique: 'flashcards_index_it' }),
      ]),
    );
  });

  it('creates mnemonic, story, flashcards and coaching guidance', async () => {
    mockCompleteJson
      .mockResolvedValueOnce(
        JSON.stringify({
          mnemonic: 'Ogni giorno energia risplende',
          explanation: 'Associa la parola energia a immagini luminose.',
          keywords: ['energia', 'luce'],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          story: 'C era una volta un inventore che diffondeva energia pulita.',
          summary: 'Una storia motivante sulla sostenibilità.',
          keyPoints: ['energia pulita', 'inventore', 'speranza'],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          flashcards: [
            { index: 1, question: 'Cos è energia cinetica?', answer: 'Energia del movimento.' },
          ],
        }),
      )
      .mockResolvedValueOnce(
        JSON.stringify({
          technique: 'mnemonic_it',
          advice: 'Concentra la lezione su immagini coinvolgenti.',
          rationale: 'I principianti traggono beneficio da narrazioni memorabili.',
        }),
      );

    const mnemonicResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send(
        graphql(
          `
            mutation CreateMnemonic($input: CreateMnemonicInput!) {
              createMnemonic(input: $input) {
                mnemonic
                explanation
                keywords
              }
            }
          `,
          {
            input: {
              term: 'energia',
              definition: 'capacità di compiere lavoro',
            },
          },
        ),
      )
      .expect(200);

    expect(mnemonicResponse.body.data.createMnemonic.mnemonic).toContain('energia');

    const storyResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send(
        graphql(
          `
            mutation CreateStory($input: CreateStoryInput!) {
              createStory(input: $input) {
                story
                summary
                keyPoints
              }
            }
          `,
          {
            input: {
              concepts: ['energia sostenibile'],
              targetAudience: 'studenti liceali',
              learningGoal: 'Comprendere le fonti di energia pulita',
            },
          },
        ),
      )
      .expect(200);

    expect(Array.isArray(storyResponse.body.data.createStory.keyPoints)).toBe(true);

    const flashcardsResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send(
        graphql(
          `
            mutation CreateFlashcards($input: CreateFlashcardsInput!) {
              createFlashcards(input: $input) {
                topic
                flashcards {
                  index
                  question
                  answer
                }
              }
            }
          `,
          {
            input: {
              topic: 'Energia',
              items: [{ term: 'energia cinetica', definition: 'Energia del movimento' }],
            },
          },
        ),
      )
      .expect(200);

    expect(flashcardsResponse.body.data.createFlashcards.flashcards).toHaveLength(1);

    const coachResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send(
        graphql(
          `
            query Coach($topic: String!, $level: CoachLevel!) {
              coach(topic: $topic, level: $level) {
                technique
                advice
                rationale
              }
            }
          `,
          {
            topic: 'Energia rinnovabile',
            level: 'BEGINNER',
          },
        ),
      )
      .expect(200);

    expect(coachResponse.body.data.coach.technique).toBe('mnemonic_it');
    expect(mockCompleteJson).toHaveBeenCalledTimes(4);
  });
});
