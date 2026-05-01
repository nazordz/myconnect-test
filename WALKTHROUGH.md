# MyConnect AI Networking Concierge — Simple Walkthrough

This walkthrough shows the main user flow, the endpoints used, and example request/response payloads.

## 1. User flow

The main flow is:

1. Create or select an event.
2. Add attendees to that event.
3. One attendee sends a message to the AI Concierge.
4. The Concierge searches attendees in the same event.
5. The Concierge scores the returned candidates in batch.
6. The Concierge drafts intro messages for selected candidates in batch.
7. The API returns a concise recommendation summary.

Behind the scenes, the AI tool flow is:

```text
user message
  -> search_attendees
  -> score_match
  -> draft_intro_message
  -> final concierge response
```

Important implementation detail:

```text
score_match and draft_intro_message are processed in batch.
They are not called once per attendee.
```

This keeps the endpoint faster and avoids unnecessary LLM calls.

---

## 2. Create an event

### Endpoint

```http
POST /events
```

### Request

```json
{
    "title": "AI Startup Networking Night",
    "location": "Jakarta",
    "startAt": "2026-06-25T09:00:00.000Z",
    "endAt": "2026-06-25T17:00:00.000Z"
}
```

### Response

```json
{
    "id": "aaa2ecff-f0fc-4eb8-bec6-1b9665159f3d",
    "title": "AI Startup Networking Night",
    "location": "Jakarta",
    "startAt": "2026-06-25T09:00:00.000Z",
    "endAt": "2026-06-25T17:00:00.000Z",
    "createdAt": "2026-04-26T16:42:16.416Z",
    "updatedAt": "2026-04-26T16:42:16.416Z"
}
```

### Other event endpoints

```http
PATCH /events/:eventId
DELETE /events/:eventId
```

`PATCH /events/:eventId` accepts the same fields as event creation, but all fields are optional. `DELETE /events/:eventId` removes the event and cascades related attendees and concierge sessions.

---

## 3. Add attendees to the event

### Endpoint

```http
POST /events/:eventId/attendees
```

### Request

```json
{
    "name": "Naufal",
    "headline": "Backend Engineer",
    "bio": "Backend engineer interested in AI products and scalable systems.",
    "company": "MyConnect",
    "role": "Backend Engineer",
    "skills": ["nestjs", "postgresql", "backend", "ai"],
    "lookingFor": "AI startups that may need a technical co-founder",
    "openToChat": true
}
```

### Response

```json
{
    "id": "0ab61792-cc93-40df-bf22-e6e1b0d01773",
    "eventId": "aaa2ecff-f0fc-4eb8-bec6-1b9665159f3d",
    "name": "Naufal",
    "headline": "Backend Engineer",
    "bio": "Backend engineer interested in AI products and scalable systems.",
    "company": "MyConnect",
    "role": "Backend Engineer",
    "skills": ["nestjs", "postgresql", "backend", "ai"],
    "lookingFor": "AI startups that may need a technical co-founder",
    "openToChat": true,
    "profileText": "name: Naufal\nheadline: Backend Engineer\nbio: Backend engineer interested in AI products and scalable systems.\nCompany: MyConnect\nRole: Backend Engineer\nSkills: nestjs, postgresql, backend, ai\nLooking for: AI startups that may need a technical co-founder\nOpen to chat: yes",
    "embeddingModel": "text-embedding-3-small",
    "embeddingUpdatedAt": "2026-04-26T16:42:16.416Z",
    "createdAt": "2026-04-26T16:42:16.416Z",
    "updatedAt": "2026-04-26T16:42:16.416Z"
}
```

When an attendee is created, the backend builds a `profileText` and generates an embedding for semantic search.

---

## 4. List attendees in an event

### Endpoint

```http
GET /events/:eventId/attendees
```

Optional query parameters:

```http
GET /events/:eventId/attendees?page=1&pageSize=20&skills=nestjs,ai&openToChat=true&search=naufal
```

### Response

```json
{
    "total": 2,
    "page": 1,
    "pageSize": 20,
    "items": [
        {
            "id": "0ab61792-cc93-40df-bf22-e6e1b0d01773",
            "eventId": "aaa2ecff-f0fc-4eb8-bec6-1b9665159f3d",
            "name": "Naufal",
            "headline": "Backend Engineer",
            "bio": "Backend engineer interested in AI products and scalable systems.",
            "company": "MyConnect",
            "role": "Backend Engineer",
            "skills": ["nestjs", "postgresql", "backend", "ai"],
            "lookingFor": "AI startups that may need a technical co-founder",
            "openToChat": true,
            "profileText": "name: Naufal\nheadline: Backend Engineer\nbio: Backend engineer interested in AI products and scalable systems.\nCompany: MyConnect\nRole: Backend Engineer\nSkills: nestjs, postgresql, backend, ai\nLooking for: AI startups that may need a technical co-founder\nOpen to chat: yes",
            "embeddingModel": "text-embedding-3-small",
            "embeddingUpdatedAt": "2026-04-26T16:42:16.416Z",
            "createdAt": "2026-04-26T16:42:16.416Z",
            "updatedAt": "2026-04-26T16:42:16.416Z"
        },
        {
            "id": "9b9ff6a2-95d7-4ff6-a08e-46a61aef8921",
            "eventId": "aaa2ecff-f0fc-4eb8-bec6-1b9665159f3d",
            "name": "Sarah Lim",
            "headline": "Founder at LedgerAI",
            "bio": "Founder building AI finance tooling.",
            "company": "LedgerAI",
            "role": "Founder",
            "skills": ["ai", "b2b saas", "startup", "product"],
            "lookingFor": "Looking for a backend co-founder",
            "openToChat": true,
            "profileText": "name: Sarah Lim\nheadline: Founder at LedgerAI\nbio: Founder building AI finance tooling.\nCompany: LedgerAI\nRole: Founder\nSkills: ai, b2b saas, startup, product\nLooking for: Looking for a backend co-founder\nOpen to chat: yes",
            "embeddingModel": "text-embedding-3-small",
            "embeddingUpdatedAt": "2026-04-26T16:43:12.128Z",
            "createdAt": "2026-04-26T16:43:12.128Z",
            "updatedAt": "2026-04-26T16:43:12.128Z"
        }
    ]
}
```

---

## 5. Send a message to the AI Concierge

### Endpoint

```http
POST /events/:eventId/concierge/messages
```

### Request

```json
{
    "attendeeId": "0ab61792-cc93-40df-bf22-e6e1b0d01773",
    "message": "I'm a backend engineer in Jakarta, I'm at this event mainly to find AI startups that might need a technical co-founder. Ideally B2B SaaS."
}
```

### What happens internally

The backend creates or reuses a concierge session for:

```text
eventId + attendeeId
```

Then the AI Concierge uses tools:

### Step 1: `search_attendees`

The model extracts the attendee intent and calls:

```json
{
    "lookingFor": "AI startups that may need a technical co-founder",
    "skills": ["ai", "backend", "b2b saas", "startup"],
    "limit": 5
}
```

The tool schema does not accept `eventId` or `attendeeId`. The server injects those from the route and request body so the model cannot search outside the current event or impersonate another attendee.

The backend searches attendees from the same event using:

- semantic search with pgvector,
- keyword / skill overlap,
- event filter,
- `openToChat = true`,
- requester exclusion.

### Step 2: `score_match`

The backend sends all candidates from `search_attendees` to `score_match` in one batch.

Example input:

```json
{
    "event": {
        "id": "aaa2ecff-f0fc-4eb8-bec6-1b9665159f3d",
        "title": "AI Startup Networking Night",
        "location": "Jakarta",
        "startAt": "2026-06-25T09:00:00.000Z",
        "endAt": "2026-06-25T17:00:00.000Z"
    },
    "requester": {
        "attendeeId": "0ab61792-cc93-40df-bf22-e6e1b0d01773",
        "name": "Naufal",
        "headline": "Backend Engineer",
        "bio": "Backend engineer interested in AI products and scalable systems.",
        "company": "MyConnect",
        "role": "Backend Engineer",
        "skills": ["nestjs", "postgresql", "backend", "ai"],
        "lookingFor": "AI startups that may need a technical co-founder"
    },
    "candidates": [
        {
            "attendeeId": "9b9ff6a2-95d7-4ff6-a08e-46a61aef8921",
            "name": "Sarah Lim",
            "headline": "Founder at LedgerAI",
            "bio": "Founder building AI finance tooling.",
            "company": "LedgerAI",
            "role": "Founder",
            "skills": ["ai", "b2b saas", "startup", "product"],
            "lookingFor": "Looking for a backend co-founder",
            "finalScore": 0.91
        }
    ],
    "userMessage": "I'm a backend engineer in Jakarta, I'm at this event mainly to find AI startups that might need a technical co-founder. Ideally B2B SaaS."
}
```

Example output:

```json
{
    "matches": [
        {
            "attendeeId": "9b9ff6a2-95d7-4ff6-a08e-46a61aef8921",
            "score": 92,
            "rationale": "Strong fit because Sarah is building an AI B2B SaaS product and is looking for a backend co-founder.",
            "sharedGround": ["AI", "B2B SaaS", "backend engineering"]
        }
    ]
}
```

### Step 3: `draft_intro_message`

The backend drafts intro messages for selected candidates in batch.

Example input:

```json
{
    "candidate_ids": ["9b9ff6a2-95d7-4ff6-a08e-46a61aef8921"]
}
```

The tool only accepts candidate IDs. The server reloads candidate facts from the database before asking the model to draft intro messages.

Example output:

```json
{
    "messages": [
        {
            "attendeeId": "9b9ff6a2-95d7-4ff6-a08e-46a61aef8921",
            "content": "Hi Sarah, I noticed you're building LedgerAI and looking for a backend co-founder. I'm a backend engineer interested in AI products and B2B SaaS. Would love to connect and learn more about what you're building."
        }
    ]
}
```

---

## 6. Final Concierge response

### Response

```json
{
    "text": "Here are 1 people worth talking to:\n1. Sarah Lim - Founder at LedgerAI. Strong fit because Sarah is building an AI B2B SaaS product and is looking for a backend co-founder. 92% match.\nShared ground: AI, B2B SaaS, backend engineering.\nDraft intro: \"Hi Sarah, I noticed you're building LedgerAI and looking for a backend co-founder. I'm a backend engineer interested in AI products and B2B SaaS. Would love to connect and learn more about what you're building.\""
}
```

The current structured response schema only returns `text`. It does not include `intent`.

---

## 7. Submit feedback for a Concierge message

### Endpoint

```http
POST /messages/:messageId/feedback
```

### Request

```json
{
    "rating": 5,
    "notes": "The recommendation was relevant and the intro draft was useful."
}
```

`rating` must be an integer from 1 to 5. `notes` is optional.

### Response

```json
{
    "id": "11b58b35-0e18-4bfe-8d3f-78b8660f5c9f",
    "messageId": "6c28d3c9-2ae8-4266-bf24-c79de15abcb0",
    "rating": 5,
    "notes": "The recommendation was relevant and the intro draft was useful.",
    "createdAt": "2026-04-26T16:48:31.882Z"
}
```

---

## 8. Summary

The core Concierge flow is:

```text
POST /events/:eventId/concierge/messages
```

This endpoint:

1. stores the user message,
2. calls OpenAI with available tools,
3. searches attendee candidates,
4. scores candidates in batch,
5. drafts intro messages in batch,
6. returns a concise recommendation summary.

The main optimization is batch processing:

```text
search_attendees returns multiple candidates
score_match scores all candidates in one call
draft_intro_message drafts messages for selected candidates in one call
```

This avoids calling the model once per attendee and keeps the system simpler, faster, and cheaper.
