#!/usr/bin/env python3
"""Validate Sprint 0 repository invariants without third-party dependencies."""

from __future__ import annotations

import re
import sys
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IGNORED_DIRECTORIES = {
    '.git',
    'node_modules',
    'dist',
    'build',
    'coverage',
    'playwright-report',
    'test-results',
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
        if not path.is_file() or IGNORED_DIRECTORIES.intersection(path.relative_to(ROOT).parts):
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name.startswith(".env"):
            files.append(path)
    return files



def validate_isometric_assets(errors: list[str]) -> None:
    if not RUNTIME_MANIFEST.is_file():
        errors.append("Manifeste runtime isométrique absent : apps/game/public/assets/isometric/manifest.json")
        return
    try:
        manifest = json.loads(RUNTIME_MANIFEST.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Manifeste runtime isométrique JSON invalide : {exc}")
        return
    ids: set[str] = set()
    declared: set[Path] = set()
    total = 0
    for asset in manifest.get("assets", []):
        asset_id = asset.get("id", "<id absent>")
        if asset_id in ids:
            errors.append(f"{asset_id}: identifiant dupliqué dans le manifeste runtime")
        ids.add(asset_id)
        path_value = asset.get("path", "")
        if path_value.startswith("/") or ".." in Path(path_value).parts:
            errors.append(f"{asset_id}: chemin relatif public non sûr ({path_value})")
            continue
        if not path_value.startswith("assets/isometric/"):
            errors.append(f"{asset_id}: chemin incompatible GitHub Pages ({path_value})")
        suffix = Path(path_value).suffix.lower()
        if suffix not in {".svg", ".webp"}:
            errors.append(f"{asset_id}: extension runtime interdite ({suffix})")
        if suffix in FORBIDDEN_RUNTIME_SUFFIXES:
            errors.append(f"{asset_id}: source maître interdite dans les assets runtime ({path_value})")
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
            total += size
            budget = int(asset.get("budgetBytes", 0))
            if budget and size > budget:
                errors.append(f"{asset_id}: poids {size} octets > budget {budget}")
        fallback = asset.get("fallbackId")
        if fallback and fallback not in [candidate.get("id") for candidate in manifest.get("assets", [])]:
            errors.append(f"{asset_id}: fallback absent ({fallback})")
        dims = asset.get("dimensions", {})
        if dims.get("width", 0) <= 0 or dims.get("height", 0) <= 0:
            errors.append(f"{asset_id}: dimensions déclarées incohérentes")
        if asset.get("mirrorOf") and asset.get("orientation") == "omni":
            errors.append(f"{asset_id}: miroir incohérent avec orientation omni")
    for file_path in ASSET_ROOT.rglob("*"):
        if file_path.is_file() and file_path.name != "manifest.json" and file_path not in declared:
            errors.append(f"Fichier asset non déclaré : {file_path.relative_to(ROOT)}")
    if total > 1024 * 1024:
        errors.append(f"Lot pilote 2B.1 trop lourd : {total} octets")

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

    print("Validation Sprint 0 réussie : structure présente, UTF-8 valide, aucun secret détecté.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
