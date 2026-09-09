import { ImageResponse } from "next/og";

const letter = "网";

export function generateImageMetadata() {
  return [
    { id: "192", size: { width: 192, height: 192 }, contentType: "image/png" },
    { id: "512", size: { width: 512, height: 512 }, contentType: "image/png" },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const resolved = await id;
  const size = Number(resolved) || 192;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#18181b",
        color: "#fafafa",
        fontSize: Math.round(size * 0.42),
        fontWeight: 600,
      }}
    >
      {letter}
    </div>,
    { width: size, height: size },
  );
}
