# MyConnect.ai test by Naufal

## Quick Run

```bash
pnpm exec prisma migrate deploy
docker compose up -d
```

## Development notes

```bash
# Create migration file without applying it to db
pnpm exec prisma migrate dev --create-only

# apply migration for dev
pnpm exec prisma migrate dev

# run seeding
pnpm prisma:seed
```

## Notes

1. for `Conversation state` I considered to save the state manually into db to keep this project simple and future consideration for other LLM providers.
2. openAI with model text-embedding-3-small fit for vector(1536) in postgres.

## Architecture

1

## Todos

1. [Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)
2. [Function calling](https://developers.openai.com/api/docs/guides/function-calling)
3. Consider to compating conversation
4. Tools:
   1. search_attendees
   2. score_match
   3. draft_intro_message
