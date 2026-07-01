#!/usr/bin/env bash
# Deploy the doctor mobile 2FA edge functions + the updated login gate.
# Requires: supabase CLI authenticated (run `supabase login` or set
# SUPABASE_ACCESS_TOKEN) and the TWO_FACTOR_ENCRYPTION_KEY secret already set on
# the project (it is — shared with the web staff portal).
#
# All five 2FA functions do their own auth via the X-Session-Token header, so
# they deploy with --no-verify-jwt.
set -euo pipefail

REF=ttyukcvqifqyfolxtwba

for fn in \
  mobile-doctor-2fa-status \
  mobile-doctor-2fa-setup \
  mobile-doctor-2fa-confirm \
  mobile-doctor-2fa-disable \
  mobile-doctor-2fa-login; do
  npx supabase functions deploy "$fn" --project-ref "$REF" --no-verify-jwt
done

# Redeploy the login function now that it carries the 2FA gate.
npx supabase functions deploy doctor-mobile-login --project-ref "$REF" --no-verify-jwt
