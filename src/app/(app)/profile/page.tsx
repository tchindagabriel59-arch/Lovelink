"use client";

import { useState, useRef } from "react";
import { useUser } from "../layout";
import {
  User,
  MapPin,
  Briefcase,
  Heart,
  Save,
  Camera,
  Sparkles,
} from "lucide-react";

const interestOptions = [
  "Voyages",
  "Musique",
  "Cinema",
  "Sport",
  "Cuisine",
  "Lecture",
  "Art",
  "Photographie",
  "Danse",
  "Jeux vidéo",
  "Nature",
  "Yoga",
  "Animaux",
  "Tech",
  "Mode",
  "Gastronomie",
];

const gradients = [
  "from-rose-400 to-pink-500",
  "from-purple-400 to-violet-500",
  "from-blue-400 to-cyan-500",
  "from-amber-400 to-orange-500",
];

export default function ProfilePage() {
  const { user, refreshUser } = useUser();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    bio: user?.bio || "",
    city: user?.city || "",
    country: user?.country || "",
    photoUrl: user?.photoUrl || "",
    interests: user?.interests || "",
    occupation: user?.occupation || "",
    lookingFor: user?.lookingFor || "relationship",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const toggleInterest = (interest: string) => {
    const current = form.interests
      ? form.interests.split(",").map((s) => s.trim())
      : [];
    const updated = current.includes(interest)
      ? current.filter((i) => i !== interest)
      : [...current, interest];
    setForm({ ...form, interests: updated.join(", ") });
    setSaved(false);
  };

  const selectedInterests = form.interests
    ? form.interests.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  // 🆕 UPLOAD DE PHOTO
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier la taille (max 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("La photo est trop grande. Maximum 5 MB.");
      return;
    }

    // Vérifier le type
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(`/api/upload?filename=${encodeURIComponent(file.name)}`, {
        method: "POST",
        body: file,
      });

      if (!response.ok) throw new Error("Erreur upload");

      const blob = await response.json();
      const newPhotoUrl = blob.url;

      // Mettre à jour le formulaire
      setForm({ ...form, photoUrl: newPhotoUrl });

      // Sauvegarder directement dans la base de données
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoUrl: newPhotoUrl }),
      });

      refreshUser();
      alert("✅ Photo mise à jour avec succès !");
    } catch (error) {
      alert("❌ Erreur lors de l'envoi de la photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSaved(true);
        refreshUser();
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  };

  function getAge(birthDate: string): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  const gradient = gradients[(user?.id ?? 0) % gradients.length];

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Mon <span className="gradient-text">Profil</span>
        </h1>
        <p className="mt-2 text-slate-600">
          Personnalisez votre profil pour attirer plus de matchs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Profile Preview */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-6">
            <div className={`h-32 bg-gradient-to-br ${gradient}`} />
            <div className="px-6 pb-6 -mt-12">
              <div className="relative inline-block">
                {/* PHOTO OU INITIALES */}
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt="Photo de profil"
                    className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div
                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg`}
                  >
                    {user?.firstName?.charAt(0)}
                    {user?.lastName?.charAt(0)}
                  </div>
                )}

                {/* BOUTON UPLOAD PHOTO */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-rose-500 hover:bg-rose-600 rounded-lg flex items-center justify-center text-white shadow disabled:opacity-50 transition"
                  title="Changer ma photo"
                >
                  {uploading ? (
                    <span className="text-xs">...</span>
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </div>

              {uploading && (
                <p className="mt-2 text-xs text-rose-500 font-medium">
                  📤 Envoi en cours...
                </p>
              )}

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </h3>
              {user?.birthDate && (
                <p className="text-sm text-slate-500">
                  {getAge(user.birthDate)} ans
                </p>
              )}

              {form.occupation && (
                <p className="mt-2 text-sm text-slate-600 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  {form.occupation}
                </p>
              )}
              {form.city && (
                <p className="text-sm text-slate-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {form.city}
                  {form.country ? `, ${form.country}` : ""}
                </p>
              )}

              {form.bio && (
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                  {form.bio}
                </p>
              )}

              {selectedInterests.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {selectedInterests.map((interest, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                À propos de moi
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={form.bio}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white resize-none"
                    placeholder="Parlez de vous, de vos passions, de ce que vous recherchez..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Profession
                  </label>
                  <input
                    type="text"
                    name="occupation"
                    value={form.occupation}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white"
                    placeholder="Ex: Designer, Ingénieur, Médecin..."
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Localisation
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Ville
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white"
                    placeholder="Paris"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Pays
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={form.country}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white"
                    placeholder="France"
                  />
                </div>
              </div>
            </div>

            {/* Looking For */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Je recherche
              </h3>
              <select
                name="lookingFor"
                value={form.lookingFor}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-rose-400 focus:ring-2 focus:ring-rose-100 transition bg-white"
              >
                <option value="relationship">Une relation sérieuse</option>
                <option value="friendship">De l&apos;amitié</option>
                <option value="casual">Des rencontres sans prise de tête</option>
                <option value="marriage">Le mariage</option>
              </select>
            </div>

            {/* Interests */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Centres d&apos;intérêt
              </h3>
              <div className="flex flex-wrap gap-2">
                {interestOptions.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedInterests.includes(interest)
                        ? "bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-md"
                        : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-600"
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>

            {/* Save */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all disabled:opacity-50"
              >
                {saving ? (
                  "Enregistrement..."
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Enregistrer
                  </>
                )}
              </button>
              {saved && (
                <span className="text-green-600 font-medium animate-fade-in">
                  ✓ Profil mis à jour !
                </span>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
