import type { Metadata } from "next";

import { listAuditLogs } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Historial de auditoría" };
export const dynamic = "force-dynamic";

export default async function AdminAuditLogPage() {
  const logs = await listAuditLogs();

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Registro de solo escritura de acciones administrativas sensibles. Nada acá puede editarse
        ni eliminarse, ni siquiera por administradores.
      </p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Cuándo</th>
              <th className="px-4 py-3">Administrador</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Objetivo</th>
              <th className="px-4 py-3">Detalles</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {new Date(log.created_at).toLocaleString("es-419")}
                </td>
                <td className="px-4 py-3">
                  {(log as unknown as { profiles: { username: string } | null }).profiles
                    ?.username ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {log.target_table}
                  {log.target_id ? ` #${log.target_id.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Object.keys(log.metadata ?? {}).length > 0 ? JSON.stringify(log.metadata) : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay acciones administrativas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
