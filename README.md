# MyConnect.ai test by Naufal

## Quick Run

```bash
docker compose up -d
pnpm exec prisma migrate deploy

# optional for seeder data
pnpm prisma:seed
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

Questions:

1. Why you chose your agent framework / vector store / LLM.
   - I chose pgvector because I'm familiary with it to embed specific data.
   - I chose OpenAI provider because I'm used to use their sdk native in javascript.
2. How the agent state is persisted and resumed.
   - I saved the conversation data into database and then to resume the conversation
    I'll call the data and send it back to OpenAI sdk.
3. How you'd scale this to 10k concurrent attendees at a single event.
   - I’ll set up replicas and PgBouncer for Postgres to separate read and write workloads. This should improve read query performance, since read operations will be handled by the replicas.
   - I’ll deploy this application to a Kubernetes cluster and set up autoscaling for the deployment, so it can increase the number of replicas when request workload is high.
   - I’d move embedding work to background jobs and add queueing for LLM heavy flows.
4. How you'd handle PII / data protection (relevant if MyConnect operates in
jurisdictions with strict data laws)
    - I would avoid logging raw profiles, raw chat content, or full prompt/tool payloads in production.
    - I would define retention and deletion policies for attendee and conversation data, especially if operating in stricter privacy jurisdictions.
    - I would refactor my code to only send the data to LLM that required for matching and recommendation generation.
