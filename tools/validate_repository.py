#!/usr/bin/env python3
"""Validate repository invariants without third-party dependencies."""

from __future__ import annotations

import json
import re
import struct
import sys
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
    "docs/README.md",
    "docs/product/vision.md",
    "docs/architecture/overview.md",
    "docs/architecture/repository-structure.md",
    "docs/architecture/runtime.md",
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

PACKAGE_IMPORT_PATTERN = re.compile(
    r'(?:from\s+|import\s+)["\'](@gargotte/[a-z-]+)["\']'
)
ALLOWED_PACKAGE_DEPENDENCIES = {
    "audio": set(),
    "common": set(),
    "content-schema": set(),
    "engine": {"common"},
    "renderer": {"common", "engine"},
    "save": {"engine"},
    "ui": {"engine"},
}
SOURCE_LINE_LIMITS = {
    "apps/game/src/main.ts": 80,
    "packages/renderer/src/index.ts": 120,
}
GENERAL_SOURCE_LINE_LIMIT = 350
DOCUMENTATION_INDEX_REFERENCES = (
    "architecture/overview.md",
    "architecture/repository-structure.md",
    "architecture/runtime.md",
    "architecture/tactical-room.md",
    "design/sprint-2b3-bastognac-environment.md",
    "external/sprint-2-drive-content.md",
)


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


def iter_typescript_source_files() -> list[Path]:
    files: list[Path] = []
    for root_name in ("apps", "packages", "tools", "tests"):
        root = ROOT / root_name
        if not root.exists():
            continue
        files.extend(path for path in root.rglob("*.ts") if path.is_file())
        files.extend(path for path in root.rglob("*.tsx") if path.is_file())
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


def validate_package_boundaries(errors: list[str]) -> None:
    dependency_graph: dict[str, set[str]] = {
        package: set() for package in ALLOWED_PACKAGE_DEPENDENCIES
    }
    for path in iter_typescript_source_files():
        relative = path.relative_to(ROOT)
        if len(relative.parts) < 3 or relative.parts[0] != "packages":
            continue
        package = relative.parts[1]
        if package not in ALLOWED_PACKAGE_DEPENDENCIES:
            continue
        content = path.read_text(encoding="utf-8")
        for alias in PACKAGE_IMPORT_PATTERN.findall(content):
            target = alias.split("/", 1)[1]
            if target == package:
                continue
            dependency_graph[package].add(target)
            if target not in ALLOWED_PACKAGE_DEPENDENCIES[package]:
                errors.append(
                    f"Frontière de package interdite : {relative} importe {alias}"
                )

    visiting: set[str] = set()
    visited: set[str] = set()

    def visit(package: str, path: list[str]) -> None:
        if package in visiting:
            errors.append(
                "Cycle de packages détecté : " + " -> ".join([*path, package])
            )
            return
        if package in visited:
            return
        visiting.add(package)
        for dependency in dependency_graph.get(package, set()):
            if dependency in dependency_graph:
                visit(dependency, [*path, package])
        visiting.remove(package)
        visited.add(package)

    for package in dependency_graph:
        visit(package, [])


def validate_source_structure(errors: list[str]) -> None:
    for path in iter_typescript_source_files():
        relative = path.relative_to(ROOT).as_posix()
        if ".test." in path.name or relative.startswith("tests/"):
            continue
        lines = len(path.read_text(encoding="utf-8").splitlines())
        limit = SOURCE_LINE_LIMITS.get(relative, GENERAL_SOURCE_LINE_LIMIT)
        if lines > limit:
            errors.append(f"Module trop volumineux : {relative} ({lines} lignes > {limit})")

    renderer_root = ROOT / "packages/renderer/src"
    for path in renderer_root.rglob("*.ts"):
        if ".test." in path.name:
            continue
        content = path.read_text(encoding="utf-8").lower()
        if "bastognac" in content:
            errors.append(
                "Le renderer générique connaît encore Bastognac : "
                f"{path.relative_to(ROOT)}"
            )

    main_path = ROOT / "apps/game/src/main.ts"
    if main_path.is_file() and "@gargotte/engine" in main_path.read_text(
        encoding="utf-8"
    ):
        errors.append("main.ts doit rester un point d’entrée sans logique moteur")

    if (ROOT / "public/icon.svg").exists():
        errors.append("Icône publique dupliquée : public/icon.svg")


def validate_design_tokens(errors: list[str]) -> None:
    token_json = ROOT / "design/isometric/tokens.json"
    token_css = ROOT / "design/isometric/tokens.css"
    if not token_json.is_file() or not token_css.is_file():
        return
    try:
        tokens = json.loads(token_json.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        errors.append(f"Tokens isométriques JSON invalides : {exc}")
        return
    css = token_css.read_text(encoding="utf-8").lower()
    primitives = tokens.get("color", {}).get("primitive", {})
    for name, value in primitives.items():
        if isinstance(value, str) and value.lower() not in css:
            errors.append(f"Token couleur absent de tokens.css : {name}={value}")


def validate_documentation_index(errors: list[str]) -> None:
    index = ROOT / "docs/README.md"
    if not index.is_file():
        return
    content = index.read_text(encoding="utf-8")
    for reference in DOCUMENTATION_INDEX_REFERENCES:
        if reference not in content:
            errors.append(f"Document absent de l’index docs/README.md : {reference}")


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
    validate_package_boundaries(errors)
    validate_source_structure(errors)
    validate_design_tokens(errors)
    validate_documentation_index(errors)

    if errors:
        print("Validation du dépôt échouée :")
        for error in errors:
            print(f"- {error}")
        return 1

    print(
        "Validation réussie : structure, frontières, UTF-8, secrets, assets et "
        "documentation cohérents."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
