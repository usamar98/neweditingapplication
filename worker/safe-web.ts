import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_PRODUCT_HTML_BYTES = 2 * 1024 * 1024;
const MAX_REDIRECTS = 4;

function isPublicIpv4(address: string) {
  const octets = address.split(".").map(Number);
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) {
    return false;
  }
  const [a, b] = octets;
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && [0, 2, 168].includes(b)) return false;
  if (a === 198 && [18, 19, 51].includes(b)) return false;
  if (a === 203 && b === 0) return false;
  return true;
}

function isPublicIpv6(address: string) {
  const normalized = address.toLowerCase().split("%")[0];
  if (normalized === "::" || normalized === "::1") return false;
  if (normalized.startsWith("fc") || normalized.startsWith("fd")) return false;
  if (/^fe[89ab]/.test(normalized) || normalized.startsWith("ff")) return false;
  if (normalized.startsWith("2001:db8:")) return false;
  const mapped = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mapped ? isPublicIpv4(mapped) : true;
}

export function isPublicIp(address: string) {
  const family = isIP(address);
  return family === 4 ? isPublicIpv4(address) : family === 6 ? isPublicIpv6(address) : false;
}

export async function validatePublicHttpsUrl(rawUrl: string) {
  const url = new URL(rawUrl);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443")) {
    throw new Error("Product URLs must be public HTTPS addresses without credentials or custom ports.");
  }
  if (url.hostname === "localhost" || url.hostname.endsWith(".localhost")) {
    throw new Error("Local network addresses are not allowed.");
  }
  const addresses = isIP(url.hostname)
    ? [{ address: url.hostname }]
    : await lookup(url.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("Product URLs must resolve only to public internet addresses.");
  }
  return url;
}

async function readLimitedText(response: Response, maxBytes: number) {
  const announced = Number(response.headers.get("content-length") ?? 0);
  if (announced > maxBytes) throw new Error("The product page is too large to analyze safely.");
  if (!response.body) throw new Error("The product page returned an empty response.");

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      throw new Error("The product page is too large to analyze safely.");
    }
    chunks.push(value);
  }
  return new TextDecoder().decode(Buffer.concat(chunks));
}

function decodeHtml(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: "\"",
  };
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name: string) => entities[name.toLowerCase()] ?? match)
    .replace(/\s+/g, " ")
    .trim();
}

function attributes(tag: string) {
  const result = new Map<string, string>();
  for (const match of tag.matchAll(/([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result.set(match[1].toLowerCase(), decodeHtml(match[2] ?? match[3] ?? match[4] ?? ""));
  }
  return result;
}

function metaValue(html: string, keys: string[]) {
  const wanted = new Set(keys.map((key) => key.toLowerCase()));
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(match[0]);
    const key = (attrs.get("property") ?? attrs.get("name") ?? "").toLowerCase();
    if (wanted.has(key) && attrs.get("content")) return attrs.get("content") ?? null;
  }
  return null;
}

function productJsonLd(html: string) {
  for (const match of html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]) as unknown;
      const candidates = Array.isArray(parsed)
        ? parsed
        : parsed && typeof parsed === "object" && "@graph" in parsed && Array.isArray((parsed as { "@graph"?: unknown })["@graph"])
          ? (parsed as { "@graph": unknown[] })["@graph"]
          : [parsed];
      for (const candidate of candidates) {
        if (!candidate || typeof candidate !== "object") continue;
        const record = candidate as Record<string, unknown>;
        const type = Array.isArray(record["@type"]) ? record["@type"] : [record["@type"]];
        if (!type.some((value) => typeof value === "string" && value.toLowerCase() === "product")) continue;
        const rawImage = Array.isArray(record.image) ? record.image[0] : record.image;
        const image = typeof rawImage === "string"
          ? rawImage
          : rawImage && typeof rawImage === "object" && typeof (rawImage as { url?: unknown }).url === "string"
            ? (rawImage as { url: string }).url
            : null;
        return {
          description: typeof record.description === "string" ? record.description : null,
          image,
          title: typeof record.name === "string" ? record.name : null,
        };
      }
    } catch {
      // Ignore invalid merchant metadata and continue with standard Open Graph tags.
    }
  }
  return { description: null, image: null, title: null };
}

export function extractProductMetadata(html: string, pageUrl: URL) {
  const structured = productJsonLd(html);
  const titleTag = html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/<[^>]+>/g, " ") ?? null;
  const title = structured.title
    ?? metaValue(html, ["og:title", "twitter:title"])
    ?? (titleTag ? decodeHtml(titleTag) : null);
  const description = structured.description
    ?? metaValue(html, ["og:description", "twitter:description", "description"]);
  const image = structured.image
    ?? metaValue(html, ["og:image:secure_url", "og:image", "twitter:image", "twitter:image:src"]);
  if (!title) throw new Error("The product page does not expose a readable product title.");
  if (!image) throw new Error("The product page does not expose a product image. Add Open Graph product metadata and try again.");
  return {
    description: decodeHtml(description ?? "").slice(0, 4000),
    imageUrl: new URL(image, pageUrl).toString(),
    title: decodeHtml(title).slice(0, 240),
  };
}

export async function fetchProductMetadata(rawUrl: string) {
  let currentUrl = await validatePublicHttpsUrl(rawUrl);
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const response = await fetch(currentUrl, {
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "EditingApp-CreativeBot/1.0 (+product-metadata)",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirect === MAX_REDIRECTS) throw new Error("The product page redirected too many times.");
      currentUrl = await validatePublicHttpsUrl(new URL(location, currentUrl).toString());
      continue;
    }
    if (!response.ok) throw new Error(`The product page returned ${response.status}.`);
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("The product URL must point to an HTML product page.");
    }
    const metadata = extractProductMetadata(await readLimitedText(response, MAX_PRODUCT_HTML_BYTES), currentUrl);
    const imageUrl = await validatePublicHttpsUrl(metadata.imageUrl);
    return { ...metadata, imageUrl: imageUrl.toString(), pageUrl: currentUrl.toString() };
  }
  throw new Error("Unable to read the product page.");
}
