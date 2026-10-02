import { test } from "node:test";
import assert from "node:assert/strict";
import { buildManifest, isLaunch, launchUrl, manifestHref } from "../docs/launcher.js";

const PAGE = "https://someone.github.io/claude-phone-apps/?app=eyJuIjoiV2F0ZXIifQ";
const ICONS = { 192: "data:image/png;base64,AAA", 512: "data:image/png;base64,BBB" };
const APP = {
  name: "Water Log",
  shortName: "Water",
  themeColor: "#1f6f8b",
  backgroundColor: "#f2f6f8",
};

test("launchUrl marks the page URL as a home-screen launch", () => {
  assert.equal(launchUrl(PAGE), `${PAGE}&go=1`);
  assert.equal(launchUrl(`${PAGE}&go=1`), `${PAGE}&go=1`);
});

test("isLaunch is true only for launch URLs", () => {
  assert.equal(isLaunch(launchUrl(PAGE)), true);
  assert.equal(isLaunch(PAGE), false);
});

test("buildManifest gives each app its own id and a launching start URL", () => {
  const manifest = buildManifest(APP, PAGE, ICONS);
  assert.equal(manifest.id, PAGE);
  assert.equal(manifest.start_url, `${PAGE}&go=1`);
  assert.equal(manifest.scope, "https://someone.github.io/claude-phone-apps/");
  assert.equal(manifest.name, "Water Log");
  assert.equal(manifest.short_name, "Water");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.theme_color, "#1f6f8b");
  assert.deepEqual(
    manifest.icons.map((icon) => `${icon.src}|${icon.sizes}|${icon.purpose}`),
    [
      "data:image/png;base64,AAA|192x192|any",
      "data:image/png;base64,BBB|512x512|any",
      "data:image/png;base64,BBB|512x512|maskable",
    ],
  );
});

test("buildManifest ignores a launch flag already in the page URL", () => {
  assert.equal(buildManifest(APP, launchUrl(PAGE), ICONS).id, PAGE);
});

test("manifestHref is a data URL holding the manifest JSON", () => {
  const href = manifestHref({ name: "Water & Log" });
  assert.match(href, /^data:application\/manifest\+json,/);
  assert.deepEqual(JSON.parse(decodeURIComponent(href.split(",")[1])), { name: "Water & Log" });
});
