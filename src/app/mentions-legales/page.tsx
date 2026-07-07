export const metadata = {
  title: "Mentions Légales - LoveLink",
  description: "Mentions légales du site LoveLink",
};

export default function MentionsLegalesPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-12 text-gray-800">
      <h1 className="text-4xl font-bold mb-8 text-pink-600">Mentions Légales</h1>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Éditeur du site</h2>
        <p className="mb-3">
          <strong>Marketing de Boutique Numérique</strong><br />
          Statut : Particulier<br />
          Adresse : Rue Ave Cheikh Anta Diop, Dakar, Sénégal<br />
          Email :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Directeur de la publication</h2>
        <p className="mb-3">Gabriel Tchinda</p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Hébergement</h2>
        <p className="mb-3">
          <strong>Vercel Inc.</strong><br />
          340 S Lemon Ave #4133<br />
          Walnut, CA 91789, USA<br />
          Site :{" "}
          <a href="https://vercel.com" className="text-pink-600 underline" target="_blank">
            vercel.com
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Base de données</h2>
        <p className="mb-3">
          <strong>Neon (Databases Inc.)</strong><br />
          Site :{" "}
          <a href="https://neon.tech" className="text-pink-600 underline" target="_blank">
            neon.tech
          </a>
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Propriété intellectuelle</h2>
        <p className="mb-3">
          L'ensemble du site (design, logo, textes, code) est la propriété exclusive
          de Marketing de Boutique Numérique. Toute reproduction, même partielle, est
          interdite sans autorisation écrite.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Signalement</h2>
        <p className="mb-3">
          Pour signaler un contenu inapproprié, un profil suspect ou tout abus,
          contactez-nous à :{" "}
          <a href="mailto:lovelink237@gmail.com" className="text-pink-600 underline">
            lovelink237@gmail.com
          </a>
        </p>
      </section>
    </main>
  );
}
