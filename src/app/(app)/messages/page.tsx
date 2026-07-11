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
  Crown,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
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
  lastSeen: string | null;
}

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-fuchsia-400 to-pink-500",
];

const quickEmojis = ["❤️", "😂", "🔥", "👍", "🥰", "😍", "😘", "🎉"];

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMatchesList = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    fetchMatchesList();
    const interval = setInterval(fetchMatchesList, 15000);
    return () => clearInterval(interval);
  }, [fetchMatchesList]);

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

  useEffect(() => {
    if (!selectedMatch) return;
    const interval = setInterval(() => {
      fetchMessages(selectedMatch);
    }, 3000);
    return () => clearInterval(interval);
  }, [selectedMatch, fetchMessages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || sending) return;

    setSending(true);
    setShowEmojis(false);
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
        fetchMatchesList();
      }
    } catch {
      // silently fail
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
        fetchMatchesList();
      }
    } catch {
      // silently fail
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
        {
          method: "POST",
          body: file,
        }
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
        fetchMatchesList();
      }
    } catch {
      alert("Erreur envoi image");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function formatMessageTime(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("fr-FR", {
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

  const newMatches = matchesList.filter((m) => !m.lastMessage);
  const conversations = matchesList.filter((m) => m.lastMessage);

  const renderMessageContent = (content: string, _isMine: boolean) => {
    if (content.startsWith("[IMAGE]")) {
      const imageUrl = content.replace("[IMAGE]", "");
      return (
        <img
          src={imageUrl}
          alt="Photo envoyée"
          className="rounded-xl max-w-full max-h-64 object-cover cursor-pointer"
          onClick={() => window.open(imageUrl, "_blank")}
        />
      );
    }

    const isEmojiOnly = /^\p{Emoji}+$/u.test(content) && content.length <= 4;

    return (
      <p className={`leading-relaxed ${isEmojiOnly ? "text-4xl" : "text-sm"}`}>
        {content}
      </p>
    );
  };

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen">
      {/* Sidebar Conversations */}
      <div
        className={`${
          selectedMatch ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-80 lg:w-96 border-r border-slate-100 bg-white`}
      >
        <div className="p-4 border-b border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900">Messages</h2>
        </div>

        {loadingMatches ? (
          <div className="flex-1 flex items-center justify-center">
            <Heart className="w-8 h-8 text-rose-300 animate-pulse" />
          </div>
        ) : matchesList.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center">
              <MessageCircle className="w-16 h-16 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-600 font-semibold">Aucun match</p>
              <p className="text-sm text-slate-400 mt-1 mb-4">
                Matchez avec quelqu&apos;un pour commencer à discuter
              </p>
              <Link
                href="/discover"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-sm font-semibold shadow-md hover:shadow-lg transition"
              >
                <Compass className="w-4 h-4" />
                Découvrir
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Nouveaux matchs */}
            {newMatches.length > 0 && (
              <div className="p-4 border-b border-slate-100">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                  ✨ Nouveaux matchs
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {newMatches.map((match) => {
                    const gradient = gradients[match.user.id % gradients.length];
                    const isPremium = match.user.isPremium;

                    return (
                      <button
                        key={match.matchId}
                        onClick={() => setSelectedMatch(match.matchId)}
                        className="flex flex-col items-center gap-1 flex-shrink-0"
                      >
                        <div className="relative">
                          <div
                            className={`p-0.5 rounded-full ${
                              isPremium
                                ? "bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 shadow-lg shadow-yellow-500/30"
                                : "bg-gradient-to-r from-rose-500 via-purple-500 to-pink-500"
                            }`}
                          >
                            {match.user.photoUrl ? (
                              <img
                                src={match.user.photoUrl}
                                alt={match.user.firstName}
                                className="w-16 h-16 rounded-full object-cover border-2 border-white"
                              />
                            ) : (
                              <div
                                className={`w-16 h-16 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg border-2 border-white`}
                              >
                                {match.user.firstName?.charAt(0)}
                              </div>
                            )}
                          </div>

                          {isPremium && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                              <Crown className="w-3 h-3 text-white fill-white" />
                            </div>
                          )}

                          {match.user.isOnline && (
                            <div className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>

                        <span
                          className={`text-xs font-medium max-w-[70px] truncate ${
                            isPremium ? "text-amber-700" : "text-slate-700"
                          }`}
                        >
                          {match.user.firstName}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Conversations */}
            {conversations.length > 0 && (
              <div>
                {newMatches.length > 0 && (
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider p-4 pb-2">
                    💬 Conversations
                  </h3>
                )}

                {conversations.map((match) => {
                  const gradient = gradients[match.user.id % gradients.length];
                  const lastMsgIsMine = match.lastMessage?.senderId === user?.id;
                  const isPremium = match.user.isPremium;
                  const isSelected = selectedMatch === match.matchId;

                  return (
                    <button
                      key={match.matchId}
                      onClick={() => setSelectedMatch(match.matchId)}
                      className={`flex items-center gap-3 w-full p-4 transition text-left ${
                        isSelected
                          ? isPremium
                            ? "bg-yellow-50 border-r-4 border-yellow-500"
                            : "bg-rose-50 border-r-4 border-rose-500"
                          : isPremium
                          ? "hover:bg-yellow-50/60"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <div
                        className={`relative flex-shrink-0 ${
                          isPremium
                            ? "p-0.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 shadow-md shadow-yellow-500/20"
                            : ""
                        }`}
                      >
                        {match.user.photoUrl ? (
                          <img
                            src={match.user.photoUrl}
                            alt={match.user.firstName}
                            className={`w-14 h-14 rounded-full object-cover ${
                              isPremium ? "border-2 border-white" : ""
                            }`}
                          />
                        ) : (
                          <div
                            className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg ${
                              isPremium ? "border-2 border-white" : ""
                            }`}
                          >
                            {match.user.firstName?.charAt(0)}
                          </div>
                        )}

                        {match.user.isOnline && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                        )}

                        {isPremium && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                            <Crown className="w-2.5 h-2.5 text-white fill-white" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className="font-semibold text-slate-900 truncate">
                              {match.user.firstName}
                            </p>
                            {isPremium && (
                              <Crown className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                            )}
                          </div>

                          {match.lastMessage && (
                            <span className="text-xs text-slate-400 flex-shrink-0 ml-2">
                              {timeAgo(match.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>

                        {match.lastMessage && (
                          <p
                            className={`text-sm truncate mt-0.5 flex items-center gap-1 ${
                              match.unreadCount > 0 && !lastMsgIsMine
                                ? "text-slate-900 font-semibold"
                                : "text-slate-500"
                            }`}
                          >
                            {lastMsgIsMine && (
                              <span className="text-slate-400">Toi:</span>
                            )}

                            {match.lastMessage.content.startsWith("[IMAGE]") ? (
                              <span className="flex items-center gap-1">
                                <ImageIcon className="w-3.5 h-3.5" />
                                Photo
                              </span>
                            ) : (
                              match.lastMessage.content
                            )}
                          </p>
                        )}
                      </div>

                      {match.unreadCount > 0 && !lastMsgIsMine && (
                        <span className="w-6 h-6 bg-gradient-to-br from-rose-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                          {match.unreadCount > 9 ? "9+" : match.unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chat Area */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-50 to-rose-50/30">
          {/* Chat Header */}
          <div
            className={`p-4 bg-white border-b flex items-center gap-3 shadow-sm ${
              otherUser?.isPremium ? "border-yellow-200" : "border-slate-100"
            }`}
          >
            <button
              onClick={() => setSelectedMatch(null)}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {otherUser && (
              <>
                <div
                  className={`relative ${
                    otherUser.isPremium
                      ? "p-0.5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400 shadow-md shadow-yellow-500/30"
                      : ""
                  }`}
                >
                  {otherUser.photoUrl ? (
                    <img
                      src={otherUser.photoUrl}
                      alt={otherUser.firstName}
                      className={`w-11 h-11 rounded-full object-cover ${
                        otherUser.isPremium ? "border-2 border-white" : ""
                      }`}
                    />
                  ) : (
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-br ${
                        gradients[otherUser.id % gradients.length]
                      } flex items-center justify-center text-white font-bold ${
                        otherUser.isPremium ? "border-2 border-white" : ""
                      }`}
                    >
                      {otherUser.firstName?.charAt(0)}
                    </div>
                  )}

                  {otherUser.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}

                  {otherUser.isPremium && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
                      <Crown className="w-2.5 h-2.5 text-white fill-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-slate-900 truncate">
                      {otherUser.firstName} {otherUser.lastName}
                    </p>

                    {otherUser.isPremium && (
                      <>
                        <Crown className="w-4 h-4 text-yellow-500 fill-yellow-500 flex-shrink-0" />
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-700 text-[10px] font-black uppercase tracking-wider border border-yellow-200">
                          Premium
                        </span>
                      </>
                    )}
                  </div>

                  <p className="text-xs text-slate-500">
                    {otherUser.isOnline ? (
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                        En ligne
                      </span>
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

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Heart className="w-8 h-8 text-rose-300 animate-pulse" />
              </div>
            ) : chatMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center max-w-xs">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-10 h-10 text-rose-400 fill-rose-400" />
                  </div>
                  <p className="text-slate-700 font-bold text-lg">
                    C&apos;est un match !
                  </p>
                  <p className="text-sm text-slate-500 mt-1">
                    Envoie le premier message à {otherUser?.firstName} 💬
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
                const showTime = isLastOfGroup;
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
                            ? `bg-gradient-to-r from-rose-500 to-purple-600 text-white ${
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
                        {renderMessageContent(msg.content, isMine)}
                      </div>

                      {showTime && (
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

            <div ref={messagesEndRef} />
          </div>

          {/* Emojis rapides */}
          {showEmojis && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
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

          {/* Message Input */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={`p-2.5 rounded-full transition ${
                  showEmojis
                    ? "bg-rose-100 text-rose-600"
                    : "text-slate-400 hover:bg-slate-100"
                }`}
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

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
                title="Envoyer une photo"
              >
                {uploadingImage ? (
                  <span className="text-xs">...</span>
                ) : (
                  <ImageIcon className="w-5 h-5" />
                )}
              </button>

              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Écris un message..."
                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-full focus:bg-white focus:ring-2 focus:ring-rose-200 transition text-sm outline-none"
              />

              <button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className={`w-11 h-11 rounded-full flex items-center justify-center text-white hover:shadow-lg hover:scale-105 transition disabled:opacity-30 disabled:hover:scale-100 ${
                  otherUser?.isPremium
                    ? "bg-gradient-to-r from-yellow-400 to-orange-500 shadow-yellow-500/30"
                    : "bg-gradient-to-r from-rose-500 to-purple-600"
                }`}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-br from-slate-50 to-rose-50/30">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-12 h-12 text-rose-400" />
            </div>
            <p className="text-xl font-bold text-slate-700">
              Sélectionne une conversation
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Choisis un match pour commencer à discuter 💬
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
