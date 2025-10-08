import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { LearningService } from './learning.service';
import {
  CoachResponseModel,
  CoachLevel,
  FlashcardsPayloadModel,
  MnemonicPayloadModel,
  StoryPayloadModel,
  TechniqueTemplateModel,
} from './models/learning.models';
import {
  CoachInput,
  CreateFlashcardsInput,
  CreateMnemonicInput,
  CreateStoryInput,
} from './dto/learning.inputs';

@Resolver()
export class LearningResolver {
  constructor(private readonly learningService: LearningService) {}

  @Query(() => [TechniqueTemplateModel])
  techniques(): Promise<TechniqueTemplateModel[]> {
    return this.learningService.listTechniques();
  }

  @Query(() => CoachResponseModel)
  coach(
    @Args('topic') topic: string,
    @Args('level', { type: () => CoachLevel }) level: CoachLevel,
  ): Promise<CoachResponseModel> {
    const input: CoachInput = { topic, level };
    return this.learningService.coach(input);
  }

  @Mutation(() => MnemonicPayloadModel)
  createMnemonic(
    @Args('input') input: CreateMnemonicInput,
    @Args('version', { type: () => String, nullable: true }) version?: string,
  ): Promise<MnemonicPayloadModel> {
    return this.learningService.createMnemonic(input, version);
  }

  @Mutation(() => StoryPayloadModel)
  createStory(
    @Args('input') input: CreateStoryInput,
    @Args('version', { type: () => String, nullable: true }) version?: string,
  ): Promise<StoryPayloadModel> {
    return this.learningService.createStory(input, version);
  }

  @Mutation(() => FlashcardsPayloadModel)
  createFlashcards(
    @Args('input') input: CreateFlashcardsInput,
    @Args('version', { type: () => String, nullable: true }) version?: string,
  ): Promise<FlashcardsPayloadModel> {
    return this.learningService.createFlashcards(input, version);
  }
}
