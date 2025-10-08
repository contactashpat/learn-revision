import { Test } from '@nestjs/testing';
import { LearningService } from './learning.service';
import { CompletionClient, OPENAI_COMPLETION_CLIENT } from './learning.constants';
import { CoachLevel } from './models/learning.models';

const mockCompletionClient = () => {
  const completeJson = jest.fn<Promise<string>, [string, Record<string, unknown>, number]>();
  const client: CompletionClient = {
    completeJson,
  };
  return { client, completeJson };
};

describe('LearningService', () => {
  it('lists available techniques and generates mnemonic content', async () => {
    const { client, completeJson } = mockCompletionClient();
    completeJson.mockResolvedValueOnce(
      JSON.stringify({
        mnemonic: 'Ogni Nave Entra Nel Irradiante Golfo Azzurro',
        explanation: 'Una frase per ricordare il termine energia.',
        keywords: ['energia', 'golfo'],
      }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: OPENAI_COMPLETION_CLIENT,
          useValue: client,
        },
      ],
    }).compile();

    const service = moduleRef.get(LearningService);

    const techniques = await service.listTechniques();
    expect(techniques).toEqual(
      expect.arrayContaining([expect.objectContaining({ technique: 'mnemonic_it' })]),
    );

    const result = await service.createMnemonic({
      term: 'energia',
      definition: 'capacità di compiere lavoro',
    });

    expect(result.mnemonic.length).toBeGreaterThan(0);
    expect(result.keywords).toContain('energia');
    expect(completeJson).toHaveBeenCalledTimes(1);
  });

  it('produces coaching guidance', async () => {
    const { client, completeJson } = mockCompletionClient();
    completeJson.mockResolvedValueOnce(
      JSON.stringify({
        technique: 'story_it',
        advice: 'Condividi una storia coinvolgente che renda il tema memorabile.',
        rationale: 'Le storie guidano i principianti con contesti concreti.',
      }),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        LearningService,
        {
          provide: OPENAI_COMPLETION_CLIENT,
          useValue: client,
        },
      ],
    }).compile();

    const service = moduleRef.get(LearningService);

    const response = await service.coach({ topic: 'Energia', level: CoachLevel.BEGINNER });

    expect(response.technique).toBe('story_it');
    expect(response.advice).toContain('storia');
    expect(completeJson).toHaveBeenCalledTimes(1);
  });
});
