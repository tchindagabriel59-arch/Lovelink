"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Ban, ArrowLeft, MapPin, UserX, Check } from "lucide-react";

interface BlockedUser {
  blockId: number;
  createdAt: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    city: string | null;
  };
}

export default function BlockedPage() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlocked();
  }, []);

  async function fetchBlocked() {
    try {
      const res = await fetch("/api/blocks");
      if (res.ok) {
        const data = await res.json();
        setBlocked(data.blocked || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function unblock(userId: number) {
    if (!confirm("Débloquer cet utilisateur ? Il pourra à nouveau voir votre profil.")) return;

    try {
      const res = await fetch(`/api/blocks?userId=${userId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBlocked((prev) => prev.filter((b) => b.user.id !== userId));
      }
    } catch {
      alert("Erreur");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Ban className="w-12 h-12 text-slate-400 animate-pulse mx-auto" />
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <Link
          href="/preferences"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux préférences
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Ban className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Personnes <span className="gradient-text">bloquées</span>
            </h1>
            <p className="mt-1 text-slate-600">
              {blocked.length} {blocked.length > 1 ? "personnes bloquées" : "personne bloquée"}
            </p>
          </div>
        </div>
      </div>

      {blocked.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Aucun utilisateur bloqué
          </h2>
          <p className="text-slate-600 mb-6">
            Tu peux bloquer un utilisateur depuis son profil dans la découverte.
          </p>
          <Link
            href="/discover"
            className="inline-block px-6 py-3 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition"
          >
            Découvrir des profils →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4">
            <p className="text-sm text-amber-800">
              💡 <strong>Info :</strong> Les personnes bloquées ne peuvent plus voir ton profil,
              ni te contacter. Tu ne verras plus non plus leur profil.
            </p>
          </div>

          {blocked.map((item) => (
            <div
              key={item.blockId}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md transition"
            >
              {/* Photo */}
              <div className="relative flex-shrink-0">
                {item.user.photoUrl ? (
                  <img
                    src={item.user.photoUrl}
                    alt={item.user.firstName}
                    className="w-14 h-14 rounded-xl object-cover grayscale"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-white font-bold">
                    {item.user.firstName.charAt(0)}
                    {item.user.lastName.charAt(0)}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Ban className="w-3 h-3 text-white" />
                </div>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-800">
                  {item.user.firstName} {item.user.lastName}
                </p>
                {item.user.city && (
                  <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {item.user.city}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1">
                  Bloqué le {new Date(item.createdAt).toLocaleDateString("fr-FR")}
                </p>
              </div>

              {/* Bouton débloquer */}
              <button
                onClick={() => unblock(item.user.id)}
                className="px-4 py-2 bg-slate-100 hover:bg-green-500 hover:text-white rounded-lg text-sm font-medium text-slate-700 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                Débloquer
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
