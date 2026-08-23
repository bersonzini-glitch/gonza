import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <CompassIcon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 text-muted-foreground">
        The page you&rsquo;re looking for doesn&rsquo;t exist or may have been moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Go home</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/events">Browse congresses</Link>
        </Button>
      </div>
    </div>
  );
}
