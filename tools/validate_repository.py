#!/usr/bin/env python3
"""Validate repository invariants without third-party dependencies."""

from __future__ import annotations

import json
import re
import sys
import struct
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRECTORIES = {
    ".git",
    "node_modules",
    "dist",
    "build",
    "coverage",
    "playwright-report",
    "test-results",
}

REQUIRED_FILES = (
    "README.md",
    "CONTRIBUTING.md",
    "SECURITY.md",
    ".gitignore",
    ".editorconfig",
    ".github/CODEOWNERS",
    ".github/PULL_REQUEST_TEMPLATE.md",
    "docs/product/vision.md",
    "docs/architecture/overview.md",
    "docs/architecture/repository-structure.md",
    "docs/roadmap.md",
    "docs/sprints/sprint-0.md",
    "docs/security/secrets.md",
    "docs/adr/README.md",
)

SECRET_PATTERNS = {
    "OpenAI project key": re.compile(r"sk-(?:proj-)?[A-Za-z0-9_-]{20,}"),
    "private key": re.compile(r"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"),
    "assigned API key": re.compile(r"OPENAI_API_KEY\s*=\s*[^\s#]+"),
}

FORBIDDEN_RUNTIME_SUFFIXES = {".pdf", ".psd", ".png"}
ALLOWED_RUNTIME_SUFFIXES = {".svg", ".webp"}
ASSET_ROOT = ROOT / "apps/game/public/assets/isometric"
RUNTIME_MANIFEST = ASSET_ROOT / "manifest.json"

TEXT_SUFFIXES = {
    ".md",
    ".txt",
    ".json",
    ".yml",
    ".yaml",
    ".toml",
    ".js",
    ".ts",
    ".tsx",
    ".css",
    ".html",
    ".py",
    ".env",
}


def iter_text_files() -> list[Path]:
    files: list[Path] = []
    for path in ROOT.rglob("*"):
        if not path.is_file() or IGNORED_DIRECTORIES.intersection(
            path.relative_to(ROOT).parts
        ):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name.startswith(".env"):
            files.append(path)
    return files


def read_webp_dimensions(path: Path) -> tuple[int, int] | None:
    data = path.read_bytes()
    if len(data) < 20 or data[:4] != b"RIFF" or data[8:12] != b"WEBP":
        return None
    offset = 12
    while offset + 8 <= len(data):
        chunk = data[offset : offset + 4]
        size = struct.unpack("<I", data[offset + 4 : offset + 8])[0]
        payload = offset + 8
        if chunk == b"VP8X" and payload + 10 <= len(data):
            width = 1 + int.from_bytes(data[payload + 4 : payload + 7], "little")
            height = 1 + int.from_bytes(data[payload + 7 : payload + 10], "little")
            return width, height
        if chunk == b"VP8 " and payload + 10 <= len(data):
            if data[payload + 3 : payload + 6] != b"\x9d\x01\x2a":
                return None
            width = struct.unpack("<H", data[payload + 6 : payload + 8])[0] & 0x3FFF
            height = struct.unpack("<H", data[payload + 8 : payload + 10])[0] & 0x3FFF
            return width, height
        if chunk == b"VP8L" and payload + 5 <= len(data):
            if data[payload] != 0x2F:
                return None
            bits = int.from_bytes(data[payload + 1 : payload + 5], "little")
            width = 1 + (bits & 0x3FFF)
            height = 1 + ((bits >> 14) & 0x3FFF)
            return width, height
        offset = payload + size + (size % 2)
    return None


def validate_isometric_assets(errors: list[str]) -> None:
    if not RUNTIME_MANIFEST.is_file():
        errors.append(
            "Manifeste runtime isométrique absent : "
            "apps/game/public/assets/isometric/manifest.json"
        )
        return
    try:
        manifest = json.loads(RUNTIME_MANIFEST.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Manifeste runtime isométrique JSON invalide : {exc}")
        return

    assets = manifest.get("assets", [])
    budgets = manifest.get("budgets", {})
    total_budget = int(budgets.get("pilotTotalBytes", 0))
    sprite_budget = int(budgets.get("spritePilotBytes", 0))
    technical_budget = int(budgets.get("technicalAssetBytes", 0))
    all_ids = {candidate.get("id") for candidate in assets}
    variant_keys: set[str] = set()
    declared: set[Path] = set()
    counted_files: set[Path] = set()
    total = 0

    for asset in assets:
        asset_id = asset.get("id", "<id absent>")
        orientation = asset.get("orientation", "<orientation absente>")
        variant_key = f"{asset_id}@{orientation}"
        if variant_key in variant_keys:
            errors.append(
                f"{asset_id}: variante {orientation} dupliquée dans le manifeste runtime"
            )
        variant_keys.add(variant_key)

        path_value = asset.get("path", "")
        if path_value.startswith("/") or ".." in Path(path_value).parts:
            errors.append(f"{asset_id}: chemin relatif public non sûr ({path_value})")
            continue
        if not path_value.startswith("assets/isometric/"):
            errors.append(f"{asset_id}: chemin incompatible GitHub Pages ({path_value})")
        suffix = Path(path_value).suffix.lower()
        if suffix not in ALLOWED_RUNTIME_SUFFIXES:
            errors.append(f"{asset_id}: extension runtime interdite ({suffix})")
        if suffix in FORBIDDEN_RUNTIME_SUFFIXES:
            errors.append(
                f"{asset_id}: source maître interdite dans les assets runtime "
                f"({path_value})"
            )

        file_path = ROOT / "apps/game/public" / path_value
        try:
            file_path.relative_to(ASSET_ROOT)
        except ValueError:
            errors.append(f"{asset_id}: fichier hors dossier isométrique ({path_value})")
            continue

        if asset.get("required") and not file_path.is_file():
            errors.append(f"{asset_id}: fichier obligatoire absent ({path_value})")
            continue
        if file_path.is_file():
            declared.add(file_path)
            size = file_path.stat().st_size
            if file_path not in counted_files:
                total += size
                counted_files.add(file_path)
            budget = int(asset.get("budgetBytes", 0))
            if budget and size > budget:
                errors.append(f"{asset_id}: poids {size} octets > budget {budget}")
            if suffix == ".webp":
                dimensions = read_webp_dimensions(file_path)
                expected = (
                    asset.get("dimensions", {}).get("width"),
                    asset.get("dimensions", {}).get("height"),
                )
                if dimensions is None:
                    errors.append(f"{asset_id}: format WebP invalide ({path_value})")
                elif dimensions != expected:
                    errors.append(
                        f"{asset_id}: dimensions WebP "
                        f"{dimensions[0]}×{dimensions[1]} incohérentes avec le "
                        f"manifeste {expected[0]}×{expected[1]} ({path_value})"
                    )

        asset_budget = int(asset.get("budgetBytes", 0))
        category_limit = (
            sprite_budget if asset.get("category") == "character" else technical_budget
        )
        if category_limit and asset_budget > category_limit:
            errors.append(
                f"{asset_id}: budget déclaré {asset_budget} > limite {category_limit}"
            )

        fallback = asset.get("fallbackId")
        if fallback and fallback not in all_ids:
            errors.append(f"{asset_id}: fallback absent ({fallback})")
        dims = asset.get("dimensions", {})
        if dims.get("width", 0) <= 0 or dims.get("height", 0) <= 0:
            errors.append(f"{asset_id}: dimensions déclarées incohérentes")
        if asset.get("mirrorOf") and orientation == "omni":
            errors.append(f"{asset_id}: miroir incohérent avec orientation omni")
        if asset.get("mirrorOf", {}).get("orientation") == orientation:
            errors.append(f"{asset_id}: miroir identique à son orientation source")

    staging = ROOT / "design/isometric/pilot-sprites"
    if staging.exists() and any(staging.glob("*.webp")):
        errors.append("Copies WebP de staging non supprimées : design/isometric/pilot-sprites")

    for file_path in ASSET_ROOT.rglob("*"):
        if file_path.suffix.lower() in FORBIDDEN_RUNTIME_SUFFIXES:
            errors.append(f"Source runtime interdite : {file_path.relative_to(ROOT)}")
        if (
            file_path.is_file()
            and file_path.name != "manifest.json"
            and file_path not in declared
        ):
            errors.append(f"Fichier asset non déclaré : {file_path.relative_to(ROOT)}")
    if total_budget and total > total_budget:
        errors.append(f"Lot pilote 2B.1 trop lourd : {total} octets > {total_budget}")


def main() -> int:
    errors: list[str] = []

    for relative in REQUIRED_FILES:
        path = ROOT / relative
        if not path.is_file():
            errors.append(f"Fichier requis absent : {relative}")
        elif path.stat().st_size == 0:
            errors.append(f"Fichier requis vide : {relative}")

    for path in iter_text_files():
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            errors.append(f"Fichier texte non UTF-8 : {path.relative_to(ROOT)}")
            continue

        if content and not content.endswith("\n"):
            errors.append(f"Fin de ligne manquante : {path.relative_to(ROOT)}")

        for label, pattern in SECRET_PATTERNS.items():
            if pattern.search(content):
                errors.append(f"Secret potentiel ({label}) : {path.relative_to(ROOT)}")

    validate_isometric_assets(errors)

    if errors:
        print("Validation du dépôt échouée :")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Validation réussie : structure présente, UTF-8 valide, aucun secret détecté.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
