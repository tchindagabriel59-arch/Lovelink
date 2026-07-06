"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../layout";
import {
  Heart,
  Send,
  ArrowLeft,
  MessageCircle,
  Compass,
} from "lucide-react";
import Link from "next/link";

interface MatchData {
  matchId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    isOnline: boolean;
    city: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  } | null;
  unreadCount: number;
}

interface Message {
  id: number;
  senderId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface OtherUser {
  id: number;
  firstName: string;
  lastName: string;
  photoUrl: string | null;
  isOnline: boolean;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

function MessagesContent() {
  const searchParams = useSearchParams();
  const { user } = useUser();
  const [matchesList, setMatchesList] = useState<MatchData[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    async function fetchMatches() {
      try {
        const res = await fetch("/api/matches");
        if (res.ok) {
          const data = await res.json();
          setMatchesList(data.matches || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoadingMatches(false);
      }
    }
    fetchMatches();
  }, []);

  useEffect(() => {
    const matchParam = searchParams.get("match");
    if (matchParam) {
      setSelectedMatch(parseInt(matchParam, 10));
    }
  }, [searchParams]);

  const fetchMessages = useCallback(async (matchId: number) => {
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages/${matchId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
        setOtherUser(data.otherUser || null);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (selectedMatch) {
      fetchMessages(selectedMatch);
    }
  }, [selectedMatch, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Poll for new messages
  useEffect(() => {
    if (!selectedMatch) return;
    const interval = setInterval(() => {
      fetchMessages(selectedMatch);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedMatch, fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedMatch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch {
      // silently fail
    } finally {
      setSending(false);
    }
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "À l'instant";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  }

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen">
      {/* Conversations List */}
      <div
        className={`${
          selectedMatch ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white`}
      >
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Messages</h2>
        </div>

        {loadingMatches ? (
          <div className="flex-1 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-300 animate-pulse" />
          </div>
        ) : matchesList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Aucune conversation</p>
              <p className="text-sm text-slate-400 mt-1">
                Matchez avec quelqu&apos;un pour commencer à discuter
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-lg text-sm font-medium"
              >
                <Compass className="w-4 h-4" />
                Découvrir
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {matchesList.map((match) => {
              const gradient = gradients[match.user.id % gradients.length];
              return (
                <button
                  key={match.matchId}
                  onClick={() => setSelectedMatch(match.matchId)}
                  className={`flex items-center gap-3 w-full p-4 hover:bg-slate-50 transition text-left ${
                    selectedMatch === match.matchId
                      ? "bg-rose-50 border-r-2 border-rose-500"
                      : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold`}
                    >
                      {match.user.firstName?.charAt(0)}
                    </div>
                    {match.user.isOnline && (
                      <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm text-slate-900 truncate">
                        {match.user.firstName}
                      </p>
                      {match.lastMessage && (
                        <span className="text-[10px] text-slate-400">
                          {timeAgo(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    {match.lastMessage ? (
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        {match.lastMessage.content}
                      </p>
                    ) : (
                      <p className="text-xs text-rose-400 italic mt-0.5">
                        Nouveau match ! 💕
                      </p>
                    )}
                  </div>
                  {match.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                      {match.unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat Area */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col bg-slate-50">
          {/* Chat Header */}
          <div className="p-4 bg-white border-b border-slate-100 flex items-center gap-3">
            <button
              onClick={() => setSelectedMatch(null)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            {otherUser && (
              <>
                <div className="relative">
                  <div
                    className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                      gradients[otherUser.id % gradients.length]
                    } flex items-center justify-center text-white font-bold text-sm`}
                  >
                    {otherUser.firstName?.charAt(0)}
                  </div>
                  {otherUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {otherUser.firstName} {otherUser.lastName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {otherUser.isOnline ? "En ligne" : "Hors ligne"}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Heart className="w-8 h-8 text-rose-300 animate-pulse" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Heart className="w-12 h-12 text-rose-200 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">
                    Commencez la conversation !
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Envoyez le premier message
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.senderId === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                        isMine
                          ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-br-md"
                          : "bg-white text-slate-800 shadow-sm rounded-bl-md"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isMine ? "text-white/70" : "text-slate-400"
                        }`}
                      >
                        {timeAgo(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <form
            onSubmit={handleSend}
            className="p-4 bg-white border-t border-slate-100"
          >
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écrivez un message..."
                className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition text-sm"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 bg-gradient-to-r from-rose-500 to-purple-600 rounded-xl flex items-center justify-center text-white hover:shadow-lg transition disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-400">
              Sélectionnez une conversation
            </p>
            <p className="text-sm text-slate-400 mt-1">
              Choisissez un match pour commencer à discuter
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
