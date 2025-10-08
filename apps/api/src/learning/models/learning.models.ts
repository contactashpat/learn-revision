import { Field, Int, ObjectType, registerEnumType } from '@nestjs/graphql';

export enum CoachLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

registerEnumType(CoachLevel, {
  name: 'CoachLevel',
  description: 'Learner proficiency used to tailor coaching prompts',
});

@ObjectType()
export class TechniqueGuardrailsModel {
  @Field(() => Int)
  maxAnswerLength!: number;

  @Field(() => [String])
  requiredFields!: string[];
}

@ObjectType()
export class TechniqueTemplateModel {
  @Field()
  technique!: string;

  @Field()
  version!: string;

  @Field()
  language!: string;

  @Field()
  prompt!: string;

  @Field(() => [String])
  inputFields!: string[];

  @Field(() => TechniqueGuardrailsModel)
  guardrails!: TechniqueGuardrailsModel;
}

@ObjectType()
export class MnemonicPayloadModel {
  @Field()
  mnemonic!: string;

  @Field()
  explanation!: string;

  @Field(() => [String])
  keywords!: string[];
}

@ObjectType()
export class StoryPayloadModel {
  @Field()
  story!: string;

  @Field()
  summary!: string;

  @Field(() => [String])
  keyPoints!: string[];
}

@ObjectType()
export class FlashcardModel {
  @Field(() => Int)
  index!: number;

  @Field()
  question!: string;

  @Field()
  answer!: string;
}

@ObjectType()
export class FlashcardsPayloadModel {
  @Field()
  topic!: string;

  @Field(() => [FlashcardModel])
  flashcards!: FlashcardModel[];
}

@ObjectType()
export class CoachResponseModel {
  @Field()
  topic!: string;

  @Field(() => CoachLevel)
  level!: CoachLevel;

  @Field()
  technique!: string;

  @Field()
  advice!: string;

  @Field()
  rationale!: string;
}
