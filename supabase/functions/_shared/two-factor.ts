// Shared helpers for TOTP two-factor auth (RFC 6238).
//
// Ported verbatim from the web repo's supabase/functions/_shared/two-factor.ts
// so the doctor mobile app speaks the exact same protocol against the SAME
// `user_two_factor` table / TWO_FACTOR_ENCRYPTION_KEY as the web staff portal.
//
// Imported by: mobile-doctor-2fa-status, mobile-doctor-2fa-setup,
// mobile-doctor-2fa-confirm, mobile-doctor-2fa-disable, mobile-doctor-2fa-login
// and the doctor-mobile-login gate.
//
// Secret encryption: AES-256-GCM with a 32-byte key from the
// TWO_FACTOR_ENCRYPTION_KEY env secret (base64). The WebCrypto AES-GCM output
// already appends the 16-byte auth tag to the ciphertext, so we persist
// `ivB64:ciphertextB64`.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey, X-Session-Token",
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---------- base64 <-> bytes -------------------------------------------------
function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ---------- AES-256-GCM secret encryption ------------------------------------
async function getAesKey(): Promise<CryptoKey> {
  const keyB64 = Deno.env.get("TWO_FACTOR_ENCRYPTION_KEY");
  if (!keyB64) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY is not set");
  }
  const raw = b64ToBytes(keyB64.trim());
  if (raw.length !== 32) {
    throw new Error("TWO_FACTOR_ENCRYPTION_KEY must decode to 32 bytes (AES-256)");
  }
  return await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptSecret(plain: string): Promise<string> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(plain),
  );
  return `${bytesToB64(iv)}:${bytesToB64(new Uint8Array(ct))}`;
}

export async function decryptSecret(stored: string): Promise<string> {
  const [ivB64, ctB64] = stored.split(":");
  const key = await getAesKey();
  const pt = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64ToBytes(ivB64) },
    key,
    b64ToBytes(ctB64),
  );
  return new TextDecoder().decode(pt);
}

// ---------- TOTP (RFC 6238, WebCrypto — no external deps) ---------------------
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, out = "";
  for (const b of bytes) {
    value = (value << 8) | b;
    bits += 8;
    while (bits >= 5) {
      out += B32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}

function base32Decode(s: string): Uint8Array {
  const clean = s.replace(/=+$/, "").toUpperCase().replace(/\s/g, "");
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const c of clean) {
    const idx = B32.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(keyBytes: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x100000000));
  view.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0x0f;
  const bin = ((sig[offset] & 0x7f) << 24) |
    ((sig[offset + 1] & 0xff) << 16) |
    ((sig[offset + 2] & 0xff) << 8) |
    (sig[offset + 3] & 0xff);
  return String(bin % 1_000_000).padStart(6, "0");
}

export function generateSecret(): string {
  return base32Encode(crypto.getRandomValues(new Uint8Array(20))); // 160-bit
}

export function buildOtpauthUri(email: string, secret: string): string {
  const label = encodeURIComponent(`Maw3edak:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer: "Maw3edak",
    algorithm: "SHA1",
    digits: "6",
    period: "30",
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

// Verify a 6-digit code with ±1 step (30s) drift. Returns the absolute
// time-step it matched (for replay protection) or null if invalid.
export async function verifyTotp(
  token: string,
  secret: string,
): Promise<number | null> {
  const code = (token || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return null;
  const key = base32Decode(secret);
  const step = Math.floor(Date.now() / 1000 / 30);
  for (const d of [0, -1, 1]) {
    if (await hotp(key, step + d) === code) return step + d;
  }
  return null;
}

// ---------- Recovery codes (PBKDF2-hashed like passwords) --------------------
export interface RecoveryEntry {
  hash: string; // "saltHex:hashHex"
  used_at: string | null;
}

function randomCodeChunk(len: number): string {
  // Crockford-ish base32, no ambiguous chars.
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export function generateRecoveryCodes(count = 10): string[] {
  return Array.from(
    { length: count },
    () => `${randomCodeChunk(5)}-${randomCodeChunk(5)}`,
  );
}

async function pbkdf2Hex(value: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(value),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    key,
    256,
  );
  return Array.from(new Uint8Array(bits))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashRecoveryCode(code: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const saltHex = Array.from(salt)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const hashHex = await pbkdf2Hex(normalizeRecovery(code), salt);
  return `${saltHex}:${hashHex}`;
}

export async function verifyRecoveryCode(
  code: string,
  storedHash: string,
): Promise<boolean> {
  const [saltHex, hashHex] = storedHash.split(":");
  const salt = new Uint8Array(
    saltHex.match(/.{2}/g)?.map((b) => parseInt(b, 16)) ?? [],
  );
  const computed = await pbkdf2Hex(normalizeRecovery(code), salt);
  return computed === hashHex;
}

function normalizeRecovery(code: string): string {
  return (code || "").toUpperCase().replace(/\s/g, "");
}

// ---------- Rate limiting (sliding window over auth_attempts) ----------------
// Returns true if allowed (and records the attempt); false if over the limit.
// deno-lint-ignore no-explicit-any
export async function checkRateLimit(
  supabase: any,
  scope: string,
  identifier: string,
  max = 5,
  windowSec = 60,
): Promise<boolean> {
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { count } = await supabase
    .from("auth_attempts")
    .select("*", { count: "exact", head: true })
    .eq("scope", scope)
    .eq("identifier", identifier)
    .gte("created_at", since);

  if ((count ?? 0) >= max) return false;

  await supabase.from("auth_attempts").insert({ scope, identifier });
  return true;
}

// ---------- Custom session-token resolution ----------------------------------
// Resolves a portal user from the custom sessionToken (user_sessions table).
// Returns the user id or null if the token is missing/expired.
// deno-lint-ignore no-explicit-any
export async function resolveUserFromSession(
  supabase: any,
  sessionToken: string | null | undefined,
): Promise<string | null> {
  if (!sessionToken) return null;
  const { data } = await supabase
    .from("user_sessions")
    .select("user_id, expires_at")
    .eq("token", sessionToken)
    .maybeSingle();
  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) return null;
  return data.user_id;
}

// ---------- Mobile: primary-account anchoring --------------------------------
// Doctor identity is global: one users row per clinic, all sharing global_id.
// 2FA (like dark-mode / language) is anchored to the doctor's PRIMARY account
// (is_primary_company = true for that global_id) so it stays consistent no
// matter which clinic they signed into.
export interface PrimaryDoctor {
  id: string;
  email: string;
  // null for receptionists / single-company staff (they own no global_id).
  global_id: string | null;
  two_factor_required: boolean;
}

// Resolves global_id -> the is_primary_company=true row for that doctor. Falls
// back to any row sharing the global_id if no primary is flagged (defensive).
// deno-lint-ignore no-explicit-any
export async function resolvePrimaryDoctorByGlobalId(
  supabase: any,
  globalId: string | null | undefined,
): Promise<PrimaryDoctor | null> {
  if (!globalId) return null;

  const { data: primary } = await supabase
    .from("users")
    .select("id, email, global_id, two_factor_required")
    .eq("is_deleted", false)
    .eq("global_id", globalId)
    .eq("is_primary_company", true)
    .maybeSingle();

  if (primary) return primary as PrimaryDoctor;

  // Defensive fallback: no row flagged primary — use the first row.
  const { data: any } = await supabase
    .from("users")
    .select("id, email, global_id, two_factor_required")
    .eq("is_deleted", false)
    .eq("global_id", globalId)
    .limit(1)
    .maybeSingle();

  return (any as PrimaryDoctor) ?? null;
}

// Resolves a mobile session token -> the doctor's PRIMARY account.
// session.user_id -> users.global_id -> is_primary_company=true row.
// deno-lint-ignore no-explicit-any
export async function resolvePrimaryDoctorFromSession(
  supabase: any,
  sessionToken: string | null | undefined,
): Promise<PrimaryDoctor | null> {
  const userId = await resolveUserFromSession(supabase, sessionToken);
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("global_id")
    .eq("is_deleted", false)
    .eq("id", userId)
    .maybeSingle();

  if (!user?.global_id) return null;
  return resolvePrimaryDoctorByGlobalId(supabase, user.global_id);
}

// ---------- Mobile: GLOBAL 2FA resolution (across all clinic rows) ------------
// A doctor has one `users` row per clinic, all sharing global_id. 2FA may be
// enrolled on ANY of those rows — notably the WEB portal enrolls on whichever
// clinic row the staff member was logged into, which is often NOT the
// is_primary_company row. So we must treat 2FA as global: find the row that
// actually holds the user_two_factor record and operate on THAT row, instead of
// blindly anchoring to the primary account (which may have no 2FA record).
export interface DoctorTwoFactor {
  user: PrimaryDoctor; // the row that holds (or will hold) the 2FA record
  twoFactor: {
    enabled: boolean;
    secret_encrypted: string | null;
    // deno-lint-ignore no-explicit-any
    recovery_codes: any[] | null;
    last_used_step: number | null;
  } | null;
  required: boolean; // admin-forced, true if set on ANY of the doctor's rows
}

// Resolves global_id -> the canonical 2FA row for that doctor.
// Priority for the anchor row: enabled record > pending record (has secret) >
// any record > primary account > first row. `required` is OR'd across all rows.
// deno-lint-ignore no-explicit-any
export async function resolveDoctorTwoFactorByGlobalId(
  supabase: any,
  globalId: string | null | undefined,
): Promise<DoctorTwoFactor | null> {
  if (!globalId) return null;

  const { data: rows } = await supabase
    .from("users")
    .select("id, email, global_id, two_factor_required, is_primary_company")
    .eq("is_deleted", false)
    .eq("global_id", globalId);

  if (!rows || rows.length === 0) return null;

  const ids = rows.map((r: any) => r.id);
  const { data: tfRows } = await supabase
    .from("user_two_factor")
    .select("user_id, enabled, secret_encrypted, recovery_codes, last_used_step")
    .in("user_id", ids);

  const tfs = tfRows || [];
  const required = rows.some((r: any) => r.two_factor_required);

  // Choose the anchor record: prefer an enabled one, then a pending one
  // (secret present), then any record at all.
  const anchorTf = tfs.find((t: any) => t.enabled) ||
    tfs.find((t: any) => t.secret_encrypted) ||
    tfs[0] ||
    null;

  const anchorUser = anchorTf
    ? rows.find((r: any) => r.id === anchorTf.user_id)
    : (rows.find((r: any) => r.is_primary_company) || rows[0]);

  return {
    user: {
      id: anchorUser.id,
      email: anchorUser.email,
      global_id: anchorUser.global_id,
      two_factor_required: anchorUser.two_factor_required,
    },
    twoFactor: anchorTf
      ? {
        enabled: !!anchorTf.enabled,
        secret_encrypted: anchorTf.secret_encrypted ?? null,
        recovery_codes: anchorTf.recovery_codes ?? null,
        last_used_step: anchorTf.last_used_step ?? null,
      }
      : null,
    required,
  };
}

// session.user_id -> global_id -> canonical 2FA row (see above).
// deno-lint-ignore no-explicit-any
export async function resolveDoctorTwoFactorFromSession(
  supabase: any,
  sessionToken: string | null | undefined,
): Promise<DoctorTwoFactor | null> {
  const userId = await resolveUserFromSession(supabase, sessionToken);
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("global_id")
    .eq("is_deleted", false)
    .eq("id", userId)
    .maybeSingle();

  if (!user?.global_id) return null;
  return resolveDoctorTwoFactorByGlobalId(supabase, user.global_id);
}

// ---------- Mobile: SINGLE-ROW 2FA (receptionist / single-company staff) ------
// A receptionist has exactly ONE users row and NO global_id, so their 2FA is
// keyed directly to their own users.id — no cross-clinic anchoring needed.
// deno-lint-ignore no-explicit-any
export async function resolveTwoFactorByUserId(
  supabase: any,
  userId: string | null | undefined,
): Promise<DoctorTwoFactor | null> {
  if (!userId) return null;

  const { data: u } = await supabase
    .from("users")
    .select("id, email, global_id, two_factor_required")
    .eq("is_deleted", false)
    .eq("id", userId)
    .maybeSingle();
  if (!u) return null;

  const { data: tf } = await supabase
    .from("user_two_factor")
    .select("user_id, enabled, secret_encrypted, recovery_codes, last_used_step")
    .eq("user_id", userId)
    .maybeSingle();

  return {
    user: {
      id: u.id,
      email: u.email,
      global_id: u.global_id ?? null,
      two_factor_required: u.two_factor_required,
    },
    twoFactor: tf
      ? {
        enabled: !!tf.enabled,
        secret_encrypted: tf.secret_encrypted ?? null,
        recovery_codes: tf.recovery_codes ?? null,
        last_used_step: tf.last_used_step ?? null,
      }
      : null,
    required: !!u.two_factor_required,
  };
}

// Role-agnostic session -> 2FA context. Doctors (with a global_id) anchor across
// all their clinic rows; receptionists / single-company staff anchor to their
// own row. Use this from endpoints that serve BOTH roles (the 2FA settings fns).
// deno-lint-ignore no-explicit-any
export async function resolveTwoFactorFromSession(
  supabase: any,
  sessionToken: string | null | undefined,
): Promise<DoctorTwoFactor | null> {
  const userId = await resolveUserFromSession(supabase, sessionToken);
  if (!userId) return null;

  const { data: user } = await supabase
    .from("users")
    .select("global_id")
    .eq("is_deleted", false)
    .eq("id", userId)
    .maybeSingle();
  if (!user) return null;

  if (user.global_id) {
    return resolveDoctorTwoFactorByGlobalId(supabase, user.global_id);
  }
  return resolveTwoFactorByUserId(supabase, userId);
}

// ---------- Mobile: patient identity -----------------------------------------
// Patients are simpler than doctors: no global_id / primary-company logic. 2FA
// is keyed directly to patient_id = user_patients.id. The mobile patient session
// token lives in user_patient_sessions (written by mobile-patient-login).
export interface PatientIdentity {
  id: string;
  email: string | null;
  two_factor_required: boolean;
}

// Resolves a mobile patient session token (user_patient_sessions.token) -> the
// patient row. Returns null if the token is missing/expired or the patient is
// gone. `email` feeds the otpauth label; `two_factor_required` is the admin flag.
// deno-lint-ignore no-explicit-any
export async function resolvePatientFromSession(
  supabase: any,
  sessionToken: string | null | undefined,
): Promise<PatientIdentity | null> {
  if (!sessionToken) return null;

  const { data: sess } = await supabase
    .from("user_patient_sessions")
    .select("patient_id, expires_at")
    .eq("token", sessionToken)
    .maybeSingle();
  if (!sess) return null;
  if (new Date(sess.expires_at).getTime() < Date.now()) return null;

  const { data: patient } = await supabase
    .from("user_patients")
    .select("id, email, two_factor_required")
    .eq("is_deleted", false)
    .eq("id", sess.patient_id)
    .maybeSingle();

  return (patient as PatientIdentity) ?? null;
}
