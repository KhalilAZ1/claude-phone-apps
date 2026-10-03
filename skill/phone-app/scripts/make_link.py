"""Build the install link for a Claude artifact as a phone app.

Usage:
  python make_link.py --github-user <username> --name "Water Log" \
      --url https://claude.ai/artifact/<id> --icon icon.svg \
      --theme "#1f6f8b" --background "#f2f6f8" [--short-name "Water"] [--repo claude-phone-apps]

Prints one link to the install page on the user's own GitHub Pages (their fork of
claude-phone-apps). Open it on the phone to install the app with its own name and icon.
The install page checks every value and shows the reason when something is wrong.
"""

import argparse
import base64
import json
import re
from pathlib import Path

DEFAULT_REPO = "claude-phone-apps"
GITHUB_USERNAME = re.compile(r"^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$")
GITHUB_REPO = re.compile(r"^[A-Za-z0-9_.-]{1,100}$")


def install_page_url(github_user: str, repo: str = DEFAULT_REPO) -> str:
    if not GITHUB_USERNAME.match(github_user):
        raise ValueError(f"Not a valid GitHub username: {github_user!r}")
    if not GITHUB_REPO.match(repo) or repo in {".", ".."}:
        raise ValueError(f"Not a valid GitHub repository name: {repo!r}")
    return f"https://{github_user.lower()}.github.io/{repo}/"


def build_link(
    page_url: str,
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
    return f"{page_url}?app={payload}"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--github-user", required=True, help="GitHub account hosting the install page")
    parser.add_argument("--repo", default=DEFAULT_REPO, help="name of the user's fork")
    parser.add_argument("--name", required=True)
    parser.add_argument("--short-name")
    parser.add_argument("--url", required=True, help="claude.ai artifact link")
    parser.add_argument("--icon", required=True, help="path to the square SVG icon")
    parser.add_argument("--theme", required=True, help="#rrggbb accent color")
    parser.add_argument("--background", required=True, help="#rrggbb background color")
    args = parser.parse_args()
    page_url = install_page_url(args.github_user, args.repo)
    svg = Path(args.icon).read_text(encoding="utf-8").strip()
    print(build_link(page_url, args.name, args.url, svg, args.theme, args.background, args.short_name))


if __name__ == "__main__":
    main()
