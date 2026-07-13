"use client";

import { useState, useRef, useEffect } from "react";
import { useUser } from "../layout";
import PushNotifButton from "../../components/PushNotifButton";
import {
  User,
  MapPin,
  Briefcase,
  Heart,
  Save,
  Camera,
  Sparkles,
  Plus,
  X,
  ImageIcon,
  MessageSquareQuote,
} from "lucide-react";

const interestOptions = [
  "Voyages", "Musique", "Cinema", "Sport", "Cuisine", "Lecture",
  "Art", "Photographie", "Danse", "Jeux vidéo", "Nature", "Yoga",
  "Animaux", "Tech", "Mode", "Gastronomie",
];

const promptQuestions = [
  "Ma passion secrète est...",
  "Le meilleur moment de ma journée...",
  "On ne devinerait jamais que...",
  "Je cherche quelqu'un qui...",
  "Mon rêve le plus fou...",
  "Ce qui me rend heureux/se...",
  "Ma qualité principale est...",
  "Mon plat préféré...",
  "Ma destination de rêve...",
  "Une chose que j'adore faire le week-end...",
  "Mon film/série préféré...",
  "Si j'avais un super-pouvoir...",
  "Ma citation préférée...",
  "Mon dernier fou rire c'était...",
  "Ce que je recherche vraiment...",
  "Mon plus grand accomplissement...",
  "Une chose que je ne peux pas vivre sans...",
  "Ce qui me fait sourire à coup sûr...",
  "Mon endroit préféré au monde...",
  "Ma boisson favorite...",
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
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const profilePhotoRef = useRef<HTMLInputElement>(null);
  const coverPhotoRef = useRef<HTMLInputElement>(null);
  const photo1Ref = useRef<HTMLInputElement>(null);
  const photo2Ref = useRef<HTMLInputElement>(null);
  const photo3Ref = useRef<HTMLInputElement>(null);
  const photo4Ref = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    bio: "",
    city: "",
    country: "",
    photoUrl: "",
    coverPhotoUrl: "",
    photo1Url: "",
    photo2Url: "",
    photo3Url: "",
    photo4Url: "",
    interests: "",
    occupation: "",
    lookingFor: "relationship",
    prompt1Question: "",
    prompt1Answer: "",
    prompt2Question: "",
    prompt2Answer: "",
    prompt3Question: "",
    prompt3Answer: "",
  });

  // 🔄 Recharger les données du formulaire quand user change
  useEffect(() => {
    if (user) {
      setForm({
        bio: user.bio || "",
        city: user.city || "",
        country: user.country || "",
        photoUrl: user.photoUrl || "",
        coverPhotoUrl: (user as any)?.coverPhotoUrl || "",
        photo1Url: (user as any)?.photo1Url || "",
        photo2Url: (user as any)?.photo2Url || "",
        photo3Url: (user as any)?.photo3Url || "",
        photo4Url: (user as any)?.photo4Url || "",
        interests: user.interests || "",
        occupation: user.occupation || "",
        lookingFor: user.lookingFor || "relationship",
        prompt1Question: (user as any)?.prompt1Question || "",
        prompt1Answer: (user as any)?.prompt1Answer || "",
        prompt2Question: (user as any)?.prompt2Question || "",
        prompt2Answer: (user as any)?.prompt2Answer || "",
        prompt3Question: (user as any)?.prompt3Question || "",
        prompt3Answer: (user as any)?.prompt3Answer || "",
      });
    }
  }, [user]);

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

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("La photo est trop grande. Maximum 5 MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image.");
      return;
    }

    setUploadingField(fieldName);
    try {
      const response = await fetch(
        `/api/upload?filename=${encodeURIComponent(file.name)}`,
        {
          method: "POST",
          body: file,
        }
      );

      if (!response.ok) throw new Error("Erreur upload");

      const blob = await response.json();
      const newUrl = blob.url;

      const updatedForm = { ...form, [fieldName]: newUrl };
      setForm(updatedForm);

      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedForm),
      });

      refreshUser();
    } catch (error) {
      alert("❌ Erreur lors de l'envoi de la photo");
    } finally {
      setUploadingField(null);
    }
  };

  const removePhoto = async (fieldName: string) => {
    if (!confirm("Supprimer cette photo ?")) return;
    const updatedForm = { ...form, [fieldName]: "" };
    setForm(updatedForm);
    await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedForm),
    });
    refreshUser();
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
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  const gradient = gradients[(user?.id ?? 0) % gradients.length];

  const PhotoBox = ({
    url,
    fieldName,
    inputRef,
    label,
  }: {
    url: string;
    fieldName: string;
    inputRef: React.RefObject<HTMLInputElement | null>;
    label: string;
  }) => (
    <div className="relative aspect-square bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-rose-400 transition group">
      <input
        type="file"
        ref={inputRef}
        onChange={(e) => handlePhotoUpload(e, fieldName)}
        accept="image/*"
        className="hidden"
      />
      {url ? (
        <>
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="p-2 bg-white rounded-full hover:bg-rose-50"
              title="Changer"
            >
              <Camera className="w-4 h-4 text-slate-700" />
            </button>
            <button
              type="button"
              onClick={() => removePhoto(fieldName)}
              className="p-2 bg-white rounded-full hover:bg-red-50"
              title="Supprimer"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploadingField === fieldName}
          className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-rose-500 transition"
        >
          {uploadingField === fieldName ? (
            <span className="text-xs">Envoi...</span>
          ) : (
            <>
              <Plus className="w-8 h-8" />
              <span className="text-xs font-medium">{label}</span>
            </>
          )}
        </button>
      )}
    </div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Mon <span className="gradient-text">Profil</span>
        </h1>
        <p className="mt-2 text-slate-600">
          Personnalisez votre profil pour attirer plus de matchs
        </p>
      </div>

      {/* SECTION PHOTOS */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 mb-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-rose-500" />
          Mes photos
        </h3>

        {/* Photo de couverture */}
        <div className="mb-6">
          <p className="text-sm font-medium text-slate-700 mb-2">Photo de couverture</p>
          <div className="relative h-40 lg:h-56 bg-slate-100 rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 hover:border-rose-400 transition group">
            <input
              type="file"
              ref={coverPhotoRef}
              onChange={(e) => handlePhotoUpload(e, "coverPhotoUrl")}
              accept="image/*"
              className="hidden"
            />
            {form.coverPhotoUrl ? (
              <>
                <img
                  src={form.coverPhotoUrl}
                  alt="Couverture"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => coverPhotoRef.current?.click()}
                    className="px-4 py-2 bg-white rounded-full font-medium text-sm hover:bg-rose-50"
                  >
                    <Camera className="w-4 h-4 inline mr-1" />
                    Changer
                  </button>
                  <button
                    type="button"
                    onClick={() => removePhoto("coverPhotoUrl")}
                    className="px-4 py-2 bg-white rounded-full font-medium text-sm text-red-600 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 inline mr-1" />
                    Supprimer
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={() => coverPhotoRef.current?.click()}
                disabled={uploadingField === "coverPhotoUrl"}
                className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-rose-500 transition"
              >
                {uploadingField === "coverPhotoUrl" ? (
                  <span>Envoi en cours...</span>
                ) : (
                  <>
                    <Plus className="w-10 h-10" />
                    <span className="font-medium">Ajouter une photo de couverture</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs font-medium text-slate-700 mb-2">Photo principale</p>
            <PhotoBox
              url={form.photoUrl}
              fieldName="photoUrl"
              inputRef={profilePhotoRef}
              label="Photo principale"
            />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Photo 2</p>
            <PhotoBox url={form.photo1Url} fieldName="photo1Url" inputRef={photo1Ref} label="Photo 2" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Photo 3</p>
            <PhotoBox url={form.photo2Url} fieldName="photo2Url" inputRef={photo2Ref} label="Photo 3" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Photo 4</p>
            <PhotoBox url={form.photo3Url} fieldName="photo3Url" inputRef={photo3Ref} label="Photo 4" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-700 mb-2">Photo 5</p>
            <PhotoBox url={form.photo4Url} fieldName="photo4Url" inputRef={photo4Ref} label="Photo 5" />
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          💡 Astuce : Ajoutez plusieurs photos pour augmenter vos chances de match !
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Aperçu profil */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden sticky top-6">
            <div className={`h-32 relative bg-gradient-to-br ${gradient}`}>
              {form.coverPhotoUrl && (
                <img
                  src={form.coverPhotoUrl}
                  alt="Couverture"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="px-6 pb-6 -mt-12">
              <div className="relative inline-block">
                {form.photoUrl ? (
                  <img
                    src={form.photoUrl}
                    alt="Profil"
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
              </div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                {user?.firstName} {user?.lastName}
              </h3>
              {user?.birthDate && (
                <p className="text-sm text-slate-500">{getAge(user.birthDate)} ans</p>
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
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{form.bio}</p>
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

        {/* Formulaire */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* À propos */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-rose-500" />
                À propos de moi
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Bio</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Profession</label>
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

            {/* Localisation */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Localisation
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Ville</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Pays</label>
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

            {/* Recherche */}
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

            {/* PROMPTS style Hinge */}
            <div className="bg-white rounded-2xl p-6 border border-slate-100">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <MessageSquareQuote className="w-5 h-5 text-purple-500" />
                Mes réponses
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                💡 Choisis jusqu&apos;à 3 questions et réponds-y pour te démarquer !
              </p>

              <div className="space-y-4">
                {[1, 2, 3].map((num) => {
                  const questionKey = `prompt${num}Question` as keyof typeof form;
                  const answerKey = `prompt${num}Answer` as keyof typeof form;
                  const question = form[questionKey] as string;
                  const answer = form[answerKey] as string;

                  return (
                    <div
                      key={num}
                      className="p-4 bg-gradient-to-br from-purple-50 to-rose-50 rounded-xl border border-purple-100"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">
                          Question {num}
                        </span>
                        {question && (
                          <button
                            type="button"
                            onClick={() => {
                              setForm({
                                ...form,
                                [questionKey]: "",
                                [answerKey]: "",
                              });
                              setSaved(false);
                            }}
                            className="text-xs text-red-500 hover:text-red-600 font-medium"
                          >
                            Retirer
                          </button>
                        )}
                      </div>

                      <select
                        value={question}
                        onChange={(e) => {
                          setForm({ ...form, [questionKey]: e.target.value });
                          setSaved(false);
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition bg-white mb-3 font-medium"
                      >
                        <option value="">✨ Choisis une question...</option>
                        {promptQuestions.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>

                      {question && (
                        <>
                          <textarea
                            value={answer}
                            onChange={(e) => {
                              setForm({ ...form, [answerKey]: e.target.value });
                              setSaved(false);
                            }}
                            rows={2}
                            maxLength={200}
                            placeholder="Ta réponse..."
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 transition bg-white resize-none"
                          />
                          <p className="text-xs text-slate-400 text-right mt-1">
                            {answer.length}/200
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 🔔 NOTIFICATIONS PUSH */}
            <PushNotifButton />

            {/* Intérêts */}
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

            {/* Boutons */}
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
