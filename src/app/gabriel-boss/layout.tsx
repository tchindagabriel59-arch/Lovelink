"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Crown,
  ShieldCheck,
  Flag,
  BarChart3,
  Menu,
  X,
  Home,
  LogOut,
  Sparkles,
} from "lucide-react";

interface Counts {
  users: number;
  premium: number;
  verifications: number;
  reports: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [counts, setCounts] = useState<Counts>({
    users: 0,
    premium: 0,
    verifications: 0,
    reports: 0,
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/counts");
      if (res.ok) {
        const data = await res.json();
        setCounts(data);
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    // Refresh compteurs toutes les 60s
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // Fermer menu mobile au changement de page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    {
      href: "/gabriel-boss",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/gabriel-boss/utilisateurs",
      label: "Utilisateurs",
      icon: <Users className="w-5 h-5" />,
      badge: counts.users,
      badgeColor: "bg-blue-500",
      showBadge: false, // Affiche pas le badge (juste le count)
    },
    {
      href: "/gabriel-boss/abonnes",
      label: "Premium",
      icon: <Crown className="w-5 h-5" />,
      badge: counts.premium,
      badgeColor: "bg-amber-500",
      showBadge: false,
    },
    {
      href: "/gabriel-boss/verifications",
      label: "Vérifications",
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: counts.verifications,
      badgeColor: "bg-blue-500",
      showBadge: true,
      alert: counts.verifications > 0,
    },
    {
      href: "/gabriel-boss/signalements",
      label: "Signalements",
      icon: <Flag className="w-5 h-5" />,
      badge: counts.reports,
      badgeColor: "bg-red-500",
      showBadge: true,
      alert: counts.reports > 0,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      {/* ================================ */}
      {/* SIDEBAR DESKTOP */}
      {/* ================================ */}
      <aside className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col fixed inset-y-0 left-0 z-30">
        {/* Header sidebar */}
        <div className="p-6 border-b border-slate-800">
          <Link href="/gabriel-boss" className="flex items-center gap-3">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Gabriel BOSS</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                Admin Panel
              </p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/gabriel-boss" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>

                {/* Badge */}
                {item.badge > 0 && (
                  <span
                    className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center ${
                      isActive
                        ? "bg-white text-purple-600"
                        : item.showBadge && item.alert
                        ? `${item.badgeColor} text-white animate-pulse`
                        : "bg-slate-700 text-slate-300"
                    }`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Séparateur */}
          <div className="my-4 border-t border-slate-800" />

          {/* Section future : Analytics + Monitoring */}
          <div className="px-4 py-2">
            <p className="text-[10px] text-slate-600 uppercase tracking-widest font-black">
              À venir
            </p>
          </div>

          <div className="px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-2 text-slate-500">
              <BarChart3 className="w-4 h-4" />
              <span className="text-xs">Analytics 📊</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1">Bientôt disponible</p>
          </div>
        </nav>

        {/* Footer sidebar */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
          >
            <Home className="w-4 h-4" />
            Retour au site
          </Link>

          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-400 font-medium">EN DIRECT</span>
          </div>
        </div>
      </aside>

      {/* ================================ */}
      {/* MOBILE HEADER */}
      {/* ================================ */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/gabriel-boss" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Crown className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm">Gabriel BOSS</p>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest">
                Admin Panel
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 border border-green-500/30 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-green-400 font-bold">LIVE</span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-800 rounded-lg transition"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Menu mobile déroulant */}
        {mobileMenuOpen && (
          <nav className="border-t border-slate-800 p-3 space-y-1 max-h-[calc(100vh-60px)] overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/gabriel-boss" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>

                  {item.badge > 0 && (
                    <span
                      className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center ${
                        isActive
                          ? "bg-white text-purple-600"
                          : item.showBadge && item.alert
                          ? `${item.badgeColor} text-white animate-pulse`
                          : "bg-slate-700 text-slate-300"
                      }`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              );
            })}

            <div className="my-3 border-t border-slate-800" />

            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <Home className="w-4 h-4" />
              Retour au site
            </Link>
          </nav>
        )}
      </div>

      {/* ================================ */}
      {/* MAIN CONTENT */}
      {/* ================================ */}
      <main className="flex-1 lg:ml-64 pt-16 lg:pt-0 min-h-screen">
        {children}
      </main>
    </div>
  );
}
