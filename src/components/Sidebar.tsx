"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/meta", label: "Meta", icon: "🔍" },
  { href: "/decks", label: "Decks", icon: "🃏" },
  { href: "/testing", label: "Testeo", icon: "⚔️" },
  { href: "/analysis", label: "Análisis", icon: "📈" },
  { href: "/iterations", label: "Iteraciones", icon: "🔁" },
  { href: "/decision", label: "Decisión", icon: "🧬" },
  { href: "/preparation", label: "Preparación", icon: "🧠" },
];

const adminItems = [
  { href: "/admin", label: "Admin", icon: "⚙️" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const items = session?.user?.role === "ADMIN"
    ? [...navItems, ...adminItems]
    : navItems;

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-gray-900 text-white">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-700">
        <h1 className="text-xl font-bold">🏆 MelipillaTester</h1>
        <p className="text-xs text-gray-400 mt-1">Mitos y Leyendas</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User info */}
      <div className="px-4 py-4 border-t border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-bold">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{session?.user?.name}</p>
            <p className="text-xs text-gray-400 truncate">
              {session?.user?.role === "ADMIN" ? "Administrador" : "Miembro"}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-3 w-full text-left text-xs text-gray-400 hover:text-red-400 transition-colors"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
