import { ImageResponse } from "next/og";

export const runtime = "edge";
export const contentType = "image/png";
export const size = { width: 512, height: 512 };

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f43f5e 0%, #a855f7 100%)",
          padding: "64px",
        }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "white",
            borderRadius: "64px",
          }}
        >
          <img
            src="https://i.ibb.co/Y4h4H7R7/LOVELINK-1.jpg"
            alt="LoveLink"
            width={384}
            height={384}
            style={{ objectFit: "cover", borderRadius: "48px" }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
