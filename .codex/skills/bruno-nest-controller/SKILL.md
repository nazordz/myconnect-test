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
2. Read related DTO files used by `@Body()` and `@Query()` so Bruno bodies and query params match the current schema.
3. Read `src/main.ts` to confirm versioning and base path.
4. Inspect the existing Bruno collection under `bruno/` and preserve its YAML format:
   - `info.name`
   - `info.type: http`
   - `info.seq`
   - `http.method`
   - `http.url`
   - `http.params` with query and path params
   - `auth: inherit`
   - shared `settings`
5. Group request files under a module folder directly inside `bruno/`, for example:
   - `bruno/events/list attendees.yml`
   - `bruno/concierge/send message.yml`
6. Generate one YAML file per endpoint.

## Route mapping

- `@Controller('avatars')` with URI versioning in `src/main.ts` maps to `http://localhost:3000/api/v1/avatars`.
- `@Controller({ path: 'persona', version: '1' })` maps to `http://localhost:3000/api/v1/persona`.
- Use the collection `{{baseUrl}}` variable in request URLs instead of hardcoding host, prefix, or version when existing files do so.
- Preserve path params as Bruno colon path segments such as `:eventId`, not `{{eventId}}`.
- Add a matching `http.params` entry for each path param with `type: path`, for example:

```yaml
http:
  method: GET
  url: "{{baseUrl}}/events/:eventId/attendees?page=1&pageSize=20"
  params:
    - name: page
      value: "1"
      type: query
    - name: pageSize
      value: "20"
      type: query
    - name: eventId
      value: 2e9d8bb4-5f9a-4f43-a208-06d0ecab9242
      type: path
```

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

## Request params rules

- Sync Bruno path params and query params from the controller method signature and DTOs.
- For `@Param('name')`, keep the URL segment as a Bruno colon path param such as `:name`, and add a matching `http.params` item with `name: name` and `type: path`.
- Do not model path params only as `runtime.variables`; use `http.params` with `type: path` so files match `bruno/events/list attendees.yml`.
- For `@Query() dto: SomeDto`, read `SomeDto` and add matching query params for its fields.
- For `@Query('name')`, add a matching query param named `name`.
- Keep `http.url` query strings and `http.params` query entries in sync when existing files use both.
- Preserve DTO field names exactly, including optional fields, defaults, and existing typos in source.
- Use sample values that satisfy DTO validators and transforms, for example numeric strings for `@Type(() => Number)` fields and `true` or `false` for boolean query fields.
- When controller DTOs change, update the existing Bruno request body or params instead of leaving stale fields behind.

## Validation

- Keep sequence numbers unique across the collection.
- Match URLs to the current controller path and global versioning prefix.
- Confirm every controller `@Body()`, `@Query()`, and `@Param()` input is represented in the matching Bruno request body, query params, or `type: path` params.
- Preserve the existing YAML style already used in this repo.
