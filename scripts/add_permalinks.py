#!/usr/bin/env python3
"""
One-time (and repeatable) script that stamps a `permalink` column onto
nordic_outdoor_beach_volleyball_courts.csv so the browser JS never has to
transliterate or slugify at runtime.

Usage:
  python3 scripts/add_permalinks.py
  # rewrites the CSV in-place

The permalink format is:  {country_prefix}-out-{id}-{name_slug}
where country_prefix is the two-letter ISO code lowercased and id is the
lipas_id (or idx-N fallback).  Finland uses the fi-out- prefix for
historical compatibility.
"""

import csv
import re
import sys
import unicodedata
from pathlib import Path

CSV_PATH = Path(__file__).parent.parent / "source" / "beach-volleyball" / "nordic_outdoor_beach_volleyball_courts.csv"

# Characters that Unicode NFD decomposition does NOT strip.
# Covers the full Nordic + Baltic inventory for FI/SE/NO/DK/IS/EE/LV/LT.
_TRANSLITERATE = str.maketrans({
    "ø": "oe", "Ø": "oe",
    "æ": "ae", "Æ": "ae",
    "ð": "d",  "Ð": "d",
    "þ": "th", "Þ": "th",
    "ß": "ss", "ẞ": "ss",
    # Latvian comma-below / cedilla letters
    "ģ": "g",  "Ģ": "g",
    "ķ": "k",  "Ķ": "k",
    "ļ": "l",  "Ļ": "l",
    "ņ": "n",  "Ņ": "n",
    "ŗ": "r",  "Ŗ": "r",
    # Lithuanian dotted e
    "ė": "e",  "Ė": "e",
})

COUNTRY_FROM_NAME = {
    "FINLAND": "FI", "SWEDEN": "SE", "NORWAY": "NO",
    "DENMARK": "DK", "ESTONIA": "EE", "LATVIA": "LV",
    "LITHUANIA": "LT", "ICELAND": "IS",
}


def slugify(s: str) -> str:
    if not s:
        return ""
    s = s.translate(_TRANSLITERATE)
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = s.lower()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def make_permalink(row: dict, idx: int) -> str:
    raw_country = (row.get("country") or "").upper()
    country = COUNTRY_FROM_NAME.get(raw_country, raw_country[:2] or "XX")
    lipas_id = row.get("lipas_id") or f"idx-{idx}"
    prefix = "fi" if country == "FI" else country.lower()
    bare_id = f"{prefix}-out-{lipas_id}"
    name_slug = slugify(row.get("facility_name") or "")
    return f"{bare_id}-{name_slug}" if name_slug else bare_id


def main() -> None:
    with open(CSV_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    fieldnames = list(rows[0].keys()) if rows else []
    if "permalink" not in fieldnames:
        fieldnames.append("permalink")

    for idx, row in enumerate(rows):
        row.pop(None, None)  # strip overflow values from rows with extra commas
        row["permalink"] = make_permalink(row, idx)

    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Stamped permalink on {len(rows)} rows → {CSV_PATH}", file=sys.stderr)


if __name__ == "__main__":
    main()
