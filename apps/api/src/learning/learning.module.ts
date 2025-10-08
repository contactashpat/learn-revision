import { Module } from '@nestjs/common';
import { LearningResolver } from './learning.resolver';
import { LearningService } from './learning.service';
import { openAiCompletionClientProvider } from './openai.client';

@Module({
  providers: [LearningResolver, LearningService, openAiCompletionClientProvider],
})
export class LearningModule {}
