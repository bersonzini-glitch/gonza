import { Skeleton } from "@/components/ui/skeleton";

export default function SurgeonsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="mt-3 h-5 w-64" />

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <Skeleton className="h-96 rounded-xl" />
        <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i}>
              <Skeleton className="h-44 rounded-xl" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
