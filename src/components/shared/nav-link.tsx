"use client";

import { Link } from "@/i18n/navigation";
import { usePathname } from "@/i18n/navigation";
import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Highlights the current section in a nav so users can tell where they are.
 * Forwards ref and extra anchor props so it also works as the `asChild`
 * target inside SheetClose/DropdownMenuItem, which clone in their own
 * onClick/ref to close the menu on navigation.
 */
export const NavLink = forwardRef<
  HTMLAnchorElement,
  Omit<ComponentPropsWithoutRef<typeof Link>, "className" | "children"> & {
    exact?: boolean;
    className?: string;
    activeClassName?: string;
    children: ReactNode | ((active: boolean) => ReactNode);
  }
>(function NavLink({ href, exact = false, className, activeClassName, children, ...props }, ref) {
  const pathname = usePathname();
  const hrefPath = typeof href === "string" ? href : href.pathname ?? "";
  const active = exact
    ? pathname === hrefPath
    : pathname === hrefPath || pathname.startsWith(`${hrefPath}/`);

  return (
    <Link
      ref={ref}
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
      {...props}
    >
      {typeof children === "function" ? children(active) : children}
    </Link>
  );
});
