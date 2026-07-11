import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LoveLink - Trouvez votre âme sœur";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

// URL de la photo de fond (couple romantique)
const BACKGROUND_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80";

export default async function Image() {
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
        }}
      >
        {/* Image de fond floutée */}
        <img
          src={BACKGROUND_IMAGE}
          alt=""
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(8px)",
          }}
        />

        {/* Overlay dégradé rose/violet par-dessus */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, rgba(244, 63, 94, 0.85) 0%, rgba(168, 85, 247, 0.85) 50%, rgba(236, 72, 153, 0.85) 100%)",
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
        <div
          style={{
            position: "absolute",
            top: 100,
            right: 100,
            width: 150,
            height: 150,
            borderRadius: 75,
            background: "rgba(255, 255, 255, 0.15)",
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
              background: "rgba(255, 255, 255, 0.25)",
              backdropFilter: "blur(10px)",
              marginBottom: 30,
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.3)",
              border: "3px solid rgba(255, 255, 255, 0.4)",
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
              fontSize: 120,
              fontWeight: 900,
              color: "white",
              letterSpacing: "-4px",
              textShadow: "0 4px 30px rgba(0, 0, 0, 0.4)",
              display: "flex",
              marginBottom: 20,
            }}
          >
            LoveLink
          </div>

          {/* Slogan */}
          <div
            style={{
              fontSize: 42,
              fontWeight: 700,
              color: "white",
              textAlign: "center",
              marginBottom: 25,
              display: "flex",
              textShadow: "0 2px 15px rgba(0, 0, 0, 0.4)",
            }}
          >
            Trouvez votre âme sœur
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 26,
              color: "white",
              textAlign: "center",
              maxWidth: 900,
              display: "flex",
              opacity: 0.95,
              lineHeight: 1.4,
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
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
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(10px)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              ⭐ Super Like
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(10px)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.3)",
              }}
            >
              🔒 100% Sécurisé
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.25)",
                backdropFilter: "blur(10px)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 700,
                border: "2px solid rgba(255, 255, 255, 0.3)",
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
            bottom: 30,
            display: "flex",
            fontSize: 22,
            color: "white",
            fontWeight: 600,
            textShadow: "0 2px 10px rgba(0, 0, 0, 0.4)",
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
