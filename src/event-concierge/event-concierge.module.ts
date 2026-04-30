import { Module } from '@nestjs/common';
import { EventConciergeController } from './event-concierge.controller';
import { EventConciergeService } from './event-concierge.service';
import { OpenAiModule } from '@/openai/openai.module';
import { PrismaModule } from '@/prisma/prisma.module';

@Module({
  imports: [OpenAiModule, PrismaModule],
  controllers: [EventConciergeController],
  providers: [EventConciergeService],
})
export class EventConciergeModule {}
