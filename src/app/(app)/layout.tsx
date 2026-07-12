"use client";

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Notifications from "../components/Notifications";
import {
  Heart,
  User,
  MessageCircle,
  Compass,
  LogOut,
  Menu,
  X,
  Sparkles,
  Settings,
  Star,
  Gem,
  Zap,
  ShieldCheck,
  BadgeCheck,
  EyeOff,
} from "lucide-react";

interface UserData {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
  interests?: string;
  occupation?: string;
  lookingFor?: string;
  gender?: string;
  birthDate?: string;
  isPremium?: boolean;
  isVerified?: boolean;
  isIncognito?: boolean;
  isAdmin?: boolean;
}

const UserContext = createContext<{
  user: UserData | null;
  refreshUser: () => void;
}>({ user: null, refreshUser: () => {} });

export function useUser() {
  return useContext(UserContext);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (!data.user) {
        router.push("/login");
        return;
      }
      setUser(data.user);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

const navItems = [
    { href: "/dashboard", label: "Accueil", icon: <Sparkles className="w-5 h-5" /> },
    { href: "/discover", label: "Découvrir", icon: <Compass className="w-5 h-5" /> },
    { href: "/likes-recus", label: "Qui m'a liké", icon: <Star className="w-5 h-5" /> },
    { href: "/matches", label: "Matchs", icon: <Heart className="w-5 h-5" /> },
    { href: "/messages", label: "Messages", icon: <MessageCircle className="w-5 h-5" /> },
    { href: "/profile", label: "Profil", icon: <User className="w-5 h-5" /> },
    { href: "/preferences", label: "Préférences", icon: <Settings className="w-5 h-5" /> },
    { href: "/boost", label: "Boost", icon: <Zap className="w-5 h-5" /> },
    { href: "/verification", label: "Vérification", icon: <ShieldCheck className="w-5 h-5" /> },
  ];

  // Sur mobile : afficher moins d'items dans la barre du bas (max 5)
  const mobileNavItems = navItems.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-pulse-heart mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, refreshUser: fetchUser }}>
      <div className="min-h-screen bg-slate-50 flex">

        {/* ========== SIDEBAR DESKTOP ========== */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col fixed inset-y-0 left-0 z-30">
          
          {/* Logo */}
          <div className="p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              <span className="text-2xl font-bold gradient-text">LoveLink</span>
            </Link>
            <Notifications />
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25"
                    : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}

            {/* Séparateur */}
            <div className="my-3 border-t border-slate-100" />

            {/* Bouton Premium spécial */}
            <Link
              href="/premium"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                pathname === "/premium"
                  ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg shadow-orange-500/25"
                  : "bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 border border-orange-200 hover:from-yellow-100 hover:to-orange-100"
              }`}
            >
              <Gem className="w-5 h-5" />
              <span>Passer Premium</span>
              {!user?.isPremium && (
                <span className="ml-auto text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  NEW
                </span>
              )}
            </Link>
          </nav>

          {/* User Footer */}
          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="Profil" className="w-full h-full object-cover" />
                ) : (
                  <>
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </>
                )}
              </div>
                              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <p className="text-sm font-semibold truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  {user?.isVerified && (
                    <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                  )}
                  {user?.isPremium && (
                    <span className="text-yellow-500 text-xs">👑</span>
                  )}
                  {user?.isIncognito && (
                    <EyeOff className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                {user?.isIncognito && (
                  <p className="text-[10px] text-purple-600 font-black mt-0.5 flex items-center gap-1">
                    <EyeOff className="w-2.5 h-2.5" />
                    MODE INCOGNITO
                  </p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-slate-400 hover:text-rose-500 transition flex-shrink-0"
                title="Se déconnecter"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </aside>

        {/* ========== MOBILE HEADER ========== */}
               <div className="lg:hidden fixed top-0 left-0 right-0 z-30 glass-card border-b border-slate-100">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
              <span className="text-lg font-bold gradient-text">LoveLink</span>
              {user?.isIncognito && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[10px] font-black">
                  <EyeOff className="w-2.5 h-2.5" />
                  INCOGNITO
                </span>
              )}
            </Link>
            <div className="flex items-center gap-2">
              <Notifications />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-slate-600"
              >
                {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Menu mobile déroulant */}
          {menuOpen && (
            <nav className="px-4 pb-4 space-y-1 animate-fade-in">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      : "text-slate-600 hover:bg-rose-50"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}

              {/* Séparateur */}
              <div className="border-t border-slate-100 my-2" />

              {/* Lien Premium dans le menu mobile */}
              <Link
                href="/premium"
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  pathname === "/premium"
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-white"
                    : "bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-600 border border-orange-200"
                }`}
              >
                <Gem className="w-5 h-5" />
                Passer Premium
                <span className="ml-auto text-[10px] font-bold bg-orange-500 text-white px-2 py-0.5 rounded-full">
                  NEW
                </span>
              </Link>

              {/* Déconnexion */}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-red-50 hover:text-red-500 transition w-full font-medium"
              >
                <LogOut className="w-5 h-5" />
                Se déconnecter
              </button>
            </nav>
          )}
        </div>

        {/* ========== MOBILE BOTTOM NAV ========== */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100">
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition ${
                  pathname === item.href
                    ? "text-rose-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
            {/* Bouton Premium dans la bottom nav mobile */}
            <Link
              href="/premium"
              className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition ${
                pathname === "/premium"
                  ? "text-orange-500"
                  : "text-orange-400 hover:text-orange-500"
              }`}
            >
              <Gem className="w-5 h-5" />
              <span className="text-[10px] font-medium">Premium</span>
            </Link>
          </div>
        </div>

           {/* ========== MAIN CONTENT ========== */}
        <main className="flex-1 lg:ml-72 pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          {/* 🕵️ Bandeau Incognito discret en haut */}
          {user?.isIncognito && (
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-center py-1.5 px-4 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-md">
              <EyeOff className="w-3.5 h-3.5" />
              MODE INCOGNITO ACTIVÉ • TU ES INVISIBLE DANS DISCOVER
              <Link href="/preferences" className="ml-2 underline hover:no-underline">
                Gérer
              </Link>
            </div>
          )}
          {children}
        </main>

      </div>
    </UserContext.Provider>
  );
}
