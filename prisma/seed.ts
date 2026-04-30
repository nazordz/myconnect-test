import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ConciergeMessageRole,
  ConciergeSessionStatus,
} from '../src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.messageFeedback.deleteMany();
  await prisma.conciergeMessage.deleteMany();
  await prisma.conciergeSession.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.event.deleteMany();

  const event = await prisma.event.create({
    data: {
      title: 'MyConnect AI Builders Summit 2026',
      location: 'San Francisco, CA',
      startAt: new Date('2026-06-10T16:00:00.000Z'),
      endAt: new Date('2026-06-12T01:00:00.000Z'),
    },
  });

  const attendees = await Promise.all([
    prisma.attendee.create({
      data: {
        eventId: event.id,
        name: 'Avery Chen',
        headline: 'Staff ML Engineer, DevTools AI',
        bio: 'Builds applied LLM infrastructure and observability tools.',
        company: 'ForgeLayer',
        role: 'Engineer',
        skills: ['rag', 'vector search', 'observability'],
        lookingFor: 'Design partners for evaluation pipelines',
        openToChat: true,
        profileText:
          'Avery is exploring retrieval quality benchmarks and evaluation tooling.',
      },
    }),
    prisma.attendee.create({
      data: {
        eventId: event.id,
        name: 'Priya Raman',
        headline: 'Product Lead, B2B AI Search',
        bio: 'Ships semantic search and retrieval products for enterprise teams.',
        company: 'Northstar Cloud',
        role: 'Product',
        skills: ['product strategy', 'enterprise search', 'go-to-market'],
        lookingFor: 'Engineers building secure enterprise copilots',
        openToChat: true,
        profileText:
          'Priya is looking for implementation partners for secure AI search.',
      },
    }),
    prisma.attendee.create({
      data: {
        eventId: event.id,
        name: 'Jordan Miles',
        headline: 'Founder, GTM Ops Studio',
        bio: 'Helps early-stage AI startups design repeatable sales motions.',
        company: 'GTM Ops Studio',
        role: 'Founder',
        skills: ['sales', 'partnerships', 'community'],
        lookingFor: 'AI startups preparing Series A fundraising',
        openToChat: false,
        profileText:
          'Jordan runs workshops on turning user interviews into GTM campaigns.',
      },
    }),
  ]);

  const session = await prisma.conciergeSession.create({
    data: {
      eventId: event.id,
      attendeeId: attendees[0].id,
      status: ConciergeSessionStatus.ACTIVE,
      lastIntent: 'find_relevant_people',
      lastMessageAt: new Date('2026-06-10T16:10:00.000Z'),
    },
  });

  await prisma.conciergeMessage.create({
    data: {
      sessionId: session.id,
      role: ConciergeMessageRole.USER,
      message:
        'I want to meet product leaders working on enterprise AI search.',
    },
  });

  const assistantMessage = await prisma.conciergeMessage.create({
    data: {
      sessionId: session.id,
      role: ConciergeMessageRole.ASSISTANT,
      message: 'I found a strong match and drafted an intro.',
    },
  });

  await prisma.messageFeedback.create({
    data: {
      messageId: assistantMessage.id,
      rating: 5,
      notes: 'Great fit and clear rationale for the intro.',
    },
  });

  console.log(
    `Seeded event ${event.title} with ${attendees.length} attendees and session ${session.id}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
