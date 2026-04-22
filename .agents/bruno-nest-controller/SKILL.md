---
name: bruno-nest-controller
description: Create or reorganize Bruno YAML request files for NestJS modules and controllers. Use when the user asks to add Bruno requests for a Nest controller, split Bruno requests by module, or generate/update Bruno YAML files from controller and DTO files in this repository.
---

# Bruno Nest Controller

Create Bruno YAML request files for NestJS controllers in this repository.

## When to use

- The user asks for Bruno YAML files for a Nest module or controller.
- The user asks to reorganize Bruno requests by module.
- The user wants request examples refreshed after controller or DTO changes.

## Workflow

1. Read the target controller file first.
2. Read related DTO files used by `@Body()` so request examples match the current schema.
3. Read `src/main.ts` to confirm versioning and base path.
4. Inspect the existing Bruno collection under `bruno/howler operator` and preserve its YAML format:
   - `info.name`
   - `info.type: http`
   - `info.seq`
   - `http.method`
   - `http.url`
   - `auth: inherit`
   - shared `settings`
5. Group request files under a module folder inside the collection, for example:
   - `bruno/howler operator/persona/`
   - `bruno/howler operator/avatar/`
6. Generate one YAML file per endpoint.

## Route mapping

- `@Controller('avatars')` with URI versioning in `src/main.ts` maps to `http://localhost:3000/api/v1/avatars`.
- `@Controller({ path: 'persona', version: '1' })` maps to `http://localhost:3000/api/v1/persona`.
- Preserve path params with Bruno variables such as `{{avatarId}}` or `{{personaId}}`.

## File naming

- Prefer stable names inside each module folder:
  - `find all.yml`
  - `find by id.yml`
  - `create.yml`
  - `update.yml`
  - `delete.yml`
- If a controller method name is domain-specific but still a `POST` create route, `create.yml` is preferred over a verb-based alias.

## Request body rules

- For `POST` and `PATCH`, include `Content-Type: application/json`.
- Build sample JSON bodies from DTOs.
- Keep field names exactly as defined in DTOs, including existing typos in source, unless the user asks to fix application code too.
- If an update DTO has no fields, use `{}`.
- Do not invent auth headers unless existing Bruno files already define them.

## Validation

- Keep sequence numbers unique across the collection.
- Match URLs to the current controller path and global versioning prefix.
- Preserve the existing YAML style already used in this repo.
