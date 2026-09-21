# ForgeCode

ForgeCode is an AI coding assistant with a live React preview and a plain PHP package prepared for InfinityFree hosting.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/ai-coding-assistant run dev` — run the ForgeCode preview
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/ai-coding-assistant/src/` — live React/Vite preview
- `artifacts/ai-coding-assistant/infinityfree/` — standalone PHP/HTML/CSS/JavaScript upload package
- `artifacts/api-server/src/routes/chat.ts` — preview API route with OpenAI-compatible forwarding
- `lib/api-spec/openapi.yaml` — source-of-truth API contract

## Architecture decisions

- The hosted version keeps the provider key server-side in `infinityfree/config.php`; browser code only calls `api/chat.php`.
- The Replit preview and PHP package share the same request and response shape.
- Without a configured provider key, the preview returns a labeled demo response so the UI remains usable during setup.

## Product

- Responsive AI coding workspace for writing, explaining, debugging, and improving code.
- Copyable fenced code blocks, starter prompts, code context, language selection, new conversation reset, and help surface.
- InfinityFree-ready PHP endpoint using cURL and an OpenAI-compatible chat completions API.

## User preferences

- User requested a complete PHP/HTML/CSS/JavaScript site suitable for InfinityFree and a future ZIP with `YOUR_API_KEY_HERE` as the API-key placeholder.

## Gotchas

- PHP is not installed in the Replit build environment, so the InfinityFree package is validated structurally and by the live Node preview/API route.
- The generated API client needs `dom.iterable` in its TypeScript library list because it uses `Headers.entries()`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
