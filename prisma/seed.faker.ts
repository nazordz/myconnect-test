import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker';
import {
  PrismaClient,
  ConciergeMessageRole,
  ConciergeSessionStatus,
} from '../src/generated/prisma/client';

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

faker.seed(42); // For reproducible data

const SKILLS = [
  'rag',
  'vector search',
  'llm',
  'observability',
  'product strategy',
  'enterprise search',
  'go-to-market',
  'sales',
  'partnerships',
  'community',
  'fundraising',
  'infrastructure',
  'security',
  'analytics',
  'integration',
  'customer success',
];

const ROLES = [
  'Engineer',
  'Product',
  'Founder',
  'Sales',
  'Design',
  'Marketing',
];

const INTENTS = [
  'find_relevant_people',
  'get_event_info',
  'explore_sessions',
  'connect_with_attendee',
  'get_recommendations',
];

async function main() {
  await prisma.messageFeedback.deleteMany();
  await prisma.conciergeMessage.deleteMany();
  await prisma.conciergeSession.deleteMany();
  await prisma.attendee.deleteMany();
  await prisma.event.deleteMany();

  // Create event
  const event = await prisma.event.create({
    data: {
      title:
        faker.company.buzzPhrase() +
        ' ' +
        faker.helpers.arrayElement(['Summit', 'Conference', 'Summit', 'Forum']),
      location: `${faker.location.city()}, ${faker.location.state()}`,
      startAt: faker.date.future({ years: 1 }),
      endAt: faker.date.soon({ days: 3 }),
    },
  });

  // Generate 8 attendees
  const attendees = await Promise.all(
    Array.from({ length: 8 }, () =>
      prisma.attendee.create({
        data: {
          eventId: event.id,
          name: faker.person.fullName(),
          headline: `${faker.person.jobTitle()}, ${faker.company.name()}`,
          bio: faker.person.bio(),
          company: faker.company.name(),
          role: faker.helpers.arrayElement(ROLES),
          skills: faker.helpers.arrayElements(SKILLS, { min: 2, max: 5 }),
          lookingFor: faker.helpers.arrayElement([
            'Design partners for evaluation pipelines',
            'Engineers building secure enterprise copilots',
            'AI startups preparing Series A fundraising',
            'Collaboration on open source RAG projects',
            'Beta testers for new product launch',
            'Technical advisors for early-stage startup',
            'Partnership opportunities in the AI space',
          ]),
          openToChat: faker.datatype.boolean(),
          profileText: faker.lorem.sentence(),
        },
      }),
    ),
  );

  // Pick 3 random attendees to have active sessions
  const activeAttendees = faker.helpers.arrayElements(attendees, 3);

  for (const attendee of activeAttendees) {
    const session = await prisma.conciergeSession.create({
      data: {
        eventId: event.id,
        attendeeId: attendee.id,
        status: ConciergeSessionStatus.ACTIVE,
        lastIntent: faker.helpers.arrayElement(INTENTS),
        lastMessageAt: faker.date.recent({ days: 1 }),
      },
    });

    // Create user message
    await prisma.conciergeMessage.create({
      data: {
        sessionId: session.id,
        role: ConciergeMessageRole.USER,
        message: faker.helpers.arrayElement([
          'I want to meet founders working on enterprise AI.',
          'Can you help me find people interested in RAG infrastructure?',
          'Who should I talk to about product strategy for AI search?',
          'I am looking for partnership opportunities at this event.',
        ]),
      },
    });

    // Create assistant message
    const assistantMessage = await prisma.conciergeMessage.create({
      data: {
        sessionId: session.id,
        role: ConciergeMessageRole.ASSISTANT,
        message: faker.helpers.arrayElement([
          'I found a few relevant attendees who match your goals.',
          'Here are the strongest people to meet based on your profile.',
          'A good next step is to connect with attendees focused on similar AI problems.',
          'I can help draft an intro once you choose who you want to meet.',
        ]),
      },
    });

    // Create optional feedback
    if (faker.datatype.boolean()) {
      await prisma.messageFeedback.create({
        data: {
          messageId: assistantMessage.id,
          rating: faker.number.int({ min: 3, max: 5 }),
          notes: faker.helpers.arrayElement([
            'Great recommendation!',
            'Very helpful response.',
            'Exactly what I needed.',
            'Could be more relevant.',
            null,
          ]),
        },
      });
    }
  }

  console.log(
    `Seeded event "${event.title}" with ${attendees.length} attendees and ${activeAttendees.length} active sessions`,
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
