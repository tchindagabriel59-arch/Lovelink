"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings,
  Save,
  ArrowLeft,
  Users,
  Calendar,
  Target,
  MapPin,
  Loader2,
} from "lucide-react";

const distanceOptions = [
  { value: 5, label: "5 km" },
  { value: 10, label: "10 km" },
  { value: 25, label: "25 km" },
  { value: 50, label: "50 km" },
  { value: 100, label: "100 km" },
  { value: 500, label: "500 km" },
  { value: 999999, label: "🌍 Monde entier" },
];

export default function PreferencesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [locating, setLocating] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [locationMsg, setLocationMsg] = useState("");
  const [prefs, setPrefs] = useState({
    gender: "all",
    ageMin: 18,
    ageMax: 99,
    lookingFor: "all",
    maxDistance: 999999,
  });

  useEffect(() => {
    fetchPreferences();
  }, []);

  async function fetchPreferences() {
    try {
      const res = await fetch("/api/preferences");
      if (res.ok) {
        const data = await res.json();
        setPrefs({
          gender: data.preferences.gender,
          ageMin: data.preferences.ageMin,
          ageMax: data.preferences.ageMax,
          lookingFor: data.preferences.lookingFor,
          maxDistance: data.preferences.maxDistance,
        });
        setHasLocation(data.preferences.hasLocation);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function activateLocation() {
    if (!navigator.geolocation) {
      alert("Ton navigateur ne supporte pas la géolocalisation");
      return;
    }

    setLocating(true);
    setLocationMsg("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            }),
          });

          if (res.ok) {
            setHasLocation(true);
            setLocationMsg("✅ Localisation activée !");
            setTimeout(() => setLocationMsg(""), 3000);
          }
        } catch {
          setLocationMsg("❌ Erreur lors de l'envoi");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationMsg("❌ Tu as refusé l'accès à ta position");
        } else {
          setLocationMsg("❌ Impossible d'obtenir ta position");
        }
      }
    );
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
      }
    } catch {
      alert("Erreur");
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
        {/* 📍 LOCALISATION */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-500" />
            Ma localisation
          </h3>
          {hasLocation ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-emerald-700 font-medium flex items-center gap-2">
                ✅ Ta position est activée
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Tu peux maintenant filtrer les profils par distance.
              </p>
              <button
                onClick={activateLocation}
                disabled={locating}
                className="mt-3 text-sm text-emerald-600 hover:text-emerald-700 underline"
              >
                {locating ? "Mise à jour..." : "🔄 Actualiser ma position"}
              </button>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-medium">
                📍 Active ta position pour trouver des profils près de toi
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Ta position n&apos;est jamais partagée aux autres utilisateurs, seulement la distance qui vous sépare.
              </p>
              <button
                onClick={activateLocation}
                disabled={locating}
                className="mt-3 flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {locating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Localisation en cours...
                  </>
                ) : (
                  <>
                    <MapPin className="w-4 h-4" />
                    Activer ma localisation
                  </>
                )}
              </button>
            </div>
          )}
          {locationMsg && (
            <p className="mt-3 text-sm font-medium">{locationMsg}</p>
          )}
        </div>

        {/* Distance max (visible seulement si localisation activée) */}
        {hasLocation && (
          <div className="bg-white rounded-2xl p-6 border border-slate-100">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-500" />
              Distance maximum
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {distanceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setPrefs({ ...prefs, maxDistance: option.value })}
                  className={`p-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    prefs.maxDistance === option.value
                      ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent shadow-lg"
                      : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

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
                Minimum : <strong>{prefs.ageMin} ans</strong>
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
                Maximum : <strong>{prefs.ageMax} ans</strong>
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
          <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-center">
            <p className="text-green-700 font-medium">
              ✅ Préférences enregistrées !
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
