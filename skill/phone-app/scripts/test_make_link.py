import base64
import json

import pytest

from make_link import build_link, install_page_url

ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512"/></svg>'
URL = "https://claude.ai/artifact/KCdiBd2sJsor6XgBANT41e"
PAGE = "https://octo-user.github.io/claude-phone-apps/"
PREFIX = f"{PAGE}?app="


def decode(link: str) -> dict:
    payload = link[len(PREFIX):]
    padded = payload + "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))


def test_install_page_is_on_the_users_own_github_pages():
    assert install_page_url("octo-user") == PAGE
    assert install_page_url("Octo-User") == PAGE


def test_install_page_supports_a_renamed_repo():
    assert install_page_url("octo-user", "my-apps") == "https://octo-user.github.io/my-apps/"


@pytest.mark.parametrize("bad", ["", "-octo", "octo-", "oc--to", "octo_user", "a" * 40, "octo/evil"])
def test_install_page_rejects_invalid_usernames(bad):
    with pytest.raises(ValueError, match="GitHub username"):
        install_page_url(bad)


@pytest.mark.parametrize("bad", ["", "../x", "my apps", "a/b"])
def test_install_page_rejects_invalid_repo_names(bad):
    with pytest.raises(ValueError, match="repository name"):
        install_page_url("octo-user", bad)


def test_link_points_at_the_install_page():
    assert build_link(PAGE, "Water Log", URL, ICON, "#1f6f8b", "#f2f6f8").startswith(PREFIX)


def test_link_payload_holds_every_value():
    link = build_link(PAGE, "Water Log", URL, ICON, "#1f6f8b", "#f2f6f8", short_name="Water")
    assert decode(link) == {
        "n": "Water Log",
        "s": "Water",
        "u": URL,
        "t": "#1f6f8b",
        "b": "#f2f6f8",
        "i": ICON,
    }


def test_short_name_is_left_out_when_not_given():
    assert "s" not in decode(build_link(PAGE, "Water Log", URL, ICON, "#1f6f8b", "#f2f6f8"))


def test_payload_is_url_safe_and_keeps_non_ascii_names():
    link = build_link(PAGE, "Café Trainer ✓", URL, ICON + "?" * 50, "#1f6f8b", "#f2f6f8")
    payload = link[len(PREFIX):]
    assert all(char.isalnum() or char in "-_" for char in payload)
    assert decode(link)["n"] == "Café Trainer ✓"
