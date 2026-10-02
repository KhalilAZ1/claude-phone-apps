import base64
import json

from make_link import INSTALL_PAGE_URL, build_link

ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512"/></svg>'
URL = "https://claude.ai/artifact/KCdiBd2sJsor6XgBANT41e"
PREFIX = f"{INSTALL_PAGE_URL}?app="


def decode(link: str) -> dict:
    payload = link[len(PREFIX):]
    padded = payload + "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))


def test_link_points_at_the_install_page():
    assert build_link("Water Log", URL, ICON, "#1f6f8b", "#f2f6f8").startswith(PREFIX)


def test_link_payload_holds_every_value():
    link = build_link("Water Log", URL, ICON, "#1f6f8b", "#f2f6f8", short_name="Water")
    assert decode(link) == {
        "n": "Water Log",
        "s": "Water",
        "u": URL,
        "t": "#1f6f8b",
        "b": "#f2f6f8",
        "i": ICON,
    }


def test_short_name_is_left_out_when_not_given():
    assert "s" not in decode(build_link("Water Log", URL, ICON, "#1f6f8b", "#f2f6f8"))


def test_payload_is_url_safe_and_keeps_non_ascii_names():
    link = build_link("Café Trainer ✓", URL, ICON + "?" * 50, "#1f6f8b", "#f2f6f8")
    payload = link[len(PREFIX):]
    assert all(char.isalnum() or char in "-_" for char in payload)
    assert decode(link)["n"] == "Café Trainer ✓"
