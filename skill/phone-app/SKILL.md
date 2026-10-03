---
name: phone-app
description: Build a small app for the user's phone and put it on their home screen with its own name and icon. Claude builds the app as an artifact (hosted by Claude, with built-in storage and AI, no API keys), draws a matching icon, and replies with one install link. Use when the user asks for an app, tool, tracker, calculator, list or game "for my phone", "on my home screen", "as an app", or wants an existing artifact (claude.ai/artifact link) installed with a custom icon.
---

# Phone app

The user describes an app; you build it and hand back one link. They open the link on their phone,
tap **Install**, and the app sits on their home screen with its own name and icon. Opening it runs
the artifact on claude.ai, so its storage and AI features keep working.

The install page lives on the **user's own GitHub Pages** (their fork of `claude-phone-apps`),
so their apps never depend on anyone else's account.

## 0. Connect the user's GitHub (once)

You need their GitHub username, and their fork must have Pages turned on. If you already know
both from this conversation or your memory of the user, skip this step.

Otherwise ask for their GitHub username and check they've done the one-time setup:

1. Open **https://github.com/KhalilAZ1/claude-phone-apps/fork** and tap **Create fork**
   (keep the name `claude-phone-apps`).
2. In the fork: **Settings → Pages → Branch: `main`, folder: `/docs` → Save**.
3. After about a minute, `https://<username>.github.io/claude-phone-apps/` shows
   "Phone apps from Claude".

If they renamed the fork, also ask for the new name and pass it as `--repo`.

**In Claude Code with `gh` signed in**, do the setup for them instead of asking:

```bash
gh repo fork KhalilAZ1/claude-phone-apps --clone=false
gh api -X POST repos/<username>/claude-phone-apps/pages -f "source[branch]=main" -f "source[path]=/docs"
```

Get the username with `gh api user --jq .login`. If Pages is already on, the second command
answers 409; that's fine.

Build the app (step 1) while they do the setup; nothing else waits on it until step 4.

## 1. Build the app as an artifact

Skip this step if the user already gave a `https://claude.ai/...artifact...` link.

Ask at most one question, only if the app's core purpose is unclear. Otherwise build it.

Design for a phone first:
- One screen that does the main job at once; extra views behind tabs, not long menus.
- Tap targets at least 44 px, inputs with the right `inputmode`, no hover-only controls.
- Respect `env(safe-area-inset-*)`; works at 360 px wide; light and dark themes.
- Data must survive closing the app: use the artifact platform's persistent storage (saved to the
  user's Claude account, so it syncs across devices). Fall back to `localStorage` only if that
  storage isn't available, and say so.
- AI features (photo to calories, summaries, suggestions) use the artifact platform's built-in
  model access. Never ask for or embed an API key.
- No sample data that looks real; start empty with a clear first action.

Publish the artifact and get its link:
- If your tool returns the link (for example `https://claude.ai/artifact/<id>`), use it.
- Otherwise ask the user to open the artifact's **Share** or **Publish** menu, copy the link and
  paste it. That's the only thing they need to do.

## 2. Pick name and colors

- `name`: what the user calls the app, at most 40 characters.
- `short-name`: home-screen label, at most 12 characters (longer labels get cut on Android).
- `theme`: the app's accent color; `background`: its page background. Both `#rrggbb`.

## 3. Draw the icon

Write `icon.svg`, a square icon that says what the app does at a glance:
- `viewBox="0 0 512 512"` and a full-bleed `<rect width="512" height="512" fill="...">` first.
- Keep all artwork inside the centre circle of radius 204: Android crops the rest.
- One symbol drawn from the app's own content (its goals, its main object), two or three colors,
  strokes at least 28 px thick so it reads at small sizes.
- Only `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `path`, `g`, `defs`,
  `linearGradient`, `radialGradient`, `stop`. No `<text>`,
  no `<image>`, `<use>`, `<filter>` or `<style>`, no external `href`, no scripts. The install
  page rejects those.
- Under 4 KB.

## 4. Make the install link

```bash
python scripts/make_link.py --github-user "<username>" --name "<Name>" --short-name "<Short>" \
  --url "<artifact link>" --icon icon.svg --theme "#rrggbb" --background "#rrggbb"
```

Run it from this skill's folder (`${CLAUDE_SKILL_DIR}` in Claude Code). It prints one link and
needs no network or token. The link opens the install page on the user's GitHub Pages, which
builds the app's name, manifest and icons inside the phone's browser.

If the link shows GitHub's 404 page, their Pages isn't on yet: point them back to step 0.

## 5. Reply

Give the link and these steps, nothing more:

- **Android (Chrome):** open the link, tap **Install**. If there's no button: ⋮ menu →
  **Add to home screen** → **Install**.
- **iPhone (Safari):** open the link, **Share** → **Add to Home Screen** → **Add**.

Private artifacts open only where the user is logged in to claude.ai in that browser.

## Changing an app later

- The app itself: update the artifact; the installed icon opens the new version automatically.
- Name or icon: make a new link (step 4) and install it again; remove the old icon.
