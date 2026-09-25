import { HandshakeIcon, RadioIcon, Settings2Icon, UsersIcon } from "lucide-react";

export const dashboardNavItems = [
  { icon: UsersIcon, label: "People", href: "/" },
  { icon: HandshakeIcon, label: "Promises", href: "/promises" },
  { icon: RadioIcon, label: "Sessions", href: "/sessions" },
  { icon: Settings2Icon, label: "Settings", href: "/settings" },
];

export function isNavItemActive(href: string, pathname: string) {
  return href === "/"
    ? pathname === "/" || pathname.startsWith("/people")
    : pathname.startsWith(href);
}
