import { ImageResponse } from "next/og";

export const alt = "Editing App — one private AI creative studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#080b10", color: "white", display: "flex", height: "100%", justifyContent: "center", padding: 72, width: "100%" }}>
      <div style={{ border: "1px solid rgba(72, 231, 160, .28)", borderRadius: 36, display: "flex", flexDirection: "column", padding: 64, width: "100%", background: "linear-gradient(135deg, rgba(72,231,160,.12), rgba(8,11,16,.95) 55%)" }}>
        <div style={{ color: "#56e5a8", display: "flex", fontSize: 28, marginBottom: 42 }}>EDITING APP · AI CREATIVE STUDIO</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02 }}><span>Edit. Generate.</span><span style={{ color: "#56e5a8" }}>Launch creative that performs.</span></div>
        <div style={{ color: "#a7b0bd", display: "flex", fontSize: 25, marginTop: 42 }}>Seedance 2.5 · LTX 2.3 · Veo 3.1 · Kling 3 · Seedream 5</div>
      </div>
    </div>,
    size,
  );
}
