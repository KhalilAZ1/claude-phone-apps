// An install link carries the whole app in its `app` query parameter:
// base64url(JSON {n: name, s: shortName?, u: artifact link, t: theme, b: background, i: icon SVG}).
// Nothing is stored anywhere; this module is the single place that decides what is valid.

const MAX_PAYLOAD_LENGTH = 8000;
const MAX_NAME_LENGTH = 40;
const MAX_SHORT_NAME_LENGTH = 12;
const MAX_ICON_ELEMENTS = 300;
const ICON_SIZE = 512;
const ARTIFACT_HOST = "claude.ai";
const ARTIFACT_PATH = /^\/(artifact|code\/artifact|public\/artifacts)\/[A-Za-z0-9-]+\/?$/;
const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const HIDDEN_CHARACTERS = /[\p{C}\p{Zl}\p{Zp}]/u;
const SQUARE_VIEWBOX = /viewBox="\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)\s*"/;
const TAG_NAME = /<\s*\/?\s*([A-Za-z][\w:.-]*)/g;
const ROOT_TAG = /^\s*<svg\b[^>]*>/;
const ROOT_SIZE_ATTRIBUTE = /\s(width|height)\s*=\s*("[^"]*"|'[^']*')/g;
const EXTERNAL_REFERENCE = /\bhref\s*=\s*["']\s*(?!#)/i;
const ICON_ELEMENTS = new Set([
  "svg", "g", "defs", "rect", "circle", "ellipse", "line", "polyline", "polygon", "path",
  "linearGradient", "radialGradient", "stop", "title",
]);

export class PayloadError extends Error {}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(segment) {
  const binary = atob(segment.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder("utf-8", { fatal: true }).decode(
    Uint8Array.from(binary, (char) => char.charCodeAt(0)),
  );
}

export function encodePayload(app) {
  const data = {
    n: app.name,
    ...(app.shortName ? { s: app.shortName } : {}),
    u: app.artifactUrl,
    t: app.themeColor,
    b: app.backgroundColor,
    i: app.iconSvg,
  };
  return toBase64Url(JSON.stringify(data));
}

function checkArtifactUrl(raw) {
  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new PayloadError("Not a claude.ai artifact link");
  }
  const isArtifact =
    parsed.protocol === "https:" &&
    parsed.hostname === ARTIFACT_HOST &&
    !parsed.username &&
    ARTIFACT_PATH.test(parsed.pathname) &&
    !parsed.search &&
    !parsed.hash;
  if (!isArtifact) throw new PayloadError(`Not a claude.ai artifact link: ${raw}`);
  return parsed.href;
}

function checkColor(color) {
  if (typeof color !== "string" || !HEX_COLOR.test(color)) {
    throw new PayloadError(`Use a #rrggbb color, got: ${color}`);
  }
  return color;
}

function checkName(name, maxLength) {
  const normalized = typeof name === "string" ? name.normalize("NFKC").trim() : "";
  if (!normalized || normalized.length > maxLength || HIDDEN_CHARACTERS.test(normalized)) {
    throw new PayloadError(`App name must be 1 to ${maxLength} visible characters`);
  }
  return normalized;
}

function defaultShortName(name) {
  if (name.length <= MAX_SHORT_NAME_LENGTH) return name;
  const lastWord = name.split(/\s+/).pop();
  return lastWord.length <= MAX_SHORT_NAME_LENGTH ? lastWord : name.slice(0, MAX_SHORT_NAME_LENGTH);
}

function checkIconElements(svg) {
  const names = Array.from(svg.matchAll(TAG_NAME), (match) => match[1]);
  const unknown = names.find((name) => !ICON_ELEMENTS.has(name));
  if (unknown) throw new PayloadError(`The icon may only use simple shapes, not <${unknown}>`);
  const openingTags = svg.match(/<\s*[A-Za-z]/g).length;
  if (openingTags > MAX_ICON_ELEMENTS) throw new PayloadError("The icon has too many shapes");
}

// Returns the SVG with its root fixed at 512 x 512, so its drawing size is always known.
export function checkIconSvg(svg) {
  if (typeof svg !== "string") throw new PayloadError("The icon must be an SVG");
  if (/<[!?]/.test(svg)) throw new PayloadError("The icon may not contain declarations");
  const viewBox = svg.match(SQUARE_VIEWBOX);
  if (!viewBox || viewBox[1] !== viewBox[2]) throw new PayloadError("The icon needs a square viewBox");
  if (EXTERNAL_REFERENCE.test(svg)) throw new PayloadError("The icon may not reference other files");
  checkIconElements(svg);
  const rootTag = svg.match(ROOT_TAG);
  if (!rootTag) throw new PayloadError("The icon must start with <svg>");
  const sizedRoot = rootTag[0]
    .trim()
    .replace(ROOT_SIZE_ATTRIBUTE, "")
    .replace(/^<svg/, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}"`);
  return sizedRoot + svg.slice(rootTag[0].length);
}

export function decodePayload(segment) {
  if (typeof segment !== "string" || !segment) throw new PayloadError("Not a valid app link");
  if (segment.length > MAX_PAYLOAD_LENGTH) throw new PayloadError("App link is too long");
  let data;
  try {
    data = JSON.parse(fromBase64Url(segment));
  } catch {
    throw new PayloadError("Not a valid app link");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new PayloadError("Not a valid app link");
  }
  const name = checkName(data.n, MAX_NAME_LENGTH);
  return {
    name,
    shortName: data.s ? checkName(data.s, MAX_SHORT_NAME_LENGTH) : defaultShortName(name),
    artifactUrl: checkArtifactUrl(data.u),
    themeColor: checkColor(data.t),
    backgroundColor: checkColor(data.b),
    iconSvg: checkIconSvg(data.i),
  };
}
