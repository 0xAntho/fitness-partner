import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 128,
          background: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 320,
          color: "white",
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { width: 512, height: 512 }
  );
}
