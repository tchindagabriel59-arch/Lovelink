"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Clock,
  Zap,
  Gem,
  CreditCard,
  MessageCircle,
  Mail,
  XCircle,
  BadgeCheck,
} from "lucide-react";

interface PendingPayment {
  payment: {
    id: number;
    amount: number;
    currency: string;
    plan: string;
    billingPeriod: string;
    paymentMethod?: string | null;
    clientPhone?: string | null;
    status?: string;
    statusMessage?: string | null;
    createdAt: string;
    completedAt?: string | null;
  };
  user: {
    id: number;
    firstName: string;
    lastName: string;
    photoUrl: string | null;
    email: string | null;
    phone?: string | null;
  } | null;
}

type Tab = "pending" | "success";

export default function AdminPaymentsPage() {
  const [tab, setTab] = useState<Tab>("pending");
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [counts, setCounts] = useState({
    pending: 0,
    success: 0,
    successTotalXof: 0,
  });
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);
  const [relancingId, setRelancingId] = useState<number | null>(null);

  const fetchPayments = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/payments?tab=${tab}`);
      if (res.ok) {
        const data = await res.json();
        const list =
          tab === "pending"
            ? data.pending || data.items || []
            : data.validated || data.items || [];
        setPayments(list);
        if (data.counts) {
          setCounts({
            pending: data.counts.pending || 0,
            success: data.counts.success || 0,
            successTotalXof: data.counts.successTotalXof || 0,
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    setLoading(true);
    fetchPayments();
    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.hidden) return;
      fetchPayments();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchPayments]);

  const handleValidate = async (paymentId: number) => {
    if (!confirm("Voulez-vous vraiment valider ce paiement et activer le service ?"))
      return;

    setValidatingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("✅ Paiement validé avec succès ! Le service a été activé.");
        setPayments((prev) => prev.filter((p) => p.payment.id !== paymentId));
        setCounts((c) => ({
          ...c,
          pending: Math.max(0, c.pending - 1),
          success: c.success + 1,
        }));
      } else {
        alert(`❌ Erreur : ${data.error || "Impossible de valider."}`);
      }
    } catch {
      alert("❌ Erreur réseau.");
    } finally {
      setValidatingId(null);
    }
  };

  const handleRelance = async (item: PendingPayment) => {
    const name = item.user?.firstName || "Cher membre";
    const email = item.user?.email || "";
    const isRealEmail = email && !email.includes("@phone.lovelink237.com");

    let rawPhone = item.payment.clientPhone || item.user?.phone || "";
    if (!rawPhone && email.includes("@phone.lovelink237.com")) {
      const match = email.match(/phone_(\d+)/);
      if (match && match[1]) rawPhone = match[1];
    }

    if (rawPhone) {
      let cleanPhone = rawPhone.replace(/[\s\-\+\(\)]/g, "");
      if (cleanPhone.length === 9) cleanPhone = `237${cleanPhone}`;

      const message = `Bonjour ${name} 👋 !\nJ'ai vu que tu souhaitais activer ton ${item.payment.plan.toUpperCase()} sur LoveLink.\n\nAs-tu rencontré une difficulté pour effectuer le transfert MTN / Orange Money ? Je suis là si tu as besoin d'aide ! 😊`;
      const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
      return;
    }

    if (isRealEmail) {
      setRelancingId(item.payment.id);
      try {
        const res = await fetch("/api/admin/payments/relance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentId: item.payment.id }),
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          alert(
            data.emailSent
              ? `📧 E-mail de relance envoyé à ${name} (${email}) !`
              : `⚠️ ${data.message || "Relance envoyée (push)."}`
          );
        } else {
          alert(`❌ Erreur relance : ${data.error || "Envoi impossible"}`);
        }
      } catch {
        alert("Erreur réseau.");
      } finally {
        setRelancingId(null);
      }
      return;
    }

    const inputPhone = prompt(
      `Saisis le numéro WhatsApp de ${name} (ex: 651387914) :`
    );
    if (inputPhone) {
      let cleanPhone = inputPhone.replace(/[\s\-\+\(\)]/g, "");
      if (cleanPhone.length === 9) cleanPhone = `237${cleanPhone}`;
      const message = `Bonjour ${name} 👋 ! J'ai vu que tu souhaitais activer ton ${item.payment.plan.toUpperCase()} sur LoveLink. As-tu besoin d'aide pour le paiement ? 😊`;
      window.open(
        `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
  };

  const handleCancelPayment = async (paymentId: number) => {
    if (!confirm("Voulez-vous supprimer cette demande de paiement de la liste ?"))
      return;

    try {
      const res = await fetch(`/api/admin/payments?id=${paymentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setPayments((prev) => prev.filter((p) => p.payment.id !== paymentId));
        if (tab === "pending") {
          setCounts((c) => ({ ...c, pending: Math.max(0, c.pending - 1) }));
        }
      } else {
        alert("Erreur lors de la suppression.");
      }
    } catch {
      alert("Erreur réseau.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 text-white max-w-6xl mx-auto animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-rose-500" />
            Paiements
          </h1>
          <p className="text-slate-400 mt-1">
            En attente, validations manuelles CM et paiements finalisés.
          </p>
        </div>

        {counts.successTotalXof > 0 && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-xl">
            <p className="text-xs text-emerald-400/80">Total validé</p>
            <p className="text-lg font-black text-emerald-400">
              {counts.successTotalXof.toLocaleString("fr-FR")} F
            </p>
          </div>
        )}
      </div>

      {/* ONGLETS */}
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("pending")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
            tab === "pending"
              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
              : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600"
          }`}
        >
          <Clock className="w-4 h-4" />
          En attente
          <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-xs">
            {counts.pending}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setTab("success")}
          className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition ${
            tab === "success"
              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              : "bg-slate-800/50 text-slate-400 border border-slate-700 hover:border-slate-600"
          }`}
        >
          <BadgeCheck className="w-4 h-4" />
          Validés
          <span className="ml-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-xs">
            {counts.success}
          </span>
        </button>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-12 text-center shadow-xl">
          {tab === "pending" ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-200 mb-2">
                Aucun paiement en attente
              </h3>
              <p className="text-slate-500">Toutes les demandes ont été traitées !</p>
            </>
          ) : (
            <>
              <CreditCard className="w-16 h-16 text-slate-600 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold text-slate-200 mb-2">
                Aucun paiement validé pour l&apos;instant
              </h3>
              <p className="text-slate-500">
                Les paiements PayDunya et validations manuelles apparaîtront ici.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map((item) => {
            const { payment, user } = item;
            const isBoost = payment.plan.toLowerCase().includes("boost");
            const isPhoneUser = user?.email?.includes("@phone.lovelink237.com");
            const isValidated = tab === "success";
            const how =
              payment.statusMessage?.includes("manuellement") ||
              payment.statusMessage?.includes("admin")
                ? "Manuel admin"
                : payment.statusMessage?.includes("PayDunya")
                  ? "PayDunya"
                  : payment.statusMessage || "Validé";

            return (
              <div
                key={payment.id}
                className={`bg-[#1e293b] border rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg transition ${
                  isValidated
                    ? "border-emerald-500/20 hover:border-emerald-500/40"
                    : "border-[#334155] hover:border-slate-600"
                }`}
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                    {user?.photoUrl ? (
                      <Image
                        src={user.photoUrl}
                        alt=""
                        width={56}
                        height={56}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                        {user?.firstName?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">
                      {user?.firstName || "Utilisateur"} {user?.lastName || ""}
                    </h3>
                    <p className="text-xs text-slate-400">
                      ID: {user?.id} • {user?.email || "—"}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {isValidated && payment.completedAt
                        ? `Validé : ${new Date(payment.completedAt).toLocaleString("fr-FR")}`
                        : `Demande : ${new Date(payment.createdAt).toLocaleString("fr-FR")}`}
                    </p>
                    {isValidated && (
                      <p className="text-[11px] text-emerald-400/90 mt-0.5 font-medium">
                        ✓ {how}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex-1 w-full flex items-center gap-4 bg-[#0f172a] rounded-xl p-3 border border-[#334155]">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isBoost
                        ? "bg-purple-500/20 text-purple-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}
                  >
                    {isBoost ? <Zap size={20} /> : <Gem size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      {payment.plan} ({payment.billingPeriod})
                    </p>
                    <p className="text-xs text-slate-400">
                      Mode : {payment.paymentMethod || "—"}
                    </p>
                  </div>
                  <div className="ml-auto text-right">
                    <p
                      className={`text-xl font-black ${
                        isValidated ? "text-emerald-400" : "text-emerald-400"
                      }`}
                    >
                      {payment.amount} {payment.currency || "XOF"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto">
                  {isValidated ? (
                    <div className="px-4 py-3 bg-emerald-500/15 text-emerald-400 font-bold rounded-xl flex items-center gap-1.5 text-xs border border-emerald-500/30">
                      <CheckCircle2 size={16} />
                      Payé & activé
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRelance(item)}
                        disabled={relancingId === payment.id}
                        className={`px-4 py-3 font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md text-white ${
                          isPhoneUser
                            ? "bg-green-600 hover:bg-green-500"
                            : "bg-blue-600 hover:bg-blue-500"
                        }`}
                        title={
                          isPhoneUser
                            ? "Relancer sur WhatsApp"
                            : "Envoyer un e-mail de relance + Push"
                        }
                      >
                        {relancingId === payment.id ? (
                          "Envoi..."
                        ) : isPhoneUser ? (
                          <>
                            <MessageCircle size={16} />
                            WhatsApp
                          </>
                        ) : (
                          <>
                            <Mail size={16} />
                            Relancer Mail
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleValidate(payment.id)}
                        disabled={validatingId === payment.id}
                        className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-xs shadow-md shadow-emerald-500/20 disabled:opacity-50"
                      >
                        <CheckCircle2 size={16} />
                        {validatingId === payment.id ? "Validation..." : "Valider"}
                      </button>

                      <button
                        onClick={() => handleCancelPayment(payment.id)}
                        className="p-3 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 rounded-xl transition"
                        title="Supprimer cette demande"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
