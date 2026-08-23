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
  Play,
  Pause,
  Trash2,
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
];

const quickEmojis = ["❤️", "😂", "🔥", "👍", "🥰", "😍", "😘", "🎉"];

// 🎵 LECTEUR AUDIO POUR LES MESSAGES VOCAUX
function AudioPlayer({ audioUrl, isMine }: { audioUrl: string; isMine: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => setDuration(audio.duration || 0);
    audio.ontimeupdate = () => setCurrentTime(audio.currentTime || 0);
    audio.onended = () => setIsPlaying(false);

    return () => {
      audio.pause();
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const formatAudioTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 py-1 px-1 min-w-[200px] ${isMine ? "text-white" : "text-slate-800"}`}>
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm transition ${
          isMine
            ? "bg-white text-rose-500 hover:bg-slate-100"
            : "bg-gradient-to-r from-rose-500 to-purple-600 text-white"
        }`}
      >
        {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
      </button>
      <div className="flex-1">
        <div className={`h-1.5 rounded-full overflow-hidden mb-1 ${isMine ? "bg-white/30" : "bg-slate-200"}`}>
          <div
            className={`h-full transition-all duration-100 ${isMine ? "bg-white" : "bg-rose-500"}`}
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className={`flex justify-between text-[10px] font-semibold ${isMine ? "text-white/80" : "text-slate-400"}`}>
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

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

  // 🎙️ ENREGISTREMENT VOCAL
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [sendingAudio, setSendingAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (shouldScrollRef.current && chatMessages.length > 0) {
      scrollToBottom();
      shouldScrollRef.current = false;
    }
  }, [chatMessages, scrollToBottom]);

  // 🎙️ DÉMARRER ENREGISTREMENT VOCAL (Support iOS + Android + PC)
  const startRecording = async () => {
    if (!user?.isPremium) {
      alert("🎙️ Les messages vocaux sont réservés aux membres Premium ! Passe Premium pour faire entendre ta voix.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        if (!MediaRecorder.isTypeSupported("audio/webm")) {
          if (MediaRecorder.isTypeSupported("audio/mp4")) {
            mimeType = "audio/mp4";
          } else {
            mimeType = "";
          }
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Accès au micro refusé ou non supporté.");
    }
  };

  // 🎙️ ENVOYER LE VOCAL (Converti direct en Base64 sans bug serveur !)
  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !selectedMatch) return;

    setSendingAudio(true);
    const recorder = mediaRecorderRef.current;

    recorder.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
      recorder.stream.getTracks().forEach((track) => track.stop());

      // Conversion en Base64 ultra fiable
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        try {
          const base64Audio = reader.result as string;

          const res = await fetch(`/api/messages/${selectedMatch}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: `[AUDIO]${base64Audio}` }),
          });

          if (!res.ok) {
            throw new Error("Erreur envoi message vocal");
          }

          const data = await res.json();
          setChatMessages((prev) => [...prev, data.message]);
          lastMessageIdRef.current = data.message.id;
          shouldScrollRef.current = true;
          fetchMatchesList();
        } catch (err) {
          console.error("Vocal send error:", err);
          alert("Erreur d'envoi du vocal. Recommence.");
        } finally {
          setIsRecording(false);
          setSendingAudio(false);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };
    };

    recorder.stop();
  };

  // 🎙️ ANNULER LE VOCAL
  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setRecordingTime(0);
    audioChunksRef.current = [];
  };

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedMatch || sending) return;

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

  function formatMessageTime(dateStr: string) {
    return new Date(dateStr).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const renderMessageContent = (content: string, isMine: boolean) => {
    if (content.startsWith("[IMAGE]")) {
      const imageUrl = content.replace("[IMAGE]", "");
      return (
        <div
          className="relative w-48 h-48 rounded-xl overflow-hidden cursor-pointer"
          onClick={() => window.open(imageUrl, "_blank")}
        >
          <Image src={imageUrl} alt="Photo" fill className="object-cover" sizes="192px" />
        </div>
      );
    }

    if (content.startsWith("[AUDIO]")) {
      const audioUrl = content.replace("[AUDIO]", "");
      return <AudioPlayer audioUrl={audioUrl} isMine={isMine} />;
    }

    const isEmojiOnly = /^\p{Emoji}+$/u.test(content) && content.length <= 4;
    return (
      <p className={`leading-relaxed ${isEmojiOnly ? "text-4xl" : "text-sm"}`}>
        {content}
      </p>
    );
  };

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

  return (
    <div className="flex h-[calc(100vh-64px)] lg:h-screen bg-[#F7F8FC]">
      {/* SIDEBAR CONVERSATIONS */}
      <div
        className={`${
          selectedMatch ? "hidden md:flex" : "flex"
        } flex-col w-full md:w-[380px] lg:w-[420px] border-r border-slate-100 bg-[#F7F8FC]`}
      >
        <div className="px-5 pt-5 pb-3">
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
            Messages
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">
            {matchesList.length} conversation{matchesList.length > 1 ? "s" : ""}
          </p>
        </div>

        {/* Card Vocaux Premium */}
        <div className="px-4 mb-3">
          {user?.isPremium ? (
            <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-purple-600 via-rose-500 to-pink-500 p-3.5 shadow-sm text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <Mic className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-black text-white">Messages vocaux activés</p>
                    <span className="text-[9px] font-black uppercase tracking-wider bg-white/30 text-white px-1.5 py-0.5 rounded-md">
                      👑 Premium
                    </span>
                  </div>
                  <p className="text-[11px] text-white/80 font-medium">
                    Clique sur le micro en bas pour parler ! ✨
                  </p>
                </div>
              </div>
            </div>
          ) : (
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
                    <p className="text-sm font-black text-amber-950">Messages vocaux</p>
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
          )}
        </div>

        {/* Filter Tabs */}
        <div className="px-4 mb-3 flex items-center gap-2 overflow-x-auto pb-1">
          {["all", "unread", "read"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab as FilterTab)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-bold transition ${
                filterTab === tab
                  ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200"
                  : "bg-white text-slate-500 border border-slate-100"
              }`}
            >
              {tab === "all" ? "Tous" : tab === "unread" ? "Non lus" : "Lus"}
            </button>
          ))}
        </div>

        {/* Search */}
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
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
            {filteredConversations.map((match) => {
              const lastMsgIsMine = match.lastMessage?.senderId === user?.id;
              const isPremium = match.user.isPremium;
              const isSelected = selectedMatch === match.matchId;

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
                  <Avatar
                    photoUrl={match.user.photoUrl}
                    firstName={match.user.firstName}
                    userId={match.user.id}
                    size={56}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-slate-900 truncate">
                        {match.user.firstName}
                      </p>
                      {match.lastMessage && (
                        <span className="text-[11px] text-slate-400">
                          {formatMessageTime(match.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>

                    {match.lastMessage && (
                      <p className="text-sm truncate text-slate-500 mt-0.5">
                        {lastMsgIsMine && "Vous: "}
                        {match.lastMessage.content.startsWith("[AUDIO]")
                          ? "🎙️ Message vocal"
                          : match.lastMessage.content.startsWith("[IMAGE]")
                          ? "📷 Photo"
                          : match.lastMessage.content}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ZONE DE CHAT */}
      {selectedMatch ? (
        <div className="flex-1 flex flex-col bg-[#F3F4F8] relative">
          {/* Header Chat */}
          <div className="relative z-10 px-3 py-3 bg-white/90 backdrop-blur border-b border-slate-100 flex items-center gap-3 shadow-sm">
            <button
              onClick={() => setSelectedMatch(null)}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            {otherUser && (
              <div className="flex items-center gap-3">
                <Avatar
                  photoUrl={otherUser.photoUrl}
                  firstName={otherUser.firstName}
                  userId={otherUser.id}
                  size={44}
                />
                <div>
                  <p className="font-bold text-slate-900">{otherUser.firstName}</p>
                  <p className="text-xs text-slate-500">
                    {otherUser.isOnline ? "En ligne" : "Hors ligne"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Chat Messages */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 space-y-2">
            {loadingMessages ? (
              <ChatSkeleton />
            ) : (
              chatMessages.map((msg) => {
                const isMine = msg.senderId === user?.id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"} mt-2`}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200/50"
                            : "bg-white text-slate-800 shadow-sm"
                        }`}
                      >
                        {renderMessageContent(msg.content, isMine)}
                      </div>
                      <span className={`text-[10px] text-slate-400 mt-1 block ${isMine ? "text-right" : "text-left"}`}>
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form / Enregistreur vocal */}
          <form
            onSubmit={handleSend}
            className="relative z-10 p-3 bg-white/95 backdrop-blur border-t border-slate-100"
          >
            {isRecording ? (
              /* ENREGISTREUR VOCAL ACTIF */
              <div className="flex items-center justify-between bg-rose-50 border border-rose-200 rounded-full px-4 py-2">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2 text-rose-500 hover:bg-rose-100 rounded-full transition"
                  title="Annuler vocal"
                >
                  <Trash2 className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                  <span className="text-sm font-bold text-rose-600 font-mono">
                    0:{recordingTime < 10 ? "0" : ""}{recordingTime}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={stopAndSendRecording}
                  disabled={sendingAudio}
                  className="px-4 py-2 bg-gradient-to-r from-rose-500 to-purple-600 text-white font-bold text-xs rounded-full shadow-md hover:scale-105 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {sendingAudio ? "Envoi..." : "Envoyer"}
                </button>
              </div>
            ) : (
              /* BARRE NORMALE DE MESSAGE */
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
                  <ImageIcon className="w-5 h-5" />
                </button>

                <div className="flex-1 flex items-center bg-slate-100 rounded-full px-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Écris ton message..."
                    className="flex-1 px-3 py-3 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmojis(!showEmojis)}
                    className="p-2 text-slate-400 hover:text-slate-600"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                </div>

                {/* 🎙️ BOUTON MICROPHONE VOCAL */}
                <button
                  type="button"
                  onClick={startRecording}
                  className={`p-3 rounded-full transition shadow-md ${
                    user?.isPremium
                      ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white hover:scale-105"
                      : "bg-slate-200 text-slate-400"
                  }`}
                  title="Enregistrer un message vocal"
                >
                  <Mic className="w-5 h-5" />
                </button>

                {newMessage.trim() && (
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-white bg-gradient-to-r from-rose-500 to-purple-600 hover:scale-105 transition shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </form>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-[#F3F4F8]">
          <div className="text-center">
            <Sparkles className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <p className="text-xl font-black text-slate-700">Sélectionne une conversation</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Chargement...</div>}>
      <MessagesContent />
    </Suspense>
  );
}
