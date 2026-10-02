// Builds the web app manifest in the browser, so one static page can install any app.

const LAUNCH_PARAM = "go";

export function launchUrl(pageUrl) {
  const url = new URL(pageUrl);
  url.searchParams.set(LAUNCH_PARAM, "1");
  return url.href;
}

export function isLaunch(pageUrl) {
  return new URL(pageUrl).searchParams.get(LAUNCH_PARAM) === "1";
}

function withoutLaunch(pageUrl) {
  const url = new URL(pageUrl);
  url.searchParams.delete(LAUNCH_PARAM);
  return url.href;
}

export function buildManifest(app, pageUrl, icons) {
  const appUrl = withoutLaunch(pageUrl);
  const { origin, pathname } = new URL(appUrl);
  return {
    id: appUrl,
    name: app.name,
    short_name: app.shortName,
    start_url: launchUrl(appUrl),
    scope: `${origin}${pathname}`,
    display: "standalone",
    theme_color: app.themeColor,
    background_color: app.backgroundColor,
    icons: [
      { src: icons[192], sizes: "192x192", type: "image/png", purpose: "any" },
      { src: icons[512], sizes: "512x512", type: "image/png", purpose: "any" },
      { src: icons[512], sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}

export function manifestHref(manifest) {
  return `data:application/manifest+json,${encodeURIComponent(JSON.stringify(manifest))}`;
}
