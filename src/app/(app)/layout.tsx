"use client";

import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Notifications from "../components/Notifications";
import InstallAppButton from "../components/InstallAppButton";
import PushAutoSubscriber from "../components/PushAutoSubscriber";
import GabiAiButton from "@/components/GabiAiButton";
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
  Gift,
  Info,
  Bell,
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

interface UnreadCounts {
  likesReceived: number;
  matches: number;
  unreadMessages: number;
}

const UserContext = createContext<{
  user: UserData | null;
  refreshUser: () => void;
  counts: UnreadCounts;
  refreshCounts: () => void;
}>({
  user: null,
  refreshUser: () => {},
  counts: { likesReceived: 0, matches: 0, unreadMessages: 0 },
  refreshCounts: () => {},
});

export function useUser() {
  return useContext(UserContext);
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [counts, setCounts] = useState<UnreadCounts>({
    likesReceived: 0,
    matches: 0,
    unreadMessages: 0,
  });

  const [seenMatchesCount, setSeenMatchesCount] = useState<number>(0);
  const [seenLikesCount, setSeenLikesCount] = useState<number>(0);

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMatches = localStorage.getItem("seenMatchesCount");
      const savedLikes = localStorage.getItem("seenLikesCount");
      if (savedMatches) setSeenMatchesCount(parseInt(savedMatches, 10));
      if (savedLikes) setSeenLikesCount(parseInt(savedLikes, 10));
    }
  }, []);

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

  const fetchCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/unread-counts");
      if (res.ok) {
        const data = await res.json();
        setCounts({
          likesReceived: data.likesReceived || 0,
          matches: data.matches || 0,
          unreadMessages: data.unreadMessages || 0,
        });
      }
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;
    fetchUser();
    fetchCounts();
  }, [fetchUser, fetchCounts]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, [user, fetchCounts]);

  useEffect(() => {
    if (user) fetchCounts();
  }, [pathname, user, fetchCounts]);

  useEffect(() => {
    if (pathname === "/matches" && counts.matches > 0) {
      setSeenMatchesCount(counts.matches);
      if (typeof window !== "undefined") {
        localStorage.setItem("seenMatchesCount", String(counts.matches));
      }
    }
  }, [pathname, counts.matches]);

  useEffect(() => {
    if (pathname === "/likes-recus" && counts.likesReceived > 0) {
      setSeenLikesCount(counts.likesReceived);
      if (typeof window !== "undefined") {
        localStorage.setItem("seenLikesCount", String(counts.likesReceived));
      }
    }
  }, [pathname, counts.likesReceived]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!user) return;
    if (!user.photoUrl && pathname !== "/welcome") {
      router.push("/welcome");
    }
    if (user.photoUrl && pathname === "/welcome") {
      router.push("/dashboard");
    }
  }, [user, pathname, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  };

  const newMatchesBadge = Math.max(0, counts.matches - seenMatchesCount);
  const newLikesBadge = Math.max(0, counts.likesReceived - seenLikesCount);

  const navItems = [
    {
      href: "/dashboard",
      label: "Accueil",
      icon: <Sparkles className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/discover",
      label: "Découvrir",
      icon: <Compass className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/likes-recus",
      label: "Qui m'a liké",
      icon: <Star className="w-5 h-5" />,
      badge: newLikesBadge,
    },
    {
      href: "/matches",
      label: "Matchs",
      icon: <Heart className="w-5 h-5" />,
      badge: newMatchesBadge,
    },
    {
      href: "/messages",
      label: "Messages",
      icon: <MessageCircle className="w-5 h-5" />,
      badge: counts.unreadMessages,
      alert: true,
    },
    {
      href: "/notifications",
      label: "Notifications",
      icon: <Bell className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/profile",
      label: "Profil",
      icon: <User className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/preferences",
      label: "Préférences",
      icon: <Settings className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/boost",
      label: "Boost",
      icon: <Zap className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/verification",
      label: "Vérification",
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: 0,
    },
    {
      href: "/guide",
      label: "Guide",
      icon: <Info className="w-5 h-5" />,
      badge: 0,
    },
  ];

  const mobileNavItems = navItems.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 flex items-center justify-center">
        <PushAutoSubscriber />
        <div className="text-center">
          <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600 font-medium">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider
      value={{
        user,
        refreshUser: fetchUser,
        counts,
        refreshCounts: fetchCounts,
      }}
    >
      <div className="min-h-screen bg-slate-50 flex">
        {/* ========== SIDEBAR DESKTOP ========== */}
        <aside className="hidden lg:flex w-72 bg-white border-r border-slate-100 flex-col fixed inset-y-0 left-0 z-30">
          <div className="p-6 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2" prefetch>
              <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
              <span className="text-2xl font-bold gradient-text">LoveLink</span>
            </Link>
            <Notifications />
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                prefetch
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                  pathname === item.href
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-lg shadow-rose-500/25"
                    : "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge > 0 && (
                  <span
                    className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center shadow-md ${
                      item.alert
                        ? "bg-rose-500 text-white animate-pulse"
                        : pathname === item.href
                        ? "bg-white text-rose-600"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="my-3 border-t border-slate-100" />

            <Link
              href="/parrainage"
              prefetch
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold ${
                pathname === "/parrainage"
                  ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200 hover:from-emerald-100 hover:to-green-100"
              }`}
            >
              <Gift className="w-5 h-5" />
              <span>Parrainer</span>
              <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                GRATUIT
              </span>
            </Link>

            <Link
              href="/premium"
              prefetch
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

          <div className="p-4 border-t border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                {user?.photoUrl ? (
                  <Image
                    src={user.photoUrl}
                    alt="Profil"
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
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
            <Link href="/dashboard" className="flex items-center gap-2" prefetch>
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
                {menuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav
              className="px-4 pb-32 space-y-1 animate-fade-in overflow-y-auto"
              style={{ maxHeight: "calc(100vh - 80px)" }}
            >
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
                    pathname === item.href
                      ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
                      : "text-slate-600 hover:bg-rose-50"
                  }`}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {item.badge > 0 && (
                    <span
                      className={`min-w-[22px] h-5 px-1.5 rounded-full text-[11px] font-black flex items-center justify-center shadow-md ${
                        item.alert
                          ? "bg-rose-500 text-white animate-pulse"
                          : pathname === item.href
                          ? "bg-white text-rose-600"
                          : "bg-rose-500 text-white"
                      }`}
                    >
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </Link>
              ))}

              <div className="border-t border-slate-100 my-2" />

              <Link
                href="/parrainage"
                prefetch
                className={`relative flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  pathname === "/parrainage"
                    ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white"
                    : "bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                <Gift className="w-5 h-5" />
                Parrainer un ami
                <span className="ml-auto text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                  GRATUIT
                </span>
              </Link>

              <Link
                href="/premium"
                prefetch
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
                prefetch
                className={`relative flex flex-col items-center gap-0.5 p-2 rounded-lg transition ${
                  pathname === item.href
                    ? "text-rose-500"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {item.badge > 0 && (
                  <span
                    className={`absolute top-0 right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-white ${
                      item.alert
                        ? "bg-rose-500 text-white animate-pulse"
                        : "bg-rose-500 text-white"
                    }`}
                  >
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
            <Link
              href="/premium"
              prefetch
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

        {/* ========== MAIN CONTENT (UNE SEULE FOIS) ========== */}
        <main className="flex-1 lg:ml-72 pt-16 pb-20 lg:pt-0 lg:pb-0 min-h-screen">
          {user?.isIncognito && (
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-center py-1.5 px-4 text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-md">
              <EyeOff className="w-3.5 h-3.5" />
              MODE INCOGNITO ACTIVÉ • TU ES INVISIBLE DANS DISCOVER
              <Link
                href="/preferences"
                className="ml-2 underline hover:no-underline"
              >
                Gérer
              </Link>
            </div>
          )}
          {children}
        </main>

        {/* 🤖 Gabi AI flottant partout (Accueil, Profil, Préférences, etc.) */}
        <GabiAiButton />

        <InstallAppButton />
      </div>
    </UserContext.Provider>
  );
}
