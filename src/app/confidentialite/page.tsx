export const metadata = {
  title: "Politique de Confidentialité - LoveLink",
  description: "Politique de confidentialité et protection des données",
};

export default function ConfidentialitePage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-pink-600">
        Politique de Confidentialité
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Dernière mise à jour : {new Date().toLocaleDateString("fr-FR")}
      </p>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
        <p className="mb-3">
          Chez LoveLink, la protection de vos données personnelles est une priorité.
          Cette politique explique quelles données nous collectons, pourquoi, et comment
          nous les protégeons.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">2. Responsable du traitement</h2>
        <p className="mb-3">
          <strong>Marketing de Boutique Numérique</strong><br />
          Rue Ave Cheikh Anta Diop, Dakar, Sénégal<br />
          Email :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">3. Données collectées</h2>
        <p className="mb-3">Nous collectons les données suivantes :</p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li><strong>Données d'inscription</strong> : email, mot de passe (chiffré), prénom, nom, date de naissance, genre</li>
          <li><strong>Données de profil</strong> : bio, ville, pays, photo, intérêts, profession, orientation recherchée</li>
          <li><strong>Données d'utilisation</strong> : likes, matchs, messages, date de dernière connexion</li>
          <li><strong>Données techniques</strong> : adresse IP, type de navigateur, cookies</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">4. Finalités du traitement</h2>
        <p className="mb-3">Vos données sont utilisées pour :</p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li>Créer et gérer votre compte utilisateur</li>
          <li>Vous proposer des profils compatibles</li>
          <li>Permettre les échanges avec les autres membres</li>
          <li>Assurer la sécurité et prévenir les abus</li>
          <li>Améliorer nos services</li>
          <li>Vous envoyer des notifications importantes</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">5. Base légale</h2>
        <p className="mb-3">
          Le traitement de vos données repose sur votre <strong>consentement</strong>{" "}
          (lors de l'inscription) et sur l'<strong>exécution du contrat</strong> qui
          nous lie (fourniture du service de rencontre).
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">6. Durée de conservation</h2>
        <p className="mb-3">
          Vos données sont conservées tant que votre compte est actif. En cas de suppression
          de compte, les données sont effacées sous <strong>30 jours</strong>, sauf
          obligation légale de conservation.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">7. Partage des données</h2>
        <p className="mb-3">
          Vos données <strong>ne sont jamais vendues</strong> à des tiers. Elles peuvent
          être partagées uniquement avec :
        </p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li>Nos prestataires techniques (hébergement Vercel, base de données Neon)</li>
          <li>Les autorités compétentes en cas d'obligation légale</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">8. Sécurité</h2>
        <p className="mb-3">
          Nous mettons en œuvre toutes les mesures techniques appropriées :
        </p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li>Chiffrement des mots de passe (bcrypt)</li>
          <li>Connexions sécurisées HTTPS</li>
          <li>Authentification par tokens JWT</li>
          <li>Accès restreint aux données</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">9. Vos droits</h2>
        <p className="mb-3">Conformément au RGPD, vous disposez des droits suivants :</p>
        <ul className="list-disc ml-6 mb-3 space-y-2">
          <li><strong>Droit d'accès</strong> : consulter vos données</li>
          <li><strong>Droit de rectification</strong> : corriger vos données</li>
          <li><strong>Droit à l'effacement</strong> : supprimer votre compte</li>
          <li><strong>Droit à la portabilité</strong> : récupérer vos données</li>
          <li><strong>Droit d'opposition</strong> : refuser certains traitements</li>
        </ul>
        <p className="mb-3">
          Pour exercer ces droits, contactez-nous à :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">10. Cookies</h2>
        <p className="mb-3">
          Nous utilisons des cookies essentiels pour le fonctionnement du site
          (authentification). Aucun cookie publicitaire ou de tracking n'est utilisé
          sans votre consentement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">11. Contact</h2>
        <p className="mb-3">
          Pour toute question sur cette politique :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
