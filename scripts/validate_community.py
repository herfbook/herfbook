#!/usr/bin/env python3
"""Validate community YAML data files.

Checks:
  1. YAML syntax — no parse errors
  2. Structure  — correct top-level key, entries must be a list
  3. Required fields — each entry has the mandatory fields for its file type
  4. Duplicates — no duplicate names or community_keys within a file
  5. Sort order — entries are alphabetically sorted by name (case-insensitive)
     Exempt files (logical ordering takes precedence): strength_levels,
     purchase_types, environments.

Exit 0 if all files are valid, 1 if any errors are found.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Any

import yaml

COMMUNITY_DIR = Path(__file__).parent.parent / "community"

# Required fields per community file type.
# vitolas is intentionally stricter — dimensions are load-bearing for display.
SCHEMAS: dict[str, list[str]] = {
    "brands":          ["name"],
    "binders":         ["name"],
    "countries":       ["name"],
    "environments":    ["name"],
    "fillers":         ["name"],
    "flavor_tags":     ["name", "category"],
    "manufacturers":   ["name"],
    "purchase_types":  ["name"],
    "strength_levels": ["name"],
    "vitolas":         ["name", "length_inches", "ring_gauge", "category"],
    "wrappers":        ["name"],
}

SORT_EXEMPT: set[str] = {"environments", "purchase_types", "strength_levels"}


def validate_file(path: Path) -> list[str]:
    """Return a list of error strings for a single community YAML file."""
    errors: list[str] = []
    stem = path.stem

    if stem not in SCHEMAS:
        errors.append(f"{path.name}: unrecognised file — not in schema registry")
        return errors

    required_fields = SCHEMAS[stem]

    # 1. Parse YAML ────────────────────────────────────────────────────────
    try:
        with path.open(encoding="utf-8") as fh:
            data: Any = yaml.safe_load(fh)
    except yaml.YAMLError as exc:
        errors.append(f"{path.name}: YAML parse error — {exc}")
        return errors

    if not data:
        return []  # empty file is fine during bootstrap

    # 2. Top-level key and list structure ──────────────────────────────────
    if stem not in data:
        errors.append(f"{path.name}: missing top-level key '{stem}'")
        return errors

    entries = data[stem]
    if not isinstance(entries, list):
        errors.append(f"{path.name}: '{stem}' must be a list, got {type(entries).__name__}")
        return errors

    if not entries:
        return []  # zero entries is fine during bootstrap

    # 3. Required fields ───────────────────────────────────────────────────
    for idx, entry in enumerate(entries):
        if not isinstance(entry, dict):
            errors.append(f"{path.name}[{idx}]: entry is not a mapping")
            continue
        label = repr(entry.get("name", f"entry {idx}"))
        for field in required_fields:
            value = entry.get(field)
            if value is None or value == "":
                errors.append(
                    f"{path.name}[{idx}] {label}: missing required field '{field}'"
                )

    # 4. Duplicate detection ───────────────────────────────────────────────
    def check_dupes(values: list[str | None], field_label: str) -> None:
        seen: set[str] = set()
        for v in values:
            if v is None:
                continue
            key = str(v).casefold()
            if key in seen:
                errors.append(f"{path.name}: duplicate {field_label} {v!r}")
            seen.add(key)

    names = [e.get("name") if isinstance(e, dict) else None for e in entries]
    ckeys = [
        e.get("community_key")
        for e in entries
        if isinstance(e, dict) and e.get("community_key")
    ]
    check_dupes(names, "name")
    check_dupes(ckeys, "community_key")

    # 5. Sort check (alphabetical by name, case-insensitive) ───────────────
    if stem not in SORT_EXEMPT:
        valid_names = [n for n in names if n is not None]
        sorted_names = sorted(valid_names, key=str.casefold)
        if valid_names != sorted_names:
            for idx, (actual, expected) in enumerate(zip(valid_names, sorted_names)):
                if actual != expected:
                    errors.append(
                        f"{path.name}: entries not sorted by name — "
                        f"position {idx} has {actual!r}, expected {expected!r}"
                    )
                    break

    return errors


def main() -> int:
    yml_files = sorted(COMMUNITY_DIR.glob("*.yml"))

    if not yml_files:
        print("No community YAML files found", file=sys.stderr)
        return 1

    total_errors = 0
    for path in yml_files:
        errors = validate_file(path)
        if errors:
            for msg in errors:
                print(f"  FAIL  {msg}")
            total_errors += len(errors)
        else:
            print(f"  OK    {path.name}")

    print()
    if total_errors:
        print(f"{total_errors} error(s) found across {len(yml_files)} files")
        return 1

    print(f"All {len(yml_files)} community files valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
