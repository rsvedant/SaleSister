# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SaleSister** is a multi-platform sales assistant application built with Better-T-Stack, consisting of three main components:

1. **Web App** (`apps/web`): Next.js 16 dashboard with React 19 and shadcn/ui
2. **Chrome Extension** (`apps/salesister-extension`): Browser extension with popup, sidepanel, and content scripts (Manifest V3)
3. **Backend** (`packages/backend`): Convex cloud backend with Better Auth integration

This is a TypeScript-first monorepo managed with Turborepo and Bun.

## Development Commands

### Root Level (All Apps)
```bash
bun install              # Install all dependencies
bun dev                  # Start all apps in dev mode (Turborepo TUI)
bun build                # Build all apps
bun check-types          # Type-check all packages
```

### Web App (Port 3001)
```bash
bun dev:web              # Start only web app
cd apps/web && bun dev   # Alternative
cd apps/web && bun build # Build web app
```

### Chrome Extension
```bash
cd apps/salesister-extension && bun dev      # Dev mode with HMR
cd apps/salesister-extension && bun build    # Build extension (outputs to dist/ and creates zip)
cd apps/salesister-extension && bun check-types  # Type-check extension
```

### Backend (Convex)
```bash
bun dev:server           # Start Convex dev server
bun dev:setup            # First-time Convex project setup (REQUIRED before first run)
cd packages/backend && bun dev  # Alternative
```

## Architecture & Key Patterns

### Monorepo Structure

The project uses Turborepo with Bun workspaces. Three main packages:
- `apps/web`: Next.js application
- `apps/salesister-extension`: Chrome extension
- `packages/backend`: Convex backend functions and schema

### Data Flow Architecture

**Important:** This project does NOT use a traditional REST API. Instead:
- Frontend apps connect directly to Convex cloud backend
- All data operations are Convex functions (queries, mutations, actions)
- Real-time reactive subscriptions via Convex hooks
- No Express/Fastify server - Convex handles all backend logic

### Convex Backend Patterns

**Schema Definition** (`packages/backend/convex/schema.ts`):
- Define tables with `defineTable()` and validators
- Auto-generates TypeScript types in `_generated/`
- Example: `todos` table with text, isCompleted, and userId fields

**Function Types:**
- **Queries** (`query`): Read data, cacheable, reactive
- **Mutations** (`mutation`): Write data, transactional
- **Actions** (`action`): External API calls, non-transactional

**Example Usage:**
```typescript
// Backend: packages/backend/convex/todos.ts
export const get = query(async (ctx) => { ... });
export const create = mutation(async (ctx, args) => { ... });

// Frontend: React component
const todos = useQuery(api.todos.get);
const createTodo = useMutation(api.todos.create);
```

### Authentication Architecture

**Better Auth with Convex:**
- Auth configured in `packages/backend/convex/auth.config.ts`
- HTTP routes handled in `packages/backend/convex/http.ts`
- Web app endpoints: `/api/auth/[...all]` in `apps/web/src/app/api/auth/[...all]/route.ts`

**Two Auth Utilities:**
1. **Client-side** (`apps/web/src/lib/auth-client.ts`): For React components
2. **Server-side** (`apps/web/src/lib/auth-server.ts`): For Next.js server components and API routes

Always use the appropriate utility based on component type (client vs server).

### Next.js App Structure

- **App Router** (Next.js 13+): Pages in `apps/web/src/app/`
- **Typed Routes**: Enabled via `next.config.ts`
- **Path Aliases**: `@/` prefix maps to `src/` directory
- **Server Components**: Default, use 'use client' directive when needed
- **React 19**: Uses React Compiler for optimization

### Chrome Extension Structure

**Manifest V3** (`apps/salesister-extension/manifest.config.ts`):
- **Popup**: Quick access UI
- **Sidepanel**: Extended UI panel
- **Content Scripts**: Injected into all HTTPS pages
- **Permissions**: `sidePanel`, `contentSettings`

**Build System**: CRXJS Vite plugin provides HMR during development and bundles to `dist/` directory.

### Styling System

- **TailwindCSS 4.x**: Utility-first styling with PostCSS plugin
- **shadcn/ui**: Reusable components in `apps/web/src/components/ui/`
  - New York style variant
  - Neutral base color
  - Radix UI primitives for accessibility
- **Lucide React**: Default icon library
- **Next Themes**: Dark/light mode support
- **CSS Variables**: Used for theming (see `apps/web/src/app/globals.css`)

### TypeScript Configuration

All packages use strict TypeScript with:
- `strict: true`
- `noUncheckedIndexedAccess: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`
- ESNext target with bundler module resolution

Path aliases configured in `tsconfig.json` files.

## First-Time Setup

1. **Install dependencies**: `bun install`
2. **Configure Convex**: `bun dev:setup` (creates Convex project and sets environment variables)
3. **Start development**: `bun dev` (starts all apps)

**Required Environment Variables:**
- `NEXT_PUBLIC_CONVEX_URL`: Convex deployment URL (set by dev:setup)
- `NEXT_PUBLIC_CONVEX_SITE_URL`: Site URL for auth callbacks

## Important Files & Locations

### Backend (Convex)
- `packages/backend/convex/schema.ts`: Database schema definitions
- `packages/backend/convex/todos.ts`: Example CRUD operations
- `packages/backend/convex/auth.ts`: Better Auth configuration
- `packages/backend/convex/http.ts`: HTTP actions for auth callbacks
- `packages/backend/convex/_generated/`: Auto-generated types (don't edit manually)

### Web App
- `apps/web/src/app/`: Next.js pages (App Router)
- `apps/web/src/components/ui/`: shadcn/ui components
- `apps/web/src/lib/auth-client.ts`: Client-side auth utilities
- `apps/web/src/lib/auth-server.ts`: Server-side auth utilities
- `apps/web/components.json`: shadcn/ui configuration
- `apps/web/next.config.ts`: Next.js configuration

### Chrome Extension
- `apps/salesister-extension/manifest.config.ts`: Extension manifest
- `apps/salesister-extension/src/popup/`: Popup UI
- `apps/salesister-extension/src/sidepanel/`: Sidepanel UI
- `apps/salesister-extension/src/content/`: Content scripts
- `apps/salesister-extension/vite.config.ts`: Vite + CRXJS configuration

### Root Configuration
- `turbo.json`: Turborepo task orchestration
- `tsconfig.base.json`: Shared TypeScript configuration
- `package.json`: Workspace and script definitions
- `bunfig.toml`: Bun package manager settings

## Adding shadcn/ui Components

```bash
cd apps/web
npx shadcn@latest add [component-name]
```

Components are added to `apps/web/src/components/ui/` and can be imported via `@/components/ui/[component-name]`.

## Working with Convex

### Adding New Tables
1. Define schema in `packages/backend/convex/schema.ts`
2. Run dev server to regenerate types: `bun dev:server`
3. Types appear in `packages/backend/convex/_generated/dataModel.d.ts`

### Creating New Functions
1. Create file in `packages/backend/convex/` (e.g., `myFeature.ts`)
2. Export query/mutation/action functions
3. Import in frontend: `import { api } from "@/convex/_generated/api"`
4. Use with hooks: `useQuery(api.myFeature.functionName)`

### Accessing Auth in Convex Functions
```typescript
export const myQuery = query(async (ctx) => {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new Error("Unauthorized");
  // ... query logic
});
```

## Notes

- **Turborepo TUI**: Development mode uses Turborepo's TUI for better process management
- **Bun as Package Manager**: All dependency operations use Bun (not npm/yarn/pnpm)
- **No Database Migrations**: Convex handles schema evolution automatically
- **Example Todo App**: Included as reference implementation in `apps/web/src/app/todos/` and `packages/backend/convex/todos.ts`
