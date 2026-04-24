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

# run seeding
pnpm prisma:seed
```
