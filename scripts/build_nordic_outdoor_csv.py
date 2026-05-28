#!/usr/bin/env python3
"""
Assemble source/beach-volleyball/nordic_outdoor_beach_volleyball_courts.csv from:

  Finland — source/beach-volleyball/finland_outdoor_beach_volleyball_courts.csv
    National open-data API (LIPAS), CC BY 4.0. Refresh with:
      python3 scripts/update_finland_outdoor_courts.py

  Sweden, Norway, Denmark, Estonia, Latvia, Lithuania, Iceland — OpenStreetMap
    Overpass API (same queries as scripts/fetch_outdoor_osm.py). ODbL:
    https://www.openstreetmap.org/copyright

  Norway (supplementary reference, not imported automatically) — federation map:
    https://volleyball.no/hvor-kan-du-spille-sandvolleyball/

  Estonia (supplementary) — national sports facilities register (manual / future script):
    https://www.spordiregister.ee/

  Latvia — sporta bāzu reģistrs (manual / future):
    https://www.izm.gov.lv/lv/sporta-bazu-registrs

  Lithuania — Lietuvos sporto registras (manual / future):
    https://sportoregistras.lt/

After this script, run:
  python3 scripts/add_permalinks.py
"""

from __future__ import annotations

import csv
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FINLAND_CSV = ROOT / "source" / "beach-volleyball" / "finland_outdoor_beach_volleyball_courts.csv"
OUT_CSV = ROOT / "source" / "beach-volleyball" / "nordic_outdoor_beach_volleyball_courts.csv"

# Import fetch helpers (scripts/ on sys.path when run from repo root).
import importlib.util

_spec = importlib.util.spec_from_file_location(
    "fetch_outdoor_osm", ROOT / "scripts" / "fetch_outdoor_osm.py"
)
_fetch = importlib.util.module_from_spec(_spec)
assert _spec.loader is not None
_spec.loader.exec_module(_fetch)


def load_finland_rows() -> list[dict]:
    with open(FINLAND_CSV, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def fetch_country_rows(iso2: str) -> list[dict]:
    country_name, _ = _fetch.COUNTRIES[iso2]
    print(f"[{iso2}] resolving area…", file=sys.stderr, flush=True)
    area_id = _fetch.get_area_id(iso2)
    print(f"[{iso2}] area_id={area_id}, overpass…", file=sys.stderr, flush=True)
    time.sleep(2)
    elements = _fetch.fetch_courts(area_id)
    print(f"[{iso2}] {len(elements)} raw elements", file=sys.stderr, flush=True)
    seen: set[str] = set()
    rows: list[dict] = []
    for el in elements:
        key = f"{el['type']}-{el['id']}"
        if key in seen:
            continue
        seen.add(key)
        row = _fetch.osm_to_row(el, country_name)
        if row:
            rows.append(row)
    print(f"[{iso2}] {len(rows)} rows after dedupe", file=sys.stderr, flush=True)
    time.sleep(3)
    return rows


def main() -> None:
    if not FINLAND_CSV.is_file():
        print(f"Missing {FINLAND_CSV}", file=sys.stderr)
        sys.exit(1)

    finland = load_finland_rows()
    if not finland:
        print("Finland CSV is empty", file=sys.stderr)
        sys.exit(1)

    # OSM-backed countries in a stable order (Finland always first).
    osm_codes = ("SE", "NO", "DK", "EE", "LV", "LT", "IS")
    osm_rows: list[dict] = []
    for code in osm_codes:
        try:
            osm_rows.extend(fetch_country_rows(code))
        except Exception as exc:
            print(f"[{code}] FAILED: {exc}", file=sys.stderr)
            sys.exit(1)

    fieldnames = list(_fetch.CSV_COLUMNS)
    # Permalinks filled by add_permalinks.py (needs column present for readers).
    fieldnames.append("permalink")

    all_rows = finland + osm_rows
    for r in all_rows:
        r.setdefault("permalink", "")

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames, extrasaction="ignore")
        w.writeheader()
        w.writerows(all_rows)

    print(
        f"Wrote {len(all_rows)} rows ({len(finland)} Finland + {len(osm_rows)} OSM) → {OUT_CSV}",
        file=sys.stderr,
    )


if __name__ == "__main__":
    main()
