import { describe, expect, it } from "vitest";
import { extractProductMetadata, isPublicIp } from "./safe-web";

describe("safe product-page metadata", () => {
  it("blocks private and reserved addresses", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("10.10.0.2")).toBe(false);
    expect(isPublicIp("169.254.169.254")).toBe(false);
    expect(isPublicIp("192.168.1.4")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("fd00::1")).toBe(false);
    expect(isPublicIp("8.8.8.8")).toBe(true);
    expect(isPublicIp("2606:4700:4700::1111")).toBe(true);
  });

  it("extracts Open Graph product data regardless of attribute order", () => {
    const metadata = extractProductMetadata(`
      <html><head>
        <meta content="Campaign bottle" property="og:title">
        <meta name="description" content="A &amp; B launch bottle">
        <meta content="/assets/bottle.webp" property="og:image">
      </head></html>
    `, new URL("https://shop.example.com/products/bottle"));

    expect(metadata).toEqual({
      description: "A & B launch bottle",
      imageUrl: "https://shop.example.com/assets/bottle.webp",
      title: "Campaign bottle",
    });
  });

  it("uses Product JSON-LD when merchant metadata is available", () => {
    const metadata = extractProductMetadata(`
      <script type="application/ld+json">
        {"@type":"Product","name":"Studio Light","description":"Portable key light","image":["https://cdn.example.com/light.png"]}
      </script>
    `, new URL("https://shop.example.com/products/light"));

    expect(metadata.title).toBe("Studio Light");
    expect(metadata.imageUrl).toBe("https://cdn.example.com/light.png");
  });
});
