import Link from "next/link";
import Image from "next/image";
import { Heart, Shield, MessageCircle, Sparkles, Users, Star, ArrowRight, ChevronRight } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
            <span className="text-2xl font-bold gradient-text">LoveLink</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-slate-600 hover:text-rose-500 transition font-medium">Fonctionnalités</a>
            <a href="#how-it-works" className="text-slate-600 hover:text-rose-500 transition font-medium">Comment ça marche</a>
            <a href="#testimonials" className="text-slate-600 hover:text-rose-500 transition font-medium">Témoignages</a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-5 py-2.5 text-slate-700 hover:text-rose-500 transition font-medium"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-500/25 transition-all duration-300 hover:-translate-y-0.5"
            >
              S&apos;inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50" />
        <div className="absolute top-20 right-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-purple-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6 pt-24 pb-16 grid lg:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" />
              <span>#1 Plateforme de rencontre en France</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Trouvez votre
              <span className="block gradient-text">âme sœur</span>
            </h1>
            <p className="mt-6 text-xl text-slate-600 leading-relaxed max-w-lg">
              Rejoignez des milliers de célibataires qui ont trouvé l&apos;amour sur LoveLink.
              Des rencontres authentiques, sécurisées et personnalisées.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1"
              >
                Commencer gratuitement
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-slate-700 rounded-full text-lg font-semibold border border-slate-200 hover:border-rose-300 transition-all duration-300"
              >
                En savoir plus
              </a>
            </div>
            <div className="mt-10 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-rose-300 to-purple-400 flex items-center justify-center text-white text-xs font-bold"
                  >
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">
                  <span className="font-semibold text-slate-700">+50 000</span> membres actifs
                </p>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative w-full max-w-md mx-auto">
              <div className="absolute -top-4 -right-4 w-full h-full bg-gradient-to-br from-rose-400 to-purple-500 rounded-3xl rotate-3" />
              <Image
                src="/images/couple1.jpg"
                alt="Couple heureux"
                width={500}
                height={600}
                className="relative rounded-3xl object-cover w-full h-[500px] shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 glass-card rounded-2xl p-4 shadow-lg animate-float">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center">
                    <Heart className="w-6 h-6 text-white fill-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">Nouveau match !</p>
                    <p className="text-sm text-slate-500">Il y a 2 minutes</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-3 -left-8 glass-card rounded-2xl p-3 shadow-lg">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-purple-500" />
                  <span className="text-sm font-medium text-slate-700">12 messages</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Pourquoi choisir <span className="gradient-text">LoveLink</span> ?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Nous combinons technologie avancée et touche humaine pour vous offrir
              la meilleure expérience de rencontre en ligne.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="w-8 h-8" />,
                title: "Sécurité maximale",
                description:
                  "Tous les profils sont vérifiés. Vos données sont protégées et chiffrées.",
                gradient: "from-blue-500 to-cyan-500",
                bg: "bg-blue-50",
              },
              {
                icon: <Sparkles className="w-8 h-8" />,
                title: "Algorithme intelligent",
                description:
                  "Notre IA analyse vos préférences pour vous proposer les profils les plus compatibles.",
                gradient: "from-rose-500 to-pink-500",
                bg: "bg-rose-50",
              },
              {
                icon: <MessageCircle className="w-8 h-8" />,
                title: "Chat en temps réel",
                description:
                  "Échangez instantanément avec vos matchs grâce à notre messagerie intégrée.",
                gradient: "from-purple-500 to-violet-500",
                bg: "bg-purple-50",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group relative p-8 rounded-3xl border border-slate-100 hover:border-rose-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-2"
              >
                <div
                  className={`w-16 h-16 ${feature.bg} rounded-2xl flex items-center justify-center mb-6`}
                >
                  <div className={`bg-gradient-to-r ${feature.gradient} bg-clip-text`}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-rose-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Comment ça <span className="gradient-text">marche</span> ?
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Trouvez l&apos;amour en 3 étapes simples
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Créez votre profil",
                description:
                  "Inscrivez-vous gratuitement et créez un profil attrayant avec vos photos et vos centres d'intérêt.",
              },
              {
                step: "02",
                title: "Découvrez des profils",
                description:
                  "Parcourez les profils qui correspondent à vos préférences et likez ceux qui vous plaisent.",
              },
              {
                step: "03",
                title: "Connectez-vous",
                description:
                  "Quand le sentiment est réciproque, c'est un match ! Commencez à discuter.",
              },
            ].map((item, i) => (
              <div key={i} className="relative text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-rose-500 to-purple-600 text-white text-2xl font-bold mb-6">
                  {item.step}
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-[80%]">
                    <ChevronRight className="w-6 h-6 text-rose-300" />
                  </div>
                )}
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-600 max-w-xs mx-auto">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-gradient-to-r from-rose-500 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { number: "50K+", label: "Membres actifs" },
              { number: "12K+", label: "Matchs par jour" },
              { number: "5K+", label: "Couples formés" },
              { number: "98%", label: "Taux de satisfaction" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="text-4xl md:text-5xl font-bold">{stat.number}</p>
                <p className="mt-2 text-rose-100 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-bold">
              Ils ont trouvé <span className="gradient-text">l&apos;amour</span>
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              Des milliers de couples se sont formés grâce à LoveLink
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Sophie & Marc",
                text: "Nous nous sommes rencontrés sur LoveLink il y a 2 ans. Aujourd'hui, nous sommes mariés et nous attendons notre premier enfant !",
                rating: 5,
              },
              {
                name: "Julie & Thomas",
                text: "J'étais sceptique au début, mais l'algorithme de LoveLink nous a parfaitement matchés. C'est magique !",
                rating: 5,
              },
              {
                name: "Camille & Nicolas",
                text: "Après plusieurs déceptions sur d'autres sites, LoveLink a changé la donne. La qualité des profils est exceptionnelle.",
                rating: 5,
              },
            ].map((testimonial, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-slate-50 border border-slate-100 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 leading-relaxed mb-6">
                  &ldquo;{testimonial.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center text-white font-bold">
                    {testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-slate-500">Membres depuis 2023</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <Heart className="w-16 h-16 text-rose-500 fill-rose-500 mx-auto mb-6 animate-pulse-heart" />
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            Prêt(e) à trouver l&apos;amour ?
          </h2>
          <p className="mt-4 text-xl text-slate-300 max-w-2xl mx-auto">
            Rejoignez LoveLink aujourd&apos;hui et commencez votre histoire d&apos;amour.
            L&apos;inscription est gratuite et ne prend que 2 minutes.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-10 py-4 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-full text-lg font-semibold hover:shadow-xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1"
            >
              Créer mon profil
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

           {/* Footer */}
      <footer className="bg-gradient-to-br from-slate-900 via-purple-900 to-rose-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-rose-400 fill-rose-400" />
                <span className="text-xl font-bold text-white">LoveLink</span>
              </div>
              <p className="text-sm leading-relaxed max-w-md">
                La plateforme de rencontre en ligne pour trouver l&apos;amour, l&apos;amitié
                ou faire de belles connaissances partout dans le monde.
              </p>
              <div className="mt-4 text-sm">
                <p className="flex items-center gap-2">
                  📍 Dakar, Sénégal
                </p>
                <p className="flex items-center gap-2 mt-1">
                  ✉️{" "}
                  <a
                    href="mailto:lovelink237@gmail.com"
                    className="hover:text-rose-400 transition"
                  >
                    lovelink237@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Navigation</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/" className="hover:text-rose-400 transition">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-rose-400 transition">
                    S&apos;inscrire
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="hover:text-rose-400 transition">
                    Se connecter
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-rose-400 transition">
                    Fonctionnalités
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/cgu" className="hover:text-rose-400 transition">
                    CGU
                  </Link>
                </li>
                <li>
                  <Link href="/confidentialite" className="hover:text-rose-400 transition">
                    Confidentialité
                  </Link>
                </li>
                <li>
                  <Link href="/mentions-legales" className="hover:text-rose-400 transition">
                    Mentions légales
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:lovelink237@gmail.com"
                    className="hover:text-rose-400 transition"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} LoveLink — Marketing de Boutique Numérique.
              Tous droits réservés.
            </p>
            <p className="text-sm text-slate-400 flex items-center gap-1">
              Fait avec <Heart className="w-4 h-4 text-rose-400 fill-rose-400 inline" /> au Sénégal
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
