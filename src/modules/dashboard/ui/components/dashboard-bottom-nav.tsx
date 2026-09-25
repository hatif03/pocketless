"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { dashboardNavItems, isNavItemActive } from "@/modules/dashboard/nav-items";

export const DashboardBottomNav = () => {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 flex items-stretch border-t bg-background pb-[env(safe-area-inset-bottom)]">
      {dashboardNavItems.map((item) => {
        const active = isNavItemActive(item.href, pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-xs text-muted-foreground",
              active && "text-foreground font-medium",
            )}
          >
            <item.icon className="size-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};
