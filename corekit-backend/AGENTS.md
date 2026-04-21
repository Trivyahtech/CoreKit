# Repository Guidelines

## Project Structure & Module Organization
- `src/` contains the NestJS backend code.
- `src/platform/` holds infrastructure modules (config, database, cache, queue, mail, storage, search, health).
- `src/common/` contains shared decorators, guards, filters, interceptors, DTOs, enums, and utilities.
- `src/modules/core/` covers identity and tenant/admin concerns (`auth`, `users`, `tenants`, `customers`).
- `src/modules/base/` covers commerce domains (`catalog`, `cart`, `orders`, `payments`, `shipping`, `inventory`, etc.).
- `prisma/` stores `schema.prisma`, migrations, and seed scripts.
- `test/` contains end-to-end tests; `storage/` is local file storage; `dist/` is build output.

## Build, Test, and Development Commands
- `docker compose up -d postgres redis`: start required local services.
- `npm run start:dev`: run API in watch mode for development.
- `npm run build`: compile TypeScript to `dist/`.
- `npm run start:prod`: run compiled app from `dist/main`.
- `npm run lint`: run ESLint with autofix on `src/` and `test/`.
- `npm test`: run Jest unit/integration suite.
- `npm run test:e2e`: run e2e tests from `test/`.
- `npm run test:cov`: generate coverage report.
- `npx prisma migrate dev` and `npx prisma db seed`: apply migrations and seed local DB.

## Coding Style & Naming Conventions
- TypeScript + NestJS conventions are required.
- Prettier settings: `singleQuote: true`, `trailingComma: all` (2-space indentation by Prettier default).
- Use kebab-case filenames with Nest suffixes: `*.module.ts`, `*.service.ts`, `*.controller.ts`.
- Keep DTOs in `dto/` folders (`create-*.dto.ts`, `update-*.dto.ts`).
- Match existing ESM-style relative imports using `.js` extensions in source files.

## Testing Guidelines
- Framework: Jest (`*.spec.ts` for unit tests, `*.e2e-spec.ts` for end-to-end).
- Place new unit tests close to implementation under `src/` when possible.
- Add e2e coverage for critical request flows (auth, orders, payments, inventory changes).
- Run `npm test` before opening a PR; run `npm run test:cov` for high-impact changes.

## Commit & Pull Request Guidelines
- Current history uses short, plain commit messages (for example, `phase 0 completed`, `new structure`).
- Keep commit messages brief and scoped; preferred style: `<area>: <action>`.
- Keep one logical change per commit.
- PRs should include: purpose, modules touched, migration/env changes, linked issue, and test evidence (commands + results).
- Include request/response samples (or Swagger screenshots) for API contract changes.

## Security & Configuration Tips
- Initialize from `.env.example`; required values include `DATABASE_URL` and `JWT_SECRET`.
- Never commit secrets; use a strong production `JWT_SECRET` (at least 32 chars, non-default).
- Keep local Postgres/Redis versions aligned with `docker-compose.yml` unless coordinated across the team.
