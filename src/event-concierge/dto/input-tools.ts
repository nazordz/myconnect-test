import { Event } from '@/generated/prisma/client';

export interface SearchAttendeesParams {
  lookingFor: string;
  skills: string[];
  limit: number | null;
}

export type ToolScope = {
  eventId: string;
  attendeeId: string;
};

export interface SearchAttendeeRow {
  id: string;
  name: string;
  headline: string | null;
  company: string | null;
  role: string | null;
  skills: string[] | null;
  looking_for: string | null;
  bio: string | null;
  semanticScore: number;
  skill_overlap_score: number;
  final_score: number;
}

export interface FunctionCallOutput {
  type: 'function_call_output';
  call_id: string;
  output: string;
}

export type AttendeeProfile = {
  attendeeId: string;
  name: string;
  headline: string;
  bio: string;
  company: string;
  role: string;
  skills: string[];
  lookingFor: string;
};

export type ScoreMatchCandidate = {
  semanticScore: number;
  skillOverlapScore: number;
  lookingForMatchScore: number;
  finalScore: number;
} & AttendeeProfile;

export interface ScoreMatchParams {
  event: Event;
  userMessage: string;
  requester: AttendeeProfile;
  candidates: ScoreMatchCandidate[];
}

export type DraftIntroMessageParams = {
  candidate_ids: string[];
};

export type DraftIntroMessageInput = {
  event: Event;
  requester: AttendeeProfile;
  candidates: AttendeeProfile[];
};

export type LogToolCall = {
  concierge_message_id: string;
  request_id: string;
  tool_name: string;
  latency: number;
  tokens: number;
};
