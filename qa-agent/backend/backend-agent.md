# Backend QA Agent — Maw3edak Mobile

## Purpose
Static analysis of the backend layer: Supabase Edge Functions (Deno/TypeScript) and the Express.js FCM notification server.

## Scope

### Directories Scanned
- `supabase/functions/` — All Supabase Edge Functions
- `api/` — Express.js FCM notification server

### What Is Detected

**Critical Security**
- Hardcoded secrets, JWTs, or live API keys in source files

**Authentication & Authorization**
- Edge Functions that never verify the caller's JWT (`auth.getUser()`)
- Express routes with write operations (POST/PUT/DELETE) lacking auth middleware
- Missing Authorization header checks

**CORS & Protocol**
- Edge Functions missing CORS headers (OPTIONS preflight will fail)
- Missing HTTP method validation (GET vs POST vs DELETE)
- Missing explicit HTTP status codes in responses

**Input Validation**
- Request bodies parsed with `req.json()` but never validated
- Missing required field checks before processing

**Error Handling**
- Empty catch blocks in Edge Functions (silent failures)
- Error stack traces exposed to API consumers
- Missing 400/401/403/500 response codes

**API Security**
- Express server missing rate limiting (`express-rate-limit`)
- Missing input sanitization before database queries

**Code Quality**
- TypeScript `any` types in function signatures
- `console.log` / `console.debug` in production backend code

## Output
Generates `qa-agent/backend/reports/backend-report.md`

## Run
```bash
npm run qa:backend
```
