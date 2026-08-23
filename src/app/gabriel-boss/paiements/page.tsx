"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Clock, Zap, Gem, ShieldAlert, CreditCard } from "lucide-react";

interface PendingPayment {
  payment: {
    id: number;
    amount: number;
    currency: string;
    plan: string;
    billingPeriod: string;
    paymentMethod: string;
    createdAt: string;
  };
  user: {
    id: number;
    firstName: string;
    photoUrl: string | null;
    phone: string | null;
  } | null;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingId, setValidatingId] = useState<number | null>(null);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      if (res.ok) {
        const data = await res.json();
        setPayments(data.pending || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
    // Rafraîchir toutes les 30s
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleValidate = async (paymentId: number) => {
    if (!confirm("Voulez-vous vraiment valider ce paiement et activer le service pour l'utilisateur ?")) return;
    
    setValidatingId(paymentId);
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentId }),
      });

      if (res.ok) {
        alert("✅ Paiement validé avec succès ! Le service a été activé.");
        setPayments((prev) => prev.filter((p) => p.payment.id !== paymentId));
      } else {
        alert("❌ Erreur lors de la validation.");
      }
    } catch (err) {
      alert("❌ Erreur réseau.");
    } finally {
      setValidatingId(null);
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-3">
            <CreditCard className="w-8 h-8 text-rose-500" />
            Paiements en attente
          </h1>
          <p className="text-slate-400 mt-1">
            Validez les transferts MTN / Orange Money manuellement après réception sur WhatsApp.
          </p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-xl flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" />
          <span className="font-bold text-amber-500">{payments.length} en attente</span>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-3xl p-12 text-center shadow-xl">
          <ShieldAlert className="w-16 h-16 text-emerald-500 mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-slate-200 mb-2">Aucun paiement en attente</h3>
          <p className="text-slate-500">Tous les services ont été validés ! Allez prendre un café ☕</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {payments.map(({ payment, user }) => {
            const isBoost = payment.plan === "boost";
            return (
              <div
                key={payment.id}
                className="bg-[#1e293b] border border-[#334155] rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg hover:border-slate-600 transition"
              >
                {/* User Info */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                    {user?.photoUrl ? (
                      <Image src={user.photoUrl} alt="" width={56} height={56} className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-bold text-slate-400">
                        {user?.firstName?.charAt(0) || "?"}
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-100">{user?.firstName || "Utilisateur supprimé"}</h3>
                    <p className="text-sm text-slate-400">ID: {user?.id} • Tel: {user?.phone || "Non renseigné"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Demande créée le {new Date(payment.createdAt).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </div>

                {/* Commande Info */}
                <div className="flex-1 w-full flex items-center gap-4 bg-[#0f172a] rounded-xl p-3 border border-[#334155]">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${isBoost ? "bg-purple-500/20 text-purple-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {isBoost ? <Zap size={20} /> : <Gem size={20} />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wider">
                      {payment.plan} ({payment.billingPeriod})
                    </p>
                    <p className="text-xs text-slate-400">Mode : {payment.paymentMethod === "manual_cm" ? "MTN/Orange CM" : payment.paymentMethod}</p>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xl font-black text-emerald-400">{payment.amount} {payment.currency}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto">
                  <button
                    onClick={() => handleValidate(payment.id)}
                    disabled={validatingId === payment.id}
                    className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {validatingId === payment.id ? (
                      "Validation..."
                    ) : (
                      <>
                        <CheckCircle2 size={20} />
                        Valider
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
