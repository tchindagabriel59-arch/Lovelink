"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Settings, Save, ArrowLeft, Users, Heart, Calendar, Target } from "lucide-react";

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [prefs, setPrefs] = useState({
    gender: "all",
    ageMin: 18,
    ageMax: 99,
    lookingFor: "all",
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs(data.preferences);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const data = await res.json();
        alert("❌ " + (data.error || "Erreur"));
      }
    } catch {
      alert("Erreur de connexion");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <Settings className="w-12 h-12 text-rose-400 animate-spin mx-auto" />
          <p className="mt-4 text-slate-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/discover"
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la découverte
        </Link>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl flex items-center justify-center">
            <Settings className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Mes <span className="gradient-text">préférences</span>
            </h1>
            <p className="mt-1 text-slate-600">
              Personnalise les profils que tu veux voir
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Genre recherché */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-500" />
            Je souhaite rencontrer
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { value: "all", label: "🌍 Tous", color: "from-purple-500 to-pink-500" },
              { value: "male", label: "👨 Hommes", color: "from-blue-500 to-cyan-500" },
              { value: "female", label: "👩 Femmes", color: "from-rose-500 to-pink-500" },
              { value: "non_binary", label: "🌈 Non-binaires", color: "from-purple-500 to-violet-500" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPrefs({ ...prefs, gender: option.value })}
                className={`p-4 rounded-xl border-2 font-semibold transition-all ${
                  prefs.gender === option.value
                    ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg scale-105`
                    : "bg-white text-slate-700 border-slate-200 hover:border-rose-300"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tranche d'âge */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-500" />
            Tranche d&apos;âge recherchée
          </h3>
          <div className="text-center mb-6">
            <p className="text-3xl font-bold gradient-text">
              {prefs.ageMin} - {prefs.ageMax} ans
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Âge minimum : <strong>{prefs.ageMin} ans</strong>
              </label>
              <input
                type="range"
                min="18"
                max="99"
                value={prefs.ageMin}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPrefs({
                    ...prefs,
                    ageMin: val,
                    ageMax: val > prefs.ageMax ? val : prefs.ageMax,
                  });
                }}
                className="w-full accent-rose-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Âge maximum : <strong>{prefs.ageMax} ans</strong>
              </label>
              <input
                type="range"
                min="18"
                max="99"
                value={prefs.ageMax}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setPrefs({
                    ...prefs,
                    ageMax: val,
                    ageMin: val < prefs.ageMin ? val : prefs.ageMin,
                  });
                }}
                className="w-full accent-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Type de relation */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" />
            Je recherche des personnes qui veulent
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { value: "all", label: "🌟 Peu importe", desc: "Toutes intentions" },
              { value: "relationship", label: "💕 Une relation", desc: "Sérieux et durable" },
              { value: "friendship", label: "👋 De l'amitié", desc: "Rencontres amicales" },
              { value: "casual", label: "😊 Sans prise de tête", desc: "Rencontres légères" },
              { value: "marriage", label: "💍 Le mariage", desc: "Long terme et engagé" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setPrefs({ ...prefs, lookingFor: option.value })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  prefs.lookingFor === option.value
                    ? "bg-gradient-to-r from-rose-50 to-purple-50 border-rose-400 shadow-md"
                    : "bg-white border-slate-200 hover:border-rose-300"
                }`}
              >
                <p className="font-bold text-slate-800">{option.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Boutons */}
        <div className="flex items-center gap-4 sticky bottom-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:shadow-rose-500/25 transition-all disabled:opacity-50"
          >
            {saving ? (
              "Enregistrement..."
            ) : (
              <>
                <Save className="w-5 h-5" />
                Enregistrer mes préférences
              </>
            )}
          </button>
          <Link
            href="/discover"
            className="px-6 py-4 bg-white text-slate-700 rounded-xl font-semibold border border-slate-200 hover:border-rose-300 transition"
          >
            Découvrir →
          </Link>
        </div>

        {saved && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center animate-fade-in">
            <p className="text-green-700 font-medium">
              ✅ Préférences enregistrées ! Découvre maintenant les profils qui te correspondent 💕
            </p>
          </div>
        )}

        <p className="text-center text-sm text-slate-500 mt-4">
          💡 Astuce : Élargis tes critères pour voir plus de profils !
        </p>
      </div>
    </div>
  );
}
