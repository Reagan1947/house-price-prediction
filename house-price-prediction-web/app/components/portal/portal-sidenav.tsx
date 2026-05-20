"use client";

import Link from "next/link";
import { Home, LayoutGrid } from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/portal",
    label: "Home Page",
    icon: Home,
    match: (pathname: string) => pathname === "/portal",
  },
  {
    href: "/portal/applications",
    label: "Applications",
    icon: LayoutGrid,
    match: (pathname: string) => pathname.startsWith("/portal/applications"),
  },
] as const;

export function PortalSidenav() {
  const pathname = usePathname();

  return (
    <nav className="portal-sidenav" aria-label="Portal navigation">
      <div className="portal-sidenav-inner">
        <ul className="portal-sidenav-list">
          {NAV_ITEMS.map((item) => {
            const isActive = item.match(pathname);
            const Icon = item.icon;

            return (
              <li key={item.href} className="portal-sidenav-list-item">
                <Link
                  href={item.href}
                  className={cn("portal-sidenav-link", isActive && "portal-sidenav-link-active")}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon aria-hidden size={16} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
