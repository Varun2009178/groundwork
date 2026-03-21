import { ImageResponse } from "next/og";

export const alt = "Groundwork — Give your AI the full picture";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <span style={{ color: "#e5e5e5", fontSize: 72, fontWeight: 700 }}>
          Groundwork
        </span>
        <span style={{ color: "#888", fontSize: 28, marginTop: 16 }}>
          Give your AI the full picture
        </span>
        <span style={{ color: "#555", fontSize: 20, marginTop: 48, fontFamily: "monospace" }}>
          $ npx groundwork-cli
        </span>
      </div>
    ),
    { ...size }
  );
}
