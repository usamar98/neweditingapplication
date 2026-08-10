import { ImageResponse } from "next/og";

export const alt = "Editing App — one private AI creative studio";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ alignItems: "center", background: "#f8f1df", color: "#151814", display: "flex", height: "100%", justifyContent: "center", padding: 72, width: "100%" }}>
      <div style={{ border: "1px solid rgba(19, 125, 81, .28)", borderRadius: 36, display: "flex", flexDirection: "column", padding: 64, width: "100%", background: "linear-gradient(135deg, rgba(27,164,105,.13), rgba(255,251,241,.96) 56%)" }}>
        <div style={{ color: "#137d51", display: "flex", fontSize: 28, marginBottom: 42 }}>EDITING APP · AI CREATIVE STUDIO</div>
        <div style={{ display: "flex", flexDirection: "column", fontSize: 72, fontWeight: 700, letterSpacing: -4, lineHeight: 1.02 }}><span>Edit. Generate.</span><span style={{ color: "#137d51" }}>Launch creative that performs.</span></div>
        <div style={{ color: "#62685f", display: "flex", fontSize: 25, marginTop: 42 }}>Seedance 2.5 · LTX 2.3 · Veo 3.1 · Kling 3 · Seedream 5</div>
      </div>
    </div>,
    size,
  );
}
