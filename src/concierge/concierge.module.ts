import { Module } from '@nestjs/common';
import { EventsModule } from '../events/events.module';
import { OpenAiModule } from '../openai/openai.module';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';

@Module({
  imports: [EventsModule, OpenAiModule],
  providers: [ConciergeService],
  controllers: [ConciergeController],
})
export class ConciergeModule {}
