import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Concierge flow (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('supports event, attendee, concierge message, and feedback flow', async () => {
    const eventResponse = await request(app.getHttpServer())
      .post('/events')
      .send({ name: 'MyConnect AI Day' })
      .expect(201);

    const eventBody = eventResponse.body as { id: string };

    const requester = await request(app.getHttpServer())
      .post(`/events/${eventBody.id}/attendees`)
      .send({
        name: 'Andi',
        role: 'Engineer',
        skills: ['nestjs', 'ai'],
        openToChat: true,
      })
      .expect(201);

    const requesterBody = requester.body as { id: string };

    await request(app.getHttpServer())
      .post(`/events/${eventBody.id}/attendees`)
      .send({
        name: 'Sinta',
        role: 'Product Manager',
        skills: ['ai', 'product'],
        openToChat: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .get(`/events/${eventBody.id}/attendees?page=1&limit=10&skills=ai`)
      .expect(200)
      .expect((res: { body: { data: unknown[] } }) => {
        expect(res.body.data).toHaveLength(2);
      });

    const conciergeMessage = await request(app.getHttpServer())
      .post(`/events/${eventBody.id}/concierge/messages`)
      .send({
        attendee_id: requesterBody.id,
        message: 'Cari peserta yang cocok untuk diskusi AI',
      })
      .expect(201);

    const conciergeBody = conciergeMessage.body as { id: string };

    await request(app.getHttpServer())
      .post(
        `/events/${eventBody.id}/concierge/messages/${conciergeBody.id}/feedback`,
      )
      .send({
        rating: 5,
        notes: 'Rekomendasinya relevan',
      })
      .expect(201)
      .expect((res: { body: { rating: number } }) => {
        expect(res.body.rating).toBe(5);
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
