# Phone apps from Claude

Need a small app? A food tracker, a habit list, a gym log, a budget split for a trip?

Don't pay for one, and don't wait for someone to build it. Tell Claude what you want. About a
minute later it's on your phone's home screen with its own name and icon, and it opens like any
other app.

```
You:    "Make me a water tracker for my phone. Goal 2.5 L, quick buttons for a glass and a bottle."
Claude: builds the app, draws its icon, replies with one link
You:    open the link on your phone → Install
```

## Why this instead of an app from the store

- **Free and yours.** No subscription, no ads, no account with another company. If you want a
  change, ask Claude: "add a weekly chart", "make the buttons bigger". The installed icon opens the
  new version.
- **AI built in, no API keys.** The apps run as Claude artifacts, so they can use Claude itself:
  log a meal from a photo, summarise your week, suggest the next workout. It runs on your existing
  Claude plan; there's no key to create, paste or pay for separately.
- **Your data follows you.** Artifacts can save to your Claude account, so the same app shows the
  same data on your phone and your computer.
- **Works from the Claude app on your phone.** Claude Code (the CLI) can build and ship apps, but
  it doesn't run on a phone. This skill brings the last step, "put it on my home screen", into a
  normal chat in the Claude app.

## Set it up (once)

**Claude app or claude.ai**

1. Download [`phone-app.zip`](dist/phone-app.zip).
2. In Claude, open **Settings → Capabilities**, turn on **Code execution**, and upload the zip
   under **Skills**.
3. In any chat: *"Build me a … for my phone."*

**Claude Code**

Copy [`skill/phone-app`](skill/phone-app) to `~/.claude/skills/phone-app`.

## What happens

1. **Claude builds the app** as an artifact designed for a phone: big buttons, saved data, light
   and dark mode.
2. **You share its link once** if Claude can't see it: artifact menu → **Share** → copy link.
3. **Claude draws an icon** that fits the app and makes an install link.
4. **You open the link on your phone:**
   - Android (Chrome): tap **Install**. No button? ⋮ menu → **Add to home screen** → **Install**.
   - iPhone (Safari): **Share** → **Add to Home Screen** → **Add**.

Already have an artifact? Send its link: *"Put this on my home screen with a nice icon:
https://claude.ai/artifact/…"*

## How the install link works

Chrome and Safari take a home-screen icon and name from the page you install, and a claude.ai
link always carries Claude's own. So the link points to one static install page in this repo
([`docs/`](docs/), served by GitHub Pages) instead. The whole app (name, colors, icon drawing
and artifact link) is packed into the link itself. Your phone's browser turns it into the page's
name, manifest and PNG icons. Opening the installed icon goes straight to your artifact on
claude.ai.

There's no server and no database: nothing is uploaded or stored anywhere. The page only ever
forwards to `claude.ai` artifact links and shows which one before you install. Private
artifacts still need you to be logged in to claude.ai in that browser.

## Known limits

- Android may show a thin claude.ai address bar at the top of the app, because the app lives on
  claude.ai, not on the launcher's site.
- iPhone has no one-tap install; Safari's Share menu is the only way.
- If Claude can't see the artifact's link, you copy it once from the Share menu.

## Host your own install page

The skill works as-is with the install page of this repo. To run your own copy:

1. Fork this repo.
2. In your fork: **Settings → Pages → Deploy from a branch → `main` / `docs`**.
3. Set `INSTALL_PAGE_URL` in [`skill/phone-app/scripts/make_link.py`](skill/phone-app/scripts/make_link.py)
   to `https://<your-username>.github.io/claude-phone-apps/`.
4. Rebuild the zip: `python scripts/build_zip.py`.

## Development

```bash
npm test                                            # install page: link checks and manifest
python -m pytest skill/phone-app/scripts            # link builder
```

## Project layout

| Path | What it is |
|---|---|
| `skill/phone-app/` | The skill: instructions for Claude and the link builder (Python, no dependencies) |
| `docs/` | The install page, served by GitHub Pages |
| `tests/` | Tests for the install page's link checks and manifest |
| `dist/phone-app.zip` | The skill packaged for upload to the Claude app |
