# Dashcloud application architecture

## Runtime

- **Next.js App Router** owns routing, server rendering, route handlers, metadata, and middleware.
- **React UI** lives in `src/components`. Shared layout and primitives live under `layout/` and `ui/`; feature-specific UI stays with the feature.
- **Feature modules** live in `src/features/<feature>/`. Each module owns request contracts, application services, and persistence boundaries.
- **Supabase** provides authentication and Postgres. Public/browser clients use the publishable/anon key; the service-role client is server-only and must never enter a client bundle.

## Feature boundaries

| Feature | Contracts | Application service | Persistence |
| --- | --- | --- | --- |
| Games | `src/features/games/contracts.ts` | `src/features/games/service.ts` | `src/features/games/repository.ts` |
| Scores | `src/features/scores/contracts.ts` | `src/features/scores/service.ts` | Supabase access inside the server-only service |
| Sessions | `src/features/sessions/contracts.ts` | `src/features/sessions/service.ts` | Supabase access inside the server-only service |
| Support | `src/features/support/contracts.ts` | `src/features/support/service.ts` | Supabase access inside the server-only service |

Route handlers should parse input, apply rate limits, call a feature service, and map expected errors to HTTP responses. They should not leak raw database errors to clients.

## Request flow

1. A route validates query/body input with a Zod contract.
2. The route applies endpoint-specific rate limits.
3. A feature service applies business rules and obtains the authenticated user where needed.
4. The service reads or writes through its persistence boundary.
5. The route returns a stable response shape and non-sensitive error message.

## Security boundaries

- Never expose `SUPABASE_SERVICE_ROLE_KEY` or `ADMIN_SESSION_SECRET` to browser code.
- Auth redirects must resolve to safe, same-origin paths.
- Session mutation requests must prove ownership: authenticated sessions must match the current user; guest sessions must match their guest identifier.
- Public inputs are validated before database writes. Rate limits are applied at route boundaries.
- RLS is defense in depth. Review Supabase security advisors before changing policies or applying migrations.

## Design system

- Global tokens and shared component classes live in `src/app/globals.css`.
- Reusable page headers live in `src/components/ui/PageHeader.tsx`.
- Public pages use the shared page shell; admin navigation state is reflected in the URL so panels can be linked directly.
- Motion is reduced for users who enable reduced-motion preferences.

## Verification

Run:

```sh
npm ci
npm run check
npm run build
```

Production deployment must be verified separately in Vercel. A successful GitHub push is not proof that the deployed site is serving that commit.
