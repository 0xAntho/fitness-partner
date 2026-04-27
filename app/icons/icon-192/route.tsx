import { ImageResponse } from "next/og";

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 192,
          height: 192,
          borderRadius: 48,
          background: "#16a34a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 120,
          color: "white",
          fontWeight: 700,
        }}
      >
        F
      </div>
    ),
    { width: 192, height: 192 }
  );
}
