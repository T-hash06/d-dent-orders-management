# Copilot instructions

## Build, lint, type-check, and test

Use **pnpm** in this repository (not npm/yarn).

### Monorepo (repo root)
```bash
pnpm dev          # turbo run dev (apps + packages)
pnpm build        # turbo run build
pnpm lint         # biome lint
pnpm format       # biome check --write .
pnpm type-check   # turbo run type-check
pnpm check-types  # turbo run check-types
pnpm clean        # turbo run clean
```

### Target a single workspace
```bash
# Web app (React Router SSR)
pnpm --filter @full-stack-template/web dev
pnpm --filter @full-stack-template/web build
pnpm --filter @full-stack-template/web type-check
pnpm --filter @full-stack-template/web start

# UI package (Vite library)
pnpm --filter @full-stack-template/ui build
pnpm --filter @full-stack-template/ui type-check
```

### Web app data/i18n commands
```bash
pnpm --filter @full-stack-template/web drizzle-kit:generate
pnpm --filter @full-stack-template/web drizzle-kit:migrate
pnpm --filter @full-stack-template/web drizzle-kit:push
pnpm --filter @full-stack-template/web drizzle-kit:seed
pnpm --filter @full-stack-template/web drizzle-kit:studio
pnpm --filter @full-stack-template/web inlang
pnpm --filter @full-stack-template/web machine-translate
```

### Tests
- No test runner/scripts are currently configured in root, `apps/web`, or `packages/ui`.
- A true “single test” command is not available yet.

## High-level architecture

- This is a **pnpm + Turbo monorepo** with two workspaces: `apps/web` and `packages/ui`.
- `apps/web` is a **React Router v7 SSR** app (Vite build, Node server output in `build/server`).
- Routing is centralized in `apps/web/app/routes.ts` and wrapped with `prefix(':locale?', ...)`, so app routes are locale-prefixed.
- API-style endpoints are React Router routes:
  - `api/trpc/*` → `features/trpc/trpc.handler.ts`
  - `api/auth/*` → `features/better-auth/better-auth.handler.ts`
- Server-only domain logic lives under `apps/web/app/features/.server/**` (tRPC routers/procedures, auth, Drizzle DB access).
- tRPC is the main application boundary:
  - server init/context/error formatting in `.server/trpc/trpc.init.ts`
  - app router composition in `.server/trpc/trpc.router.ts`
  - client/provider wiring in `features/trpc/trpc.provider.tsx` and `trpc.context.tsx`.
- Auth uses **better-auth** with Drizzle adapter (`better-auth-server.lib.ts`) and role definitions in `better-auth-roles.constant.ts`.
- Database uses **Drizzle + LibSQL/SQLite**. Schema discovery for migrations is `app/features/.server/**/*.schema.ts`.
- i18n uses **inlang/paraglide**:
  - source config in `app/features/i18n/project.inlang/`
  - generated runtime/messages in `app/features/i18n/paraglide/` (generated files, do not hand-edit)
  - middleware added in `app/root.tsx`.
- `packages/ui` is a shared component library exported as `@full-stack-template/ui`; app code imports UI primitives/components from this package.

## Key repository conventions

- **Feature-first layout** in `apps/web/app/features/*` (products, orders, customers, auth, trpc, i18n, etc.).
- **Server-only code** stays in `.server` folders and is imported via server boundaries (handlers/procedures), not directly into client components.
- **Procedure naming pattern** in `.server`:
  - `get-*.query.ts`
  - `create-*.mutation.ts`, `update-*.mutation.ts`, `delete-*.mutation.ts`.
- **Route module naming pattern**:
  - `*.route.tsx` for route screens
  - `*.handler.ts` for endpoint handlers
  - feature layouts under `layout/`.
- **Schema colocation**: Drizzle table definitions and Zod input schemas are colocated by domain in `*.schema.ts` files.
- **Typed app imports** in `apps/web` should use alias `@/*` → `app/*` (see `apps/web/tsconfig.json`).
- **tRPC client usage pattern** in route components:
  - get client via `useTRPC()`
  - execute with TanStack Query using `trpc.<router>.<proc>.queryOptions()` / `mutationOptions()`.
- **State pattern**: server cache/state via TanStack Query; local table/filter/dialog UI state commonly via colocated Zustand stores.
- **i18n usage pattern**:
  - use message functions from `@/features/i18n/paraglide/messages`
  - use `m.someKey()` in UI and localized server messages via locale context.
- **Theme variable rule (mandatory for defined tokens)**:
  - for CSS properties/tokens already defined in `packages/ui/src/global.css`, use those theme variables/tailwind tokens (`bg-background`, `text-foreground`, `border-border`, `ring-ring`, etc.) instead of hardcoded color/spacing/shadow values.
  - only use custom values when the needed property/token is not defined in `packages/ui/src/global.css`.
- **shadcn composition priority**:
  - prefer using existing components and compositions exported by `packages/ui/src/index.ts` (`@full-stack-template/ui`) before creating custom UI primitives.
  - only build a new primitive/composition when no suitable export exists.
- **Formatting/linting** uses Biome from repo root:
  - tabs for indentation
  - single quotes
  - organize imports enabled.
