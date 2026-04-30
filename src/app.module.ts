import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EventsModule } from './events/events.module';
import { ConfigModule } from '@nestjs/config';
import { EventConciergeModule } from './event-concierge/event-concierge.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventsModule,
    EventConciergeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
