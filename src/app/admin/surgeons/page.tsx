import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { PRIMARY_SPECIALTY_LABELS } from "@/lib/format";
import { listSurgeonsForAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Cola de cirujanos" };

const STATUS_OPTIONS = ["submitted", "approved", "rejected", "suspended", "draft"] as const;
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  submitted: "default",
  approved: "secondary",
  rejected: "destructive",
  suspended: "destructive",
  draft: "outline",
};
const STATUS_LABELS: Record<string, string> = {
  submitted: "enviado",
  approved: "aprobado",
  rejected: "rechazado",
  suspended: "suspendido",
  draft: "borrador",
};

export default async function AdminSurgeonsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; country?: string; specialty?: string; q?: string }>;
}) {
  const params = await searchParams;
  const surgeons = await listSurgeonsForAdmin({
    status: params.status as never,
    country: params.country,
    specialty: params.specialty as never,
    q: params.q,
  });

  return (
    <div className="space-y-6">
      <form className="flex flex-wrap items-center gap-2" method="GET">
        <select
          name="status"
          defaultValue={params.status ?? ""}
          className="h-9 rounded-md border border-input bg-card px-2 text-sm"
        >
          <option value="">Todos los estados</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <input
          name="country"
          placeholder="País"
          defaultValue={params.country ?? ""}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        />
        <input
          name="q"
          placeholder="Buscar por nombre…"
          defaultValue={params.q ?? ""}
          className="h-9 rounded-md border border-input bg-card px-3 text-sm"
        />
        <button
          type="submit"
          className="h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          Filtrar
        </button>
        {(params.status || params.country || params.q) && (
          <Link href="/admin/surgeons" className="text-sm text-muted-foreground hover:underline">
            Limpiar
          </Link>
        )}
      </form>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Especialidad</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">Enviado</th>
            </tr>
          </thead>
          <tbody>
            {surgeons.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/surgeons/${s.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.full_name}
                  </Link>
                  {s.is_demo && (
                    <span className="ml-2 text-xs text-muted-foreground">(demo)</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {PRIMARY_SPECIALTY_LABELS[s.primary_specialty]}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[s.status]}>{STATUS_LABELS[s.status]}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString("es-419") : "—"}
                </td>
              </tr>
            ))}
            {surgeons.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Ningún perfil de cirujano coincide con estos filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
