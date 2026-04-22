import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConciergeModule } from './concierge/concierge.module';
import { EventsModule } from './events/events.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventsModule,
    ConciergeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
