"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Bell,
  Check,
  Heart,
  Eye,
  UserPlus,
  Sparkles,
  MessageCircle,
  Trash2,
} from "lucide-react";

type NotifType = "all" | "visit" | "like" | "match" | "message" | "request";

interface NotificationItem {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  fromUser: {
    id: number;
    firstName: string;
    photoUrl: string | null;
  } | null;
}

function timeAgo(dateStr: string) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "hier";
  if (days < 7) return `${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
  });
}

function dayLabel(dateStr: string) {
  if (!dateStr) return "Plus ancien";
  const d = new Date(dateStr);
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round(
    (startToday.getTime() - startThat.getTime()) / 86400000
  );
  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return "Cette semaine";
  return "Plus ancien";
}

function normalizeType(raw: string): NotifType {
  const t = (raw || "").toLowerCase();
  if (t.includes("visit") || t.includes("visite")) return "visit";
  if (t.includes("like") || t.includes("favori")) return "like";
  if (t.includes("match")) return "match";
  if (t.includes("message")) return "message";
  if (t.includes("request") || t.includes("demande") || t.includes("contact"))
    return "request";
  return "visit";
}

function notifIcon(type: NotifType) {
  switch (type) {
    case "visit":
      return { Icon: Eye, color: "text-sky-500", bg: "bg-sky-50" };
    case "like":
      return { Icon: Heart, color: "text-rose-500", bg: "bg-rose-50" };
    case "match":
      return { Icon: Sparkles, color: "text-purple-500", bg: "bg-purple-50" };
    case "message":
      return { Icon: MessageCircle, color: "text-pink-500", bg: "bg-pink-50" };
    case "request":
      return { Icon: UserPlus, color: "text-fuchsia-500", bg: "bg-fuchsia-50" };
    default:
      return { Icon: Bell, color: "text-rose-500", bg: "bg-rose-50" };
  }
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<NotifType>("all");
  const [marking, setMarking] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications || []);
      }
    } catch {
      // silent
    } flex-shrink-0 {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifs();
  }, [fetchNotifs]);

  const unreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items]
  );

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((n) => normalizeType(n.type) === filter);
  }, [items, filter]);

  const grouped = useMemo(() => {
    const map = new Map<string, NotificationItem[]>();
    for (const n of filtered) {
      const key = dayLabel(n.createdAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(n);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const counts = useMemo(() => {
    const base = { all: items.length, visit: 0, request: 0, like: 0, match: 0 };
    for (const n of items) {
      const t = normalizeType(n.type);
      if (t in base) (base as any)[t] += 1;
    }
    return base;
  }, [items]);

  async function markAllRead() {
    setMarking(true);
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // silent
    } finally {
      setMarking(false);
    }
  }

  async function deleteNotif(id: number) {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silent
    }
  }

  const tabs: { id: NotifType; label: string; count: number }[] = [
    { id: "all", label: "Tout", count: counts.all },
    { id: "visit", label: "Visites", count: counts.visit },
    { id: "request", label: "Demandes", count: counts.request },
    { id: "like", label: "Favoris", count: counts.like },
    { id: "match", label: "Matchs", count: counts.match },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#F7F8FC] pb-20">
      <div className="max-w-md mx-auto px-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Link
              href="/discover"
              className="p-2 rounded-full hover:bg-white text-slate-500"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-rose-500" />
                <h1 className="text-xl font-black text-slate-900">
                  Notifications
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 ml-7">
                {unreadCount > 0 ? (
                  <span className="text-rose-500 font-semibold">
                    ● {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                  </span>
                ) : (
                  "Tout est à jour"
                )}
              </p>
            </div>
          </div>

          <button
            onClick={markAllRead}
            disabled={marking || unreadCount === 0}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-500 to-purple-600 text-white flex items-center justify-center shadow-md shadow-rose-200 disabled:opacity-40"
            title="Tout marquer comme lu"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-2">
          {tabs.map((tab) => {
            const active = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200"
                    : "bg-white text-slate-500 border border-slate-100"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${active ? "text-white/90" : ""}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Notifications List */}
        {loading ? (
          <div className="space-y-3 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 rounded-3xl bg-white border border-slate-100"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
              <Bell className="w-9 h-9 text-slate-200" />
            </div>
            <p className="font-bold text-slate-700">Aucune notification</p>
            <p className="text-sm text-slate-400 mt-1">
              Tes likes, visites et matchs apparaîtront ici
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {grouped.map(([label, list]) => (
              <section key={label}>
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {label}
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {list.length} notification{list.length > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {list.map((n) => {
                    const normType = normalizeType(n.type);
                    const { Icon, color, bg } = notifIcon(normType);
                    const unread = !n.isRead;

                    return (
                      <div
                        key={n.id}
                        className={`group relative flex items-start gap-3 p-3.5 rounded-3xl border shadow-sm transition ${
                          unread
                            ? "bg-white border-rose-100"
                            : "bg-white/80 border-slate-100"
                        }`}
                      >
                        {/* Avatar ou Icône */}
                        {n.fromUser?.photoUrl ? (
                          <div className="relative flex-shrink-0">
                            <Image
                              src={n.fromUser.photoUrl}
                              alt={n.fromUser.firstName || "Profil"}
                              width={44}
                              height={44}
                              className="rounded-2xl object-cover"
                            />
                            <div
                              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${bg} flex items-center justify-center border-2 border-white`}
                            >
                              <Icon className={`w-3 h-3 ${color}`} />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center flex-shrink-0`}
                          >
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-bold text-slate-900 text-sm leading-snug">
                              <span className={color}>♥ </span>
                              {normType === "like"
                                ? "Nouveau favori !"
                                : normType === "visit"
                                ? "Nouvelle visite"
                                : normType === "match"
                                ? "Nouveau match !"
                                : normType === "request"
                                ? "Nouvelle demande"
                                : "Notification"}
                            </p>
                            {unread && (
                              <span className="mt-1 w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                            )}
                          </div>

                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                            {n.content}
                          </p>

                          <p className="text-[11px] text-slate-400 mt-1 font-medium">
                            {timeAgo(n.createdAt)}
                          </p>
                        </div>

                        {/* Supprimer button */}
                        <button
                          onClick={() => deleteNotif(n.id)}
                          className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 transition"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
