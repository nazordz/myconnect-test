import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ConciergeController } from './concierge.controller';
import { ConciergeService } from './concierge.service';

@Module({
  imports: [PrismaModule],
  controllers: [ConciergeController],
  providers: [ConciergeService],
})
export class ConciergeModule {}
