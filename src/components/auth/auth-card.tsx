import { Activity } from "lucide-react";
import type { ReactNode } from "react";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="relative isolate flex min-h-[calc(100vh-4rem)] flex-col justify-center overflow-hidden px-4 py-12 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-80 bg-[radial-gradient(60%_60%_at_50%_0%,color-mix(in_oklch,var(--color-primary)_14%,transparent),transparent)]"
      />

      <div className="surface-floating mx-auto w-full max-w-md p-6 sm:p-8">
        <div className="flex flex-col items-center text-center">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Activity className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 text-balance text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="mt-6">{children}</div>
      </div>

      {footer && (
        <div className="mx-auto mt-6 text-center text-sm text-muted-foreground">{footer}</div>
      )}
    </div>
  );
}
