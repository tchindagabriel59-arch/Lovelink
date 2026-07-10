"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, Heart, Star, MessageCircle, Sparkles, X } from "lucide-react";

interface Notification {
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

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifs();
    // Actualiser toutes les 30 secondes
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchNotifs() {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently fail
    }
  }

  async function markAllAsRead() {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }

  async function deleteNotif(id: number) {
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
      setNotifs((prev) => prev.filter((n) => n.id !== id));
    } catch {
      // silently fail
    }
  }

  function toggleOpen() {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      // Marquer comme lu quand on ouvre
      setTimeout(markAllAsRead, 1000);
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "like":
        return <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />;
      case "super_like":
        return <Star className="w-4 h-4 text-blue-500 fill-blue-500" />;
      case "match":
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      case "message":
        return <MessageCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  const getLink = (type: string) => {
    switch (type) {
      case "like":
      case "super_like":
        return "/likes-recus";
      case "match":
        return "/matches";
      case "message":
        return "/messages";
      default:
        return "/dashboard";
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="relative p-2 hover:bg-rose-50 rounded-lg transition"
        title="Notifications"
      >
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 max-h-[500px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-500" />
              Notifications
            </h3>
            {notifs.length > 0 && unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-rose-500 hover:text-rose-600 font-medium"
              >
                Tout marquer lu
              </button>
            )}
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto">
            {notifs.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Aucune notification pour le moment
                </p>
              </div>
            ) : (
              <div>
                {notifs.map((notif) => (
                  <div
                    key={notif.id}
                    className={`group flex items-start gap-3 p-3 hover:bg-slate-50 transition border-b border-slate-50 ${
                      !notif.isRead ? "bg-rose-50/50" : ""
                    }`}
                  >
                    <Link
                      href={getLink(notif.type)}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 flex-1"
                    >
                      {/* Photo utilisateur */}
                      <div className="relative flex-shrink-0">
                        {notif.fromUser?.photoUrl ? (
                          <img
                            src={notif.fromUser.photoUrl}
                            alt={notif.fromUser.firstName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {notif.fromUser?.firstName?.charAt(0) || "?"}
                          </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow">
                          {getIcon(notif.type)}
                        </div>
                      </div>

                      {/* Contenu */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700">
                          <strong>{notif.fromUser?.firstName || "Quelqu'un"}</strong>{" "}
                          {notif.content}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatTime(notif.createdAt)}
                        </p>
                      </div>

                      {/* Bulle non lu */}
                      {!notif.isRead && (
                        <div className="w-2 h-2 bg-rose-500 rounded-full flex-shrink-0 mt-1.5" />
                      )}
                    </Link>

                    {/* Bouton supprimer */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotif(notif.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-200 rounded transition"
                    >
                      <X className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
