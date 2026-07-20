#!/usr/bin/env python3
"""Validate Sprint 0 repository invariants without third-party dependencies."""

from __future__ import annotations

import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

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
        if not path.is_file() or ".git" in path.parts or "node_modules" in path.parts:
            continue
        if path.suffix.lower() in TEXT_SUFFIXES or path.name.startswith(".env"):
            files.append(path)
    return files


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

    if errors:
        print("Validation du dépôt échouée :")
        for error in errors:
            print(f"- {error}")
        return 1

    print("Validation Sprint 0 réussie : structure présente, UTF-8 valide, aucun secret détecté.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
