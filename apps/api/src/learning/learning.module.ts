import { Module } from '@nestjs/common';
import { LearningResolver } from './learning.resolver';
import { LearningService } from './learning.service';
import { FlashcardsService } from './flashcards.service';
import { openAiCompletionClientProvider } from './openai.client';

@Module({
  providers: [LearningResolver, LearningService, FlashcardsService, openAiCompletionClientProvider],
})
export class LearningModule {}
