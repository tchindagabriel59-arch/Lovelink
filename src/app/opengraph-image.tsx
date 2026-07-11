import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "LoveLink - Trouvez votre âme sœur";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  const imageUrl = "https://i.ibb.co/vCYcn42T/lovelink.jpg";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          background: "#1a0033",
        }}
      >
        <img
          src={imageUrl}
          width={1200}
          height={630}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
