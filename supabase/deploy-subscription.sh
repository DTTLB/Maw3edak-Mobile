#!/usr/bin/env bash
# Deploy the patient subscription edge function + redeploy the login gate.
# Requires: supabase CLI authenticated (run `supabase login` or set
# SUPABASE_ACCESS_TOKEN).
#
# Both functions do their own auth (session token / credentials), so they
# deploy with --no-verify-jwt.
set -euo pipefail

REF=ttyukcvqifqyfolxtwba

# New: settings reads the subscription server-side (RLS blocks the anon client).
npx supabase functions deploy mobile-get-patient-subscription --project-ref "$REF" --no-verify-jwt

# Redeploy the login function now that it carries the subscription gate.
npx supabase functions deploy mobile-patient-login --project-ref "$REF" --no-verify-jwt
