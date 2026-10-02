"""Build the install link for a Claude artifact as a phone app.

Usage:
  python make_link.py --name "Water Log" --url https://claude.ai/artifact/<id> \
      --icon icon.svg --theme "#1f6f8b" --background "#f2f6f8" [--short-name "Water"]

Prints one link. Open it on the phone to install the app with its own name and icon.
The install page checks every value and shows the reason when something is wrong.
"""

import argparse
import base64
import json
from pathlib import Path

# The install page (docs/ in the repo, served by GitHub Pages). Forks: change to your own Pages URL.
INSTALL_PAGE_URL = "https://khalilaz1.github.io/claude-phone-apps/"


def build_link(
    name: str,
    artifact_url: str,
    icon_svg: str,
    theme: str,
    background: str,
    short_name: str | None = None,
) -> str:
    data = {"n": name, "u": artifact_url, "t": theme, "b": background, "i": icon_svg}
    if short_name:
        data["s"] = short_name
    raw = json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode("utf-8")
    payload = base64.urlsafe_b64encode(raw).decode("ascii").rstrip("=")
    return f"{INSTALL_PAGE_URL}?app={payload}"


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--name", required=True)
    parser.add_argument("--short-name")
    parser.add_argument("--url", required=True, help="claude.ai artifact link")
    parser.add_argument("--icon", required=True, help="path to the square SVG icon")
    parser.add_argument("--theme", required=True, help="#rrggbb accent color")
    parser.add_argument("--background", required=True, help="#rrggbb background color")
    args = parser.parse_args()
    svg = Path(args.icon).read_text(encoding="utf-8").strip()
    print(build_link(args.name, args.url, svg, args.theme, args.background, args.short_name))


if __name__ == "__main__":
    main()
