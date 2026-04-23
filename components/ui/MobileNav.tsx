"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Users, Wallet, UserCircle } from "lucide-react";

const items = [
  { href: "/", label: "Home", icon: House },
  { href: "/group", label: "Groups", icon: Users },
  { href: "/solo", label: "Solo", icon: Wallet },
  { href: "/", label: "Profile", icon: UserCircle },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[var(--bg-card)]/95 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link key={item.label} href={item.href} className={`flex min-h-12 flex-col items-center justify-center rounded-lg text-xs ${active ? "bg-white/10 text-white" : "text-[var(--text-secondary)]"}`}>
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
