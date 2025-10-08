import { Field, InputType } from '@nestjs/graphql';
import { CoachLevel } from '../models/learning.models';

@InputType()
export class CreateMnemonicInput {
  @Field()
  term!: string;

  @Field()
  definition!: string;
}

@InputType()
export class CreateStoryInput {
  @Field(() => [String])
  concepts!: string[];

  @Field()
  targetAudience!: string;

  @Field()
  learningGoal!: string;
}

@InputType()
export class FlashcardItemInput {
  @Field()
  term!: string;

  @Field()
  definition!: string;
}

@InputType()
export class CreateFlashcardsInput {
  @Field()
  topic!: string;

  @Field(() => [FlashcardItemInput])
  items!: FlashcardItemInput[];
}

@InputType()
export class CoachInput {
  @Field()
  topic!: string;

  @Field(() => CoachLevel)
  level!: CoachLevel;
}
