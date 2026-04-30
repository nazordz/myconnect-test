import { Event } from '@/generated/prisma/client';

export interface SearchAttendeesParams {
  eventId: string;
  attendeeId: string;
  lookingFor: string;
  skills: string[];
  limit: number | null;
}

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
  event: Event;
  requester: AttendeeProfile;
  candidate_ids: string[];
};

// export type SearchAttendeesOutput = {
//   candidates: Array<{
//     attendeeId: string;
//     name: string;
//     headline: string | null;
//     company: string | null;
//     role: string | null;
//     skills: string[];
//     lookingFor: string | null;
//     bio: string | null;
//     searchScore: number;
//     semanticScore: number;
//     skillOverlapScore: number;
//     keywordScore: number;
//   }>;
// };

// type IntroMessageAttendeeInput = {
//   attendeeId: string;
//   name: string;
//   headline?: string;
//   company?: string;
//   role?: string;
//   skills?: string[];
//   lookingFor?: string;
// };

// type MatchAttendeeInput = IntroMessageAttendeeInput & {
//   bio?: string;
// };
// export type DraftIntroMessageInput = {
//   requester: IntroMessageAttendeeInput;
//   candidate: IntroMessageAttendeeInput;
//   rationale: string;
//   sharedGround: string[];
//   userMessage: string;
// };

// export type DraftIntroMessageOutput = {
//   message: string;
// };

// export type ScoreMatchInput = {
//   eventId: string;
//   requester: MatchAttendeeInput;
//   candidates: Array<
//     MatchAttendeeInput & {
//       searchScore?: number;
//       semanticScore?: number;
//       skillOverlapScore?: number;
//       keywordScore?: number;
//     }
//   >;
//   userMessage: string;
// };
// export type ScoreMatchOutput = {
//   matches: Array<{
//     attendeeId: string;
//     score: number;
//     rationale: string;
//     sharedGround: string[];
//   }>;
// };
