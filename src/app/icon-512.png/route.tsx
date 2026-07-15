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
          background: "white",
        }}
      >
        <img
          src="https://i.ibb.co/Y4h4H7R7/LOVELINK-1.jpg"
          alt="LoveLink"
          width={512}
          height={512}
          style={{ objectFit: "cover" }}
        />
      </div>
    ),
    {
      ...size,
    }
  );
}
