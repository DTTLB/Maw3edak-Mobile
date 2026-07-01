// =============================================================================
// resolve-access.ts
// -----------------------------------------------------------------------------
// Shared helper for the doctor data endpoints so they can be driven by EITHER:
//   - a doctor's global_id  (e.g. "DR-V414JF6J")  -> existing behavior, OR
//   - a receptionist's user_id (a UUID)            -> NEW receptionist support.
//
// Both resolve to a set of `users.id` values whose `user_doctor_access` rows
// determine which doctor profiles (and therefore which patients/appointments)
// are visible. This keeps the receptionist change ADDITIVE: a real doctor's
// global_id always resolves in step 1, so the doctor path is unchanged; only an
// unmatched UUID falls through to the receptionist (user_id) path.
// =============================================================================

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string | null | undefined): boolean {
  return !!value && UUID_RE.test(value);
}

export interface ResolvedAccess {
  userIds: string[];
  // 'doctor'  -> resolved via users.global_id
  // 'user'    -> resolved via users.id (receptionist / single-company staff)
  // 'none'    -> nothing matched
  mode: "doctor" | "user" | "none";
}

/**
 * Resolve the `users.id` set for a data request from a single `idParam` that is
 * either a doctor global_id or a receptionist user_id.
 */
export async function resolveAccessUserIds(
  supabase: any,
  idParam: string,
  companyId?: string | null
): Promise<ResolvedAccess> {
  const scoped = (q: any) =>
    companyId && companyId !== "all" ? q.eq("company_id", companyId) : q;

  // 1) Try as a doctor global_id (unchanged existing behavior).
  const { data: byGlobal } = await scoped(
    supabase.from("users").select("id").eq("is_deleted", false).eq("global_id", idParam)
  );
  if (byGlobal && byGlobal.length > 0) {
    return { userIds: byGlobal.map((u: any) => u.id), mode: "doctor" };
  }

  // 2) Fall back to a receptionist (or single-company staff) user_id (UUID).
  if (isUuid(idParam)) {
    const { data: byId } = await scoped(
      supabase.from("users").select("id").eq("is_deleted", false).eq("id", idParam)
    );
    if (byId && byId.length > 0) {
      return { userIds: byId.map((u: any) => u.id), mode: "user" };
    }
  }

  return { userIds: [], mode: "none" };
}
