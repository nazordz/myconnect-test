import {
  ConciergeMessageRole,
  ConciergeSessionStatus,
  PrismaClient,
  ToolCallStatus,
} from '../src/generated/prisma/client';

const prisma = new PrismaClient();

async function main() {
  await prisma.messageFeedback.deleteMany();
  await prisma.matchSuggestion.deleteMany();
  await prisma.conciergeToolCall.deleteMany();
  await prisma.conciergeMessage.deleteMany();
  await prisma.conciergeSession.deleteMany();
  await prisma.eventAttendee.deleteMany();
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
        name: 'Avery Chen',
        headline: 'Staff ML Engineer, DevTools AI',
        bio: 'Builds applied LLM infrastructure and observability tools.',
        company: 'ForgeLayer',
        role: 'Engineer',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Priya Raman',
        headline: 'Product Lead, B2B AI Search',
        bio: 'Ships semantic search and retrieval products for enterprise teams.',
        company: 'Northstar Cloud',
        role: 'Product',
      },
    }),
    prisma.attendee.create({
      data: {
        name: 'Jordan Miles',
        headline: 'Founder, GTM Ops Studio',
        bio: 'Helps early-stage AI startups design repeatable sales motions.',
        company: 'GTM Ops Studio',
        role: 'Founder',
      },
    }),
  ]);

  const [averyLink, priyaLink, jordanLink] = await Promise.all([
    prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        attendeeId: attendees[0].id,
        skills: ['rag', 'vector search', 'observability'],
        lookingFor: 'Design partners for evaluation pipelines',
        openToChat: true,
        profileText:
          'Avery is exploring retrieval quality benchmarks and evaluation tooling.',
      },
    }),
    prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        attendeeId: attendees[1].id,
        skills: ['product strategy', 'enterprise search', 'go-to-market'],
        lookingFor: 'Engineers building secure enterprise copilots',
        openToChat: true,
        profileText:
          'Priya is looking for implementation partners for secure AI search.',
      },
    }),
    prisma.eventAttendee.create({
      data: {
        eventId: event.id,
        attendeeId: attendees[2].id,
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
      eventAttendeeId: averyLink.id,
      status: ConciergeSessionStatus.ACTIVE,
      lastIntent: 'find_relevant_people',
      lastMessageAt: new Date('2026-06-10T16:10:00.000Z'),
    },
  });

  const userMessage = await prisma.conciergeMessage.create({
    data: {
      sessionId: session.id,
      role: ConciergeMessageRole.USER,
      content: {
        text: 'I want to meet product leaders working on enterprise AI search.',
      },
      rawText: 'I want to meet product leaders working on enterprise AI search.',
      requestId: 'seed-request-1',
    },
  });

  const assistantMessage = await prisma.conciergeMessage.create({
    data: {
      sessionId: session.id,
      role: ConciergeMessageRole.ASSISTANT,
      content: {
        text: 'I found a strong match and drafted an intro.',
      },
      rawText: 'I found a strong match and drafted an intro.',
      requestId: 'seed-request-1',
    },
  });

  await prisma.conciergeToolCall.create({
    data: {
      messageId: assistantMessage.id,
      toolName: 'search_attendees',
      toolCallId: 'tool-seed-1',
      status: ToolCallStatus.SUCCEEDED,
      input: { query: 'enterprise search product' },
      output: { candidates: [priyaLink.id] },
      latencyMs: 118,
    },
  });

  await prisma.matchSuggestion.create({
    data: {
      messageId: assistantMessage.id,
      requesterEventAttendeeId: averyLink.id,
      candidateEventAttendeeId: priyaLink.id,
      rank: 1,
      score: 91,
      rationale: 'Strong overlap on enterprise retrieval and productization.',
      sharedGround: {
        overlap: ['enterprise search', 'RAG quality'],
      },
      draftIntroMessage:
        'Avery and Priya are both focused on enterprise search quality. Worth a quick intro?',
      searchScore: 0.89,
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
  .catch(async (error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
