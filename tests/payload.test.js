import { test } from "node:test";
import assert from "node:assert/strict";
import { decodePayload, encodePayload, checkIconSvg } from "../docs/payload.js";

const ICON = `<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#2747c7"/></svg>`;
const APP = {
  name: "Daily Tracker",
  shortName: "Tracker",
  artifactUrl: "https://claude.ai/artifact/KCdiBd2sJsor6XgBANT41e",
  themeColor: "#2747c7",
  backgroundColor: "#e9edf1",
  iconSvg: ICON,
};

test("encodePayload and decodePayload round-trip an app", () => {
  assert.deepEqual(decodePayload(encodePayload(APP)), APP);
});

test("decodePayload handles non-ASCII names", () => {
  const app = { ...APP, name: "Café Trainer", shortName: "Café" };
  assert.equal(decodePayload(encodePayload(app)).name, "Café Trainer");
});

test("shortName defaults to a name of 12 characters or less", () => {
  const { shortName, ...rest } = APP;
  assert.equal(decodePayload(encodePayload({ ...rest, name: "Water Log" })).shortName, "Water Log");
  assert.ok(decodePayload(encodePayload(rest)).shortName.length <= 12);
});

test("decodePayload accepts every claude.ai artifact link form", () => {
  for (const artifactUrl of [
    "https://claude.ai/artifact/KCdiBd2sJsor6XgBANT41e",
    "https://claude.ai/code/artifact/93644cfc-4508-4b22-86af-7041573cb091",
    "https://claude.ai/public/artifacts/93644cfc-4508-4b22-86af-7041573cb091",
  ]) {
    assert.equal(decodePayload(encodePayload({ ...APP, artifactUrl })).artifactUrl, artifactUrl);
  }
});

test("decodePayload rejects links that are not claude.ai artifacts", () => {
  for (const artifactUrl of [
    "http://claude.ai/artifact/abc",
    "https://evil.example/artifact/abc",
    "https://claude.ai@evil.example/artifact/abc",
    "https://claude.ai/chat/abc",
    "https://claude.ai/artifact/abc?next=https://evil.example",
    "javascript:alert(1)",
  ]) {
    assert.throws(() => decodePayload(encodePayload({ ...APP, artifactUrl })), /artifact link/, artifactUrl);
  }
});

test("decodePayload rejects bad colors, names and sizes", () => {
  assert.throws(() => decodePayload(encodePayload({ ...APP, themeColor: "red" })), /color/);
  assert.throws(() => decodePayload(encodePayload({ ...APP, name: "" })), /name/);
  assert.throws(() => decodePayload(encodePayload({ ...APP, name: "x".repeat(41) })), /name/);
  assert.throws(() => decodePayload(encodePayload({ ...APP, shortName: "x".repeat(13) })), /name/);
  assert.throws(() => decodePayload("A".repeat(9000)), /too long/);
});

test("decodePayload rejects data that is not a payload", () => {
  assert.throws(() => decodePayload("not-base64!!"), /link/);
  assert.throws(() => decodePayload(btoa("[1,2]")), /link/);
});

test("checkIconSvg allows plain shapes", () => {
  assert.match(checkIconSvg(ICON), /<rect width="512" height="512" fill="#2747c7"\/>/);
});

test("checkIconSvg rejects non-square, text, scripts and external references", () => {
  const cases = {
    square: ICON.replace("0 0 512 512", "0 0 600 300"),
    text: ICON.replace("</svg>", "<text>Hi</text></svg>"),
    script: ICON.replace("</svg>", "<script>alert(1)</script></svg>"),
    image: ICON.replace("</svg>", `<image href="https://evil.example/x.png"/></svg>`),
    external: ICON.replace("</svg>", `<use href="https://evil.example/a.svg#x"/></svg>`),
    use: ICON.replace("</svg>", `<use href="#a"/></svg>`),
    filter: ICON.replace("</svg>", `<filter id="f"><feGaussianBlur stdDeviation="999"/></filter></svg>`),
    style: ICON.replace("</svg>", `<style>@import url(x)</style></svg>`),
    namespaced: ICON.replace("</svg>", `<svg:text>Hi</svg:text></svg>`),
    doctype: `<!DOCTYPE svg [<!ENTITY a "aaaa">]>${ICON}`,
    tooMany: ICON.replace("</svg>", `${"<circle r=\"1\"/>".repeat(301)}</svg>`),
  };
  for (const [reason, svg] of Object.entries(cases)) {
    assert.throws(() => checkIconSvg(svg), /icon/i, reason);
  }
});

test("checkIconSvg fixes the root size to 512 so a drawing size can't be abused", () => {
  const sized = ICON.replace("<svg ", `<svg width="1" height="100000000" `);
  const checked = checkIconSvg(sized);
  assert.match(checked, /^<svg width="512" height="512" xmlns=/);
  assert.ok(!checked.includes("100000000"), checked);
  assert.match(checked, /<rect width="512" height="512"/);
});

test("checkIconSvg allows gradients and groups", () => {
  const gradient = ICON.replace(
    "<rect",
    `<defs><linearGradient id="g"><stop offset="0" stop-color="#000"/></linearGradient></defs><g><path d="M0 0h1"/></g><rect`,
  );
  assert.match(checkIconSvg(gradient), /<linearGradient id="g">/);
});

test("decodePayload rejects hidden and direction-changing characters in names", () => {
  assert.throws(() => decodePayload(encodePayload({ ...APP, name: "Tracker‮gnp" })), /name/);
  assert.throws(() => decodePayload(encodePayload({ ...APP, name: "Track\u0000er" })), /name/);
  assert.equal(decodePayload(encodePayload({ ...APP, name: "Ｔracker" })).name, "Tracker");
});
