import { Module } from '@nestjs/common';
import { ConciergeModule } from './concierge/concierge.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, EventsModule, ConciergeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
