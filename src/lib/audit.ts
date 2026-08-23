import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Records an admin_audit_logs row via the `log_admin_action` RPC (see
 * supabase/migrations/20260822000800_functions_triggers.sql). The function
 * itself re-checks `current_user_is_admin()` and sets `actor_id = auth.uid()`
 * server-side — the caller can never spoof who performed the action, unlike
 * a direct table insert where a caller-supplied actor_id would have to be
 * trusted.
 */
export async function logAdminAction(
  supabase: SupabaseClient<Database>,
  action: string,
  targetTable: string,
  targetId: string | null,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.rpc("log_admin_action", {
    p_action: action,
    p_target_table: targetTable,
    p_target_id: targetId,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(`Failed to write audit log: ${error.message}`);
  }
}
