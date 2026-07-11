import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LoveLink - Trouvez votre âme sœur";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

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
          background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 50%, #ec4899 100%)",
          position: "relative",
          fontFamily: "sans-serif",
        }}
      >
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
              boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
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
              textShadow: "0 4px 20px rgba(0, 0, 0, 0.2)",
              display: "flex",
              marginBottom: 20,
            }}
          >
            LoveLink
          </div>

          {/* Slogan */}
          <div
            style={{
              fontSize: 40,
              fontWeight: 600,
              color: "white",
              textAlign: "center",
              marginBottom: 30,
              display: "flex",
              opacity: 0.95,
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
              opacity: 0.9,
              lineHeight: 1.4,
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
                background: "rgba(255, 255, 255, 0.2)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 600,
              }}
            >
              ⭐ Super Like
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.2)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 600,
              }}
            >
              🔒 100% Sécurisé
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(255, 255, 255, 0.2)",
                padding: "12px 24px",
                borderRadius: 30,
                fontSize: 22,
                color: "white",
                fontWeight: 600,
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
            fontSize: 20,
            color: "rgba(255, 255, 255, 0.8)",
            fontWeight: 500,
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
