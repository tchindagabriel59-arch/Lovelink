"use client";

import { useEffect, useState, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../layout";
import Image from "next/image";
import {
  Heart,
  Send,
  ArrowLeft,
  MessageCircle,
  Compass,
  Crown,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  BadgeCheck,
  Search,
  Mic,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

interface MatchData {
  matchId: number;
  matchedAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    isOnline: boolean;
    city: string | null;
    isPremium: boolean;
    isVerified: boolean;
  };
  lastMessage: {
    content: string;
    senderId: number;
    createdAt: string;
    isRead: boolean;
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
  isPremium: boolean;
  isVerified: boolean;
  lastSeen: string | null;
}

type FilterTab = "all" | "unread" | "read";

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

const quickEmojis = ["❤️", "😂", "🔥", "👍", "🥰", "😍", "😘", "🎉"];

function MatchesListSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-pulse">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-3">
          <div className="w-14 h-14 rounded-full bg-slate-200 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded-full w-32" />
            <div className="h-3 bg-slate-100 rounded-full w-48" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 animate-pulse">
      <div className="flex justify-start mt-3">
        <div className="h-10 w-48 bg-white rounded-2xl rounded-bl-md shadow-sm" />
      </div>
      <div className="flex justify-end mt-3">
        <div className="h-10 w-40 bg-rose-100 rounded-2xl rounded-br-md" />
      </div>
      <div className="flex justify-end mt-0.5">
        <div className="h-10 w-56 bg-rose-100 rounded-2xl rounded-tr-md" />
      </div>
      <div className="flex justify-start mt-3">
        <div className="h-10 w-52 bg-white rounded-2xl rounded-bl-md shadow-sm" />
      </div>
    </div>
  );
}

function Avatar({
  photoUrl,
  firstName,
  userId,
  size = 56,
  className = "",
}: {
  photoUrl: string | null;
  firstName: string;
  userId: number;
  size?: number;
  className?: string;
}) {
  const gradient = gradients[userId % gradients.length];

  if (photoUrl) {
    return (
      <Image
        src={photoUrl}
        alt={firstName}
        width={size}
        height={size}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className={`rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold ${className}`}
    >
      {firstName?.charAt(0)}
    </div>
  );
}

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
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isTypingRef = useRef(false);
  const [otherIsTyping, setOtherIsTyping] = useState(false);
  const lastTypingSentRef = useRef<number>(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const shouldScrollRef = useRef(true);
  const lastMatchesHashRef = useRef<string>("");

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  const fetchMatchesList = useCallback(async () => {
    try {
      const res = await fetch("/api/matches");
      if (res.ok) {
        const data = await res.json();
        const matches: MatchData[] = data.matches || [];
        const hash = matches
          .map(
            (m) =>
              `${m.matchId}-${m.lastMessage?.createdAt || "none"}-${m.unreadCount}`
          )
          .join("|");

        if (hash !== lastMatchesHashRef.current) {
          lastMatchesHashRef.current = hash;
          setMatchesList(matches);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    fetchMatchesList();
    const interval = setInterval(fetchMatchesList, 30000);
    return () => clearInterval(interval);
  }, [fetchMatchesList]);

  useEffect(() => {
    const matchParam = searchParams.get("match");
    if (matchParam) {
      setSelectedMatch(parseInt(matchParam, 10));
    }
  }, [searchParams]);

  const fetchMessages = useCallback(
    async (matchId: number, isInitial = false) => {
      if (isInitial) setLoadingMessages(true);

      try {
        const res = await fetch(`/api/messages/${matchId}`);
        if (res.ok) {
          const data = await res.json();
          const newMessages: Message[] = data.messages || [];

          if (isInitial) {
            setChatMessages(newMessages);
            setOtherUser(data.otherUser || null);
            if (newMessages.length > 0) {
              lastMessageIdRef.current = newMessages[newMessages.length - 1].id;
            }
            shouldScrollRef.current = true;
            return;
          }

          const lastNewMessageId =
            newMessages.length > 0
              ? newMessages[newMessages.length - 1].id
              : null;

          if (lastNewMessageId !== lastMessageIdRef.current) {
            setChatMessages(newMessages);
            lastMessageIdRef.current = lastNewMessageId;
            shouldScrollRef.current = true;

            setOtherUser((prev) => {
              const newOther = data.otherUser;
              if (!newOther) return prev;
              if (
                prev?.isOnline !== newOther.isOnline ||
                prev?.lastSeen !== newOther.lastSeen
              ) {
                return newOther;
              }
              return prev;
            });
          }
        }
      } catch {
        // silently fail
      } finally {
        if (isInitial) setLoadingMessages(false);
      }
    },
    []
  );

  useEffect(() => {
    if (selectedMatch) {
      lastMessageIdRef.current = null;
      fetchMessages(selectedMatch, true);
    }
  }, [selectedMatch, fetchMessages]);

  useEffect(() => {
    if (!selectedMatch || !otherUser) return;
    fetch("/api/notifications/clear-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fromUserId: otherUser.id }),
    }).catch(() => {});
  }, [selectedMatch, otherUser]);

  useEffect(() => {
    if (shouldScrollRef.current && chatMessages.length > 0) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [chatMessages, scrollToBottom]);

  useEffect(() => {
    if (!selectedMatch) return;
    const interval = setInterval(() => {
      if (!isTypingRef.current) {
        fetchMessages(selectedMatch, false);
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [selectedMatch, fetchMessages]);

  useEffect(() => {
    if (!selectedMatch) {
      setOtherIsTyping(false);
      return;
    }

    const checkTyping = async () => {
      try {
        const res = await fetch(`/api/messages/typing?matchId=${selectedMatch}`);
        if (res.ok) {
          const data = await res.json();
          setOtherIsTyping(data.isTyping || false);
        }
      } catch {}
    };

    checkTyping();
    const interval = setInterval(checkTyping, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch]);

  useEffect(() => {
    setOtherIsTyping(false);
  }, [selectedMatch]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || sending) return;

    if (selectedMatch) {
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatch, isTyping: false }),
      }).catch(() => {});
    }

    const messageToSend = newMessage;
    setNewMessage("");
    setSending(true);
    setShowEmojis(false);

    try {
      const res = await fetch(`/api/messages/${selectedMatch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: messageToSend }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        lastMessageIdRef.current = data.message.id;
        shouldScrollRef.current = true;
        fetchMatchesList();
      } else {
        setNewMessage(messageToSend);
      }
    } catch {
      setNewMessage(messageToSend);
    } finally {
      setSending(false);
    }
  }

  async function handleSendEmoji(emoji: string) {
    if (!selectedMatch || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/messages/${selectedMatch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: emoji }),
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        lastMessageIdRef.current = data.message.id;
        shouldScrollRef.current = true;
        fetchMatchesList();
      }
    } catch {
    } finally {
      setSending(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedMatch) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Image trop grande. Max 5 MB.");
      return;
    }

    setUploadingImage(true);
    try {
      const uploadRes = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        { method: "POST", body: file }
      );
      if (!uploadRes.ok) throw new Error("Upload échoué");

      const blob = await uploadRes.json();
      const imageUrl = blob.url;

      const res = await fetch(`/api/messages/${selectedMatch}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: `[IMAGE]${imageUrl}` }),
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [...prev, data.message]);
        lastMessageIdRef.current = data.message.id;
        shouldScrollRef.current = true;
        fetchMatchesList();
      }
    } catch {
      alert("Erreur envoi image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    isTypingRef.current = true;

    const now = Date.now();
    if (selectedMatch && now - lastTypingSentRef.current > 2000) {
      lastTypingSentRef.current = now;
      fetch("/api/messages/typing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: selectedMatch, isTyping: true }),
      }).catch(() => {});
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      if (selectedMatch) {
        fetch("/api/messages/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId: selectedMatch, isTyping: false }),
        }).catch(() => {});
      }
    }, 2000);
  };

  function formatMessageTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "maintenant";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}j`;
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
    });
  }

  const renderMessageContent = (content: string) => {
    if (content.startsWith("[IMAGE]")) {
      const imageUrl = content.replace("[IMAGE]", "");
      return (
        <div
          className="relative w-48 h-48 rounded-xl overflow-hidden cursor-pointer"
          onClick={() => window.open(imageUrl, "_blank")}
        >
          <Image
            src={imageUrl}
            alt="Photo envoyée"
            fill
            className="object-cover"
            sizes="192px"
          />
        </div>
      );
    }
    const isEmojiOnly = /^\p{Emoji}+$/u.test(content) && content.length <= 4;
    return (
      <p className={`leading-relaxed ${isEmojiOnly ? "text-4xl" : "text-sm"}`}>
        {content}
      </p>
    );
  };

  const newMatches = matchesList.filter((m) => !m.lastMessage);
  const conversations = matchesList.filter((m) => m.lastMessage);

  const filteredConversations = conversations.filter((match) => {
    const lastMsgIsMine = match.lastMessage?.senderId === user?.id;
    const hasUnread = match.unreadCount > 0 && !lastMsgIsMine;

    if (filterTab === "unread" && !hasUnread) return false;
    if (filterTab === "read" && hasUnread) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = `${match.user.firstName} ${match.user.lastName || ""}`.toLowerCase();
      const last = match.lastMessage?.content?.toLowerCase() || "";
      return name.includes(q) || last.includes(q);
    }
    return true;
  });

  const unreadConversationsCount = conversations.filter((m) => {
    const lastMsgIsMine = m.lastMessage?.senderId === user?.id;
    return m.unreadCount > 0 && !lastMsgIsMine;
  }).length;

  const readConversationsCount = conversations.length - unreadConversationsCount;

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen bg-[#F7F8FC]">
      {/* SIDEBAR CONVERSATIONS - Style Farata */}
      <div
        className={`${
          selectedMatch ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 bg-[#F7F8FC]`}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 bg-[#F7F8FC]">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
                Messages
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-medium">
                {matchesList.length} conversation{matchesList.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Card Vocaux Premium */}
        <div className="px-4 mb-3">
          <Link
            href="/premium"
            className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-200 p-3.5 shadow-sm border border-amber-200/80"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/70 flex items-center justify-center">
                <Mic className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black text-amber-950">
                    Messages vocaux
                  </p>
                  <span className="text-[9px] font-black uppercase tracking-wider bg-white/80 text-amber-700 px-1.5 py-0.5 rounded-md">
                    Nouveau
                  </span>
                </div>
                <p className="text-[11px] text-amber-900/70 font-medium">
                  Fais entendre ta voix · Exclusif Premium ✨
                </p>
              </div>
            </div>
            <span className="text-amber-800 text-lg">›</span>
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: "all" as FilterTab, label: "Tous", count: conversations.length },
            {
              id: "unread" as FilterTab,
              label: "Non lus",
              count: unreadConversationsCount,
            },
            {
              id: "read" as FilterTab,
              label: "Lus",
              count: readConversationsCount,
            },
          ].map((tab) => {
            const active = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
                  active
                    ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200"
                    : "bg-white text-slate-500 border border-slate-100"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${active ? "text-white/90" : "text-slate-400"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="px-4 mb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une conversation..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-rose-200 shadow-sm"
            />
          </div>
        </div>

        {loadingMatches ? (
          <MatchesListSkeleton />
        ) : matchesList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <div className="w-20 h-20 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-10 h-10 text-slate-200" />
              </div>
              <p className="text-slate-700 font-bold">Aucun match</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Matche avec quelqu&apos;un pour discuter
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-sm font-bold shadow-md"
              >
                <Compass className="w-4 h-4" />
                Découvrir
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {/* New Matches Header */}
            {newMatches.length > 0 && filterTab === "all" && !searchQuery && (
              <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm">
                <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-3">
                  ✨ Nouveaux matchs
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {newMatches.map((match) => (
                    <button
                      key={match.matchId}
                      onClick={() => setSelectedMatch(match.matchId)}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0"
                    >
                      <div className="relative">
                        <div
                          className={`p-[2px] rounded-full ${
                            match.user.isPremium
                              ? "bg-gradient-to-r from-yellow-400 to-orange-500"
                              : "bg-gradient-to-r from-rose-500 to-purple-600"
                          }`}
                        >
                          <Avatar
                            photoUrl={match.user.photoUrl}
                            firstName={match.user.firstName}
                            userId={match.user.id}
                            size={64}
                            className="border-2 border-white"
                          />
                        </div>
                        {match.user.isOnline && (
                          <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                        )}
                        {match.user.isPremium && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white">
                            <Crown className="w-2.5 h-2.5 text-white fill-white" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-semibold text-slate-700 max-w-[70px] truncate">
                        {match.user.firstName}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Cards */}
            {filteredConversations.length === 0 ? (
              <div className="text-center py-10 text-sm text-slate-400">
                Aucune conversation trouvée
              </div>
            ) : (
              filteredConversations.map((match) => {
                const lastMsgIsMine = match.lastMessage?.senderId === user?.id;
                const isPremium = match.user.isPremium;
                const isSelected = selectedMatch === match.matchId;
                const hasUnread = match.unreadCount > 0 && !lastMsgIsMine;

                return (
                  <button
                    key={match.matchId}
                    onClick={() => setSelectedMatch(match.matchId)}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-3xl text-left transition shadow-sm border ${
                      isSelected
                        ? "bg-rose-50 border-rose-200"
                        : isPremium
                        ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-100"
                        : "bg-white border-slate-100 hover:border-rose-100"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={
                          isPremium
                            ? "p-[2px] rounded-full bg-gradient-to-r from-yellow-400 to-orange-500"
                            : ""
                        }
                      >
                        <Avatar
                          photoUrl={match.user.photoUrl}
                          firstName={match.user.firstName}
                          userId={match.user.id}
                          size={56}
                          className={isPremium ? "border-2 border-white" : ""}
                        />
                      </div>
                      {match.user.isOnline && (
                        <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1 min-w-0">
                          <p className="font-bold text-slate-900 truncate">
                            {match.user.firstName}
                            {match.user.lastName ? ` ${match.user.lastName.charAt(0)}.` : ""}
                          </p>
                          {match.user.isVerified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-blue-500 fill-blue-500 flex-shrink-0" />
                          )}
                          {isPremium && (
                            <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                          )}
                        </div>
                        {match.lastMessage && (
                          <span className="text-[11px] text-slate-400 flex-shrink-0 font-medium">
                            {formatMessageTime(match.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>

                      {match.lastMessage && (
                        <p
                          className={`text-sm truncate mt-0.5 ${
                            hasUnread
                              ? "text-slate-800 font-semibold"
                              : "text-slate-500"
                          }`}
                        >
                          {lastMsgIsMine && (
                            <span className="text-slate-400 font-normal">Vous: </span>
                          )}
                          {match.lastMessage.content.startsWith("[IMAGE]") ? (
                            <span className="inline-flex items-center gap-1">
                              <ImageIcon className="w-3.5 h-3.5" /> Photo
                            </span>
                          ) : (
                            match.lastMessage.content
                          )}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {hasUnread ? (
                        <span className="min-w-[22px] h-[22px] px-1.5 bg-gradient-to-br from-rose-500 to-purple-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                          {match.unreadCount > 9 ? "9+" : match.unreadCount}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-lg">›</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ZONE DE CHAT */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col bg-[#F3F4F8] relative">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "radial-gradient(circle at 20px 20px, #e11d48 1.5px, transparent 0)",
              backgroundSize: "40px 40px",
            }}
          />

          {/* Header Chat */}
          <div className="relative z-10 px-3 py-3 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 shadow-sm">
            <button
              onClick={() => setSelectedMatch(null)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {otherUser && (
              <>
                <div className="relative">
                  <Avatar
                    photoUrl={otherUser.photoUrl}
                    firstName={otherUser.firstName}
                    userId={otherUser.id}
                    size={44}
                  />
                  {otherUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-slate-900 truncate">
                      {otherUser.firstName}
                      {otherUser.lastName ? ` ${otherUser.lastName.charAt(0)}.` : ""}
                    </p>
                    {otherUser.isVerified && (
                      <BadgeCheck className="w-4 h-4 text-blue-500 fill-blue-500" />
                    )}
                    {otherUser.isPremium && (
                      <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    {otherUser.isOnline ? (
                      <span className="text-emerald-600 font-medium">En ligne</span>
                    ) : otherUser.lastSeen ? (
                      `Vu ${timeAgo(otherUser.lastSeen)}`
                    ) : (
                      "Hors ligne"
                    )}
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Body Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <ChatSkeleton />
            ) : chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-xs px-4">
                  <p className="text-slate-800 font-black text-xl">
                    Dis bonjour à {otherUser?.firstName || "ton match"}
                    {otherUser?.lastName ? ` ${otherUser.lastName.charAt(0)}.` : ""}
                  </p>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Sois respectueux(se) et bienveillant(e)
                    <br />
                    dans tes échanges
                  </p>
                </div>
              </div>
            ) : (
              chatMessages.map((msg, index) => {
                const isMine = msg.senderId === user?.id;
                const prevMsg = index > 0 ? chatMessages[index - 1] : null;
                const nextMsg =
                  index < chatMessages.length - 1
                    ? chatMessages[index + 1]
                    : null;
                const isSameSenderAsPrev = prevMsg?.senderId === msg.senderId;
                const isSameSenderAsNext = nextMsg?.senderId === msg.senderId;
                const isFirstOfGroup = !isSameSenderAsPrev;
                const isLastOfGroup = !isSameSenderAsNext;
                const isImage = msg.content.startsWith("[IMAGE]");

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                      isFirstOfGroup ? "mt-3" : "mt-0.5"
                    }`}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={`${isImage ? "p-1" : "px-4 py-2.5"} ${
                          isMine
                            ? `bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200/50 ${
                                isFirstOfGroup && isLastOfGroup
                                  ? "rounded-2xl"
                                  : isFirstOfGroup
                                  ? "rounded-2xl rounded-br-md"
                                  : isLastOfGroup
                                  ? "rounded-2xl rounded-tr-md"
                                  : "rounded-l-2xl rounded-r-md"
                              }`
                            : `bg-white text-slate-800 shadow-sm ${
                                isFirstOfGroup && isLastOfGroup
                                  ? "rounded-2xl"
                                  : isFirstOfGroup
                                  ? "rounded-2xl rounded-bl-md"
                                  : isLastOfGroup
                                  ? "rounded-2xl rounded-tl-md"
                                  : "rounded-r-2xl rounded-l-md"
                              }`
                        }`}
                      >
                        {renderMessageContent(msg.content)}
                      </div>

                      {isLastOfGroup && (
                        <div
                          className={`flex items-center gap-1 mt-1 ${
                            isMine ? "justify-end" : "justify-start"
                          }`}
                        >
                          <span className="text-[10px] text-slate-400">
                            {formatMessageTime(msg.createdAt)}
                          </span>
                          {isMine &&
                            (msg.isRead ? (
                              <CheckCheck className="w-3 h-3 text-blue-500" />
                            ) : (
                              <Check className="w-3 h-3 text-slate-400" />
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {otherIsTyping && otherUser && (
              <div className="flex justify-start mt-2">
                <div className="bg-white shadow-sm rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-500 mr-1">
                      {otherUser.firstName} écrit
                    </span>
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {showEmojis && (
            <div className="relative z-10 px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleSendEmoji(emoji)}
                  disabled={sending}
                  className="text-3xl hover:scale-125 transition disabled:opacity-50 flex-shrink-0"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={handleSend}
            className="relative z-10 p-3 bg-white/95 backdrop-blur border-t border-slate-100"
          >
            <div className="flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-2.5 rounded-full text-slate-400 hover:bg-slate-100 transition disabled:opacity-50"
              >
                {uploadingImage ? (
                  <span className="text-xs">...</span>
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 flex items-center bg-slate-100 rounded-full px-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Écris ton message..."
                  className="flex-1 px-3 py-3 bg-transparent text-sm outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`p-2 rounded-full transition ${
                    showEmojis
                      ? "bg-rose-100 text-rose-600"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <Smile className="w-5 h-5" />
                </button>
              </div>

              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:shadow-lg hover:scale-105 transition disabled:opacity-30 disabled:hover:scale-100 shadow-md shadow-rose-200"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#F3F4F8]">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-white shadow-sm flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-rose-400" />
            </div>
            <p className="text-xl font-black text-slate-700">
              Sélectionne une conversation
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Choisis un match pour commencer à discuter
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
        <div className="flex items-center justify-center min-h-screen bg-[#F7F8FC]">
          <Heart className="w-8 h-8 text-rose-400 animate-pulse" />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
