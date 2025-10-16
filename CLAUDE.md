# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development

```bash
bun run start              # Start the main server (src/app.ts)
bun run start:pad          # Start the pad server (src/pad.ts)
```

### Code Quality

```bash
bun run format             # Format code with Prettier
bun run lint               # Lint code with ESLint
bun run lint:fix           # Fix linting issues automatically
```

### Testing

```bash
bun run test               # Run tests with Vitest
bun run test:ui            # Run tests with Vitest UI
```

### Database

```bash
bunx drizzle-kit generate  # Generate migrations from schema changes
bunx drizzle-kit migrate   # Run migrations
bunx drizzle-kit studio    # Open Drizzle Studio (database GUI)
```

## Architecture

### Technology Stack

- **Runtime**: Bun
- **Web Framework**: Hono
- **Package Manager**: pnpm
- **Database**: SQLite with LibSQL client
- **ORM**: Drizzle ORM (v0.44.5+)
- **Effect System**: Effect-TS for functional programming and dependency injection
- **Auth**: better-auth with Expo plugin and Google OAuth
- **Validation**: Zod schemas with hono-openapi integration
- **Date Manipulation**: date-fns for date calculations and formatting
- **Testing**: Vitest

### Project Structure

#### Core Application (`src/app.ts`)

Entry point that:

- Initializes auth routes at `/api/auth/*`
- Mounts developer routes at `/developer`
- Mounts health check at `/health`
- Applies global middleware (logger, auth)

#### Route Organization (`src/routes/`)

- **developer/**: Developer-facing endpoints
  - `app.ts`: Application CRUD operations
  - `payment.ts`: Payment creation and validation
  - `validate.ts`: Validation endpoints
- **health.ts**: Health check endpoint

Routes use `createApp()` helper which applies standard middleware stack.

#### Effect-TS Architecture

The codebase uses Effect-TS for:

- **Dependency Injection**: Services are defined as Effect.Service (e.g., `DatabaseService`, `EditsService`)
- **Error Handling**: Use `Effect.either` and `runAsApp` to convert Effects to Promises
- **Runtime**: `runAsApp` from `src/lib/runtime.ts` provides DatabaseService and FetchHttpClient layers

**Pattern**: All use cases return `Effect<Result, Error, Requirements>` and are executed in routes via:

```typescript
const result = await useCase(params).pipe(Effect.either, runAsApp);
if (Either.isLeft(result)) {
  // Handle error
}
return result.right;
```

#### Domain Layer (`src/domain/`)

- **use-case/**: Business logic organized by domain (account, developer, gifticon, point, store, tester)
- **schema/**: Domain validation schemas
- **error/**: Custom error types (HttpError with status codes)

Use cases are Effect-TS functions that coordinate between database and external services.

#### Database (`src/db/`)

- **schema/**: Drizzle table definitions with relations
  - Export both raw schemas and Zod schemas (e.g., `NewApplicationSchema`)
  - Use `createInsertSchema` and `createSelectSchema` from drizzle-zod
- **index.ts**: Database instance with `snake_case` configuration
- **errors.ts**: Database-specific errors

Database is injected as `DatabaseService` via Effect-TS.

#### Google Play Integration (`src/google/`)

Structured in three layers:

- **schema/**: Zod schemas for Google Play API responses
- **api/**: Low-level API calls to Google Play endpoints (edits, testers, listings, tracks, images)
- **service/**: Effect-TS services that compose API calls (e.g., `EditsService`)

#### Authentication

- Uses better-auth with Expo plugin for mobile support
- Google OAuth configured via environment variables
- Auth middleware (`src/lib/middleware/auth.ts`) injects `user` and `session` into context
- Protected routes check `c.get("user")` for authentication

#### Environment Variables (`src/lib/env.ts`)

Validated with @t3-oss/env-core and Zod. Required variables:

- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`: Auth configuration
- `DB_FILE_NAME`: SQLite database file path
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: OAuth
- `PAYAPP_URL`, `PAYAPP_USER_ID`, `PAYAPP_LINK_KEY`, `PAYAPP_LINK_VALUE`: Payment integration
- `MINIMUM_PAYMENT_AMOUNT`: Payment validation

#### Path Aliases

TypeScript is configured with `@/*` mapping to `src/*`.

## Development Patterns

### Adding a New Route

1. Create use case in `src/domain/use-case/[domain]/`
2. Define schemas in `src/db/schema/` or `src/domain/schema/`
3. Create route file in `src/routes/`
4. Use `validator` from hono-openapi for request validation
5. Execute use case with `Effect.either` and `runAsApp`
6. Handle Either result and return appropriate HTTP response

### Adding a Database Table

1. Define table in `src/db/schema/[name].ts`
2. Define relations if needed
3. Export from `src/db/schema/index.ts`
4. Run `bunx drizzle-kit generate` to create migration
5. Run `bunx drizzle-kit migrate` to apply migration

### Testing

- Tests are colocated with use cases (e.g., `*.use-case.test.ts`)
- Use Vitest with Effect-TS test utilities
- Run specific test: `bun test [filename]`

### Date Manipulation

- **Always use date-fns** for date operations instead of native Date methods
- Use `format()` for date formatting (e.g., `format(new Date(), "yyyy-MM-dd")`)
- Use `differenceInDays()` for calculating day differences
- Common date-fns functions: `addDays()`, `subDays()`, `startOfDay()`, `endOfDay()`, `isAfter()`, `isBefore()`

### Error Handling

- Use `HttpError` from `src/domain/error/http-error.ts` for HTTP errors with status codes
- Use `mapHttpError` helper from `src/lib/effect.ts` to convert Promise rejections to HttpError
- Return appropriate status codes via Either pattern
