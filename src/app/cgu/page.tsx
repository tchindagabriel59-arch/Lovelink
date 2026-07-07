export const metadata = {
  title: "Conditions Générales d'Utilisation - LoveLink",
  description: "CGU du site de rencontre LoveLink",
};

export default function CGUPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-pink-600">
        Conditions Générales d'Utilisation
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Présentation du service</h2>
        <p className="mb-3">
          LoveLink est une plateforme de rencontre en ligne éditée par Marketing de Boutique
          Numérique, basée à Dakar, Sénégal. Le service permet aux utilisateurs majeurs de
          créer un profil, d'entrer en contact avec d'autres membres pour former des relations
          amicales, amoureuses ou faire de nouvelles connaissances.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Accès au service</h2>
        <p className="mb-3">
          <strong>L'inscription à LoveLink est strictement réservée aux personnes majeures
          (18 ans ou plus).</strong> Toute inscription d'une personne mineure entraînera la
          suppression immédiate du compte.
        </p>
        <p className="mb-3">
          En vous inscrivant, vous certifiez sur l'honneur avoir au moins 18 ans et disposer
          de la capacité juridique pour accepter les présentes CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">3. Création de compte</h2>
        <p className="mb-3">
          L'utilisateur s'engage à fournir des informations exactes, complètes et à jour
          lors de son inscription. L'usurpation d'identité, la création de faux profils
          ou l'utilisation de photos ne vous appartenant pas est strictement interdite.
        </p>
        <p className="mb-3">
          Chaque utilisateur est responsable de la confidentialité de son mot de passe
          et de toutes les activités effectuées depuis son compte.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">4. Règles de conduite</h2>
        <p className="mb-3">Sont strictement interdits :</p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li>Le harcèlement, les insultes, la haine, le racisme, l'homophobie</li>
          <li>La diffusion de contenus pornographiques ou pédopornographiques</li>
          <li>La sollicitation commerciale, le spam, l'escroquerie</li>
          <li>La diffusion d'informations personnelles d'autrui sans consentement</li>
          <li>L'utilisation du service à des fins illégales</li>
          <li>La création de plusieurs comptes par une même personne</li>
        </ul>
        <p className="mb-3">
          Tout manquement à ces règles entraînera la suspension ou la suppression
          définitive du compte, sans préavis ni remboursement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Contenu utilisateur</h2>
        <p className="mb-3">
          L'utilisateur reste propriétaire des contenus qu'il publie (photos, textes, bio).
          Cependant, en les publiant, il accorde à LoveLink une licence non exclusive
          d'utilisation pour l'affichage sur la plateforme.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">6. Responsabilité</h2>
        <p className="mb-3">
          LoveLink met tout en œuvre pour offrir un service de qualité mais ne peut
          garantir la véracité des profils publiés par les membres. Chaque utilisateur
          est invité à faire preuve de vigilance lors de ses rencontres.
        </p>
        <p className="mb-3">
          LoveLink ne pourra être tenu responsable des dommages directs ou indirects
          résultant de l'utilisation du service ou des rencontres qu'il facilite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">7. Suppression de compte</h2>
        <p className="mb-3">
          L'utilisateur peut supprimer son compte à tout moment depuis ses paramètres.
          LoveLink se réserve le droit de suspendre ou supprimer tout compte ne respectant
          pas les présentes CGU.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">8. Modifications des CGU</h2>
        <p className="mb-3">
          LoveLink se réserve le droit de modifier les présentes CGU à tout moment.
          Les utilisateurs seront informés des changements par email ou notification.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">9. Droit applicable</h2>
        <p className="mb-3">
          Les présentes CGU sont régies par le droit sénégalais. Tout litige sera soumis
          aux tribunaux compétents de Dakar.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">10. Contact</h2>
        <p className="mb-3">
          Pour toute question :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
