"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShieldCheck,
  ArrowLeft,
  Upload,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Sparkles,
  Heart,
  Trophy,
  Loader2,
} from "lucide-react";

interface VerifStatus {
  isVerified: boolean;
  status: "pending" | "approved" | "rejected" | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  rejectedReason: string | null;
  hasProfilePhoto: boolean;
}

export default function VerificationPage() {
  const [status, setStatus] = useState<VerifStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  async function fetchStatus() {
    try {
      const res = await fetch("/api/verification");
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Photo trop grande. Max 5 MB.");
      return;
    }

    // Prévisualisation locale
    const reader = new FileReader();
    reader.onload = (ev) => setPreviewPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);

    setUploading(true);
    try {
      const res = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );

      if (!res.ok) throw new Error("Upload échoué");

      const data = await res.json();
      setSelectedPhoto(data.url);
    } catch {
      alert("❌ Erreur lors de l'envoi de la photo");
      setPreviewPhoto(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!selectedPhoto) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: selectedPhoto }),
      });

      if (res.ok) {
        const data = await res.json();
        alert("✅ " + data.message);
        setSelectedPhoto(null);
        setPreviewPhoto(null);
        fetchStatus();
      } else {
        const err = await res.json();
        alert("❌ " + (err.error || "Erreur"));
      }
    } catch {
      alert("❌ Erreur de connexion");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Annuler ta demande de vérification ?")) return;

    try {
      const res = await fetch("/api/verification", { method: "DELETE" });
      if (res.ok) {
        fetchStatus();
      }
    } catch {
      alert("Erreur");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <ShieldCheck className="w-12 h-12 text-blue-400 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <Link
        href="/profile"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-blue-500 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au profil
      </Link>

      {/* HEADER */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-400 via-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-blue-500/30">
          <ShieldCheck className="w-10 h-10 text-white fill-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Vérification du profil
        </h1>
        <p className="text-slate-600 max-w-md mx-auto">
          Obtiens le badge bleu ✅ pour prouver que tu es une vraie personne et augmenter la confiance
        </p>
      </div>

      {/* ============ CAS 1 : DÉJÀ VÉRIFIÉ ============ */}
      {status?.isVerified && (
        <div className="bg-gradient-to-br from-blue-500 via-cyan-500 to-blue-600 rounded-3xl p-8 text-white text-center shadow-2xl">
          <div className="w-24 h-24 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-14 h-14 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-black mb-2">Profil Vérifié ! ✨</h2>
          <p className="text-white/90 mb-6">
            Félicitations ! Ton profil affiche maintenant le badge bleu 💙
          </p>
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4 inline-block">
            <div className="flex items-center gap-2 justify-center">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">
                Vérifié depuis le{" "}
                {status.reviewedAt &&
                  new Date(status.reviewedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============ CAS 2 : EN ATTENTE ============ */}
      {!status?.isVerified && status?.status === "pending" && (
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl p-8 text-white text-center shadow-2xl">
          <div className="w-20 h-20 bg-white/20 backdrop-blur rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black mb-2">Demande en cours d'examen</h2>
          <p className="text-white/90 mb-4">
            Ta demande a été envoyée le{" "}
            {status.submittedAt &&
              new Date(status.submittedAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
          </p>
          <p className="text-white/80 text-sm mb-6">
            Notre équipe examine ta demande sous 24-48h. Tu recevras une notification dès qu&apos;elle sera traitée.
          </p>
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white/20 backdrop-blur hover:bg-white/30 text-white rounded-xl font-semibold text-sm transition"
          >
            Annuler la demande
          </button>
        </div>
      )}

      {/* ============ CAS 3 : REFUSÉ ============ */}
      {!status?.isVerified && status?.status === "rejected" && (
        <div className="bg-white rounded-3xl p-6 border-2 border-red-200 shadow-xl mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <XCircle className="w-6 h-6 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-2">Demande refusée</h3>
              {status.rejectedReason && (
                <p className="text-sm text-slate-600 mb-3 p-3 bg-red-50 rounded-xl border border-red-100">
                  <strong>Raison :</strong> {status.rejectedReason}
                </p>
              )}
              <p className="text-sm text-slate-600 mb-4">
                Tu peux soumettre une nouvelle demande en suivant bien les instructions ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ CAS 4 : FAIRE UNE DEMANDE (null ou rejected) ============ */}
      {!status?.isVerified && status?.status !== "pending" && (
        <>
          {/* AVANTAGES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <BenefitCard
              icon="💙"
              title="Badge bleu ✅"
              desc="Affiché à côté de ton nom partout"
            />
            <BenefitCard
              icon="🔒"
              title="Plus de confiance"
              desc="Les matchs savent que tu es réel(le)"
            />
            <BenefitCard
              icon="💕"
              title="+30% de matchs"
              desc="Les profils vérifiés sont priorisés"
            />
          </div>

          {/* SI PAS DE PHOTO DE PROFIL */}
          {!status?.hasProfilePhoto ? (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-900 mb-1">Photo de profil manquante</h3>
                <p className="text-sm text-amber-800 mb-3">
                  Tu dois d&apos;abord ajouter une photo de profil pour pouvoir demander la vérification.
                </p>
                <Link
                  href="/profile"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-semibold text-sm hover:bg-amber-600 transition"
                >
                  <Camera className="w-4 h-4" />
                  Ajouter une photo
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* INSTRUCTIONS */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg mb-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Comment ça marche ?
                </h3>
                <div className="space-y-4">
                  <Step
                    number={1}
                    title="Prends un selfie précis"
                    desc="Fais un signe de la main 👋 devant ton visage, bien visible et éclairé"
                  />
                  <Step
                    number={2}
                    title="Envoie ta photo"
                    desc="Elle sera comparée à tes photos de profil (jamais publiée)"
                  />
                  <Step
                    number={3}
                    title="On vérifie sous 24-48h"
                    desc="Notre équipe examine ta demande manuellement"
                  />
                  <Step
                    number={4}
                    title="Reçois ton badge bleu 💙"
                    desc="Il apparaît automatiquement sur ton profil"
                  />
                </div>
              </div>

              {/* UPLOAD */}
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" />
                  Envoie ta photo de vérification
                </h3>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />

                {!previewPhoto && !selectedPhoto ? (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full py-8 border-2 border-dashed border-blue-300 rounded-2xl hover:border-blue-500 hover:bg-blue-50 transition flex flex-col items-center gap-3 disabled:opacity-50"
                  >
                    <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                      {uploading ? (
                        <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-7 h-7 text-blue-500" />
                      )}
                    </div>
                    <div className="text-center">
                      <p className="font-bold text-slate-900">
                        {uploading ? "Envoi en cours..." : "Sélectionner une photo"}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        JPG, PNG • Max 5 MB
                      </p>
                    </div>
                  </button>
                ) : (
                  <div>
                    <div className="relative rounded-2xl overflow-hidden bg-slate-100 mb-4">
                      <Image
                        src={selectedPhoto || previewPhoto || ""}
                        alt="Ta photo de vérification"
                        width={600}
                        height={400}
                        className="w-full h-64 object-cover"
                        unoptimized
                      />
                      {uploading && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <Loader2 className="w-10 h-10 text-white animate-spin" />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setPreviewPhoto(null);
                          setSelectedPhoto(null);
                        }}
                        disabled={submitting}
                        className="flex-1 py-3 border-2 border-slate-200 hover:bg-slate-50 rounded-xl font-semibold text-slate-700 transition disabled:opacity-50"
                      >
                        Changer
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={submitting || uploading || !selectedPhoto}
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:shadow-lg text-white rounded-xl font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Envoi...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Envoyer la demande
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CONSIGNES IMPORTANTES */}
              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <h4 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Consignes importantes
                </h4>
                <ul className="space-y-2 text-sm text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Ton visage doit être <strong>bien visible</strong> et éclairé</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Fais un <strong>signe de la main</strong> 👋 à côté de ton visage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-500 font-bold">✓</span>
                    <span>Enlève lunettes de soleil, casquette, masque</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Pas de photo trouvée sur internet ou d&apos;une autre personne</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500 font-bold">✗</span>
                    <span>Pas de photo floue ou en basse résolution</span>
                  </li>
                </ul>
              </div>

              {/* PRIVACY */}
              <div className="mt-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                Ta photo de vérification ne sera <strong>jamais publiée</strong> sur ton profil
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-md text-center">
      <div className="text-4xl mb-2">{icon}</div>
      <p className="font-bold text-slate-900 text-sm mb-1">{title}</p>
      <p className="text-xs text-slate-500">{desc}</p>
    </div>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: number;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-md">
        {number}
      </div>
      <div>
        <p className="font-bold text-slate-900 text-sm">{title}</p>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
