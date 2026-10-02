"""Package skill/phone-app as dist/phone-app.zip for upload to the Claude app (tests left out)."""

import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILL_DIR = ROOT / "skill" / "phone-app"
ZIP_PATH = ROOT / "dist" / "phone-app.zip"


def skill_files() -> list[Path]:
    return sorted(
        path
        for path in SKILL_DIR.rglob("*")
        if path.is_file() and "__pycache__" not in path.parts and not path.name.startswith("test_")
    )


def main() -> None:
    ZIP_PATH.parent.mkdir(exist_ok=True)
    with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as archive:
        for path in skill_files():
            archive.write(path, Path("phone-app") / path.relative_to(SKILL_DIR))
    print(ZIP_PATH)


if __name__ == "__main__":
    main()
