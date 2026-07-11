import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LoveLink - Trouvez votre âme sœur";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  // Charger l'image et la convertir en base64 pour être sûr qu'elle s'affiche
  const imageUrl = "const imageUrl = "https://i.ibb.co/vCYcn42T/lovelink.jpg";";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          fontFamily: "sans-serif",
          background: "#1a0033",
        }}
      >
        {/* Image de fond - PLEINE VISIBILITÉ */}
        <img
          src={imageUrl}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />

        {/* Overlay dégradé SEMI-TRANSPARENT (plus léger) */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, rgba(244, 63, 94, 0.65) 0%, rgba(168, 85, 247, 0.65) 50%, rgba(236, 72, 153, 0.65) 100%)",
            display: "flex",
          }}
        />

        {/* Cercles décoratifs */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 40,
            width: 200,
            height: 200,
            borderRadius: 100,
            background: "rgba(255, 255, 255, 0.1)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: 40,
            width: 300,
            height: 300,
            borderRadius: 150,
            background: "rgba(255, 255, 255, 0.08)",
            display: "flex",
          }}
        />

        {/* Contenu principal */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            padding: 60,
          }}
        >
          {/* Grand cœur */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 140,
              height: 140,
              borderRadius: 70,
              background: "rgba(255, 255, 255, 0.3)",
              marginBottom: 30,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
              border: "4px solid rgba(255, 255, 255, 0.5)",
            }}
          >
            <div
              style={{
                fontSize: 90,
                display: "flex",
              }}
            >
              💜
            </div>
          </div>

          {/* Titre LoveLink */}
          <div
            style={{
              fontSize: 130,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-4px",
              textShadow: "0 4px 40px rgba(0, 0, 0, 0.6)",
              display: "flex",
              marginBottom: 20,
            }}
          >
            LoveLink
          </div>

          {/* Slogan */}
          <div
            style={{
              fontSize: 44,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              marginBottom: 25,
              display: "flex",
              textShadow: "0 2px 20px rgba(0, 0, 0, 0.6)",
            }}
          >
            Trouvez votre âme sœur
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 28,
              color: "white",
              textAlign: "center",
              maxWidth: 900,
              display: "flex",
              lineHeight: 1.4,
              textShadow: "0 2px 15px rgba(0, 0, 0, 0.5)",
              fontWeight: 500,
            }}
          >
            L'amour • L'amitié • De belles rencontres partout dans le monde
          </div>

          {/* Badges features */}
          <div
            style={{
              display: "flex",
              gap: 20,
              marginTop: 40,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.3)",
                padding: "14px 28px",
                borderRadius: 30,
                fontSize: 24,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
            >
              ⭐ Super Like
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.3)",
                padding: "14px 28px",
                borderRadius: 30,
                fontSize: 24,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
            >
              🔒 100% Sécurisé
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.3)",
                padding: "14px 28px",
                borderRadius: 30,
                fontSize: 24,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.4)",
                boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
              }}
            >
              🎁 Gratuit
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "absolute",
            bottom: 25,
            display: "flex",
            fontSize: 22,
            color: "white",
            fontWeight: 700,
            textShadow: "0 2px 15px rgba(0, 0, 0, 0.6)",
            background: "rgba(0, 0, 0, 0.3)",
            padding: "8px 20px",
            borderRadius: 20,
          }}
        >
          lovelink-omega.vercel.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
