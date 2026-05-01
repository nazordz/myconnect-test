import { z } from 'zod';

export const ConciergeIntentSchema = z.object({
  goal: z.string(),
  requesterProfile: z.object({
    role: z.string(),
    location: z.string().nullable(),
  }),
  targetAttendeeTypes: z.array(z.string()),
  domains: z.array(z.string()),
  keywords: z.array(z.string()),
  skills: z.array(z.string()),
  relationshipType: z.string(),
});

export const ConciergeMessageSchema = z.object({
  text: z.string(),
});

const EventToolSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  startAt: z.string(),
  endAt: z.string(),
});

const ScoreRequesterToolSchema = z.object({
  attendeeId: z.string(),
  name: z.string(),
  headline: z.string(),
  bio: z.string(),
  company: z.string(),
  role: z.string(),
  skills: z.array(z.string()),
  lookingFor: z.string(),
});

const ScoreCandidateToolSchema = z.object({
  attendeeId: z.string(),
  name: z.string(),
  headline: z.string(),
  bio: z.string(),
  company: z.string(),
  role: z.string(),
  skills: z.array(z.string()),
  lookingFor: z.string(),
  finalScore: z.number(),
});

export const SearchAttendeesToolParamsSchema = z.object({
  lookingFor: z
    .string()
    .describe('A normalized summary of what the requester is looking for.'),
  skills: z
    .array(z.string())
    .describe(
      'Skills or domains relevant to the kind of attendee the requester wants to find.',
    ),
  limit: z
    .number()
    .meta({ default: 5 })
    .describe('Maximum number of attendees to return.'),
});

export const ScoreMatchToolParamsSchema = z.object({
  event: EventToolSchema.describe('details about the event'),
  requester: ScoreRequesterToolSchema.describe(
    'details about the requester attendee',
  ),
  candidates: z
    .array(ScoreCandidateToolSchema)
    .describe('List of attendees from search_attendees to score.'),
  userMessage: z.string(),
});

export const DraftIntroMessageToolParamsSchema = z.object({
  candidate_ids: z
    .array(z.string())
    .describe('List of candidate attendee IDs from previous tool results.'),
});

export const ScoreMatchResultSchema = z.object({
  matches: z.array(
    z.object({
      attendeeId: z.string(),
      score: z.number().int().min(0).max(100),
      rationale: z.string(),
      sharedGround: z.array(z.string()),
    }),
  ),
});

export const DraftIntroMessageResultSchema = z.object({
  // message: z.string(),
  messages: z.array(z.object({ attendeeId: z.string(), content: z.string() })),
});
