import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

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
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">Cola de cirujanos</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {surgeons.length} {surgeons.length === 1 ? "perfil" : "perfiles"} · revisá, aprobá o
          editá cualquier perfil enviado al directorio.
        </p>
      </div>

      <form
        className="surface-flat flex flex-wrap items-end gap-3 p-3"
        method="GET"
        aria-label="Filtrar cirujanos"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={params.status ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">Todos los estados</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            País
          </label>
          <input
            id="country"
            name="country"
            placeholder="Ej: Argentina"
            defaultValue={params.country ?? ""}
            className="h-9 w-36 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            Buscar
          </label>
          <input
            id="q"
            name="q"
            placeholder="Buscar por nombre…"
            defaultValue={params.q ?? ""}
            className="h-9 w-48 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <button
          type="submit"
          className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          Filtrar
        </button>
        {(params.status || params.country || params.q) && (
          <Link
            href="/admin/surgeons"
            className="h-9 content-center text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            Limpiar filtros
          </Link>
        )}
      </form>

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
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
