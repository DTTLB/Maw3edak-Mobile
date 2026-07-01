#!/usr/bin/env bash
# Deploy the patient mobile 2FA edge functions + the updated login gate.
# Requires: supabase CLI authenticated (run `supabase login` or set
# SUPABASE_ACCESS_TOKEN) and the TWO_FACTOR_ENCRYPTION_KEY secret already set on
# the project (it is — shared with the web staff portal).
#
# patient-two-factor-setup / patient-two-factor-confirm are already deployed.
# The functions below do their own auth (body sessionToken / pendingToken), so
# they deploy with --no-verify-jwt.
set -euo pipefail

REF=ttyukcvqifqyfolxtwba

for fn in \
  patient-two-factor-status \
  patient-two-factor-disable \
  mobile-patient-two-factor-login; do
  npx supabase functions deploy "$fn" --project-ref "$REF" --no-verify-jwt
done

# Redeploy the login function now that it carries the 2FA gate.
npx supabase functions deploy mobile-patient-login --project-ref "$REF" --no-verify-jwt
