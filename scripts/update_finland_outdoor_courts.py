#!/usr/bin/env python3
"""
Fetch Finnish outdoor beach volleyball courts from the LIPAS open-data API
(type-code 1330, CC BY 4.0) and write them to
source/beach-volleyball/finland_outdoor_beach_volleyball_courts.csv.

To refresh the combined Nordic+Baltic map file, run next:
  python3 scripts/build_nordic_outdoor_csv.py && python3 scripts/add_permalinks.py

Manual overrides can be added to
source/beach-volleyball/finland_outdoor_overrides.csv using the same schema.
Overrides are matched by lipas_id; a row with the same lipas_id replaces the
generated row entirely.  Rows in the overrides file without a lipas_id are
appended as extra venues not in LIPAS.

Usage:
    python3 scripts/update_finland_outdoor_courts.py

Dependencies: only the Python 3 standard library.
"""

import csv
import json
import sys
import time
import urllib.request
from datetime import date
from pathlib import Path

API_BASE   = "https://api.lipas.fi/v2/sports-sites"
TYPE_CODE  = 1330            # Beachvolley-/rantalentopallokenttä
PAGE_SIZE  = 100
# Only include active courts (skip "out-of-service-permanently" etc.)
STATUSES   = "active"
DATA_CUTOFF = str(date.today())

OUT_CSV      = Path("source/beach-volleyball/finland_outdoor_beach_volleyball_courts.csv")
OVERRIDE_CSV = Path("source/beach-volleyball/finland_outdoor_overrides.csv")

HEADERS = [
    "country", "facility_name", "town", "address",
    "latitude", "longitude", "coord_precision",
    "outdoor_courts", "surface", "lighting", "free_use",
    "access", "owner", "lipas_id", "source_url",
    "data_cutoff", "fact_check_notes",
]

SURFACE_LABELS = {
    "sand":                        "sand",
    "gravel":                      "gravel",
    "rock-dust":                   "rock dust",
    "asphalt":                     "asphalt",
    "concrete":                    "concrete",
    "artificial-turf":             "artificial turf",
    "sand-infilled-artificial-turf": "sand-infilled artificial turf",
    "grass":                       "grass",
    "soil":                        "soil",
    "natural-surface":             "natural surface",
    "synthetic":                   "synthetic",
}

# Hard-surface material codes that disqualify a court as a loose-sand court.
# Type 1330 description is "soft basement", so courts with NO surface listed
# are treated as sand (benefit of the doubt). Any explicit hard surface means
# the court is excluded.
HARD_SURFACES = frozenset({
    "gravel", "rock-dust", "asphalt", "concrete",
    "artificial-turf", "sand-infilled-artificial-turf",
    "grass", "soil", "natural-surface", "synthetic",
    "ceramic", "stone", "metal", "woodchips",
    "sawdust", "resin", "textile", "carpet",
})


def is_sand_court(props: dict) -> bool:
    """Return True only for courts with loose-sand surface or unknown surface."""
    mats = props.get("surface-material") or []
    if not mats:
        return True   # type 1330 = "soft basement" — assume sand
    return all(m == "sand" for m in mats)


CITY_NAMES: dict[int, str] = {}  # reserved for future city-name enrichment


def fetch_page(page: int) -> dict:
    url = (
        f"{API_BASE}?type-codes={TYPE_CODE}"
        f"&page-size={PAGE_SIZE}&page={page}&statuses={STATUSES}"
    )
    with urllib.request.urlopen(url, timeout=30) as resp:
        return json.loads(resp.read())


def court_count_from_area(props: dict) -> str:
    """
    LIPAS type 1330 has no explicit 'courts-count' property.
    Derive an approximate count from field dimensions if available:
      • one full-size BV court ≈ 16 × 8 m (128 m²) + safety zone
      • one full-size BV field ≈ 24 × 16 m ≈ 384 m²
    If area is given, estimate n = max(1, floor(area / 384)).
    Falls back to "1" — every type-1330 entry is at least one court.
    """
    length = props.get("field-length-m", 0) or 0
    width  = props.get("field-width-m",  0) or 0
    area   = props.get("area-m2", 0) or 0

    # If length x width suggests a single standard court, return "1"
    if length and width:
        # A full court is 16x8 m playing area + buffer = roughly 24x16 m total
        if length <= 30 and width <= 20:
            return "1"
        n = max(1, round((length * width) / 384))
        return str(n)
    if area:
        n = max(1, round(area / 384))
        return str(n)
    return "1"  # type 1330 = beach volleyball court → minimum 1 court per entry


def surface_label(props: dict) -> str:
    mats = props.get("surface-material") or []
    return ", ".join(SURFACE_LABELS.get(m, m) for m in mats)


def to_row(item: dict) -> dict:
    props  = item.get("properties", {})
    loc    = item.get("location", {})
    geom   = loc.get("geometries", {}).get("features", [])
    coords = geom[0]["geometry"]["coordinates"] if geom else [None, None]
    lng, lat = coords[0], coords[1]

    postal    = loc.get("postal-office", "")
    town      = postal

    address   = loc.get("address", "")
    postal_code = loc.get("postal-code", "")
    full_addr = ", ".join(filter(None, [address, f"{postal_code} {postal}".strip()]))

    source_url = item.get("www", "") or ""

    return {
        "country":          "FINLAND",
        "facility_name":    item.get("name", ""),
        "town":             town,
        "address":          full_addr,
        "latitude":         f"{lat:.6f}" if lat is not None else "",
        "longitude":        f"{lng:.6f}" if lng is not None else "",
        "coord_precision":  "address",
        "outdoor_courts":   court_count_from_area(props),
        "surface":          surface_label(props),
        "lighting":         "yes" if props.get("ligthing?") else "",
        "free_use":         "yes" if props.get("free-use?") else "",
        "access":           "school" if props.get("school-use?") else "public",
        "owner":            item.get("owner", ""),
        "lipas_id":         str(item.get("lipas-id", "")),
        "source_url":       source_url,
        "data_cutoff":      DATA_CUTOFF,
        "fact_check_notes": f"LIPAS id {item.get('lipas-id')}; type 1330; status {item.get('status')}",
    }


def merge_nearby(rows: list[dict], threshold: float = 0.00035) -> list[dict]:
    """
    Merge court entries within `threshold` degrees of each other
    (~22 m at Finnish latitudes) into a single row, summing court counts.

    LIPAS often models each physical court in a multi-court complex as a
    separate point entry (e.g. "Kupittaan kenttä 1", "Kupittaan kenttä 2")
    with coordinates separated by only 10–30 m.  Merging them gives a single,
    correctly-counted marker on the map.

    Uses Union-Find (connected components) so that A–B and B–C chain together
    even if A and C are farther apart than the threshold.
    """
    import re

    n = len(rows)
    parent = list(range(n))
    rank   = [0] * n

    def find(i: int) -> int:
        while parent[i] != i:
            parent[i] = parent[parent[i]]
            i = parent[i]
        return i

    def union(i: int, j: int) -> None:
        ri, rj = find(i), find(j)
        if ri == rj:
            return
        if rank[ri] < rank[rj]:
            ri, rj = rj, ri
        parent[rj] = ri
        if rank[ri] == rank[rj]:
            rank[ri] += 1

    # Parse coordinates once
    lats = [float(r["latitude"]  or 0) for r in rows]
    lngs = [float(r["longitude"] or 0) for r in rows]

    # Sort indices by latitude for a cheap sweep-line optimisation.
    # Use Euclidean distance in degrees so diagonal courts also connect.
    order = sorted(range(n), key=lambda i: lats[i])
    for oi, i in enumerate(order):
        for oj in range(oi + 1, n):
            j = order[oj]
            if lats[j] - lats[i] > threshold:
                break
            dlat = lats[j] - lats[i]
            dlng = lngs[j] - lngs[i]
            if (dlat * dlat + dlng * dlng) ** 0.5 <= threshold:
                union(i, j)

    # Collect connected components
    groups: dict[int, list[int]] = {}
    for i in range(n):
        root = find(i)
        groups.setdefault(root, []).append(i)

    merged: list[dict] = []
    n_merged = 0
    for indices in groups.values():
        if len(indices) == 1:
            merged.append(rows[indices[0]])
            continue

        n_merged += 1
        group = [rows[i] for i in sorted(indices, key=lambda i: rows[i].get("facility_name", ""))]

        base = dict(group[0])
        total = sum(int(r["outdoor_courts"]) for r in group if r["outdoor_courts"])
        base["outdoor_courts"] = str(total) if total else "1"

        # Use average coordinates as the representative point
        base["latitude"]  = f"{sum(float(r['latitude'])  for r in group) / len(group):.6f}"
        base["longitude"] = f"{sum(float(r['longitude']) for r in group) / len(group):.6f}"

        # Strip trailing court index from the name to get the complex name
        # e.g. "Kupittaan kenttä 1" → "Kupittaan kenttä"
        raw_names = [r["facility_name"] for r in group]
        clean = [re.sub(r"[\s\-]+\d+\s*$", "", nm).strip() for nm in raw_names]
        # Find the longest common prefix of the cleaned names
        common = clean[0]
        for nm in clean[1:]:
            while common and not nm.startswith(common):
                common = common[:-1].rstrip(" \t-")
        base["facility_name"] = common.strip() or group[0]["facility_name"]

        lipas_ids = ", ".join(r["lipas_id"] for r in group)
        base["lipas_id"] = lipas_ids
        base["fact_check_notes"] = (
            f"Merged {len(group)} LIPAS entries (ids: {lipas_ids}); "
            + base.get("fact_check_notes", "")
        )
        merged.append(base)

    print(f"  Merged {n_merged} co-located groups ({n} → {len(merged)} entries).", flush=True)
    return merged


def load_overrides() -> dict[str, dict]:
    if not OVERRIDE_CSV.exists():
        return {}
    overrides: dict[str, dict] = {}
    with OVERRIDE_CSV.open(newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            lid = row.get("lipas_id", "").strip()
            if lid:
                overrides[lid] = row
            else:
                # Extra venue without a lipas_id: use facility_name as key
                overrides[f"__extra__{row.get('facility_name','')}"] = row
    return overrides


def main() -> None:
    global CITY_NAMES

    print("Fetching LIPAS beach volleyball courts (type 1330)…", flush=True)
    first = fetch_page(1)
    pagination = first["pagination"]
    total_pages = pagination["total-pages"]
    total_items = pagination["total-items"]
    print(f"  {total_items} active courts across {total_pages} pages", flush=True)

    items = list(first["items"])
    for page in range(2, total_pages + 1):
        time.sleep(0.15)           # be polite to the API
        result = fetch_page(page)
        items.extend(result["items"])
        if page % 5 == 0:
            print(f"  fetched {len(items)}/{total_items}…", flush=True)

    print(f"  fetched {len(items)} total, converting…", flush=True)

    # Filter to loose-sand courts only, then deduplicate by lipas-id.
    seen: set[int] = set()
    rows: list[dict] = []
    skipped_hard = 0
    for item in items:
        lid = item.get("lipas-id")
        if lid in seen:
            continue
        seen.add(lid)
        if not is_sand_court(item.get("properties", {})):
            skipped_hard += 1
            continue
        try:
            rows.append(to_row(item))
        except Exception as exc:
            print(f"  Warning: skipping lipas-id {lid}: {exc}", flush=True)
    if skipped_hard:
        print(f"  Excluded {skipped_hard} hard-surface or non-sand court(s).", flush=True)

    # Merge co-located entries (LIPAS models each physical court separately)
    rows = merge_nearby(rows)

    # Apply overrides
    overrides = load_overrides()
    if overrides:
        print(f"Applying {len(overrides)} override(s)…", flush=True)
    extra_rows: list[dict] = []
    for i, row in enumerate(rows):
        lid = row.get("lipas_id", "")
        if lid in overrides:
            rows[i] = overrides.pop(lid)
    # Append extra rows (no lipas_id match)
    for key, row in overrides.items():
        if key.startswith("__extra__"):
            extra_rows.append(row)
    rows.extend(extra_rows)

    # Sort by town then name for stable diffs
    rows.sort(key=lambda r: (r.get("town", ""), r.get("facility_name", "")))

    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    with OUT_CSV.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=HEADERS)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Wrote {len(rows)} rows to {OUT_CSV}", flush=True)


if __name__ == "__main__":
    main()
