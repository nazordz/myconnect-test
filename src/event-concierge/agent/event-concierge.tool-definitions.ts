import type { Tool } from 'openai/resources/responses/responses.js';
import {
  DraftIntroMessageToolParamsSchema,
  ScoreMatchToolParamsSchema,
  SearchAttendeesToolParamsSchema,
} from './event-concierge.schemas';
import { zodToJsonSchema } from './zod-to-json-schema';

export const conciergeToolDefinitions: Tool[] = [
  {
    type: 'function',
    strict: true,
    name: 'search_attendees',
    description:
      'Search attendee candidates within the same event using semantic and keyword matching.',
    parameters: zodToJsonSchema(SearchAttendeesToolParamsSchema),
  },
  {
    type: 'function',
    name: 'score_match',
    strict: true,
    description: [
      'use this tool to score list of attendees',
      'to call this tool, you must call search_attendees first because the tool needs to know who the candidates are.',
      'then, take a list of attendees from it to pass them to the candidates param.',
    ].join('\n'),
    parameters: zodToJsonSchema(ScoreMatchToolParamsSchema),
  },
  {
    type: 'function',
    name: 'draft_intro_message',
    strict: true,
    description: [
      'Draft a personalized introduction message from the requester to the candidates.',
      'to call this tool, you must call search_attendees first because the tool needs to know who the candidates are.',
    ].join('\n'),
    parameters: zodToJsonSchema(DraftIntroMessageToolParamsSchema),
  },
];
