---
name: prisma-public-table-sync
description: Use this skill when asked to sync PostgreSQL tables from schema public into this project's Prisma schema. Inspect the database through postgres-mcp, let the developer specify one or more tables to sync, then update prisma/schema.prisma only for those tables and regenerate the Prisma client if needed.
---

# Prisma Public Table Sync

Use this skill for requests such as:

- "sync table `personas` to Prisma"
- "refresh `avatars` and `gpus` from database"
- "update `prisma/schema.prisma` based on public tables"

This repository uses Prisma with `prisma/schema.prisma` and expects the datasource URL from `DATABASE_URL`.

## Workflow

1. Identify the target tables.
If the developer names specific tables, limit the work to those tables.
If the request is ambiguous, prefer the smallest reasonable scope and ask only when the target cannot be inferred safely.

2. Inspect the database with `postgres-mcp`.
Use these tools as needed:
- `list_objects` on schema `public` to confirm table names
- `get_object_details` for each target table
- `execute_sql` for `information_schema.columns`, `pg_constraint`, `pg_indexes`, or enum/default details when `get_object_details` is not enough

3. Translate the database shape into Prisma models.
Update only the models mapped to the requested tables.
Preserve unrelated models, field names, and formatting unless a referenced relation must be adjusted for correctness.

4. Reconcile Prisma-specific details.
- Keep `@@map("<table_name>")` for snake_case table names
- Keep `@map("<column_name>")` for snake_case columns when Prisma field names are camelCase
- Preserve native types such as `@db.Uuid`, `@db.VarChar`, `@db.Text`, `@db.Date`, `@db.Timestamptz(6)`
- Carry over defaults like `now()` and `dbgenerated(...)`
- Add or fix `@relation(...)` fields when foreign keys exist
- Add compound IDs, unique constraints, and indexes when present in the database

5. Validate locally after editing.
Run:
- `pnpm prisma:generate`
- `pnpm check`

If validation fails, fix the schema before finishing.

## Scope Rules

- Default to syncing only the tables the developer explicitly requested.
- If a requested table references another table, inspect the related table only as much as needed to model the relation correctly.
- Do not rewrite the whole Prisma schema unless the developer explicitly asks for a full sync.
- Do not use `prisma db pull` for this skill. The source of truth for discovery is `postgres-mcp`, and edits to `prisma/schema.prisma` should be intentional and scoped.

## Mapping Notes

- PostgreSQL `uuid` usually maps to `String @db.Uuid`
- `timestamp with time zone` usually maps to `DateTime @db.Timestamptz(6)`
- `date` usually maps to `DateTime @db.Date`
- `integer` usually maps to `Int`
- `text[]` usually maps to `String[] @db.Text`
- Nullable columns become optional Prisma fields

When in doubt, prefer the exact native database type annotation in Prisma rather than a looser mapping.

## Output Expectations

When the work is complete, report:

- which `public` tables were synced
- whether relations or constraints required touching neighboring models
- whether `pnpm prisma:generate` and `pnpm check` passed
