// Turns the app described in this page's link into an installable home-screen app.
import { decodePayload } from "./payload.js";
import { buildManifest, isLaunch, launchUrl, manifestHref } from "./launcher.js";

const ICON_SIZES = [32, 180, 192, 512];
const MANUAL_STEPS_DELAY_MS = 2500;

const element = (id) => document.getElementById(id);

function show(sectionId) {
  ["home", "install", "error"].forEach((id) => {
    element(id).hidden = id !== sectionId;
  });
}

function rasterize(svg, size) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      canvas.getContext("2d").drawImage(image, 0, 0, size, size);
      resolve(canvas.toDataURL("image/png"));
    };
    image.onerror = () => reject(new Error("The icon could not be drawn"));
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

async function renderIcons(svg) {
  const pngs = await Promise.all(ICON_SIZES.map((size) => rasterize(svg, size)));
  return Object.fromEntries(ICON_SIZES.map((size, index) => [size, pngs[index]]));
}

function addHeadTag(tagName, attributes) {
  const tag = document.createElement(tagName);
  Object.entries(attributes).forEach(([key, value]) => tag.setAttribute(key, value));
  document.head.append(tag);
}

function applyIdentity(app, icons) {
  document.title = app.shortName;
  addHeadTag("link", { rel: "icon", type: "image/png", href: icons[32] });
  addHeadTag("link", { rel: "icon", type: "image/png", sizes: "192x192", href: icons[192] });
  addHeadTag("link", { rel: "apple-touch-icon", href: icons[180] });
  addHeadTag("meta", { name: "theme-color", content: app.themeColor });
  addHeadTag("meta", { name: "apple-mobile-web-app-capable", content: "yes" });
  addHeadTag("meta", { name: "mobile-web-app-capable", content: "yes" });
  addHeadTag("meta", { name: "apple-mobile-web-app-title", content: app.shortName });
  addHeadTag("link", { rel: "manifest", href: manifestHref(buildManifest(app, location.href, icons)) });
  document.documentElement.style.setProperty("--theme", app.themeColor);
  document.documentElement.style.setProperty("--ground", app.backgroundColor);
}

function offerInstall() {
  let installEvent = null;
  const button = element("install-button");
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    installEvent = event;
    button.hidden = false;
    element("android-steps").hidden = true;
  });
  button.addEventListener("click", () => {
    if (!installEvent) return;
    installEvent.prompt();
    installEvent = null;
    button.hidden = true;
  });
  window.addEventListener("appinstalled", () => {
    element("lead").textContent = "Installed. Open it from your home screen.";
    button.hidden = true;
  });
  setTimeout(() => {
    if (installEvent) return;
    const isIos = /iPhone|iPad|iPod/.test(navigator.userAgent);
    element(isIos ? "ios-steps" : "android-steps").hidden = false;
  }, MANUAL_STEPS_DELAY_MS);
}

async function showInstallPage(app) {
  const icons = await renderIcons(app.iconSvg);
  applyIdentity(app, icons);
  element("icon").src = icons[192];
  element("name").textContent = app.name;
  element("open").href = app.artifactUrl;
  element("target").textContent = app.artifactUrl.replace("https://", "");
  // A home-screen shortcut made from this page reopens this URL; make that URL launch the app.
  history.replaceState(null, "", launchUrl(location.href));
  show("install");
  offerInstall();
}

function launchedFromHomeScreen() {
  return isLaunch(location.href) || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
}

async function main() {
  const encoded = new URLSearchParams(location.search).get("app");
  if (!encoded) {
    show("home");
    return;
  }
  try {
    const app = decodePayload(encoded);
    if (launchedFromHomeScreen()) {
      location.replace(app.artifactUrl);
      return;
    }
    await showInstallPage(app);
  } catch (error) {
    element("error-reason").textContent = error.message;
    show("error");
  }
}

main();
